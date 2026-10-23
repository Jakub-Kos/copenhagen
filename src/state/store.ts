// App state: settings + trips. Persisted to localStorage.

import { createContext, useContext } from 'react'
import type { Lang } from '@/data/types'
import { parseTrip } from './share'
import { load } from './storage'
import type { Trip } from './tripTypes'

export interface Settings {
  lang: Lang
  largeText: boolean
}

export interface AppState {
  settings: Settings
  trips: Trip[]
  activeTripId: string | null
}

export type Action =
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'upsertTrip'; trip: Trip; activate?: boolean }
  | { type: 'deleteTrip'; id: string }
  | { type: 'activate'; id: string }

export function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'settings':
      return { ...s, settings: { ...s.settings, ...a.patch } }
    case 'upsertTrip': {
      const exists = s.trips.some((t) => t.id === a.trip.id)
      const trips = exists ? s.trips.map((t) => (t.id === a.trip.id ? a.trip : t)) : [...s.trips, a.trip]
      return { ...s, trips, activeTripId: a.activate || !s.activeTripId ? a.trip.id : s.activeTripId }
    }
    case 'deleteTrip': {
      const trips = s.trips.filter((t) => t.id !== a.id)
      return { ...s, trips, activeTripId: s.activeTripId === a.id ? (trips[0]?.id ?? null) : s.activeTripId }
    }
    case 'activate':
      return { ...s, activeTripId: a.id }
  }
}

const isLang = (x: unknown): x is Lang => x === 'cs' || x === 'en'

/** ?lang=cs works both before the hash and inside the hash route. */
function langFromUrl(): Lang | null {
  const outer = new URLSearchParams(location.search).get('lang')
  const inner = new URLSearchParams(location.hash.split('?')[1] ?? '').get('lang')
  const l = outer ?? inner
  return isLang(l) ? l : null
}

export function initialState(): AppState {
  const settings = load<Partial<Settings>>('settings', (x) => (typeof x === 'object' && x ? x : null)) ?? {}
  const trips = load<Trip[]>('trips', (x) =>
    Array.isArray(x) ? x.map(parseTrip).filter((t): t is Trip => t !== null) : null,
  ) ?? []
  const activeTripId = load<string>('activeTrip', (x) => (typeof x === 'string' ? x : null))
  const browserLang: Lang = navigator.language.toLowerCase().startsWith('cs') ? 'cs' : 'en'
  return {
    settings: {
      lang: langFromUrl() ?? (isLang(settings.lang) ? settings.lang : browserLang),
      largeText: settings.largeText === true,
    },
    trips,
    activeTripId: trips.some((t) => t.id === activeTripId) ? activeTripId : (trips[0]?.id ?? null),
  }
}

export const StoreContext = createContext<{ state: AppState; dispatch: (a: Action) => void } | null>(null)

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore outside StoreProvider')
  return ctx
}

export function useActiveTrip(): Trip | null {
  const { state } = useStore()
  return state.trips.find((t) => t.id === state.activeTripId) ?? null
}
