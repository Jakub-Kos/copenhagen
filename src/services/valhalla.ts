// Walking routes from Valhalla. All Valhalla network access goes through this file.
//
// The public FOSSGIS server asks for about 1 request/second per user, so every request
// goes through one queue, identical requests share one promise, and successful routes are
// cached in localStorage (they rarely change).

import type { Lang, LatLng } from '@/data/types'
import { decodePolyline } from '@/logic/polyline'

/** Change this to self-host. */
export const VALHALLA_URL = 'https://valhalla1.openstreetmap.de'

const MIN_GAP_MS = 1100
const TIMEOUT_MS = 20000
const CACHE_PREFIX = 'cph:route:'
const CACHE_INDEX = 'cph:route-index'
const CACHE_MAX = 300

/** `through` points shape the line without splitting it into legs (used inside street walks). */
export interface RoutePoint extends LatLng {
  through?: boolean
}

export interface Maneuver {
  instruction: string
  metres: number
  seconds: number
}

export interface Route {
  metres: number
  seconds: number
  shape: LatLng[]
  maneuvers: Maneuver[]
}

export interface RouteOptions {
  speedKmh: number
  lang: Lang
}

export class ValhallaError extends Error {
  readonly rateLimited: boolean

  constructor(message: string, rateLimited = false) {
    super(message)
    this.rateLimited = rateLimited
  }
}

// ---------------------------------------------------------------- request queue

let lastStart = 0
let chain: Promise<unknown> = Promise.resolve()

/** Runs requests one at a time, at least MIN_GAP_MS apart. */
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = async () => {
    const wait = lastStart + MIN_GAP_MS - Date.now()
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    lastStart = Date.now()
    return task()
  }
  const p = chain.then(run, run)
  chain = p.catch(() => undefined)
  return p
}

async function post<T>(path: string, body: unknown): Promise<T> {
  return enqueue(async () => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(`${VALHALLA_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      })
      if (res.status === 429) throw new ValhallaError('rate limited', true)
      if (!res.ok) throw new ValhallaError(`HTTP ${res.status}`)
      return (await res.json()) as T
    } catch (e) {
      throw e instanceof ValhallaError ? e : new ValhallaError(e instanceof Error ? e.message : 'network error')
    } finally {
      clearTimeout(timer)
    }
  })
}

// ---------------------------------------------------------------- cache

function cacheGet(key: string): Route | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    return raw ? (JSON.parse(raw) as Route) : null
  } catch {
    return null
  }
}

function cachePut(key: string, r: Route): void {
  try {
    const index: string[] = JSON.parse(localStorage.getItem(CACHE_INDEX) ?? '[]')
    const next = [...index.filter((k) => k !== key), key]
    while (next.length > CACHE_MAX) localStorage.removeItem(CACHE_PREFIX + next.shift())
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(r))
    localStorage.setItem(CACHE_INDEX, JSON.stringify(next))
  } catch {
    // Storage full or blocked: routes are just fetched again next time.
  }
}

/** Cache key: the ordered coordinate list plus everything else that changes the answer. */
export function routeKey(points: RoutePoint[], o: RouteOptions): string {
  const pts = points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}${p.through ? 't' : ''}`).join(';')
  return `${pts}|${o.speedKmh}|${o.lang}`
}

// ---------------------------------------------------------------- API

interface ValhallaManeuver {
  instruction: string
  length: number
  time: number
}

interface ValhallaRouteResponse {
  trip: {
    legs: { shape: string; maneuvers: ValhallaManeuver[] }[]
    summary: { length: number; time: number }
  }
}

/** A cached route, without any network request. */
export const cachedRoute = (points: RoutePoint[], o: RouteOptions): Route | null => cacheGet(routeKey(points, o))

const inflight = new Map<string, Promise<Route>>()

/** One continuous walking route through the points (no intermediate stops). */
export function walkingRoute(points: RoutePoint[], o: RouteOptions): Promise<Route> {
  const key = routeKey(points, o)
  const cached = cacheGet(key)
  if (cached) return Promise.resolve(cached)
  const pending = inflight.get(key)
  if (pending) return pending

  const p = post<ValhallaRouteResponse>('/route', {
    locations: points.map((pt, i) => ({
      lat: pt.lat,
      lon: pt.lng,
      type: pt.through && i > 0 && i < points.length - 1 ? 'through' : 'break',
    })),
    costing: 'pedestrian',
    costing_options: { pedestrian: { walking_speed: o.speedKmh } },
    language: o.lang === 'cs' ? 'cs-CZ' : 'en-US',
    units: 'kilometers',
  })
    .then((res): Route => {
      const legs = res.trip.legs
      const route: Route = {
        metres: res.trip.summary.length * 1000,
        seconds: res.trip.summary.time,
        shape: legs.flatMap((l) => decodePolyline(l.shape)),
        maneuvers: legs.flatMap((l) =>
          l.maneuvers.map((m) => ({ instruction: m.instruction, metres: m.length * 1000, seconds: m.time })),
        ),
      }
      cachePut(key, route)
      return route
    })
    .finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}

interface OptimizedResponse {
  trip: { locations: { original_index: number }[] }
}

/**
 * Best visiting order for the points, keeping the first and last fixed.
 * Returns indices into `points`.
 */
export async function optimizedOrder(points: LatLng[], o: Pick<RouteOptions, 'speedKmh'>): Promise<number[]> {
  const res = await post<OptimizedResponse>('/optimized_route', {
    locations: points.map((p) => ({ lat: p.lat, lon: p.lng })),
    costing: 'pedestrian',
    costing_options: { pedestrian: { walking_speed: o.speedKmh } },
    units: 'kilometers',
  })
  return res.trip.locations.map((l) => l.original_index)
}
