"""Overpass result (amenities.overpassql) -> src/data/amenities.geo.json.

Toilets become points with fee / wheelchair / opening_hours; benches become one MultiPoint
(there are thousands, and they need no properties). Private and customer-only toilets are dropped.
"""
import json, sys

src, dst = sys.argv[1], sys.argv[2]
els = json.load(open(src))['elements']
r5 = lambda v: round(v, 5)
toilets, benches, seen = [], [], set()
for e in els:
    t = e.get('tags', {})
    lat = e.get('lat', e.get('center', {}).get('lat'))
    lon = e.get('lon', e.get('center', {}).get('lon'))
    if lat is None:
        continue
    if t.get('amenity') == 'bench':
        if t.get('access') not in ('private', 'no'):
            benches.append([r5(lon), r5(lat)])
        continue
    if t.get('access') in ('private', 'no', 'customers', 'permissive_customers') or t.get('disused') == 'yes':
        continue
    key = (r5(lon), r5(lat))
    if key in seen:
        continue
    seen.add(key)
    fee = t.get('fee')
    props = {'kind': 'toilet', 'fee': 'yes' if fee and fee != 'no' else ('no' if fee == 'no' else None)}
    if t.get('wheelchair') in ('yes', 'limited'):
        props['wheelchair'] = True
    if t.get('opening_hours'):
        props['hours'] = t['opening_hours']
    toilets.append({'type': 'Feature', 'geometry': {'type': 'Point', 'coordinates': list(key)}, 'properties': props})

fc = {'type': 'FeatureCollection', 'features': toilets + [
    {'type': 'Feature', 'geometry': {'type': 'MultiPoint', 'coordinates': benches}, 'properties': {'kind': 'bench'}}]}
json.dump(fc, open(dst, 'w'), separators=(',', ':'))
print(f'{len(toilets)} toilets, {len(benches)} benches')
