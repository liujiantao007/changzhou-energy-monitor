import urllib.request
import json

url = 'http://127.0.0.1:5000/api/summary_data?date_from=2026-01-31&date_to=2026-03-31'
print(f'Testing API: {url}')

req = urllib.request.Request(url)
with urllib.request.urlopen(req, timeout=30) as response:
    data = json.loads(response.read().decode('utf-8'))
    success = data.get('success')
    count = len(data.get('data', []))
    latest_date = data.get('latest_date')
    print(f'Success: {success}')
    print(f'Count: {count}')
    print(f'Latest date: {latest_date}')
