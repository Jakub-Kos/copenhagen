import { describe, expect, it } from 'vitest'
import { placeById } from '@/data/places'
import type { DayPlan } from '@/state/tripTypes'
import { buildTimeline, legKey, suggestLegMode, walkKey } from './timeline'

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

  it('warns when a daylight-only stop runs past sunset', () => {
    // Kastellet is daylight-only; on 27 Oct the sun sets around 16:45.
    const early = buildTimeline({ startTime: '14:00', stops: [stop('kastellet')] }, lookup, opts)
    const late = buildTimeline({ startTime: '16:30', stops: [stop('kastellet')] }, lookup, opts)
    expect(early.warnings).not.toContainEqual({ kind: 'dark', stopId: 'kastellet' })
    expect(late.warnings).toContainEqual({ kind: 'dark', stopId: 'kastellet' })
  })

  it('warns about rain at outdoor stops and wind at wind-sensitive ones', () => {
    const wet = { score: -6, wet: true, showery: false, windy: true }
    const tl = buildTimeline(
      { startTime: '10:00', stops: [stop('kastellet'), stop('glyptotek'), stop('canal-tour')] },
      lookup,
      { ...opts, weatherFor: () => wet },
    )
    expect(tl.warnings).toContainEqual({ kind: 'rain', stopId: 'kastellet' })
    expect(tl.warnings).not.toContainEqual({ kind: 'rain', stopId: 'glyptotek' })
    expect(tl.warnings).toContainEqual({ kind: 'wind', stopId: 'canal-tour' })
    expect(tl.warnings).not.toContainEqual({ kind: 'wind', stopId: 'kastellet' })
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

describe('buildTimeline with real routes', () => {
  it('uses routed legs and street-walk lengths instead of estimates', () => {
    const nyhavn = placeById.get('nyhavn')!
    const amalienborg = placeById.get('amalienborg')!
    const walk = placeById.get('walk-stroget-nyhavn')!
    const routes = new Map([
      [legKey(nyhavn.coords, amalienborg.coords), { metres: 617, minutes: 9 }],
      [walkKey(walk.id), { metres: 2000, minutes: 25 }],
    ])
    const tl = buildTimeline(
      { startTime: '10:00', stops: [stop('walk-stroget-nyhavn'), stop('nyhavn'), stop('amalienborg')] },
      lookup,
      { ...opts, routes },
    )
    const leg = tl.stops[2].leg!
    expect(leg.estimated).toBe(false)
    expect(leg.metres).toBe(617)
    expect(tl.stops[2].arrive).toBe(tl.stops[1].leave + 9)
    // 2000 m inside the walk (which ends at Nyhavn, so no hop) + 617 m
    expect(tl.walkM).toBeCloseTo(2617)
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

describe('real public-transport journeys', () => {
  it('replace the transit estimate and add their walking', () => {
    const day = {
      startTime: '09:00',
      stops: [{ id: 'a', placeId: 'louisiana', legMode: 'transit' as const, visitMin: 60 }],
    }
    const home = { lat: 55.6895, lng: 12.554 }
    const o = { date: '2026-10-27', speedKmh: 4.5, origin: home, maxDayHours: 12, maxDayKm: 20, transitThresholdKm: 3 }
    const lookup = (id: string) => placeById.get(id)
    const est = buildTimeline(day, lookup, o)
    const leg = est.stops[0].leg!
    expect(leg.estimated).toBe(true)
    const real = buildTimeline(day, lookup, { ...o, transit: new Map([[legKey(leg.from, leg.to), { minutes: 66, walkMetres: 900 }]]) })
    expect(real.stops[0].leg).toMatchObject({ minutes: 66, estimated: false, walkMetres: 900 })
    expect(real.stops[0].arrive).toBe(9 * 60 + 66)
    expect(real.walkM).toBe(est.walkM + 900)
  })
})
