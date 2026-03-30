import requests
import json

# 测试 API 数据
response = requests.get('http://127.0.0.1:5000/api/summary_data?latest_date_only=true')
data = response.json()

print('API 返回数据:')
print('  成功:', data['success'])
print('  数据条数:', data['count'])
print('  最新日期:', data.get('latest_date'))
print()
print('前 5 条数据:')
for i, item in enumerate(data['data'][:5]):
    print(f'  {i+1}. 日期:{item["A"]} 区域:{item["J"]} 网格:{item["GRID"]} 度数:{item["AB"]} 电费:{item["AC"]}')

# 统计区域数据
region_energy = {}
for item in data['data']:
    district = item['J'] or ''
    grid = item['GRID'] or ''
    region = grid if grid else district
    energy = item['AB'] or 0
    
    if region:
        if region not in region_energy:
            region_energy[region] = 0
        region_energy[region] += energy

print()
print('区域能耗统计 (前 10 个):')
for region, energy in sorted(region_energy.items(), key=lambda x: x[1], reverse=True)[:10]:
    print(f'  {region}: {energy:.2f} kWh')