# Build: Copenhagen guide & trip planner for my personal site

## Context
- I live in Copenhagen. I want a **reusable Copenhagen guide + trip planner** on my personal site. First use: my parents (Czech) visiting **Saturday 24 Oct – Thursday 29 Oct 2026**. Later I'll reuse it when friends come for a weekend, so trips, dates and group must not be hard-coded.
- Repo: this repo (`Jakub-Kos/WebPage`) — React + TypeScript + Vite + Tailwind, deployed to GitHub Pages via the workflow in `.github/workflows`. The site already links to other projects.
- Users: me, my parents and later friends, mostly **on phones while walking around**. My parents will sometimes go out **on their own**, so the page must be usable without me (Czech UI, clear directions, works with poor signal).
- Walking: my parents walk a lot — ~20,000 steps (~14–15 km) a day is fine.

## Before writing code
1. Read the repo: how pages/projects are structured, whether there is a router, how projects are linked, the Tailwind theme and existing components. Match the existing look and conventions.
2. Check how GitHub Pages handles deep links in this setup (base path, SPA routing — use HashRouter or the 404.html redirect trick if needed) so the guide's URL works on refresh and in shared links.
3. Write a short plan (files to add, libraries, data model) and show it to me before implementing. Keep the existing build and deploy workflow working.

## Structure
- **Guide** (static, in the repo): the catalogue of places, walks and price data. Same for everyone.
- **Trips** (per user, in the browser): a trip = name, start/end dates, group, home base, day plans, extra costs. I can have several trips (e.g. "Parents Oct 2026", "Friends weekend"). Stored in localStorage, exportable/importable as JSON and shareable via a link (trip encoded in the URL hash). Home base is never committed to the repo — the site is public.

## Features

### 1. Places & walks catalogue
A typed data file (e.g. `src/projects/copenhagen/data/places.ts`) that I can edit by hand. Each entry:
- `id`, `name`, `kind`: `sight | museum | street-walk | park | viewpoint | food-market | neighbourhood | day-trip`
- `coords` (point) — for `street-walk` also an ordered list of waypoints so the walk is drawn along the actual streets
- `myRating` (1–5) and a `mustSee` flag
- `tags` (e.g. history, royal, design, food, hygge, view, free)
- `durationMin` (typical visit time) and optional `durationMax`
- `weather`: `indoor | covered | outdoor` (rain-friendliness), plus `windSensitive` (towers, boat tours, harbour)
- `openingHours` per weekday (null = closed) with optional seasonal ranges, `bookingNeeded`, `verifyHours: true` until I confirm
- `effort`: `easy | moderate | hard` (stairs, long distances)
- `bestTime` (morning / afternoon / evening / daylight-only), `notes`, `links` (official site)
- `description` in **Czech and English** (short, 1–3 sentences each)
- `pricing` — see section 6

Seed it with ~30 well-known entries with **accurate coordinates**; mark every opening time as `verifyHours: true` because they change seasonally. Suggested starting set (adjust/extend):
- Nyhavn, Strøget + Latin Quarter, Magstræde/Snaregade, Nyboder (yellow houses), Kastellet + Little Mermaid, Amalienborg + Frederik's Church (Marble Church), Christiansborg + free tower view, Round Tower, Rosenborg Castle + King's Garden, Botanical Garden + Palm House, Tivoli (check Halloween season dates/hours), Ny Carlsberg Glyptotek, National Museum, SMK, Designmuseum, Thorvaldsens Museum, Black Diamond (Royal Library), Church of Our Saviour spire (outdoor stairs — windSensitive), Christianshavn canals, Christiania, Torvehallerne, Reffen (check if open in late Oct), Assistens Cemetery + Jægersborggade, Superkilen, Vesterbro/Kødbyen, Frederiksberg Gardens, CopenHill, canal boat tour.
- Day trips (by train): Louisiana Museum (Humlebæk), Kronborg (Helsingør), Frederiksborg Castle (Hillerød), Viking Ship Museum (Roskilde), Dyrehaven deer park.
- Walks as `street-walk` entries: Strøget → Nyhavn, harbour loop (Nyhavn – Opera – Christianshavn), Nyboder → Kastellet → Amalienborg, Nørrebro loop.

UI: list + filters (kind, tag, rating, rain-friendly only, duration, effort, open on selected day, free / included in Copenhagen Card), sort by rating/duration/distance/price. Clicking an item highlights it on the map and opens a detail card showing the price **for the current group**.

### 2. Map
- MapLibre GL JS (or Leaflet) with free, no-key tiles whose usage policy allows this (e.g. OpenFreeMap or similar — check the policy; don't hammer tile.openstreetmap.org). Proper OSM attribution.
- Markers styled by `kind`, coloured/badged by rain-friendliness, ring for `mustSee`, marker for places already in the trip plan.
- "Where am I" button (browser geolocation) and the trip's home base.

### 3. Walking routes with Valhalla
- Use Valhalla `/route` with `costing: "pedestrian"` against the public FOSSGIS demo `https://valhalla1.openstreetmap.de`, with the base URL in one config constant (I may self-host later).
- Respect its fair-use limits (about 1 request/second per user): debounce, queue requests, cache responses (localStorage keyed by the ordered coordinate list).
- Click places on the map (or in a day's list) to build an ordered route; draw the decoded polyline (precision 6), show per-leg and total distance + walking time + approximate steps.
- **Walking-speed setting** per trip (`costing_options.pedestrian.walking_speed`), default ~4.5 km/h.
- "Optimise order" button using `/optimized_route` (keep first/last fixed).
- For `street-walk` entries, route through their waypoints so the line follows the actual street.
- Turn-by-turn instructions in a collapsible list (Valhalla `language: "cs-CZ"` or `en-US` following the UI language) — useful when my parents are on their own.
- "Route from my location to the next stop" and "route back to home base" buttons.
- Each leg can be marked **walk** or **public transport**; legs over a configurable threshold (default 3 km) are suggested as transport, with a link to open that leg in Rejseplanen / Google Maps. Transport legs feed the cost calculation (section 6).

### 4. Weather
- Open-Meteo forecast API (free, no key, CORS-enabled) for Copenhagen, `timezone=Europe/Copenhagen`: hourly `temperature_2m`, `apparent_temperature`, `precipitation_probability`, `precipitation`, `wind_speed_10m`, `wind_gusts_10m`, `weather_code`; daily `sunrise`, `sunset`, precipitation sum, max/min temp. Cache ~1 hour; show "last updated". Credit Open-Meteo (CC BY).
- For each trip day: compact hourly strip (icon, temp, rain %, wind), daylight window shaded.
- **Suggestions**: score each place per day/time block from weather fit (indoor high in rain, outdoor/windSensitive low in rain or strong wind), opening hours that weekday and daylight. Show "Good today" / "Better on <day>" hints.
- Days beyond the forecast range or with no data degrade gracefully (show "no forecast yet").

### 5. Day planner
- One tab per trip day (from the trip's dates). Add places to a day, reorder (drag & drop on desktop, up/down buttons on mobile), set a start time.
- Timeline: start time + visit durations + legs (walking time from Valhalla, fixed estimate for transport legs) → estimated arrival/leave times per stop; totals per day: km, steps, entry cost, transport cost.
- Warnings: arriving when closed, outdoor stop after sunset, outdoor stop during forecast rain, day too long (defaults: > 9 h or > 15 km walking, configurable per trip), must-sees not planned anywhere.
- "Suggest a day" heuristic: fill a day from unplanned places with the best weather/opening-hours fit, clustered geographically.
- "Today" view: opens straight to today's plan with the next stop highlighted — this is what my parents will use on their own.

### 6. Group, prices and Copenhagen Card calculator
**Group settings per trip**: list of travellers, each with a category and age: adult, senior (65+), student, youth, child (with age). Quick presets ("2 adults", "2 seniors", …).

**Price data** (`data/prices.ts`, hand-editable, every value with `source` URL and `checkedOn` date):
- Per place `pricing`: `free` flag, or prices in DKK per category (adult / senior / student / youth / child with age bands / under-X free), optional free days/hours, `includedInCopenhagenCard: boolean`, extra costs (e.g. tower ticket, Tivoli ride pass) as separate optional items.
- Public transport: ticket types relevant to visitors in the zones we use (single tickets by zones, City Pass / tourist passes by duration, airport and day-trip train fares to Helsingør, Humlebæk, Hillerød, Roskilde), child rules.
- Copenhagen Card variants (e.g. Discover / Hop) by duration, adult and child prices, what's included (transport area, attractions), rules for children travelling free with an adult, and the fact that hours count from first activation.
- **Look up current prices on the official websites** (attractions, DOT/Din Offentlige Transport, copenhagencard.com). Never invent numbers: if a price can't be confirmed, set it to `null` and show "price unknown" in the UI. Tell me in your summary which prices you couldn't confirm.

**Cost list**:
- For a trip: itemised list by day — each planned entry × travellers with their category price, transport legs/journeys, optional extra items, and manual entries I can add (food, souvenirs, anything) with a category.
- Totals per day, per person and for the whole trip, in DKK with **CZK conversion** (rate from a free exchange-rate API such as Frankfurter/ECB, with a manual override and the rate date shown).
- Mark each item paid / not paid; optional per-trip budget with progress.

**"Is the Copenhagen Card worth it?"**:
- For the planned days, compare per traveller: (a) pay-as-you-go entries + cheapest transport tickets/passes, vs (b) each Copenhagen Card duration, placed on the best window of consecutive days (activation at first use), with remaining days paid normally.
- Show the cheapest combination, the savings, and a short explanation ("the 72h card covers Sun–Tue: Rosenborg, Tivoli, canal tour, Louisiana + transport → saves 340 DKK per adult"). Re-calculate live when the plan or group changes.
- Show a "break-even" hint: how much more the plan would need for the card to pay off.

### 7. Language & practical
- UI in **Czech and English** with a toggle; default from the browser language, and a shared link can force a language (e.g. `?lang=cs`).
- Mobile-first, readable for older eyes (larger text option), good contrast in sunlight; dark mode if the site already has it.
- **Offline-friendly**: cache the app, guide data, last forecast and computed routes so a saved day plan still works with poor signal (PWA/service worker if it fits this Vite setup).
- Times always in the `Europe/Copenhagen` time zone, never fixed offsets (Denmark leaves summer time on Sun 25 Oct 2026, mid-trip).
- Add a card/link to the guide wherever the site lists its other projects.

## Quality bar
- TypeScript strict, no `any` in the data model; small focused components; network code isolated in `services/valhalla.ts`, `services/weather.ts`, `services/exchangeRates.ts`; cost and card logic in pure functions with unit tests (Vitest) covering group mixes and card windows.
- Loading/error states for every network call (Valhalla down or rate-limited must not break the page).
- `npm run build` and lint pass; test locally with `npm run dev` on a narrow (phone) viewport before finishing.
- Build in phases and stop after each for me to check:
  1. Guide data + list + map + Czech/English
  2. Valhalla routing (walking legs, directions, from-my-location)
  3. Trips + day planner + share/export + "Today" view
  4. Weather + suggestions
  5. Group, prices, cost list, Copenhagen Card calculator
  6. Offline support + polish
