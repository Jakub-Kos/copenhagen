// Street address for every place (a walk's start point) via OpenStreetMap Nominatim reverse
// geocoding, written to src/data/addresses.json. One request every 1.1 s (Nominatim policy).
//
//   node --experimental-strip-types --no-warnings scripts/fetch_addresses.ts

import { writeFileSync } from 'node:fs'
import { places } from '../src/data/places.ts'

const OUT = new URL('../src/data/addresses.json', import.meta.url)
const UA = 'copenhagen-guide-setup/0.1 (kubik.kos@gmail.com)'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface NominatimAddress {
  road?: string
  pedestrian?: string
  footway?: string
  path?: string
  square?: string
  house_number?: string
  postcode?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
}

// Official addresses where the nearest-road guess is wrong or vague (checked by hand).
const OFFICIAL: Record<string, string> = {
  'tivoli': 'Vesterbrogade 3, 1630 København',
  'national-museum': 'Ny Vestergade 10, 1471 København',
  'smk': 'Sølvgade 48–50, 1307 København',
  'rosenborg': 'Øster Voldgade 4A, 1350 København',
  'glyptotek': 'Dantes Plads 7, 1556 København',
  'designmuseum': 'Bredgade 68, 1260 København',
  'botanical-garden': 'Gothersgade 128, 1123 København',
  'thorvaldsens': 'Bertel Thorvaldsens Plads 2, 1213 København',
  'city-hall': 'Rådhuspladsen 1, 1550 København',
  'david-collection': 'Kronprinsessegade 30, 1306 København',
  'museum-of-copenhagen': 'Stormgade 18, 1555 København',
  'charlottenborg': 'Nyhavn 2, 1051 København',
  'war-museum': 'Tøjhusgade 3, 1220 København',
  'workers-museum': 'Rømersgade 22, 1362 København',
  'zoo': 'Roskildevej 32, 2000 Frederiksberg',
  'louisiana': 'Gammel Strandvej 13, 3050 Humlebæk',
  'kronborg': 'Kronborg 2C, 3000 Helsingør',
  'arken': 'Skovvej 100, 2635 Ishøj',
  'ordrupgaard': 'Vilvordevej 110, 2920 Charlottenlund',
  'la-glace': 'Skoubogade 3, 1158 København',
  'sankt-peders-bageri': 'Sankt Peders Stræde 29, 1453 København',
  'cafe-paludan': 'Fiolstræde 10, 1171 København',
  'schonnemann': 'Hauser Plads 16, 1127 København',
  'aamanns': 'Øster Farimagsgade 10, 2100 København',
  'told-snaps': 'Toldbodgade 2, 1253 København',
  'palaegade': 'Palægade 8, 1261 København',
  'lagkagehuset-christianshavn': 'Torvegade 45, 1400 København'
}

const out: Record<string, string> = {}
for (const p of places) {
  const at = p.waypoints?.[0] ?? p.coords
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=1&lat=${at.lat}&lon=${at.lng}`
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'da' } })
  if (res.ok) {
    const a = ((await res.json()) as { address?: NominatimAddress }).address ?? {}
    const street = a.road ?? a.pedestrian ?? a.square ?? a.footway ?? a.path
    const town = a.city ?? a.town ?? a.village ?? a.municipality
    const line1 = street ? `${street}${a.house_number ? ` ${a.house_number}` : ''}` : null
    const line2 = [a.postcode, town].filter(Boolean).join(' ')
    if (line1 || line2) out[p.id] = [line1, line2].filter(Boolean).join(', ')
    console.log(p.id.padEnd(30), out[p.id] ?? '—')
  } else console.log(p.id, 'HTTP', res.status)
  await sleep(1100)
}
Object.assign(out, OFFICIAL)
writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n')
console.log(`wrote ${Object.keys(out).length} addresses`)
