import json, sys
d = json.load(open(sys.argv[1]))
PLACE = {
  'w25524592': 'rosenborg', 'w25992657': 'christiansborg', 'w1011492033': 'round-tower', 'w25524833': 'marble-church',
  'w25451395': 'smk', 'w25607908': 'saviour-spire', 'w429610236': 'copenhill', 'w33177718': 'viking-ship-museum',
  'w25524645': 'amalienborg', 'w106105298': 'amalienborg', 'w106105466': 'amalienborg', 'w106228713': 'amalienborg',
  'w129196987': 'torvehallerne', 'w129196988': 'torvehallerne',
  'w185761305': 'louisiana', 'w185761309': 'louisiana', 'w185761312': 'louisiana', 'w185761314': 'louisiana',
  'w185761328': 'louisiana', 'w185761315': 'louisiana',
  'r1322262': 'glyptotek', 'r1989714': 'national-museum', 'r5693118': 'designmuseum', 'r2351676': 'thorvaldsens',
  'r19856927': 'black-diamond', 'r1588209': 'kronborg', 'r5711987': 'frederiksborg',
}
pt = lambda p: [round(p['lon'], 6), round(p['lat'], 6)]

def rings(ways):
    """Join open ways into closed rings."""
    segs = [[pt(p) for p in w] for w in ways]
    out = []
    while segs:
        ring = segs.pop(0)
        changed = True
        while ring[0] != ring[-1] and changed:
            changed = False
            for i, s in enumerate(segs):
                if s[0] == ring[-1]: ring += s[1:]
                elif s[-1] == ring[-1]: ring += s[::-1][1:]
                elif s[-1] == ring[0]: ring = s[:-1] + ring
                elif s[0] == ring[0]: ring = s[::-1][:-1] + ring
                else: continue
                segs.pop(i); changed = True; break
        if ring[0] == ring[-1] and len(ring) >= 4: out.append(ring)
    return out

feats = []
for e in d['elements']:
    key = e['type'][0] + str(e['id'])
    pid = PLACE.get(key)
    if not pid: continue
    if e['type'] == 'way':
        geom = {'type': 'Polygon', 'coordinates': [[pt(p) for p in e['geometry']]]}
    else:
        outer = rings([m['geometry'] for m in e['members'] if m['type'] == 'way' and m['role'] == 'outer'])
        inner = rings([m['geometry'] for m in e['members'] if m['type'] == 'way' and m['role'] == 'inner'])
        # Each outer ring with the inner rings that lie in it (by first point, bounding box test is enough here).
        def inside(r, o):
            xs, ys = [p[0] for p in o], [p[1] for p in o]
            return min(xs) <= r[0][0] <= max(xs) and min(ys) <= r[0][1] <= max(ys)
        polys = [[o] + [i for i in inner if inside(i, o)] for o in outer]
        geom = {'type': 'MultiPolygon', 'coordinates': polys}
    feats.append({'type': 'Feature', 'properties': {'placeId': pid, 'name': e['tags'].get('name', '')}, 'geometry': geom})
json.dump({'type': 'FeatureCollection', 'features': feats}, open(sys.argv[2], 'w'), separators=(',', ':'), ensure_ascii=False)
from collections import Counter
print(len(feats), Counter(f['properties']['placeId'] for f in feats))
print('missing', sorted(set(PLACE.values()) - {f['properties']['placeId'] for f in feats}))
