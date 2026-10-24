// Public transport and Copenhagen Card prices in DKK. Hand-editable; checked 2026-10-23.

/** DOT single tickets for adults by number of zones (2–17). Children 0–15 pay half; 67+ get 30 % off. */
export const SINGLE_TICKET = {
  source: 'https://dinoffentligetransport.dk/en/find-tickets/single-tickets',
  checkedOn: '2026-10-23',
  adultByZones: {
    2: 24, 3: 30, 4: 38, 5: 44, 6: 48, 7: 54, 8: 60,
    9: 66, 10: 72, 11: 78, 12: 84, 13: 92, 14: 98, 15: 104, 16: 110, 17: 116,
  } as Record<number, number>,
  childFactor: 0.5,
  childMaxAge: 15,
  seniorMinAge: 67,
  seniorFactor: 0.7,
  /** Two children under 12 travel free with each paying adult. */
  freeChildrenPerAdult: 2,
  freeChildMaxAge: 11,
}

export type PassHours = 24 | 48 | 72 | 96 | 120

/** DOT City Pass: Small = zones 1–4 incl. the airport, Large = zones 1–99 (Helsingør, Hillerød, Roskilde…). */
export const CITY_PASS = {
  source: 'https://dinoffentligetransport.dk/en/find-tickets/day-tickets/city-pass',
  checkedOn: '2026-10-23',
  small: { 24: 100, 48: 160, 72: 220, 96: 280, 120: 340 } as Record<PassHours, number>,
  large: { 24: 200, 48: 320, 72: 440, 96: 560, 120: 680 } as Record<PassHours, number>,
  /** 12–15 pay half; under 12 free (two per adult). */
  childFactor: 0.5,
}

export type CardVariant = 'discover' | 'hop'
export type CardAge = 'adult' | 'junior' | 'kids'

/**
 * Copenhagen Card. Adult 16+, Junior 12–15, Kids 3–11 (max two per adult), under 3 free.
 * DISCOVER includes public transport in zones 1–99 (also the airport); HOP has no transport.
 * Hours count from activation.
 */
export const COPENHAGEN_CARD = {
  source: 'https://copenhagencard.com/view/prices',
  checkedOn: '2026-10-23',
  prices: {
    discover: {
      24: { adult: 589, junior: 399, kids: 100 },
      48: { adult: 859, junior: 509, kids: 140 },
      72: { adult: 1039, junior: 589, kids: 180 },
      96: { adult: 1219, junior: 699, kids: 220 },
      120: { adult: 1419, junior: 789, kids: 260 },
    },
    hop: {
      24: { adult: 600, junior: 410, kids: 100 },
      48: { adult: 875, junior: 525, kids: 140 },
      72: { adult: 1050, junior: 600, kids: 180 },
    },
  } as Record<CardVariant, Partial<Record<PassHours, Record<CardAge, number>>>>,
  includesTransport: { discover: true, hop: false } as Record<CardVariant, boolean>,
}

/** Rough ring-zone count for a trip of `km` straight-line from central Copenhagen; marked as an estimate in the UI. */
export function estimateZones(km: number): number {
  return Math.min(17, Math.max(2, Math.ceil(km / 4.5) + 1))
}

/** Within this distance of the centre a trip stays in zones 1–4 (City Pass Small; the airport is ~8 km). */
export const SMALL_ZONE_RADIUS_KM = 9
