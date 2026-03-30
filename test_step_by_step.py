
"""
一步一步测试替换列！
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
    # 先定义所有我们需要的SELECT值，按顺序！（从count_select.py来的！）
    real_values = [
        'stat_date',
        'district',
        'grid',
        'MIN(poi_name)',
        'MIN(electricity_type)',
        'MIN(electricity_attr)',
        'MIN(meter)',
        'COALESCE(SUM(total_energy), 0)',
        'COALESCE(SUM(total_cost), 0)',
        'COALESCE(SUM(total_energy), 0)',
        'COALESCE(SUM(total_cost), 0)',
        'COUNT(DISTINCT poi_name)',
        'COUNT(DISTINCT meter)',
        'COALESCE(SUM(total_energy), 0)',
        'COALESCE(SUM(total_energy), 0)',
        'COALESCE(SUM(total_energy), 0)',
        'COALESCE(SUM(total_energy), 0)',
        'COALESCE(SUM(total_cost), 0)',
        'COALESCE(SUM(total_energy), 0)',
        'COALESCE(SUM(total_cost), 0)',
        'COALESCE(SUM(total_energy), 0)',
        'COALESCE(SUM(total_cost), 0)',
        'COALESCE(SUM(total_energy), 0)',
        'COALESCE(SUM(total_cost), 0)',
        'COUNT(*)',
        'NOW()',
        'NOW()',
        'COALESCE(SUM(CASE WHEN consumer = \'移动\' THEN total_energy ELSE 0 END), 0)',
        'COUNT(DISTINCT CASE WHEN consumer = \'移动\' THEN poi_name END)',
        'COALESCE(SUM(CASE WHEN consumer = \'电塔\' OR consumer = \'铁塔\' THEN total_energy ELSE 0 END), 0)',
        'COUNT(DISTINCT CASE WHEN consumer = \'电塔\' OR consumer = \'铁塔\' THEN poi_name END)',
        '0',
        '0',
        '0',
        '0',
        'COALESCE(SUM(CASE WHEN consumer = \'移动\' THEN total_cost ELSE 0 END), 0)',
        'COALESCE(SUM(CASE WHEN consumer = \'电塔\' OR consumer = \'铁塔\' THEN total_cost ELSE 0 END), 0)'
    ]
    
    print(f"Total real values: {len(real_values)}")
    
    # 现在从0开始，每次加一个真实列，剩下用NOW()填充，运行测试！
    for num_cols in range(0, 40):
        # 构建测试SELECT
        test_cols = []
        for i in range(39):
            if i &lt; num_cols:
                test_cols.append(real_values[i])
            else:
                test_cols.append('NOW()')
        
        test_sql = f"""
        SELECT {', '.join(test_cols)}
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
        
        try:
            cursor.execute(test_sql)
            result = cursor.fetchone()
            print(f"✅ Test with {num_cols} real columns passed - returned {len(result)} cols")
        except Exception as e:
            print(f"❌ Test with {num_cols} real columns FAILED!")
            print(f"   Error: {e}")
            print(f"   First failing column index: {num_cols}")
            print(f"   First failing column value: {real_values[num_cols-1]}")
            break
    print("\nDone!")
        
finally:
    cursor.close()
    conn.close()
    print("Database closed")

