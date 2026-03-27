import urllib.request
import json

try:
    url = "http://127.0.0.1:5000/api/data?page=1&page_size=100"
    print(f"Testing API: {url}")

    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=30) as response:
        print(f"Status code: {response.status}")
        data = json.loads(response.read().decode('utf-8'))

        print(f"Success: {data.get('success')}")
        print(f"Count: {data.get('count')}")
        print(f"Total: {data.get('total')}")
        print(f"Page: {data.get('page')}")
        print(f"Total Pages: {data.get('total_pages')}")

        if data.get('success') and data.get('data'):
            first_item = data['data'][0]
            print("\nFirst data item:")
            for key, value in first_item.items():
                print(f"  {key}: {value}")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
