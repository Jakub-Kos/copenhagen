import { describe, expect, it } from 'vitest'
import { offlineTiles, tileOf, tileUrl, tilesAround } from './tiles'

const cityHall = { lat: 55.6761, lng: 12.5683 }

describe('tiles', () => {
  it('finds the tile containing a point', () => {
    // Standard slippy-map formula (asinh form) gives 8763/5128 for City Hall Square.
    expect(tileOf(cityHall, 14)).toEqual({ z: 14, x: 8763, y: 5128 })
    expect(tileOf(cityHall, 0)).toEqual({ z: 0, x: 0, y: 0 })
  })

  it('covers a radius and removes duplicates', () => {
    const one = tilesAround([cityHall], 14, 1.2)
    expect(one.length).toBeGreaterThanOrEqual(4)
    expect(one.length).toBeLessThanOrEqual(25)
    expect(tilesAround([cityHall, cityHall], 14, 1.2)).toEqual(one)
  })

  it('keeps a whole-city download small', () => {
    const pts = [cityHall, { lat: 55.6867, lng: 12.5926 }, { lat: 56.0391, lng: 12.6214 }]
    const tiles = offlineTiles(pts)
    expect(tiles.length).toBeLessThan(200)
    expect(tileUrl('https://t/{z}/{x}/{y}.pbf', tiles[0])).toMatch(/^https:\/\/t\/10\/\d+\/\d+\.pbf$/)
  })
})
