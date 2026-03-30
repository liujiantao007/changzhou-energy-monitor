"""
Energy Charge Daily Summary Scheduler
定时任务程序 - 按日汇总 energy_charge 数据

功能：
- 定时从 energy_charge 明细表读取数据
- 按日/区县/网格 维度聚合计算
- 生成汇总数据表 energy_charge_daily_summary
- 支持增量更新，避免全量处理
"""

import os
import sys
import time
import json
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging

script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

from config import Config
from database import DatabaseManager
from aggregator import DataAggregator
from scheduler import Scheduler

logger = logging.getLogger(__name__)


class DailySummaryTask:
    """每日汇总定时任务"""

    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = os.path.join(script_dir, 'config.json')
        self.config = Config(config_path)
        self.db = DatabaseManager(self.config)
        self.aggregator = DataAggregator(self.db, self.config)
        self.scheduler = Scheduler(self.config.get('interval', 600))
        self.last_run_time = None
        self.is_running = False
        self._lock = threading.Lock()

    def initialize(self) -> bool:
        """初始化任务"""
        try:
            logger.info("=" * 60)
            logger.info("Energy Charge Daily Summary Task Initializing...")
            logger.info("=" * 60)

            self.db.connect()
            if not self.db.check_connection():
                logger.error("Database connection failed")
                return False

            self.db.initialize_summary_table()
            self.last_run_time = self.db.get_last_summary_time()

            logger.info(f"Database connected successfully")
            logger.info(f"Last summary time: {self.last_run_time}")
            logger.info(f"Task interval: {self.config.get('interval', 600)} seconds")
            logger.info("Initialization completed")

            return True

        except Exception as e:
            logger.error(f"Initialization failed: {e}")
            return False

    def execute(self) -> Tuple[bool, str]:
        """执行汇总任务"""
        with self._lock:
            if self.is_running:
                logger.warning("Task is already running, skipping this execution")
                return False, "Task is already running"

            self.is_running = True
            start_time = datetime.now()

        try:
            logger.info("=" * 60)
            logger.info(f"Starting daily summary task at {start_time}")
            logger.info("=" * 60)

            self.db.connect()
            if not self.db.check_connection():
                raise Exception("Database connection lost")

            self.db.begin_transaction()

            result = self.aggregator.run_incremental_update(self.last_run_time)

            if result['success']:
                self.db.commit_transaction()
                self.last_run_time = result['new_last_time']
                self.db.update_last_summary_time(self.last_run_time)

                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()

                logger.info("=" * 60)
                logger.info(f"Task completed successfully!")
                logger.info(f"Duration: {duration:.2f} seconds")
                logger.info(f"Records processed: {result['records_processed']}")
                logger.info(f"Records inserted: {result['records_inserted']}")
                logger.info(f"Records updated: {result['records_updated']}")
                logger.info(f"New last time: {self.last_run_time}")
                logger.info("=" * 60)

                return True, f"Success: {result['records_inserted']} inserted, {result['records_updated']} updated"
            else:
                self.db.rollback_transaction()
                raise Exception(result.get('error', 'Unknown error'))

        except Exception as e:
            logger.error(f"Task execution failed: {e}")
            try:
                self.db.rollback_transaction()
            except:
                pass
            return False, str(e)

        finally:
            self.is_running = False
            try:
                self.db.close()
            except:
                pass

    def start(self):
        """启动定时任务"""
        if not self.initialize():
            logger.error("Failed to initialize task, exiting...")
            sys.exit(1)

        logger.info("Starting scheduler...")
        logger.info(f"Next run in {self.config.get('interval', 600)} seconds")

        self.scheduler.start(self.execute)

    def stop(self):
        """停止定时任务"""
        logger.info("Stopping scheduler...")
        self.scheduler.stop()
        self.db.close()
        logger.info("Scheduler stopped")

    def run_once(self) -> Tuple[bool, str]:
        """手动执行一次任务"""
        if not self.is_running:
            self.db.connect()
            self.db.check_connection()
            return self.execute()
        else:
            return False, "Task is already running"


def main():
    """主入口"""
    import argparse

    parser = argparse.ArgumentParser(description='Energy Charge Daily Summary Task')
    parser.add_argument('-c', '--config', type=str, default=None,
                        help='Config file path')
    parser.add_argument('-i', '--interval', type=int, default=None,
                        help='Interval in seconds (overrides config)')
    parser.add_argument('--once', action='store_true',
                        help='Run task once and exit')

    args = parser.parse_args()

    task = DailySummaryTask(args.config)

    if args.interval:
        task.config.set('interval', args.interval)

    if args.once:
        task.initialize()
        success, message = task.run_once()
        print(f"Result: {message}")
        sys.exit(0 if success else 1)
    else:
        task.start()


if __name__ == '__main__':
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    main()
