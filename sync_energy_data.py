"""
能源数据全量同步脚本
功能：将 energy_charge 表数据同步到 energy_charge_daily_summary 表
特性：支持增量更新、详细日志、数据一致性验证
"""

import pymysql
from pymysql.cursors import DictCursor
from datetime import datetime, timedelta
import time
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

DB_CONFIG = {
    'host': '10.38.78.217',
    'port': 3220,
    'user': 'liujiantao',
    'password': 'Liujt!@#',
    'database': 'energy_management_2026',
    'charset': 'utf8mb4',
    'connect_timeout': 60,
    'read_timeout': 300
}

SOURCE_TABLE = 'energy_charge'
TARGET_TABLE = 'energy_charge_daily_summary'
BATCH_SIZE = 10000


def get_source_dates():
    """获取源表中所有不重复的日期"""
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()

    sql = f"SELECT DISTINCT 日期 FROM {SOURCE_TABLE} ORDER BY 日期"
    cursor.execute(sql)
    dates = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()

    return dates


def get_target_dates():
    """获取目标表中已有的日期"""
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()

    sql = f"SELECT DISTINCT stat_date FROM {TARGET_TABLE}"
    cursor.execute(sql)
    dates = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()

    return dates


def sync_single_date(conn, date):
    """同步单个日期的数据"""
    cursor = conn.cursor()

    sync_sql = f"""
    INSERT INTO {TARGET_TABLE} (
        stat_date, district, grid, poi_name,
        electricity_type, electricity_attr, meter_number,
        total_energy, total_cost,
        overview_total_energy, overview_total_cost,
        overview_poi_count, overview_device_count,
        electricity_by_district_energy, electricity_by_grid_energy, electricity_by_poi_energy,
        poi_stat_energy, poi_stat_cost,
        electricity_type_energy, electricity_type_cost,
        trend_daily_energy, trend_daily_cost,
        trend_monthly_energy, trend_monthly_cost,
        trend_yearly_energy, trend_yearly_cost,
        record_count
    )
    SELECT
        stat_date,
        district,
        grid,
        MIN(poi_name) as poi_name,
        MIN(electricity_type) as electricity_type,
        MIN(electricity_attr) as electricity_attr,
        COUNT(DISTINCT meter) as meter_number,
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
        COUNT(*) as record_count
    FROM (
        SELECT
            日期 as stat_date,
            COALESCE(归属单元, '') as district,
            COALESCE(归属网格, '') as grid,
            poi名称 as poi_name,
            用电类型 as electricity_type,
            用电属性 as electricity_attr,
            电表 as meter,
            COALESCE(度数, 0) as total_energy,
            COALESCE(电费, 0) as total_cost
        FROM {SOURCE_TABLE}
        WHERE 日期 = %s
    ) as source_data
    GROUP BY stat_date, district, grid
    ON DUPLICATE KEY UPDATE
        poi_name = VALUES(poi_name),
        electricity_type = VALUES(electricity_type),
        electricity_attr = VALUES(electricity_attr),
        meter_number = VALUES(meter_number),
        total_energy = VALUES(total_energy),
        total_cost = VALUES(total_cost),
        overview_total_energy = VALUES(overview_total_energy),
        overview_total_cost = VALUES(overview_total_cost),
        overview_poi_count = VALUES(overview_poi_count),
        overview_device_count = VALUES(overview_device_count),
        electricity_by_district_energy = VALUES(electricity_by_district_energy),
        electricity_by_grid_energy = VALUES(electricity_by_grid_energy),
        electricity_by_poi_energy = VALUES(electricity_by_poi_energy),
        poi_stat_energy = VALUES(poi_stat_energy),
        poi_stat_cost = VALUES(poi_stat_cost),
        electricity_type_energy = VALUES(electricity_type_energy),
        electricity_type_cost = VALUES(electricity_type_cost),
        trend_daily_energy = VALUES(trend_daily_energy),
        trend_daily_cost = VALUES(trend_daily_cost),
        trend_monthly_energy = VALUES(trend_monthly_energy),
        trend_monthly_cost = VALUES(trend_monthly_cost),
        trend_yearly_energy = VALUES(trend_yearly_energy),
        trend_yearly_cost = VALUES(trend_yearly_cost),
        record_count = VALUES(record_count),
        updated_at = CURRENT_TIMESTAMP
    """

    cursor.execute(sync_sql, (date,))
    affected = cursor.rowcount
    cursor.close()

    return affected


def verify_data_consistency(date=None):
    """验证数据一致性"""
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor(DictCursor)

    if date:
        where_clause = "WHERE 日期 = %s"
        params = (date,)
        date_str = str(date)
    else:
        where_clause = ""
        params = ()
        date_str = "全部日期"

    source_sql = f"""
        SELECT
            COUNT(*) as source_count,
            SUM(COALESCE(度数, 0)) as source_energy,
            SUM(COALESCE(电费, 0)) as source_cost
        FROM {SOURCE_TABLE} {where_clause}
    """

    target_sql = f"""
        SELECT
            SUM(record_count) as target_count,
            SUM(total_energy) as target_energy,
            SUM(total_cost) as target_cost
        FROM {TARGET_TABLE} {('WHERE stat_date = %s' if date else '')}
    """

    cursor.execute(source_sql, params)
    source = cursor.fetchone()

    cursor.execute(target_sql, params)
    target = cursor.fetchone()

    cursor.close()
    conn.close()

    source_count = source['source_count'] or 0
    source_energy = float(source['source_energy'] or 0)
    source_cost = float(source['source_cost'] or 0)

    target_count = target['target_count'] or 0
    target_energy = float(target['target_energy'] or 0)
    target_cost = float(target['target_cost'] or 0)

    energy_diff = abs(source_energy - target_energy)
    cost_diff = abs(source_cost - target_cost)
    count_diff = abs(source_count - target_count)

    print(f"\n{'='*70}")
    print(f"数据一致性验证报告 - {date_str}")
    print(f"{'='*70}")
    print(f"{'指标':<20} {'源表':<25} {'目标表':<25} {'差异':<15} {'状态'}")
    print(f"{'-'*70}")
    print(f"{'记录数':<20} {source_count:<25,} {target_count:<25,} {count_diff:<15,} {'✅' if count_diff == 0 else '❌'}")
    print(f"{'总度数':<20} {source_energy:<25,.2f} {target_energy:<25,.2f} {energy_diff:<15,.2f} {'✅' if energy_diff < 0.01 else '❌'}")
    print(f"{'总电费':<20} {source_cost:<25,.2f} {target_cost:<25,.2f} {cost_diff:<15,.2f} {'✅' if cost_diff < 0.01 else '❌'}")
    print(f"{'='*70}")

    return {
        'count_match': count_diff == 0,
        'energy_match': energy_diff < 0.01,
        'cost_match': cost_diff < 0.01,
        'source_count': source_count,
        'target_count': target_count,
        'source_energy': source_energy,
        'target_energy': target_energy,
        'source_cost': source_cost,
        'target_cost': target_cost
    }


def run_full_sync():
    """执行全量同步"""
    print("\n" + "="*70)
    print("能源数据全量同步")
    print("="*70)

    start_time = datetime.now()
    logger.info(f"同步开始时间: {start_time}")

    conn = pymysql.connect(**DB_CONFIG)

    try:
        source_dates = get_source_dates()
        target_dates = get_target_dates()

        print(f"\n源表日期数量: {len(source_dates)}")
        print(f"目标表已有日期数量: {len(target_dates)}")

        source_dates_set = set(str(d) for d in source_dates)
        target_dates_set = set(str(d) for d in target_dates)

        dates_to_sync = source_dates_set - target_dates_set
        dates_to_update = source_dates_set & target_dates_set

        print(f"需要新增的日期数量: {len(dates_to_sync)}")
        print(f"需要更新的日期数量: {len(dates_to_update)}")

        if dates_to_sync:
            print(f"\n新增日期列表: {sorted(dates_to_sync)}")
        if dates_to_update:
            print(f"\n更新日期列表: {sorted(dates_to_update)[:10]}{'...' if len(dates_to_update) > 10 else ''}")

        total_inserted = 0
        total_updated = 0
        failed_dates = []

        all_dates_to_process = sorted(source_dates_set)

        print(f"\n开始同步 {len(all_dates_to_process)} 个日期的数据...")
        print("-"*70)

        for i, date_str in enumerate(all_dates_to_process):
            date_start = datetime.now()
            logger.info(f"[{i+1}/{len(all_dates_to_process)}] 正在同步 {date_str}")

            try:
                affected = sync_single_date(conn, date_str)
                conn.commit()

                is_update = date_str in target_dates_set
                total_inserted += affected if not is_update else 0
                total_updated += affected if is_update else 0

                date_end = datetime.now()
                duration = (date_end - date_start).total_seconds()

                status = "更新" if is_update else "新增"
                logger.info(f"  [{status}] {date_str}: {affected} 条记录, 耗时 {duration:.2f}秒")

            except Exception as e:
                logger.error(f"  [失败] {date_str}: {str(e)}")
                failed_dates.append({'date': date_str, 'error': str(e)})
                conn.rollback()

        print("-"*70)

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        print(f"\n同步完成!")
        print(f"  总耗时: {duration:.2f} 秒")
        print(f"  新增记录: {total_inserted} 次操作")
        print(f"  更新记录: {total_updated} 次操作")
        print(f"  失败日期: {len(failed_dates)} 个")

        if failed_dates:
            print(f"\n失败详情:")
            for item in failed_dates:
                print(f"  {item['date']}: {item['error']}")

        conn.close()

        print("\n" + "="*70)
        print("数据一致性验证")
        print("="*70)
        verify_data_consistency()

        print("\n" + "="*70)
        print("同步统计")
        print("="*70)

        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor(DictCursor)

        cursor.execute(f"""
            SELECT
                COUNT(DISTINCT stat_date) as date_count,
                COUNT(*) as record_count,
                SUM(total_energy) as total_energy,
                SUM(total_cost) as total_cost,
                SUM(record_count) as source_records
            FROM {TARGET_TABLE}
        """)
        result = cursor.fetchone()

        print(f"目标表统计:")
        print(f"  日期数量: {result['date_count']}")
        print(f"  聚合记录数: {result['record_count']:,}")
        print(f"  原始记录数: {result['source_records']:,}")
        print(f"  总度数: {result['total_energy']:,.2f}")
        print(f"  总电费: {result['total_cost']:,.2f}")

        cursor.close()
        conn.close()

        print("="*70)

        return {
            'success': len(failed_dates) == 0,
            'total_dates': len(all_dates_to_process),
            'failed_count': len(failed_dates),
            'failed_dates': failed_dates,
            'duration': duration
        }

    except Exception as e:
        logger.error(f"同步过程出错: {str(e)}")
        conn.close()
        raise


if __name__ == '__main__':
    print("\n" + "="*70)
    print("能源数据同步脚本")
    print("功能: 将 energy_charge 表数据同步到 energy_charge_daily_summary 表")
    print("特性: 增量更新、数据验证、详细日志")
    print("="*70)

    result = run_full_sync()

    if result['success']:
        print("\n✅ 全量同步成功完成!")
    else:
        print(f"\n⚠️ 同步完成但有 {result['failed_count']} 个日期失败")
        sys.exit(1)