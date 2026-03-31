import pymysql
conn = pymysql.connect(host='10.38.78.217', port=3220, user='liujiantao', password='Liujt!@#', database='energy_management_2026')
cursor = conn.cursor()
cursor.execute("""
SELECT
    stat_date, district, grid,
    poi_name,
    electricity_type,
    electricity_attr,
    meter_number,
    total_energy,
    total_cost
FROM energy_charge_daily_summary
WHERE stat_date = '2026-03-20'
AND grid = '三井网格'
LIMIT 1
""")
row = cursor.fetchone()
print('2026-03-20 三井网格数据：')
print(f'  日期: {row[0]}')
print(f'  区县: {row[1]}')
print(f'  网格: {row[2]}')
print(f'  poi_name: {row[3]}')
print(f'  electricity_type: {row[4]}')
print(f'  electricity_attr: {row[5]}')
print(f'  meter_number: {row[6]}')
print(f'  total_energy: {row[7]}')
print(f'  total_cost: {row[8]}')
cursor.close()
conn.close()
