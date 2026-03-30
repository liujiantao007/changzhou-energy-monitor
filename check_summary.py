import pymysql

conn = pymysql.connect(
    host='10.38.78.217',
    port=3220,
    user='liujiantao',
    password='Liujt!@#',
    database='energy_management_2026'
)
cursor = conn.cursor()

cursor.execute('SELECT COUNT(*) FROM energy_charge_daily_summary')
count = cursor.fetchone()[0]
print(f"Summary table records: {count}")

cursor.execute('SELECT stat_date, district, grid, overview_total_energy FROM energy_charge_daily_summary LIMIT 5')
print("\nSample data:")
for row in cursor.fetchall():
    print(f"  {row}")

cursor.close()
conn.close()
