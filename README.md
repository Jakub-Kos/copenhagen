# Copenhagen guide & trip planner

A Czech/English Copenhagen guide and trip planner. Live site: https://jakub-kos.github.io/copenhagen/

- **Guide**: places and walks on a map, with filters (rain-friendly, open on a given day, free…).
- **Plan**: trips stored in your browser, day plans with an estimated timeline, and sharing by link or JSON.
- **Today**: today's plan with the next stop highlighted and one-tap navigation.

React + TypeScript + Vite + Tailwind + MapLibre (OpenFreeMap tiles, © OpenStreetMap contributors).

```sh
npm install
npm run dev     # http://localhost:5173/copenhagen/
npm test
npm run build
```

Guide data: `src/data/places.ts` (opening hours are marked unverified until checked) and `src/data/prices.ts`.
The full spec is in `copenhagen-trip-planner-prompt.md`.
