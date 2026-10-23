import { describe, expect, it } from 'vitest'
import { placeById } from '@/data/places'
import type { DayPlan } from '@/state/tripTypes'
import { buildTimeline, suggestLegMode } from './timeline'

const lookup = (id: string) => placeById.get(id)
const opts = {
  date: '2026-10-27', // Tuesday
  speedKmh: 4.5,
  origin: null,
  maxDayHours: 9,
  maxDayKm: 15,
  transitThresholdKm: 3,
}
const stop = (placeId: string, extra: Partial<DayPlan['stops'][number]> = {}) => ({
  id: placeId,
  placeId,
  legMode: 'walk' as const,
  visitMin: null,
  ...extra,
})

describe('buildTimeline', () => {
  it('chains visit durations and walking legs', () => {
    const tl = buildTimeline({ startTime: '10:00', stops: [stop('nyhavn'), stop('amalienborg')] }, lookup, opts)
    expect(tl.stops[0].arrive).toBe(600)
    expect(tl.stops[0].leave).toBe(630) // Nyhavn 30 min
    const leg = tl.stops[1].leg!
    expect(leg.metres).toBeGreaterThan(500)
    expect(leg.metres).toBeLessThan(900)
    expect(tl.stops[1].arrive).toBeCloseTo(630 + leg.minutes)
    expect(tl.warnings).toEqual([])
  })

  it('honours a visit-time override', () => {
    const tl = buildTimeline({ startTime: '10:00', stops: [stop('nyhavn', { visitMin: 90 })] }, lookup, opts)
    expect(tl.stops[0].leave).toBe(690)
  })

  it('warns when a stop is closed at arrival', () => {
    const tl = buildTimeline(
      { startTime: '10:00', stops: [stop('glyptotek')] },
      lookup,
      { ...opts, date: '2026-10-26' }, // Monday
    )
    expect(tl.warnings).toContainEqual({ kind: 'closed', stopId: 'glyptotek' })
  })

  it('counts the inside of a street walk and returns home', () => {
    const home = { lat: 55.6761, lng: 12.5683 }
    const tl = buildTimeline({ startTime: '09:00', stops: [stop('walk-stroget-nyhavn')] }, lookup, { ...opts, origin: home })
    expect(tl.walkM).toBeGreaterThan(2500)
    expect(tl.homeLeg).not.toBeNull()
  })

  it('warns about long days', () => {
    const tl = buildTimeline(
      { startTime: '09:00', stops: [stop('tivoli', { visitMin: 600 })] },
      lookup,
      opts,
    )
    expect(tl.warnings.some((w) => w.kind === 'too-long')).toBe(true)
  })
})

describe('suggestLegMode', () => {
  it('suggests transport for day trips and walking in the centre', () => {
    const nyhavn = placeById.get('nyhavn')!
    expect(suggestLegMode(nyhavn, null, placeById.get('louisiana')!, 3)).toBe('transit')
    expect(suggestLegMode(nyhavn, null, placeById.get('amalienborg')!, 3)).toBe('walk')
    expect(suggestLegMode(null, null, nyhavn, 3)).toBe('walk')
  })
})
