// Trip costs and "is the Copenhagen Card worth it?". Pure.
//
// Every planned entry and public-transport leg becomes a CostItem with a price per traveller
// (null = unknown) and a time, so passes can be placed on time windows: a pass of N hours
// activated at its first use covers what happens in the next N hours.

import { pricingFor } from '@/data/prices'
import {
  CITY_PASS,
  COPENHAGEN_CARD,
  type CardAge,
  type CardVariant,
  type PassHours,
  SINGLE_TICKET,
  SMALL_ZONE_RADIUS_KM,
  estimateZones,
} from '@/data/transport'
import type { Pricing } from '@/data/types'
import type { ExtraCost, Traveller, Trip } from '@/state/tripTypes'
import { CITY_CENTRE, haversineM } from './geo'
import type { Leg, Timeline } from './timeline'
import type { IsoDate } from './time'

// ---------------------------------------------------------------- per-traveller prices

/** Age used for pricing; categories without an age get a typical one. */
export function effectiveAge(t: Traveller): number | null {
  if (t.age !== null) return t.age
  if (t.category === 'senior') return 65
  if (t.category === 'youth' || t.category === 'student') return 22
  if (t.category === 'adult') return 40
  return null
}

/** Entry price for one traveller, or null when it isn't known. */
export function entryPrice(p: Pricing, t: Traveller): number | null {
  if (p.free) return 0
  const age = effectiveAge(t)
  if (age !== null && p.freeUnderAge !== null && age < p.freeUnderAge) return 0
  if (age !== null && age < 18) {
    const band = p.childBands.find((b) => age >= b.minAge && age <= b.maxAge)
    if (band) return band.price
    return age >= 16 ? p.adult : null
  }
  if (t.category === 'senior') return p.senior
  if (t.category === 'student') return p.student
  if (t.category === 'youth') return p.youth
  return p.adult
}

const isAdult = (t: Traveller) => (effectiveAge(t) ?? 0) >= 16

/**
 * Single-ticket fare per traveller for one ride. Children under 12 ride free, two per paying
 * adult; other children 0–15 pay half; 67+ get 30 % off.
 */
export function singleFares(zones: number, group: Traveller[]): Map<string, number> {
  const adultFare = SINGLE_TICKET.adultByZones[Math.min(17, Math.max(2, zones))]
  let freeSlots = group.filter(isAdult).length * SINGLE_TICKET.freeChildrenPerAdult
  const out = new Map<string, number>()
  // Youngest first, so the free slots go to the smallest children.
  for (const t of [...group].sort((a, b) => (effectiveAge(a) ?? 99) - (effectiveAge(b) ?? 99))) {
    const age = effectiveAge(t) ?? 40
    let fare = adultFare
    if (age <= SINGLE_TICKET.freeChildMaxAge && freeSlots > 0) {
      fare = 0
      freeSlots--
    } else if (age <= SINGLE_TICKET.childMaxAge) fare = adultFare * SINGLE_TICKET.childFactor
    else if (age >= SINGLE_TICKET.seniorMinAge) fare = adultFare * SINGLE_TICKET.seniorFactor
    out.set(t.id, fare)
  }
  return out
}

export function cityPassPrice(size: 'small' | 'large', hours: PassHours, t: Traveller): number {
  const age = effectiveAge(t) ?? 40
  if (age < 12) return 0
  return CITY_PASS[size][hours] * (age <= 15 ? CITY_PASS.childFactor : 1)
}

export function cardAge(t: Traveller): CardAge | 'free' {
  const age = effectiveAge(t)
  if (age === null) return 'kids'
  if (age < 3) return 'free'
  if (age <= 11) return 'kids'
  if (age <= 15) return 'junior'
  return 'adult'
}

export function cardPrice(v: CardVariant, hours: PassHours, t: Traveller): number | null {
  const a = cardAge(t)
  if (a === 'free') return 0
  return COPENHAGEN_CARD.prices[v][hours]?.[a] ?? null
}

// ---------------------------------------------------------------- cost items

export interface CostItem {
  /** Stable key, also used for the paid flag. */
  key: string
  kind: 'entry' | 'transport'
  date: IsoDate
  /** Minutes since the trip's first day 00:00 (for pass windows). */
  at: number
  placeId: string
  /** For transport: the zone count is estimated from distance. */
  zones?: number
  /** Price per traveller id; null = unknown. */
  prices: Record<string, number | null>
  /** Entry included in the Copenhagen Card (null = unknown). */
  inCard: boolean | null
  /** Which City Pass covers this ride. */
  cityPass?: 'small' | 'large'
}

const withinSmallZones = (leg: Leg) =>
  haversineM(leg.from, CITY_CENTRE) / 1000 <= SMALL_ZONE_RADIUS_KM &&
  haversineM(leg.to, CITY_CENTRE) / 1000 <= SMALL_ZONE_RADIUS_KM

function transportItem(key: string, date: IsoDate, at: number, placeId: string, leg: Leg, group: Traveller[]): CostItem {
  const km = haversineM(leg.from, leg.to) / 1000
  const zones = estimateZones(km)
  const fares = singleFares(zones, group)
  return {
    key,
    kind: 'transport',
    date,
    at,
    placeId,
    zones,
    prices: Object.fromEntries(group.map((t) => [t.id, fares.get(t.id) ?? null])),
    inCard: null,
    cityPass: withinSmallZones(leg) ? 'small' : 'large',
  }
}

/** All entries and public-transport legs of the planned days. */
export function costItems(trip: Trip, timelines: ReadonlyMap<IsoDate, Timeline>, dates: IsoDate[]): CostItem[] {
  const out: CostItem[] = []
  dates.forEach((date, dayIdx) => {
    const tl = timelines.get(date)
    if (!tl) return
    const base = dayIdx * 1440
    for (const s of tl.stops) {
      if (s.leg?.mode === 'transit') {
        out.push(transportItem(`t:${date}:${s.stopId}`, date, base + s.arrive - s.leg.minutes, s.place.id, s.leg, trip.group))
      }
      const p = pricingFor(s.place.id)
      if (p.free) continue
      out.push({
        key: `e:${date}:${s.stopId}`,
        kind: 'entry',
        date,
        at: base + s.arrive,
        placeId: s.place.id,
        prices: Object.fromEntries(trip.group.map((t) => [t.id, entryPrice(p, t)])),
        inCard: p.includedInCopenhagenCard,
      })
    }
    if (tl.homeLeg?.mode === 'transit') {
      const last = tl.stops.at(-1)
      if (last) out.push(transportItem(`t:${date}:home`, date, base + last.leave, last.place.id, tl.homeLeg, trip.group))
    }
  })
  return out
}

export interface Totals {
  /** Known amounts. */
  dkk: number
  /** Items (×travellers) whose price is unknown. */
  unknown: number
}

export function sumItems(items: CostItem[], travellerIds?: string[]): Totals {
  let dkk = 0
  let unknown = 0
  for (const it of items) {
    for (const [id, v] of Object.entries(it.prices)) {
      if (travellerIds && !travellerIds.includes(id)) continue
      if (v === null) unknown++
      else dkk += v
    }
  }
  return { dkk, unknown }
}

export const extrasTotal = (extras: ExtraCost[], date?: IsoDate | null) =>
  extras.filter((x) => date === undefined || x.date === date).reduce((s, x) => s + x.amountDkk, 0)

// ---------------------------------------------------------------- pass options

export type PassOption =
  | { kind: 'none' }
  | { kind: 'cityPass'; size: 'small' | 'large'; hours: PassHours; start: number }
  | { kind: 'card'; variant: CardVariant; hours: PassHours; start: number }

export interface OptionCost {
  option: PassOption
  /** Pass price + everything paid outside it. */
  dkk: number
  /** Unknown prices that this option still has to pay. */
  unknownPaid: number
  /** Items the pass covers. */
  covered: CostItem[]
}

const HOURS: PassHours[] = [24, 48, 72, 96, 120]

function evaluate(items: CostItem[], t: Traveller, option: PassOption, passPrice: number): OptionCost {
  let dkk = passPrice
  let unknownPaid = 0
  const covered: CostItem[] = []
  for (const it of items) {
    const price = it.prices[t.id]
    let isCovered = false
    if (option.kind !== 'none' && it.at >= option.start && it.at < option.start + option.hours * 60) {
      if (option.kind === 'cityPass') {
        isCovered = it.kind === 'transport' && (option.size === 'large' || it.cityPass === 'small')
      } else {
        isCovered =
          (it.kind === 'entry' && it.inCard === true) ||
          (it.kind === 'transport' && COPENHAGEN_CARD.includesTransport[option.variant])
      }
    }
    if (isCovered) covered.push(it)
    else if (price === null || price === undefined) unknownPaid++
    else dkk += price
  }
  return { option, dkk, unknownPaid, covered }
}

/** Every option for one traveller, cheapest first. Passes start at the time of an item they cover. */
export function optionsFor(items: CostItem[], t: Traveller): OptionCost[] {
  const out: OptionCost[] = [evaluate(items, t, { kind: 'none' }, 0)]
  const starts = [...new Set(items.map((i) => i.at))].sort((a, b) => a - b)
  const transitStarts = [...new Set(items.filter((i) => i.kind === 'transport').map((i) => i.at))]
  for (const hours of HOURS) {
    for (const size of ['small', 'large'] as const) {
      const price = cityPassPrice(size, hours, t)
      for (const start of transitStarts) out.push(evaluate(items, t, { kind: 'cityPass', size, hours, start }, price))
    }
    for (const variant of ['discover', 'hop'] as const) {
      const price = cardPrice(variant, hours, t)
      if (price === null) continue
      for (const start of starts) out.push(evaluate(items, t, { kind: 'card', variant, hours, start }, price))
    }
  }
  return out.sort((a, b) => a.dkk - b.dkk || a.unknownPaid - b.unknownPaid)
}

export interface CardVerdict {
  traveller: Traveller
  best: OptionCost
  /** Cheapest option without a Copenhagen Card (may include a City Pass). */
  withoutCard: OptionCost
  /** Cheapest Copenhagen Card option. */
  withCard: OptionCost | null
  /** withoutCard − withCard: positive = the card saves money. */
  saving: number | null
}

/**
 * Per traveller: cheapest way to pay for the plan with and without a Copenhagen Card.
 * Kids cards are only sold with an adult card, so children fall back to no card when no
 * adult in the group is better off with one.
 */
export function cardVerdicts(items: CostItem[], group: Traveller[]): CardVerdict[] {
  const raw = group.map((t) => {
    const opts = optionsFor(items, t)
    const withoutCard = opts.find((o) => o.option.kind !== 'card')!
    const withCard = opts.find((o) => o.option.kind === 'card') ?? null
    return { t, withoutCard, withCard }
  })
  const adultBuysCard = raw.some(
    (r) => isAdult(r.t) && r.withCard && r.withCard.dkk < r.withoutCard.dkk,
  )
  return raw.map(({ t, withoutCard, withCard }) => {
    const cardAllowed = withCard && (cardAge(t) !== 'kids' || adultBuysCard)
    const best = cardAllowed && withCard.dkk < withoutCard.dkk ? withCard : withoutCard
    return {
      traveller: t,
      best,
      withoutCard,
      withCard: cardAllowed ? withCard : null,
      saving: cardAllowed && withCard ? withoutCard.dkk - withCard.dkk : null,
    }
  })
}

/** First and last trip-day index a pass window touches. */
export function windowDays(o: PassOption): [number, number] | null {
  if (o.kind === 'none') return null
  return [Math.floor(o.start / 1440), Math.floor((o.start + o.hours * 60 - 1) / 1440)]
}
