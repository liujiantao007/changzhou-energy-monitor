import json
f = open('data/常州区县网格地图.json', 'r', encoding='utf-8')
d = json.load(f)
f.close()
print('Type:', d['type'])
print('Features:', len(d['features']))
for feat in d['features']:
    name = feat['properties']['name']
    gtype = feat['geometry']['type']
    npts = len(feat['geometry']['coordinates'][0])
    print(f'  {name}: {gtype} ({npts} points)')
print('OK')
