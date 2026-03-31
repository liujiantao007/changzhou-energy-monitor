"""
能源汇总表每日增量更新脚本
功能：根据指定日期，先删除该日期的旧数据，再插入新生成的汇总数据

使用方式：
    python update_daily_summary.py 2026-03-20
"""

import sys
import os
import logging
from datetime import datetime
from typing import Tuple, Dict, Any

script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

import pymysql
from pymysql.cursors import DictCursor


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
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
    'read_timeout': 300,
    'write_timeout': 300
}

SOURCE_TABLE = 'energy_charge'
TARGET_TABLE = 'energy_charge_daily_summary'


def get_connection() -> pymysql.connections.Connection:
    """获取数据库连接"""
    return pymysql.connect(**DB_CONFIG)


def validate_date(date_str: str) -> Tuple[bool, str, datetime]:
    """
    验证日期格式

    Returns:
        Tuple[bool, str, datetime]: (是否成功, 消息, 解析后的日期)
    """
    if not date_str:
        return False, "日期参数不能为空", None

    formats = ['%Y-%m-%d', '%Y/%m/%d', '%Y%m%d']
    for fmt in formats:
        try:
            parsed_date = datetime.strptime(date_str, fmt)
            return True, "日期格式正确", parsed_date
        except ValueError:
            continue

    return False, f"日期格式错误，请使用 YYYY-MM-DD 格式（如：2026-03-20）", None


def check_source_data_exists(conn: pymysql.connections.Connection, date: datetime) -> Tuple[bool, int]:
    """
    检查源表是否存在指定日期的数据

    Returns:
        Tuple[bool, int]: (是否存在, 记录数)
    """
    cursor = conn.cursor()
    cursor.execute(f"""
        SELECT COUNT(*) FROM {SOURCE_TABLE} WHERE 日期 = %s
    """, (date.date(),))
    count = cursor.fetchone()[0]
    cursor.close()
    return count > 0, count


def delete_daily_data(conn: pymysql.connections.Connection, date: datetime) -> Tuple[bool, str, int]:
    """
    删除指定日期的数据

    Returns:
        Tuple[bool, str, int]: (是否成功, 消息, 删除记录数)
    """
    cursor = conn.cursor()

    try:
        delete_sql = f"DELETE FROM {TARGET_TABLE} WHERE stat_date = %s"
        cursor.execute(delete_sql, (date.date(),))
        deleted_count = cursor.rowcount

        logger.info(f"已删除 {deleted_count} 条 {date.strftime('%Y-%m-%d')} 的数据")
        return True, f"成功删除 {deleted_count} 条数据", deleted_count

    except Exception as e:
        logger.error(f"删除数据失败: {e}")
        return False, f"删除数据失败: {str(e)}", 0

    finally:
        cursor.close()


def insert_daily_data(conn: pymysql.connections.Connection, date: datetime) -> Tuple[bool, str, int]:
    """
    插入指定日期的汇总数据（使用 GROUP BY 聚合）

    Returns:
        Tuple[bool, str, int]: (是否成功, 消息, 插入记录数)
    """
    cursor = conn.cursor()

    insert_sql = f"""
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
    """

    try:
        logger.info(f"正在聚合插入 {date.strftime('%Y-%m-%d')} 的数据...")
        cursor.execute(insert_sql, (date.date(),))
        inserted_count = cursor.rowcount

        logger.info(f"成功插入 {inserted_count} 条聚合数据")
        return True, f"成功插入 {inserted_count} 条数据", inserted_count

    except Exception as e:
        logger.error(f"插入数据失败: {e}")
        return False, f"插入数据失败: {str(e)}", 0

    finally:
        cursor.close()


def verify_daily_data(conn: pymysql.connections.Connection, date: datetime) -> Dict[str, Any]:
    """
    验证指定日期的数据一致性

    Returns:
        Dict containing verification results
    """
    cursor = conn.cursor(DictCursor)

    cursor.execute(f"""
        SELECT
            COUNT(*) as source_count,
            SUM(COALESCE(度数, 0)) as source_energy,
            SUM(COALESCE(电费, 0)) as source_cost
        FROM {SOURCE_TABLE}
        WHERE 日期 = %s
    """, (date.date(),))
    source = cursor.fetchone()

    cursor.execute(f"""
        SELECT
            SUM(record_count) as target_count,
            SUM(total_energy) as target_energy,
            SUM(total_cost) as target_cost
        FROM {TARGET_TABLE}
        WHERE stat_date = %s
    """, (date.date(),))
    target = cursor.fetchone()

    cursor.close()

    source_count = source['source_count'] or 0
    source_energy = float(source['source_energy'] or 0)
    source_cost = float(source['source_cost'] or 0)

    target_count = target['target_count'] or 0
    target_energy = float(target['target_energy'] or 0)
    target_cost = float(target['target_cost'] or 0)

    energy_diff = abs(source_energy - target_energy)
    cost_diff = abs(source_cost - target_cost)
    count_diff = abs(source_count - target_count)

    return {
        'count_match': count_diff == 0,
        'energy_match': energy_diff < 0.01,
        'cost_match': cost_diff < 0.01,
        'source_count': source_count,
        'target_count': target_count,
        'source_energy': source_energy,
        'target_energy': target_energy,
        'source_cost': source_cost,
        'target_cost': target_cost,
        'count_diff': count_diff,
        'energy_diff': energy_diff,
        'cost_diff': cost_diff
    }


def print_verification_report(date_str: str, verification_result: Dict[str, Any]):
    """打印数据一致性验证报告"""
    check_ok = "[OK]" if verification_result['count_match'] else "[FAIL]"
    print("\n" + "-" * 60)
    print(f"数据一致性验证报告 - {date_str}")
    print("-" * 60)
    print(f"{'指标':<15} {'源表':<20} {'目标表':<20} {'差异':<12} {'状态'}")
    print("-" * 60)

    result = verification_result
    print(f"{'记录数':<15} {result['source_count']:<20,} {result['target_count']:<20,} {result['count_diff']:<12,} {check_ok}")
    print(f"{'总度数':<15} {result['source_energy']:<20,.2f} {result['target_energy']:<20,.2f} {result['energy_diff']:<12,.2f} {check_ok}")
    print(f"{'总电费':<15} {result['source_cost']:<20,.2f} {result['target_cost']:<20,.2f} {result['cost_diff']:<12,.2f} {check_ok}")
    print("-" * 60)


def update_daily(date_str: str) -> Dict[str, Any]:
    """
    更新单日数据的主函数

    Returns:
        Dict containing execution results
    """
    result = {
        'date': date_str,
        'source_exists': False,
        'source_count': 0,
        'deleted_count': 0,
        'inserted_count': 0,
        'duration_seconds': 0,
        'verification': None,
        'success': False
    }

    start_time = datetime.now()

    logger.info("=" * 60)
    logger.info(f"开始更新 {date_str} 的数据")
    logger.info("=" * 60)

    valid, msg, parsed_date = validate_date(date_str)
    if not valid:
        logger.error(f"日期验证失败: {msg}")
        return result

    conn = get_connection()

    try:
        logger.info(f"正在检查源表是否存在 {date_str} 的数据...")
        source_exists, source_count = check_source_data_exists(conn, parsed_date)
        result['source_exists'] = source_exists
        result['source_count'] = source_count

        if not source_exists:
            logger.warning(f"源表中不存在 {date_str} 的数据，终止操作")
            return result

        logger.info(f"源表有 {source_count} 条记录")

        try:
            conn.begin()

            logger.info(f"\n[步骤 1/2] 删除旧数据...")
            success, msg, deleted = delete_daily_data(conn, parsed_date)
            if not success:
                conn.rollback()
                logger.error(f"删除失败: {msg}")
                return result
            result['deleted_count'] = deleted

            logger.info(f"\n[步骤 2/2] 插入新数据...")
            success, msg, inserted = insert_daily_data(conn, parsed_date)
            if not success:
                conn.rollback()
                logger.error(f"插入失败: {msg}")
                return result
            result['inserted_count'] = inserted

            conn.commit()
            logger.info("事务已提交")

        except Exception as e:
            conn.rollback()
            logger.error(f"事务已回滚: {e}")
            return result

        logger.info("\n正在验证数据一致性...")
        verification = verify_daily_data(conn, parsed_date)
        result['verification'] = verification
        print_verification_report(date_str, verification)

    finally:
        conn.close()
        logger.info("数据库连接已关闭")

    end_time = datetime.now()
    result['duration_seconds'] = (end_time - start_time).total_seconds()

    result['success'] = (
        result['source_exists'] and
        verification['count_match'] and
        verification['energy_match'] and
        verification['cost_match']
    )

    logger.info("\n" + "=" * 60)
    logger.info(f"更新完成!")
    logger.info(f"  日期: {date_str}")
    logger.info(f"  源表记录: {result['source_count']}")
    logger.info(f"  删除: {result['deleted_count']} 条")
    logger.info(f"  插入: {result['inserted_count']} 条")
    logger.info(f"  耗时: {result['duration_seconds']:.2f} 秒")
    logger.info(f"  状态: {'[OK]' if result['success'] else '[FAIL]'}")
    logger.info("=" * 60)

    return result


def get_all_available_dates(conn) -> list:
    """
    获取源表中所有可用的日期列表

    Returns:
        List of datetime objects
    """
    cursor = conn.cursor()
    cursor.execute(f"""
        SELECT DISTINCT 日期 FROM {SOURCE_TABLE}
        ORDER BY 日期 DESC
    """)
    dates = [row[0] for row in cursor.fetchall()]
    cursor.close()
    return dates


def main():
    """主入口"""
    if len(sys.argv) < 2:
        print("\n" + "=" * 60)
        print("能源汇总表每日增量更新脚本")
        print("=" * 60)
        print("\n使用方法:")
        print("  python update_daily_summary.py              # 更新所有日期")
        print("  python update_daily_summary.py 2026-03-20   # 更新指定日期")
        print("\n日期格式:")
        print("  - YYYY-MM-DD: 2026-03-20")
        print("  - YYYY/MM/DD: 2026/03/20")
        print("  - YYYYMMDD:   20260320")
        print("\n功能说明:")
        print("  1. 不带参数：遍历源表中所有日期，逐日更新汇总表")
        print("  2. 带参数：仅更新指定日期的汇总数据")
        print("=" * 60)

        logger.info("\n>>> 无日期参数，开始遍历所有可用日期...")

        conn = get_connection()
        try:
            dates = get_all_available_dates(conn)
            logger.info(f"找到 {len(dates)} 个可用日期")

            if not dates:
                logger.warning("源表中没有找到任何数据")
                return

            success_count = 0
            fail_count = 0

            for i, date in enumerate(dates, 1):
                date_str = date.strftime('%Y-%m-%d')
                logger.info(f"\n[{i}/{len(dates)}] 正在处理 {date_str}...")

                result = update_daily(date_str)

                if result['success']:
                    success_count += 1
                    logger.info(f"[{i}/{len(dates)}] {date_str} 更新成功 [OK]")
                else:
                    fail_count += 1
                    logger.error(f"[{i}/{len(dates)}] {date_str} 更新失败 [FAIL]")

            logger.info("\n" + "=" * 60)
            logger.info(f"批量更新完成!")
            logger.info(f"  总日期数: {len(dates)}")
            logger.info(f"  成功: {success_count} 个")
            logger.info(f"  失败: {fail_count} 个")
            logger.info("=" * 60)

        finally:
            conn.close()
        return

    date_str = sys.argv[1]

    logger.info(f"\n>>> 收到更新请求: 日期 = {date_str}")

    result = update_daily(date_str)

    print("\n" + "=" * 60)
    print("执行结果:")
    print(f"  状态: {'[OK]' if result['success'] else '[FAIL]'}")
    print(f"  源表记录: {result['source_count']} 条")
    print(f"  删除: {result['deleted_count']} 条")
    print(f"  插入: {result['inserted_count']} 条")
    print(f"  耗时: {result['duration_seconds']:.2f} 秒")
    print("=" * 60)

    if not result['success'] and result['source_exists']:
        print("\n数据一致性验证:")
        v = result['verification']
        if v:
            if not v['count_match']:
                print(f"  - 记录数不匹配: 源表={v['source_count']}, 目标表={v['target_count']}")
            if not v['energy_match']:
                print(f"  - 度数和不匹配: 差异={v['energy_diff']}")
            if not v['cost_match']:
                print(f"  - 电费和不匹配: 差异={v['cost_diff']}")

    sys.exit(0 if result['success'] else 1)


if __name__ == '__main__':
    main()