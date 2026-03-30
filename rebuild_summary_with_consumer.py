"""
完全重建 energy_charge_daily_summary 表

功能：
1. 清空 energy_charge_daily_summary 表的所有数据
2. 基于 energy_charge 表的最新数据重新聚合计算
3. 包含用电方维度（移动、电塔）的统计
4. 验证数据完整性
"""

import pymysql
from datetime import datetime

DB_CONFIG = {
    'host': '10.38.78.217',
    'port': 3220,
    'user': 'liujiantao',
    'password': 'Liujt!@#',
    'database': 'energy_management_2026',
    'charset': 'utf8mb4'
}

SOURCE_TABLE = 'energy_charge'
TARGET_TABLE = 'energy_charge_daily_summary'

conn = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
cursor = conn.cursor()

try:
    print("=" * 70)
    print("完全重建 energy_charge_daily_summary 表")
    print("=" * 70)
    
    # Step 1: 检查源表数据
    print("\n【Step 1】检查源表 energy_charge 数据...")
    cursor.execute(f"SELECT COUNT(*) as cnt FROM {SOURCE_TABLE}")
    source_count = cursor.fetchone()['cnt']
    print(f"   源表记录数：{source_count:,} 条")
    
    cursor.execute(f"SELECT MIN(`日期`) as min_date, MAX(`日期`) as max_date FROM {SOURCE_TABLE}")
    date_range = cursor.fetchone()
    print(f"   日期范围：{date_range['min_date']} 至 {date_range['max_date']}")
    
    # Step 2: 清空目标表
    print(f"\n【Step 2】清空 {TARGET_TABLE} 表...")
    cursor.execute(f"TRUNCATE TABLE {TARGET_TABLE}")
    conn.commit()
    print("   ✅ 表已清空")
    
    # Step 3: 重新聚合插入数据
    print(f"\n【Step 3】重新聚合数据并插入 {TARGET_TABLE}...")
    start_time = datetime.now()
    
    insert_sql = f"""
    INSERT INTO {TARGET_TABLE} (
        stat_date, district, grid, poi_name, meter,
        electricity_type, electricity_attr,
        total_energy, total_cost,
        overview_total_energy, overview_total_cost,
        overview_poi_count, overview_device_count,
        electricity_by_district_energy, electricity_by_grid_energy, electricity_by_poi_energy,
        poi_stat_energy, poi_stat_cost,
        electricity_type_energy, electricity_type_cost,
        trend_daily_energy, trend_daily_cost,
        trend_monthly_energy, trend_monthly_cost,
        trend_yearly_energy, trend_yearly_cost,
        record_count,
        mobile_cumulative_energy, mobile_poi_count,
        tower_cumulative_energy, tower_poi_count
    )
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
        COALESCE(SUM(total_energy), 0) as overview_total_energy,
        COALESCE(SUM(total_cost), 0) as overview_total_cost,
        COUNT(DISTINCT poi_name) as overview_poi_count,
        COUNT(DISTINCT meter) as overview_device_count,
        COALESCE(SUM(total_energy), 0) as electricity_by_district_energy,
        COALESCE(SUM(total_energy), 0) as electricity_by_grid_energy,
        COALESCE(SUM(total_energy), 0) as electricity_by_poi_energy,
        COALESCE(SUM(total_energy), 0) as poi_stat_energy,
        COALESCE(SUM(total_cost), 0) as poi_stat_cost,
        COALESCE(SUM(total_energy), 0) as electricity_type_energy,
        COALESCE(SUM(total_cost), 0) as electricity_type_cost,
        COALESCE(SUM(total_energy), 0) as trend_daily_energy,
        COALESCE(SUM(total_cost), 0) as trend_daily_cost,
        COALESCE(SUM(total_energy), 0) as trend_monthly_energy,
        COALESCE(SUM(total_cost), 0) as trend_monthly_cost,
        COALESCE(SUM(total_energy), 0) as trend_yearly_energy,
        COALESCE(SUM(total_cost), 0) as trend_yearly_cost,
        COUNT(*) as record_count,
        COALESCE(SUM(CASE WHEN consumer = '移动' THEN total_energy ELSE 0 END), 0) as mobile_cumulative_energy,
        COUNT(DISTINCT CASE WHEN consumer = '移动' THEN poi_name END) as mobile_poi_count,
        COALESCE(SUM(CASE WHEN consumer = '电塔' THEN total_energy ELSE 0 END), 0) as tower_cumulative_energy,
        COUNT(DISTINCT CASE WHEN consumer = '电塔' THEN poi_name END) as tower_poi_count
    FROM (
        SELECT
            `日期` as stat_date,
            IFNULL(`归属单元`，'') as district,
            IFNULL(`归属网格`，'') as grid,
            `poi 名称` as poi_name,
            `电表` as meter,
            `用电类型` as electricity_type,
            `用电属性` as electricity_attr,
            IFNULL(`用电方`，'') as consumer,
            IFNULL(`度数`，0) as total_energy,
            IFNULL(`电费`，0) as total_cost
        FROM {SOURCE_TABLE}
    ) as source_data
    GROUP BY stat_date, district, grid
    """
    
    cursor.execute(insert_sql)
    conn.commit()
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    # 获取插入的记录数
    cursor.execute(f"SELECT COUNT(*) as cnt FROM {TARGET_TABLE}")
    target_count = cursor.fetchone()['cnt']
    
    print(f"   ✅ 数据插入完成")
    print(f"   插入记录数：{target_count:,} 条")
    print(f"   耗时：{duration:.2f} 秒")
    
    # Step 4: 验证数据
    print(f"\n【Step 4】数据验证...")
    
    # 4.1 验证总量对比
    print("\n   4.1 总量对比验证:")
    cursor.execute(f"""
        SELECT 
            SUM(IFNULL(`度数`，0)) as total_energy,
            SUM(IFNULL(`电费`，0)) as total_cost
        FROM {SOURCE_TABLE}
    """)
    source_totals = cursor.fetchone()
    
    cursor.execute(f"""
        SELECT 
            SUM(overview_total_energy) as total_energy,
            SUM(overview_total_cost) as total_cost
        FROM {TARGET_TABLE}
    """)
    target_totals = cursor.fetchone()
    
    print(f"     源表总能耗：{source_totals['total_energy']:,.2f} kWh")
    print(f"     汇总表总能耗：{target_totals['total_energy']:,.2f} kWh")
    print(f"     差异：{abs(source_totals['total_energy'] - target_totals['total_energy']):,.2f} kWh")
    
    print(f"     源表总电费：{source_totals['total_cost']:,.2f} 元")
    print(f"     汇总表总电费：{target_totals['total_cost']:,.2f} 元")
    print(f"     差异：{abs(source_totals['total_cost'] - target_totals['total_cost']):,.2f} 元")
    
    # 4.2 验证用电方维度
    print("\n   4.2 用电方维度验证:")
    cursor.execute(f"""
        SELECT 
            `用电方`,
            SUM(IFNULL(`度数`，0)) as total_energy,
            COUNT(DISTINCT `poi 名称`) as poi_count
        FROM {SOURCE_TABLE}
        WHERE `用电方` IS NOT NULL AND `用电方` != ''
        GROUP BY `用电方`
    """)
    source_consumer = cursor.fetchall()
    
    cursor.execute(f"""
        SELECT 
            SUM(mobile_cumulative_energy) as mobile_energy,
            SUM(mobile_poi_count) as mobile_poi,
            SUM(tower_cumulative_energy) as tower_energy,
            SUM(tower_poi_count) as tower_poi
        FROM {TARGET_TABLE}
    """)
    target_consumer = cursor.fetchone()
    
    mobile_data = next((row for row in source_consumer if row['用电方'] == '移动'), None)
    tower_data = next((row for row in source_consumer if row['用电方'] == '电塔'), None)
    
    print(f"     移动用户:")
    print(f"       源表：{mobile_data['total_energy'] if mobile_data else 0:,.2f} kWh, {mobile_data['poi_count'] if mobile_data else 0} POI")
    print(f"       汇总表：{target_consumer['mobile_energy']:,.2f} kWh, {target_consumer['mobile_poi']} POI")
    
    print(f"     电塔用户:")
    print(f"       源表：{tower_data['total_energy'] if tower_data else 0:,.2f} kWh, {tower_data['poi_count'] if tower_data else 0} POI")
    print(f"       汇总表：{target_consumer['tower_energy']:,.2f} kWh, {target_consumer['tower_poi']} POI")
    
    # 4.3 查看示例数据
    print(f"\n   4.3 最新数据示例:")
    cursor.execute(f"""
        SELECT 
            stat_date,
            district,
            grid,
            overview_total_energy,
            overview_total_cost,
            mobile_cumulative_energy,
            mobile_poi_count,
            tower_cumulative_energy,
            tower_poi_count
        FROM {TARGET_TABLE}
        ORDER BY stat_date DESC, district, grid
        LIMIT 5
    """)
    sample_data = cursor.fetchall()
    
    for row in sample_data:
        print(f"     - 日期:{row['stat_date']}, 区县:{row['district']}, 网格:{row['grid']}")
        print(f"       总能耗:{row['overview_total_energy']:,.2f}kWh, 总电费:{row['overview_total_cost']:,.2f}元")
        print(f"       移动能耗:{row['mobile_cumulative_energy']:,.2f}kWh (POI:{row['mobile_poi_count']}个)")
        print(f"       电塔能耗:{row['tower_cumulative_energy']:,.2f}kWh (POI:{row['tower_poi_count']}个)")
    
    print("\n" + "=" * 70)
    print("✅ 数据重建完成！")
    print("=" * 70)

except Exception as e:
    print(f"\n❌ 操作失败：{e}")
    import traceback
    traceback.print_exc()
finally:
    if conn.open:
        conn.close()
    print("\n数据库连接已关闭")
