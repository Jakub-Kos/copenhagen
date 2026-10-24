// Public toilets from the OSM extract in data/amenities.geo.json (pure lookups).

import type { FeatureCollection } from 'geojson'
import type { LatLng } from '@/data/types'
import { estimateWalkM } from './geo'

export interface Toilet {
  coords: LatLng
  /** null = not stated in OpenStreetMap. */
  fee: 'yes' | 'no' | null
  wheelchair: boolean
  hours: string | null
}

interface RawFeature {
  geometry: { type: string; coordinates: unknown }
  properties: { kind?: string; fee?: string | null; wheelchair?: boolean; hours?: string }
}

export function parseToilets(amenities: FeatureCollection): Toilet[] {
  return (amenities.features as unknown as RawFeature[]).flatMap((f) => {
    if (f.properties.kind !== 'toilet' || f.geometry.type !== 'Point') return []
    const [lng, lat] = f.geometry.coordinates as [number, number]
    const fee = f.properties.fee === 'yes' || f.properties.fee === 'no' ? f.properties.fee : null
    return [{ coords: { lat, lng }, fee, wheelchair: f.properties.wheelchair === true, hours: f.properties.hours ?? null }]
  })
}

/** The closest toilets within `maxMetres` walking (estimate), nearest first. */
export function nearestToilets(from: LatLng, list: Toilet[], max = 1, maxMetres = 1000): (Toilet & { metres: number })[] {
  return list
    .map((x) => ({ ...x, metres: estimateWalkM(from, x.coords) }))
    .filter((x) => x.metres <= maxMetres)
    .sort((a, b) => a.metres - b.metres)
    .slice(0, max)
}
