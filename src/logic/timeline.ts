// Day timeline: start time + legs + visits → arrival/leave times and warnings. Pure.

import type { LatLng, Place } from '@/data/types'
import { walkMetres } from '@/data/walks'
import type { DayPlan, LegMode } from '@/state/tripTypes'
import { CITY_CENTRE, estimateWalkM, pathM, walkMinutes } from './geo'
import { sunTimes } from './sun'
import type { Fit } from './weatherFit'
import { isOpenDuring, hoursOn } from './hours'
import { type IsoDate, toMinutes } from './time'

export interface Leg {
  from: LatLng
  to: LatLng
  mode: LegMode
  metres: number
  minutes: number
  /** false once a real route (Valhalla, or a Transitous journey) has replaced the guess. */
  estimated: boolean
  /** Walking within a public-transport journey (to and from the stops), when known. */
  walkMetres?: number
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
  /** Outdoor stop while rain is forecast. */
  | { kind: 'rain'; stopId: string }
  /** Wind-sensitive stop (towers, boats, harbour) while it's windy. */
  | { kind: 'wind'; stopId: string }
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

/** Walking distance inside a street walk: live route, else the pre-routed length, else the waypoint path plus a bit. */
export function innerWalkM(p: Place, routes?: TimelineOptions['routes']): number {
  if (!p.waypoints) return 0
  return routes?.get(walkKey(p.id))?.metres ?? walkMetres(p.id) ?? pathM(p.waypoints) * 1.15
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
  /** Weather fit of a visit window, when a forecast covers it (phase 4). */
  weatherFor?: (p: Place, from: number, to: number) => Fit | null
  /** Real routes by `legKey` (legs) or `walkKey` (inside street walks), used instead of estimates. */
  routes?: ReadonlyMap<string, { metres: number; minutes: number }>
  /** Real public-transport journeys by `legKey`: door-to-door minutes and the walking in them. */
  transit?: ReadonlyMap<string, { minutes: number; walkMetres: number }>
}

export const legKey = (a: LatLng, b: LatLng): string =>
  `${a.lat.toFixed(5)},${a.lng.toFixed(5)}>${b.lat.toFixed(5)},${b.lng.toFixed(5)}`

function makeLeg(from: LatLng, to: LatLng, mode: LegMode, o: TimelineOptions): Leg {
  if (mode === 'transit') {
    const ride = o.transit?.get(legKey(from, to))
    const est = estimateLeg(from, to, mode, o.speedKmh)
    return ride ? { ...est, minutes: ride.minutes, walkMetres: ride.walkMetres, estimated: false } : est
  }
  const known = o.routes?.get(legKey(from, to))
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
      walkM += leg.mode === 'walk' ? leg.metres : (leg.walkMetres ?? 0)
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
    const wx = o.weatherFor?.(place, arrive, leave)
    if (wx?.wet && place.weather === 'outdoor') warnings.push({ kind: 'rain', stopId: s.id })
    if (wx?.windy && place.windSensitive) warnings.push({ kind: 'wind', stopId: s.id })
    stops.push({ place, stopId: s.id, leg, arrive, leave })
    t = leave
    prev = exitPoint(place)
  }

  let homeLeg: Leg | null = null
  if (o.origin && prev && stops.length) {
    const metres = estimateWalkM(prev, o.origin)
    homeLeg = makeLeg(prev, o.origin, metres / 1000 > o.transitThresholdKm ? 'transit' : 'walk', o)
    t += homeLeg.minutes
    walkM += homeLeg.mode === 'walk' ? homeLeg.metres : (homeLeg.walkMetres ?? 0)
  }

  const hours = (t - startMin) / 60
  if (stops.length && hours > o.maxDayHours) warnings.push({ kind: 'too-long', hours })
  if (walkM / 1000 > o.maxDayKm) warnings.push({ kind: 'too-far', km: walkM / 1000 })

  return { stops, homeLeg, walkM, end: t, sunset, warnings }
}

/** A walking route to request: legs between stops, and street walks through their waypoints. */
export interface RouteSpec {
  id: string
  /** `through` points shape the line without becoming stops. */
  points: (LatLng & { through?: boolean })[]
}

/** The walking routes a timeline needs; ids match `legKey` / `walkKey`. */
export function routeSpecs(tl: Timeline): RouteSpec[] {
  const out: RouteSpec[] = []
  for (const leg of [...tl.stops.map((s) => s.leg), tl.homeLeg]) {
    if (leg?.mode === 'walk') out.push({ id: legKey(leg.from, leg.to), points: [leg.from, leg.to] })
  }
  for (const s of tl.stops) {
    const wp = s.place.waypoints
    if (wp && !out.some((x) => x.id === walkKey(s.place.id))) {
      out.push({ id: walkKey(s.place.id), points: wp.map((p, i) => ({ ...p, through: i > 0 && i < wp.length - 1 })) })
    }
  }
  return out
}

/** A public-transport leg to look up: from, to and the planned departure (minutes). */
export interface TransitSpec {
  id: string
  from: LatLng
  to: LatLng
  depart: number
}

/** The transit legs of a timeline with their planned departures; ids match `legKey`. */
export function transitSpecs(tl: Timeline): TransitSpec[] {
  const out: TransitSpec[] = []
  for (const s of tl.stops) {
    if (s.leg?.mode === 'transit') out.push({ id: legKey(s.leg.from, s.leg.to), from: s.leg.from, to: s.leg.to, depart: s.arrive - s.leg.minutes })
  }
  const last = tl.stops.at(-1)
  if (tl.homeLeg?.mode === 'transit' && last) {
    out.push({ id: legKey(tl.homeLeg.from, tl.homeLeg.to), from: tl.homeLeg.from, to: tl.homeLeg.to, depart: last.leave })
  }
  return out
}
