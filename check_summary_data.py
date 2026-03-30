
"""
检查 energy_charge_daily_summary 表的数据
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
    print("检查 energy_charge_daily_summary 表的数据")
    print("=" * 70)
    
    # 检查最新日期的数据
    print("\n[1] 查找最新日期...")
    cursor.execute("SELECT MAX(stat_date) as max_date FROM energy_charge_daily_summary")
    result = cursor.fetchone()
    max_date = result['max_date']
    print(f"最新日期: {max_date}")
    
    print(f"\n[2] 获取最新日期 ({max_date}) 的前 5 条记录...")
    cursor.execute("""
        SELECT stat_date, district, grid, 
               direct_power_supply_energy, indirect_power_supply_energy,
               direct_power_supply_cost, indirect_power_supply_cost,
               total_energy, total_cost
        FROM energy_charge_daily_summary 
        WHERE stat_date = %s 
        LIMIT 5
    """, (max_date,))
    
    records = cursor.fetchall()
    print(f"找到 {len(records)} 条记录:\n")
    
    for i, rec in enumerate(records, 1):
        print(f"  记录 {i}:")
        print(f"    日期: {rec['stat_date']}, 区域: {rec['district']}, 网格: {rec['grid']}")
        print(f"    直供电能耗: {rec['direct_power_supply_energy']}, 直供电电费: {rec['direct_power_supply_cost']}")
        print(f"    转供电能耗: {rec['indirect_power_supply_energy']}, 转供电电费: {rec['indirect_power_supply_cost']}")
        print(f"    总能耗: {rec['total_energy']}, 总电费: {rec['total_cost']}")
        print()
    
    # 统计这些字段的总和
    print("\n[3] 最新日期的数据汇总...")
    cursor.execute("""
        SELECT 
            SUM(direct_power_supply_energy) as sum_direct_energy,
            SUM(indirect_power_supply_energy) as sum_indirect_energy,
            SUM(direct_power_supply_cost) as sum_direct_cost,
            SUM(indirect_power_supply_cost) as sum_indirect_cost,
            SUM(total_energy) as sum_total_energy,
            SUM(total_cost) as sum_total_cost
        FROM energy_charge_daily_summary 
        WHERE stat_date = %s
    """, (max_date,))
    
    summary = cursor.fetchone()
    print(f"直供电能耗总和: {summary['sum_direct_energy']}")
    print(f"转供电能耗总和: {summary['sum_indirect_energy']}")
    print(f"直供电电费总和: {summary['sum_direct_cost']}")
    print(f"转供电电费总和: {summary['sum_indirect_cost']}")
    print(f"总能耗总和: {summary['sum_total_energy']}")
    print(f"总电费总和: {summary['sum_total_cost']}")
    
finally:
    cursor.close()
    conn.close()
    print("\n数据库连接已关闭")
