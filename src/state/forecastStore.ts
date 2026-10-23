// The forecast shared by all components; refreshed at most once an hour.

import { FORECAST_MAX_AGE_MS, type Forecast, cachedForecast, fetchForecast } from '@/services/weather'

export interface ForecastState {
  forecast: Forecast | null
  loading: boolean
  /** The last refresh failed (an older forecast may still be shown). */
  error: boolean
}

let state: ForecastState = { forecast: cachedForecast(), loading: false, error: false }
const listeners = new Set<() => void>()

function set(patch: Partial<ForecastState>) {
  state = { ...state, ...patch }
  for (const l of listeners) l()
}

export function subscribe(l: () => void): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const getState = () => state

/** Fetches unless the current forecast is fresh or a request is running. */
export function refreshIfStale(force = false): void {
  if (state.loading) return
  if (!force && state.forecast && Date.now() - state.forecast.fetchedAt < FORECAST_MAX_AGE_MS) return
  set({ loading: true })
  fetchForecast().then(
    (forecast) => set({ forecast, loading: false, error: false }),
    () => set({ loading: false, error: true }),
  )
}
