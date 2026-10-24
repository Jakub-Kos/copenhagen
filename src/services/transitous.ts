// Public-transport journeys from Transitous (https://transitous.org), a free community
// router over open timetable data (for Denmark: Rejseplanen's GTFS). All Transitous network
// access goes through this file.
//
// Usage policy: non-commercial, open source, light on resources, visible attribution
// (https://transitous.org/sources/) and contact information on the site; browsers identify
// themselves with the Referer header. So: one request at a time, at least 1.1 s apart,
// identical requests share one promise, and answers are cached in localStorage
// (timetables don't change within a trip).

import type { LatLng } from '@/data/types'
import { type TransitPlan, bestPlan, type MotisPlanResponse } from '@/logic/transitPlan'
import { cphToUtc, type IsoDate } from '@/logic/time'

export const TRANSITOUS_URL = 'https://api.transitous.org'
export const TRANSITOUS_SOURCES = 'https://transitous.org/sources/'

const MIN_GAP_MS = 1100
const TIMEOUT_MS = 25000
const CACHE_PREFIX = 'cph:transit:'
const CACHE_INDEX = 'cph:transit-index'
const CACHE_MAX = 150

export interface TransitQuery {
  from: LatLng
  to: LatLng
  date: IsoDate
  /** Planned departure, Copenhagen minutes since midnight. */
  depart: number
}

export class TransitError extends Error {
  readonly rateLimited: boolean
  constructor(message: string, rateLimited = false) {
    super(message)
    this.rateLimited = rateLimited
  }
}

/** Cache key; departures are bucketed to 5 minutes so small timeline shifts reuse an answer. */
export function transitKey(q: TransitQuery): string {
  const p = (x: LatLng) => `${x.lat.toFixed(5)},${x.lng.toFixed(5)}`
  return `${p(q.from)}>${p(q.to)}|${q.date}|${Math.round(q.depart / 5) * 5}`
}

function cacheGet(key: string): TransitPlan | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    return raw ? (JSON.parse(raw) as TransitPlan) : null
  } catch {
    return null
  }
}

function cachePut(key: string, plan: TransitPlan): void {
  try {
    const index: string[] = JSON.parse(localStorage.getItem(CACHE_INDEX) ?? '[]')
    const next = [...index.filter((k) => k !== key), key]
    while (next.length > CACHE_MAX) localStorage.removeItem(CACHE_PREFIX + next.shift())
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(plan))
    localStorage.setItem(CACHE_INDEX, JSON.stringify(next))
  } catch {
    // Storage full or blocked: asked again next time.
  }
}

export const cachedTransit = (q: TransitQuery): TransitPlan | null => cacheGet(transitKey(q))

let lastStart = 0
let chain: Promise<unknown> = Promise.resolve()
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

const inflight = new Map<string, Promise<TransitPlan | null>>()

/** The best journey for the query (null when there is none), from cache when possible. */
export function transitPlan(q: TransitQuery): Promise<TransitPlan | null> {
  const key = transitKey(q)
  const cached = cacheGet(key)
  if (cached) return Promise.resolve(cached)
  const pending = inflight.get(key)
  if (pending) return pending

  const departUtc = cphToUtc(q.date, q.depart)
  const params = new URLSearchParams({
    fromPlace: `${q.from.lat},${q.from.lng}`,
    toPlace: `${q.to.lat},${q.to.lng}`,
    time: departUtc.toISOString(),
    arriveBy: 'false',
  })
  const p = enqueue(async () => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(`${TRANSITOUS_URL}/api/v1/plan?${params}`, { signal: ctrl.signal })
      if (res.status === 429) throw new TransitError('rate limited', true)
      if (!res.ok) throw new TransitError(`HTTP ${res.status}`)
      const plan = bestPlan((await res.json()) as MotisPlanResponse, departUtc, q.depart)
      if (plan) cachePut(key, plan)
      return plan
    } catch (e) {
      throw e instanceof TransitError ? e : new TransitError(e instanceof Error ? e.message : 'network error')
    } finally {
      clearTimeout(timer)
    }
  }).finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}
