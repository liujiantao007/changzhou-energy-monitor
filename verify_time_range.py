import requests

print("=" * 70)
print("问题验证：检查不同时间维度的数据量")
print("=" * 70)

BASE_URL = 'http://127.0.0.1:5000'

# 测试1: 最新日期数据（2026-03-12）
print("\n1. 最新日期数据 (latest_date_only=true)")
response = requests.get(f'{BASE_URL}/api/summary_data?latest_date_only=true', timeout=30)
data = response.json()
print(f"   数据条数: {data.get('count', 0)}")
print(f"   日期范围: {data.get('latest_date', 'N/A')}")

# 计算总电费
total_cost_day = sum(item.get('AC', 0) for item in data.get('data', []))
print(f"   总电费: {total_cost_day:,.2f} 元")

# 测试2: 月数据（2026年3月）
print("\n2. 月数据 (date_from=2026-03-01, date_to=2026-03-31)")
response = requests.get(f'{BASE_URL}/api/summary_data?date_from=2026-03-01&date_to=2026-03-31', timeout=30)
data = response.json()
print(f"   数据条数: {data.get('count', 0)}")
if data.get('count', 0) > 0:
    dates = set(item.get('A', '') for item in data.get('data', []))
    print(f"   日期数量: {len(dates)}")
    print(f"   日期列表: {sorted(dates)[:10]}")

total_cost_month = sum(item.get('AC', 0) for item in data.get('data', []))
print(f"   总电费: {total_cost_month:,.2f} 元")

# 测试3: 年数据（2026年全年）
print("\n3. 年数据 (date_from=2026-01-01, date_to=2026-12-31)")
response = requests.get(f'{BASE_URL}/api/summary_data?date_from=2026-01-01&date_to=2026-12-31', timeout=60)
data = response.json()
print(f"   数据条数: {data.get('count', 0)}")
if data.get('count', 0) > 0:
    dates = set(item.get('A', '') for item in data.get('data', []))
    print(f"   日期数量: {len(dates)}")
    print(f"   日期范围: {min(dates)} 至 {max(dates)}")

total_cost_year = sum(item.get('AC', 0) for item in data.get('data', []))
print(f"   总电费: {total_cost_year:,.2f} 元")

print("\n" + "=" * 70)
print("对比结果:")
print(f"   日电费: {total_cost_day:,.2f} 元")
print(f"   月电费: {total_cost_month:,.2f} 元")
print(f"   年电费: {total_cost_year:,.2f} 元")

if total_cost_day == total_cost_month == total_cost_year:
    print("\n⚠️ 警告：所有维度电费相同，说明数据源不足！")
else:
    print("\n✅ 数据正常：不同维度有不同的电费值")

print("=" * 70)