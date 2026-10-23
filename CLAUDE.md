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

- **Routing**: `HashRouter` (`#/`, `#/plan?d=YYYY-MM-DD|settings`, `#/today`, `#/share/<lz-string trip>`). Deep links need no 404.html trick, and share data stays after `#`. `?lang=cs|en` works before or inside the hash.
- **Data** (`src/data/`): `types.ts` is the model. `places.ts` is the catalogue, with helpers `daily()`/`closedMon()` for hours and shared walk waypoints in `P`. `prices.ts` gives `pricingFor(id)`; until phase 5, paid places return all-`null` prices.
- **Pure logic** (`src/logic/`, unit-tested):
  - `time.ts`: Copenhagen time via `Intl`; dates are `YYYY-MM-DD` strings, clock times are minutes since midnight
  - `hours.ts`: seasonal opening hours
  - `geo.ts`: haversine × 1.3 detour estimate, Google Maps links
  - `timeline.ts`: day schedule, legs and warnings. Street walks enter at their first waypoint and exit at their last. `TimelineOptions.routes` (keyed by `legKey`) is where real Valhalla legs replace the estimates.
  - `filters.ts`: catalogue filtering and sorting
  - `sun.ts`: offline NOAA sunrise/sunset. It drives the `dark` warning (daylight-only stops past sunset) and `Timeline.sunset`.
  - `suggest.ts`: "Suggest a day", a greedy fill. Each step picks the best-scoring unplanned place that's open for the whole visit, done before sunset if daylight-only, and within the day's hours/km including the way home. Score = rating, must-see bonus and lunch bonus, minus distance (which keeps the day clustered). `extraScore` is the hook for phase 4 weather.
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
- **UI**: `MapView` wraps MapLibre with HTML markers (border = weather exposure, gold ring = must-see, badge = stop number/✓) and one GeoJSON `lines` source. `useTimeline` is shared by `DayPlanner` (Plan) and the Today page.
- **i18n**: `i18n/en.ts` is the key source of truth (`cs.ts` is typed against it); use `useT()` → `t(key, vars)` and `bi(text)`.

## Phase status

Phases 1–4 are done. Route builder: Guide `?r=id1,id2`. Live route from your location: inside the Today next-stop card. A bare site URL opens `#/today` when the active trip has stops today (`OpenToday`). Entry/transport cost totals per day wait for phase 5 prices. Next is phase 5: group, prices (`data/prices.ts`), cost list and the Copenhagen Card calculator.

## Required workflow (from the spec)

- Show a short plan and wait for approval before implementing.
- Build in six phases and **stop after each one for review**: (1) guide data + list + map + CS/EN, (2) Valhalla routing, (3) trips + day planner + share/export + Today view, (4) weather + suggestions, (5) group, prices, costs, Copenhagen Card calculator, (6) offline + polish.
- `npm run build` and lint must pass. Cost and card logic need Vitest tests. Before finishing, test with `npm run dev` on a phone-width viewport.

## Architecture constraints that span the spec

- **Two kinds of data**:
  - The guide is static data committed to the repo, as hand-editable typed files (`data/places.ts`, `data/prices.ts`).
  - Trips are per user and live in localStorage, with JSON export/import and sharing via the URL hash. Nothing about a trip, especially the home base, is hard-coded or committed, because the repo is public.
- **Network code goes only in** `services/valhalla.ts`, `services/weather.ts` and `services/exchangeRates.ts`. Every call needs loading and error states, and a Valhalla outage or rate limit must not break the page.
- **Cost and Copenhagen Card logic are pure functions** with Vitest tests that cover group mixes and card windows (card hours start at first activation; the card is placed on the best run of consecutive days).
- **Valhalla**: the public FOSSGIS demo (`https://valhalla1.openstreetmap.de`) with the base URL in one config constant. Respect about 1 request/second (debounce and queue), and cache in localStorage keyed by the ordered coordinate list. Polylines use precision 6.
- **Map tiles**: free, no-key tiles whose policy allows this use, such as OpenFreeMap, with OSM attribution. Do not use tile.openstreetmap.org.
- **Time**: always use the `Europe/Copenhagen` zone, never fixed offsets. DST ends on 25 Oct 2026, in the middle of the first trip.

## Data rules

- Never invent prices. A price that can't be confirmed on an official site is `null`, and the UI shows "price unknown". Every price has a `source` URL and a `checkedOn` date. List any unconfirmed prices in the summary to the user.
- Every opening time starts as `verifyHours: true`.
- TypeScript strict mode, with no `any` in the data model.

## Users

The users are Czech parents walking around on phones, sometimes without the site owner. That means a Czech UI (CS/EN toggle, `?lang=cs` override), large readable text, clear turn-by-turn directions and offline-friendly behaviour. The "Today" view is their main entry point. About 14–15 km of walking a day is fine for them.
