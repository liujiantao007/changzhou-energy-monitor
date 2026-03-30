
"""
测试列数是否匹配
"""

import pymysql
from pymysql.cursors import DictCursor

DB_CONFIG = {
    'host': '10.38.78.217',
    'port': 3220,
    'user': 'liujiantao',
    'password': 'Liujt!@#',
    'database': 'energy_management_2026',
    'charset': 'utf8mb4'
}

TARGET_TABLE = 'energy_charge_daily_summary'

# 从数据库获取真实的列（排除id）
conn = pymysql.connect(**DB_CONFIG)
cursor = conn.cursor(DictCursor)
cursor.execute(f"SHOW FULL COLUMNS FROM {TARGET_TABLE}")
columns = cursor.fetchall()
cursor.close()
conn.close()

real_columns = [col['Field'] for col in columns if col['Field'] != 'id']
print(f"数据库中实际需要插入的列数（排除id）: {len(real_columns)}")
print("列名列表:")
for i, col in enumerate(real_columns, 1):
    print(f"{i:2d}. {col}")
print()

# INSERT语句中定义的列
insert_columns = [
    'stat_date', 'district', 'grid', 'poi_name', 'electricity_type', 'electricity_attr',
    'meter_number', 'total_energy', 'total_cost',
    'overview_total_energy', 'overview_total_cost',
    'overview_poi_count', 'overview_device_count',
    'electricity_by_district_energy', 'electricity_by_grid_energy', 'electricity_by_poi_energy',
    'poi_stat_energy', 'poi_stat_cost',
    'electricity_type_energy', 'electricity_type_cost',
    'trend_daily_energy', 'trend_daily_cost',
    'trend_monthly_energy', 'trend_monthly_cost',
    'trend_yearly_energy', 'trend_yearly_cost',
    'record_count', 'created_at', 'updated_at',
    'mobile_cumulative_energy', 'mobile_poi_count',
    'tower_cumulative_energy', 'tower_poi_count',
    'direct_power_supply_energy', 'indirect_power_supply_energy',
    'direct_power_supply_cost', 'indirect_power_supply_cost',
    'mobile_electricity_fee', 'tower_electricity_fee'
]

# SELECT语句中返回的列
select_values = [
    'stat_date',
    'district',
    'grid',
    'MIN(poi_name)',
    'MIN(electricity_type)',
    'MIN(electricity_attr)',
    'MIN(meter)',
    'COALESCE(SUM(total_energy), 0)',
    'COALESCE(SUM(total_cost), 0)',
    'COALESCE(SUM(total_energy), 0)',
    'COALESCE(SUM(total_cost), 0)',
    'COUNT(DISTINCT poi_name)',
    'COUNT(DISTINCT meter)',
    'COALESCE(SUM(total_energy), 0)',
    'COALESCE(SUM(total_energy), 0)',
    'COALESCE(SUM(total_energy), 0)',
    'COALESCE(SUM(total_energy), 0)',
    'COALESCE(SUM(total_cost), 0)',
    'COALESCE(SUM(total_energy), 0)',
    'COALESCE(SUM(total_cost), 0)',
    'COALESCE(SUM(total_energy), 0)',
    'COALESCE(SUM(total_cost), 0)',
    'COALESCE(SUM(total_energy), 0)',
    'COALESCE(SUM(total_cost), 0)',
    'COUNT(*)',
    'NOW()',
    'NOW()',
    'COALESCE(SUM(CASE WHEN consumer = \'移动\' THEN total_energy ELSE 0 END), 0)',
    'COUNT(DISTINCT CASE WHEN consumer = \'移动\' THEN poi_name END)',
    'COALESCE(SUM(CASE WHEN consumer = \'电塔\' OR consumer = \'铁塔\' THEN total_energy ELSE 0 END), 0)',
    'COUNT(DISTINCT CASE WHEN consumer = \'电塔\' OR consumer = \'铁塔\' THEN poi_name END)',
    '0',
    '0',
    '0',
    '0',
    'COALESCE(SUM(CASE WHEN consumer = \'移动\' THEN total_cost ELSE 0 END), 0)',
    'COALESCE(SUM(CASE WHEN consumer = \'电塔\' OR consumer = \'铁塔\' THEN total_cost ELSE 0 END), 0)'
]

print(f"\nINSERT列数: {len(insert_columns)}")
print(f"SELECT值数: {len(select_values)}")
print()

if len(real_columns) != len(insert_columns):
    print("❌ INSERT列数与数据库实际列数不匹配！")
    print(f"\n缺失的列在INSERT中:")
    missing_in_insert = [col for col in real_columns if col not in insert_columns]
    for col in missing_in_insert:
        print(f"  - {col}")
    
    print(f"\nINSERT中多余的列:")
    extra_in_insert = [col for col in insert_columns if col not in real_columns]
    for col in extra_in_insert:
        print(f"  - {col}")

if len(insert_columns) != len(select_values):
    print("❌ INSERT列数与SELECT值数不匹配！")
else:
    print("✅ 列数匹配！")

