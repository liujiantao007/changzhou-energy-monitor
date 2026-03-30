"""数据库管理模块"""

import pymysql
from pymysql.cursors import DictCursor
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
import logging

logger = logging.getLogger(__name__)


class DatabaseManager:
    """数据库管理器"""

    def __init__(self, config):
        self.config = config
        self.connection = None
        self.cursor = None

    def connect(self):
        """连接数据库"""
        db_config = self.config.get_database_config()
        self.connection = pymysql.connect(
            host=db_config.get('host'),
            port=db_config.get('port', 3306),
            user=db_config.get('user'),
            password=db_config.get('password'),
            database=db_config.get('database'),
            charset=db_config.get('charset', 'utf8mb4'),
            connect_timeout=db_config.get('connect_timeout', 30),
            read_timeout=db_config.get('read_timeout', 300),
            write_timeout=db_config.get('write_timeout', 300),
            cursorclass=DictCursor
        )
        self.cursor = self.connection.cursor()
        logger.info(f"Database connected: {db_config.get('host')}:{db_config.get('port')}")

    def check_connection(self) -> bool:
        """检查数据库连接"""
        try:
            if self.cursor:
                self.cursor.execute("SELECT 1")
                return True
            return False
        except Exception as e:
            logger.error(f"Database connection check failed: {e}")
            return False

    def close(self):
        """关闭数据库连接"""
        if self.cursor:
            try:
                self.cursor.close()
            except:
                pass
            self.cursor = None
        if self.connection:
            try:
                self.connection.close()
            except:
                pass
            self.connection = None
        logger.info("Database connection closed")

    def begin_transaction(self):
        """开始事务"""
        if self.connection:
            self.connection.begin()

    def commit_transaction(self):
        """提交事务"""
        if self.connection:
            self.connection.commit()

    def rollback_transaction(self):
        """回滚事务"""
        if self.connection:
            self.connection.rollback()

    def execute(self, sql: str, params: Tuple = None) -> int:
        """执行SQL语句"""
        try:
            if params:
                return self.cursor.execute(sql, params)
            else:
                return self.cursor.execute(sql)
        except Exception as e:
            logger.error(f"SQL execution failed: {sql[:100]}... Error: {e}")
            raise

    def fetch_all(self, sql: str, params: Tuple = None) -> List[Dict]:
        """获取所有结果"""
        self.execute(sql, params)
        return self.cursor.fetchall()

    def fetch_one(self, sql: str, params: Tuple = None) -> Optional[Dict]:
        """获取单条结果"""
        self.execute(sql, params)
        return self.cursor.fetchone()

    def initialize_summary_table(self):
        """初始化汇总表"""
        target_table = self.config.get('target_table', 'energy_charge_daily_summary')

        create_table_sql = f"""
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

            -- 能耗总览所需指标
            overview_total_energy DECIMAL(15,4) DEFAULT 0 COMMENT '能耗总览-总能耗',
            overview_total_cost DECIMAL(15,4) DEFAULT 0 COMMENT '能耗总览-总电费',
            overview_poi_count INT DEFAULT 0 COMMENT '能耗总览-POI数量',
            overview_device_count INT DEFAULT 0 COMMENT '能耗总览-设备数量',

            -- 用电量分项统计
            electricity_by_district_energy DECIMAL(15,4) DEFAULT 0 COMMENT '用电量分项-各区县能耗',
            electricity_by_grid_energy DECIMAL(15,4) DEFAULT 0 COMMENT '用电量分项-各网格能耗',
            electricity_by_poi_energy DECIMAL(15,4) DEFAULT 0 COMMENT '用电量分项-各POI能耗',

            -- POI分项统计
            poi_stat_energy DECIMAL(15,4) DEFAULT 0 COMMENT 'POI分项统计-能耗',
            poi_stat_cost DECIMAL(15,4) DEFAULT 0 COMMENT 'POI分项统计-电费',

            -- 用电类型统计
            electricity_type_energy DECIMAL(15,4) DEFAULT 0 COMMENT '用电类型-能耗',
            electricity_type_cost DECIMAL(15,4) DEFAULT 0 COMMENT '用电类型-电费',

            -- 能耗趋势图（按日期）
            trend_daily_energy DECIMAL(15,4) DEFAULT 0 COMMENT '趋势图-日能耗',
            trend_daily_cost DECIMAL(15,4) DEFAULT 0 COMMENT '趋势图-日电费',

            -- 能耗趋势图（按月份）
            trend_monthly_energy DECIMAL(15,4) DEFAULT 0 COMMENT '趋势图-月能耗',
            trend_monthly_cost DECIMAL(15,4) DEFAULT 0 COMMENT '趋势图-月电费',

            -- 能耗趋势图（按年份）
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
            self.execute(create_table_sql)
            self.commit_transaction()
            logger.info(f"Summary table '{target_table}' initialized successfully")
        except Exception as e:
            self.rollback_transaction()
            logger.error(f"Failed to initialize summary table: {e}")
            raise

    def get_last_summary_time(self) -> Optional[datetime]:
        """获取上次汇总时间"""
        summary_table = self.config.get('summary_table', 'summary_metadata')

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
            self.execute(create_meta_sql)
            self.commit_transaction()
        except:
            self.rollback_transaction()

        sql = f"SELECT last_run_time FROM {summary_table} WHERE task_name = 'daily_summary'"
        result = self.fetch_one(sql)

        if result and result['last_run_time']:
            return result['last_run_time']
        return None

    def update_last_summary_time(self, run_time: datetime):
        """更新上次汇总时间"""
        summary_table = self.config.get('summary_table', 'summary_metadata')

        sql = f"""
        INSERT INTO {summary_table} (task_name, last_run_time, last_run_status)
        VALUES ('daily_summary', %s, 'success')
        ON DUPLICATE KEY UPDATE
            last_run_time = VALUES(last_run_time),
            last_run_status = VALUES(last_run_status),
            updated_at = CURRENT_TIMESTAMP
        """

        self.execute(sql, (run_time,))
        self.commit_transaction()
        logger.info(f"Updated last summary time to: {run_time}")

    def get_data_count(self) -> int:
        """获取源表数据总量"""
        source_table = self.config.get('source_table', 'energy_charge')
        sql = f"SELECT COUNT(*) as cnt FROM {source_table}"
        result = self.fetch_one(sql)
        return result['cnt'] if result else 0

    def get_date_range_data(self, start_date: datetime, end_date: datetime, batch_size: int = 50000) -> Tuple[List[Dict], bool]:
        """分批获取指定日期范围的数据"""
        source_table = self.config.get('source_table', 'energy_charge')

        sql = f"""
        SELECT
            日期 as stat_date,
            归属单元 as district,
            归属网格 as grid,
            poi名称 as poi_name,
            电表 as meter,
            用电类型 as electricity_type,
            用电属性 as electricity_attr,
            度数 as energy,
            电费 as cost
        FROM {source_table}
        WHERE 日期 >= %s AND 日期 < %s
        ORDER BY 日期, 归属单元, 归属网格
        LIMIT %s
        """

        results = self.fetch_all(sql, (start_date, end_date, batch_size))
        has_more = len(results) == batch_size

        return results, has_more

    def bulk_insert_summary(self, data_list: List[Dict]):
        """批量插入汇总数据"""
        target_table = self.config.get('target_table', 'energy_charge_daily_summary')

        if not data_list:
            return 0

        sql = f"""
        INSERT INTO {target_table} (
            stat_date, district, grid, poi_name,
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
        ) VALUES (
            %(stat_date)s, %(district)s, %(grid)s, %(poi_name)s,
            %(electricity_type)s, %(electricity_attr)s,
            %(total_energy)s, %(total_cost)s,
            %(overview_total_energy)s, %(overview_total_cost)s,
            %(overview_poi_count)s, %(overview_device_count)s,
            %(electricity_by_district_energy)s, %(electricity_by_grid_energy)s, %(electricity_by_poi_energy)s,
            %(poi_stat_energy)s, %(poi_stat_cost)s,
            %(electricity_type_energy)s, %(electricity_type_cost)s,
            %(trend_daily_energy)s, %(trend_daily_cost)s,
            %(trend_monthly_energy)s, %(trend_monthly_cost)s,
            %(trend_yearly_energy)s, %(trend_yearly_cost)s,
            %(record_count)s
        )
        ON DUPLICATE KEY UPDATE
            total_energy = VALUES(total_energy),
            total_cost = VALUES(total_cost),
            overview_total_energy = VALUES(overview_total_energy),
            overview_total_cost = VALUES(overview_total_cost),
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

        try:
            for item in data_list:
                self.execute(sql, item)
            self.commit_transaction()
            return len(data_list)
        except Exception as e:
            self.rollback_transaction()
            logger.error(f"Bulk insert failed: {e}")
            raise

    def get_district_list(self) -> List[str]:
        """获取区县列表"""
        target_table = self.config.get('target_table', 'energy_charge_daily_summary')
        sql = f"SELECT DISTINCT district FROM {target_table} WHERE district IS NOT NULL AND district != '' ORDER BY district"
        results = self.fetch_all(sql)
        return [r['district'] for r in results]

    def get_grid_list(self, district: str = None) -> List[str]:
        """获取网格列表"""
        target_table = self.config.get('target_table', 'energy_charge_daily_summary')
        if district:
            sql = f"SELECT DISTINCT grid FROM {target_table} WHERE district = %s AND grid IS NOT NULL AND grid != '' ORDER BY grid"
            results = self.fetch_all(sql, (district,))
        else:
            sql = f"SELECT DISTINCT grid FROM {target_table} WHERE grid IS NOT NULL AND grid != '' ORDER BY grid"
            results = self.fetch_all(sql)
        return [r['grid'] for r in results]

    def get_summary_data(self, stat_date: str = None, district: str = None, grid: str = None) -> List[Dict]:
        """获取汇总数据"""
        target_table = self.config.get('target_table', 'energy_charge_daily_summary')

        where_clauses = []
        params = []

        if stat_date:
            where_clauses.append("stat_date = %s")
            params.append(stat_date)

        if district:
            where_clauses.append("district = %s")
            params.append(district)

        if grid:
            where_clauses.append("grid = %s")
            params.append(grid)

        where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

        sql = f"""
        SELECT
            stat_date as A,
            district as J,
            grid as GRID,
            poi_name as L,
            meter as B,
            electricity_type as K,
            electricity_attr as I,
            overview_total_energy as AB,
            overview_total_cost as AC,
            electricity_by_district_energy,
            electricity_by_grid_energy,
            electricity_by_poi_energy,
            poi_stat_energy,
            poi_stat_cost,
            electricity_type_energy,
            electricity_type_cost,
            trend_daily_energy,
            trend_daily_cost,
            trend_monthly_energy,
            trend_monthly_cost,
            trend_yearly_energy,
            trend_yearly_cost,
            record_count
        FROM {target_table}
        WHERE {where_sql}
        ORDER BY stat_date DESC, district, grid
        """

        return self.fetch_all(sql, tuple(params) if params else None)
