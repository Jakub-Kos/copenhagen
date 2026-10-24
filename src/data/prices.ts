// Prices in DKK. Hand-editable; every value needs a `source` URL and `checkedOn` date.
// Never guess: an unconfirmed price stays null and the UI shows "price unknown".
//
// Paid prices checked on the official sites on 2026-10-23 (phase 5, in progress).
// Copenhagen Card inclusion from copenhagencard.com/attractions, same date.

import type { PaidPricing, Pricing } from './types'

const free = (source: string | null = null, checkedOn: string | null = null): Pricing => ({
  free: true,
  extras: [],
  source,
  checkedOn,
})

const unknown = (): PaidPricing => ({
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
  'city-hall', // the hall; the tower tour is separate
  'holmens-church',
  'david-collection',
  'kongens-have',
  'grundtvig-church',
  'walk-lakes',
  'dragor',
]

/** Food halls, cafés and restaurants: no entry fee, only what you buy. */
const NO_TICKET_IDS = [
  'torvehallerne',
  'reffen',
  'la-glace',
  'sankt-peders-bageri',
  'cafe-paludan',
  'schonnemann',
  'aamanns',
  'told-snaps',
  'palaegade',
  'lagkagehuset-christianshavn',
]

const C = '2026-10-23'
/** Places added later. */
const C2 = '2026-10-24'

type Paid = PaidPricing

/** Adult price etc.; students default to adult unless given; under-18s free unless stated. */
const paid = (p: Partial<Paid> & { adult: number | null; source: string }): Paid => ({
  ...unknown(),
  freeUnderAge: 18,
  checkedOn: C,
  ...p,
  senior: p.senior ?? p.adult,
  student: p.student ?? p.adult,
  youth: p.youth ?? p.student ?? p.adult,
})

const PAID: Record<string, Paid> = {
  'round-tower': paid({ adult: 60, student: 40, includedInCopenhagenCard: false, source: 'https://www.rundetaarn.dk/en/' }),
  glyptotek: paid({
    adult: 150,
    youth: 120,
    student: 120,
    includedInCopenhagenCard: true,
    freeTimes: { cs: 'Poslední středu v měsíci zdarma.', en: 'Free on the last Wednesday of each month.' },
    note: { cs: 'Online o 10 % levněji (135 / 108).', en: '10% cheaper online (135 / 108).' },
    source: 'https://glyptoteket.com/visit/tickets',
  }),
  'national-museum': paid({
    adult: 150,
    includedInCopenhagenCard: true,
    note: { cs: 'Online 135.', en: 'Online 135.' },
    source: 'https://nationalmuseet.dk/en/tickets',
  }),
  smk: paid({ adult: 140, youth: 95, student: 95, includedInCopenhagenCard: true, source: 'https://www.smk.dk/en/section/visit-smk/' }),
  designmuseum: paid({ adult: 140, youth: 90, student: 90, includedInCopenhagenCard: true, source: 'https://designmuseum.dk/en/besog-os/opening-hours-admission-2/' }),
  thorvaldsens: paid({
    adult: 110,
    student: null,
    includedInCopenhagenCard: true,
    freeTimes: { cs: 'Středa zdarma pro všechny; senioři zdarma v úterý.', en: 'Free for everyone on Wednesdays; seniors free on Tuesdays.' },
    source: 'https://www.thorvaldsensmuseum.dk/en',
  }),
  'saviour-spire': paid({
    adult: 70,
    senior: 53,
    student: 53,
    freeUnderAge: null,
    childBands: [{ minAge: 0, maxAge: 17, price: 20 }],
    includedInCopenhagenCard: true,
    note: { cs: 'Věk pro dětskou cenu není uveden. Doporučena rezervace.', en: 'Child age limit not stated. Booking recommended.' },
    source: 'https://www.vorfrelserskirke.dk/taarnet/',
  }),
  'canal-tour': paid({
    adult: 149,
    youth: null,
    freeUnderAge: null,
    includedInCopenhagenCard: true,
    note: {
      cs: 'Cena z Nyhavnu. Z Ved Stranden 209 (online 3+ dny předem 135). Dospělá cena od 16 let; dětské ceny neuvedeny.',
      en: 'Price from Nyhavn. From Ved Stranden 209 (135 online 3+ days ahead). Adult price from 16; child prices not listed.',
    },
    source: 'https://www.stromma.com/en-dk/copenhagen/sightseeing/sightseeing-by-boat/grand-tour/',
  }),
  tivoli: paid({
    adult: null,
    freeUnderAge: 3,
    includedInCopenhagenCard: true,
    note: {
      cs: 'Vstup od 200 DKK (děti 3–7 od 100), cena podle data. Atrakce zvlášť (jízdenka od 199).',
      en: 'Entry from 200 DKK (ages 3–7 from 100), price varies by date. Rides extra (ride pass from 199).',
    },
    source: 'https://shop.tivoli.dk/en/billetter-og-tivolikort',
  }),
  rosenborg: paid({
    adult: null,
    includedInCopenhagenCard: true,
    note: { cs: 'Do 18 let zdarma (nutná vstupenka). Online o 10 DKK levněji.', en: 'Under 18 free (ticket needed). 10 DKK cheaper online.' },
    source: 'https://denkongeligesamling.dk/en/rosenborg-castle/tickets/',
  }),
  louisiana: paid({ adult: 145, student: 130, includedInCopenhagenCard: true, source: 'https://louisiana.dk/en/plan-your-visit/opening-hours/' }),
  kronborg: paid({
    adult: 150,
    student: null,
    includedInCopenhagenCard: true,
    note: { cs: 'Online 135.', en: 'Online 135.' },
    source: 'https://www.kronborg.dk/en/',
  }),
  'viking-ship-museum': paid({
    adult: 130,
    student: 80,
    includedInCopenhagenCard: true,
    note: { cs: 'Zimní cena (19. 10.–30. 4.); v létě 165 / 105.', en: 'Winter price (19 Oct–30 Apr); summer 165 / 105.' },
    source: 'https://www.vikingeskibsmuseet.dk/en/visit-the-museum/opening-hours-and-admission',
  }),
  frederiksborg: paid({ adult: null, freeUnderAge: null, includedInCopenhagenCard: true, source: 'https://frederiksborg.dk/en/visit/' }),
  hirschsprung: paid({ adult: 110, youth: 75, includedInCopenhagenCard: true, source: 'https://www.hirschsprung.dk/en/', checkedOn: C2 }),
  dac: paid({
    adult: 135,
    student: 60,
    youth: 60,
    includedInCopenhagenCard: true,
    note: { cs: 'Online o 10 % levněji.', en: '10% cheaper online.' },
    source: 'https://dac.dk/en/visit/',
    checkedOn: C2,
  }),
  cisternerne: paid({
    adult: null,
    freeUnderAge: null,
    includedInCopenhagenCard: true,
    source: 'https://frederiksbergmuseerne.dk/da/billetter/',
    checkedOn: C2,
  }),
  'roskilde-cathedral': paid({
    adult: 80,
    senior: 60,
    student: 60,
    includedInCopenhagenCard: true,
    note: { cs: 'Sleva pro seniory od 67 let.', en: 'Senior discount from 67.' },
    source: 'https://www.roskildedomkirke.dk/besoeg',
    checkedOn: C2,
  }),
  'blue-planet': paid({
    adult: null,
    freeUnderAge: 3,
    includedInCopenhagenCard: false,
    note: {
      cs: 'Dospělí 249–259 DKK, děti 3–11 let 131–136 DKK podle data; online o 30 DKK levněji.',
      en: 'Adults 249–259 DKK, ages 3–11 131–136 DKK depending on the date; 30 DKK cheaper online.',
    },
    source: 'https://denblaaplanet.dk/en/visit-us/prices-and-opening-hours/',
    checkedOn: C2,
  }),
}

export function pricingFor(placeId: string): Pricing {
  if (NO_TICKET_IDS.includes(placeId)) return { free: true, noTicket: true, extras: [], source: null, checkedOn: null }
  if (FREE_IDS.includes(placeId)) return free()
  return PAID[placeId] ?? unknown()
}
