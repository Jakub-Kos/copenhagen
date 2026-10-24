import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { FeatureCollection } from 'geojson'
import type { LatLng, Place } from '@/data/types'
import type { HomeBase } from '@/state/tripTypes'
import { load, save } from '@/state/storage'
import { KIND_ICON, WEATHER_COLOR } from './kindStyle'
import { enhanceStyle, highlightLandmarks, setTransitVisible } from './mapStyle'

// OpenFreeMap: free, no key, no request limits; the style carries the OSM/OpenMapTiles attribution.
const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/liberty'
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark'

export interface MapLine {
  id: string
  coords: LatLng[]
  /** walk = catalogue walk; route = real walking route; estimate = straight line until routed. */
  style: 'walk' | 'route' | 'estimate' | 'transit'
}

interface Props {
  places: Place[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  /** Small label on a marker: stop number in a day plan, ✓ for planned places. */
  badges?: ReadonlyMap<string, string>
  /** When set, places not in it are faded. */
  highlight?: ReadonlySet<string>
  home?: HomeBase | null
  lines?: MapLine[]
  /** Points to fit the view to; refits whenever `fitKey` changes. */
  fitPoints?: LatLng[]
  fitKey?: string
  onUserLocation?: (p: LatLng) => void
  className?: string
}

const toLngLat = (p: LatLng): [number, number] => [p.lng, p.lat]

const LINE_PAINT: Record<MapLine['style'], { color: string; width: number; dash?: number[] }> = {
  walk: { color: '#646cff', width: 3, dash: [2, 1.5] },
  route: { color: '#646cff', width: 5 },
  estimate: { color: '#646cff', width: 3, dash: [0.5, 2] },
  transit: { color: '#64748b', width: 3, dash: [1, 2] },
}

export function MapView({
  places,
  selectedId,
  onSelect,
  badges,
  highlight,
  home,
  lines,
  fitPoints,
  fitKey,
  onUserLocation,
  className,
}: Props) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const loaded = useRef(false)
  const markers = useRef<maplibregl.Marker[]>([])
  const onSelectRef = useRef(onSelect)
  const onLocRef = useRef(onUserLocation)
  const linesRef = useRef(lines)

  useEffect(() => {
    onSelectRef.current = onSelect
    onLocRef.current = onUserLocation
    linesRef.current = lines
  })

  // Create the map once.
  useEffect(() => {
    if (!container.current) return
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const m = new maplibregl.Map({
      container: container.current,
      style: dark ? STYLE_DARK : STYLE_LIGHT,
      center: [12.5800, 55.6800],
      zoom: 13,
      attributionControl: { compact: true },
    })
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    const geo = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    })
    geo.on('geolocate', (e: GeolocationPosition) =>
      onLocRef.current?.({ lat: e.coords.latitude, lng: e.coords.longitude }),
    )
    m.addControl(geo, 'top-right')
    m.addControl(new TransitToggle(), 'top-right')
    m.on('style.load', () => enhanceStyle(m, dark, transitOn()))
    m.on('idle', () => highlightLandmarks(m))
    m.on('load', () => {
      m.addSource('lines', { type: 'geojson', data: linesGeoJson(linesRef.current ?? []) })
      for (const [style, p] of Object.entries(LINE_PAINT)) {
        m.addLayer({
          id: `lines-${style}`,
          type: 'line',
          source: 'lines',
          filter: ['==', ['get', 'style'], style],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': p.color, 'line-width': p.width, ...(p.dash ? { 'line-dasharray': p.dash } : {}) },
        })
      }
      loaded.current = true
    })
    map.current = m
    return () => {
      loaded.current = false
      m.remove()
      map.current = null
    }
  }, [])

  // Markers.
  useEffect(() => {
    const m = map.current
    if (!m) return
    for (const mk of markers.current) mk.remove()
    markers.current = []

    for (const p of places) {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = `pin${p.mustSee ? ' must' : ''}${p.id === selectedId ? ' selected' : ''}${highlight && !highlight.has(p.id) ? ' dim' : ''}`
      el.style.setProperty('--pin-color', WEATHER_COLOR[p.weather])
      el.textContent = KIND_ICON[p.kind]
      el.title = p.name.en
      const badge = badges?.get(p.id)
      if (badge) {
        const b = document.createElement('span')
        b.className = 'badge'
        b.textContent = badge
        el.appendChild(b)
      }
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelectRef.current?.(p.id)
      })
      markers.current.push(new maplibregl.Marker({ element: el }).setLngLat(toLngLat(p.coords)).addTo(m))
    }

    if (home) {
      const el = document.createElement('div')
      el.className = 'pin home'
      el.textContent = '🏠'
      el.title = home.label
      markers.current.push(new maplibregl.Marker({ element: el }).setLngLat(toLngLat(home.coords)).addTo(m))
    }
  }, [places, selectedId, badges, highlight, home])

  // Lines.
  useEffect(() => {
    const src = map.current?.getSource('lines') as maplibregl.GeoJSONSource | undefined
    if (loaded.current && src) src.setData(linesGeoJson(lines ?? []))
  }, [lines])

  // Fit to points when the key changes.
  useEffect(() => {
    const m = map.current
    if (!m || !fitPoints?.length) return
    if (fitPoints.length === 1) {
      m.easeTo({ center: toLngLat(fitPoints[0]), zoom: Math.max(m.getZoom(), 14) })
      return
    }
    const b = new maplibregl.LngLatBounds()
    for (const p of fitPoints) b.extend(toLngLat(p))
    m.fitBounds(b, { padding: 48, maxZoom: 15, duration: 600 })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refit only on an explicit key change
  }, [fitKey])

  // Pan to the selected place.
  useEffect(() => {
    const p = places.find((x) => x.id === selectedId)
    if (p && map.current) map.current.easeTo({ center: toLngLat(p.coords), duration: 400 })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the selection changes
  }, [selectedId])

  return <div ref={container} className={className} />
}

const transitOn = () => load<boolean>('mapTransit', (x) => (typeof x === 'boolean' ? x : null)) ?? true

/** Map button that shows/hides the public-transport layer; the choice is remembered. */
class TransitToggle implements maplibregl.IControl {
  private el: HTMLDivElement | null = null

  onAdd(map: maplibregl.Map) {
    const el = document.createElement('div')
    el.className = 'maplibregl-ctrl maplibregl-ctrl-group'
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = '🚇'
    btn.title = 'Metro / S-tog'
    const paint = (on: boolean) => {
      btn.setAttribute('aria-pressed', String(on))
      btn.style.opacity = on ? '1' : '0.45'
    }
    paint(transitOn())
    btn.addEventListener('click', () => {
      const on = !transitOn()
      save('mapTransit', on)
      setTransitVisible(map, on)
      paint(on)
    })
    el.appendChild(btn)
    this.el = el
    return el
  }

  onRemove() {
    this.el?.remove()
  }
}

function linesGeoJson(lines: MapLine[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: lines.map((l) => ({
      type: 'Feature',
      properties: { id: l.id, style: l.style },
      geometry: { type: 'LineString', coordinates: l.coords.map(toLngLat) },
    })),
  }
}
