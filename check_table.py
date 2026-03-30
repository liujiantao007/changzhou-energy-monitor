import pymysql

conn = pymysql.connect(
    host='10.38.78.217',
    port=3220,
    user='liujiantao',
    password='Liujt!@#',
    database='energy_management_2026'
)
cursor = conn.cursor()

cursor.execute('DESCRIBE energy_charge_daily_summary')
print("Table structure:")
for row in cursor.fetchall():
    print(row)

cursor.execute('SELECT COUNT(*) FROM energy_charge_daily_summary')
print(f"\nCurrent record count: {cursor.fetchone()[0]}")

cursor.close()
conn.close()