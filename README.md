# Copenhagen guide & trip planner

A Czech/English guide and trip planner for Copenhagen, made for visitors walking around with a phone.
Live site: https://jakub-kos.github.io/copenhagen/

## Features

- **Guide**
  - 60 places, walks and day trips on a map, with photos, opening hours and prices.
  - Filters: rain-friendly, open on a given day, free, …
  - Includes food & coffee places (bakeries, smørrebrød, food halls).
  - The map shows the metro and S-tog lines, outlines of landmark buildings, public toilets and benches.
- **Plan**
  - Trips are stored in the browser, with a day timeline built from real walking routes.
  - Warnings for closed places, darkness, rain and wind.
  - Planning tools:
    - "Suggest a day": fills the day, with lunch at lunchtime.
    - "Optimise order": reorders the stops.
    - Drag & drop to reorder by hand.
  - Rain/wind swap suggestions.
  - A "lunch nearby" hint.
  - Rejseplanen links for public-transport legs.
  - Sharing by link or JSON.
- **Today**
  - The next stop with one-tap navigation, live route from your location and the nearest toilet.
  - Reminders: bookings, when to set off, Copenhagen Card, the clock change. They can be exported to the phone's calendar with alarms.
  - "Share where we are" as a message.
- **Costs**: entry and transport costs for your group, and whether a Copenhagen Card or City Pass pays off, in DKK and CZK.
- **Info**: emergency numbers to tap, practical tips and a few Danish words.
- **Print**: one A4 sheet per day (sketch map, times, prices, turn-by-turn directions), or save it as a PDF.
- **Offline**:
  - Works as an installable app.
  - "Save for offline" stores the routes for every planned day, the map of the whole guide and the photos (about 30 MB).

## Privacy

Trips (including where you stay) live only in your browser. They leave it only when you share a link or a file yourself. "Share where we are" reads your location once and puts it only into the message you send. There is no server.

## Development

React 19 + TypeScript + Vite + Tailwind v4 + MapLibre, with a PWA via vite-plugin-pwa.

```sh
npm install
npm run dev     # http://localhost:5173/copenhagen/
npm test
npm run lint
npm run build
```

Pushing to `main` runs lint, tests and the build, and deploys to GitHub Pages.

- Guide data: `src/data/places.ts`, `src/data/prices.ts` and `src/data/practical.ts`. Prices and facts carry their source; unconfirmed prices stay empty, and opening hours are marked unverified until checked.
- Map extracts and photos: `scripts/` (see `scripts/README.md`).
- The original spec is in `copenhagen-trip-planner-prompt.md`; the architecture notes are in `CLAUDE.md`.

## Data and services

| Kind | Source |
|---|---|
| Map tiles | [OpenFreeMap](https://openfreemap.org/) |
| Map data (transit lines, landmarks, toilets, benches) | © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors |
| Walking routes | [Valhalla](https://valhalla1.openstreetmap.de) (FOSSGIS) |
| Weather | [Open-Meteo](https://open-meteo.com/) (CC BY 4.0) |
| Exchange rates | ECB rates via [Frankfurter](https://frankfurter.dev/) |
| Photos | [Wikimedia Commons](https://commons.wikimedia.org/), credited per photo |
| Journey planning links | [Rejseplanen](https://www.rejseplanen.dk/) |
