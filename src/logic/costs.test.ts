import { describe, expect, it } from 'vitest'
import { placeById } from '@/data/places'
import { pricingFor } from '@/data/prices'
import type { Traveller } from '@/state/tripTypes'
import { newTrip } from '@/state/tripTypes'
import {
  type CostItem,
  cardPrice,
  cardVerdicts,
  cityPassPrice,
  costItems,
  entryPrice,
  optionsFor,
  singleFares,
  sumItems,
  windowDays,
} from './costs'
import { buildTimeline } from './timeline'

const person = (id: string, category: Traveller['category'], age: number | null = null): Traveller => ({
  id,
  name: id,
  category,
  age,
})
const adult = person('a1', 'adult')
const adult2 = person('a2', 'adult')
const senior = person('s', 'senior', 70)
const student = person('st', 'student')
const child = (id: string, age: number) => person(id, 'child', age)

describe('entryPrice', () => {
  it('uses category prices and age rules', () => {
    const g = pricingFor('glyptotek')
    expect(entryPrice(g, adult)).toBe(150)
    expect(entryPrice(g, student)).toBe(120)
    expect(entryPrice(g, child('c', 10))).toBe(0) // under 18 free
    expect(entryPrice(g, senior)).toBe(150) // no senior discount listed
  })

  it('handles child bands, adult-from-16 and unknown prices', () => {
    expect(entryPrice(pricingFor('saviour-spire'), child('c', 9))).toBe(20)
    expect(entryPrice(pricingFor('canal-tour'), child('c', 16))).toBe(149)
    expect(entryPrice(pricingFor('canal-tour'), child('c', 9))).toBeNull()
    expect(entryPrice(pricingFor('tivoli'), adult)).toBeNull()
    expect(entryPrice(pricingFor('tivoli'), child('c', 2))).toBe(0)
    expect(entryPrice(pricingFor('nyhavn'), adult)).toBe(0)
  })
})

describe('public transport fares', () => {
  it('lets two children under 12 ride free per adult', () => {
    const f = singleFares(2, [adult, child('k1', 5), child('k2', 8), child('k3', 10)])
    expect(f.get('a1')).toBe(24)
    expect(f.get('k1')).toBe(0)
    expect(f.get('k2')).toBe(0)
    expect(f.get('k3')).toBe(12) // third child: half price
  })

  it('charges teens half and gives 67+ a discount', () => {
    const f = singleFares(3, [adult, adult2, child('t', 14), senior])
    expect(f.get('t')).toBe(15)
    expect(f.get('s')).toBeCloseTo(21)
  })

  it('prices passes and cards by age', () => {
    expect(cityPassPrice('small', 72, adult)).toBe(220)
    expect(cityPassPrice('large', 24, child('t', 13))).toBe(100)
    expect(cityPassPrice('small', 24, child('k', 8))).toBe(0)
    expect(cardPrice('discover', 72, adult)).toBe(1039)
    expect(cardPrice('discover', 72, child('t', 13))).toBe(589)
    expect(cardPrice('discover', 72, child('k', 6))).toBe(180)
    expect(cardPrice('discover', 72, child('b', 1))).toBe(0)
    expect(cardPrice('hop', 120, adult)).toBeNull()
  })
})

/** Synthetic items: day index, hour, price for everyone, in-card flag. */
function items(group: Traveller[], spec: [number, number, 'entry' | 'transport', number | null, boolean?][]): CostItem[] {
  return spec.map(([day, hour, kind, price, inCard], i) => ({
    key: `i${i}`,
    kind,
    date: `d${day}`,
    at: day * 1440 + hour * 60,
    placeId: 'x',
    prices: Object.fromEntries(group.map((t) => [t.id, price])),
    inCard: kind === 'entry' ? (inCard ?? true) : null,
    cityPass: kind === 'transport' ? 'small' : undefined,
  }))
}

describe('Copenhagen Card windows', () => {
  it('recommends the card for a museum-heavy plan and places it from the first use', () => {
    const g = [adult, adult2]
    const day = (d: number): [number, number, 'entry' | 'transport', number | null][] => [
      [d, 10, 'entry', 150],
      [d, 12, 'transport', 30],
      [d, 13, 'entry', 150],
      [d, 16, 'entry', 150],
      [d, 18, 'transport', 30],
    ]
    const its = items(g, [...day(0), ...day(1), ...day(2)])
    const [v] = cardVerdicts(its, g)
    // Without card: 9 × 150 + 6 × 30 = 1530; a 72 h DISCOVER (1039) covers everything.
    expect(v.withoutCard.dkk).toBe(1530)
    expect(v.best.option).toMatchObject({ kind: 'card', variant: 'discover', hours: 72, start: 10 * 60 })
    expect(v.saving).toBe(1530 - 1039)
    expect(windowDays(v.best.option)).toEqual([0, 3])
  })

  it('puts a shorter card on the busiest days and pays the rest normally', () => {
    const g = [adult]
    const its = items(g, [
      [0, 11, 'entry', 150],
      [1, 10, 'entry', 150],
      [1, 12, 'entry', 150],
      [1, 15, 'entry', 150],
      [1, 17, 'entry', 150],
      [2, 9, 'entry', 150],
      [2, 11, 'entry', 150],
    ])
    const best = optionsFor(its, adult)[0]
    // 24 h from day 1 10:00 covers day 1 and day 2 before 10:00 → 589 + 150 + 150 = 889 vs 1050
    expect(best.option).toMatchObject({ kind: 'card', hours: 24, start: 1440 + 600 })
    expect(best.dkk).toBe(589 + 150 + 150)
  })

  it('does not count entries outside the card or uses a City Pass for many rides', () => {
    const g = [adult]
    const its = items(g, [
      [0, 10, 'entry', 60, false], // e.g. Round Tower: not in the card
      ...Array.from({ length: 8 }, (_, i): [number, number, 'transport', number] => [0, 11 + i, 'transport', 30]),
    ])
    const [v] = cardVerdicts(its, g)
    expect(v.best.option).toMatchObject({ kind: 'cityPass', size: 'small', hours: 24 })
    expect(v.best.dkk).toBe(60 + 100)
    expect(v.saving).toBeLessThan(0)
  })

  it('gives children no kids card unless an adult buys a card', () => {
    const kid = child('k', 8)
    const g = [adult, kid]
    // One museum: the adult is better off paying; the child would be "cheaper" with a kids card
    // only in theory (museums are free for them anyway).
    const its = items(g, [[0, 10, 'entry', 150]])
    for (const it of its) it.prices.k = 0
    const vs = cardVerdicts(its, g)
    expect(vs.every((v) => v.best.option.kind === 'none')).toBe(true)
    expect(vs[1].withCard).toBeNull()
  })

  it('keeps unknown prices visible instead of guessing', () => {
    const g = [adult]
    const its = items(g, [
      [0, 10, 'entry', null], // e.g. Tivoli, in the card
      [0, 13, 'entry', 150],
    ])
    expect(sumItems(its)).toEqual({ dkk: 150, unknown: 1 })
    const none = optionsFor(its, adult).find((o) => o.option.kind === 'none')!
    expect(none.unknownPaid).toBe(1)
  })
})

describe('costItems from a planned day', () => {
  it('prices entries per traveller and turns transit legs into estimated tickets', () => {
    let trip = newTrip('t', '2026-10-27', '2026-10-27')
    trip = { ...trip, group: [adult, child('k', 9)] }
    const day = {
      startTime: '09:00',
      stops: [
        { id: 's1', placeId: 'glyptotek', legMode: 'walk' as const, visitMin: null },
        { id: 's2', placeId: 'louisiana', legMode: 'transit' as const, visitMin: null },
      ],
    }
    const tl = buildTimeline(day, (id) => placeById.get(id), {
      date: '2026-10-27',
      speedKmh: 4.5,
      origin: null,
      maxDayHours: 12,
      maxDayKm: 20,
      transitThresholdKm: 3,
    })
    const its = costItems(trip, new Map([['2026-10-27', tl]]), ['2026-10-27'])
    expect(its.map((i) => i.key)).toEqual(['e:2026-10-27:s1', 't:2026-10-27:s2', 'e:2026-10-27:s2'])
    expect(its[0].prices).toEqual({ a1: 150, k: 0 })
    const ride = its[1]
    expect(ride.cityPass).toBe('large')
    expect(ride.zones).toBeGreaterThanOrEqual(9)
    expect(ride.prices.k).toBe(0) // under 12 with an adult
    expect(its[2].prices).toEqual({ a1: 145, k: 0 })
  })
})
