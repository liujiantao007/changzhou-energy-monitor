import requests
import json

print("=" * 60)
print("首页数据接口诊断报告")
print("=" * 60)

# 测试 1: 健康检查
print("\n1. API 健康检查")
try:
    response = requests.get('http://127.0.0.1:5000/api/health', timeout=5)
    health = response.json()
    print(f"   状态：{health.get('status', 'unknown')}")
    print(f"   数据库：{health.get('database', 'unknown')}")
except Exception as e:
    print(f"   ❌ 失败：{e}")

# 测试 2: 最新有效日期
print("\n2. 最新有效日期")
try:
    response = requests.get('http://127.0.0.1:5000/api/latest_valid_date', timeout=5)
    data = response.json()
    print(f"   最新日期：{data.get('latest_date', 'None')}")
except Exception as e:
    print(f"   ❌ 失败：{e}")

# 测试 3: 汇总数据 API
print("\n3. 汇总数据 API 测试 (/api/summary_data)")
try:
    response = requests.get('http://127.0.0.1:5000/api/summary_data?latest_date_only=true', timeout=10)
    data = response.json()
    print(f"   成功：{data.get('success', False)}")
    print(f"   数据条数：{data.get('count', 0)}")
    print(f"   最新日期：{data.get('latest_date', 'None')}")
    
    if data.get('count', 0) > 0:
        print(f"   第一条数据：{json.dumps(data['data'][0], ensure_ascii=False, indent=6)}")
        
        # 统计关键指标
        total_energy = sum(item.get('AB', 0) for item in data['data'])
        total_cost = sum(item.get('AC', 0) for item in data['data'])
        poi_set = set(item.get('L', '') for item in data['data'] if item.get('L'))
        device_set = set(item.get('B', '') for item in data['data'] if item.get('B'))
        
        print(f"\n   统计数据:")
        print(f"     总度数：{total_energy:,.2f} kWh")
        print(f"     总电费：{total_cost:,.2f} 元")
        print(f"     POI 数量：{len(poi_set)}")
        print(f"     设备数量：{len(device_set)}")
    else:
        print(f"   ⚠️ 警告：API 返回数据为空")
except Exception as e:
    print(f"   ❌ 失败：{e}")

# 测试 4: 统计 API
print("\n4. 统计 API 测试 (/api/summary)")
try:
    response = requests.get('http://127.0.0.1:5000/api/summary', timeout=10)
    data = response.json()
    print(f"   成功：{data.get('success', False)}")
    print(f"   总度数：{data.get('total_energy', 0):,.2f} kWh")
    print(f"   总电费：{data.get('total_cost', 0):,.2f} 元")
    print(f"   记录数：{data.get('record_count', 0)}")
except Exception as e:
    print(f"   ❌ 失败：{e}")

print("\n" + "=" * 60)
print("诊断完成")
print("=" * 60)