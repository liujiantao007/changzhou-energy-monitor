"""数据库初始化脚本"""

import pymysql
from datetime import datetime, timedelta
import sys
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

from config import Config


def initialize_database():
    """初始化数据库表"""

    config_path = os.path.join(script_dir, 'config.json')
    config = Config(config_path)
    db_config = config.get_database_config()

    print("=" * 60)
    print("Energy Charge Daily Summary - Database Initialization")
    print("=" * 60)
    print(f"\nDatabase: {db_config['database']} @ {db_config['host']}:{db_config['port']}")

    conn = pymysql.connect(
        host=db_config['host'],
        port=db_config['port'],
        user=db_config['user'],
        password=db_config['password'],
        database=db_config['database'],
        charset='utf8mb4',
        connect_timeout=30
    )

    cursor = conn.cursor()

    target_table = config.get('target_table', 'energy_charge_daily_summary')
    summary_table = config.get('summary_table', 'summary_metadata')

    print(f"\n[1] Creating summary table: {target_table}")

    create_summary_sql = f"""
    CREATE TABLE IF NOT EXISTS {target_table} (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        stat_date DATE NOT NULL COMMENT '统计日期',
        district VARCHAR(50) COMMENT '区县',
        grid VARCHAR(100) COMMENT '网格',
        poi_name VARCHAR(255) COMMENT 'POI名称',
        electricity_type VARCHAR(50) COMMENT '用电类型',
        electricity_attr VARCHAR(50) COMMENT '用电属性',

        total_energy DECIMAL(15,4) DEFAULT 0 COMMENT '总能耗(kWh)',
        total_cost DECIMAL(15,4) DEFAULT 0 COMMENT '总电费(元)',

        overview_total_energy DECIMAL(15,4) DEFAULT 0 COMMENT '能耗总览-总能耗',
        overview_total_cost DECIMAL(15,4) DEFAULT 0 COMMENT '能耗总览-总电费',
        overview_poi_count INT DEFAULT 0 COMMENT '能耗总览-POI数量',
        overview_device_count INT DEFAULT 0 COMMENT '能耗总览-设备数量',

        electricity_by_district_energy DECIMAL(15,4) DEFAULT 0 COMMENT '用电量分项-各区县能耗',
        electricity_by_grid_energy DECIMAL(15,4) DEFAULT 0 COMMENT '用电量分项-各网格能耗',
        electricity_by_poi_energy DECIMAL(15,4) DEFAULT 0 COMMENT '用电量分项-各POI能耗',

        poi_stat_energy DECIMAL(15,4) DEFAULT 0 COMMENT 'POI分项统计-能耗',
        poi_stat_cost DECIMAL(15,4) DEFAULT 0 COMMENT 'POI分项统计-电费',

        electricity_type_energy DECIMAL(15,4) DEFAULT 0 COMMENT '用电类型-能耗',
        electricity_type_cost DECIMAL(15,4) DEFAULT 0 COMMENT '用电类型-电费',

        trend_daily_energy DECIMAL(15,4) DEFAULT 0 COMMENT '趋势图-日能耗',
        trend_daily_cost DECIMAL(15,4) DEFAULT 0 COMMENT '趋势图-日电费',

        trend_monthly_energy DECIMAL(15,4) DEFAULT 0 COMMENT '趋势图-月能耗',
        trend_monthly_cost DECIMAL(15,4) DEFAULT 0 COMMENT '趋势图-月电费',

        trend_yearly_energy DECIMAL(15,4) DEFAULT 0 COMMENT '趋势图-年能耗',
        trend_yearly_cost DECIMAL(15,4) DEFAULT 0 COMMENT '趋势图-年电费',

        record_count INT DEFAULT 0 COMMENT '原始记录数',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        UNIQUE KEY uk_stat_date_district_grid (stat_date, district, grid, poi_name, electricity_type),
        KEY idx_stat_date (stat_date),
        KEY idx_district (district),
        KEY idx_grid (grid),
        KEY idx_poi_name (poi_name),
        KEY idx_electricity_type (electricity_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='能耗数据每日汇总表';
    """

    try:
        cursor.execute(create_summary_sql)
        conn.commit()
        print("  ✓ Summary table created successfully")
    except Exception as e:
        print(f"  ✗ Error creating summary table: {e}")
        conn.rollback()

    print(f"\n[2] Creating metadata table: {summary_table}")

    create_meta_sql = f"""
    CREATE TABLE IF NOT EXISTS {summary_table} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_name VARCHAR(100) NOT NULL,
        last_run_time DATETIME,
        last_run_status VARCHAR(50),
        records_processed INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_task_name (task_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """

    try:
        cursor.execute(create_meta_sql)
        conn.commit()
        print("  ✓ Metadata table created successfully")
    except Exception as e:
        print(f"  ✗ Error creating metadata table: {e}")
        conn.rollback()

    print(f"\n[3] Checking source table: {config.get('source_table', 'energy_charge')}")

    cursor.execute(f"SELECT COUNT(*) as cnt FROM {config.get('source_table', 'energy_charge')}")
    result = cursor.fetchone()
    print(f"  ✓ Source table records: {result[0]:,}")

    cursor.close()
    conn.close()

    print("\n" + "=" * 60)
    print("Database initialization completed!")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Run initial data sync: python daily_summary.py --once")
    print("  2. Start scheduler: python daily_summary.py")
    print("=" * 60)


if __name__ == '__main__':
    initialize_database()
