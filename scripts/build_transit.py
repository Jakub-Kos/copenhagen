import json, math, sys
d = json.load(open(sys.argv[1]))
out_path = sys.argv[2]
rels = [e for e in d['elements'] if e['type'] == 'relation']
nodes = {e['id']: e for e in d['elements'] if e['type'] == 'node'}

def mode(r):
    t = r['tags']
    if t.get('route') == 'subway': return 'metro'
    if t.get('route') == 'light_rail': return 'stog'
    return 'regional'

def dp(pts, eps):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]
    def dist(p):
        (x1, y1), (x2, y2), (x, y) = a, b, p
        kx = math.cos(math.radians(55.7))
        x1, x2, x = x1 * kx, x2 * kx, x * kx
        dx, dy = x2 - x1, y2 - y1
        if dx == dy == 0: return math.hypot(x - x1, y - y1)
        t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
        return math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))
    i, m = max(((i, dist(p)) for i, p in enumerate(pts[1:-1], 1)), key=lambda z: z[1])
    if m > eps: return dp(pts[: i + 1], eps)[:-1] + dp(pts[i:], eps)
    return [a, b]

def chain(ways):
    """Join way geometries end-to-end where they touch (in member order, flipping as needed)."""
    lines = []
    for w in ways:
        g = [(p['lon'], p['lat']) for p in w]
        if lines:
            cur = lines[-1]
            if cur[-1] == g[0]: cur.extend(g[1:]); continue
            if cur[-1] == g[-1]: cur.extend(reversed(g[:-1])); continue
            if len(cur) and cur[0] == g[-1] and len(lines[-1]) == len(cur): pass
        lines.append(list(g))
    return lines

EPS = 0.00006  # ~6 m
features, stations = [], {}
for r in rels:
    m = mode(r)
    ref = r['tags'].get('ref', '').split(';')[0]
    colour = r['tags'].get('colour') or '#64748b'
    ways = [mem['geometry'] for mem in r['members'] if mem['type'] == 'way' and mem['role'] == '' and 'geometry' in mem]
    for line in chain(ways):
        if m == 'regional':
            line = [p for p in line if p[0] < 12.64]  # stop at the Øresund coast
        if len(line) < 2: continue
        line = dp(line, EPS)
        features.append({'type': 'Feature', 'properties': {'mode': m, 'ref': ref, 'colour': colour},
                         'geometry': {'type': 'LineString', 'coordinates': [[round(x, 5), round(y, 5)] for x, y in line]}})
    for mem in r['members']:
        if mem['type'] == 'node' and mem['role'].startswith('stop'):
            n = nodes.get(mem['ref'])
            if not n: continue
            name = n.get('tags', {}).get('name')
            if not name or (m == 'regional' and n['lon'] >= 12.64): continue
            key = (m, name)
            s = stations.setdefault(key, {'lon': n['lon'], 'lat': n['lat'], 'lines': []})
            if ref not in s['lines']: s['lines'].append(ref)
for (m, name), s in stations.items():
    features.append({'type': 'Feature', 'properties': {'mode': m, 'name': name, 'lines': ' '.join(sorted(s['lines']))},
                     'geometry': {'type': 'Point', 'coordinates': [round(s['lon'], 5), round(s['lat'], 5)]}})
json.dump({'type': 'FeatureCollection',
           'features': features}, open(out_path, 'w'), separators=(',', ':'), ensure_ascii=False)
lines = [f for f in features if f['geometry']['type'] == 'LineString']
print('lines', len(lines), 'points', sum(len(f['geometry']['coordinates']) for f in lines), 'stations', len(stations))
from collections import Counter
print(Counter((f['properties']['mode'], f['properties']['ref']) for f in lines))
