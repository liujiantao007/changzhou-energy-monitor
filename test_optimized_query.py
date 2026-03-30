import pymysql
import time

print("=" * 60)
print("优化后查询性能测试")
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
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    
    # 测试优化后的查询
    print("\n测试优化后的最新日期查询 (DISTINCT + ORDER BY + LIMIT):")
    start = time.time()
    sql = """
        SELECT DISTINCT stat_date
        FROM energy_charge_daily_summary
        WHERE district IS NOT NULL AND grid IS NOT NULL
        ORDER BY stat_date DESC
        LIMIT 1
    """
    cursor.execute(sql)
    result = cursor.fetchone()
    end = time.time()
    
    print(f"   最新日期：{result['stat_date']}")
    print(f"   查询耗时：{end - start:.3f} 秒")
    print(f"   性能提升：{48.281 / (end - start):.1f}x (相比之前的 48.281 秒)")
    
    cursor.close()
    conn.close()
    
    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ 测试失败：{e}")
    import traceback
    traceback.print_exc()