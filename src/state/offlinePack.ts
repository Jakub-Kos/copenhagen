// "Save for offline": walking routes for every planned day, map tiles around the whole
// guide, and the photos. Routes land in the localStorage route cache, the rest in the
// service worker's caches (services/offline.ts).

import { placeById, places } from '@/data/places'
import type { Lang, LatLng } from '@/data/types'
import { thumb } from '@/components/placeImage'
import { placeImages } from '@/data/images'
import { offlineTiles, tileUrl } from '@/logic/tiles'
import { buildTimeline, routeSpecs } from '@/logic/timeline'
import { MAP_CACHE, MAP_META_CACHE, PHOTO_CACHE, download, mapAssetUrls, persistStorage, tileTemplate } from '@/services/offline'
import { ensure } from './routeStore'
import { load, save } from './storage'
import { dayOf, plannedPlaces, tripDates } from './tripOps'
import type { Trip } from './tripTypes'

export type PackStep = 'routes' | 'files'

export interface PackProgress {
  step: PackStep
  done: number
  total: number
}

export interface PackResult {
  savedAt: number
  tripId: string
  /** `planSig` of the trip when saved, to tell whether the plan changed since. */
  sig: string
  routesFailed: number
  filesFailed: number
  bytes: number
}

const KEY = 'offline'

export const lastPack = (): PackResult | null =>
  load(KEY, (x) =>
    x && typeof x === 'object' && typeof (x as PackResult).savedAt === 'number' ? (x as PackResult) : null,
  )

/** Everything that changes which routes a trip needs. */
export const planSig = (t: Trip): string =>
  JSON.stringify([t.start, t.end, t.days, t.homeBase?.coords ?? null, t.walkingSpeedKmh, t.transitThresholdKm])

/** Points the map download covers: every guide place, its walk, and the home base. */
function mapPoints(trip: Trip): LatLng[] {
  const pts = places.flatMap((p) => [p.coords, ...(p.waypoints ?? [])])
  if (trip.homeBase) pts.push(trip.homeBase.coords)
  return pts
}

export async function saveForOffline(
  trip: Trip,
  lang: Lang,
  onProgress: (p: PackProgress) => void,
  signal?: AbortSignal,
): Promise<PackResult> {
  void persistStorage()

  // 1. Routes, one at a time through the Valhalla queue (cached ones return at once).
  const o = { speedKmh: trip.walkingSpeedKmh, lang }
  const specs = tripDates(trip).flatMap((date) => {
    const day = dayOf(trip, date)
    if (!day.stops.length) return []
    const tl = buildTimeline(day, (id) => placeById.get(id), {
      date,
      speedKmh: trip.walkingSpeedKmh,
      origin: trip.homeBase?.coords ?? null,
      maxDayHours: trip.maxDayHours,
      maxDayKm: trip.maxDayKm,
      transitThresholdKm: trip.transitThresholdKm,
    })
    return routeSpecs(tl)
  })
  let routesFailed = 0
  for (const [i, s] of specs.entries()) {
    if (signal?.aborted) break
    onProgress({ step: 'routes', done: i, total: specs.length })
    if (!(await ensure(s.points, o))) routesFailed++
  }

  // 2. Map and photos.
  const jobs: { url: string; cache: string }[] = []
  let filesFailed = 0
  try {
    const tpl = await tileTemplate()
    for (const t of offlineTiles(mapPoints(trip))) jobs.push({ url: tileUrl(tpl, t), cache: MAP_CACHE })
  } catch {
    filesFailed++
  }
  const { meta, assets } = mapAssetUrls()
  jobs.push(...meta.map((url) => ({ url, cache: MAP_META_CACHE })), ...assets.map((url) => ({ url, cache: MAP_CACHE })))
  const planned = plannedPlaces(trip)
  for (const [id, img] of Object.entries(placeImages)) {
    jobs.push({ url: thumb(img, 250), cache: PHOTO_CACHE })
    // Bigger versions only for planned places: the detail sheet and Today's next stop.
    if (planned.has(id)) jobs.push({ url: thumb(img, 500), cache: PHOTO_CACHE }, { url: thumb(img, 960), cache: PHOTO_CACHE })
  }

  const files = await download(jobs, (p) => onProgress({ step: 'files', done: p.done, total: p.total }), signal)
  const result: PackResult = {
    savedAt: Date.now(),
    tripId: trip.id,
    sig: planSig(trip),
    routesFailed,
    filesFailed: filesFailed + files.failed,
    bytes: files.bytes,
  }
  if (!signal?.aborted) save(KEY, result)
  return result
}

// ---------------------------------------------------------------- running download
// Kept outside React so the download carries on (and its progress stays visible) when
// the user switches pages.

export type PackState = { running: false; last: PackResult | null } | { running: true; progress: PackProgress | null; last: PackResult | null }

let state: PackState = { running: false, last: lastPack() }
let ctrl: AbortController | null = null
const listeners = new Set<() => void>()

function setState(s: PackState) {
  state = s
  for (const l of listeners) l()
}

export const getPackState = () => state

export function subscribePack(l: () => void): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function startPack(trip: Trip, lang: Lang): void {
  if (state.running) return
  ctrl = new AbortController()
  const last = state.last
  setState({ running: true, progress: null, last })
  saveForOffline(trip, lang, (progress) => setState({ running: true, progress, last }), ctrl.signal).then(
    (r) => setState({ running: false, last: ctrl?.signal.aborted ? last : r }),
    () => setState({ running: false, last }),
  )
}

export function cancelPack(): void {
  ctrl?.abort()
}
