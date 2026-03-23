import urllib.request
import json

try:
    url = "http://127.0.0.1:5000/api/data"
    print(f"Testing API: {url}")
    
    with urllib.request.urlopen(url, timeout=10) as response:
        print(f"Status code: {response.status}")
        data = json.loads(response.read().decode('utf-8'))
        
        print(f"Success: {data.get('success')}")
        print(f"Count: {data.get('count')}")
        
        if data.get('success') and data.get('data'):
            first_item = data['data'][0]
            print("\nFirst data item:")
            for key, value in first_item.items():
                print(f"  {key}: {value}")
                
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
