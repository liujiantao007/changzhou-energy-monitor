"""
单日数据更新脚本
功能：根据指定日期，重新删除并插入该日期的汇总数据

使用方式：
    python update_daily.py 2025-12-01
"""

import sys
import os
import logging
from datetime import datetime, timedelta
from typing import Tuple

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
    'connect_timeout': 30,
    'read_timeout': 300,
    'write_timeout': 300
}

SOURCE_TABLE = 'energy_charge'
TARGET_TABLE = 'energy_charge_daily_summary'
BATCH_SIZE = 50000


def validate_date(date_str: str) -> Tuple[bool, str, datetime]:
    """验证日期格式"""
    if not date_str:
        return False, "日期参数不能为空", None

    formats = ['%Y-%m-%d', '%Y/%m/%d', '%Y%m%d']
    for fmt in formats:
        try:
            parsed_date = datetime.strptime(date_str, fmt)
            return True, "日期格式正确", parsed_date
        except ValueError:
            continue

    return False, f"日期格式错误，请使用 YYYY-MM-DD 格式（如：2025-12-01）", None


def delete_daily_data(conn, date: datetime) -> Tuple[bool, str, int]:
    """删除指定日期的数据"""
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


def insert_daily_data(conn, date: datetime) -> Tuple[bool, str, int]:
    """插入指定日期的数据（使用 GROUP BY 聚合）"""
    cursor = conn.cursor()

    try:
        logger.info(f"正在聚合插入 {date.strftime('%Y-%m-%d')} 的数据...")

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
            record_count
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
            COUNT(*) as record_count
        FROM (
            SELECT
                日期 as stat_date,
                COALESCE(归属单元, '') as district,
                COALESCE(归属网格, '') as grid,
                poi名称 as poi_name,
                电表 as meter,
                用电类型 as electricity_type,
                用电属性 as electricity_attr,
                COALESCE(度数, 0) as total_energy,
                COALESCE(电费, 0) as total_cost
            FROM {SOURCE_TABLE}
            WHERE 日期 = %s
        ) as source_data
        GROUP BY stat_date, district, grid
        """

        cursor.execute(insert_sql, (date.date(),))
        inserted_count = cursor.rowcount

        logger.info(f"成功插入 {inserted_count} 条聚合数据")
        return True, f"成功插入 {inserted_count} 条数据", inserted_count

    except Exception as e:
        logger.error(f"插入数据失败: {e}")
        return False, f"插入数据失败: {str(e)}", 0

    finally:
        cursor.close()





def update_daily(date_str: str) -> Tuple[bool, str, dict]:
    """
    更新单日数据的主函数

    Returns:
        Tuple[bool, str, dict]: (是否成功, 消息, 详情字典)
    """
    result_detail = {
        'date': date_str,
        'deleted_count': 0,
        'inserted_count': 0,
        'duration_seconds': 0
    }

    start_time = datetime.now()

    logger.info("=" * 60)
    logger.info(f"开始更新 {date_str} 的数据")
    logger.info("=" * 60)

    valid, msg, parsed_date = validate_date(date_str)
    if not valid:
        return False, msg, result_detail

    try:
        logger.info(f"正在连接数据库 {DB_CONFIG['host']}:{DB_CONFIG['port']}...")

        conn = pymysql.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            database=DB_CONFIG['database'],
            charset=DB_CONFIG['charset'],
            connect_timeout=DB_CONFIG['connect_timeout'],
            read_timeout=DB_CONFIG['read_timeout'],
            write_timeout=DB_CONFIG['write_timeout']
        )

        logger.info("数据库连接成功")

        try:
            conn.begin()

            success, msg, deleted = delete_daily_data(conn, parsed_date)
            if not success:
                conn.rollback()
                return False, msg, result_detail
            result_detail['deleted_count'] = deleted

            success, msg, inserted = insert_daily_data(conn, parsed_date)
            if not success:
                conn.rollback()
                return False, msg, result_detail
            result_detail['inserted_count'] = inserted

            conn.commit()
            logger.info("事务已提交")

        except Exception as e:
            conn.rollback()
            logger.error(f"事务已回滚: {e}")
            return False, f"操作失败，事务已回滚: {str(e)}", result_detail

        finally:
            conn.close()
            logger.info("数据库连接已关闭")

    except Exception as e:
        logger.error(f"数据库连接失败: {e}")
        return False, f"数据库连接失败: {str(e)}", result_detail

    end_time = datetime.now()
    result_detail['duration_seconds'] = (end_time - start_time).total_seconds()

    logger.info("=" * 60)
    logger.info(f"更新完成！")
    logger.info(f"  日期: {date_str}")
    logger.info(f"  删除: {result_detail['deleted_count']} 条")
    logger.info(f"  插入: {result_detail['inserted_count']} 条")
    logger.info(f"  耗时: {result_detail['duration_seconds']:.2f} 秒")
    logger.info("=" * 60)

    return True, f"成功更新 {date_str} 的数据", result_detail


def main():
    """主入口"""
    if len(sys.argv) < 2:
        print("=" * 60)
        print("单日数据更新脚本")
        print("=" * 60)
        print("\n使用方法:")
        print("  python update_daily.py 2025-12-01")
        print("\n日期格式:")
        print("  - YYYY-MM-DD: 2025-12-01")
        print("  - YYYY/MM/DD: 2025/12/01")
        print("  - YYYYMMDD:   20251201")
        print("\n示例:")
        print("  python update_daily.py 2025-12-01")
        print("  python update_daily.py 2025/12/01")
        print("  python update_daily.py 20251201")
        print("=" * 60)
        sys.exit(1)

    date_str = sys.argv[1]

    logger.info(f"\n>>> 收到更新请求: 日期 = {date_str}\n")

    success, msg, detail = update_daily(date_str)

    print("\n" + "=" * 60)
    print("执行结果:")
    print(f"  状态: {'✅ 成功' if success else '❌ 失败'}")
    print(f"  消息: {msg}")
    if detail:
        print(f"  删除: {detail.get('deleted_count', 0)} 条")
        print(f"  插入: {detail.get('inserted_count', 0)} 条")
        print(f"  耗时: {detail.get('duration_seconds', 0):.2f} 秒")
    print("=" * 60)

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
