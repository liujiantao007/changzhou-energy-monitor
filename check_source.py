import pymysql

conn = pymysql.connect(
    host='10.38.78.217',
    port=3220,
    user='liujiantao',
    password='Liujt!@#',
    database='energy_management_2026'
)
cursor = conn.cursor()

cursor.execute("DESCRIBE energy_charge")
print("Source table columns:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

print("\n" + "="*60)
print("Sample data (first 3 rows):")
cursor.execute("SELECT * FROM energy_charge LIMIT 3")
rows = cursor.fetchall()
for row in rows:
    print(f"\n  Row: {row}")

print("\n" + "="*60)
print("Checking NULL counts:")
for col in ['归属单元', '归属网格', 'poi名称', '用电属性', '用电类型', '度数', '电费']:
    cursor.execute(f"SELECT COUNT(*) FROM energy_charge WHERE {col} IS NULL OR {col} = ''")
    null_count = cursor.fetchone()[0]
    cursor.execute(f"SELECT COUNT(*) FROM energy_charge")
    total = cursor.fetchone()[0]
    print(f"  {col}: NULL/empty = {null_count}/{total} ({null_count*100/total:.1f}%)")

cursor.close()
conn.close()
