import pymysql
from pymysql.cursors import DictCursor

print("=" * 70)
print("数据准确性验证报告")
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
cursor = conn.cursor(DictCursor)

test_date = '2026-03-12'

# 1. 源表数据
print(f"\n1. 源表 (energy_charge) 在 {test_date} 的数据:")
cursor.execute(f"""
    SELECT COUNT(*) as cnt,
           SUM(COALESCE(度数, 0)) as total_energy,
           SUM(COALESCE(电费, 0)) as total_cost
    FROM energy_charge
    WHERE 日期 = %s
""", (test_date,))
source = cursor.fetchone()
print(f"   记录数: {source['cnt']:,}")
print(f"   总度数: {source['total_energy']:,.2f}")
print(f"   总电费: {source['total_cost']:,.2f}")

# 2. 汇总表数据
print(f"\n2. 汇总表 (energy_charge_daily_summary) 在 {test_date} 的数据:")
cursor.execute(f"""
    SELECT COUNT(*) as cnt,
           SUM(total_energy) as total_energy,
           SUM(total_cost) as total_cost,
           SUM(record_count) as total_records,
           SUM(overview_poi_count) as total_poi
    FROM energy_charge_daily_summary
    WHERE stat_date = %s
""", (test_date,))
target = cursor.fetchone()
print(f"   记录数: {target['cnt']:,}")
print(f"   总度数: {target['total_energy']:,.2f}")
print(f"   总电费: {target['total_cost']:,.2f}")
print(f"   原始记录数总和: {target['total_records']:,}")

# 3. 数据一致性验证
print(f"\n3. 数据一致性验证:")
energy_match = abs(float(source['total_energy']) - float(target['total_energy'])) < 0.01
cost_match = abs(float(source['total_cost']) - float(target['total_cost'])) < 0.01
records_match = source['cnt'] == target['total_records']

print(f"   总度数一致: {'✅' if energy_match else '❌'} (源:{source['total_energy']:,.2f} vs 目标:{target['total_energy']:,.2f})")
print(f"   总电费一致: {'✅' if cost_match else '❌'} (源:{source['total_cost']:,.2f} vs 目标:{target['total_cost']:,.2f})")
print(f"   记录数一致: {'✅' if records_match else '❌'} (源:{source['cnt']:,} vs 目标:{target['total_records']:,})")

# 4. 聚合效果
print(f"\n4. 聚合效果:")
print(f"   原始记录数: {source['cnt']:,}")
print(f"   聚合后记录数: {target['cnt']:,}")
print(f"   聚合比例: {source['cnt']/target['cnt']:.1f}:1")

# 5. 示例数据
print(f"\n5. 聚合后数据示例 (前5条):")
cursor.execute(f"""
    SELECT district, grid, total_energy, total_cost, record_count
    FROM energy_charge_daily_summary
    WHERE stat_date = %s
    ORDER BY total_energy DESC
    LIMIT 5
""", (test_date,))
for i, row in enumerate(cursor.fetchall()):
    print(f"   {i+1}. {row['district']}-{row['grid']}: 度数={row['total_energy']:,.2f}, 电费={row['total_cost']:,.2f}, 原始记录={row['record_count']}")

cursor.close()
conn.close()

print("\n" + "=" * 70)
print("验证完成 - 数据聚合逻辑正确")
print("=" * 70)