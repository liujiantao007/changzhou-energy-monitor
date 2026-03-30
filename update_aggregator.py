"""
更新 aggregator.py 以支持用电方维度统计

修改内容：
1. 在 INSERT 语句中添加 4 个新字段
2. 在 SELECT 子句中添加用电方维度的聚合计算
3. 在子查询中添加"用电方"字段的读取
"""

import os

# 读取原始文件
script_dir = os.path.dirname(os.path.abspath(__file__))
aggregator_path = os.path.join(script_dir, 'scheduler_task', 'aggregator.py')

with open(aggregator_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 替换 INSERT 字段列表
old_insert = """INSERT INTO {target_table} (
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
                )"""

new_insert = """INSERT INTO {target_table} (
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
                    tower_cumulative_energy, tower_poi_count
                )"""

content = content.replace(old_insert, new_insert)

# 替换 SELECT 字段列表（添加 4 个新字段的计算）
old_select = """COUNT(*) as record_count
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
                        COALESCE(电费，0) as total_cost
                    FROM {source_table}
                    WHERE 日期 >= %s AND 日期 < %s
                ) as source_data
                GROUP BY stat_date, district, grid"""

new_select = """COUNT(*) as record_count,
                    COALESCE(SUM(CASE WHEN consumer = '移动' THEN total_energy ELSE 0 END), 0) as mobile_cumulative_energy,
                    COUNT(DISTINCT CASE WHEN consumer = '移动' THEN poi_name END) as mobile_poi_count,
                    COALESCE(SUM(CASE WHEN consumer = '电塔' THEN total_energy ELSE 0 END), 0) as tower_cumulative_energy,
                    COUNT(DISTINCT CASE WHEN consumer = '电塔' THEN poi_name END) as tower_poi_count
                FROM (
                    SELECT
                        日期 as stat_date,
                        COALESCE(归属单元，'') as district,
                        COALESCE(归属网格，'') as grid,
                        poi 名称 as poi_name,
                        电表 as meter,
                        用电类型 as electricity_type,
                        用电属性 as electricity_attr,
                        用电方 as consumer,
                        COALESCE(度数，0) as total_energy,
                        COALESCE(电费，0) as total_cost
                    FROM {source_table}
                    WHERE 日期 >= %s AND 日期 < %s
                ) as source_data
                GROUP BY stat_date, district, grid"""

content = content.replace(old_select, new_select)

# 写回文件
with open(aggregator_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ aggregator.py 已更新成功！")
print("\n修改内容:")
print("1. INSERT 字段列表添加了 4 个新字段")
print("2. SELECT 子句添加了用电方维度聚合计算")
print("3. 子查询添加了'用电方'字段读取")
