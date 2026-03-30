
"""
精确构建39列的SELECT
"""

# 数据库中需要的39列顺序（排除id）
required_columns = [
    # 1-7
    'stat_date', 'district', 'grid', 'poi_name', 'electricity_type', 'electricity_attr', 'meter_number',
    # 8-9
    'total_energy', 'total_cost',
    # 10-13
    'overview_total_energy', 'overview_total_cost', 'overview_poi_count', 'overview_device_count',
    # 14-16
    'electricity_by_district_energy', 'electricity_by_grid_energy', 'electricity_by_poi_energy',
    # 17-18
    'poi_stat_energy', 'poi_stat_cost',
    # 19-20
    'electricity_type_energy', 'electricity_type_cost',
    # 21-26
    'trend_daily_energy', 'trend_daily_cost', 'trend_monthly_energy', 'trend_monthly_cost', 'trend_yearly_energy', 'trend_yearly_cost',
    # 27-29
    'record_count', 'created_at', 'updated_at',
    # 30-33
    'mobile_cumulative_energy', 'mobile_poi_count', 'tower_cumulative_energy', 'tower_poi_count',
    # 34-37
    'direct_power_supply_energy', 'indirect_power_supply_energy', 'direct_power_supply_cost', 'indirect_power_supply_cost',
    # 38-39
    'mobile_electricity_fee', 'tower_electricity_fee'
]

print("总列数:", len(required_columns))
print()

# 构建对应的SELECT值列表，39个！
select_values = [
    # 1-7
    'stat_date',
    'district',
    'grid',
    'MIN(poi_name)',
    'MIN(electricity_type)',
    'MIN(electricity_attr)',
    'MIN(meter)',
    # 8-9
    'COALESCE(SUM(total_energy), 0)',
    'COALESCE(SUM(total_cost), 0)',
    # 10-13
    'COALESCE(SUM(total_energy), 0)',
    'COALESCE(SUM(total_cost), 0)',
    'COUNT(DISTINCT poi_name)',
    'COUNT(DISTINCT meter)',
    # 14-16
    'COALESCE(SUM(total_energy), 0)',
    'COALESCE(SUM(total_energy), 0)',
    'COALESCE(SUM(total_energy), 0)',
    # 17-18
    'COALESCE(SUM(total_energy), 0)',
    'COALESCE(SUM(total_cost), 0)',
    # 19-20
    'COALESCE(SUM(total_energy), 0)',
    'COALESCE(SUM(total_cost), 0)',
    # 21-26
    'COALESCE(SUM(total_energy), 0)',
    'COALESCE(SUM(total_cost), 0)',
    'COALESCE(SUM(total_energy), 0)',
    'COALESCE(SUM(total_cost), 0)',
    'COALESCE(SUM(total_energy), 0)',
    'COALESCE(SUM(total_cost), 0)',
    # 27-29
    'COUNT(*)',
    'NOW()',
    'NOW()',
    # 30-33
    'COALESCE(SUM(CASE WHEN consumer = \'移动\' THEN total_energy ELSE 0 END), 0)',
    'COUNT(DISTINCT CASE WHEN consumer = \'移动\' THEN poi_name END)',
    'COALESCE(SUM(CASE WHEN consumer = \'电塔\' OR consumer = \'铁塔\' THEN total_energy ELSE 0 END), 0)',
    'COUNT(DISTINCT CASE WHEN consumer = \'电塔\' OR consumer = \'铁塔\' THEN poi_name END)',
    # 34-37
    '0',
    '0',
    '0',
    '0',
    # 38-39
    'COALESCE(SUM(CASE WHEN consumer = \'移动\' THEN total_cost ELSE 0 END), 0)',
    'COALESCE(SUM(CASE WHEN consumer = \'电塔\' OR consumer = \'铁塔\' THEN total_cost ELSE 0 END), 0)'
]

print("SELECT值数:", len(select_values))
print()

if len(select_values) == len(required_columns):
    print("✅ 数量匹配！")
    print("\n列-值对应关系:")
    for i, (col, val) in enumerate(zip(required_columns, select_values), 1):
        print(f"{i:2d}. {col:40} -&gt; {val}")
else:
    print(f"❌ 不匹配！列数: {len(required_columns)}, 值数: {len(select_values)}")

