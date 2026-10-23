import { describe, expect, it } from 'vitest'
import { placeById, places } from '@/data/places'
import { haversineM } from './geo'
import { hoursOn } from './hours'
import { type SuggestInput, suggestDay } from './suggest'
import { buildTimeline } from './timeline'

const base: SuggestInput = {
  date: '2026-10-27', // Tuesday
  day: { startTime: '09:30', stops: [] },
  candidates: places,
  planned: new Set(),
  origin: { lat: 55.6895, lng: 12.554 },
  speedKmh: 4.5,
  maxDayHours: 9,
  maxDayKm: 15,
  transitThresholdKm: 3,
}

const timelineOf = (input: SuggestInput, ids: { placeId: string; legMode: 'walk' | 'transit' }[]) =>
  buildTimeline(
    {
      startTime: input.day.startTime,
      stops: [...input.day.stops, ...ids.map((s, i) => ({ id: `s${i}`, placeId: s.placeId, legMode: s.legMode, visitMin: null }))],
    },
    (id) => placeById.get(id),
    { ...input, routes: undefined },
  )

describe('suggestDay', () => {
  it('fills a day without duplicates, day trips or limit violations', () => {
    const s = suggestDay(base)
    expect(s.length).toBeGreaterThanOrEqual(3)
    expect(new Set(s.map((x) => x.placeId)).size).toBe(s.length)
    expect(s.some((x) => placeById.get(x.placeId)!.kind === 'day-trip')).toBe(false)
    const tl = timelineOf(base, s)
    expect(tl.warnings).toEqual([])
  })

  it('starts with must-sees and keeps stops close together', () => {
    const s = suggestDay(base)
    expect(placeById.get(s[0].placeId)!.mustSee).toBe(true)
    for (let i = 1; i < s.length; i++) {
      const a = placeById.get(s[i - 1].placeId)!.coords
      const b = placeById.get(s[i].placeId)!.coords
      expect(haversineM(a, b)).toBeLessThan(2500)
    }
  })

  it('includes one lunch stop around midday', () => {
    const s = suggestDay(base)
    const tl = timelineOf(base, s)
    const food = tl.stops.filter((x) => x.place.kind === 'food-market')
    expect(food).toHaveLength(1)
    expect(food[0].arrive).toBeGreaterThanOrEqual(11 * 60 + 30)
    expect(food[0].arrive).toBeLessThanOrEqual(13 * 60 + 30)
  })

  it('skips places closed that day and places planned elsewhere', () => {
    const monday = { ...base, date: '2026-10-26', planned: new Set(['nyhavn']) }
    const s = suggestDay(monday)
    for (const x of s) {
      expect(hoursOn(placeById.get(x.placeId)!.openingHours, monday.date)).not.toBeNull()
    }
    expect(s.map((x) => x.placeId)).not.toContain('nyhavn')
  })

  it('only appends to an existing plan and stops when the day is full', () => {
    const busy = {
      ...base,
      day: { startTime: '09:30', stops: [{ id: 'x', placeId: 'tivoli', legMode: 'walk' as const, visitMin: 480 }] },
    }
    // Tivoli opens 11:00, so a 480-min visit already fills the day.
    expect(suggestDay(busy)).toEqual([])
  })

  it('lets an extra score (weather) steer the choice', () => {
    const indoorOnly = suggestDay({ ...base, extraScore: (p) => (p.weather === 'indoor' ? 0 : -100) })
    for (const x of indoorOnly.slice(0, 2)) expect(placeById.get(x.placeId)!.weather).toBe('indoor')
  })
})
