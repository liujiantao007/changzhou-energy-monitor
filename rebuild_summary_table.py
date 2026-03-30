"""
Rebuild energy_charge_daily_summary table
Correctly handles all columns including mobile/tower consumer dimensions
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
    print("=" * 70)
    
    # Step 1: Truncate table
    print("\n[Step 1] Truncating table...")
    cursor.execute("TRUNCATE TABLE energy_charge_daily_summary")
    conn.commit()
    print("   Table truncated")
    
    # Step 2: Insert aggregated data
    print("\n[Step 2] Inserting aggregated data...")
    start_time = datetime.now()
    
    # SQL with correct column names from energy_charge table
    insert_sql = """
    INSERT INTO energy_charge_daily_summary (
        stat_date, district, grid, poi_name, electricity_type, electricity_attr,
        meter_number,
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
        tower_cumulative_energy, tower_poi_count,
        created_at, updated_at
    )
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
        COALESCE(SUM(CASE WHEN consumer = '移动' THEN total_energy ELSE 0 END), 0),
        COUNT(DISTINCT CASE WHEN consumer = '移动' THEN poi_name END),
        COALESCE(SUM(CASE WHEN consumer = '电塔' THEN total_energy ELSE 0 END), 0),
        COUNT(DISTINCT CASE WHEN consumer = '电塔' THEN poi_name END),
        NOW(),
        NOW()
    FROM (
        SELECT
            `日期` as stat_date,
            IFNULL(`归属单元`, '') as district,
            IFNULL(`归属网格`, '') as grid,
            `poi 名称` as poi_name,
            '' as electricity_type,
            '' as electricity_attr,
            `电表` as meter,
            IFNULL(`用电方`, '') as consumer,
            IFNULL(`度数`, 0) as total_energy,
            IFNULL(`电费`, 0) as total_cost
        FROM energy_charge
    ) as source_data
    GROUP BY stat_date, district, grid
    """
    
    cursor.execute(insert_sql)
    conn.commit()
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    cursor.execute("SELECT COUNT(*) as cnt FROM energy_charge_daily_summary")
    target_count = cursor.fetchone()[0]
    
    print(f"   Inserted {target_count:,} records in {duration:.2f}s")
    
    # Step 3: Verify data
    print("\n[Step 3] Verifying data...")
    
    cursor.execute("SELECT SUM(overview_total_energy), SUM(overview_total_cost) FROM energy_charge_daily_summary")
    totals = cursor.fetchone()
    print(f"   Total energy: {totals[0]:,.2f} kWh")
    print(f"   Total cost: {totals[1]:,.2f} yuan")
    
    cursor.execute("SELECT SUM(mobile_cumulative_energy), SUM(tower_cumulative_energy) FROM energy_charge_daily_summary")
    consumer_totals = cursor.fetchone()
    print(f"   Mobile energy: {consumer_totals[0]:,.2f} kWh")
    print(f"   Tower energy: {consumer_totals[1]:,.2f} kWh")
    
    # Show sample data
    print("\n   Sample data (latest 3 records):")
    cursor.execute("""
        SELECT stat_date, district, grid, overview_total_energy, mobile_cumulative_energy, tower_cumulative_energy
        FROM energy_charge_daily_summary
        ORDER BY stat_date DESC
        LIMIT 3
    """)
    samples = cursor.fetchall()
    for row in samples:
        print(f"     {row[0]} | {row[1]} | {row[2]} | {row[3]:,.2f} kWh | Mobile: {row[4]:,.2f} | Tower: {row[5]:,.2f}")
    
    print("\n" + "=" * 70)
    print("Rebuild completed successfully!")
    print("=" * 70)

except Exception as e:
    print(f"\nError: {e}")
    import traceback
    traceback.print_exc()
finally:
    if conn.open:
        conn.close()
        print("\nDatabase connection closed")
