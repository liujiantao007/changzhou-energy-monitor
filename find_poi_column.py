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

# Get all column names
cursor.execute("SHOW COLUMNS FROM energy_charge")
cols = cursor.fetchall()

print("All columns:")
for i, col in enumerate(cols):
    print(f"  {i}: {repr(col[0])}")

# Find the column that starts with 'poi' and has Chinese characters
poi_col = None
for col in cols:
    col_name = col[0]
    if col_name.startswith('poi') and len(col_name) > 3:
        poi_col = col_name
        print(f"\nFound POI column: {repr(poi_col)}")
        break

if poi_col:
    # Try using it
    sql = f"SELECT `{poi_col}` FROM energy_charge LIMIT 1"
    print(f"\nExecuting: {sql}")
    print(f"Bytes: {sql.encode('utf-8')}")
    
    try:
        cursor.execute(sql)
        result = cursor.fetchone()
        print(f"Success! Result: {result}")
    except Exception as e:
        print(f"Error: {e}")

conn.close()
