// Public-transport journeys from Transitous (MOTIS 2 `/api/v1/plan`), reduced to what the
// app shows (pure; the request itself is in services/transitous.ts).

import type { LatLng } from '@/data/types'
import { decodePolyline } from './polyline'
import { cphParts } from './time'

export type TransitMode = 'walk' | 'bus' | 'metro' | 'train' | 'tram' | 'ferry' | 'other'

export interface TransitStop {
  name: string
  coords: LatLng
  /** Copenhagen time, minutes since midnight. */
  time: number
}

export interface TransitLeg {
  mode: TransitMode
  /** Line name (e.g. "5C", "M3", "RE"); empty for walking. */
  line: string
  headsign: string
  /** Line colour as #rrggbb (from the timetable, or a default per mode). */
  color: string
  from: TransitStop
  to: TransitStop
  minutes: number
  /** Walking distance for walk legs. */
  metres: number
  shape: LatLng[]
}

export interface TransitPlan {
  /** Planned departure the journey was searched for (minutes since midnight). */
  depart: number
  /** First boarding / walking start and final arrival (minutes since midnight). */
  start: number
  end: number
  transfers: number
  legs: TransitLeg[]
  /** Door to door from the planned departure, including any wait. */
  minutes: number
  walkMetres: number
}

// --- the parts of the MOTIS response we read ---------------------------------
interface MPlace {
  name: string
  lat: number
  lon: number
}
interface MLeg {
  mode: string
  from: MPlace
  to: MPlace
  startTime: string
  endTime: string
  distance?: number
  routeShortName?: string
  displayName?: string
  headsign?: string
  routeColor?: string
  legGeometry?: { points: string; precision: number }
}
interface MItinerary {
  startTime: string
  endTime: string
  transfers: number
  legs: MLeg[]
}
export interface MotisPlanResponse {
  itineraries?: MItinerary[]
}

const METRO_COLORS: Record<string, string> = { M1: '#008d41', M2: '#ffc600', M3: '#ff0a0a', M4: '#009cd3' }
const MODE_COLOR: Record<TransitMode, string> = {
  walk: '#64748b',
  bus: '#d97706',
  metro: '#0f766e',
  train: '#b91c1c',
  tram: '#7c3aed',
  ferry: '#0369a1',
  other: '#475569',
}

function modeOf(m: string): TransitMode {
  if (m === 'WALK') return 'walk'
  if (m === 'BUS' || m === 'COACH') return 'bus'
  if (m === 'SUBWAY' || m === 'METRO') return 'metro'
  if (m === 'TRAM') return 'tram'
  if (m === 'FERRY') return 'ferry'
  if (/RAIL|TRAIN|SUBURBAN/.test(m)) return 'train'
  return 'other'
}

const minutesOf = (iso: string): number => cphParts(new Date(iso)).minutes
const stop = (p: MPlace, iso: string): TransitStop => ({ name: p.name, coords: { lat: p.lat, lng: p.lon }, time: minutesOf(iso) })

function parseLeg(l: MLeg): TransitLeg {
  const mode = modeOf(l.mode)
  const line = mode === 'walk' ? '' : (l.routeShortName || l.displayName || '')
  const timetableColor = l.routeColor && /^[0-9a-f]{6}$/i.test(l.routeColor) ? `#${l.routeColor}` : null
  const shape = l.legGeometry ? decodePolyline(l.legGeometry.points, l.legGeometry.precision) : []
  const minutes = Math.round((Date.parse(l.endTime) - Date.parse(l.startTime)) / 60000)
  return {
    mode,
    line,
    headsign: l.headsign ?? '',
    color: METRO_COLORS[line] ?? timetableColor ?? MODE_COLOR[mode],
    from: stop(l.from, l.startTime),
    to: stop(l.to, l.endTime),
    minutes,
    metres: mode === 'walk' ? Math.round(l.distance ?? 0) : 0,
    shape: shape.length ? shape : [
      { lat: l.from.lat, lng: l.from.lon },
      { lat: l.to.lat, lng: l.to.lon },
    ],
  }
}

/**
 * The journey that arrives first among those leaving at or after `departUtc`, or null.
 * `depart` is the same moment as Copenhagen minutes, kept for display.
 */
export function bestPlan(r: MotisPlanResponse, departUtc: Date, depart: number): TransitPlan | null {
  const t0 = departUtc.getTime()
  const its = (r.itineraries ?? []).filter((i) => Date.parse(i.startTime) >= t0 - 60_000 && i.legs.length)
  if (!its.length) return null
  const it = its.reduce((a, b) => (Date.parse(b.endTime) < Date.parse(a.endTime) ? b : a))
  const legs = it.legs.map(parseLeg)
  return {
    depart,
    start: minutesOf(it.startTime),
    end: minutesOf(it.endTime),
    transfers: it.transfers,
    legs,
    minutes: Math.max(1, Math.round((Date.parse(it.endTime) - t0) / 60000)),
    walkMetres: legs.reduce((s, l) => s + l.metres, 0),
  }
}
