"""
能源汇总表完整更新脚本

功能：
1. 更新 energy_charge_daily_summary 表的所有字段
2. 支持批量更新所有日期或指定日期更新

使用方法：
    python update_summary_all.py              # 更新所有日期的所有字段
    python update_summary_all.py 2026-03-20  # 更新指定日期的所有字段
"""

import pymysql
import sys
from datetime import datetime

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


def get_connection():
    """获取数据库连接"""
    return pymysql.connect(**DB_CONFIG)


def get_all_available_dates(conn) -> list:
    """获取源表中所有可用的日期列表"""
    cursor = conn.cursor()
    cursor.execute(f"""
        SELECT DISTINCT 日期 FROM {SOURCE_TABLE}
        ORDER BY 日期 DESC
    """)
    dates = [row[0] for row in cursor.fetchall()]
    cursor.close()
    return dates


def update_basic_fields(conn, date_str: str) -> dict:
    """更新基本汇总字段"""
    cursor = conn.cursor()

    insert_sql = f"""
    INSERT INTO {TARGET_TABLE} (
        stat_date, district, grid,
        overview_total_energy, overview_total_cost,
        overview_poi_count, overview_device_count,
        electricity_by_district_energy, electricity_by_grid_energy,
        electricity_by_poi_energy, poi_stat_energy, poi_stat_cost,
        electricity_type_energy, electricity_type_cost,
        trend_daily_energy, trend_daily_cost,
        trend_monthly_energy, trend_monthly_cost,
        trend_yearly_energy, trend_yearly_cost,
        record_count
    )
    SELECT
        日期 as stat_date,
        COALESCE(归属单元, '') as district,
        COALESCE(归属网格, '') as grid,
        COALESCE(SUM(度数), 0) as overview_total_energy,
        COALESCE(SUM(电费), 0) as overview_total_cost,
        COUNT(DISTINCT poi名称) as overview_poi_count,
        COUNT(DISTINCT 电表) as overview_device_count,
        COALESCE(SUM(度数), 0) as electricity_by_district_energy,
        COALESCE(SUM(度数), 0) as electricity_by_grid_energy,
        COALESCE(SUM(度数), 0) as electricity_by_poi_energy,
        COALESCE(SUM(度数), 0) as poi_stat_energy,
        COALESCE(SUM(电费), 0) as poi_stat_cost,
        COALESCE(SUM(度数), 0) as electricity_type_energy,
        COALESCE(SUM(电费), 0) as electricity_type_cost,
        COALESCE(SUM(度数), 0) as trend_daily_energy,
        COALESCE(SUM(电费), 0) as trend_daily_cost,
        COALESCE(SUM(度数), 0) as trend_monthly_energy,
        COALESCE(SUM(电费), 0) as trend_monthly_cost,
        COALESCE(SUM(度数), 0) as trend_yearly_energy,
        COALESCE(SUM(电费), 0) as trend_yearly_cost,
        COUNT(*) as record_count
    FROM (
        SELECT
            日期,
            COALESCE(归属单元, '') as 归属单元,
            COALESCE(归属网格, '') as 归属网格,
            poi名称,
            用电类型,
            用电属性,
            电表,
            COALESCE(度数, 0) as 度数,
            COALESCE(电费, 0) as 电费
        FROM {SOURCE_TABLE}
        WHERE 日期 = %s
    ) as source_data
    GROUP BY stat_date, district, grid
    """

    try:
        cursor.execute(insert_sql, (date_str,))
        inserted_count = cursor.rowcount
        conn.commit()
        cursor.close()
        return {'success': True, 'inserted': inserted_count}
    except Exception as e:
        conn.rollback()
        cursor.close()
        return {'success': False, 'error': str(e)}


def update_consumer_fields(conn, date_str: str = None) -> dict:
    """更新用电方和供电类型维度字段"""
    cursor = conn.cursor()

    if date_str:
        where_clause = "WHERE 日期 = %s"
        params = (date_str,)
    else:
        where_clause = ""
        params = ()

    results = {}

    # 1. 更新移动用户数据
    update_mobile_sql = f"""
    UPDATE {TARGET_TABLE} t
    INNER JOIN (
        SELECT
            日期 as stat_date,
            COALESCE(归属单元, '') as district,
            COALESCE(归属网格, '') as grid,
            SUM(COALESCE(度数, 0)) as mobile_energy,
            COUNT(DISTINCT poi名称) as mobile_poi
        FROM {SOURCE_TABLE}
        WHERE 用电方 = '移动' {f'AND 日期 = %s' if date_str else ''}
        GROUP BY 日期, 归属单元, 归属网格
    ) s ON t.stat_date = s.stat_date
           AND t.district = s.district
           AND t.grid = s.grid
    SET t.mobile_cumulative_energy = COALESCE(s.mobile_energy, 0),
        t.mobile_poi_count = COALESCE(s.mobile_poi, 0)
    """
    cursor.execute(update_mobile_sql, params)
    results['mobile'] = cursor.rowcount

    # 2. 更新电塔用户数据
    update_tower_sql = f"""
    UPDATE {TARGET_TABLE} t
    INNER JOIN (
        SELECT
            日期 as stat_date,
            COALESCE(归属单元, '') as district,
            COALESCE(归属网格, '') as grid,
            SUM(COALESCE(度数, 0)) as tower_energy,
            COUNT(DISTINCT poi名称) as tower_poi
        FROM {SOURCE_TABLE}
        WHERE 用电方 = '铁塔' {f'AND 日期 = %s' if date_str else ''}
        GROUP BY 日期, 归属单元, 归属网格
    ) s ON t.stat_date = s.stat_date
           AND t.district = s.district
           AND t.grid = s.grid
    SET t.tower_cumulative_energy = COALESCE(s.tower_energy, 0),
        t.tower_poi_count = COALESCE(s.tower_poi, 0)
    """
    cursor.execute(update_tower_sql, params)
    results['tower'] = cursor.rowcount

    # 3. 更新直供电数据
    update_direct_sql = f"""
    UPDATE {TARGET_TABLE} t
    INNER JOIN (
        SELECT
            日期 as stat_date,
            COALESCE(归属单元, '') as district,
            COALESCE(归属网格, '') as grid,
            SUM(COALESCE(度数, 0)) as direct_energy,
            SUM(COALESCE(电费, 0)) as direct_cost
        FROM {SOURCE_TABLE}
        WHERE 用电类型 = '直供电' {f'AND 日期 = %s' if date_str else ''}
        GROUP BY 日期, 归属单元, 归属网格
    ) s ON t.stat_date = s.stat_date
           AND t.district = s.district
           AND t.grid = s.grid
    SET t.direct_power_supply_energy = COALESCE(s.direct_energy, 0),
        t.direct_power_supply_cost = COALESCE(s.direct_cost, 0)
    """
    cursor.execute(update_direct_sql, params)
    results['direct'] = cursor.rowcount

    # 4. 更新转供电数据
    update_indirect_sql = f"""
    UPDATE {TARGET_TABLE} t
    INNER JOIN (
        SELECT
            日期 as stat_date,
            COALESCE(归属单元, '') as district,
            COALESCE(归属网格, '') as grid,
            SUM(COALESCE(度数, 0)) as indirect_energy,
            SUM(COALESCE(电费, 0)) as indirect_cost
        FROM {SOURCE_TABLE}
        WHERE 用电类型 = '转供电' {f'AND 日期 = %s' if date_str else ''}
        GROUP BY 日期, 归属单元, 归属网格
    ) s ON t.stat_date = s.stat_date
           AND t.district = s.district
           AND t.grid = s.grid
    SET t.indirect_power_supply_energy = COALESCE(s.indirect_energy, 0),
        t.indirect_power_supply_cost = COALESCE(s.indirect_cost, 0)
    """
    cursor.execute(update_indirect_sql, params)
    results['indirect'] = cursor.rowcount

    # 5. 更新移动电费数据
    update_mobile_fee_sql = f"""
    UPDATE {TARGET_TABLE} t
    INNER JOIN (
        SELECT
            日期 as stat_date,
            COALESCE(归属单元, '') as district,
            COALESCE(归属网格, '') as grid,
            SUM(COALESCE(电费, 0)) as mobile_fee
        FROM {SOURCE_TABLE}
        WHERE 用电方 = '移动' {f'AND 日期 = %s' if date_str else ''}
        GROUP BY 日期, 归属单元, 归属网格
    ) s ON t.stat_date = s.stat_date
           AND t.district = s.district
           AND t.grid = s.grid
    SET t.mobile_electricity_fee = COALESCE(s.mobile_fee, 0)
    """
    cursor.execute(update_mobile_fee_sql, params)
    results['mobile_fee'] = cursor.rowcount

    # 6. 更新铁塔电费数据
    update_tower_fee_sql = f"""
    UPDATE {TARGET_TABLE} t
    INNER JOIN (
        SELECT
            日期 as stat_date,
            COALESCE(归属单元, '') as district,
            COALESCE(归属网格, '') as grid,
            SUM(COALESCE(电费, 0)) as tower_fee
        FROM {SOURCE_TABLE}
        WHERE 用电方 = '铁塔' {f'AND 日期 = %s' if date_str else ''}
        GROUP BY 日期, 归属单元, 归属网格
    ) s ON t.stat_date = s.stat_date
           AND t.district = s.district
           AND t.grid = s.grid
    SET t.tower_electricity_fee = COALESCE(s.tower_fee, 0)
    """
    cursor.execute(update_tower_fee_sql, params)
    results['tower_fee'] = cursor.rowcount

    conn.commit()
    cursor.close()

    return results


def update_single_date(conn, date_str: str) -> dict:
    """更新单个日期的所有字段"""
    result = {
        'date': date_str,
        'basic': None,
        'consumer': None
    }

    print(f"\n>>> 开始更新 {date_str} ...")

    # Step 1: 更新基本字段（先删除旧数据，再插入新数据）
    print("[Step 1/2] 更新基本汇总字段...")

    cursor = conn.cursor()

    # 检查源表是否有数据
    cursor.execute(f"SELECT COUNT(*) FROM {SOURCE_TABLE} WHERE 日期 = %s", (date_str,))
    source_count = cursor.fetchone()[0]

    if source_count == 0:
        print(f"   [WARN] 源表中不存在 {date_str} 的数据")
        cursor.close()
        result['basic'] = {'success': True, 'inserted': 0, 'skipped': True}
        result['consumer'] = {'success': True, 'skipped': True}
        return result

    # 删除旧数据
    cursor.execute(f"DELETE FROM {TARGET_TABLE} WHERE stat_date = %s", (date_str,))
    deleted_count = cursor.rowcount
    print(f"   已删除 {deleted_count} 条旧数据")

    conn.commit()

    # 插入新数据
    insert_sql = f"""
    INSERT INTO {TARGET_TABLE} (
        stat_date, district, grid,
        overview_total_energy, overview_total_cost,
        overview_poi_count, overview_device_count,
        electricity_by_district_energy, electricity_by_grid_energy,
        electricity_by_poi_energy, poi_stat_energy, poi_stat_cost,
        electricity_type_energy, electricity_type_cost,
        trend_daily_energy, trend_daily_cost,
        trend_monthly_energy, trend_monthly_cost,
        trend_yearly_energy, trend_yearly_cost,
        record_count
    )
    SELECT
        日期 as stat_date,
        COALESCE(归属单元, '') as district,
        COALESCE(归属网格, '') as grid,
        COALESCE(SUM(度数), 0) as overview_total_energy,
        COALESCE(SUM(电费), 0) as overview_total_cost,
        COUNT(DISTINCT poi名称) as overview_poi_count,
        COUNT(DISTINCT 电表) as overview_device_count,
        COALESCE(SUM(度数), 0) as electricity_by_district_energy,
        COALESCE(SUM(度数), 0) as electricity_by_grid_energy,
        COALESCE(SUM(度数), 0) as electricity_by_poi_energy,
        COALESCE(SUM(度数), 0) as poi_stat_energy,
        COALESCE(SUM(电费), 0) as poi_stat_cost,
        COALESCE(SUM(度数), 0) as electricity_type_energy,
        COALESCE(SUM(电费), 0) as electricity_type_cost,
        COALESCE(SUM(度数), 0) as trend_daily_energy,
        COALESCE(SUM(电费), 0) as trend_daily_cost,
        COALESCE(SUM(度数), 0) as trend_monthly_energy,
        COALESCE(SUM(电费), 0) as trend_monthly_cost,
        COALESCE(SUM(度数), 0) as trend_yearly_energy,
        COALESCE(SUM(电费), 0) as trend_yearly_cost,
        COUNT(*) as record_count
    FROM (
        SELECT
            日期,
            COALESCE(归属单元, '') as 归属单元,
            COALESCE(归属网格, '') as 归属网格,
            poi名称,
            用电类型,
            用电属性,
            电表,
            COALESCE(度数, 0) as 度数,
            COALESCE(电费, 0) as 电费
        FROM {SOURCE_TABLE}
        WHERE 日期 = %s
    ) as source_data
    GROUP BY stat_date, district, grid
    """

    cursor.execute(insert_sql, (date_str,))
    inserted_count = cursor.rowcount
    conn.commit()
    print(f"   [OK] 插入 {inserted_count} 条基本汇总数据")
    cursor.close()

    result['basic'] = {'success': True, 'inserted': inserted_count}

    # Step 2: 更新用电方维度字段
    print("[Step 2/2] 更新用电方维度字段...")
    consumer_result = update_consumer_fields(conn, date_str)
    result['consumer'] = consumer_result
    print(f"   [OK] 移动用户: {consumer_result.get('mobile', 0)} 行")
    print(f"   [OK] 电塔用户: {consumer_result.get('tower', 0)} 行")
    print(f"   [OK] 直供电: {consumer_result.get('direct', 0)} 行")
    print(f"   [OK] 转供电: {consumer_result.get('indirect', 0)} 行")
    print(f"   [OK] 移动电费: {consumer_result.get('mobile_fee', 0)} 行")
    print(f"   [OK] 铁塔电费: {consumer_result.get('tower_fee', 0)} 行")

    return result


def main():
    """主入口"""
    print("\n" + "=" * 60)
    print("能源汇总表完整更新脚本")
    print("=" * 60)

    if len(sys.argv) < 2:
        print("\n使用方法:")
        print("  python update_summary_all.py              # 更新所有日期")
        print("  python update_summary_all.py 2026-03-20  # 更新指定日期")
        print("\n功能:")
        print("  1. 更新基本汇总字段（total_energy, total_cost 等）")
        print("  2. 更新用电方维度字段（移动/铁塔用电量、POI数量等）")
        print("  3. 更新供电类型维度字段（直供电/转供电用电量、电费）")
        print("=" * 60)

        conn = get_connection()
        try:
            dates = get_all_available_dates(conn)
            print(f"\n>>> 找到 {len(dates)} 个可用日期，开始批量更新...")

            success_count = 0
            fail_count = 0

            for i, date in enumerate(dates, 1):
                date_str = date.strftime('%Y-%m-%d')
                print(f"\n[{i}/{len(dates)}] 正在处理 {date_str}...")

                try:
                    result = update_single_date(conn, date_str)
                    if result['basic'] and result['basic'].get('success'):
                        success_count += 1
                        print(f"[{i}/{len(dates)}] {date_str} 更新成功 [OK]")
                    else:
                        fail_count += 1
                        print(f"[{i}/{len(dates)}] {date_str} 更新失败 [FAIL]")
                except Exception as e:
                    fail_count += 1
                    print(f"[{i}/{len(dates)}] {date_str} 更新失败 [FAIL]: {e}")

            print("\n" + "=" * 60)
            print("批量更新完成!")
            print(f"  总日期数: {len(dates)}")
            print(f"  成功: {success_count} 个")
            print(f"  失败: {fail_count} 个")
            print("=" * 60)

        finally:
            conn.close()
        return

    date_str = sys.argv[1]
    print(f"\n>>> 收到更新请求: 日期 = {date_str}")

    conn = get_connection()
    try:
        result = update_single_date(conn, date_str)

        print("\n" + "=" * 60)
        print("执行结果:")
        print(f"  日期: {date_str}")
        if result['basic'] and not result['basic'].get('skipped'):
            print(f"  基本字段: {result['basic'].get('inserted', 0)} 条")
        if result['consumer'] and not result['consumer'].get('skipped'):
            c = result['consumer']
            print(f"  移动用户: {c.get('mobile', 0)} 行")
            print(f"  电塔用户: {c.get('tower', 0)} 行")
            print(f"  直供电: {c.get('direct', 0)} 行")
            print(f"  转供电: {c.get('indirect', 0)} 行")
            print(f"  移动电费: {c.get('mobile_fee', 0)} 行")
            print(f"  铁塔电费: {c.get('tower_fee', 0)} 行")
        print("  状态: [OK]")
        print("=" * 60)

    finally:
        conn.close()

    sys.exit(0)


if __name__ == "__main__":
    main()
