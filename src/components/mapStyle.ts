// Adjustments on top of the OpenFreeMap styles: greener parks, a public-transport layer,
// outlined landmark buildings, and fewer distractions. Works with both the light and dark
// styles because it only adds its own layers on the shared `openmaptiles` source and hides
// existing layers by kind, not by id.

import type maplibregl from 'maplibre-gl'
import type { ExpressionSpecification, LayerSpecification } from 'maplibre-gl'
import { places } from '@/data/places'
import type { PlaceKind } from '@/data/types'

const SRC = 'openmaptiles'
const TRANSIT_LAYERS = ['cph-rail-tunnel', 'cph-rail', 'cph-metro-tunnel', 'cph-metro', 'cph-stations', 'cph-station-labels']
const HIT_LAYER = 'cph-buildings-hit'
const LANDMARK_LAYERS = ['cph-landmark-fill', 'cph-landmark-outline']
const NO_LANDMARKS: ExpressionSpecification = ['in', ['id'], ['literal', []]]

/** Kinds whose point usually sits inside one notable building. */
const LANDMARK_KINDS: PlaceKind[] = ['sight', 'museum', 'viewpoint', 'food-market', 'day-trip']

interface Palette {
  park: string
  wood: string
  cemetery: string
  rail: string
  metro: string
  stationFill: string
  label: string
  halo: string
  landmark: string
}

const LIGHT: Palette = {
  park: '#b7dca1',
  wood: '#a2d189',
  cemetery: '#c7e0b5',
  rail: '#475569',
  metro: '#e11d48',
  stationFill: '#ffffff',
  label: '#334155',
  halo: '#ffffff',
  landmark: '#646cff',
}

const DARK: Palette = {
  park: '#1f3d29',
  wood: '#24472f',
  cemetery: '#22382a',
  rail: '#94a3b8',
  metro: '#fb7185',
  stationFill: '#0f172a',
  label: '#e2e8f0',
  halo: '#0f172a',
  landmark: '#8b93ff',
}

const width = (from: number, to: number): ExpressionSpecification => ['interpolate', ['linear'], ['zoom'], 11, from, 16, to]
const isTunnel: ExpressionSpecification = ['==', ['get', 'brunnel'], 'tunnel']
const notTunnel: ExpressionSpecification = ['!=', ['get', 'brunnel'], 'tunnel']

function layers(c: Palette): LayerSpecification[] {
  const greens: LayerSpecification[] = [
    // --- Green areas (drawn under roads, see below).
    {
      id: 'cph-green',
      type: 'fill',
      source: SRC,
      'source-layer': 'landcover',
      filter: ['match', ['get', 'class'], ['grass', 'wood'], true, false],
      paint: { 'fill-color': ['match', ['get', 'class'], 'wood', c.wood, c.park], 'fill-opacity': 0.9 },
    },
    {
      id: 'cph-parks',
      type: 'fill',
      source: SRC,
      'source-layer': 'park',
      paint: { 'fill-color': c.park, 'fill-opacity': 0.6 },
    },
    {
      id: 'cph-cemetery',
      type: 'fill',
      source: SRC,
      'source-layer': 'landuse',
      filter: ['==', ['get', 'class'], 'cemetery'],
      paint: { 'fill-color': c.cemetery, 'fill-opacity': 0.9 },
    },
  ]
  return greens
    .concat([
      // --- Landmark buildings: invisible hit layer for lookups + highlighted outline.
      {
        id: HIT_LAYER,
        type: 'fill',
        source: SRC,
        'source-layer': 'building',
        minzoom: 14,
        paint: { 'fill-color': '#000', 'fill-opacity': 0 },
      },
      {
        id: 'cph-landmark-fill',
        type: 'fill',
        source: SRC,
        'source-layer': 'building',
        minzoom: 14,
        filter: NO_LANDMARKS,
        paint: { 'fill-color': c.landmark, 'fill-opacity': 0.22 },
      },
      {
        id: 'cph-landmark-outline',
        type: 'line',
        source: SRC,
        'source-layer': 'building',
        minzoom: 14,
        filter: NO_LANDMARKS,
        paint: { 'line-color': c.landmark, 'line-width': 2 },
      },
    ] as LayerSpecification[])
    .concat([
      // --- Public transport. Tunnels (most of the metro and the central S-train) are dashed.
      {
        id: 'cph-rail-tunnel',
        type: 'line',
        source: SRC,
        'source-layer': 'transportation',
        minzoom: 10,
        filter: ['all', ['==', ['get', 'class'], 'rail'], isTunnel],
        paint: { 'line-color': c.rail, 'line-width': width(1, 2.5), 'line-opacity': 0.6, 'line-dasharray': [2, 1.5] },
      },
      {
        id: 'cph-rail',
        type: 'line',
        source: SRC,
        'source-layer': 'transportation',
        minzoom: 10,
        filter: ['all', ['==', ['get', 'class'], 'rail'], notTunnel],
        paint: { 'line-color': c.rail, 'line-width': width(1, 2.5) },
      },
      {
        id: 'cph-metro-tunnel',
        type: 'line',
        source: SRC,
        'source-layer': 'transportation',
        minzoom: 10,
        filter: ['all', ['==', ['get', 'class'], 'transit'], isTunnel],
        paint: { 'line-color': c.metro, 'line-width': width(1.2, 3), 'line-opacity': 0.55, 'line-dasharray': [2, 1.5] },
      },
      {
        id: 'cph-metro',
        type: 'line',
        source: SRC,
        'source-layer': 'transportation',
        minzoom: 10,
        filter: ['all', ['==', ['get', 'class'], 'transit'], notTunnel],
        paint: { 'line-color': c.metro, 'line-width': width(1.2, 3) },
      },
      {
        id: 'cph-stations',
        type: 'circle',
        source: SRC,
        'source-layer': 'poi',
        minzoom: 12,
        filter: ['==', ['get', 'class'], 'railway'],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 2.5, 16, 5.5],
          'circle-color': c.stationFill,
          'circle-stroke-color': ['match', ['get', 'subclass'], 'subway', c.metro, c.rail],
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 12, 1.5, 16, 2.5],
        },
      },
      {
        id: 'cph-station-labels',
        type: 'symbol',
        source: SRC,
        'source-layer': 'poi',
        minzoom: 14.5,
        filter: ['==', ['get', 'class'], 'railway'],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 11,
          'text-offset': [0, 0.9],
          'text-anchor': 'top',
          'text-max-width': 8,
        },
        paint: { 'text-color': c.label, 'text-halo-color': c.halo, 'text-halo-width': 1.4 },
      },
    ] as LayerSpecification[])
}

/** Applies the adjustments; call after every style load. */
export function enhanceStyle(map: maplibregl.Map, dark: boolean, transitVisible: boolean): void {
  const style = map.getStyle()
  // Hide clutter: all POI icons/labels (our own markers carry the important places),
  // road shields and one-way arrows.
  for (const l of style.layers) {
    const sl = 'source-layer' in l ? l['source-layer'] : undefined
    if (l.type === 'symbol' && (sl === 'poi' || /shield|one_way|oneway/.test(l.id))) {
      map.setLayoutProperty(l.id, 'visibility', 'none')
    }
  }
  // Landmarks and transport go above the (3D) buildings but below the labels that follow them.
  let lastBuilding = -1
  style.layers.forEach((l, i) => {
    if ('source-layer' in l && l['source-layer'] === 'building') lastBuilding = i
  })
  const firstSymbol = style.layers.slice(lastBuilding + 1).find((l) => l.type === 'symbol')?.id
  // Greens go just above the base landuse so roads stay on top of them.
  const firstRoad = style.layers.find(
    (l) => 'source-layer' in l && l['source-layer'] === 'transportation' && l.type === 'line',
  )?.id
  for (const l of layers(dark ? DARK : LIGHT)) {
    if (map.getLayer(l.id)) continue
    const isGreen = l.id === 'cph-green' || l.id === 'cph-parks' || l.id === 'cph-cemetery'
    map.addLayer(l, isGreen ? firstRoad : l.id === 'cph-station-labels' ? undefined : firstSymbol)
  }
  setTransitVisible(map, transitVisible)
}

export function setTransitVisible(map: maplibregl.Map, on: boolean): void {
  for (const id of TRANSIT_LAYERS) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none')
}

const marked = new WeakMap<maplibregl.Map, Set<number>>()

/**
 * Outlines the building under each landmark place (sights, museums…): the building ids found
 * under the place markers become the filter of the landmark layers. Call when the map is idle.
 */
export function highlightLandmarks(map: maplibregl.Map): void {
  if (map.getZoom() < 14 || !map.getLayer(HIT_LAYER)) return
  const ids = marked.get(map) ?? new Set<number>()
  marked.set(map, ids)
  const before = ids.size
  const bounds = map.getBounds()
  for (const p of places) {
    if (!LANDMARK_KINDS.includes(p.kind) || !bounds.contains([p.coords.lng, p.coords.lat])) continue
    const pt = map.project([p.coords.lng, p.coords.lat])
    const hits = map.queryRenderedFeatures(
      [
        [pt.x - 3, pt.y - 3],
        [pt.x + 3, pt.y + 3],
      ],
      { layers: [HIT_LAYER] },
    )
    for (const f of hits) if (typeof f.id === 'number') ids.add(f.id)
  }
  if (ids.size === before) return
  const filter: ExpressionSpecification = ['in', ['id'], ['literal', [...ids]]]
  for (const id of LANDMARK_LAYERS) map.setFilter(id, filter)
}
