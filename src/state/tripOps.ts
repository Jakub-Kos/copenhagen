// Pure trip updates. Each returns a new Trip.

import { placeById } from '@/data/places'
import { suggestLegMode } from '@/logic/timeline'
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

/** Inserts a stop at `index` (0 = first). */
export function insertStop(t: Trip, d: IsoDate, index: number, placeId: string, legMode: LegMode = 'walk'): Trip {
  return withStops(t, d, (s) => [...s.slice(0, index), { id: newId(), placeId, legMode, visitMin: null }, ...s.slice(index)])
}

export const removeStop = (t: Trip, d: IsoDate, stopId: string): Trip =>
  withStops(t, d, (s) => s.filter((x) => x.id !== stopId))

/** Moves a stop to the end of another day (keeping its visit time); call `resuggestLegModes` on both days. */
export function moveStopToDay(t: Trip, from: IsoDate, stopId: string, to: IsoDate): Trip {
  const stop = dayOf(t, from).stops.find((x) => x.id === stopId)
  if (!stop || from === to) return t
  return withStops(removeStop(t, from, stopId), to, (s) => [...s, stop])
}

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

/** Moves a stop to a new index (drag & drop). */
export function moveStopTo(t: Trip, d: IsoDate, stopId: string, index: number): Trip {
  return withStops(t, d, (s) => {
    const from = s.findIndex((x) => x.id === stopId)
    if (from < 0) return s
    const out = s.filter((x) => x.id !== stopId)
    out.splice(Math.max(0, Math.min(index, out.length)), 0, s[from])
    return out
  })
}

/** Puts the listed stops in the given order; stops not listed keep their place at the end. */
export function reorderStops(t: Trip, d: IsoDate, stopIds: string[]): Trip {
  return withStops(t, d, (s) => {
    const byId = new Map(s.map((x) => [x.id, x]))
    const ordered = stopIds.flatMap((id) => byId.get(id) ?? [])
    return [...ordered, ...s.filter((x) => !stopIds.includes(x.id))]
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

/** After a reorder the legs are different: re-suggest walk vs transport for each of them. */
export function resuggestLegModes(t: Trip, d: IsoDate): Trip {
  const home = t.homeBase?.coords ?? null
  return withStops(t, d, (stops) =>
    stops.map((st, i) => {
      const place = placeById.get(st.placeId)
      const prev = i > 0 ? (placeById.get(stops[i - 1].placeId) ?? null) : null
      return place ? { ...st, legMode: suggestLegMode(prev, home, place, t.transitThresholdKm) } : st
    }),
  )
}
