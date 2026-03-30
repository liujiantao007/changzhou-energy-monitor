"""
Rebuild energy_charge_daily_summary - Fixed column count
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
    print("Rebuilding energy_charge_daily_summary table...")
    
    # Step 1: Truncate table
    cursor.execute("TRUNCATE TABLE energy_charge_daily_summary")
    conn.commit()
    print("Table truncated")
    
    # Step 2: Insert data
    print("Inserting data...")
    start_time = datetime.now()
    
    # Build SQL with explicit column count
    insert_sql = """
    INSERT INTO energy_charge_daily_summary (
        stat_date, district, grid, poi_name, electricity_type, electricity_attr,
        meter_number, total_energy, total_cost,
        overview_total_energy, overview_total_cost, overview_poi_count, overview_device_count,
        electricity_by_district_energy, electricity_by_grid_energy, electricity_by_poi_energy,
        poi_stat_energy, poi_stat_cost,
        electricity_type_energy, electricity_type_cost,
        trend_daily_energy, trend_daily_cost,
        trend_monthly_energy, trend_monthly_cost,
        trend_yearly_energy, trend_yearly_cost,
        record_count,
        mobile_cumulative_energy, mobile_poi_count,
        tower_cumulative_energy, tower_poi_count,
        created_at, updated_at
    ) VALUES (
        %s, %s, %s, %s, %s, %s,
        %s, %s, %s,
        %s, %s, %s, %s,
        %s, %s, %s,
        %s, %s,
        %s, %s,
        %s, %s,
        %s, %s,
        %s, %s,
        %s,
        %s, %s,
        %s, %s,
        %s, %s
    )
    """
    
    # Get data from source
    select_sql = """
    SELECT
        stat_date, district, grid, poi_name, electricity_type, electricity_attr,
        meter, total_energy, total_cost,
        overview_total_energy, overview_total_cost, overview_poi_count, overview_device_count,
        electricity_by_district_energy, electricity_by_grid_energy, electricity_by_poi_energy,
        poi_stat_energy, poi_stat_cost,
        electricity_type_energy, electricity_type_cost,
        trend_daily_energy, trend_daily_cost,
        trend_monthly_energy, trend_monthly_cost,
        trend_yearly_energy, trend_yearly_cost,
        record_count,
        mobile_cumulative_energy, mobile_poi_count,
        tower_cumulative_energy, tower_poi_count,
        created_at, updated_at
    FROM (
        SELECT
            `日期` as stat_date,
            IFNULL(`归属单元`, '') as district,
            IFNULL(`归属网格`, '') as grid,
            MIN(`poi名称`) as poi_name,
            '' as electricity_type,
            '' as electricity_attr,
            MIN(`电表`) as meter,
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
            NOW() as created_at,
            NOW() as updated_at
        FROM energy_charge
        GROUP BY `日期`, `归属单元`, `归属网格`
    ) as aggregated
    """
    
    cursor.execute(select_sql)
    rows = cursor.fetchall()
    
    print(f"Retrieved {len(rows)} rows from source")
    
    # Insert in batches
    batch_size = 1000
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        cursor.executemany(insert_sql, batch)
        conn.commit()
        print(f"  Inserted {min(i+batch_size, len(rows))}/{len(rows)} rows")
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    print(f"\nCompleted in {duration:.2f}s")
    
    # Verify
    cursor.execute("SELECT COUNT(*), SUM(overview_total_energy), SUM(mobile_cumulative_energy), SUM(tower_cumulative_energy) FROM energy_charge_daily_summary")
    stats = cursor.fetchone()
    print(f"\nVerification:")
    print(f"  Total records: {stats[0]:,}")
    print(f"  Total energy: {stats[1]:,.2f} kWh")
    print(f"  Mobile energy: {stats[2]:,.2f} kWh")
    print(f"  Tower energy: {stats[3]:,.2f} kWh")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    if conn.open:
        conn.close()


