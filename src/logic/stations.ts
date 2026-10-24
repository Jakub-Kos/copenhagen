// Nearest metro / S-tog / regional stations, from the OSM transit extract (pure; the extract
// itself is loaded on demand, see data/geoData.ts).

import type { FeatureCollection } from 'geojson'
import type { LatLng } from '@/data/types'
import { estimateWalkM } from './geo'

export interface Station {
  name: string
  mode: 'metro' | 'stog' | 'regional'
  lines: string
  coords: LatLng
}

interface RawFeature {
  geometry: { type: string; coordinates: unknown }
  properties: { mode?: string; name?: string; lines?: string }
}

export function parseStations(transit: FeatureCollection): Station[] {
  return (transit.features as unknown as RawFeature[]).flatMap((f) => {
    const { mode, name, lines } = f.properties
    if (f.geometry.type !== 'Point' || !name || (mode !== 'metro' && mode !== 'stog' && mode !== 'regional')) return []
    const [lng, lat] = f.geometry.coordinates as [number, number]
    return [{ name, mode, lines: lines ?? '', coords: { lat, lng } }]
  })
}

/**
 * Up to `max` stations within walking range, nearest first, one per name (a metro and an
 * S-tog station of the same name both count, e.g. Nørreport).
 */
export function nearestStations(p: LatLng, list: Station[], max = 2, maxMetres = 1500): (Station & { metres: number })[] {
  const seen = new Set<string>()
  return list
    .map((s) => ({ ...s, metres: estimateWalkM(p, s.coords) }))
    .filter((s) => s.metres <= maxMetres)
    .sort((a, b) => a.metres - b.metres)
    .filter((s) => {
      const k = `${s.mode}:${s.name}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .slice(0, max)
}
