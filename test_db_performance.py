import pymysql
import time

print("=" * 60)
print("数据库性能诊断")
print("=" * 60)

DB_CONFIG = {
    'host': '10.38.78.217',
    'port': 3220,
    'user': 'liujiantao',
    'password': 'Liujt!@#',
    'database': 'energy_management_2026',
    'charset': 'utf8mb4'
}

try:
    print("\n1. 测试数据库连接...")
    start = time.time()
    conn = pymysql.connect(**DB_CONFIG)
    end = time.time()
    print(f"   连接耗时：{end - start:.3f} 秒")
    
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    
    # 测试 1: 最新日期查询
    print("\n2. 测试最新日期查询...")
    start = time.time()
    sql = """
        SELECT MAX(stat_date) as latest_date
        FROM energy_charge_daily_summary
        WHERE district IS NOT NULL AND grid IS NOT NULL
    """
    cursor.execute(sql)
    result = cursor.fetchone()
    end = time.time()
    print(f"   最新日期：{result['latest_date']}")
    print(f"   查询耗时：{end - start:.3f} 秒")
    
    # 测试 2: 汇总数据查询
    date = result['latest_date']
    print(f"\n3. 测试汇总数据查询 (日期：{date})...")
    start = time.time()
    sql = """
        SELECT stat_date, district, grid, poi_name, meter,
               electricity_type, electricity_attr,
               total_energy, total_cost,
               overview_total_energy, overview_total_cost,
               overview_poi_count, overview_device_count,
               record_count
        FROM energy_charge_daily_summary
        WHERE stat_date = %s AND district IS NOT NULL AND grid IS NOT NULL
        ORDER BY stat_date DESC, district, grid
    """
    cursor.execute(sql, (date,))
    rows = cursor.fetchall()
    end = time.time()
    print(f"   返回记录数：{len(rows)}")
    print(f"   查询耗时：{end - start:.3f} 秒")
    
    if rows:
        print(f"   第一条数据:")
        print(f"     度数：{rows[0]['total_energy']}")
        print(f"     电费：{rows[0]['total_cost']}")
        print(f"     区域：{rows[0]['district']}")
        print(f"     网格：{rows[0]['grid']}")
    
    # 测试 3: 统计查询
    print(f"\n4. 测试统计查询...")
    start = time.time()
    sql = """
        SELECT SUM(total_energy) as total_energy,
               SUM(total_cost) as total_cost,
               SUM(record_count) as record_count
        FROM energy_charge_daily_summary
        WHERE district IS NOT NULL AND grid IS NOT NULL
    """
    cursor.execute(sql)
    result = cursor.fetchone()
    end = time.time()
    print(f"   总度数：{result['total_energy']}")
    print(f"   总电费：{result['total_cost']}")
    print(f"   总记录：{result['record_count']}")
    print(f"   查询耗时：{end - start:.3f} 秒")
    
    cursor.close()
    conn.close()
    
    print("\n" + "=" * 60)
    print("数据库诊断完成 - 所有测试通过")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ 数据库测试失败：{e}")
    import traceback
    traceback.print_exc()