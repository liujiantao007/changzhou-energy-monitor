"""
添加用电方电费统计字段到 energy_charge_daily_summary 表

功能：
1. 添加 2 个新字段：
   - mobile_electricity_fee: 移动用户日累计电费
   - tower_electricity_fee: 铁塔用户日累计电费
2. 更新现有数据，按用电方维度聚合电费数据
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
cursor = conn.cursor(DictCursor)  # 使用 DictCursor 以支持字典访问

try:
    print("=" * 70)
    print("添加用电方电费统计字段")
    print("=" * 70)
    
    # Step 1: 添加新字段
    print("\n【Step 1】添加 2 个新字段...")
    
    alter_statements = [
        """
        ALTER TABLE {table} 
        ADD COLUMN mobile_electricity_fee DECIMAL(15,4) DEFAULT 0 
        COMMENT '移动用户日累计电费 (元)'
        """.format(table=TARGET_TABLE),
        
        """
        ALTER TABLE {table} 
        ADD COLUMN tower_electricity_fee DECIMAL(15,4) DEFAULT 0 
        COMMENT '铁塔用户日累计电费 (元)'
        """.format(table=TARGET_TABLE)
    ]
    
    for i, stmt in enumerate(alter_statements, 1):
        try:
            cursor.execute(stmt)
            print(f"   ✅ 字段 {i}/2 添加成功")
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
    
    new_columns = [col for col in columns if col['Field'] in [
        'mobile_electricity_fee', 'tower_electricity_fee'
    ]]
    
    print(f"   新增字段列表:")
    for col in new_columns:
        print(f"     - {col['Field']}: {col['Type']}")
    
    # Step 3: 更新历史数据（按用电方维度聚合电费）
    print(f"\n【Step 3】更新历史数据（按用电方维度聚合电费）...")
    
    # 先检查 source 表是否有"用电方"字段
    cursor.execute(f"SHOW COLUMNS FROM {SOURCE_TABLE}")
    source_columns = {col['Field']: col['Type'] for col in cursor.fetchall()}
    
    if '用电方' not in source_columns:
        print(f"   ⚠️  源表 {SOURCE_TABLE} 中没有'用电方'字段，跳过数据更新")
    elif '电费' not in source_columns:
        print(f"   ⚠️  源表 {SOURCE_TABLE} 中没有'电费'字段，跳过数据更新")
    else:
        # 更新移动用户电费数据
        update_mobile_sql = """
        UPDATE {target_table} t
        INNER JOIN (
            SELECT 
                `日期` as stat_date,
                COALESCE(`归属单元`, '') as district,
                COALESCE(`归属网格`, '') as grid,
                SUM(COALESCE(`电费`, 0)) as mobile_fee
            FROM {source_table}
            WHERE `用电方` = '移动'
            GROUP BY `日期`, `归属单元`, `归属网格`
        ) s ON t.stat_date = s.stat_date 
               AND t.district = s.district 
               AND t.grid = s.grid
        SET t.mobile_electricity_fee = COALESCE(s.mobile_fee, 0)
        """.format(target_table=TARGET_TABLE, source_table=SOURCE_TABLE)
        
        cursor.execute(update_mobile_sql)
        mobile_rows = cursor.rowcount
        print(f"   ✅ 更新移动用户电费数据：{mobile_rows} 行")
        
        # 更新铁塔用户电费数据
        update_tower_sql = """
        UPDATE {target_table} t
        INNER JOIN (
            SELECT 
                `日期` as stat_date,
                COALESCE(`归属单元`, '') as district,
                COALESCE(`归属网格`, '') as grid,
                SUM(COALESCE(`电费`, 0)) as tower_fee
            FROM {source_table}
            WHERE `用电方` = '铁塔'
            GROUP BY `日期`, `归属单元`, `归属网格`
        ) s ON t.stat_date = s.stat_date 
               AND t.district = s.district 
               AND t.grid = s.grid
        SET t.tower_electricity_fee = COALESCE(s.tower_fee, 0)
        """.format(target_table=TARGET_TABLE, source_table=SOURCE_TABLE)
        
        cursor.execute(update_tower_sql)
        tower_rows = cursor.rowcount
        print(f"   ✅ 更新铁塔用户电费数据：{tower_rows} 行")
        
        conn.commit()
    
    # Step 4: 验证更新结果
    print(f"\n【Step 4】验证更新结果...")
    
    verify_sql = f"""
    SELECT 
        stat_date,
        district,
        grid,
        mobile_cumulative_energy,
        mobile_electricity_fee,
        tower_cumulative_energy,
        tower_electricity_fee
    FROM {TARGET_TABLE}
    WHERE (mobile_electricity_fee > 0 OR tower_electricity_fee > 0)
    ORDER BY stat_date DESC
    LIMIT 5
    """
    
    cursor.execute(verify_sql)
    results = cursor.fetchall()
    
    if results:
        print(f"   示例数据（最新 5 条有用电方电费数据的记录）:")
        for row in results:
            print(f"     - 日期:{row['stat_date']}, 区县:{row['district']}, 网格:{row['grid']}")
            print(f"       移动能耗:{row['mobile_cumulative_energy']}kWh, 移动电费:{row['mobile_electricity_fee']}元")
            print(f"       铁塔能耗:{row['tower_cumulative_energy']}kWh, 铁塔电费:{row['tower_electricity_fee']}元")
    else:
        print(f"   ⚠️  未找到用电方电费数据，请检查源表是否有'用电方'字段及对应数据")
    
    # Step 5: 数据一致性校验
    print(f"\n【Step 5】数据一致性校验...")
    
    consistency_sql = """
    SELECT 
        t.stat_date,
        t.district,
        t.grid,
        t.mobile_electricity_fee as summary_mobile_fee,
        t.tower_electricity_fee as summary_tower_fee,
        (
            SELECT SUM(COALESCE(ec.`电费`, 0)) 
            FROM {source_table} ec 
            WHERE ec.`日期` = t.stat_date 
              AND COALESCE(ec.`归属单元`, '') = t.district 
              AND COALESCE(ec.`归属网格`, '') = t.grid 
              AND ec.`用电方` = '移动'
        ) as original_mobile_fee,
        (
            SELECT SUM(COALESCE(ec.`电费`, 0)) 
            FROM {source_table} ec 
            WHERE ec.`日期` = t.stat_date 
              AND COALESCE(ec.`归属单元`, '') = t.district 
              AND COALESCE(ec.`归属网格`, '') = t.grid 
              AND ec.`用电方` = '铁塔'
        ) as original_tower_fee
    FROM {target_table} t
    WHERE t.mobile_electricity_fee > 0 OR t.tower_electricity_fee > 0
    ORDER BY t.stat_date DESC
    LIMIT 3
    """.format(target_table=TARGET_TABLE, source_table=SOURCE_TABLE)
    
    cursor.execute(consistency_sql)
    consistency_results = cursor.fetchall()
    
    if consistency_results:
        print(f"   一致性校验（汇总数据 vs 原始数据）:")
        all_match = True
        for row in consistency_results:
            mobile_match = abs(float(row['summary_mobile_fee'] or 0) - float(row['original_mobile_fee'] or 0)) < 0.01
            tower_match = abs(float(row['summary_tower_fee'] or 0) - float(row['original_tower_fee'] or 0)) < 0.01
            
            status = "✅" if (mobile_match and tower_match) else "❌"
            print(f"   {status} 日期:{row['stat_date']}, 区县:{row['district']}, 网格:{row['grid']}")
            print(f"         移动电费：汇总={row['summary_mobile_fee']}, 原始={row['original_mobile_fee']}, 匹配={mobile_match}")
            print(f"         铁塔电费：汇总={row['summary_tower_fee']}, 原始={row['original_tower_fee']}, 匹配={tower_match}")
            
            if not (mobile_match and tower_match):
                all_match = False
        
        if all_match:
            print(f"\n   ✅ 数据一致性校验通过！")
        else:
            print(f"\n   ⚠️  数据一致性校验失败，请检查聚合逻辑")
    else:
        print(f"   ⚠️  无法进行一致性校验，没有足够的电费数据")
    
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
