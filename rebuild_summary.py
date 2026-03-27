
"""
Rebuild energy_charge_daily_summary table
"""

import pymysql
import sys
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

DB_CONFIG = {
    'host': '10.38.78.217',
    'port': 3220,
    'user': 'liujiantao',
    'password': 'Liujt!@#',
    'database': 'energy_management_2026',
    'charset': 'utf8mb4'
}

def parse_date(date_str):
    if not date_str or len(date_str) != 8:
        raise ValueError(f"Invalid date: {date_str}")
    return f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"

def truncate_table(conn):
    cursor = conn.cursor()
    logger.info("Truncating table...")
    try:
        cursor.execute("TRUNCATE TABLE energy_charge_daily_summary")
        conn.commit()
        logger.info("Table truncated")
        return True
    except Exception as e:
        logger.error(f"Truncate failed: {e}")
        conn.rollback()
        return False

def get_where_clause(start_date=None, end_date=None):
    if not start_date and not end_date:
        return ""
    elif start_date and not end_date:
        return f" WHERE DATE(`日期`) = '{start_date}'"
    else:
        return f" WHERE DATE(`日期`) BETWEEN '{start_date}' AND '{end_date}'"

def rebuild_summary(conn, start_date=None, end_date=None):
    cursor = conn.cursor()
    where_clause = get_where_clause(start_date, end_date)
    
    logger.info("=" * 70)
    logger.info("Starting rebuild")
    if where_clause:
        logger.info(f"Data range: {where_clause}")
    else:
        logger.info("Data range: All")
    logger.info("=" * 70)
    
    # 如果是更新指定日期范围，先删除对应的旧数据
    if start_date or end_date:
        logger.info("Deleting old data for specified date range...")
        if start_date and end_date:
            delete_sql = f"""
                DELETE FROM energy_charge_daily_summary 
                WHERE DATE(stat_date) BETWEEN '{start_date}' AND '{end_date}'
            """
        elif start_date:
            delete_sql = f"""
                DELETE FROM energy_charge_daily_summary 
                WHERE DATE(stat_date) = '{start_date}'
            """
        cursor.execute(delete_sql)
        conn.commit()
        logger.info(f"Deleted {cursor.rowcount} old records")
    
    start_time = datetime.now()
    
    insert_sql = f"""
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
        record_count, created_at, updated_at,
        mobile_cumulative_energy, mobile_poi_count,
        tower_cumulative_energy, tower_poi_count,
        direct_power_supply_energy, indirect_power_supply_energy,
        direct_power_supply_cost, indirect_power_supply_cost,
        mobile_electricity_fee, tower_electricity_fee
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
        COALESCE(SUM(total_energy), 0),
        COALESCE(SUM(total_cost), 0),
        COUNT(*),
        NOW(),
        NOW(),
        COALESCE(SUM(CASE WHEN consumer = '移动' THEN total_energy ELSE 0 END), 0),
        COUNT(DISTINCT CASE WHEN consumer = '移动' THEN poi_name END),
        COALESCE(SUM(CASE WHEN consumer = '电塔' OR consumer = '铁塔' THEN total_energy ELSE 0 END), 0),
        COUNT(DISTINCT CASE WHEN consumer = '电塔' OR consumer = '铁塔' THEN poi_name END),
        COALESCE(SUM(CASE WHEN electricity_type = '直供电' THEN total_energy ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN electricity_type = '转供电' THEN total_energy ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN electricity_type = '直供电' THEN total_cost ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN electricity_type = '转供电' THEN total_cost ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN consumer = '移动' THEN total_cost ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN consumer = '电塔' OR consumer = '铁塔' THEN total_cost ELSE 0 END), 0)
    FROM (
        SELECT
            `日期` as stat_date,
            IFNULL(`归属单元`, '') as district,
            IFNULL(`归属网格`, '') as grid,
            `poi名称` as poi_name,
            IFNULL(`用电类型`, '') as electricity_type,
            '' as electricity_attr,
            `电表` as meter,
            IFNULL(`用电方`, '') as consumer,
            IFNULL(`度数`, 0) as total_energy,
            IFNULL(`电费`, 0) as total_cost
        FROM energy_charge
        {where_clause}
    ) as source_data
    GROUP BY stat_date, district, grid
    ORDER BY stat_date DESC
    """
    
    try:
        logger.info("\nInserting aggregated data...")
        cursor.execute(insert_sql)
        inserted_count = cursor.rowcount
        logger.info(f"Inserted: {inserted_count} records")
        
        conn.commit()
        
        elapsed_time = (datetime.now() - start_time).total_seconds()
        logger.info("\n" + "=" * 70)
        logger.info(f"Rebuild complete! Duration: {elapsed_time:.2f}s")
        logger.info("=" * 70)
        
        return True
        
    except Exception as e:
        logger.error(f"\nRebuild failed: {e}")
        logger.error("Rolling back...")
        conn.rollback()
        logger.error("Rollback complete")
        return False

def verify_data(conn, start_date=None, end_date=None):
    cursor = conn.cursor()
    logger.info("\nVerifying data...")
    
    where_clause = get_where_clause(start_date, end_date)
    
    cursor.execute(f"SELECT COUNT(*) as cnt FROM energy_charge{where_clause}")
    source_count = cursor.fetchone()[0]
    
    where_summary = ""
    if start_date and end_date:
        where_summary = f" WHERE stat_date BETWEEN '{start_date}' AND '{end_date}'"
    elif start_date:
        where_summary = f" WHERE stat_date = '{start_date}'"
    
    cursor.execute(f"SELECT COUNT(*) as cnt FROM energy_charge_daily_summary{where_summary}")
    summary_count = cursor.fetchone()[0]
    
    logger.info(f"  energy_charge records: {source_count}")
    logger.info(f"  summary records: {summary_count}")
    
    if summary_count > 0:
        logger.info("Verification passed")
        return True
    else:
        logger.warning("Warning: No data in summary")
        return False

def main():
    start_date = None
    end_date = None
    
    if len(sys.argv) == 2:
        try:
            start_date = parse_date(sys.argv[1])
            logger.info(f"Param: Update single date: {start_date}")
        except ValueError as e:
            logger.error(e)
            sys.exit(1)
    elif len(sys.argv) == 3:
        try:
            start_date = parse_date(sys.argv[1])
            end_date = parse_date(sys.argv[2])
            logger.info(f"Param: Update date range: {start_date} ~ {end_date}")
        except ValueError as e:
            logger.error(e)
            sys.exit(1)
    else:
        logger.info("Param: Update all data")
    
    conn = None
    try:
        conn = pymysql.connect(**DB_CONFIG)
        logger.info("Database connected")
        
        if not start_date and not end_date:
            if not truncate_table(conn):
                logger.error("Truncate failed")
                sys.exit(1)
        
        if not rebuild_summary(conn, start_date, end_date):
            logger.error("Rebuild failed")
            sys.exit(1)
        
        verify_data(conn, start_date, end_date)
        
    except Exception as e:
        logger.error(f"Execution failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if conn and conn.open:
            conn.close()
            logger.info("Database connection closed")

if __name__ == "__main__":
    main()
