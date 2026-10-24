// Route results shared by every component, keyed by Valhalla cache key.

import { type Route, type RouteOptions, type RoutePoint, ValhallaError, cachedRoute, routeKey, walkingRoute } from '@/services/valhalla'

export type RouteEntry =
  | { status: 'loading' }
  | { status: 'ok'; route: Route }
  | { status: 'error'; rateLimited: boolean; at: number }

const RETRY_AFTER_MS = 60_000

const entries = new Map<string, RouteEntry>()
const listeners = new Set<() => void>()
let version = 0

function set(key: string, e: RouteEntry) {
  entries.set(key, e)
  version++
  for (const l of listeners) l()
}

export function subscribe(l: () => void): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const getVersion = () => version

/** Current entry; a localStorage hit is returned immediately without a request. */
export function peek(points: RoutePoint[], o: RouteOptions): RouteEntry | undefined {
  const key = routeKey(points, o)
  const e = entries.get(key)
  if (e) return e
  const cached = cachedRoute(points, o)
  if (cached) {
    const ok: RouteEntry = { status: 'ok', route: cached }
    entries.set(key, ok)
    return ok
  }
  return undefined
}

/** Starts a request unless one is running, done, or failed recently. */
export function request(points: RoutePoint[], o: RouteOptions): void {
  const key = routeKey(points, o)
  const e = peek(points, o)
  if (e && (e.status !== 'error' || Date.now() - e.at < RETRY_AFTER_MS)) return
  set(key, { status: 'loading' })
  walkingRoute(points, o).then(
    (route) => set(key, { status: 'ok', route }),
    (err: unknown) =>
      set(key, { status: 'error', rateLimited: err instanceof ValhallaError && err.rateLimited, at: Date.now() }),
  )
}

/** Like `request`, but waits for the answer (used by the offline download). True when routed. */
export async function ensure(points: RoutePoint[], o: RouteOptions): Promise<boolean> {
  if (peek(points, o)?.status === 'ok') return true
  const key = routeKey(points, o)
  set(key, { status: 'loading' })
  try {
    set(key, { status: 'ok', route: await walkingRoute(points, o) })
    return true
  } catch (err) {
    set(key, { status: 'error', rateLimited: err instanceof ValhallaError && err.rateLimited, at: Date.now() })
    return false
  }
}
