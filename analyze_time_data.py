import pymysql

print("=" * 70)
print("时间维度数据量分析")
print("=" * 70)

DB_CONFIG = {
    'host': '10.38.78.217',
    'port': 3220,
    'user': 'liujiantao',
    'password': 'Liujt!@#',
    'database': 'energy_management_2026',
    'charset': 'utf8mb4'
}

conn = pymysql.connect(**DB_CONFIG)
cursor = conn.cursor(pymysql.cursors.DictCursor)

# 1. 检查有哪些日期
print("\n1. 所有有效日期的记录数和电费:")
cursor.execute("""
    SELECT stat_date,
           COUNT(*) as cnt,
           SUM(total_energy) as total_energy,
           SUM(total_cost) as total_cost
    FROM energy_charge_daily_summary
    WHERE district IS NOT NULL AND grid IS NOT NULL
    GROUP BY stat_date
    ORDER BY stat_date DESC
""")
dates = cursor.fetchall()
for row in dates:
    print(f"   {row['stat_date']}: {row['cnt']:,} 条, 电费: {row['total_cost']:,.2f} 元")

# 2. 当前月（2026年3月）汇总
print("\n2. 2026年3月汇总:")
cursor.execute("""
    SELECT COUNT(*) as cnt,
           SUM(total_energy) as total_energy,
           SUM(total_cost) as total_cost
    FROM energy_charge_daily_summary
    WHERE district IS NOT NULL AND grid IS NOT NULL
      AND stat_date >= '2026-03-01'
      AND stat_date <= '2026-03-31'
""")
result = cursor.fetchone()
print(f"   记录数: {result['cnt']:,}")
print(f"   总电费: {result['total_cost']:,.2f} 元")

# 3. 2026年汇总
print("\n3. 2026年全年汇总:")
cursor.execute("""
    SELECT COUNT(*) as cnt,
           SUM(total_energy) as total_energy,
           SUM(total_cost) as total_cost
    FROM energy_charge_daily_summary
    WHERE district IS NOT NULL AND grid IS NOT NULL
      AND stat_date >= '2026-01-01'
      AND stat_date <= '2026-12-31'
""")
result = cursor.fetchone()
print(f"   记录数: {result['cnt']:,}")
print(f"   总电费: {result['total_cost']:,.2f} 元")

cursor.close()
conn.close()
print("\n" + "=" * 70)