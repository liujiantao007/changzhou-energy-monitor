import pymysql
import time

print("=" * 70)
print("数据库索引检查和优化")
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
cursor = conn.cursor()

# 检查现有索引
print("\n1. 检查 energy_charge_daily_summary 表的索引:")
cursor.execute("SHOW INDEX FROM energy_charge_daily_summary")
for row in cursor.fetchall():
    print(f"   {row}")

# 检查表大小
print("\n2. 表记录数:")
cursor.execute("SELECT COUNT(*) FROM energy_charge_daily_summary")
count = cursor.fetchone()[0]
print(f"   总记录数: {count:,}")

# 检查不同日期的数据量
print("\n3. 按日期统计记录数:")
cursor.execute("""
    SELECT stat_date, COUNT(*) as cnt
    FROM energy_charge_daily_summary
    WHERE district IS NOT NULL AND grid IS NOT NULL
    GROUP BY stat_date
    ORDER BY stat_date DESC
    LIMIT 10
""")
for row in cursor.fetchall():
    print(f"   {row[0]}: {row[1]:,} 条")

cursor.close()
conn.close()
print("\n" + "=" * 70)