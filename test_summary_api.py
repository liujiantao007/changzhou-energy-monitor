import requests
import time

BASE_URL = 'http://127.0.0.1:5000'

print("=" * 70)
print("测试 /api/summary 端点")
print("=" * 70)

# 测试月汇总
print("\n月汇总测试:")
start = time.time()
try:
    response = requests.get(f'{BASE_URL}/api/summary?date_from=2026-03-01&date_to=2026-03-31', timeout=10)
    elapsed = time.time() - start
    data = response.json()
    print(f"   响应时间: {elapsed:.2f}秒")
    print(f"   总电费: {data.get('total_cost', 0):,.2f} 元")
    print(f"   总度数: {data.get('total_energy', 0):,.2f} kWh")
    print(f"   记录数: {data.get('record_count', 0):,}")
except Exception as e:
    print(f"   ❌ 失败: {e}")

# 测试年汇总
print("\n年汇总测试:")
start = time.time()
try:
    response = requests.get(f'{BASE_URL}/api/summary?date_from=2026-01-01&date_to=2026-12-31', timeout=10)
    elapsed = time.time() - start
    data = response.json()
    print(f"   响应时间: {elapsed:.2f}秒")
    print(f"   总电费: {data.get('total_cost', 0):,.2f} 元")
    print(f"   总度数: {data.get('total_energy', 0):,.2f} kWh")
    print(f"   记录数: {data.get('record_count', 0):,}")
except Exception as e:
    print(f"   ❌ 失败: {e}")

print("\n" + "=" * 70)