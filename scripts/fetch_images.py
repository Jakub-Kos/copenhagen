import json, re, sys, time, urllib.parse, urllib.request, html
UA = {'User-Agent': 'copenhagen-guide-setup/0.1 (kubik.kos@gmail.com)'}
TITLES = {
 'nyhavn': 'Nyhavn', 'latin-quarter': 'Strøget', 'magstraede': 'Magstræde', 'christiansborg': 'Christiansborg Palace',
 'round-tower': 'Rundetårn', 'rosenborg': 'Rosenborg Castle', 'botanical-garden': 'University of Copenhagen Botanical Garden',
 'tivoli': 'Tivoli Gardens', 'glyptotek': 'Ny Carlsberg Glyptotek', 'national-museum': 'National Museum of Denmark',
 'smk': 'National Gallery of Denmark', 'designmuseum': 'Designmuseum Danmark', 'thorvaldsens': 'Thorvaldsens Museum',
 'black-diamond': 'Black Diamond (library)', 'torvehallerne': 'Torvehallerne', 'canal-tour': 'Gammel Strand',
 'nyboder': 'Nyboder', 'kastellet': 'Kastellet, Copenhagen', 'little-mermaid': 'The Little Mermaid (statue)',
 'amalienborg': 'Amalienborg', 'marble-church': "Frederik's Church", 'saviour-spire': 'Church of Our Saviour, Copenhagen',
 'christianshavn': 'Christianshavn Canal', 'christiania': 'Freetown Christiania', 'reffen': 'Refshaleøen',
 'copenhill': 'CopenHill', 'assistens': 'Assistens Cemetery (Copenhagen)', 'jaegersborggade': 'Jægersborggade',
 'superkilen': 'Superkilen', 'kodbyen': 'Kødbyen', 'frederiksberg-gardens': 'Frederiksberg Gardens',
 'walk-stroget-nyhavn': 'Kongens Nytorv', 'walk-harbour-loop': 'Copenhagen Opera House',
 'walk-nyboder-amalienborg': 'Gefion Fountain', 'walk-norrebro': "Queen Louise's Bridge",
 'louisiana': 'Louisiana Museum of Modern Art', 'kronborg': 'Kronborg', 'frederiksborg': 'Frederiksborg Palace',
 'viking-ship-museum': 'Viking Ship Museum (Roskilde)', 'dyrehaven': 'Jægersborg Dyrehave',
 'city-hall': 'Copenhagen City Hall', 'holmens-church': 'Holmen Church', 'david-collection': 'David Collection',
 'hirschsprung': 'Hirschsprung Collection', 'kongens-have': 'Rosenborg Castle Gardens', 'dac': 'BLOX',
 'cisternerne': 'Cisternerne', 'blue-planet': 'National Aquarium Denmark', 'grundtvig-church': "Grundtvig's Church",
 'walk-lakes': 'The Lakes, Copenhagen', 'dragor': 'Dragør', 'roskilde-cathedral': 'Roskilde Cathedral',
}
# Optional second argument: comma-separated ids to fetch (default: all).
if len(sys.argv) > 2:
    TITLES = {k: v for k, v in TITLES.items() if k in sys.argv[2].split(',')}
def get(url, params):
    u = url + '?' + urllib.parse.urlencode(params)
    for i in range(3):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30))
        except Exception as e:
            print('retry', e, file=sys.stderr); time.sleep(3)
    raise SystemExit('failed ' + u)

# 1. Wikipedia title -> Wikidata id
qids = {}
titles = list(TITLES.values())
for i in range(0, len(titles), 40):
    r = get('https://en.wikipedia.org/w/api.php', {'action': 'query', 'format': 'json', 'redirects': 1, 'prop': 'pageprops',
            'ppprop': 'wikibase_item', 'titles': '|'.join(titles[i:i+40])})
    norm = {n['from']: n['to'] for n in r['query'].get('normalized', []) + r['query'].get('redirects', [])}
    by_title = {p['title']: p.get('pageprops', {}).get('wikibase_item') for p in r['query']['pages'].values()}
    for t in titles[i:i+40]:
        tt = norm.get(norm.get(t, t), norm.get(t, t))
        qids[t] = by_title.get(tt)
# 2. Wikidata P18
files = {}
ids = [q for q in qids.values() if q]
for i in range(0, len(ids), 40):
    r = get('https://www.wikidata.org/w/api.php', {'action': 'wbgetentities', 'format': 'json', 'props': 'claims', 'ids': '|'.join(ids[i:i+40])})
    for q, ent in r['entities'].items():
        p18 = ent.get('claims', {}).get('P18')
        if p18: files[q] = p18[0]['mainsnak']['datavalue']['value']
# 3. Commons metadata
fnames = list(set(files.values()))
meta = {}
for i in range(0, len(fnames), 40):
    r = get('https://commons.wikimedia.org/w/api.php', {'action': 'query', 'format': 'json', 'prop': 'imageinfo',
            'iiprop': 'url|extmetadata', 'iiurlwidth': 960, 'titles': '|'.join('File:' + f for f in fnames[i:i+40])})
    norm = {n['to']: n['from'] for n in r['query'].get('normalized', [])}
    for p in r['query']['pages'].values():
        ii = p.get('imageinfo', [{}])[0]
        em = ii.get('extmetadata', {})
        strip = lambda s: html.unescape(re.sub(r'<[^>]+>', '', s or '')).strip()
        meta[norm.get(p['title'], p['title'])[5:]] = {
            'url': ii.get('thumburl'), 'page': ii.get('descriptionurl'),
            'author': strip(em.get('Artist', {}).get('value'))[:80],
            'license': strip(em.get('LicenseShortName', {}).get('value')),
        }
out = {}
for pid, t in TITLES.items():
    q = qids.get(t); f = files.get(q) if q else None; m = meta.get(f.replace('_', ' ')) if f else None
    if not m: m = meta.get(f) if f else None
    status = 'OK' if m and m['url'] else 'MISSING'
    print(f'{status:7} {pid:26} {t[:30]:30} {q} {f[:40] if f else ""} | {m["license"] if m else ""} | {m["author"][:30] if m else ""}')
    if m and m['url']: out[pid] = m
json.dump(out, open(sys.argv[1], 'w'), ensure_ascii=False, indent=1)
