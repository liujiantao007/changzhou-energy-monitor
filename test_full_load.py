import urllib.request
import json

try:
    print("Testing full data load (all 2.1M records)...")
    print("This may take several minutes...")
    print("")

    url = "http://127.0.0.1:5000/api/data"
    print(f"API: {url}")

    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=600) as response:
        print(f"Status code: {response.status}")
        data = json.loads(response.read().decode('utf-8'))

        print(f"Success: {data.get('success')}")
        print(f"Count (loaded): {data.get('count')}")
        print(f"Total (in DB): {data.get('total')}")
        print(f"Page: {data.get('page')}")
        print(f"Total Pages: {data.get('total_pages')}")

        if data.get('success') and data.get('data') and len(data['data']) > 0:
            first_item = data['data'][0]
            print("\nFirst data item:")
            for key, value in first_item.items():
                print(f"  {key}: {value}")

            last_item = data['data'][-1]
            print("\nLast data item:")
            for key, value in last_item.items():
                print(f"  {key}: {value}")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
