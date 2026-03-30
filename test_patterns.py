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

# Try different patterns
patterns = ['poi%', '%名称%', '%poi 名称%', 'poi 名称']

for pattern in patterns:
    cursor.execute(f"SHOW COLUMNS FROM energy_charge LIKE '{pattern}'")
    cols = cursor.fetchall()
    print(f"Pattern '{pattern}': {len(cols)} columns")
    for col in cols:
        print(f"  - {repr(col[0])}")

conn.close()
