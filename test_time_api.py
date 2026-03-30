import requests
import time

print("=" * 70)
print("时间维度 API 性能测试")
print("=" * 70)

BASE_URL = 'http://127.0.0.1:5000'

# 测试1: 最新日期数据
print("\n1. 日数据 (latest_date_only=true):")
start = time.time()
try:
    response = requests.get(f'{BASE_URL}/api/summary_data?latest_date_only=true', timeout=10)
    elapsed = time.time() - start
    data = response.json()
    cost = sum(item.get('AC', 0) for item in data.get('data', []))
    print(f"   ✅ 响应时间: {elapsed:.2f}秒")
    print(f"   数据量: {data.get('count', 0)} 条")
    print(f"   总电费: {cost:,.2f} 元")
except Exception as e:
    print(f"   ❌ 失败: {e}")

# 测试2: 月数据
print("\n2. 月数据 (2026-03):")
start = time.time()
try:
    response = requests.get(f'{BASE_URL}/api/summary_data?date_from=2026-03-01&date_to=2026-03-31', timeout=60)
    elapsed = time.time() - start
    data = response.json()
    cost = sum(item.get('AC', 0) for item in data.get('data', []))
    print(f"   响应时间: {elapsed:.2f}秒 (超时阈值60秒)")
    print(f"   数据量: {data.get('count', 0)} 条")
    print(f"   总电费: {cost:,.2f} 元")
    if elapsed < 60:
        print(f"   ✅ 测试通过")
    else:
        print(f"   ❌ 响应太慢")
except Exception as e:
    elapsed = time.time() - start
    print(f"   ❌ 失败 ({elapsed:.2f}秒): {e}")

# 测试3: 年数据
print("\n3. 年数据 (2026):")
start = time.time()
try:
    response = requests.get(f'{BASE_URL}/api/summary_data?date_from=2026-01-01&date_to=2026-12-31', timeout=120)
    elapsed = time.time() - start
    data = response.json()
    cost = sum(item.get('AC', 0) for item in data.get('data', []))
    print(f"   响应时间: {elapsed:.2f}秒 (超时阈值120秒)")
    print(f"   数据量: {data.get('count', 0)} 条")
    print(f"   总电费: {cost:,.2f} 元")
    if elapsed < 120:
        print(f"   ✅ 测试通过")
    else:
        print(f"   ❌ 响应太慢")
except Exception as e:
    elapsed = time.time() - start
    print(f"   ❌ 失败 ({elapsed:.2f}秒): {e}")

print("\n" + "=" * 70)