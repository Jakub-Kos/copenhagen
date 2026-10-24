import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { Lang } from '@/data/types'
import type { RouteSpec } from '@/logic/timeline'
import { type RouteEntry, getVersion, peek, request, subscribe } from '@/state/routeStore'

const DEBOUNCE_MS = 600

/**
 * Walking routes for the specs, by spec id. Requests start after the specs have been
 * stable for a moment, so quick edits (reordering stops) don't flood the server.
 */
export function useRoutes(specs: RouteSpec[], speedKmh: number, lang: Lang): ReadonlyMap<string, RouteEntry> {
  const version = useSyncExternalStore(subscribe, getVersion)
  const sig = specs.map((s) => `${s.id}:${s.points.map((p) => `${p.lat},${p.lng}`).join(';')}`).join('|')

  useEffect(() => {
    const timer = setTimeout(() => {
      for (const s of specs) request(s.points, { speedKmh, lang })
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `sig` captures the specs' content
  }, [sig, speedKmh, lang])

  return useMemo(() => {
    const m = new Map<string, RouteEntry>()
    for (const s of specs) {
      const e = peek(s.points, { speedKmh, lang })
      if (e) m.set(s.id, e)
    }
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recomputed when the store changes (`version`)
  }, [sig, speedKmh, lang, version])
}
