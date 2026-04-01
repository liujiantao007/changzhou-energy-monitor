import urllib.request
import json

url = 'http://127.0.0.1:5000/api/summary_data?date_from=2026-02-19&date_to=2026-03-20'
print(f'Testing API: {url}')

req = urllib.request.Request(url)
with urllib.request.urlopen(req, timeout=30) as response:
    data = json.loads(response.read().decode('utf-8'))
    print(f'Success: {data.get("success")}')
    print(f'Count: {len(data.get("data", []))}')
    print(f'Latest date: {data.get("latest_date")}')
    print()
    print('First 5 records:')
    for i, item in enumerate(data.get('data', [])[:5]):
        print(f'{i+1}. date={item.get("A")}, energy={item.get("AB")}, district={item.get("J")}, grid={item.get("GRID")}')

    # Count unique dates
    dates = set(item.get('A') for item in data.get('data', []))
    print(f'\nUnique dates: {len(dates)}')
    print(f'Dates: {sorted(dates)[:10]}...')
