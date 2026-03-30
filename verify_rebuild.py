"""
Verify the rebuild of energy_charge_daily_summary table
"""

import pymysql

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

try:
    print("=" * 70)
    print("验证 energy_charge_daily_summary 表重建结果")
    print("=" * 70)
    
    # Step 1: Check source table consumer types
    print("\n【Step 1】检查源表用电方类型...")
    cursor.execute("SELECT DISTINCT `用电方` FROM energy_charge")
    consumer_types = cursor.fetchall()
    print(f"   用电方类型：{[c[0] for c in consumer_types]}")
    
    # Step 2: Count records by consumer type
    print("\n【Step 2】统计各用电方记录数...")
    for consumer_type in consumer_types:
        if consumer_type[0]:
            cursor.execute(f"SELECT COUNT(*) FROM energy_charge WHERE `用电方` = '{consumer_type[0]}'")
            count = cursor.fetchone()[0]
            print(f"   {consumer_type[0]}: {count:,} 条记录")
    
    # Step 3: Verify summary table totals
    print("\n【Step 3】验证汇总表数据...")
    cursor.execute("""
        SELECT 
            COUNT(*) as total_records,
            SUM(overview_total_energy) as total_energy,
            SUM(overview_total_cost) as total_cost,
            SUM(mobile_cumulative_energy) as mobile_energy,
            SUM(tower_cumulative_energy) as tower_energy,
            SUM(mobile_poi_count) as mobile_poi,
            SUM(tower_poi_count) as tower_poi
        FROM energy_charge_daily_summary
    """)
    stats = cursor.fetchone()
    print(f"   总记录数：{stats[0]:,}")
    print(f"   总能耗：{stats[1]:,.2f} kWh")
    print(f"   总电费：{stats[2]:,.2f} 元")
    print(f"   移动能耗：{stats[3]:,.2f} kWh (占比 {stats[3]/stats[1]*100:.2f}%)" if stats[1] else f"   移动能耗：{stats[3]:,.2f} kWh")
    print(f"   电塔能耗：{stats[4]:,.2f} kWh (占比 {stats[4]/stats[1]*100:.2f}%)" if stats[1] else f"   电塔能耗：{stats[4]:,.2f} kWh")
    print(f"   移动 POI 数：{stats[5]:,}")
    print(f"   电塔 POI 数：{stats[6]:,}")
    
    # Step 4: Sample data verification
    print("\n【Step 4】抽样数据验证...")
    cursor.execute("""
        SELECT 
            stat_date,
            district,
            grid,
            overview_total_energy,
            mobile_cumulative_energy,
            tower_cumulative_energy,
            mobile_poi_count,
            tower_poi_count
        FROM energy_charge_daily_summary
        WHERE mobile_cumulative_energy > 0 OR tower_cumulative_energy > 0
        ORDER BY stat_date DESC
        LIMIT 5
    """)
    samples = cursor.fetchall()
    
    if samples:
        print(f"   最新 5 条包含用电方数据的记录:")
        for row in samples:
            print(f"     - 日期:{row[0]}, 区县:{row[1]}, 网格:{row[2]}")
            print(f"       总能耗:{row[3]:,.2f}, 移动能耗:{row[4]:,.2f}, 电塔能耗:{row[5]:,.2f}")
            print(f"       移动 POI:{row[6]}, 电塔 POI:{row[7]}")
    else:
        print(f"   ⚠️ 未找到用电方维度数据")
    
    # Step 5: Compare source and summary totals
    print("\n【Step 5】对比源表和汇总表总量...")
    cursor.execute("SELECT SUM(`度数`), SUM(`电费`) FROM energy_charge")
    source_totals = cursor.fetchone()
    print(f"   源表总能耗：{source_totals[0]:,.2f} kWh")
    print(f"   源表总电费：{source_totals[1]:,.2f} 元")
    print(f"   汇总表总能耗：{stats[1]:,.2f} kWh")
    print(f"   汇总表总电费：{stats[2]:,.2f} 元")
    
    if abs(source_totals[0] - stats[1]) < 0.01:
        print(f"   ✅ 能耗数据一致")
    else:
        print(f"   ⚠️ 能耗数据差异：{abs(source_totals[0] - stats[1]):,.2f} kWh")
    
    if abs(source_totals[1] - stats[2]) < 0.01:
        print(f"   ✅ 电费数据一致")
    else:
        print(f"   ⚠️ 电费数据差异：{abs(source_totals[1] - stats[2]):,.2f} 元")
    
    print("\n" + "=" * 70)
    print("✅ 验证完成！")
    print("=" * 70)

except Exception as e:
    print(f"\n❌ 验证失败：{e}")
    import traceback
    traceback.print_exc()
finally:
    if conn.open:
        conn.close()
    print("\n数据库连接已关闭")
