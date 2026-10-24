// Public-transport journeys shared by every component, keyed like the Transitous cache.

import { TransitError, type TransitQuery, cachedTransit, transitKey, transitPlan } from '@/services/transitous'
import type { TransitPlan } from '@/logic/transitPlan'

export type TransitEntry =
  | { status: 'loading' }
  | { status: 'ok'; plan: TransitPlan }
  /** No journey found (e.g. nothing runs at that hour). */
  | { status: 'none' }
  | { status: 'error'; rateLimited: boolean; at: number }

const RETRY_AFTER_MS = 60_000
const entries = new Map<string, TransitEntry>()
const listeners = new Set<() => void>()
let version = 0

function set(key: string, e: TransitEntry) {
  entries.set(key, e)
  version++
  for (const l of listeners) l()
}

export function subscribeTransit(l: () => void): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const getTransitVersion = () => version

export function peekTransit(q: TransitQuery): TransitEntry | undefined {
  const key = transitKey(q)
  const e = entries.get(key)
  if (e) return e
  const cached = cachedTransit(q)
  if (!cached) return undefined
  const ok: TransitEntry = { status: 'ok', plan: cached }
  entries.set(key, ok)
  return ok
}

export function requestTransit(q: TransitQuery): void {
  const key = transitKey(q)
  const e = peekTransit(q)
  if (e && (e.status !== 'error' || Date.now() - e.at < RETRY_AFTER_MS)) return
  set(key, { status: 'loading' })
  transitPlan(q).then(
    (plan) => set(key, plan ? { status: 'ok', plan } : { status: 'none' }),
    (err: unknown) => set(key, { status: 'error', rateLimited: err instanceof TransitError && err.rateLimited, at: Date.now() }),
  )
}
