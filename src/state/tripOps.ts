// Pure trip updates. Each returns a new Trip.

import { type IsoDate, datesBetween } from '@/logic/time'
import { type DayPlan, type LegMode, type PlannedStop, type Trip, emptyDay, newId } from './tripTypes'

export const tripDates = (t: Trip): IsoDate[] => datesBetween(t.start, t.end)

export const dayOf = (t: Trip, d: IsoDate): DayPlan => t.days[d] ?? emptyDay()

function withDay(t: Trip, d: IsoDate, f: (day: DayPlan) => DayPlan): Trip {
  return { ...t, days: { ...t.days, [d]: f(dayOf(t, d)) } }
}

function withStops(t: Trip, d: IsoDate, f: (s: PlannedStop[]) => PlannedStop[]): Trip {
  return withDay(t, d, (day) => ({ ...day, stops: f(day.stops) }))
}

export function addStop(t: Trip, d: IsoDate, placeId: string, legMode: LegMode = 'walk'): Trip {
  return withStops(t, d, (s) => [...s, { id: newId(), placeId, legMode, visitMin: null }])
}

export const removeStop = (t: Trip, d: IsoDate, stopId: string): Trip =>
  withStops(t, d, (s) => s.filter((x) => x.id !== stopId))

export function moveStop(t: Trip, d: IsoDate, stopId: string, delta: -1 | 1): Trip {
  return withStops(t, d, (s) => {
    const i = s.findIndex((x) => x.id === stopId)
    const j = i + delta
    if (i < 0 || j < 0 || j >= s.length) return s
    const out = [...s]
    ;[out[i], out[j]] = [out[j], out[i]]
    return out
  })
}

export const updateStop = (t: Trip, d: IsoDate, stopId: string, patch: Partial<Omit<PlannedStop, 'id'>>): Trip =>
  withStops(t, d, (s) => s.map((x) => (x.id === stopId ? { ...x, ...patch } : x)))

export const setStartTime = (t: Trip, d: IsoDate, startTime: string): Trip =>
  withDay(t, d, (day) => ({ ...day, startTime }))

/** Changes dates; plans for days that fall outside the new range are dropped. */
export function setDates(t: Trip, start: IsoDate, end: IsoDate): Trip {
  const keep = new Set(datesBetween(start, end))
  return { ...t, start, end, days: Object.fromEntries(Object.entries(t.days).filter(([d]) => keep.has(d))) }
}

/** placeId → dates it is planned on. */
export function plannedPlaces(t: Trip): Map<string, IsoDate[]> {
  const m = new Map<string, IsoDate[]>()
  for (const d of tripDates(t)) {
    for (const s of t.days[d]?.stops ?? []) m.set(s.placeId, [...(m.get(s.placeId) ?? []), d])
  }
  return m
}
