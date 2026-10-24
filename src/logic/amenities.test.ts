import { describe, expect, it } from 'vitest'
import { nearestToilets, toilets } from './amenities'

describe('toilets', () => {
  it('loads the OSM extract', () => {
    expect(toilets.length).toBeGreaterThan(100)
    expect(toilets.every((x) => x.coords.lat > 55 && x.coords.lng > 12)).toBe(true)
  })

  it('finds the nearest within the limit, nearest first', () => {
    const list = [
      { coords: { lat: 55.68, lng: 12.58 }, fee: 'no' as const, wheelchair: false, hours: null },
      { coords: { lat: 55.676, lng: 12.569 }, fee: null, wheelchair: true, hours: null },
    ]
    const near = nearestToilets({ lat: 55.6761, lng: 12.5683 }, 2, 1000, list)
    expect(near.map((x) => x.fee)).toEqual([null])
    expect(near[0].metres).toBeLessThan(100)
    expect(nearestToilets({ lat: 55.6761, lng: 12.5683 }, 2, 5000, list)).toHaveLength(2)
  })

  it('has a toilet near City Hall Square', () => {
    expect(nearestToilets({ lat: 55.67606, lng: 12.56891 }, 1, 500)).toHaveLength(1)
  })
})
