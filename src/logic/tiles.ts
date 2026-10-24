// Web-Mercator tile maths for the offline map download (pure).

import type { LatLng } from '@/data/types'

export interface Tile {
  z: number
  x: number
  y: number
}

const KM_PER_DEG_LAT = 111.32

export function tileOf(p: LatLng, z: number): Tile {
  const n = 2 ** z
  const lat = (p.lat * Math.PI) / 180
  const x = Math.floor(((p.lng + 180) / 360) * n)
  const y = Math.floor(((1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2) * n)
  const clamp = (v: number) => Math.min(n - 1, Math.max(0, v))
  return { z, x: clamp(x), y: clamp(y) }
}

/**
 * Every tile at zoom `z` that touches a square of `radiusKm` around any of the points,
 * without duplicates, in a stable order.
 */
export function tilesAround(points: LatLng[], z: number, radiusKm: number): Tile[] {
  const seen = new Map<string, Tile>()
  for (const p of points) {
    const dLat = radiusKm / KM_PER_DEG_LAT
    const dLng = radiusKm / (KM_PER_DEG_LAT * Math.cos((p.lat * Math.PI) / 180))
    const nw = tileOf({ lat: p.lat + dLat, lng: p.lng - dLng }, z)
    const se = tileOf({ lat: p.lat - dLat, lng: p.lng + dLng }, z)
    for (let x = nw.x; x <= se.x; x++) {
      for (let y = nw.y; y <= se.y; y++) {
        const k = `${z}/${x}/${y}`
        if (!seen.has(k)) seen.set(k, { z, x, y })
      }
    }
  }
  return [...seen.values()]
}

/** Zoom → radius around each point; the tiles stop at z14 (MapLibre over-zooms beyond). */
export const OFFLINE_ZOOMS: readonly [z: number, radiusKm: number][] = [
  [10, 15],
  [11, 8],
  [12, 4],
  [13, 3],
  [14, 2],
]

export function offlineTiles(points: LatLng[]): Tile[] {
  return OFFLINE_ZOOMS.flatMap(([z, r]) => tilesAround(points, z, r))
}

export const tileUrl = (template: string, t: Tile) =>
  template.replace('{z}', String(t.z)).replace('{x}', String(t.x)).replace('{y}', String(t.y))
