
"""
测试 API 返回的数据
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

conn = pymysql.connect(**DB_CONFIG)
cursor = conn.cursor(DictCursor)

try:
    print("=" * 70)
    print("测试 API 数据查询")
    print("=" * 70)
    
    # 获取最新日期的数据（和 API 一样）
    print("\n[1] 获取最新日期的数据（和 /api/summary_data 一样的查询）...")
    cursor.execute("""
        SELECT stat_date, district, grid, poi_name,
               electricity_type, electricity_attr,
               total_energy, total_cost,
               overview_total_energy, overview_total_cost,
               overview_poi_count, overview_device_count,
               electricity_by_district_energy, electricity_by_grid_energy, electricity_by_poi_energy,
               poi_stat_energy, poi_stat_cost,
               electricity_type_energy, electricity_type_cost,
               trend_daily_energy, trend_daily_cost,
               trend_monthly_energy, trend_monthly_cost,
               trend_yearly_energy, trend_yearly_cost,
               record_count,
               mobile_cumulative_energy, mobile_poi_count,
               tower_cumulative_energy, tower_poi_count,
               mobile_electricity_fee, tower_electricity_fee,
               direct_power_supply_energy, direct_power_supply_cost,
               indirect_power_supply_energy, indirect_power_supply_cost
        FROM energy_charge_daily_summary
        WHERE district IS NOT NULL AND grid IS NOT NULL
        ORDER BY stat_date DESC, district, grid
        LIMIT 5
    """)
    
    results = cursor.fetchall()
    print(f"找到 {len(results)} 条记录:\n")
    
    for i, row in enumerate(results, 1):
        print(f"记录 {i}:")
        print(f"  日期: {row['stat_date']}, 区域: {row['district']}, 网格: {row['grid']}")
        print(f"  直供电能耗: {row['direct_power_supply_energy']}, 直供电电费: {row['direct_power_supply_cost']}")
        print(f"  转供电能耗: {row['indirect_power_supply_energy']}, 转供电电费: {row['indirect_power_supply_cost']}")
        print(f"  总能耗: {row['total_energy']}, 总电费: {row['total_cost']}")
        print(f"  总度数(AB字段值): {row['total_energy']}, 总电费(AC字段值): {row['total_cost']}")
        print()
    
    # 检查 trend_daily_energy 和 trend_monthly_energy 字段
    print("\n[2] 检查趋势字段的值...")
    cursor.execute("""
        SELECT stat_date, trend_daily_energy, trend_daily_cost, 
               trend_monthly_energy, trend_monthly_cost,
               trend_yearly_energy, trend_yearly_cost
        FROM energy_charge_daily_summary
        WHERE district IS NOT NULL AND grid IS NOT NULL
        LIMIT 3
    """)
    
    trend_records = cursor.fetchall()
    for i, row in enumerate(trend_records, 1):
        print(f"记录 {i} (日期: {row['stat_date']}):")
        print(f"  日趋势能耗: {row['trend_daily_energy']}, 日趋势电费: {row['trend_daily_cost']}")
        print(f"  月趋势能耗: {row['trend_monthly_energy']}, 月趋势电费: {row['trend_monthly_cost']}")
        print(f"  年趋势能耗: {row['trend_yearly_energy']}, 年趋势电费: {row['trend_yearly_cost']}")
        print()
    
finally:
    cursor.close()
    conn.close()
    print("\n数据库连接已关闭")
