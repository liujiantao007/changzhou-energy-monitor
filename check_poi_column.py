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
cursor.execute("SHOW COLUMNS FROM energy_charge LIKE '%poi%'")
cols = cursor.fetchall()
print("Columns containing 'poi':")
for col in cols:
    print(f"  Field: {repr(col[0])}, Type: {col[1]}")
    print(f"  Bytes: {[hex(ord(c)) for c in col[0]]}")

conn.close()
