import { describe, expect, it } from 'vitest'
import { placeById, places } from '@/data/places'
import type { Place } from '@/data/types'
import { buildTimeline } from './timeline'
import { type Fit, weatherFit } from './weatherFit'
import { swapsFor } from './weatherSwap'

const rainy = { rainMm: 6, rainProb: 90, wind: 4, gust: 8, feelsMin: 8 }
const dry = { ...rainy, rainMm: 0, rainProb: 5 }
const fitIn = (c: typeof rainy) => (p: Place): Fit => weatherFit(p, c)

const tlFor = (ids: string[], date = '2026-10-27') =>
  buildTimeline(
    { startTime: '10:00', stops: ids.map((placeId, i) => ({ id: `s${i}`, placeId, legMode: 'walk' as const, visitMin: null })) },
    (id) => placeById.get(id),
    { date, speedKmh: 4.5, origin: null, maxDayHours: 12, maxDayKm: 20, transitThresholdKm: 3 },
  )

describe('rain swaps', () => {
  it('offers nearby indoor places that are open, best first', () => {
    const tl = tlFor(['kastellet'])
    const swaps = swapsFor(tl.stops[0], '2026-10-27', places, new Set(['kastellet']), fitIn(rainy))
    expect(swaps.length).toBeGreaterThan(0)
    expect(swaps.length).toBeLessThanOrEqual(2)
    for (const s of swaps) {
      expect(s.place.weather).not.toBe('outdoor')
      expect(s.metres).toBeLessThanOrEqual(1500)
      expect(['day-trip', 'food-market', 'street-walk']).not.toContain(s.place.kind)
    }
  })

  it('never swaps a windy outdoor stop for another wet outdoor one', () => {
    const tl = tlFor(['little-mermaid'])
    const swaps = swapsFor(tl.stops[0], '2026-10-27', places, new Set(), fitIn({ ...rainy, wind: 15, gust: 24 }), { max: 50 })
    expect(swaps.length).toBeGreaterThan(0)
    expect(swaps.every((s) => s.fit.score >= 0 && s.place.weather !== 'outdoor')).toBe(true)
  })

  it('suggests nothing in dry weather', () => {
    const tl = tlFor(['kastellet'])
    expect(swapsFor(tl.stops[0], '2026-10-27', places, new Set(), fitIn(dry))).toEqual([])
  })

  it('skips planned places and places closed at that time', () => {
    const tl = tlFor(['kastellet'])
    const all = swapsFor(tl.stops[0], '2026-10-27', places, new Set(), fitIn(rainy), { max: 50 })
    const first = all[0].place.id
    const without = swapsFor(tl.stops[0], '2026-10-27', places, new Set([first]), fitIn(rainy), { max: 50 })
    expect(without.some((s) => s.place.id === first)).toBe(false)
    // Monday: the museums that close on Mondays are not offered.
    const mon = tlFor(['kastellet'], '2026-10-26')
    const monSwaps = swapsFor(mon.stops[0], '2026-10-26', places, new Set(), fitIn(rainy), { max: 50 })
    expect(monSwaps.some((s) => s.place.id === 'designmuseum')).toBe(false)
  })
})
