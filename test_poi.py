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

# Test 1: Simple SELECT
print("Test 1: SELECT poi 名称")
cursor.execute("SELECT poi 名称 FROM energy_charge LIMIT 1")
print("Result:", cursor.fetchone())

# Test 2: SELECT with backticks
print("\nTest 2: SELECT `poi 名称`")
cursor.execute("SELECT `poi 名称` FROM energy_charge LIMIT 1")
print("Result:", cursor.fetchone())

conn.close()
