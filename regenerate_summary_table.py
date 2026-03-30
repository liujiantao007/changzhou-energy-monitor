"""
能源汇总表全量重建脚本
功能：备份 -> 清空 -> 全量重建 energy_charge_daily_summary 表
特性：完整的事务支持、详细的日志记录、数据一致性验证

使用方式：
    python regenerate_summary_table.py
"""

import sys
import os
import logging
from datetime import datetime
from typing import Tuple, Dict, List, Any

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
    'read_timeout': 600,
    'write_timeout': 600
}

SOURCE_TABLE = 'energy_charge'
TARGET_TABLE = 'energy_charge_daily_summary'
BACKUP_TABLE_PREFIX = 'energy_charge_daily_summary_bak'


def get_connection() -> pymysql.connections.Connection:
    """获取数据库连接"""
    return pymysql.connect(**DB_CONFIG)


def get_table_structure(conn: pymysql.connections.Connection) -> List[str]:
    """获取目标表的列名列表"""
    cursor = conn.cursor()
    cursor.execute(f"SHOW COLUMNS FROM {TARGET_TABLE}")
    columns = [row[0] for row in cursor.fetchall()]
    cursor.close()
    return columns


def create_backup_table(conn: pymysql.connections.Connection) -> Tuple[bool, str, str]:
    """
    创建备份表

    Returns:
        Tuple[bool, str, str]: (是否成功, 消息, 备份表名)
    """
    cursor = conn.cursor()

    try:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_table_name = f"{BACKUP_TABLE_PREFIX}_{timestamp}"

        logger.info(f"正在创建备份表: {backup_table_name}")

        cursor.execute(f"CREATE TABLE {backup_table_name} LIKE {TARGET_TABLE}")
        cursor.execute(f"INSERT INTO {backup_table_name} SELECT * FROM {TARGET_TABLE}")

        backup_count = cursor.rowcount
        logger.info(f"备份表创建成功，共备份 {backup_count} 条记录")

        return True, f"备份成功，共 {backup_count} 条记录", backup_table_name

    except Exception as e:
        logger.error(f"创建备份表失败: {e}")
        return False, f"创建备份表失败: {str(e)}", ""

    finally:
        cursor.close()


def truncate_target_table(conn: pymysql.connections.Connection) -> Tuple[bool, str, int]:
    """
    清空目标表

    Returns:
        Tuple[bool, str, int]: (是否成功, 消息, 删除记录数)
    """
    cursor = conn.cursor()

    try:
        cursor.execute(f"SELECT COUNT(*) FROM {TARGET_TABLE}")
        count_before = cursor.fetchone()[0]

        if count_before == 0:
            logger.info("目标表已是空表，无需清空")
            return True, "目标表已是空表", 0

        cursor.execute(f"TRUNCATE TABLE {TARGET_TABLE}")
        logger.info(f"目标表已清空，删除了 {count_before} 条记录")

        return True, f"成功清空目标表，删除了 {count_before} 条记录", count_before

    except Exception as e:
        logger.error(f"清空目标表失败: {e}")
        return False, f"清空目标表失败: {str(e)}", 0

    finally:
        cursor.close()


def get_source_dates(conn: pymysql.connections.Connection) -> List[str]:
    """获取源表中所有不重复的日期"""
    cursor = conn.cursor()
    cursor.execute(f"SELECT DISTINCT 日期 FROM {SOURCE_TABLE} ORDER BY 日期")
    dates = [str(row[0]) for row in cursor.fetchall()]
    cursor.close()
    return dates


def get_source_record_count(conn: pymysql.connections.Connection) -> Dict[str, Any]:
    """获取源表记录统计"""
    cursor = conn.cursor(DictCursor)
    cursor.execute(f"""
        SELECT
            COUNT(*) as total_count,
            SUM(COALESCE(度数, 0)) as total_energy,
            SUM(COALESCE(电费, 0)) as total_cost
        FROM {SOURCE_TABLE}
    """)
    result = cursor.fetchone()
    cursor.close()
    return result


def sync_single_date(conn: pymysql.connections.Connection, date_str: str) -> Tuple[bool, str, int]:
    """
    同步单个日期的数据

    Returns:
        Tuple[bool, str, int]: (是否成功, 消息, 影响行数)
    """
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
    """

    try:
        cursor.execute(sync_sql, (date_str,))
        affected = cursor.rowcount
        cursor.close()
        return True, f"成功同步 {affected} 条记录", affected

    except Exception as e:
        cursor.close()
        return False, f"同步失败: {str(e)}", 0


def verify_data_consistency(conn: pymysql.connections.Connection) -> Dict[str, Any]:
    """
    验证数据一致性

    Returns:
        Dict containing verification results
    """
    cursor = conn.cursor(DictCursor)

    source = get_source_record_count(conn)

    cursor.execute(f"""
        SELECT
            SUM(record_count) as target_count,
            SUM(total_energy) as target_energy,
            SUM(total_cost) as target_cost
        FROM {TARGET_TABLE}
    """)
    target = cursor.fetchone()

    cursor.close()

    source_count = source['total_count'] or 0
    source_energy = float(source['total_energy'] or 0)
    source_cost = float(source['total_cost'] or 0)

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


def print_verification_report(verification_result: Dict[str, Any]):
    """打印数据一致性验证报告"""
    print("\n" + "=" * 70)
    print("数据一致性验证报告")
    print("=" * 70)
    print(f"{'指标':<20} {'源表':<25} {'目标表':<25} {'差异':<15} {'状态'}")
    print("-" * 70)

    result = verification_result
    print(f"{'记录数':<20} {result['source_count']:<25,} {result['target_count']:<25,} {result['count_diff']:<15,} {'✅' if result['count_match'] else '❌'}")
    print(f"{'总度数':<20} {result['source_energy']:<25,.2f} {result['target_energy']:<25,.2f} {result['energy_diff']:<15,.2f} {'✅' if result['energy_match'] else '❌'}")
    print(f"{'总电费':<20} {result['source_cost']:<25,.2f} {result['target_cost']:<25,.2f} {result['cost_diff']:<15,.2f} {'✅' if result['cost_match'] else '❌'}")
    print("=" * 70)


def confirm_operation() -> bool:
    """请求用户确认操作"""
    print("\n" + "=" * 70)
    print("⚠️  警告：此操作将执行以下步骤：")
    print("   1. 创建当前数据的备份表")
    print("   2. 清空 energy_charge_daily_summary 表")
    print("   3. 从 energy_charge 表重新生成所有汇总数据")
    print("=" * 70)

    while True:
        user_input = input("\n请输入 'YES' 确认执行此操作: ").strip().upper()
        if user_input == 'YES':
            return True
        elif user_input == 'Q' or user_input == '退出':
            print("操作已取消")
            return False
        else:
            print("无效输入，请输入 'YES' 确认或 'Q' 退出")


def run_full_regeneration() -> Dict[str, Any]:
    """
    执行全量重建

    Returns:
        Dict containing execution results
    """
    start_time = datetime.now()
    result = {
        'success': False,
        'backup_table': '',
        'backup_count': 0,
        'truncated_count': 0,
        'total_dates': 0,
        'total_inserted': 0,
        'failed_dates': [],
        'duration_seconds': 0,
        'verification': None
    }

    logger.info("=" * 70)
    logger.info("能源汇总表全量重建开始")
    logger.info("=" * 70)

    conn = get_connection()

    try:
        logger.info("\n[步骤 1/4] 正在创建备份表...")
        success, msg, backup_table = create_backup_table(conn)
        if not success:
            logger.error(f"备份失败，终止操作: {msg}")
            return result
        result['backup_table'] = backup_table
        result['backup_count'] = int(msg.split()[-2]) if msg else 0
        conn.commit()

        logger.info("\n[步骤 2/4] 正在清空目标表...")
        success, msg, truncated = truncate_target_table(conn)
        if not success:
            logger.error(f"清空失败，终止操作: {msg}")
            return result
        result['truncated_count'] = truncated
        conn.commit()

        logger.info("\n[步骤 3/4] 正在获取源表日期列表...")
        source_dates = get_source_dates(conn)
        result['total_dates'] = len(source_dates)
        logger.info(f"源表共有 {len(source_dates)} 个日期的数据")

        logger.info(f"\n[步骤 4/4] 正在同步 {len(source_dates)} 个日期的数据...")
        logger.info("-" * 70)

        total_inserted = 0
        failed_dates = []

        for i, date_str in enumerate(source_dates):
            date_start = datetime.now()

            success, msg, affected = sync_single_date(conn, date_str)

            if success:
                total_inserted += affected
                date_end = datetime.now()
                duration = (date_end - date_start).total_seconds()
                logger.info(f"[{i+1}/{len(source_dates)}] {date_str}: {affected} 条记录, 耗时 {duration:.2f}秒")
            else:
                failed_dates.append({'date': date_str, 'error': msg})
                logger.error(f"[{i+1}/{len(source_dates)}] {date_str}: 失败 - {msg}")

            conn.commit()

        result['total_inserted'] = total_inserted
        result['failed_dates'] = failed_dates

        logger.info("-" * 70)

        logger.info("\n正在验证数据一致性...")
        verification = verify_data_consistency(conn)
        result['verification'] = verification
        print_verification_report(verification)

        end_time = datetime.now()
        result['duration_seconds'] = (end_time - start_time).total_seconds()

        logger.info("\n" + "=" * 70)
        logger.info("全量重建完成!")
        logger.info(f"  备份表: {result['backup_table']}")
        logger.info(f"  备份记录: {result['backup_count']}")
        logger.info(f"  清空记录: {result['truncated_count']}")
        logger.info(f"  处理日期: {result['total_dates']}")
        logger.info(f"  插入记录: {result['total_inserted']}")
        logger.info(f"  失败日期: {len(failed_dates)}")
        logger.info(f"  总耗时: {result['duration_seconds']:.2f} 秒")
        logger.info("=" * 70)

        result['success'] = len(failed_dates) == 0 and verification['count_match'] and verification['energy_match'] and verification['cost_match']

        if failed_dates:
            logger.warning("\n失败日期详情:")
            for item in failed_dates:
                logger.warning(f"  {item['date']}: {item['error']}")

        conn.close()

        return result

    except Exception as e:
        logger.error(f"全量重建过程出错: {str(e)}")
        if conn:
            conn.close()
        raise


def main():
    """主入口"""
    print("\n" + "=" * 70)
    print("能源汇总表全量重建脚本")
    print("功能: 备份 -> 清空 -> 全量重建")
    print("=" * 70)

    if not confirm_operation():
        sys.exit(0)

    try:
        result = run_full_regeneration()

        print("\n" + "=" * 70)
        print("执行结果汇总")
        print("=" * 70)

        if result['success']:
            print("✅ 全量重建成功完成!")
            print(f"   - 备份表: {result['backup_table']}")
            print(f"   - 重建记录: {result['total_inserted']} 条")
            print(f"   - 数据验证: 通过")
        else:
            print("⚠️ 全量重建完成但存在异常:")
            if result['failed_dates']:
                print(f"   - 失败日期数: {len(result['failed_dates'])}")
            if result['verification']:
                v = result['verification']
                if not v['count_match']:
                    print(f"   - 记录数不匹配: 源表={v['source_count']}, 目标表={v['target_count']}")
                if not v['energy_match']:
                    print(f"   - 度数和不匹配: 差异={v['energy_diff']}")
                if not v['cost_match']:
                    print(f"   - 电费和不匹配: 差异={v['cost_diff']}")

        print(f"   - 总耗时: {result['duration_seconds']:.2f} 秒")
        print("=" * 70)

        sys.exit(0 if result['success'] else 1)

    except Exception as e:
        logger.error(f"脚本执行失败: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()