import pymysql

db_config = {
    'host': '10.38.78.217',
    'port': 3220,
    'user': 'liujiantao',
    'password': 'Liujt!@#',
    'database': 'energy_management_2026',
    'charset': 'utf8mb4',
    'connect_timeout': 30
}

try:
    conn = pymysql.connect(**db_config)
    cursor = conn.cursor()

    # Count total records
    cursor.execute("SELECT COUNT(*) FROM energy_charge")
    total = cursor.fetchone()[0]
    print(f"Total records: {total}")

    # Count records with valid data
    cursor.execute("SELECT COUNT(*) FROM energy_charge WHERE 度数 > 0")
    valid = cursor.fetchone()[0]
    print(f"Records with 度数 > 0: {valid}")

    # Sample first few records
    cursor.execute("SELECT 日期, 电表, 度数, 电费 FROM energy_charge LIMIT 3")
    rows = cursor.fetchall()
    print("\nSample records:")
    for row in rows:
        print(f"  Date: {row[0]}, Meter: {row[1]}, Degree: {row[2]}, Cost: {row[3]}")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
