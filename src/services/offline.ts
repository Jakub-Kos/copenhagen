// Offline download: map tiles, map fonts/sprites and photos, written straight into the
// service worker's runtime caches. All of this network access goes through this file.
//
// The cache names must match `runtimeCaching` in vite.config.ts. Writing to Cache Storage
// directly (instead of fetching through the service worker) also works on the very first
// visit, before the worker controls the page.

export const MAP_META_CACHE = 'cph-map-meta'
export const MAP_CACHE = 'cph-map'
export const PHOTO_CACHE = 'cph-photos'

const OFM = 'https://tiles.openfreemap.org'
export const MAP_STYLES = [`${OFM}/styles/liberty`, `${OFM}/styles/dark`] as const
const TILEJSON = `${OFM}/planet`
const SPRITE = `${OFM}/sprites/ofm_f384/ofm`
const FONTS = ['Noto Sans Regular', 'Noto Sans Bold', 'Noto Sans Italic']
// Latin, Latin Extended (č, ř, ů), general punctuation (–, …) and enclosed letters (Ⓜ Ⓢ).
const GLYPH_RANGES = ['0-255', '256-511', '8192-8447', '9216-9471']

const CONCURRENCY = 4
const TIMEOUT_MS = 20000

export const offlineSupported = () => typeof caches !== 'undefined'

export interface Progress {
  done: number
  total: number
  failed: number
  bytes: number
}

async function fetchOk(url: string): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { mode: 'cors', signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res
  } finally {
    clearTimeout(timer)
  }
}

/** Current vector tile URL template (`…/{z}/{x}/{y}.pbf`); it changes with each data release. */
export async function tileTemplate(): Promise<string> {
  const res = await fetchOk(TILEJSON)
  const copy = res.clone()
  const json = (await res.json()) as { tiles?: unknown }
  const tpl = Array.isArray(json.tiles) && typeof json.tiles[0] === 'string' ? json.tiles[0] : null
  if (!tpl) throw new Error('tilejson without tiles')
  // Keep the tilejson too: offline, MapLibre needs it to find the cached tiles.
  await (await caches.open(MAP_META_CACHE)).put(TILEJSON, copy)
  return tpl
}

/** Styles, sprites and label fonts the map needs besides tiles. */
export function mapAssetUrls(): { meta: string[]; assets: string[] } {
  const sprites = ['', '@2x'].flatMap((r) => [`${SPRITE}${r}.json`, `${SPRITE}${r}.png`])
  const glyphs = FONTS.flatMap((f) => GLYPH_RANGES.map((r) => `${OFM}/fonts/${encodeURIComponent(f)}/${r}.pbf`))
  return { meta: [...MAP_STYLES], assets: [...sprites, ...glyphs] }
}

/**
 * Downloads every URL into its cache, skipping ones already there.
 * Never throws: failures are counted, so a patchy connection still saves what it can.
 */
export async function download(
  jobs: { url: string; cache: string }[],
  onProgress: (p: Progress) => void,
  signal?: AbortSignal,
): Promise<Progress> {
  const p: Progress = { done: 0, total: jobs.length, failed: 0, bytes: 0 }
  const open = new Map<string, Promise<Cache>>()
  const cacheFor = (name: string) => {
    let c = open.get(name)
    if (!c) open.set(name, (c = caches.open(name)))
    return c
  }
  let next = 0
  async function worker() {
    while (next < jobs.length && !signal?.aborted) {
      const job = jobs[next++]
      try {
        const cache = await cacheFor(job.cache)
        if (!(await cache.match(job.url))) {
          const res = await fetchOk(job.url)
          const blob = await res.clone().blob()
          p.bytes += blob.size
          await cache.put(job.url, res)
        }
      } catch {
        p.failed++
      }
      p.done++
      onProgress({ ...p })
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  return p
}

/** Asks the browser not to evict our caches under storage pressure (best effort). */
export async function persistStorage(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {
    // Not supported: caches still work, they may just be evicted eventually.
  }
}
