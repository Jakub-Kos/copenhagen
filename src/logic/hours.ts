// Opening-hours lookups.

import type { OpeningHours, SeasonalHours, TimeRange } from '@/data/types'
import { type IsoDate, toMinutes, weekdayOf } from './time'

function inSeason(s: SeasonalHours, d: IsoDate): boolean {
  const md = d.slice(5)
  return s.from <= s.to ? md >= s.from && md <= s.to : md >= s.from || md <= s.to
}

/** 'always', the hours that day, or null when closed. */
export function hoursOn(oh: OpeningHours, d: IsoDate): TimeRange | 'always' | null {
  const season = oh.seasonal?.find((s) => inSeason(s, d))
  const week = season ? season.hours : oh.regular
  if (week === 'always') return 'always'
  return week[weekdayOf(d)]
}

export function isOpenOnDay(oh: OpeningHours, d: IsoDate): boolean {
  return hoursOn(oh, d) !== null
}

/** Is the place open for the whole visit [from, to] (minutes since midnight)? */
export function isOpenDuring(oh: OpeningHours, d: IsoDate, from: number, to: number): boolean {
  const h = hoursOn(oh, d)
  if (h === 'always') return true
  if (!h) return false
  return from >= toMinutes(h.open) && to <= toMinutes(h.close)
}
