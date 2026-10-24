// Trip ⇄ JSON / share link. The share link keeps the trip after "#", so it is never sent to a server.

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import type { DayPlan, Trip } from './tripTypes'

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null
const isDate = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)

function isDay(x: unknown): x is DayPlan {
  return (
    isObj(x) &&
    typeof x.startTime === 'string' &&
    Array.isArray(x.stops) &&
    x.stops.every((s) => isObj(s) && typeof s.id === 'string' && typeof s.placeId === 'string')
  )
}

const CATEGORIES = ['adult', 'senior', 'student', 'youth', 'child']

function isTraveller(x: unknown): x is Trip['group'][number] {
  return (
    isObj(x) &&
    typeof x.id === 'string' &&
    typeof x.name === 'string' &&
    CATEGORIES.includes(x.category as string) &&
    (x.age === null || typeof x.age === 'number')
  )
}

function isExtraCost(x: unknown): x is Trip['extraCosts'][number] {
  return (
    isObj(x) &&
    typeof x.id === 'string' &&
    typeof x.label === 'string' &&
    typeof x.amountDkk === 'number' &&
    (x.date === null || isDate(x.date)) &&
    typeof x.paid === 'boolean'
  )
}

/** Validates an untrusted value (import, share link, storage) and fills missing optional fields. */
export function parseTrip(x: unknown): Trip | null {
  if (!isObj(x) || x.v !== 1) return null
  if (typeof x.id !== 'string' || typeof x.name !== 'string' || !isDate(x.start) || !isDate(x.end)) return null
  if (!isObj(x.days) || !Object.entries(x.days).every(([d, p]) => isDate(d) && isDay(p))) return null
  const num = (v: unknown, dflt: number) => (typeof v === 'number' && Number.isFinite(v) ? v : dflt)
  const hb = x.homeBase
  const homeBase =
    isObj(hb) && typeof hb.label === 'string' && isObj(hb.coords) &&
    typeof hb.coords.lat === 'number' && typeof hb.coords.lng === 'number'
      ? { label: hb.label, coords: { lat: hb.coords.lat, lng: hb.coords.lng } }
      : null
  const days = x.days as Record<string, DayPlan>
  return {
    v: 1,
    id: x.id,
    name: x.name,
    start: x.start,
    end: x.end,
    group: Array.isArray(x.group) ? x.group.filter(isTraveller) : [],
    homeBase,
    walkingSpeedKmh: num(x.walkingSpeedKmh, 4.5),
    transitThresholdKm: num(x.transitThresholdKm, 3),
    maxDayHours: num(x.maxDayHours, 9),
    maxDayKm: num(x.maxDayKm, 15),
    days: Object.fromEntries(
      Object.entries(days).map(([d, p]) => [
        d,
        {
          startTime: p.startTime,
          stops: p.stops.map((s) => ({
            id: s.id,
            placeId: s.placeId,
            legMode: s.legMode === 'transit' ? 'transit' : 'walk',
            visitMin: typeof s.visitMin === 'number' ? s.visitMin : null,
          })),
        },
      ]),
    ),
    extraCosts: Array.isArray(x.extraCosts) ? (x.extraCosts as Trip['extraCosts']).filter(isExtraCost) : [],
    paid: isObj(x.paid)
      ? Object.fromEntries(Object.entries(x.paid).filter((e): e is [string, boolean] => typeof e[1] === 'boolean'))
      : {},
    // Added after v1 shipped: older trips simply have none.
    done: isObj(x.done)
      ? Object.fromEntries(Object.entries(x.done).filter((e): e is [string, boolean] => typeof e[1] === 'boolean'))
      : {},
    budgetDkk: typeof x.budgetDkk === 'number' && x.budgetDkk > 0 ? x.budgetDkk : null,
    czkRate: typeof x.czkRate === 'number' && x.czkRate > 0 ? x.czkRate : null,
  }
}

export const encodeTrip = (t: Trip): string => compressToEncodedURIComponent(JSON.stringify(t))

export function decodeTrip(s: string): Trip | null {
  try {
    const json = decompressFromEncodedURIComponent(s)
    return json ? parseTrip(JSON.parse(json)) : null
  } catch {
    return null
  }
}

/** Full share URL for the current deployment. */
export function shareUrl(t: Trip, lang?: string): string {
  const base = `${location.origin}${import.meta.env.BASE_URL}`
  return `${base}${lang ? `?lang=${lang}` : ''}#/share/${encodeTrip(t)}`
}

export function downloadJson(t: Trip): void {
  const blob = new Blob([JSON.stringify(t, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${t.name.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase() || 'trip'}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}
