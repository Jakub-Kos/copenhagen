// The map extracts are large, so they are loaded on demand (each becomes its own chunk,
// still precached by the service worker for offline use) instead of in the main bundle.

import type { FeatureCollection } from 'geojson'

export interface Lazy<T> {
  load: () => Promise<T>
  /** The value if it has already loaded (lets a remount render it at once). */
  peek: () => T | null
}

export function lazy<T>(f: () => Promise<T>): Lazy<T> {
  let p: Promise<T> | null = null
  let value: T | null = null
  return {
    load: () =>
      (p ??= f().then((v) => {
        value = v
        return v
      })),
    peek: () => value,
  }
}

const fc = (m: { default: unknown }) => m.default as FeatureCollection

export const transitData = lazy(() => import('./transit.geo.json').then(fc))
export const landmarksData = lazy(() => import('./landmarks.geo.json').then(fc))
export const amenitiesData = lazy(() => import('./amenities.geo.json').then(fc))
