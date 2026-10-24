# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A standalone Copenhagen guide and trip planner, specified in `copenhagen-trip-planner-prompt.md`. Read that file in full before starting any phase. It is the source of truth, except where this file overrides it below.

**Override of the spec:** the app is *not* built inside `Jakub-Kos/WebPage`. It is its own repo, published to its own GitHub Pages project site (`https://jakub-kos.github.io/copenhagen/`). WebPage only links to it from its pages (a plain `<a href>`, not a router route). So:
- Vite `base` must be `/copenhagen/`, and deep links must work on refresh.
- Deployment copies WebPage's `.github/workflows/deploy.yml` pattern (build `dist`, then `upload-pages-artifact` and `deploy-pages`).
- The look should match WebPage: React 19 + Vite + TypeScript + Tailwind v4 via `@tailwindcss/postcss`, a dark navy `#0b1220` header, Inter/system font, and light/dark mode through `prefers-color-scheme`. The header has a link back to the main site.

## Commands

- `npm run dev`: dev server at http://localhost:5173/copenhagen/
- `npm run build`: type-check (`tsc -b`) plus production build into `dist/`
- `npm run lint`: ESLint (react-refresh rule: `.tsx` files export only components; helpers go in `.ts` files such as `components/cls.ts`)
- `npm test`: Vitest. For one file: `npx vitest run src/logic/timeline.test.ts`; for one test, add `-t "name"`
- Deploy: push to `main`. `.github/workflows/deploy.yml` runs lint, tests and build, then publishes to Pages.

## Architecture

- **Routing**: `HashRouter` (`#/`, `#/plan?d=YYYY-MM-DD|settings`, `#/today`, `#/costs`, `#/info`, `#/print?d=`, `#/share/<lz-string trip>`). Deep links need no 404.html trick, and share data stays after `#`. `?lang=cs|en` works before or inside the hash.
- **Data** (`src/data/`):
  - `types.ts` is the model.
  - `places.ts` is the catalogue: 60 places in sections (centre, Frederiksstaden, Christianshavn, Nørrebro/Vesterbro/Frederiksberg, food & coffee, walks, day trips). It has helpers `daily()`/`closedMon()` for hours and shared walk waypoints in `P`.
  - `prices.ts` gives `pricingFor(id)`.
  - `images.ts` holds the photos and `practical.ts` the Info page.
  - `*.geo.json` are fixed OSM extracts: transit, landmarks, amenities.
- **Pure logic** (`src/logic/`, unit-tested):
  - `time.ts`: Copenhagen time via `Intl`; dates are `YYYY-MM-DD` strings, clock times are minutes since midnight. `cphToUtc` and `dstShiftAfter` are for calendar export and DST reminders.
  - `hours.ts`: seasonal opening hours
  - `geo.ts`: haversine × 1.3 detour estimate, Google Maps links, and `rejseplanenUrl`.
    - The Rejseplanen link is a rejseplanen.dk/web/ search with `SKOORD/SX/SY` and `ZKOORD/ZX/ZY` in micro-degrees, plus `date=DD.MM.YYYY`, `time=HH:MM` and `timeSel=depart`, or `SCURRENT=1` to start from the phone's location.
    - The format isn't documented: it was read from their web app and checked against the live site on 2026-10-24.
    - Transit legs in Plan and Today get a Rejseplanen button (`components/legTrip.ts` gives the departure time and English names, because Rejseplanen mangles Czech letters). Today also has "Home by public transport".
  - `timeline.ts`: day schedule, legs and warnings. Street walks enter at their first waypoint and exit at their last. `TimelineOptions.routes` (keyed by `legKey`) is where real Valhalla legs replace the estimates.
  - `filters.ts`: catalogue filtering and sorting
  - `sun.ts`: offline NOAA sunrise/sunset. It drives the `dark` warning (daylight-only stops past sunset) and `Timeline.sunset`.
  - `food.ts`: lunch. `lunchAfter` picks the stop after which the day breaks for lunch (none if a food stop is planned). `foodNear`/`lunchOptions` list open `food-market` places nearby, and `LunchHint` shows them in Plan (with "add here") and Today.
  - Also unit-tested, and described in their sections below: `weatherFit.ts`, `weatherSwap.ts`, `costs.ts`, `tiles.ts`, `amenities.ts`, `reminders.ts`, `ics.ts`, `sketch.ts`, `shareLocation.ts`, `polyline.ts`.
  - `suggest.ts`: "Suggest a day", a greedy fill. Each step picks the best-scoring unplanned place that's open for the whole visit, done before sunset if daylight-only, and within the day's hours/km including the way home. Food places are only picked for an arrival between 11:30 and 13:30, one per day. Score = rating, must-see bonus and lunch bonus, minus distance (which keeps the day clustered). `extraScore` is the hook for phase 4 weather.
- **State** (`src/state/`):
  - `store.ts`: reducer, context, `useActiveTrip`; persisted under `cph:*` localStorage keys via `storage.ts`
  - `tripOps.ts`: pure trip edits. Call `resuggestLegModes` after any reorder (up/down, drag & drop, optimise).
  - `share.ts`: `parseTrip` validates every untrusted trip (storage, import, link)
  - A `Trip` has `v: 1`; bump it and migrate in `parseTrip` when the shape changes.
- **Routing** (phase 2):
  - `services/valhalla.ts` holds all Valhalla calls, through one queue (≥1.1 s apart), with in-flight dedupe and a localStorage cache (`cph:route:*`, LRU of 300) keyed by `routeKey` (ordered coords + speed + language).
  - `state/routeStore.ts` shares results between components. `components/useRoutes.ts` requests them after a 600 ms debounce. Errors are retried after 60 s, and estimates stay on screen meanwhile.
  - `useRoutedTimeline` builds an estimate first, routes its walking legs and street walks (interior waypoints sent as `through`), and rebuilds with real routes. It also returns map `lines`: `route` when routed, `estimate`/`transit` dashed when not.
  - Optimise order uses `/optimized_route`, which keeps the first and last locations fixed. The Plan passes home as both, so every stop can move.
- **Weather** (phase 4):
  - `services/weather.ts` makes the Open-Meteo request, using unix timestamps converted with `cphParts` so the DST day has no duplicated or missing local hours, and wind in m/s.
  - `state/forecastStore.ts` + `useForecast()` cache it in `cph:forecast` and refetch when it's over an hour old, including when the tab becomes visible again.
  - `logic/weatherFit.ts` (pure): `conditionsOf(hoursIn(...))` → `weatherFit(place)` (score, wet/showery/windy) and `hintFor` ("good" / "better on <day>").
  - Wiring: `useTimeline` passes `weatherFor` so `buildTimeline` emits `rain`/`wind` warnings, and `DayPlanner` passes the fit score as `suggestDay`'s `extraScore`.
  - Swaps: `logic/weatherSwap.ts` `swapsFor` finds unplanned places near a rainy/windy stop that are open in the same slot. A place qualifies when its fit is ≥ 0 and at least 3 better than the stop's. `WeatherSwap` (Plan and Today, under stops with `rain`/`wind` warnings) offers "Swap" (`updateStop` placeId) and "Move to <day>" (`moveStopToDay`, from `hintFor`).
- **Costs** (phase 5):
  - Data:
    - `data/prices.ts` holds entry prices. Food places (kind `food-market`: food halls, cafés, bakeries, smørrebrød) are `NO_TICKET_IDS`, i.e. free with `noTicket: true` ("you pay for what you eat"); never put menu prices in. `paid()` defaults: students/seniors fall back to the adult price, under 18 free unless stated.
    - `data/transport.ts` holds the DOT single-ticket zone fares, City Pass Small/Large, Copenhagen Card prices and `estimateZones()` (distance-based, shown as "odhad").
  - Logic: `logic/costs.ts` (pure, tested):
    - `entryPrice`/`singleFares` handle per-traveller rules (2 under-12s free per adult, 67+ discount).
    - `costItems` turns the timelines into time-stamped items.
    - `optionsFor` evaluates none / City Pass / Card windows, each activated at the item it first covers.
    - `cardVerdicts` gives the per-traveller best option; kids cards only come with an adult card.
  - Other pieces:
    - `services/exchangeRates.ts` gets the ECB DKK→CZK rate via Frankfurter (cached 12 h).
    - `Trip.paid` holds the paid flags by cost-item key.
    - `Trip.czkRate` is a manual rate override.
- **Map style**: `components/mapStyle.ts`. Hand-made overlays, so the code works with both OpenFreeMap styles (their layer ids differ):
  - Green areas use the tiles.
  - Metro/S-tog/regional lines and stations come from `data/transit.geo.json`. The metro uses its official colours, with M1/M2 and M3/M4 offset where they share track. The S-tog uses one slate colour. The 🚇 button toggles them.
  - Landmark building outlines come from `data/landmarks.geo.json`.
  - Public toilets (points: fee / wheelchair / hours) and benches (one MultiPoint) come from `data/amenities.geo.json`. Toilets show from z13, with a "WC" label from z15 and a popup on tap (built with `textContent`, because OSM tags are untrusted). Benches show from z15.5. The 🚻 button toggles them (`mapAmenities`). `logic/amenities.ts` gives `nearestToilets`, which Today shows on the next-stop card (`ToiletNearby`).
  - These GeoJSON files are fixed OSM extracts (see `scripts/README.md`) and don't change between zoom levels.
  - Tile POIs, shields, one-way arrows and tile rail lines are hidden.
  - Overlays sit above the 3D `building` layers.
  - The Guide map passes `compactBelowZoom` (13.5): under it, markers become dots (CSS `.pins-small`).
- **Reminders**:
  - `logic/reminders.ts` computes them: book places with `bookingNeeded` (due the day before), when to leave each day, the recommended Copenhagen Card / City Pass (from `cardVerdicts`, with the time and place of first use), and the DST night. `upcoming()` filters to what is due by tomorrow. Ticked-off reminders live in `Trip.done`, which was added to v1 with a `{}` default in `parseTrip`.
  - `Reminders` on Today shows up to 3 reminders, with a list of all of them.
  - Phones get real alarms through an .ics export: `logic/ics.ts` writes UTC times via `cphToUtc`, VALARM and line folding, and `components/calendarExport.ts` builds the events. There is no server, so no push notifications.
- **Printable day sheets** (`#/print?d=YYYY-MM-DD|all`, linked from the Plan day and trip settings): `DaySheet` lays out one A4 page per day with a header (times, km, sunset, weather, emergency numbers, home), a tile-free SVG sketch map (`logic/sketch.ts`: north-up fit plus scale bar), the stops (hours, group price, warnings, notes) and the legs. Legs show turn-by-turn steps, dropping steps under 40 m. App chrome has `print:hidden`, `@page` is A4, and printing is always light.
- **Share where we are** (Today): `ShareLocation` reads the GPS once and builds a message with `logic/shareLocation.ts` (Google Maps link, time ± accuracy, next stop with its arrival time, home). It goes to `navigator.share`, with clipboard + `sms:` as the fallback. The app stores and sends nothing itself; keep it that way.
- **Practical info** (`#/info`): the content lives in `data/practical.ts` (emergency `tel:` numbers, tips, Danish phrases). Facts with a `source` were checked on 2026-10-24: 112/1813 at international.kk.dk, the embassy at mzv.gov.cz, Steno Apotek's 24 h hours on its own site, and the DKK 750 fine at international.kk.dk. Don't add facts you can't source.
- **Photos**: `data/images.ts`, from Wikimedia Commons with author and licence. Always show the credit, as `PlaceDetail` does. Use `thumb(img, 250|500|960)` from `components/placeImage.ts`; Wikimedia only serves its standard widths.
- **Offline** (phase 6):
  - `vite-plugin-pwa` (`registerType: 'prompt'`) precaches the app shell and guide data. Runtime caches: `cph-map-meta` (styles + tilejson, NetworkFirst), `cph-map` (tiles, fonts, sprites, CacheFirst), `cph-photos` (Wikimedia, CacheFirst). The names are shared by `vite.config.ts` and `services/offline.ts`; keep them in sync.
  - Images use `crossOrigin="anonymous"` so cached photos aren't opaque (opaque responses use a lot of storage quota).
  - "Save for offline" (`state/offlinePack.ts`, `OfflineCard` in Today and trip settings): it uses `routeStore.ensure` to route every planned day (`routeSpecs` from `logic/timeline.ts`, the same specs `useTimeline` requests). It then writes map tiles for the whole guide (`logic/tiles.ts`, z10–14; OpenFreeMap stops at z14) and the photos straight into Cache Storage. That's about 30 MB. The result, with a `planSig` to detect later plan changes, is stored as `cph:offline`.
  - `UpdatePrompt` offers new versions instead of reloading. `OfflineBanner` shows when `navigator.onLine` is false. `LiveRoute` draws a dashed direction line when there's no route.
- **UI**: bottom tabs Guide / Plan / Today / Costs / Info (`BottomNav`). `MapView` wraps MapLibre with HTML markers (border = weather exposure, gold ring = must-see, badge = stop number/✓) and one GeoJSON `lines` source. `useTimeline` is shared by `DayPlanner` (Plan) and the Today page.
- **i18n**: `i18n/en.ts` is the key source of truth (`cs.ts` is typed against it); use `useT()` → `t(key, vars)` and `bi(text)`.

## Phase status

Phases 1–6 of the spec are done. Later additions, each described above:
- food & coffee places with a lunch-nearby hint
- toilets and benches on the map
- rain/wind swap suggestions
- Rejseplanen links
- the Info page
- reminders with calendar export
- printable day sheets
- "share where we are"

Other entry points:
- Route builder: Guide `?r=id1,id2`.
- Live route from your location: inside the Today next-stop card.
- A bare site URL opens `#/today` when the active trip has stops today (`OpenToday`).

Unconfirmed prices (null, shown as "price unknown" or as a note):
- Tivoli (date-dependent, "from 200")
- Rosenborg
- Frederiksborg
- canal-tour child fares
- Cisternerne
- Den Blå Planet (date-dependent; range in a note)

## Required workflow (from the spec)

- Show a short plan and wait for approval before implementing.
- Build in six phases and **stop after each one for review**: (1) guide data + list + map + CS/EN, (2) Valhalla routing, (3) trips + day planner + share/export + Today view, (4) weather + suggestions, (5) group, prices, costs, Copenhagen Card calculator, (6) offline + polish.
- `npm run build` and lint must pass. Cost and card logic need Vitest tests. Before finishing, test with `npm run dev` on a phone-width viewport.

## Architecture constraints that span the spec

- **Two kinds of data**:
  - The guide is static data committed to the repo, as hand-editable typed files (`data/places.ts`, `data/prices.ts`).
  - Trips are per user and live in localStorage, with JSON export/import and sharing via the URL hash. Nothing about a trip, especially the home base, is hard-coded or committed, because the repo is public.
- **Network code goes only in** `services/valhalla.ts`, `services/weather.ts`, `services/exchangeRates.ts` and `services/offline.ts` (the offline download). Every call needs loading and error states, and a Valhalla outage or rate limit must not break the page.
- **Cost and Copenhagen Card logic are pure functions** with Vitest tests that cover group mixes and card windows (card hours start at first activation; the card is placed on the best run of consecutive days).
- **Valhalla**: the public FOSSGIS demo (`https://valhalla1.openstreetmap.de`) with the base URL in one config constant. Respect about 1 request/second (debounce and queue), and cache in localStorage keyed by the ordered coordinate list. Polylines use precision 6.
- **Map tiles**: free, no-key tiles whose policy allows this use, such as OpenFreeMap, with OSM attribution. Do not use tile.openstreetmap.org.
- **Time**: always use the `Europe/Copenhagen` zone, never fixed offsets. DST ends on 25 Oct 2026, in the middle of the first trip.

## Data rules

- Never invent prices. A price that can't be confirmed on an official site is `null`, and the UI shows "price unknown". Every price has a `source` URL and a `checkedOn` date. List any unconfirmed prices in the summary to the user.
- Every opening time starts as `verifyHours: true`. Set it to `false` only after checking the official site (OpenStreetMap hours stay `true`).
- Facts on the Info page (`data/practical.ts`) need an official source; leave out what can't be sourced.
- TypeScript strict mode, with no `any` in the data model.

## Users

The users are Czech parents walking around on phones, sometimes without the site owner. That means a Czech UI (CS/EN toggle, `?lang=cs` override), large readable text, clear turn-by-turn directions and offline-friendly behaviour. The "Today" view is their main entry point. About 14–15 km of walking a day is fine for them.

Keep the UI wording general: nothing in the app names the site owner. The header links to "Main site", and examples use "Hotel" / "Our flat".
