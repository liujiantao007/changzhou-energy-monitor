"""定时任务调度器模块"""

import time
import threading
from datetime import datetime
from typing import Callable, Optional
import logging

logger = logging.getLogger(__name__)


class Scheduler:
    """简单定时任务调度器"""

    def __init__(self, interval: int = 600):
        self.interval = interval
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._is_running = False

    def start(self, task_func: Callable):
        """启动调度器"""
        if self._is_running:
            logger.warning("Scheduler is already running")
            return

        self._stop_event.clear()
        self._is_running = True

        self._thread = threading.Thread(target=self._run_loop, args=(task_func,), daemon=True)
        self._thread.start()

        logger.info(f"Scheduler started with interval: {self.interval} seconds")

    def stop(self):
        """停止调度器"""
        if not self._is_running:
            logger.warning("Scheduler is not running")
            return

        logger.info("Stopping scheduler...")
        self._stop_event.set()

        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=30)

        self._is_running = False
        logger.info("Scheduler stopped")

    def _run_loop(self, task_func: Callable):
        """运行调度循环"""
        next_run_time = time.time() + self.interval

        while not self._stop_event.is_set():
            current_time = time.time()

            if current_time >= next_run_time:
                try:
                    logger.info(f"Triggering scheduled task at {datetime.now()}")
                    task_func()
                except Exception as e:
                    logger.error(f"Task execution failed: {e}")

                next_run_time = time.time() + self.interval

            sleep_time = max(1, next_run_time - current_time)
            self._stop_event.wait(timeout=sleep_time)

    def set_interval(self, interval: int):
        """设置执行间隔"""
        self.interval = interval
        logger.info(f"Scheduler interval updated to: {interval} seconds")

    def is_running(self) -> bool:
        """检查调度器是否运行中"""
        return self._is_running


class AdvancedScheduler:
    """高级调度器 - 支持 cron 表达式"""

    def __init__(self):
        self._tasks = []
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._is_running = False

    def add_task(self, name: str, func: Callable, interval: int = None, cron: str = None):
        """添加任务"""
        task = {
            'name': name,
            'func': func,
            'interval': interval,
            'cron': cron,
            'last_run': None,
            'next_run': None
        }
        self._tasks.append(task)
        logger.info(f"Task added: {name}")

    def start(self):
        """启动调度器"""
        if self._is_running:
            return

        self._stop_event.clear()
        self._is_running = True

        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()

        logger.info("Advanced scheduler started")

    def stop(self):
        """停止调度器"""
        if not self._is_running:
            return

        logger.info("Stopping advanced scheduler...")
        self._stop_event.set()

        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=30)

        self._is_running = False
        logger.info("Advanced scheduler stopped")

    def _run_loop(self):
        """运行调度循环"""
        while not self._stop_event.is_set():
            current_time = time.time()

            for task in self._tasks:
                if task['interval']:
                    if task['next_run'] is None or current_time >= task['next_run']:
                        try:
                            logger.info(f"Executing task: {task['name']}")
                            task['func']()
                            task['last_run'] = current_time
                            task['next_run'] = current_time + task['interval']
                        except Exception as e:
                            logger.error(f"Task {task['name']} failed: {e}")
                            task['next_run'] = current_time + 60

            self._stop_event.wait(timeout=10)

    def get_status(self) -> dict:
        """获取调度器状态"""
        return {
            'is_running': self._is_running,
            'task_count': len(self._tasks),
            'tasks': [
                {
                    'name': t['name'],
                    'last_run': datetime.fromtimestamp(t['last_run']) if t['last_run'] else None,
                    'next_run': datetime.fromtimestamp(t['next_run']) if t['next_run'] else None
                }
                for t in self._tasks
            ]
        }
