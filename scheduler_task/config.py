"""配置文件管理模块"""

import os
import json
from typing import Any, Dict, Optional


class Config:
    """配置管理器"""

    def __init__(self, config_path: str = 'config.json'):
        self.config_path = config_path
        self.config = self._load_config()

    def _load_config(self) -> Dict:
        """加载配置文件"""
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(f"Config file not found: {self.config_path}")

        with open(self.config_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def get(self, key: str, default: Any = None) -> Any:
        """获取配置值，支持点号分隔的路径"""
        keys = key.split('.')
        value = self.config

        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
                if value is None:
                    return default
            else:
                return default

        return value if value is not None else default

    def set(self, key: str, value: Any):
        """设置配置值"""
        keys = key.split('.')
        config = self.config

        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]

        config[keys[-1]] = value

    def save(self):
        """保存配置到文件"""
        with open(self.config_path, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, indent=4, ensure_ascii=False)

    def get_database_config(self) -> Dict:
        """获取数据库配置"""
        return self.config.get('database', {})

    def get_task_config(self) -> Dict:
        """获取任务配置"""
        return self.config.get('task', {})
