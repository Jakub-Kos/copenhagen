import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { TransitSpec } from '@/logic/timeline'
import type { IsoDate } from '@/logic/time'
import { type TransitEntry, getTransitVersion, peekTransit, requestTransit, subscribeTransit } from '@/state/transitStore'

const DEBOUNCE_MS = 800

/** Public-transport journeys for the specs, by spec id; requested after edits settle. */
export function useTransit(specs: TransitSpec[], date: IsoDate): ReadonlyMap<string, TransitEntry> {
  const version = useSyncExternalStore(subscribeTransit, getTransitVersion)
  const sig = specs.map((s) => `${s.id}@${s.depart}`).join('|')

  useEffect(() => {
    const timer = setTimeout(() => {
      for (const s of specs) requestTransit({ from: s.from, to: s.to, date, depart: s.depart })
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `sig` captures the specs' content
  }, [sig, date])

  return useMemo(() => {
    const m = new Map<string, TransitEntry>()
    for (const s of specs) {
      const e = peekTransit({ from: s.from, to: s.to, date, depart: s.depart })
      if (e) m.set(s.id, e)
    }
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recomputed when the store changes (`version`)
  }, [sig, date, version])
}
