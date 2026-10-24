import { describe, expect, it } from 'vitest'
import { fitSketch, scaleBar } from './sketch'

describe('day sheet sketch', () => {
  const a = { lat: 55.6761, lng: 12.5683 }
  const b = { lat: 55.6867, lng: 12.5926 }

  it('fits the points inside the padded box, north up', () => {
    const s = fitSketch([a, b], 400, 200, 10)!
    for (const p of [a, b]) {
      const [x, y] = s.project(p)
      expect(x).toBeGreaterThanOrEqual(10 - 1e-9)
      expect(x).toBeLessThanOrEqual(390 + 1e-9)
      expect(y).toBeGreaterThanOrEqual(10 - 1e-9)
      expect(y).toBeLessThanOrEqual(190 + 1e-9)
    }
    // b is north-east of a: further right and higher up (smaller y).
    expect(s.project(b)[0]).toBeGreaterThan(s.project(a)[0])
    expect(s.project(b)[1]).toBeLessThan(s.project(a)[1])
  })

  it('keeps a sensible zoom for a single point', () => {
    const s = fitSketch([a], 400, 200)!
    expect(s.metresPerUnit).toBeGreaterThan(2)
    expect(s.project(a)).toEqual([200, 100])
  })

  it('picks a round scale bar', () => {
    expect(scaleBar(10, 80)).toEqual({ metres: 500, units: 50 })
    expect(scaleBar(2, 80).metres).toBe(100)
  })
})
