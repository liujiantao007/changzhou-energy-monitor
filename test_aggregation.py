import pymysql
from pymysql.cursors import DictCursor

print("=" * 70)
print("数据聚合逻辑验证测试")
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

# 1. 检查源表数据量
print(f"\n1. 源表 (energy_charge) 在 {test_date} 的数据:")
cursor.execute(f"""
    SELECT COUNT(*) as cnt,
           SUM(COALESCE(度数, 0)) as total_energy,
           SUM(COALESCE(电费, 0)) as total_cost
    FROM energy_charge
    WHERE 日期 = %s
""", (test_date,))
result = cursor.fetchone()
print(f"   记录数: {result['cnt']:,}")
print(f"   总度数: {result['total_energy']:,.2f}")
print(f"   总电费: {result['total_cost']:,.2f}")

# 2. 测试 GROUP BY 聚合查询（使用兼容语法）
print(f"\n2. 测试 GROUP BY 聚合 (日期, 归属单元, 归属网格):")
cursor.execute(f"""
    SELECT
        stat_date,
        district,
        grid,
        MIN(poi_name) as poi_name,
        MIN(meter) as meter,
        MIN(electricity_type) as electricity_type,
        MIN(electricity_attr) as electricity_attr,
        COALESCE(SUM(total_energy), 0) as total_energy,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COUNT(*) as record_count
    FROM (
        SELECT
            日期 as stat_date,
            COALESCE(归属单元, '') as district,
            COALESCE(归属网格, '') as grid,
            poi名称 as poi_name,
            电表 as meter,
            用电类型 as electricity_type,
            用电属性 as electricity_attr,
            COALESCE(度数, 0) as total_energy,
            COALESCE(电费, 0) as total_cost
        FROM energy_charge
        WHERE 日期 = %s
    ) as source_data
    GROUP BY stat_date, district, grid
    LIMIT 5
""", (test_date,))
results = cursor.fetchall()
print(f"   聚合后记录数(前5条):")
for i, row in enumerate(results):
    print(f"   {i+1}. 区域:{row['district']} 网格:{row['grid']} 度数:{row['total_energy']:,.2f} 电费:{row['total_cost']:,.2f} 记录数:{row['record_count']}")

# 3. 统计聚合后的总记录数
print(f"\n3. 聚合后总记录数:")
cursor.execute(f"""
    SELECT
        COUNT(*) as aggregated_count,
        SUM(total_energy) as total_energy,
        SUM(total_cost) as total_cost,
        SUM(record_count) as total_records
    FROM (
        SELECT
            COALESCE(SUM(COALESCE(度数, 0)), 0) as total_energy,
            COALESCE(SUM(COALESCE(电费, 0)), 0) as total_cost,
            COUNT(*) as record_count
        FROM energy_charge
        WHERE 日期 = %s
        GROUP BY COALESCE(归属单元, ''), COALESCE(归属网格, '')
    ) as aggregated
""", (test_date,))
result = cursor.fetchone()
print(f"   聚合后记录数: {result['aggregated_count']:,}")
print(f"   总度数: {result['total_energy']:,.2f}")
print(f"   总电费: {result['total_cost']:,.2f}")
print(f"   原始记录数总和: {result['total_records']:,}")

cursor.close()
conn.close()

print("\n" + "=" * 70)
print("验证完成")
print("=" * 70)