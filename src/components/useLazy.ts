import { useEffect, useState } from 'react'
import { type Lazy, amenitiesData, lazy, transitData } from '@/data/geoData'
import { parseToilets } from '@/logic/amenities'
import { parseStations } from '@/logic/stations'

export const stationsData = lazy(() => transitData.load().then(parseStations))
export const toiletsData = lazy(() => amenitiesData.load().then(parseToilets))

/** A lazily loaded value: null until it arrives (or if loading fails, e.g. offline without cache). */
export function useLazy<T>(l: Lazy<T>): T | null {
  const [value, setValue] = useState<T | null>(l.peek)
  useEffect(() => {
    if (value !== null) return
    let alive = true
    l.load().then(
      (v) => alive && setValue(v),
      () => undefined,
    )
    return () => {
      alive = false
    }
  }, [l, value])
  return value
}
