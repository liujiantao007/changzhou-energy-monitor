"""
添加用电方维度统计字段到 energy_charge_daily_summary 表

功能：
1. 添加 4 个新字段：
   - mobile_cumulative_energy: 移动用户日累计用电量
   - mobile_poi_count: 移动用户 POI 数量
   - tower_cumulative_energy: 电塔用户日累计用电量
   - tower_poi_count: 电塔用户 POI 数量
2. 更新现有数据，按用电方维度聚合
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

TARGET_TABLE = 'energy_charge_daily_summary'
SOURCE_TABLE = 'energy_charge'

conn = pymysql.connect(**DB_CONFIG)
cursor = conn.cursor()

try:
    print("=" * 70)
    print("添加用电方维度统计字段")
    print("=" * 70)
    
    # Step 1: 添加新字段
    print("\n【Step 1】添加 4 个新字段...")
    
    alter_statements = [
        """
        ALTER TABLE {table} 
        ADD COLUMN mobile_cumulative_energy DECIMAL(15,4) DEFAULT 0 
        COMMENT '移动用户日累计用电量 (kWh)'
        """.format(table=TARGET_TABLE),
        
        """
        ALTER TABLE {table} 
        ADD COLUMN mobile_poi_count INT DEFAULT 0 
        COMMENT '移动用户 POI 数量 (个)'
        """.format(table=TARGET_TABLE),
        
        """
        ALTER TABLE {table} 
        ADD COLUMN tower_cumulative_energy DECIMAL(15,4) DEFAULT 0 
        COMMENT '电塔用户日累计用电量 (kWh)'
        """.format(table=TARGET_TABLE),
        
        """
        ALTER TABLE {table} 
        ADD COLUMN tower_poi_count INT DEFAULT 0 
        COMMENT '电塔用户 POI 数量 (个)'
        """.format(table=TARGET_TABLE)
    ]
    
    for i, stmt in enumerate(alter_statements, 1):
        try:
            cursor.execute(stmt)
            print(f"   ✅ 字段 {i}/4 添加成功")
        except pymysql.err.OperationalError as e:
            if e.args[0] == 1060:  # Duplicate column name
                print(f"   ⚠️  字段 {i} 已存在，跳过")
            else:
                raise
    
    conn.commit()
    print("\n   ✅ 所有字段添加完成")
    
    # Step 2: 验证字段已添加
    print("\n【Step 2】验证表结构...")
    cursor.execute(f"SHOW COLUMNS FROM {TARGET_TABLE}")
    columns = cursor.fetchall()
    
    new_columns = [col for col in columns if col[0] in [
        'mobile_cumulative_energy', 'mobile_poi_count',
        'tower_cumulative_energy', 'tower_poi_count'
    ]]
    
    print(f"   新增字段列表:")
    for col in new_columns:
        print(f"     - {col[0]}: {col[1]}")
    
    # Step 3: 更新历史数据（按用电方维度聚合）
    print(f"\n【Step 3】更新历史数据（按用电方维度聚合）...")
    
    # 先检查 source 表是否有"用电方"字段
    cursor.execute(f"SHOW COLUMNS FROM {SOURCE_TABLE}")
    source_columns = {col['Field']: col['Type'] for col in cursor.fetchall()}
    
    if '用电方' not in source_columns:
        print(f"   ⚠️  源表 {SOURCE_TABLE} 中没有'用电方'字段，跳过数据更新")
    else:
        # 更新移动用户数据
        update_mobile_sql = f"""
        UPDATE {TARGET_TABLE} t
        INNER JOIN (
            SELECT 
                日期 as stat_date,
                COALESCE(归属单元, '') as district,
                COALESCE(归属网格, '') as grid,
                SUM(COALESCE(度数，0)) as mobile_energy,
                COUNT(DISTINCT poi 名称) as mobile_poi
            FROM {SOURCE_TABLE}
            WHERE 用电方 = '移动'
            GROUP BY 日期，归属单元，归属网格
        ) s ON t.stat_date = s.stat_date 
               AND t.district = s.district 
               AND t.grid = s.grid
        SET t.mobile_cumulative_energy = COALESCE(s.mobile_energy, 0),
            t.mobile_poi_count = COALESCE(s.mobile_poi, 0)
        """
        
        cursor.execute(update_mobile_sql)
        mobile_rows = cursor.rowcount
        print(f"   ✅ 更新移动用户数据：{mobile_rows} 行")
        
        # 更新电塔用户数据
        update_tower_sql = f"""
        UPDATE {TARGET_TABLE} t
        INNER JOIN (
            SELECT 
                日期 as stat_date,
                COALESCE(归属单元，'') as district,
                COALESCE(归属网格，'') as grid,
                SUM(COALESCE(度数，0)) as tower_energy,
                COUNT(DISTINCT poi 名称) as tower_poi
            FROM {SOURCE_TABLE}
            WHERE 用电方 = '电塔'
            GROUP BY 日期，归属单元，归属网格
        ) s ON t.stat_date = s.stat_date 
               AND t.district = s.district 
               AND t.grid = s.grid
        SET t.tower_cumulative_energy = COALESCE(s.tower_energy, 0),
            t.tower_poi_count = COALESCE(s.tower_poi, 0)
        """
        
        cursor.execute(update_tower_sql)
        tower_rows = cursor.rowcount
        print(f"   ✅ 更新电塔用户数据：{tower_rows} 行")
        
        conn.commit()
    
    # Step 4: 验证更新结果
    print(f"\n【Step 4】验证更新结果...")
    
    verify_sql = f"""
    SELECT 
        stat_date,
        district,
        grid,
        mobile_cumulative_energy,
        mobile_poi_count,
        tower_cumulative_energy,
        tower_poi_count
    FROM {TARGET_TABLE}
    WHERE (mobile_cumulative_energy > 0 OR tower_cumulative_energy > 0)
    ORDER BY stat_date DESC
    LIMIT 5
    """
    
    cursor.execute(verify_sql)
    results = cursor.fetchall()
    
    if results:
        print(f"   示例数据（最新 5 条有用电方数据的记录）:")
        for row in results:
            print(f"     - 日期:{row['stat_date']}, 区县:{row['district']}, 网格:{row['grid']}")
            print(f"       移动能耗:{row['mobile_cumulative_energy']}kWh, 移动 POI:{row['mobile_poi_count']}个")
            print(f"       电塔能耗:{row['tower_cumulative_energy']}kWh, 电塔 POI:{row['tower_poi_count']}个")
    else:
        print(f"   ⚠️  未找到用电方维度数据，请检查源表是否有'用电方'字段及对应数据")
    
    print("\n" + "=" * 70)
    print("✅ 所有操作完成！")
    print("=" * 70)

except Exception as e:
    print(f"\n❌ 操作失败：{e}")
    import traceback
    traceback.print_exc()
finally:
    if conn.open:
        conn.close()
    print("\n数据库连接已关闭")
