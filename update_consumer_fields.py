"""
补充用电方和供电类型维度统计字段到 energy_charge_daily_summary 表

功能：
更新以下字段：
1. mobile_cumulative_energy: 移动用户日累计用电量
2. mobile_poi_count: 移动用户 POI 数量
3. tower_cumulative_energy: 电塔用户日累计用电量
4. tower_poi_count: 电塔用户 POI 数量
5. direct_power_supply_energy: 直供电用电量
6. indirect_power_supply_energy: 转供电用电量
7. direct_power_supply_cost: 直供电电费
8. indirect_power_supply_cost: 转供电电费
9. mobile_electricity_fee: 移动用户日累计电费
10. tower_electricity_fee: 铁塔用户日累计电费
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


def update_consumer_fields(conn, date_str=None):
    """更新用电方维度字段"""
    cursor = conn.cursor()

    if date_str:
        where_clause = "WHERE 日期 = %s"
        params = (date_str,)
        print(f"\n>>> 更新指定日期 {date_str} 的用电方字段...")
    else:
        where_clause = ""
        params = ()
        print(f"\n>>> 更新所有日期的用电方字段...")

    # 1. 更新移动用户数据
    print("\n[Step 1] 更新移动用户数据...")
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
    mobile_rows = cursor.rowcount
    print(f"   [OK] 更新移动用户数据: {mobile_rows} 行")

    # 2. 更新电塔用户数据
    print("\n[Step 2] 更新电塔用户数据...")
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
    tower_rows = cursor.rowcount
    print(f"   [OK] 更新电塔用户数据: {tower_rows} 行")

    # 3. 更新直供电/转供电数据
    print("\n[Step 3] 更新供电类型数据...")

    # 直供电
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
    direct_rows = cursor.rowcount
    print(f"   [OK] 更新直供电数据: {direct_rows} 行")

    # 转供电
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
    indirect_rows = cursor.rowcount
    print(f"   [OK] 更新转供电数据: {indirect_rows} 行")

    # 4. 更新移动/铁塔电费数据
    print("\n[Step 4] 更新用电方电费数据...")

    # 移动电费
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
    mobile_fee_rows = cursor.rowcount
    print(f"   [OK] 更新移动电费数据: {mobile_fee_rows} 行")

    # 铁塔电费
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
    tower_fee_rows = cursor.rowcount
    print(f"   [OK] 更新铁塔电费数据: {tower_fee_rows} 行")

    conn.commit()
    cursor.close()

    print("\n" + "=" * 60)
    print("执行结果:")
    print(f"  移动用户: {mobile_rows} 行")
    print(f"  电塔用户: {tower_rows} 行")
    print(f"  直供电: {direct_rows} 行")
    print(f"  转供电: {indirect_rows} 行")
    print(f"  移动电费: {mobile_fee_rows} 行")
    print(f"  铁塔电费: {tower_fee_rows} 行")
    print("=" * 60)


def main():
    print("\n" + "=" * 60)
    print("能源汇总表 - 补充用电方维度字段")
    print("=" * 60)

    if len(sys.argv) < 2:
        print("\n使用方法:")
        print("  python update_consumer_fields.py              # 更新所有日期")
        print("  python update_consumer_fields.py 2026-03-20  # 更新指定日期")
        print("=" * 60)

        conn = pymysql.connect(**DB_CONFIG)
        try:
            update_consumer_fields(conn)
        finally:
            conn.close()
        return

    date_str = sys.argv[1]

    print(f"\n>>> 收到更新请求: 日期 = {date_str}")

    conn = pymysql.connect(**DB_CONFIG)
    try:
        update_consumer_fields(conn, date_str)
    finally:
        conn.close()

    sys.exit(0)


if __name__ == "__main__":
    main()
