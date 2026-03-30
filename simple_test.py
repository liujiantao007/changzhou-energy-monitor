
"""
简单的列数测试
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

# 定义我们要插入的列（排除id）
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

print(f"我们要插入的列数: {len(insert_columns)}")
print()

# 从数据库获取真实列
conn = pymysql.connect(**DB_CONFIG)
cursor = conn.cursor(DictCursor)
cursor.execute(f"SHOW FULL COLUMNS FROM {TARGET_TABLE}")
columns = cursor.fetchall()
cursor.close()
conn.close()

real_columns = [col['Field'] for col in columns if col['Field'] != 'id']
print(f"数据库中实际的列数（排除id）: {len(real_columns)}")
print()

# 检查是否匹配
if len(insert_columns) != len(real_columns):
    print("❌ 列数不匹配！")
else:
    print("✅ 列数匹配！")
    print()
    # 检查每一列是否一致
    all_match = True
    for i, (col1, col2) in enumerate(zip(insert_columns, real_columns), 1):
        if col1 != col2:
            print(f"❌ 列 {i} 不匹配: '{col1}' vs '{col2}'")
            all_match = False
        else:
            print(f"✅ 列 {i}: {col1}")
    
    if all_match:
        print("\n🎉 所有列都匹配！")

