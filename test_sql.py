
"""
测试SQL是否可以执行
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
cursor = conn.cursor()

try:
    print("=" * 70)
    print("测试SELECT部分是否有39列")
    print("=" * 70)
    
    # 先测试SELECT部分，只取1行数据
    test_sql = """
    SELECT
        stat_date,
        district,
        grid,
        MIN(poi_name),
        MIN(electricity_type),
        MIN(electricity_attr),
        MIN(meter),
        COALESCE(SUM(total_energy), 0),
        COALESCE(SUM(total_cost), 0),
        COALESCE(SUM(total_energy), 0),
        COALESCE(SUM(total_cost), 0),
        COUNT(DISTINCT poi_name),
        COUNT(DISTINCT meter),
        COALESCE(SUM(total_energy), 0),
        COALESCE(SUM(total_energy), 0),
        COALESCE(SUM(total_energy), 0),
        COALESCE(SUM(total_energy), 0),
        COALESCE(SUM(total_cost), 0),
        COALESCE(SUM(total_energy), 0),
        COALESCE(SUM(total_cost), 0),
        COALESCE(SUM(total_energy), 0),
        COALESCE(SUM(total_cost), 0),
        COALESCE(SUM(total_energy), 0),
        COALESCE(SUM(total_cost), 0),
        COUNT(*),
        NOW(),
        NOW(),
        COALESCE(SUM(CASE WHEN consumer = '移动' THEN total_energy ELSE 0 END), 0),
        COUNT(DISTINCT CASE WHEN consumer = '移动' THEN poi_name END),
        COALESCE(SUM(CASE WHEN consumer = '电塔' OR consumer = '铁塔' THEN total_energy ELSE 0 END), 0),
        COUNT(DISTINCT CASE WHEN consumer = '电塔' OR consumer = '铁塔' THEN poi_name END),
        0,
        0,
        0,
        0,
        COALESCE(SUM(CASE WHEN consumer = '移动' THEN total_cost ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN consumer = '电塔' OR consumer = '铁塔' THEN total_cost ELSE 0 END), 0)
    FROM (
        SELECT
            `日期` as stat_date,
            IFNULL(`归属单元`, '') as district,
            IFNULL(`归属网格`, '') as grid,
            `poi名称` as poi_name,
            '' as electricity_type,
            '' as electricity_attr,
            `电表` as meter,
            IFNULL(`用电方`, '') as consumer,
            IFNULL(`度数`, 0) as total_energy,
            IFNULL(`电费`, 0) as total_cost
        FROM energy_charge
        LIMIT 100
    ) as source_data
    GROUP BY stat_date, district, grid
    LIMIT 1
    """
    
    cursor.execute(test_sql)
    result = cursor.fetchone()
    
    if result:
        print(f"✅ SELECT执行成功！")
        print(f"返回列数: {len(result)}")
        
        if len(result) == 39:
            print("🎉 SELECT列数正确！是39列！")
        else:
            print(f"❌ SELECT列数不正确！期望39列，实际{len(result)}列")
    
    print("\n" + "=" * 70)
    
finally:
    cursor.close()
    conn.close()
    print("数据库连接已关闭")

