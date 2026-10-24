// Adjustments on top of the OpenFreeMap styles: greener parks, a public-transport layer,
// outlined landmark buildings, and fewer distractions. Works with both the light and dark
// styles: it only adds its own layers and hides existing ones by kind, not by id.
//
// Transport lines and landmark outlines are fixed GeoJSON extracted once from OpenStreetMap
// (src/data/*.geo.json), so they look the same at every zoom instead of jumping with the
// tiles' generalisation.

import type maplibregl from 'maplibre-gl'
import type { ExpressionSpecification, LayerSpecification } from 'maplibre-gl'
import type { FeatureCollection } from 'geojson'
import { type Lazy, amenitiesData, landmarksData, transitData } from '@/data/geoData'

const TILES = 'openmaptiles'
export const TRANSIT_LAYERS = [
  'cph-regional',
  'cph-stog',
  'cph-metro-casing',
  'cph-metro',
  'cph-stations',
  'cph-station-labels',
]
export const AMENITY_LAYERS = ['cph-benches', 'cph-toilets', 'cph-toilet-labels']

interface Palette {
  park: string
  wood: string
  cemetery: string
  casing: string
  stog: string
  regional: string
  stationFill: string
  label: string
  halo: string
  landmarkLine: string
  landmarkFill: string
  toilet: string
  toiletPaid: string
  bench: string
}

const LIGHT: Palette = {
  park: '#b7dca1',
  wood: '#a2d189',
  cemetery: '#c7e0b5',
  casing: '#ffffff',
  stog: '#475569',
  regional: '#94a3b8',
  stationFill: '#ffffff',
  label: '#1e293b',
  halo: '#ffffff',
  landmarkLine: '#b45309',
  landmarkFill: '#f59e0b',
  toilet: '#0e7490',
  toiletPaid: '#64748b',
  bench: '#92400e',
}

const DARK: Palette = {
  park: '#1f3d29',
  wood: '#24472f',
  cemetery: '#22382a',
  casing: '#0b1220',
  stog: '#94a3b8',
  regional: '#64748b',
  stationFill: '#0f172a',
  label: '#e2e8f0',
  halo: '#0f172a',
  landmarkLine: '#fbbf24',
  landmarkFill: '#f59e0b',
  toilet: '#22d3ee',
  toiletPaid: '#94a3b8',
  bench: '#d6a46b',
}

const byZoom = (z11: number, z16: number): ExpressionSpecification => ['interpolate', ['linear'], ['zoom'], 11, z11, 16, z16]
const isLine: ExpressionSpecification = ['==', ['geometry-type'], 'LineString']
const isPoint: ExpressionSpecification = ['==', ['geometry-type'], 'Point']
const mode = (m: string): ExpressionSpecification => ['==', ['get', 'mode'], m]

/** M1/M2 and M3/M4 share track; offset them so both colours show side by side. */
const metroOffset: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  11,
  ['match', ['get', 'ref'], 'M1', -1, 'M2', 1, 'M3', -1, 'M4', 1, 0],
  16,
  ['match', ['get', 'ref'], 'M1', -2.5, 'M2', 2.5, 'M3', -2.5, 'M4', 2.5, 0],
]

function greenLayers(c: Palette): LayerSpecification[] {
  return [
    {
      id: 'cph-green',
      type: 'fill',
      source: TILES,
      'source-layer': 'landcover',
      filter: ['match', ['get', 'class'], ['grass', 'wood'], true, false],
      paint: { 'fill-color': ['match', ['get', 'class'], 'wood', c.wood, c.park], 'fill-opacity': 0.9 },
    },
    { id: 'cph-parks', type: 'fill', source: TILES, 'source-layer': 'park', paint: { 'fill-color': c.park, 'fill-opacity': 0.6 } },
    {
      id: 'cph-cemetery',
      type: 'fill',
      source: TILES,
      'source-layer': 'landuse',
      filter: ['==', ['get', 'class'], 'cemetery'],
      paint: { 'fill-color': c.cemetery, 'fill-opacity': 0.9 },
    },
  ]
}

function overlayLayers(c: Palette): LayerSpecification[] {
  return [
    {
      id: 'cph-landmark-fill',
      type: 'fill',
      source: 'cph-landmarks',
      minzoom: 12.5,
      paint: { 'fill-color': c.landmarkFill, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 12.5, 0.12, 16, 0.22] },
    },
    {
      id: 'cph-landmark-outline',
      type: 'line',
      source: 'cph-landmarks',
      minzoom: 12.5,
      paint: { 'line-color': c.landmarkLine, 'line-width': ['interpolate', ['linear'], ['zoom'], 12.5, 1, 17, 2.5] },
    },
    {
      id: 'cph-regional',
      type: 'line',
      source: 'cph-transit',
      filter: ['all', isLine, mode('regional')],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': c.regional, 'line-width': byZoom(1.2, 2.5), 'line-dasharray': [3, 2] },
    },
    {
      id: 'cph-stog',
      type: 'line',
      source: 'cph-transit',
      filter: ['all', isLine, mode('stog')],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': c.stog, 'line-width': byZoom(1.6, 3.5) },
    },
    {
      id: 'cph-metro-casing',
      type: 'line',
      source: 'cph-transit',
      filter: ['all', isLine, mode('metro')],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': c.casing, 'line-width': byZoom(3.2, 6), 'line-offset': metroOffset },
    },
    {
      id: 'cph-metro',
      type: 'line',
      source: 'cph-transit',
      filter: ['all', isLine, mode('metro')],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ['get', 'colour'], 'line-width': byZoom(1.8, 3.8), 'line-offset': metroOffset },
    },
    {
      id: 'cph-stations',
      type: 'circle',
      source: 'cph-transit',
      minzoom: 11.5,
      filter: ['all', isPoint, ['!=', ['get', 'mode'], 'regional']],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11.5, 2.2, 16, 5.5],
        'circle-color': c.stationFill,
        'circle-stroke-color': ['match', ['get', 'mode'], 'metro', c.label, c.stog],
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 11.5, 1.2, 16, 2.2],
      },
    },
    {
      id: 'cph-benches',
      type: 'circle',
      source: 'cph-amenities',
      minzoom: 15.5,
      filter: ['==', ['get', 'kind'], 'bench'],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 15.5, 2, 18, 4],
        'circle-color': c.bench,
        'circle-stroke-color': c.casing,
        'circle-stroke-width': 1,
      },
    },
    {
      id: 'cph-toilets',
      type: 'circle',
      source: 'cph-amenities',
      minzoom: 13,
      filter: ['==', ['get', 'kind'], 'toilet'],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 3, 15, 9, 18, 11],
        'circle-color': ['match', ['get', 'fee'], 'yes', c.toiletPaid, c.toilet],
        'circle-stroke-color': c.casing,
        'circle-stroke-width': 1.5,
      },
    },
    {
      id: 'cph-toilet-labels',
      type: 'symbol',
      source: 'cph-amenities',
      minzoom: 15,
      filter: ['==', ['get', 'kind'], 'toilet'],
      layout: { 'text-field': 'WC', 'text-font': ['Noto Sans Bold'], 'text-size': 8.5, 'text-allow-overlap': true },
      paint: { 'text-color': c.casing },
    },
    {
      id: 'cph-station-labels',
      type: 'symbol',
      source: 'cph-transit',
      minzoom: 13.5,
      filter: ['all', isPoint, ['!=', ['get', 'mode'], 'regional']],
      layout: {
        'text-field': ['concat', ['match', ['get', 'mode'], 'metro', 'Ⓜ ', 'Ⓢ '], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': 11,
        'text-offset': [0, 0.9],
        'text-anchor': 'top',
        'text-max-width': 8,
        'text-optional': true,
      },
      paint: { 'text-color': c.label, 'text-halo-color': c.halo, 'text-halo-width': 1.5 },
    },
  ]
}

/** Applies the adjustments; call after every style load. */
export function enhanceStyle(map: maplibregl.Map, dark: boolean, transitVisible: boolean, amenitiesVisible: boolean): void {
  const style = map.getStyle()
  const c = dark ? DARK : LIGHT
  // Hide clutter: POI icons/labels (our markers carry the important places), road shields,
  // one-way arrows, and the tiles' own rail lines (replaced by the transit overlay).
  for (const l of style.layers) {
    const sl = 'source-layer' in l ? l['source-layer'] : undefined
    const filter = JSON.stringify('filter' in l ? l.filter : '')
    const isTileRail = sl === 'transportation' && l.type === 'line' && /"(rail|transit)"/.test(filter)
    if ((l.type === 'symbol' && (sl === 'poi' || /shield|one_way|oneway/.test(l.id))) || isTileRail) {
      map.setLayoutProperty(l.id, 'visibility', 'none')
    }
  }

  // The overlay data loads on demand: start empty and fill in when it arrives.
  addLazySource(map, 'cph-transit', transitData)
  addLazySource(map, 'cph-landmarks', landmarksData)
  addLazySource(map, 'cph-amenities', amenitiesData)

  // Greens just under the roads; landmarks and transport above the (3D) buildings but under
  // the labels that follow them.
  const firstRoad = style.layers.find((l) => 'source-layer' in l && l['source-layer'] === 'transportation' && l.type === 'line')?.id
  let lastBuilding = -1
  style.layers.forEach((l, i) => {
    if ('source-layer' in l && l['source-layer'] === 'building') lastBuilding = i
  })
  const labelsAfterBuildings = style.layers.slice(lastBuilding + 1).find((l) => l.type === 'symbol')?.id

  for (const l of greenLayers(c)) if (!map.getLayer(l.id)) map.addLayer(l, firstRoad)
  for (const l of overlayLayers(c)) {
    if (!map.getLayer(l.id)) map.addLayer(l, l.id === 'cph-station-labels' ? undefined : labelsAfterBuildings)
  }
  setVisible(map, TRANSIT_LAYERS, transitVisible)
  setVisible(map, AMENITY_LAYERS, amenitiesVisible)
}

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] }

function addLazySource(map: maplibregl.Map, id: string, data: Lazy<FeatureCollection>): void {
  if (map.getSource(id)) return
  map.addSource(id, { type: 'geojson', data: data.peek() ?? EMPTY })
  if (data.peek()) return
  data.load().then(
    (fc) => {
      try {
        ;(map.getSource(id) as maplibregl.GeoJSONSource | undefined)?.setData(fc)
      } catch {
        // The map was removed before the data arrived.
      }
    },
    () => undefined, // offline without a cached copy: the overlay just stays empty
  )
}

export function setVisible(map: maplibregl.Map, layers: string[], on: boolean): void {
  for (const id of layers) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none')
}
