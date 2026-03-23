import pymysql

db_config = {
    'host': '10.38.78.217',
    'port': 3220,
    'user': 'liujiantao',
    'password': 'Liujt!@#',
    'database': 'energy_management_2026',
    'charset': 'utf8mb4',
    'connect_timeout': 10
}

try:
    conn = pymysql.connect(**db_config)
    cursor = conn.cursor()
    
    cursor.execute("DESCRIBE energy_charge")
    columns = cursor.fetchall()
    
    print("Table columns:")
    for col in columns:
        print(f"  {col[0]}: {col[1]}")
    
    cursor.execute("SELECT * FROM energy_charge LIMIT 1")
    row = cursor.fetchone()
    
    print("\nFirst row data:")
    for i, col in enumerate(columns):
        print(f"  {col[0]}: {row[i]}")
    
    cursor.execute("SELECT COUNT(*) FROM energy_charge WHERE 度数 > 0")
    count = cursor.fetchone()[0]
    print(f"\nRecords with 度数 > 0: {count}")
    
    cursor.execute("SELECT COUNT(*) FROM energy_charge WHERE 电费 > 0")
    count = cursor.fetchone()[0]
    print(f"Records with 电费 > 0: {count}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
