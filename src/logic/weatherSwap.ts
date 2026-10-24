// Rainy or windy stop: nearby places that suit the weather better at the same time (pure).

import type { Place } from '@/data/types'
import { estimateWalkM } from './geo'
import { isOpenDuring } from './hours'
import type { IsoDate } from './time'
import { entryPoint, type TimelineStop } from './timeline'
import type { Fit } from './weatherFit'

export interface Swap {
  place: Place
  metres: number
  fit: Fit
}

/** How much better (weather-fit score) a swap must be to be worth suggesting. */
const MIN_GAIN = 3

/**
 * Places to visit instead of `stop` in the same time slot: not planned yet, open for their
 * whole visit, within `maxMetres` of the stop, clearly better for the forecast and not bad
 * in itself (a wet square is no swap for a windy pier).
 * Ranked by fit, rating and distance.
 */
export function swapsFor(
  stop: TimelineStop,
  date: IsoDate,
  candidates: Place[],
  exclude: ReadonlySet<string>,
  fit: (p: Place, from: number, to: number) => Fit | null,
  o: { max?: number; maxMetres?: number } = {},
): Swap[] {
  const here = fit(stop.place, stop.arrive, stop.leave)
  if (!here) return []
  const from = entryPoint(stop.place)
  const out: (Swap & { rank: number })[] = []
  for (const p of candidates) {
    if (exclude.has(p.id) || p.id === stop.place.id) continue
    if (p.kind === 'day-trip' || p.kind === 'food-market' || p.kind === 'street-walk') continue
    const metres = estimateWalkM(from, entryPoint(p))
    if (metres > (o.maxMetres ?? 1500)) continue
    const leave = stop.arrive + p.durationMin
    if (!isOpenDuring(p.openingHours, date, stop.arrive, leave)) continue
    const f = fit(p, stop.arrive, leave)
    if (!f || f.score < 0 || f.score < here.score + MIN_GAIN) continue
    out.push({ place: p, metres, fit: f, rank: f.score + p.myRating + (p.mustSee ? 2 : 0) - metres / 500 })
  }
  return out
    .sort((a, b) => b.rank - a.rank)
    .slice(0, o.max ?? 2)
    .map(({ place, metres, fit: f }) => ({ place, metres, fit: f }))
}
