import { describe, expect, it } from 'vitest'
import { placeById } from '@/data/places'
import transit from '@/data/transit.geo.json'
import type { FeatureCollection } from 'geojson'
import { nearestStations, parseStations } from './stations'

const stations = parseStations(transit as FeatureCollection)

describe('nearest stations', () => {
  it('loads metro and S-tog stations with their lines', () => {
    expect(stations.length).toBeGreaterThan(100)
    expect(stations.find((s) => s.name === 'Kongens Nytorv' && s.mode === 'metro')?.lines).toContain('M3')
  })

  it('finds Kongens Nytorv for Nyhavn, nearest first', () => {
    const near = nearestStations(placeById.get('nyhavn')!.coords, stations)
    expect(near[0].name).toBe('Kongens Nytorv')
    expect(near[0].metres).toBeLessThan(800)
    expect([...near].sort((a, b) => a.metres - b.metres)).toEqual(near)
  })

  it('returns nothing far from any station', () => {
    expect(nearestStations({ lat: 55.0, lng: 12.0 }, stations)).toEqual([])
  })
})
