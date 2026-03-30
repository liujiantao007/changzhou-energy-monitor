import pymysql
import base64

# Decode SQL with correct Chinese column names
SELECT_CLAUSE = base64.b64decode("U0VMRUNUIHBvaSDlkI3np7AgRlJPTQ==").decode('utf-8')

conn = pymysql.connect(
    host='10.38.78.217',
    port=3220,
    user='liujiantao',
    password='Liujt!@#',
    database='energy_management_2026',
    charset='utf8mb4'
)

cursor = conn.cursor()

print("Testing SELECT with Chinese column name...")
print(f"SQL: {SELECT_CLAUSE} energy_charge LIMIT 1")

cursor.execute(f"{SELECT_CLAUSE} energy_charge LIMIT 1")
result = cursor.fetchone()
print(f"Result: {result}")

conn.close()
