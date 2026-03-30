"""数据聚合模块"""

from datetime import datetime, timedelta
from typing import Dict, List, Tuple
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class DataAggregator:
    """数据聚合器"""

    def __init__(self, db, config):
        self.db = db
        self.config = config
        self.batch_size = config.get('task.batch_size', 50000)

    def run_incremental_update(self, last_run_time: datetime = None) -> Dict:
        """执行增量更新"""
        result = {
            'success': False,
            'records_processed': 0,
            'records_inserted': 0,
            'records_updated': 0,
            'new_last_time': None,
            'error': None
        }

        try:
            if last_run_time is None:
                last_run_time = self._get_default_start_time()

            current_time = datetime.now()
            target_date = last_run_time.date() if last_run_time else current_time.date()

            logger.info(f"Processing data from {target_date} to {current_time.date()}")

            source_table = self.config.get('source_table', 'energy_charge')
            target_table = self.config.get('target_table', 'energy_charge_daily_summary')

            # 删除目标日期范围的数据
            logger.info(f"Deleting existing summary data for date range: {target_date} to {current_time.date()}")
            delete_sql = f"""
                DELETE FROM {target_table}
                WHERE stat_date >= %s AND stat_date < %s
            """
            self.db.execute(delete_sql, (target_date, current_time.date() + timedelta(days=1)))
            self.db.commit_transaction()
            logger.info("Existing summary data deleted successfully")

            # 使用 GROUP BY 聚合查询
            logger.info("Aggregating data with GROUP BY (date, district, grid)")
            insert_sql = f"""
                INSERT INTO {target_table} (
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
                    record_count,
                    mobile_cumulative_energy, mobile_poi_count,
                    tower_cumulative_energy, tower_poi_count,
                    mobile_electricity_fee, tower_electricity_fee
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
                    COUNT(*) as record_count,
                    COALESCE(SUM(CASE WHEN consumer_type = '移动' THEN total_energy ELSE 0 END), 0) as mobile_cumulative_energy,
                    COUNT(DISTINCT CASE WHEN consumer_type = '移动' THEN poi_name END) as mobile_poi_count,
                    COALESCE(SUM(CASE WHEN consumer_type = '铁塔' THEN total_energy ELSE 0 END), 0) as tower_cumulative_energy,
                    COUNT(DISTINCT CASE WHEN consumer_type = '铁塔' THEN poi_name END) as tower_poi_count,
                    COALESCE(SUM(CASE WHEN consumer_type = '移动' THEN total_cost ELSE 0 END), 0) as mobile_electricity_fee,
                    COALESCE(SUM(CASE WHEN consumer_type = '铁塔' THEN total_cost ELSE 0 END), 0) as tower_electricity_fee,
                    COALESCE(SUM(CASE WHEN electricity_type = '直供电' THEN total_energy ELSE 0 END), 0) as direct_power_supply_energy,
                    COALESCE(SUM(CASE WHEN electricity_type = '直供电' THEN total_cost ELSE 0 END), 0) as direct_power_supply_cost,
                    COALESCE(SUM(CASE WHEN electricity_type = '转供电' THEN total_energy ELSE 0 END), 0) as indirect_power_supply_energy,
                    COALESCE(SUM(CASE WHEN electricity_type = '转供电' THEN total_cost ELSE 0 END), 0) as indirect_power_supply_cost
                FROM (
                    SELECT
                        日期 as stat_date,
                        COALESCE(归属单元，'') as district,
                        COALESCE(归属网格，'') as grid,
                        poi 名称 as poi_name,
                        电表 as meter,
                        用电类型 as electricity_type,
                        用电属性 as electricity_attr,
                        COALESCE(度数，0) as total_energy,
                        COALESCE(电费，0) as total_cost,
                        用电方 as consumer_type
                    FROM {source_table}
                    WHERE 日期 >= %s AND 日期 < %s
                ) as source_data
                GROUP BY stat_date, district, grid
            """

            self.db.execute(insert_sql, (target_date, current_time.date() + timedelta(days=1)))
            self.db.commit_transaction()

            # 获取插入的记录数
            count_sql = f"""
                SELECT COUNT(*) as cnt FROM {target_table}
                WHERE stat_date >= %s AND stat_date < %s
            """
            count_result = self.db.fetch_one(count_sql, (target_date, current_time.date() + timedelta(days=1)))
            inserted_count = count_result['cnt'] if count_result else 0

            result['success'] = True
            result['records_processed'] = inserted_count
            result['records_inserted'] = inserted_count
            result['records_updated'] = 0
            result['new_last_time'] = current_time

            logger.info(f"Incremental update completed: {inserted_count} records inserted")

            return result

        except Exception as e:
            logger.error(f"Incremental update failed: {e}")
            self.db.rollback_transaction()
            result['error'] = str(e)
            return result

    def _get_default_start_time(self) -> datetime:
        """获取默认起始时间"""
        target_table = self.config.get('target_table', 'energy_charge_daily_summary')

        sql = f"SELECT MAX(stat_date) as max_date FROM {target_table}"
        result = self.db.fetch_one(sql)

        if result and result['max_date']:
            max_date = result['max_date']
            if isinstance(max_date, str):
                max_date = datetime.strptime(max_date, '%Y-%m-%d')
            return datetime.combine(max_date, datetime.min.time())

        sql = f"SELECT MIN(日期) as min_date FROM {self.config.get('source_table', 'energy_charge')}"
        result = self.db.fetch_one(sql)

        if result and result['min_date']:
            min_date = result['min_date']
            if isinstance(min_date, str):
                min_date = datetime.strptime(min_date, '%Y-%m-%d')
            return datetime.combine(min_date, datetime.min.time())

        return datetime.now() - timedelta(days=1)

    def _get_date_range_count(self, start_date, end_date) -> int:
        """获取日期范围内的记录数"""
        source_table = self.config.get('source_table', 'energy_charge')
        sql = f"SELECT COUNT(*) as cnt FROM {source_table} WHERE 日期 >= %s AND 日期 < %s"
        result = self.db.fetch_one(sql, (start_date, end_date + timedelta(days=1)))
        return result['cnt'] if result else 0

    def run_full_rebuild(self, start_date: datetime = None, end_date: datetime = None) -> Dict:
        """全量重建汇总数据"""
        result = {
            'success': False,
            'records_processed': 0,
            'records_inserted': 0,
            'error': None
        }

        try:
            if start_date is None:
                start_date = self._get_default_start_time()

            if end_date is None:
                end_date = datetime.now()

            target_table = self.config.get('target_table', 'energy_charge_daily_summary')

            logger.info(f"Truncating summary table: {target_table}")
            self.db.execute(f"TRUNCATE TABLE {target_table}")
            self.db.commit_transaction()

            logger.info("Running incremental update with full rebuild mode")
            return self.run_incremental_update(start_date)

        except Exception as e:
            logger.error(f"Full rebuild failed: {e}")
            result['error'] = str(e)
            return result
