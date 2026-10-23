import { useEffect, useSyncExternalStore } from 'react'
import { type ForecastState, getState, refreshIfStale, subscribe } from '@/state/forecastStore'

/** The current forecast; triggers a refresh when it is older than an hour, also on returning to the tab. */
export function useForecast(): ForecastState {
  const s = useSyncExternalStore(subscribe, getState)
  useEffect(() => {
    refreshIfStale()
    const onVisible = () => document.visibilityState === 'visible' && refreshIfStale()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])
  return s
}
