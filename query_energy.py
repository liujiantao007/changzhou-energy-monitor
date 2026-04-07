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

def get_total_energy(date_from, date_to):
    try:
        conn = pymysql.connect(**db_config)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        sql = """
            SELECT 
                SUM(total_energy) as total_energy,
                COUNT(*) as record_count
            FROM energy_charge_daily_summary
            WHERE stat_date >= %s AND stat_date <= %s
        """
        
        cursor.execute(sql, (date_from, date_to))
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return result['total_energy'] if result else 0
    except Exception as e:
        print(f"查询失败: {e}")
        return 0

# 3月1日-20日的能耗
march_energy = get_total_energy('2026-03-01', '2026-03-20')

# 2月1日-20日的能耗
feb_energy = get_total_energy('2026-02-01', '2026-02-20')

print("=" * 50)
print("常州市能耗统计")
print("=" * 50)
print(f"3月1日-3月20日 总体能耗: {march_energy:.2f} kWh")
print(f"2月1日-2月20日 总体能耗: {feb_energy:.2f} kWh")
print("=" * 50)

if feb_energy > 0:
    mom = ((march_energy - feb_energy) / feb_energy) * 100
    print(f"环比: {mom:+.2f}%")
else:
    print("环比: 无法计算（上期能耗为0）")
