#!/usr/bin/env python
# -*- coding: utf-8 -*-
import pymysql
import os

db_config = {
    'host': os.environ.get('DB_HOST', '10.38.78.217'),
    'port': int(os.environ.get('DB_PORT', 3220)),
    'user': os.environ.get('DB_USER', 'liujiantao'),
    'password': os.environ.get('DB_PASSWORD', 'Liujt!@#'),
    'database': os.environ.get('DB_NAME', 'energy_management_2026'),
    'charset': 'utf8mb4',
    'connect_timeout': 60,
    'read_timeout': 300
}

def query_daily_data(date_str):
    """查询指定日期的总体能耗和电费"""
    try:
        conn = pymysql.connect(**db_config)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        sql = """
            SELECT 
                SUM(total_energy) as total_energy,
                SUM(total_cost) as total_cost,
                COUNT(*) as record_count
            FROM energy_charge_daily_summary
            WHERE stat_date = %s
        """
        
        cursor.execute(sql, (date_str,))
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return result
    except Exception as e:
        print(f"查询失败: {e}")
        return None

def query_cumulative_data(date_from, date_to):
    """查询日期范围内的累计能耗和电费"""
    try:
        conn = pymysql.connect(**db_config)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        sql = """
            SELECT 
                SUM(total_energy) as total_energy,
                SUM(total_cost) as total_cost,
                COUNT(*) as record_count
            FROM energy_charge_daily_summary
            WHERE stat_date >= %s AND stat_date <= %s
        """
        
        cursor.execute(sql, (date_from, date_to))
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return result
    except Exception as e:
        print(f"查询失败: {e}")
        return None

def main():
    print("=" * 80)
    print("常州市日维度环比数据验证")
    print("=" * 80)
    print()
    
    # 1. 查询当日数据（2026-03-20）
    print("1. 查询常州地区当日数据（2026-03-20）")
    print("-" * 80)
    current_day_data = query_daily_data('2026-03-20')
    
    if current_day_data:
        print(f"当日总体能耗: {current_day_data['total_energy']:.2f} kWh")
        print(f"当日总体电费: {current_day_data['total_cost']:.2f} 元")
        print(f"当日数据条数: {current_day_data['record_count']}")
    else:
        print("查询失败或无数据")
        return
    
    print()
    
    # 2. 查询上月同日数据（2026-02-20）
    print("2. 查询常州地区上月同日数据（2026-02-20）")
    print("-" * 80)
    previous_day_data = query_daily_data('2026-02-20')
    
    if previous_day_data:
        print(f"上月同日总体能耗: {previous_day_data['total_energy']:.2f} kWh")
        print(f"上月同日总体电费: {previous_day_data['total_cost']:.2f} 元")
        print(f"上月同日数据条数: {previous_day_data['record_count']}")
    else:
        print("查询失败或无数据")
        return
    
    print()
    
    # 3. 查询当月累计数据（2026-03-01 至 2026-03-20）
    print("3. 查询常州地区当月累计数据（2026-03-01 至 2026-03-20）")
    print("-" * 80)
    current_month_cumulative = query_cumulative_data('2026-03-01', '2026-03-20')
    
    if current_month_cumulative:
        print(f"当月累计总体能耗: {current_month_cumulative['total_energy']:.2f} kWh")
        print(f"当月累计总体电费: {current_month_cumulative['total_cost']:.2f} 元")
        print(f"当月累计数据条数: {current_month_cumulative['record_count']}")
    else:
        print("查询失败或无数据")
        return
    
    print()
    
    # 4. 查询上月同期累计数据（2026-02-01 至 2026-02-20）
    print("4. 查询常州地区上月同期累计数据（2026-02-01 至 2026-02-20）")
    print("-" * 80)
    previous_month_cumulative = query_cumulative_data('2026-02-01', '2026-02-20')
    
    if previous_month_cumulative:
        print(f"上月同期累计总体能耗: {previous_month_cumulative['total_energy']:.2f} kWh")
        print(f"上月同期累计总体电费: {previous_month_cumulative['total_cost']:.2f} 元")
        print(f"上月同期累计数据条数: {previous_month_cumulative['record_count']}")
    else:
        print("查询失败或无数据")
        return
    
    print()
    print("=" * 80)
    print("环比计算分析")
    print("=" * 80)
    print()
    
    # 5. 计算环比（使用累计数据）
    print("5. 计算环比（使用累计数据）")
    print("-" * 80)
    
    if current_month_cumulative and previous_month_cumulative:
        current_energy = current_month_cumulative['total_energy']
        previous_energy = previous_month_cumulative['total_energy']
        
        current_cost = current_month_cumulative['total_cost']
        previous_cost = previous_month_cumulative['total_cost']
        
        # 计算能耗环比
        if previous_energy > 0:
            energy_mom = ((current_energy - previous_energy) / previous_energy) * 100
            print(f"能耗环比: {energy_mom:+.2f}%")
            print(f"  计算公式: ({current_energy:.2f} - {previous_energy:.2f}) / {previous_energy:.2f} × 100")
        else:
            print("能耗环比: 无法计算（上期能耗为0）")
        
        print()
        
        # 计算电费环比
        if previous_cost > 0:
            cost_mom = ((current_cost - previous_cost) / previous_cost) * 100
            print(f"电费环比: {cost_mom:+.2f}%")
            print(f"  计算公式: ({current_cost:.2f} - {previous_cost:.2f}) / {previous_cost:.2f} × 100")
        else:
            print("电费环比: 无法计算（上期电费为0）")
    
    print()
    print("=" * 80)
    print("与系统显示对比")
    print("=" * 80)
    print()
    
    # 6. 与系统显示对比
    print("6. 与系统显示对比")
    print("-" * 80)
    print(f"系统显示能耗环比: -94.83%")
    print(f"系统显示电费环比: -94.79%")
    print()
    
    if current_month_cumulative and previous_month_cumulative:
        current_energy = current_month_cumulative['total_energy']
        previous_energy = previous_month_cumulative['total_energy']
        
        if previous_energy > 0:
            energy_mom = ((current_energy - previous_energy) / previous_energy) * 100
            print(f"实际计算能耗环比: {energy_mom:+.2f}%")
            print(f"差异: {energy_mom - (-94.83):+.2f}%")
        else:
            print("实际计算能耗环比: 无法计算")
        
        print()
        
        current_cost = current_month_cumulative['total_cost']
        previous_cost = previous_month_cumulative['total_cost']
        
        if previous_cost > 0:
            cost_mom = ((current_cost - previous_cost) / previous_cost) * 100
            print(f"实际计算电费环比: {cost_mom:+.2f}%")
            print(f"差异: {cost_mom - (-94.79):+.2f}%")
        else:
            print("实际计算电费环比: 无法计算")

if __name__ == '__main__':
    main()
