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

# Test with explicit UTF-8 encoding
sql = "SELECT `poi 名称` FROM energy_charge LIMIT 1"
print(f"SQL bytes: {sql.encode('utf-8')}")
print(f"SQL: {sql}")

try:
    cursor.execute(sql)
    result = cursor.fetchone()
    print(f"Success! Result: {result}")
except Exception as e:
    print(f"Error: {e}")

conn.close()
