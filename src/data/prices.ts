// Prices in DKK. Hand-editable; every value needs a `source` URL and `checkedOn` date.
// Never guess: an unconfirmed price stays null and the UI shows "price unknown".
//
// Phase 1: only free places are marked. Paid prices are filled in phase 5.

import type { Pricing } from './types'

const free = (source: string | null = null, checkedOn: string | null = null): Pricing => ({
  free: true,
  extras: [],
  source,
  checkedOn,
})

const unknown = (): Pricing => ({
  free: false,
  adult: null,
  senior: null,
  student: null,
  youth: null,
  childBands: [],
  freeUnderAge: null,
  includedInCopenhagenCard: null,
  extras: [],
  source: null,
  checkedOn: null,
})

/** Places that are public spaces or free to enter. */
const FREE_IDS = [
  'nyhavn',
  'latin-quarter',
  'magstraede',
  'christiansborg', // the tower; palace rooms are separate (phase 5 extras)
  'botanical-garden', // the garden; check whether the Palm House charges
  'black-diamond',
  'nyboder',
  'kastellet',
  'little-mermaid',
  'amalienborg', // the square; the museum is separate
  'marble-church', // the church; the dome tour is separate
  'christianshavn',
  'christiania',
  'assistens',
  'jaegersborggade',
  'superkilen',
  'kodbyen',
  'frederiksberg-gardens',
  'walk-stroget-nyhavn',
  'walk-harbour-loop',
  'walk-nyboder-amalienborg',
  'walk-norrebro',
  'dyrehaven',
]

export function pricingFor(placeId: string): Pricing {
  return FREE_IDS.includes(placeId) ? free() : unknown()
}
