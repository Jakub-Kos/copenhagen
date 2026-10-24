# Data extraction scripts

One-off scripts that produced the committed map/photo data. Run them only to refresh it.

| Output | How |
|---|---|
| `src/data/transit.geo.json` | POST `transit.overpassql` to https://overpass-api.de/api/interpreter → `lines.json`, then `python3 -I build_transit.py lines.json ../src/data/transit.geo.json` |
| `src/data/landmarks.geo.json` | POST `landmarks.overpassql` → `lm.json`, then `python3 -I build_landmarks.py lm.json ../src/data/landmarks.geo.json` (OSM ids → place ids are listed in the script) |
| `src/data/amenities.geo.json` | POST `amenities.overpassql` → `am.json`, then `python3 -I build_amenities.py am.json ../src/data/amenities.geo.json` |
| `src/data/images.ts` | `python3 -I fetch_images.py images.json [id1,id2]` (optional ids fetch only those) (Wikipedia title → Wikidata P18 → Commons licence), then regenerate `images.ts` from the JSON; strip `?utm_…` from URLs |

Example: `curl -s --data-urlencode data@transit.overpassql https://overpass-api.de/api/interpreter -o lines.json`.
Data © OpenStreetMap contributors (ODbL); photos from Wikimedia Commons under the licences stored per image.
