import type { LatLng } from '@/data/types'

/** Decodes an encoded polyline (Valhalla uses precision 6). */
export function decodePolyline(s: string, precision = 6): LatLng[] {
  const factor = 10 ** precision
  const out: LatLng[] = []
  let i = 0
  let lat = 0
  let lng = 0
  const next = () => {
    let result = 0
    let shift = 0
    let b: number
    do {
      b = s.charCodeAt(i++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    return result & 1 ? ~(result >> 1) : result >> 1
  }
  while (i < s.length) {
    lat += next()
    lng += next()
    out.push({ lat: lat / factor, lng: lng / factor })
  }
  return out
}
