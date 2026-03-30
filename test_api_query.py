import pymysql

conn = pymysql.connect(
    host='10.38.78.217',
    port=3220,
    user='liujiantao',
    password='Liujt!@#',
    database='energy_management_2026',
    charset='utf8mb4'
)
cursor = conn.cursor()

# Test the exact query from app.py
date_from = '2026-02-01'
date_to = '2026-03-31'

where_clauses = ["district IS NOT NULL", "grid IS NOT NULL"]
where_clauses.append("stat_date >= %s")
where_clauses.append("stat_date <= %s")

where_sql = " WHERE " + " AND ".join(where_clauses)
params = [date_from, date_to]

query_sql = f"""
    SELECT stat_date, district, grid, poi_name,
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
    FROM energy_charge_daily_summary{where_sql}
    ORDER BY stat_date DESC, district, grid
    LIMIT 10
"""

print("SQL:", query_sql)
print("Params:", params)

try:
    cursor.execute(query_sql, params)
    results = cursor.fetchall()
    print(f"\nQuery successful, returned {len(results)} rows")
    for row in results[:3]:
        print(row)
except Exception as e:
    print(f"\nQuery failed: {e}")

conn.close()