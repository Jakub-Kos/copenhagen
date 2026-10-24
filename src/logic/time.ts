// Date/time helpers. Everything is Europe/Copenhagen wall-clock time; never use fixed offsets.
//
// Calendar dates are plain "YYYY-MM-DD" strings. Clock times are "HH:MM" or minutes since midnight.

import type { Lang, Weekday } from '@/data/types'

export const TZ = 'Europe/Copenhagen'

export type IsoDate = string

const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const partsFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Copenhagen calendar date and minutes since midnight for an instant. */
export function cphParts(at: Date = new Date()): { date: IsoDate; minutes: number } {
  const p = Object.fromEntries(partsFmt.formatToParts(at).map((x) => [x.type, x.value]))
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    minutes: Number(p.hour) * 60 + Number(p.minute),
  }
}

export const todayInCph = (at?: Date): IsoDate => cphParts(at).date
export const nowMinutesInCph = (at?: Date): number => cphParts(at).minutes

function toUtcDate(d: IsoDate): Date {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, day))
}

export function weekdayOf(d: IsoDate): Weekday {
  return WEEKDAYS[toUtcDate(d).getUTCDay()]
}

export function addDays(d: IsoDate, n: number): IsoDate {
  const x = toUtcDate(d)
  x.setUTCDate(x.getUTCDate() + n)
  return x.toISOString().slice(0, 10)
}

/** All dates from start to end inclusive. Empty if end < start. */
export function datesBetween(start: IsoDate, end: IsoDate): IsoDate[] {
  const out: IsoDate[] = []
  for (let d = start; d <= end && out.length < 60; d = addDays(d, 1)) out.push(d)
  return out
}

/** "HH:MM" → minutes since midnight. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Minutes since midnight → "HH:MM". Wraps past midnight. */
export function fromMinutes(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

const locale = (lang: Lang) => (lang === 'cs' ? 'cs-CZ' : 'en-GB')

/** e.g. "so 24. 10." / "Sat 24 Oct". Formats the calendar date itself, no zone shift. */
export function formatDayShort(d: IsoDate, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: lang === 'cs' ? 'numeric' : 'short',
  }).format(toUtcDate(d))
}

export function formatDayLong(d: IsoDate, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(toUtcDate(d))
}

export function formatDuration(min: number): string {
  const m = Math.round(min)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h} h ${rest} min` : `${h} h`
}

/** The instant of a Copenhagen local date + minutes since midnight (DST-aware). */
export function cphToUtc(d: IsoDate, minutes: number): Date {
  const [y, m, day] = d.split('-').map(Number)
  const wanted = Date.UTC(y, m - 1, day, 0, minutes)
  // Start from the local time read as UTC and correct by the observed offset (twice, for DST edges).
  let t = wanted
  for (let i = 0; i < 2; i++) {
    const p = cphParts(new Date(t))
    const [py, pm, pd] = p.date.split('-').map(Number)
    t -= Date.UTC(py, pm - 1, pd, 0, p.minutes) - wanted
  }
  return new Date(t)
}

/** Minutes the clocks move forward (+60) or back (−60) in the night after `d`; 0 if none. */
export function dstShiftAfter(d: IsoDate): number {
  const offset = (x: IsoDate) => {
    const [y, m, day] = x.split('-').map(Number)
    return cphParts(new Date(Date.UTC(y, m - 1, day, 12))).minutes - 12 * 60
  }
  return offset(addDays(d, 1)) - offset(d)
}
