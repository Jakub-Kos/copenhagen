import { useMemo } from 'react'
import { placeById } from '@/data/places'
import { walkShape } from '@/data/walks'
import type { Place } from '@/data/types'
import { useT } from '@/i18n/useT'
import { type Leg, type Timeline, type TimelineOptions, buildTimeline, legKey, routeSpecs, transitSpecs, walkKey } from '@/logic/timeline'
import type { TransitEntry } from '@/state/transitStore'
import { useTransit } from './useTransit'
import type { IsoDate } from '@/logic/time'
import type { RouteEntry } from '@/state/routeStore'
import { dayOf } from '@/state/tripOps'
import type { DayPlan, Trip } from '@/state/tripTypes'
import type { MapLine } from './MapView'
import { fitFor } from '@/logic/weatherFit'
import { useForecast } from './useForecast'
import { useRoutes } from './useRoutes'

export interface RoutedTimeline {
  tl: Timeline
  legRoute: (leg: Leg) => RouteEntry | undefined
  walkRoute: (place: Place) => RouteEntry | undefined
  /** The public-transport journey for a transit leg, when looked up. */
  legTransit: (leg: Leg) => TransitEntry | undefined
  lines: MapLine[]
}

const lookup = (id: string) => placeById.get(id)

/**
 * Timeline with walking legs and street walks replaced by real Valhalla routes, and transit
 * legs by real Transitous journeys, as they arrive.
 */
export function useRoutedTimeline(day: DayPlan, o: Omit<TimelineOptions, 'routes' | 'transit'>): RoutedTimeline {
  const { lang } = useT()
  const estimate = useMemo(() => buildTimeline(day, lookup, o), [day, o])

  const specs = useMemo(() => routeSpecs(estimate), [estimate])

  const entries = useRoutes(specs, o.speedKmh, lang)
  // Departures come from the estimate, so a journey's own duration can't feed back into its query.
  const tSpecs = useMemo(() => transitSpecs(estimate), [estimate])
  const rides = useTransit(tSpecs, o.date)

  return useMemo(() => {
    const routes = new Map<string, { metres: number; minutes: number }>()
    for (const [id, e] of entries) {
      if (e.status === 'ok') routes.set(id, { metres: e.route.metres, minutes: e.route.seconds / 60 })
    }
    const transit = new Map<string, { minutes: number; walkMetres: number }>()
    for (const [id, e] of rides) {
      if (e.status === 'ok') transit.set(id, { minutes: e.plan.minutes, walkMetres: e.plan.walkMetres })
    }
    const tl = routes.size || transit.size ? buildTimeline(day, lookup, { ...o, routes, transit }) : estimate
    const legRoute = (leg: Leg) => (leg.mode === 'walk' ? entries.get(legKey(leg.from, leg.to)) : undefined)
    const legTransit = (leg: Leg) => (leg.mode === 'transit' ? rides.get(legKey(leg.from, leg.to)) : undefined)
    const walkRoute = (p: Place) => entries.get(walkKey(p.id))

    const lines: MapLine[] = []
    const addLeg = (id: string, leg: Leg) => {
      const e = legRoute(leg)
      const ride = legTransit(leg)
      if (ride?.status === 'ok') {
        // Rides in the line's colour along the real route; the walks to and from stops dotted.
        ride.plan.legs.forEach((l, i) =>
          lines.push(
            l.mode === 'walk'
              ? { id: `${id}-${i}`, coords: l.shape, style: 'estimate' }
              : { id: `${id}-${i}`, coords: l.shape, style: 'ride', color: l.color },
          ),
        )
      } else if (e?.status === 'ok') lines.push({ id, coords: e.route.shape, style: 'route' })
      else lines.push({ id, coords: [leg.from, leg.to], style: leg.mode === 'walk' ? 'estimate' : 'transit' })
    }
    for (const s of tl.stops) {
      if (s.leg) addLeg(`${s.stopId}-leg`, s.leg)
      if (s.place.waypoints) {
        const e = walkRoute(s.place)
        lines.push({
          id: `${s.stopId}-walk`,
          coords: e?.status === 'ok' ? e.route.shape : (walkShape(s.place.id) ?? s.place.waypoints),
          style: e?.status === 'ok' || walkShape(s.place.id) ? 'route' : 'estimate',
        })
      }
    }
    if (tl.homeLeg) addLeg('home', tl.homeLeg)
    return { tl, legRoute, walkRoute, legTransit, lines }
  }, [entries, rides, estimate, day, o])
}

export function useTimeline(trip: Trip, date: IsoDate): RoutedTimeline {
  const day = dayOf(trip, date)
  const { forecast } = useForecast()
  const o = useMemo(
    () => ({
      weatherFor: forecast ? (p: Place, from: number, to: number) => fitFor(p, forecast, date, from, to) : undefined,
      date,
      speedKmh: trip.walkingSpeedKmh,
      origin: trip.homeBase?.coords ?? null,
      maxDayHours: trip.maxDayHours,
      maxDayKm: trip.maxDayKm,
      transitThresholdKm: trip.transitThresholdKm,
    }),
    [forecast, date, trip.walkingSpeedKmh, trip.homeBase, trip.maxDayHours, trip.maxDayKm, trip.transitThresholdKm],
  )
  return useRoutedTimeline(day, o)
}
