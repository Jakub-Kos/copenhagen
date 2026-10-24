// Projection for the printed day sheet's schematic map (pure): fits points into a box,
// north up, with the east–west distance scaled by cos(latitude).

import type { LatLng } from '@/data/types'

const M_PER_DEG_LAT = 111_320

export interface Sketch {
  project: (p: LatLng) => [number, number]
  /** Metres per SVG unit. */
  metresPerUnit: number
}

export function fitSketch(points: LatLng[], width: number, height: number, pad = 16): Sketch | null {
  if (!points.length) return null
  const lat0 = points.reduce((s, p) => s + p.lat, 0) / points.length
  const kx = Math.cos((lat0 * Math.PI) / 180) * M_PER_DEG_LAT
  const xs = points.map((p) => p.lng * kx)
  const ys = points.map((p) => p.lat * M_PER_DEG_LAT)
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  // At least 600 m across, so a single stop isn't drawn at absurd zoom.
  const spanX = Math.max(maxX - minX, 600)
  const spanY = Math.max(maxY - minY, 600)
  const metresPerUnit = Math.max(spanX / (width - 2 * pad), spanY / (height - 2 * pad))
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  return {
    metresPerUnit,
    project: (p) => [width / 2 + (p.lng * kx - cx) / metresPerUnit, height / 2 - (p.lat * M_PER_DEG_LAT - cy) / metresPerUnit],
  }
}

/** A round scale-bar length (100 m, 200 m, 500 m, 1 km, …) no longer than `maxUnits`. */
export function scaleBar(metresPerUnit: number, maxUnits: number): { metres: number; units: number } {
  const steps = [50, 100, 200, 500, 1000, 2000, 5000, 10_000, 20_000, 50_000]
  const metres = [...steps].reverse().find((m) => m / metresPerUnit <= maxUnits) ?? steps[0]
  return { metres, units: metres / metresPerUnit }
}
