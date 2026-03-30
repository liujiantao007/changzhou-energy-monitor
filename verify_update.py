import pymysql
from datetime import datetime

DB_CONFIG = {
    'host': '10.38.78.217',
    'port': 3220,
    'user': 'liujiantao',
    'password': 'Liujt!@#',
    'database': 'energy_management_2026',
    'charset': 'utf8mb4'
}

conn = pymysql.connect(**DB_CONFIG)
cursor = conn.cursor()

date_str = '2026-03-12'

# 1. 源数据统计
source_sql = """
SELECT
    COUNT(*) as total_rows,
    COALESCE(SUM(度数), 0) as total_energy,
    COALESCE(SUM(电费), 0) as total_cost,
    COUNT(DISTINCT 归属单元) as district_count,
    COUNT(DISTINCT 归属网格) as grid_count,
    COUNT(DISTINCT poi名称) as poi_count
FROM energy_charge
WHERE 日期 = %s
"""
cursor.execute(source_sql, (date_str,))
source = cursor.fetchone()

# 2. 汇总表统计
target_sql = """
SELECT
    COUNT(*) as total_rows,
    COALESCE(SUM(total_energy), 0) as total_energy,
    COALESCE(SUM(total_cost), 0) as total_cost,
    COUNT(DISTINCT district) as district_count,
    COUNT(DISTINCT grid) as grid_count,
    COUNT(DISTINCT poi_name) as poi_count
FROM energy_charge_daily_summary
WHERE stat_date = %s
"""
cursor.execute(target_sql, (date_str,))
target = cursor.fetchone()

# 3. 检查NULL值问题
null_check_sql = """
SELECT
    COUNT(*) as total,
    SUM(CASE WHEN district IS NULL THEN 1 ELSE 0 END) as null_district,
    SUM(CASE WHEN grid IS NULL THEN 1 ELSE 0 END) as null_grid,
    SUM(CASE WHEN poi_name IS NULL THEN 1 ELSE 0 END) as null_poi
FROM energy_charge_daily_summary
WHERE stat_date = %s
"""
cursor.execute(null_check_sql, (date_str,))
null_check = cursor.fetchone()

cursor.close()
conn.close()

print('=' * 70)
print('2026-03-12 数据更新校验报告')
print('=' * 70)
print()
print('【源数据 vs 汇总数据 对比】')
print('-' * 70)
print(f'{"指标":<20} {"源数据(energy_charge)":<25} {"汇总表(energy_charge_daily_summary)":<25}')
print('-' * 70)
print(f'{"总记录数":<20} {source[0]:<25} {target[0]:<25}')
print(f'{"总度数":<20} {source[1]:<25,.2f} {target[1]:<25,.2f}')
print(f'{"总电费":<20} {source[2]:<25,.2f} {target[2]:<25,.2f}')
print(f'{"归属单元数":<20} {source[3]:<25} {target[3]:<25}')
print(f'{"归属网格数":<20} {source[4]:<25} {target[4]:<25}')
print(f'{"POI数量":<20} {source[5]:<25} {target[5]:<25}')
print('-' * 70)

energy_match = abs(float(source[1]) - float(target[1])) < 0.01
cost_match = abs(float(source[2]) - float(target[2])) < 0.01
rows_match = source[0] == target[0]

print()
print('【数据一致性验证】')
print('-' * 70)
status = "✅ 通过" if rows_match else "❌ 失败"
print(f'记录数一致: {status} (源:{source[0]} vs 目标:{target[0]})')
status = "✅ 通过" if energy_match else "❌ 失败"
print(f'总度数一致: {status} (差值:{abs(float(source[1])-float(target[1])):.2f})')
status = "✅ 通过" if cost_match else "❌ 失败"
print(f'总电费一致: {status} (差值:{abs(float(source[2])-float(target[2])):.2f})')
print('-' * 70)

print()
print('【NULL值检查】')
print('-' * 70)
print(f'总记录数: {null_check[0]}')
print(f'归属单元为NULL: {null_check[1]} 条')
print(f'归属网格为NULL: {null_check[2]} 条')
print(f'POI名称为NULL: {null_check[3]} 条')
print('-' * 70)
print()