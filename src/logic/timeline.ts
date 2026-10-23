// Day timeline: start time + legs + visits → arrival/leave times and warnings. Pure.

import type { LatLng, Place } from '@/data/types'
import type { DayPlan, LegMode } from '@/state/tripTypes'
import { CITY_CENTRE, estimateWalkM, pathM, walkMinutes } from './geo'
import { sunTimes } from './sun'
import { isOpenDuring, hoursOn } from './hours'
import { type IsoDate, toMinutes } from './time'

export interface Leg {
  from: LatLng
  to: LatLng
  mode: LegMode
  metres: number
  minutes: number
  /** false once a real route (Valhalla) has replaced the straight-line guess. */
  estimated: boolean
}

export interface TimelineStop {
  place: Place
  stopId: string
  leg: Leg | null
  arrive: number
  leave: number
}

export type Warning =
  | { kind: 'closed'; stopId: string }
  /** A daylight-only stop that is still going on after sunset. */
  | { kind: 'dark'; stopId: string }
  | { kind: 'too-long'; hours: number }
  | { kind: 'too-far'; km: number }

export interface Timeline {
  stops: TimelineStop[]
  /** Leg from the last stop back to the home base, if one is set. */
  homeLeg: Leg | null
  walkM: number
  end: number
  /** Minutes since midnight, Copenhagen time; null only in polar day/night. */
  sunset: number | null
  warnings: Warning[]
}

/** Street walks are entered at their first waypoint and left at the last. */
export const entryPoint = (p: Place): LatLng => p.waypoints?.[0] ?? p.coords
export const exitPoint = (p: Place): LatLng => p.waypoints?.[p.waypoints.length - 1] ?? p.coords

/** Key for the routed path of a street walk in `TimelineOptions.routes`. */
export const walkKey = (placeId: string): string => `walk:${placeId}`

/** Walking distance inside a street walk: routed if known, else the waypoint path plus a bit. */
export function innerWalkM(p: Place, routes?: TimelineOptions['routes']): number {
  if (!p.waypoints) return 0
  return routes?.get(walkKey(p.id))?.metres ?? pathM(p.waypoints) * 1.15
}

/** Rough door-to-door time for a public-transport leg: waiting + walking to stops + riding. */
export function transitMinutes(metres: number): number {
  return Math.round(12 + (metres / 1000) * 1.6)
}

export function estimateLeg(from: LatLng, to: LatLng, mode: LegMode, speedKmh: number): Leg {
  const metres = estimateWalkM(from, to)
  const minutes = mode === 'walk' ? walkMinutes(metres, speedKmh) : transitMinutes(metres)
  return { from, to, mode, metres, minutes, estimated: true }
}

/** Walk, or transport when the leg from the previous stop (or home) is longer than the threshold. */
export function suggestLegMode(prev: Place | null, home: LatLng | null, next: Place, thresholdKm: number): LegMode {
  const from = prev ? exitPoint(prev) : home
  if (!from) return 'walk'
  return estimateWalkM(from, entryPoint(next)) / 1000 > thresholdKm ? 'transit' : 'walk'
}

export interface TimelineOptions {
  date: IsoDate
  speedKmh: number
  origin: LatLng | null
  maxDayHours: number
  maxDayKm: number
  /** Legs longer than this are suggested as public transport. */
  transitThresholdKm: number
  /** Real routes by `legKey` (legs) or `walkKey` (inside street walks), used instead of estimates. */
  routes?: ReadonlyMap<string, { metres: number; minutes: number }>
}

export const legKey = (a: LatLng, b: LatLng): string =>
  `${a.lat.toFixed(5)},${a.lng.toFixed(5)}>${b.lat.toFixed(5)},${b.lng.toFixed(5)}`

function makeLeg(from: LatLng, to: LatLng, mode: LegMode, o: TimelineOptions): Leg {
  const known = mode === 'walk' ? o.routes?.get(legKey(from, to)) : undefined
  if (known) return { from, to, mode, ...known, estimated: false }
  return estimateLeg(from, to, mode, o.speedKmh)
}

export function buildTimeline(day: DayPlan, lookup: (id: string) => Place | undefined, o: TimelineOptions): Timeline {
  const startMin = toMinutes(day.startTime)
  let t = startMin
  let walkM = 0
  let prev: LatLng | null = o.origin
  const stops: TimelineStop[] = []
  const warnings: Warning[] = []
  const sunset = sunTimes(o.date, o.origin ?? CITY_CENTRE)?.sunset ?? null

  for (const s of day.stops) {
    const place = lookup(s.placeId)
    if (!place) continue
    let leg: Leg | null = null
    if (prev) {
      leg = makeLeg(prev, entryPoint(place), s.legMode, o)
      t += leg.minutes
      if (leg.mode === 'walk') walkM += leg.metres
    }
    const arrive = t
    const leave = arrive + (s.visitMin ?? place.durationMin)
    walkM += innerWalkM(place, o.routes)
    if (hoursOn(place.openingHours, o.date) !== 'always' && !isOpenDuring(place.openingHours, o.date, arrive, leave)) {
      warnings.push({ kind: 'closed', stopId: s.id })
    }
    if (sunset !== null && place.bestTime.includes('daylight-only') && leave > sunset) {
      warnings.push({ kind: 'dark', stopId: s.id })
    }
    stops.push({ place, stopId: s.id, leg, arrive, leave })
    t = leave
    prev = exitPoint(place)
  }

  let homeLeg: Leg | null = null
  if (o.origin && prev && stops.length) {
    const metres = estimateWalkM(prev, o.origin)
    homeLeg = makeLeg(prev, o.origin, metres / 1000 > o.transitThresholdKm ? 'transit' : 'walk', o)
    t += homeLeg.minutes
    if (homeLeg.mode === 'walk') walkM += homeLeg.metres
  }

  const hours = (t - startMin) / 60
  if (stops.length && hours > o.maxDayHours) warnings.push({ kind: 'too-long', hours })
  if (walkM / 1000 > o.maxDayKm) warnings.push({ kind: 'too-far', km: walkM / 1000 })

  return { stops, homeLeg, walkM, end: t, sunset, warnings }
}
