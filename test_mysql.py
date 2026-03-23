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
    print("=" * 60)
    print("MySQL Database Connection Test")
    print("=" * 60)
    
    print("\n[Step 1] Connecting to MySQL database...")
    print(f"  Host: {db_config['host']}")
    print(f"  Port: {db_config['port']}")
    print(f"  Database: {db_config['database']}")
    print(f"  User: {db_config['user']}")
    
    connection = pymysql.connect(**db_config)
    print("  Status: Connection successful!")
    
    cursor = connection.cursor()
    
    print("\n[Step 2] Accessing table 'energy_charge'...")
    cursor.execute("SHOW TABLES LIKE 'energy_charge'")
    result = cursor.fetchone()
    if result:
        print("  Status: Table 'energy_charge' exists!")
    else:
        print("  Status: Table 'energy_charge' NOT found!")
        cursor.close()
        connection.close()
        exit(1)
    
    print("\n[Step 3] Retrieving schema information for 'energy_charge' table...")
    cursor.execute("DESCRIBE energy_charge")
    columns = cursor.fetchall()
    
    print("\n  Table Schema:")
    print("  " + "-" * 56)
    print(f"  {'Column Name':<25} {'Data Type':<20} {'Null':<6} {'Key':<5}")
    print("  " + "-" * 56)
    
    for col in columns:
        field, type_, null, key, default, extra = col
        print(f"  {field:<25} {type_:<20} {null:<6} {key:<5}")
    
    print("  " + "-" * 56)
    
    print("\n[Step 4] Counting records in 'energy_charge' table...")
    cursor.execute("SELECT COUNT(*) FROM energy_charge")
    count = cursor.fetchone()[0]
    print(f"  Total records: {count:,}")
    
    print("\n[Step 5] Verification complete!")
    print("  - Database connection: SUCCESS")
    print("  - Table access: SUCCESS")
    print("  - Schema retrieval: SUCCESS")
    print("  - Record count: SUCCESS")
    
    cursor.close()
    connection.close()
    print("\n  Connection closed.")
    
    print("\n" + "=" * 60)
    print("All operations completed successfully!")
    print("=" * 60)
    
except pymysql.Error as e:
    print(f"\n  MySQL Error: {e}")
    print("\n  Connection failed!")
    
except Exception as e:
    print(f"\n  Error: {e}")
    print("\n  Operation failed!")
