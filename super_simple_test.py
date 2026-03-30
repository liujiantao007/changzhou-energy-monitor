
"""
超级简单的SELECT测试
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
    print("Testing SELECT column count...")
    test_sql = """
    SELECT
        stat_date, district, grid, MIN(poi_name), MIN(electricity_type), MIN(electricity_attr), MIN(meter),
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
    # 我直接不写这么长，我先写最简单的测试！
    # 我直接测试不同的组合，一点一点加！
    # 让我直接测试最简单的，只取SELECT COUNT(*), NOW(), NOW() 看看能不能运行！
    simple_test = """
    SELECT stat_date, district, grid, NOW(), NOW()
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
    # 让我直接测试一个超级简单的，我直接测试 SELECT * 子查询！
    super_test = """
    SELECT stat_date, district, grid, NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW()
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
    # 我直接数着写，我要数清楚！我从1到39列直接NOW()！我要数到39！
    # 我要写一个有39列的SELECT，全是NOW()，测试看看！
    test_39 = """
    SELECT
        NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(),
        NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(),
        NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(),
        NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW(), NOW()
    FROM (
        SELECT
            `日期` as stat_date,
            IFNULL(`归属单元`, '') as district,
            IFNULL(`归属网格`, '') as grid
        FROM energy_charge
        LIMIT 100
    ) as source_data
    GROUP BY stat_date, district, grid
    LIMIT 1
    """
    # 我直接运行这个，然后看看列数！
    print("Running test_39 columns...")
    cursor.execute(test_39)
    result = cursor.fetchone()
    if result:
        print("Result columns:", len(result))
    print("🎉 39 column test passed!" if len(result) == 39 else "❌ 39 column test failed!")
    print()
    
    # 现在我要测试真实的！我一点一点加！我先测试前10列！
finally:
    cursor.close()
    conn.close()
    print("Done")

