"""查看 meter_event 表结构"""

import pymysql
from pymysql.cursors import DictCursor

DB_CONFIG = {
    'host': '10.38.78.217',
    'port': 3220,
    'user': 'liujiantao',
    'password': 'Liujt!@#',
    'database': 'energy_management_2026',
    'charset': 'utf8mb4'
}

conn = pymysql.connect(**DB_CONFIG)
cursor = conn.cursor(DictCursor)

try:
    print("=" * 70)
    print("查看 meter_event 表结构")
    print("=" * 70)

    # 查看表结构
    cursor.execute("SHOW COLUMNS FROM meter_event")
    columns = cursor.fetchall()

    print("\n表字段列表:")
    for col in columns:
        print(f"  - {col['Field']}: {col['Type']} (Null: {col['Null']}, Key: {col['Key']}, Default: {col['Default']})")

    # 查看数据量
    cursor.execute("SELECT COUNT(*) as cnt FROM meter_event")
    result = cursor.fetchone()
    print(f"\n总数据量: {result['cnt']}")

    # 查看最新一条数据
    cursor.execute("SELECT * FROM meter_event ORDER BY 分析日期 DESC LIMIT 1")
    latest = cursor.fetchone()
    if latest:
        print("\n最新数据样本:")
        for key, value in latest.items():
            print(f"  {key}: {value}")

    print("\n" + "=" * 70)

except Exception as e:
    print(f"\n❌ 操作失败：{e}")
    import traceback
    traceback.print_exc()
finally:
    if conn.open:
        conn.close()
