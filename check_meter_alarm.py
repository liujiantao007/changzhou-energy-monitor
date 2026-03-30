"""查看 meter_alarm 表结构"""

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
    print("查看 meter_alarm 表结构")
    print("=" * 70)

    # 查看表结构
    cursor.execute("SHOW COLUMNS FROM meter_alarm")
    columns = cursor.fetchall()

    print("\n表字段列表:")
    for col in columns:
        print(f"  - {col['Field']}: {col['Type']} (Null: {col['Null']}, Key: {col['Key']}, Default: {col['Default']})")

    # 查看最新一条数据的告警时间
    cursor.execute("SELECT 告警时间 FROM meter_alarm ORDER BY 告警时间 DESC LIMIT 1")
    latest = cursor.fetchone()
    if latest:
        print(f"\n最新告警时间: {latest['告警时间']}")

    # 查看有多少条最新一天的告警
    cursor.execute("""
        SELECT COUNT(*) as cnt
        FROM meter_alarm
        WHERE DATE(告警时间) = DATE((SELECT MAX(告警时间) FROM meter_alarm))
    """)
    result = cursor.fetchone()
    print(f"\n最新一天告警数量: {result['cnt']}")

    # 查看最新一天的数据样本
    cursor.execute("""
        SELECT *
        FROM meter_alarm
        WHERE DATE(告警时间) = DATE((SELECT MAX(告警时间) FROM meter_alarm))
        LIMIT 2
    """)
    samples = cursor.fetchall()

    if samples:
        print("\n最新一天数据样本 (第一条):")
        for key, value in samples[0].items():
            print(f"  {key}: {value}")

    print("\n" + "=" * 70)

except Exception as e:
    print(f"\n❌ 操作失败：{e}")
    import traceback
    traceback.print_exc()
finally:
    if conn.open:
        conn.close()
