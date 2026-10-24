// Street walks routed once along real streets (scripts/route_walks.ts → walks.geo.json).

import type { LatLng } from './types'
import walks from './walks.geo.json'

interface WalkFeature {
  properties: { id: string; metres: number }
  geometry: { coordinates: number[][] }
}

const byId = new Map(
  (walks.features as WalkFeature[]).map((f) => [
    f.properties.id,
    { metres: f.properties.metres, shape: f.geometry.coordinates.map(([lng, lat]): LatLng => ({ lat, lng })) },
  ]),
)

/** The routed shape of a street walk, if it has been routed. */
export const walkShape = (placeId: string): LatLng[] | undefined => byId.get(placeId)?.shape

/** Routed length of a street walk in metres. */
export const walkMetres = (placeId: string): number | undefined => byId.get(placeId)?.metres
