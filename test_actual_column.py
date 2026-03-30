import pymysql

conn = pymysql.connect(
    host='10.38.78.217',
    port=3220,
    user='liujiantao',
    password='Liujt!@#',
    database='energy_management_2026',
    charset='utf8mb4',
    use_unicode=True
)

cursor = conn.cursor()

# Get actual column name from database
cursor.execute("SHOW COLUMNS FROM energy_charge LIKE '%poi 名称%'")
col_info = cursor.fetchone()
if col_info:
    actual_col_name = col_info[0]
    print(f"Column name from DB: {repr(actual_col_name)}")
    print(f"Column name bytes: {actual_col_name.encode('utf-8')}")
    
    # Try using the exact column name
    sql = f"SELECT `{actual_col_name}` FROM energy_charge LIMIT 1"
    print(f"\nExecuting: {sql}")
    
    try:
        cursor.execute(sql)
        result = cursor.fetchone()
        print(f"Success! Result: {result}")
    except Exception as e:
        print(f"Error: {e}")
else:
    print("Column not found!")

conn.close()
