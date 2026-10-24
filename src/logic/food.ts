// Lunch: when a day needs a food stop, and which food places are close (pure).

import type { LatLng, Place } from '@/data/types'
import { estimateWalkM, walkMinutes } from './geo'
import { isOpenDuring } from './hours'
import type { IsoDate } from './time'
import { entryPoint, exitPoint, type Timeline } from './timeline'

export const LUNCH_FROM = 11 * 60 + 30
export const LUNCH_TO = 13 * 60 + 30
/** A stop ending this late still gets a (late) lunch hint after it. */
const LATE_LUNCH = 15 * 60

export const isFood = (p: Place): boolean => p.kind === 'food-market'

/**
 * Index of the stop after which the day breaks for lunch, or null when the day already
 * has a food stop or no stop ends around lunchtime.
 */
export function lunchAfter(tl: Timeline): number | null {
  if (tl.stops.some((s) => isFood(s.place))) return null
  const i = tl.stops.findIndex((s) => s.leave >= LUNCH_FROM)
  if (i < 0 || tl.stops[i].leave > LATE_LUNCH) return null
  return i
}

export interface NearbyFood {
  place: Place
  metres: number
}

/** The closest food places from `from`, open for a whole visit when walking over at `at`. */
export function foodNear(
  from: LatLng,
  date: IsoDate,
  at: number,
  candidates: Place[],
  o: { speedKmh: number; max?: number; maxMetres?: number; exclude?: ReadonlySet<string> },
): NearbyFood[] {
  const out: NearbyFood[] = []
  for (const p of candidates) {
    if (!isFood(p) || o.exclude?.has(p.id)) continue
    const metres = estimateWalkM(from, entryPoint(p))
    if (metres > (o.maxMetres ?? 1500)) continue
    const arrive = at + walkMinutes(metres, o.speedKmh)
    if (!isOpenDuring(p.openingHours, date, arrive, arrive + p.durationMin)) continue
    out.push({ place: p, metres })
  }
  return out.sort((a, b) => a.metres - b.metres).slice(0, o.max ?? 3)
}

/** Lunch options after the stop `lunchAfter` picked. */
export function lunchOptions(tl: Timeline, date: IsoDate, candidates: Place[], speedKmh: number): { after: number; options: NearbyFood[] } | null {
  const after = lunchAfter(tl)
  if (after === null) return null
  const s = tl.stops[after]
  const options = foodNear(exitPoint(s.place), date, s.leave, candidates, { speedKmh })
  return options.length ? { after, options } : null
}
