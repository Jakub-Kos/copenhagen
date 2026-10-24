// "Suggest a day": greedily fills the rest of a day with unplanned places. Pure.
//
// Each step picks the best-scoring place that still fits: open for the whole visit,
// finished before sunset if it needs daylight, and within the day's time and walking
// limits including the way home. Distance is penalised, which keeps the day clustered.

import type { LatLng, Place } from '@/data/types'
import type { DayPlan, LegMode } from '@/state/tripTypes'
import { CITY_CENTRE, estimateWalkM, walkMinutes } from './geo'
import { LUNCH_FROM, LUNCH_TO } from './food'
import { hoursOn, isOpenDuring } from './hours'
import { buildTimeline, entryPoint, exitPoint, innerWalkM, transitMinutes } from './timeline'
import type { IsoDate } from './time'
import { toMinutes } from './time'

export interface SuggestInput {
  date: IsoDate
  day: DayPlan
  candidates: Place[]
  /** Places already planned on any day of the trip; never suggested again. */
  planned: ReadonlySet<string>
  origin: LatLng | null
  speedKmh: number
  maxDayHours: number
  maxDayKm: number
  transitThresholdKm: number
  maxNewStops?: number
  /** Extra score for a visit [start, end] on this date (phase 4: weather). */
  extraScore?: (p: Place, start: number, end: number) => number
}

export interface Suggestion {
  placeId: string
  legMode: LegMode
}

const KM_PENALTY = 2

export function suggestDay(i: SuggestInput): Suggestion[] {
  const lookup = new Map(i.candidates.map((p) => [p.id, p]))
  const tl = buildTimeline(i.day, (id) => lookup.get(id), {
    date: i.date,
    speedKmh: i.speedKmh,
    origin: i.origin,
    maxDayHours: i.maxDayHours,
    maxDayKm: i.maxDayKm,
    transitThresholdKm: i.transitThresholdKm,
  })
  const dayStart = toMinutes(i.day.startTime)
  const dayEnd = dayStart + i.maxDayHours * 60
  const maxWalkM = i.maxDayKm * 1000
  const sunset = tl.sunset ?? 24 * 60

  const last = tl.stops.at(-1)
  let pos: LatLng = last ? exitPoint(last.place) : (i.origin ?? CITY_CENTRE)
  let t = last ? last.leave : dayStart
  // Walking so far, without the way home (that is added per candidate below).
  let walkM = tl.walkM - (tl.homeLeg?.mode === 'walk' ? tl.homeLeg.metres : 0)

  const used = new Set([...i.planned, ...i.day.stops.map((s) => s.placeId)])
  let foodStops = tl.stops.filter((s) => s.place.kind === 'food-market').length
  const out: Suggestion[] = []

  while (out.length < (i.maxNewStops ?? 6)) {
    let best: { p: Place; score: number; mode: LegMode; legM: number; leave: number } | null = null

    for (const p of i.candidates) {
      if (used.has(p.id) || p.kind === 'day-trip') continue
      if (p.kind === 'food-market' && foodStops > 0) continue
      if (hoursOn(p.openingHours, i.date) === null) continue

      const legM = estimateWalkM(pos, entryPoint(p))
      const mode: LegMode = legM / 1000 > i.transitThresholdKm ? 'transit' : 'walk'
      const arrive = t + (mode === 'walk' ? walkMinutes(legM, i.speedKmh) : transitMinutes(legM))
      const leave = arrive + p.durationMin

      if (!isOpenDuring(p.openingHours, i.date, arrive, leave)) continue
      if (p.bestTime.includes('daylight-only') && leave > sunset) continue

      const homeM = i.origin ? estimateWalkM(exitPoint(p), i.origin) : 0
      const homeIsWalk = homeM / 1000 <= i.transitThresholdKm
      const homeMin = !i.origin ? 0 : homeIsWalk ? walkMinutes(homeM, i.speedKmh) : transitMinutes(homeM)
      if (leave + homeMin > dayEnd) continue
      const newWalkM = walkM + (mode === 'walk' ? legM : 0) + innerWalkM(p) + (homeIsWalk ? homeM : 0)
      if (newWalkM > maxWalkM) continue

      let score = p.myRating * 2 + (p.mustSee ? 4 : 0) - (legM / 1000) * KM_PENALTY
      // While it is light, prefer the places that need daylight.
      if (p.bestTime.includes('daylight-only') && arrive < sunset - 120) score += 1.5
      if (p.bestTime.includes('evening') && arrive >= sunset) score += 1.5
      // One food stop, only around lunchtime.
      if (p.kind === 'food-market') {
        if (arrive < LUNCH_FROM || arrive > LUNCH_TO) continue
        score += 8
      }
      score += i.extraScore?.(p, arrive, leave) ?? 0

      if (!best || score > best.score) best = { p, score, mode, legM, leave }
    }

    if (!best) break
    out.push({ placeId: best.p.id, legMode: best.mode })
    used.add(best.p.id)
    if (best.p.kind === 'food-market') foodStops++
    walkM += (best.mode === 'walk' ? best.legM : 0) + innerWalkM(best.p)
    pos = exitPoint(best.p)
    t = best.leave
  }
  return out
}
