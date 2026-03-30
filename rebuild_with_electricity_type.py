"""
Rebuild energy_charge_daily_summary with electricity type aggregation - Safe version
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

conn = pymysql.connect(**DB_CONFIG)
cursor = conn.cursor()

try:
    print("=" * 70)
    print("Rebuilding energy_charge_daily_summary table")
    print("with electricity type aggregation...")
    print("=" * 70)
    
    # Step 1: Clear existing data
    print("\n【Step 1】Clearing existing data...")
    cursor.execute("TRUNCATE TABLE energy_charge_daily_summary")
    conn.commit()
    print("   ✅ Table truncated")
    
    # Step 2: Insert aggregated data using INSERT ... SELECT
    print("\n【Step 2】Aggregating data from energy_charge using INSERT ... SELECT...")
    
    insert_sql = """
    INSERT INTO energy_charge_daily_summary (
        stat_date, district, grid, poi_name, electricity_type, electricity_attr,
        meter_number, total_energy, total_cost,
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
        tower_cumulative_energy, tower_poi_count,
        direct_power_supply_energy, direct_power_supply_cost,
        indirect_power_supply_energy, indirect_power_supply_cost
    )
    SELECT
        `日期` as stat_date,
        IFNULL(`归属单元`, '') as district,
        IFNULL(`归属网格`, '') as grid,
        MIN(`poi名称`) as poi_name,
        MIN(`电表`) as meter,
        MIN(`用电类型`) as electricity_type,
        MIN(`用电属性`) as electricity_attr,
        COALESCE(SUM(`度数`), 0) as total_energy,
        COALESCE(SUM(`电费`), 0) as total_cost,
        COALESCE(SUM(`度数`), 0) as overview_total_energy,
        COALESCE(SUM(`电费`), 0) as overview_total_cost,
        COUNT(DISTINCT `poi名称`) as overview_poi_count,
        COUNT(DISTINCT `电表`) as overview_device_count,
        COALESCE(SUM(`度数`), 0) as electricity_by_district_energy,
        COALESCE(SUM(`度数`), 0) as electricity_by_grid_energy,
        COALESCE(SUM(`度数`), 0) as electricity_by_poi_energy,
        COALESCE(SUM(`度数`), 0) as poi_stat_energy,
        COALESCE(SUM(`电费`), 0) as poi_stat_cost,
        COALESCE(SUM(`度数`), 0) as electricity_type_energy,
        COALESCE(SUM(`电费`), 0) as electricity_type_cost,
        COALESCE(SUM(`度数`), 0) as trend_daily_energy,
        COALESCE(SUM(`电费`), 0) as trend_daily_cost,
        COALESCE(SUM(`度数`), 0) as trend_monthly_energy,
        COALESCE(SUM(`电费`), 0) as trend_monthly_cost,
        COALESCE(SUM(`度数`), 0) as trend_yearly_energy,
        COALESCE(SUM(`电费`), 0) as trend_yearly_cost,
        COUNT(*) as record_count,
        COALESCE(SUM(CASE WHEN `用电方` = '移动' THEN `度数` ELSE 0 END), 0) as mobile_cumulative_energy,
        COUNT(DISTINCT CASE WHEN `用电方` = '移动' THEN `poi名称` END) as mobile_poi_count,
        COALESCE(SUM(CASE WHEN `用电方` = '铁塔' THEN `度数` ELSE 0 END), 0) as tower_cumulative_energy,
        COUNT(DISTINCT CASE WHEN `用电方` = '铁塔' THEN `poi名称` END) as tower_poi_count,
        COALESCE(SUM(CASE WHEN `用电类型` = '直供电' THEN `度数` ELSE 0 END), 0) as direct_power_supply_energy,
        COALESCE(SUM(CASE WHEN `用电类型` = '直供电' THEN `电费` ELSE 0 END), 0) as direct_power_supply_cost,
        COALESCE(SUM(CASE WHEN `用电类型` = '转供电' THEN `度数` ELSE 0 END), 0) as indirect_power_supply_energy,
        COALESCE(SUM(CASE WHEN `用电类型` = '转供电' THEN `电费` ELSE 0 END), 0) as indirect_power_supply_cost
    FROM energy_charge
    GROUP BY `日期`, `归属单元`, `归属网格`
    """
    
    print("   Executing INSERT ... SELECT...")
    cursor.execute(insert_sql)
    conn.commit()
    
    print(f"   ✅ Successfully inserted {cursor.rowcount:,} records")
    
    # Step 3: Verify data
    print("\n【Step 3】Verifying data...")
    cursor.execute("""
        SELECT 
            COUNT(*) as total_records,
            SUM(direct_power_supply_energy) as direct_energy,
            SUM(direct_power_supply_cost) as direct_cost,
            SUM(indirect_power_supply_energy) as indirect_energy,
            SUM(indirect_power_supply_cost) as indirect_cost
        FROM energy_charge_daily_summary
    """)
    stats = cursor.fetchone()
    
    print(f"   Total records: {stats[0]:,}")
    print(f"   Direct power supply energy: {stats[1]:,.2f} kWh")
    print(f"   Direct power supply cost: {stats[2]:,.2f} 元")
    print(f"   Indirect power supply energy: {stats[3]:,.2f} kWh")
    print(f"   Indirect power supply cost: {stats[4]:,.2f} 元")
    
    print("\n" + "=" * 70)
    print("✅ Rebuild completed successfully!")
    print("=" * 70)

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    if conn.open:
        conn.close()
        print("\nDatabase connection closed")

