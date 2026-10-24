import { describe, expect, it } from 'vitest'
import { placeById, places } from '@/data/places'
import type { DayPlan } from '@/state/tripTypes'
import { foodNear, lunchAfter, lunchOptions } from './food'
import { buildTimeline } from './timeline'

const opts = (date: string) => ({ date, speedKmh: 4.5, origin: null, maxDayHours: 12, maxDayKm: 20, transitThresholdKm: 3 })
const day = (startTime: string, ids: string[]): DayPlan => ({
  startTime,
  stops: ids.map((placeId, i) => ({ id: `s${i}`, placeId, legMode: 'walk' as const, visitMin: null })),
})
const tl = (d: DayPlan, date = '2026-10-27') => buildTimeline(d, (id) => placeById.get(id), opts(date))

describe('lunch', () => {
  it('breaks after the first stop that ends around lunchtime', () => {
    // Tuesday: National Museum 10:00 (≈2 h) then Glyptotek.
    const t = tl(day('10:00', ['national-museum', 'glyptotek']))
    expect(lunchAfter(t)).toBe(0)
  })

  it('gives no hint when the day already has a food stop or ends before lunch', () => {
    expect(lunchAfter(tl(day('10:00', ['national-museum', 'torvehallerne'])))).toBeNull()
    expect(lunchAfter(tl(day('08:00', ['nyhavn'])))).toBeNull()
  })

  it('finds open food places close by, nearest first', () => {
    const from = placeById.get('round-tower')!.coords
    const near = foodNear(from, '2026-10-27', 12 * 60, places, { speedKmh: 4.5 })
    expect(near.length).toBeGreaterThan(0)
    expect(near.every((n) => n.metres <= 1500 && n.place.kind === 'food-market')).toBe(true)
    expect([...near].sort((a, b) => a.metres - b.metres)).toEqual(near)
    // Sankt Peders Bageri is closed on Sundays.
    const sunday = foodNear(from, '2026-10-25', 12 * 60, places, { speedKmh: 4.5, max: 20 })
    expect(sunday.some((n) => n.place.id === 'sankt-peders-bageri')).toBe(false)
  })

  it('returns options after the lunch stop', () => {
    const o = lunchOptions(tl(day('10:00', ['national-museum', 'glyptotek'])), '2026-10-27', places, 4.5)
    expect(o?.after).toBe(0)
    expect(o?.options.length).toBeGreaterThan(0)
  })
})
