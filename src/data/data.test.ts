import { describe, expect, it } from 'vitest'
import addresses from './addresses.json'
import { highlights } from './details'
import { placeImages } from './images'
import { places } from './places'
import { pricingFor } from './prices'
import { walkShape } from './walks'

describe('guide data is complete', () => {
  it('has unique ids', () => {
    expect(new Set(places.map((p) => p.id)).size).toBe(places.length)
  })

  it.each(places.map((p) => [p.id, p] as const))('%s has a photo, address, highlights and pricing', (id, p) => {
    expect(placeImages[id], 'photo').toBeDefined()
    expect((addresses as Record<string, string>)[id], 'address').toBeTruthy()
    expect(highlights[id]?.length ?? 0, 'highlights').toBeGreaterThanOrEqual(3)
    expect(pricingFor(id)).toBeDefined()
    if (p.waypoints) expect(walkShape(id)?.length ?? 0, 'routed walk (run scripts/route_walks.ts)').toBeGreaterThan(p.waypoints.length)
  })

  it('has no highlights for unknown places', () => {
    const ids = new Set(places.map((p) => p.id))
    expect(Object.keys(highlights).filter((k) => !ids.has(k))).toEqual([])
  })
})
