import { useMemo } from 'react'
import { placeById } from '@/data/places'
import type { Place } from '@/data/types'
import { useT } from '@/i18n/useT'
import { type Leg, type Timeline, type TimelineOptions, buildTimeline, legKey, walkKey } from '@/logic/timeline'
import type { IsoDate } from '@/logic/time'
import type { RouteEntry } from '@/state/routeStore'
import { dayOf } from '@/state/tripOps'
import type { DayPlan, Trip } from '@/state/tripTypes'
import type { MapLine } from './MapView'
import { type RouteSpec, useRoutes } from './useRoutes'

export interface RoutedTimeline {
  tl: Timeline
  legRoute: (leg: Leg) => RouteEntry | undefined
  walkRoute: (place: Place) => RouteEntry | undefined
  lines: MapLine[]
}

const lookup = (id: string) => placeById.get(id)

/** Timeline with walking legs and street walks replaced by real Valhalla routes as they arrive. */
export function useRoutedTimeline(day: DayPlan, o: Omit<TimelineOptions, 'routes'>): RoutedTimeline {
  const { lang } = useT()
  const estimate = useMemo(() => buildTimeline(day, lookup, o), [day, o])

  const specs = useMemo<RouteSpec[]>(() => {
    const out: RouteSpec[] = []
    const legs = [...estimate.stops.map((s) => s.leg), estimate.homeLeg]
    for (const leg of legs) {
      if (leg?.mode === 'walk') out.push({ id: legKey(leg.from, leg.to), points: [leg.from, leg.to] })
    }
    for (const s of estimate.stops) {
      const wp = s.place.waypoints
      if (wp && !out.some((x) => x.id === walkKey(s.place.id))) {
        out.push({
          id: walkKey(s.place.id),
          points: wp.map((p, i) => ({ ...p, through: i > 0 && i < wp.length - 1 })),
        })
      }
    }
    return out
  }, [estimate])

  const entries = useRoutes(specs, o.speedKmh, lang)

  return useMemo(() => {
    const routes = new Map<string, { metres: number; minutes: number }>()
    for (const [id, e] of entries) {
      if (e.status === 'ok') routes.set(id, { metres: e.route.metres, minutes: e.route.seconds / 60 })
    }
    const tl = routes.size ? buildTimeline(day, lookup, { ...o, routes }) : estimate
    const legRoute = (leg: Leg) => (leg.mode === 'walk' ? entries.get(legKey(leg.from, leg.to)) : undefined)
    const walkRoute = (p: Place) => entries.get(walkKey(p.id))

    const lines: MapLine[] = []
    const addLeg = (id: string, leg: Leg) => {
      const e = legRoute(leg)
      if (e?.status === 'ok') lines.push({ id, coords: e.route.shape, style: 'route' })
      else lines.push({ id, coords: [leg.from, leg.to], style: leg.mode === 'walk' ? 'estimate' : 'transit' })
    }
    for (const s of tl.stops) {
      if (s.leg) addLeg(`${s.stopId}-leg`, s.leg)
      if (s.place.waypoints) {
        const e = walkRoute(s.place)
        lines.push({
          id: `${s.stopId}-walk`,
          coords: e?.status === 'ok' ? e.route.shape : s.place.waypoints,
          style: e?.status === 'ok' ? 'route' : 'estimate',
        })
      }
    }
    if (tl.homeLeg) addLeg('home', tl.homeLeg)
    return { tl, legRoute, walkRoute, lines }
  }, [entries, estimate, day, o])
}

export function useTimeline(trip: Trip, date: IsoDate): RoutedTimeline {
  const day = dayOf(trip, date)
  const o = useMemo(
    () => ({
      date,
      speedKmh: trip.walkingSpeedKmh,
      origin: trip.homeBase?.coords ?? null,
      maxDayHours: trip.maxDayHours,
      maxDayKm: trip.maxDayKm,
      transitThresholdKm: trip.transitThresholdKm,
    }),
    [date, trip.walkingSpeedKmh, trip.homeBase, trip.maxDayHours, trip.maxDayKm, trip.transitThresholdKm],
  )
  return useRoutedTimeline(day, o)
}
