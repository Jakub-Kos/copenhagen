// Public toilets from the OSM extract in data/amenities.geo.json (pure lookups).

import amenities from '@/data/amenities.geo.json'
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

export const toilets: Toilet[] = (amenities.features as RawFeature[]).flatMap((f) => {
  if (f.properties.kind !== 'toilet' || f.geometry.type !== 'Point') return []
  const [lng, lat] = f.geometry.coordinates as [number, number]
  const fee = f.properties.fee === 'yes' || f.properties.fee === 'no' ? f.properties.fee : null
  return [{ coords: { lat, lng }, fee, wheelchair: f.properties.wheelchair === true, hours: f.properties.hours ?? null }]
})

/** The closest toilets within `maxMetres` walking (estimate), nearest first. */
export function nearestToilets(from: LatLng, max = 1, maxMetres = 1000, list: Toilet[] = toilets): (Toilet & { metres: number })[] {
  return list
    .map((x) => ({ ...x, metres: estimateWalkM(from, x.coords) }))
    .filter((x) => x.metres <= maxMetres)
    .sort((a, b) => a.metres - b.metres)
    .slice(0, max)
}
