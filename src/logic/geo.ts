import type { LatLng } from '@/data/types'

/** Great-circle distance in metres. */
export function haversineM(a: LatLng, b: LatLng): number {
  const R = 6371000
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Streets are not straight: rough factor from straight-line to walking distance until a route is known. */
export const DETOUR_FACTOR = 1.3

export function estimateWalkM(a: LatLng, b: LatLng): number {
  return haversineM(a, b) * DETOUR_FACTOR
}

export function walkMinutes(metres: number, speedKmh: number): number {
  return metres / 1000 / speedKmh * 60
}

/** Average adult step ≈ 0.72 m. */
export const steps = (metres: number): number => Math.round(metres / 0.72)

/** Length of a path through the points. */
export function pathM(points: LatLng[]): number {
  let m = 0
  for (let i = 1; i < points.length; i++) m += haversineM(points[i - 1], points[i])
  return m
}

/** City Hall Square, used when no location or home base is known. */
export const CITY_CENTRE: LatLng = { lat: 55.67606, lng: 12.56891 }

/** Parse "55.68, 12.57" (as copied from Google Maps). */
export function parseLatLng(s: string): LatLng | null {
  const m = s.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/)
  if (!m) return null
  const lat = Number(m[1])
  const lng = Number(m[2])
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat, lng }
}

/** Google Maps walking directions; transit for public-transport legs. */
export function googleMapsDirections(to: LatLng, from?: LatLng, mode: 'walking' | 'transit' = 'walking'): string {
  const p = new URLSearchParams({ api: '1', destination: `${to.lat},${to.lng}`, travelmode: mode })
  if (from) p.set('origin', `${from.lat},${from.lng}`)
  return `https://www.google.com/maps/dir/?${p}`
}
