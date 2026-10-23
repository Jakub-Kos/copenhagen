// How well a place suits the forecast. Pure; works on a Forecast from services/weather.

import type { Place } from '@/data/types'
import type { Forecast, HourWx } from '@/services/weather'
import type { IsoDate } from './time'

export interface Conditions {
  /** Highest hourly rain probability in the window (null if unknown for all hours). */
  rainProb: number | null
  rainMm: number
  wind: number
  gust: number
  feelsMin: number
}

export interface Fit {
  score: number
  wet: boolean
  showery: boolean
  windy: boolean
}

// Thresholds (m/s, mm, %).
const WET_PROB = 60
const WET_MM = 1
const SHOWER_PROB = 35
const SHOWER_MM = 0.2
const WINDY_GUST = 15
const WINDY_WIND = 9
const STORM_GUST = 20

/** Daytime core used for whole-day hints. */
const DAY_FROM = 10 * 60
const DAY_TO = 16 * 60

/** Hours overlapping [from, to) on a date. */
export function hoursIn(fc: Forecast, date: IsoDate, from: number, to: number): HourWx[] {
  return fc.hours.filter((h) => h.date === date && h.minute + 60 > from && h.minute < to)
}

export function conditionsOf(hours: HourWx[]): Conditions | null {
  if (!hours.length) return null
  const probs = hours.map((h) => h.rainProb).filter((p): p is number => p !== null)
  return {
    rainProb: probs.length ? Math.max(...probs) : null,
    rainMm: hours.reduce((s, h) => s + h.rainMm, 0),
    wind: Math.max(...hours.map((h) => h.wind)),
    gust: Math.max(...hours.map((h) => h.gust)),
    feelsMin: Math.min(...hours.map((h) => h.feels)),
  }
}

export function weatherFit(p: Place, c: Conditions): Fit {
  const wet = c.rainMm >= WET_MM || ((c.rainProb ?? 0) >= WET_PROB && c.rainMm >= SHOWER_MM)
  const showery = !wet && ((c.rainProb ?? 0) >= SHOWER_PROB || c.rainMm >= SHOWER_MM)
  const windy = c.gust >= WINDY_GUST || c.wind >= WINDY_WIND
  let score: number
  if (p.weather === 'outdoor') score = wet ? -6 : showery ? -2 : 2
  else if (p.weather === 'covered') score = wet ? -2 : showery ? -0.5 : 1
  else score = wet ? 3 : showery ? 1 : 0
  if (p.windSensitive && windy) score -= c.gust >= STORM_GUST ? 9 : 5
  if (p.weather === 'outdoor' && c.feelsMin < 0) score -= 1
  return { score, wet, showery, windy }
}

/** Fit for a visit window, or null when the forecast doesn't cover it. */
export function fitFor(p: Place, fc: Forecast, date: IsoDate, from: number, to: number): Fit | null {
  const c = conditionsOf(hoursIn(fc, date, from, to))
  return c ? weatherFit(p, c) : null
}

export type Hint = { kind: 'good' } | { kind: 'better'; date: IsoDate } | { kind: 'poor' }

const weatherDependent = (p: Place) => p.weather !== 'indoor' || p.windSensitive

/**
 * "Good today" / "Better on <day>" for a place on a date, comparing the trip's other days.
 * Outdoor places: good on a dry day, better elsewhere when this day is wet or windy.
 * Indoor places: good on a wet day (a rainy-day pick).
 */
export function hintFor(p: Place, fc: Forecast, date: IsoDate, otherDates: IsoDate[]): Hint | null {
  const here = fitFor(p, fc, date, DAY_FROM, DAY_TO)
  if (!here) return null
  if (!weatherDependent(p)) return here.wet ? { kind: 'good' } : null
  if (here.score >= 1) return { kind: 'good' }
  if (here.score >= 0) return null
  let best: { date: IsoDate; score: number } | null = null
  for (const d of otherDates) {
    if (d === date) continue
    const f = fitFor(p, fc, d, DAY_FROM, DAY_TO)
    if (f && f.score >= 1 && (!best || f.score > best.score)) best = { date: d, score: f.score }
  }
  return best ? { kind: 'better', date: best.date } : { kind: 'poor' }
}
