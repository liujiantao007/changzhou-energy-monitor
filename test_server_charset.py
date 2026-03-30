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

# Check server charset
cursor.execute("SHOW VARIABLES LIKE 'character_set%'")
vars = cursor.fetchall()
for v in vars:
    print(f"{v[0]}: {v[1]}")

# Try setting charset explicitly
cursor.execute("SET NAMES utf8mb4")
cursor.execute("SELECT poi 名称 FROM energy_charge LIMIT 1")
result = cursor.fetchone()
print(f"\nAfter SET NAMES: {result}")

conn.close()
