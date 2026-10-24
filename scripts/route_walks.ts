// Routes every street walk (places with `waypoints`) once through Valhalla and writes the
// shapes to src/data/walks.geo.json, so the map shows walks along real streets without
// any requests at runtime.
//
//   node --experimental-strip-types --no-warnings scripts/route_walks.ts
//
// Respects the FOSSGIS fair-use limit (one request every 1.2 s). Re-run after adding or
// changing a walk's waypoints.

import { writeFileSync } from 'node:fs'
import { places } from '../src/data/places.ts'
import { decodePolyline } from '../src/logic/polyline.ts'

const VALHALLA = 'https://valhalla1.openstreetmap.de/route'
const OUT = new URL('../src/data/walks.geo.json', import.meta.url)
const TOLERANCE_M = 3

type Pt = { lat: number; lng: number }

/** Douglas–Peucker in metres (local equirectangular projection). */
function simplify(pts: Pt[], tol: number): Pt[] {
  if (pts.length < 3) return pts
  const k = Math.cos((pts[0].lat * Math.PI) / 180) * 111_320
  const xy = pts.map((p) => [p.lng * k, p.lat * 111_320])
  const keep = new Uint8Array(pts.length)
  keep[0] = keep[pts.length - 1] = 1
  const stack: [number, number][] = [[0, pts.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()!
    const [ax, ay] = xy[a]
    const [bx, by] = xy[b]
    const len = Math.hypot(bx - ax, by - ay) || 1
    let best = -1
    let bestD = 0
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((bx - ax) * (ay - xy[i][1]) - (ax - xy[i][0]) * (by - ay)) / len
      if (d > bestD) [best, bestD] = [i, d]
    }
    if (best > 0 && bestD > tol) {
      keep[best] = 1
      stack.push([a, best], [best, b])
    }
  }
  return pts.filter((_, i) => keep[i])
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const features = []
for (const p of places.filter((x) => x.waypoints)) {
  const wp = p.waypoints!
  const body = {
    locations: wp.map((w, i) => ({ lat: w.lat, lon: w.lng, type: i === 0 || i === wp.length - 1 ? 'break' : 'through' })),
    costing: 'pedestrian',
    units: 'kilometers',
  }
  let res: Response | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(VALHALLA, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'copenhagen-guide-setup/0.1' }, body: JSON.stringify(body) })
    if (res.ok) break
    await sleep(5000)
  }
  if (!res?.ok) throw new Error(`${p.id}: HTTP ${res?.status}`)
  const json = (await res.json()) as { trip: { summary: { length: number }; legs: { shape: string }[] } }
  const raw = json.trip.legs.flatMap((l) => decodePolyline(l.shape))
  // A loop starts and ends at the same point, which Douglas–Peucker can't split: do each half.
  const mid = Math.floor(raw.length / 2)
  const shape = [...simplify(raw.slice(0, mid + 1), TOLERANCE_M).slice(0, -1), ...simplify(raw.slice(mid), TOLERANCE_M)]
  features.push({
    type: 'Feature',
    properties: { id: p.id, metres: Math.round(json.trip.summary.length * 1000) },
    geometry: { type: 'LineString', coordinates: shape.map((q) => [+q.lng.toFixed(5), +q.lat.toFixed(5)]) },
  })
  console.log(`${p.id}: ${(json.trip.summary.length).toFixed(2)} km, ${shape.length} points`)
  await sleep(1200)
}
writeFileSync(OUT, JSON.stringify({ type: 'FeatureCollection', features }))
console.log(`wrote ${features.length} walks`)
