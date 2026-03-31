# Energy Charge Daily Summary 定时任务说明文档

## 📋 文档信息

| 项目 | 内容 |
|------|------|
| **脚本名称** | `daily_summary.py` |
| **位置** | `scheduler_task/daily_summary.py` |
| **功能** | 从 `energy_charge` 明细表读取数据，按日/区县/网格维度聚合，生成 `energy_charge_daily_summary` 汇总表 |
| **运行模式** | 定时任务 / 单次执行 |

---

## 🚀 快速开始

### 1. 进入脚本目录

```bash
cd scheduler_task
```

### 2. 修改配置文件

编辑 `config.json` 中的数据库连接信息：

```json
{
    "database": {
        "host": "你的数据库IP",
        "port": 3306,
        "user": "用户名",
        "password": "密码",
        "database": "数据库名"
    }
}
```

### 3. 运行定时任务

```bash
# 启动定时任务（默认每600秒执行一次）
python daily_summary.py

# 单次执行
python daily_summary.py --once

# 自定义执行间隔（秒）
python daily_summary.py --interval 3600
```

---

## 📝 命令行参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `-c, --config` | 指定配置文件路径 | `python daily_summary.py -c /path/to/config.json` |
| `-i, --interval` | 设置执行间隔（秒），覆盖配置文件 | `python daily_summary.py --interval 3600` |
| `--once` | 单次执行后退出，不启动定时器 | `python daily_summary.py --once` |

### 使用示例

```bash
# 示例1：使用默认配置启动定时任务
python daily_summary.py

# 示例2：指定配置文件
python daily_summary.py -c /etc/scheduler/config.json

# 示例3：每1小时执行一次
python daily_summary.py --interval 3600

# 示例4：手动执行一次（用于测试）
python daily_summary.py --once

# 示例5：指定配置且单次执行
python daily_summary.py -c config.json --once
```

---

## ⚙️ 配置文件说明

**文件位置**：`scheduler_task/config.json`

### 配置项详解

```json
{
    // 数据库配置
    "database": {
        "host": "10.38.78.217",        // 数据库地址
        "port": 3220,                   // 数据库端口
        "user": "liujiantao",           // 数据库用户名
        "password": "Liujt!@#",        // 数据库密码
        "database": "energy_management_2026",  // 数据库名
        "charset": "utf8mb4",           // 字符集
        "connect_timeout": 30,           // 连接超时时间（秒）
        "read_timeout": 300,             // 读取超时时间（秒）
        "write_timeout": 300             // 写入超时时间（秒）
    },

    // 任务配置
    "task": {
        "interval": 600,                // 执行间隔（秒），默认600秒=10分钟
        "batch_size": 50000,             // 每批处理记录数
        "max_retries": 3,               // 最大重试次数
        "retry_delay": 60                // 重试间隔（秒）
    },

    // 数据源和目标配置
    "source_table": "energy_charge",                    // 源表（明细数据）
    "target_table": "energy_charge_daily_summary",     // 目标表（汇总数据）
    "summary_table": "summary_metadata",               // 元数据表（记录汇总状态）

    // 日志配置
    "log_file": "logs/daily_summary.log",              // 日志文件路径
    "log_level": "INFO"                               // 日志级别：DEBUG/INFO/WARNING/ERROR
}
```

---

## 🗄️ 数据表结构

### 源表：energy_charge（明细表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| record_date | DATE | 记录日期 |
| district | VARCHAR | 区县名称 |
| grid | VARCHAR | 网格名称 |
| consumer | VARCHAR | 用电方 |
| meter_number | VARCHAR | 电表编号 |
| power_type | VARCHAR | 供电类型（直供电/转供电） |
| ... | ... | 其他计费字段 |

### 目标表：energy_charge_daily_summary（汇总表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| summary_date | DATE | 汇总日期 |
| district | VARCHAR | 区县名称 |
| grid | VARCHAR | 网格名称 |
| consumer | VARCHAR | 用电方 |
| total_power | DECIMAL | 总用电量 (kWh) |
| total_cost | DECIMAL | 总电费 (元) |
| meter_count | INT | 电表数量 |
| record_count | INT | 原始记录数 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 元数据表：summary_metadata

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| table_name | VARCHAR | 表名 |
| last_summary_time | DATETIME | 最后汇总时间 |
| last_run_status | VARCHAR | 最后运行状态 |
| records_processed | INT | 处理记录数 |
| updated_at | DATETIME | 更新时间 |

---

## 🔄 处理逻辑

### 增量更新流程

```
1. 读取上次汇总时间（从 summary_metadata 表）
2. 查询源表中该时间之后的新增/修改数据
3. 按 日/区县/网格/用电方 维度聚合
4. 执行 upsert 操作：
   - 如果汇总记录已存在 → 更新
   - 如果汇总记录不存在 → 插入
5. 更新 summary_metadata 表中的汇总时间
```

### 聚合维度

- **日**：按天聚合
- **区县**：按区县聚合
- **网格**：按网格聚合
- **用电方**：按用电方聚合

---

## 📊 日志说明

### 日志文件

- 路径：`scheduler_task/logs/daily_summary.log`
- 级别：`INFO`（可在配置中修改）

### 日志内容示例

```
2026-03-31 10:00:00 - DailySummaryTask - INFO - Starting daily summary task at 2026-03-31 10:00:00
2026-03-31 10:00:05 - DataAggregator - INFO - Querying records from 2026-03-20 to 2026-03-31
2026-03-31 10:00:10 - DataAggregator - INFO - Processing batch 1/5
2026-03-31 10:00:15 - DataAggregator - INFO - Records processed: 50000
2026-03-31 10:00:20 - DailySummaryTask - INFO - Task completed successfully!
2026-03-31 10:00:20 - DailySummaryTask - INFO - Duration: 20.50 seconds
2026-03-31 10:00:20 - DailySummaryTask - INFO - Records processed: 50000, Records inserted: 100, Records updated: 50
```

---

## 🛠️ 常见问题

### Q1: 如何手动触发一次汇总？

```bash
python daily_summary.py --once
```

### Q2: 如何修改执行间隔？

编辑 `config.json`：
```json
"task": {
    "interval": 3600  // 改为1小时
}
```

或使用命令行参数：
```bash
python daily_summary.py --interval 3600
```

### Q3: 如何查看任务执行状态？

```bash
# 查看日志
tail -f logs/daily_summary.log

# 或在运行时查看输出
python daily_summary.py --once
```

### Q4: 数据库连接失败怎么办？

1. 检查 `config.json` 中的数据库配置是否正确
2. 检查网络连接
3. 检查数据库用户权限

### Q5: 如何重建历史数据？

需要修改代码或使用专门的重建脚本（如 `rebuild_summary_table.py`）

---

## 🚀 生产环境部署

### 使用 systemd 管理服务（Linux）

1. 创建服务文件：

```bash
sudo nano /etc/systemd/system/daily-summary.service
```

内容：
```ini
[Unit]
Description=Energy Charge Daily Summary Task
After=network.target mysql.service

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/scheduler_task
ExecStart=/usr/bin/python3 daily_summary.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

2. 启用并启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable daily-summary
sudo systemctl start daily-summary

# 查看状态
sudo systemctl status daily-summary
```

### 使用 cron 定时执行

```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天凌晨2点执行）
0 2 * * * cd /path/to/scheduler_task && python daily_summary.py --once >> logs/cron.log 2>&1
```

---

## 📞 技术支持

如遇到问题，请提供以下信息：

1. 完整的错误日志
2. 配置文件内容（密码请隐藏）
3. 数据库版本
4. Python 版本

---

**文档版本**：v1.0
**最后更新**：2026-03-31
**适用项目**：常州能耗云驾驶舱
