
"""
检查 energy_charge 表的原始数据
"""

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
    print("检查 energy_charge 表的数据")
    print("=" * 70)
    
    # 先查看表结构
    print("\n[1] 查看表结构...")
    cursor.execute("SHOW FULL COLUMNS FROM energy_charge")
    columns = cursor.fetchall()
    print(f"共 {len(columns)} 个字段:")
    for col in columns:
        print(f"  {col['Field']:20} {col['Type']:20} {col['Comment'] if col['Comment'] else ''}")
    
    # 查看几条记录
    print("\n[2] 查看前 5 条记录...")
    cursor.execute("SELECT * FROM energy_charge LIMIT 5")
    records = cursor.fetchall()
    
    for i, rec in enumerate(records, 1):
        print(f"\n记录 {i}:")
        for key, value in rec.items():
            print(f"  {key}: {value}")
    
    # 查看用电属性列的不同值
    print("\n[3] 查看用电属性的不同值...")
    cursor.execute("SELECT DISTINCT `用电属性` FROM energy_charge LIMIT 20")
    results = cursor.fetchall()
    print("不同的用电属性值:")
    for r in results:
        print(f"  {r['用电属性']}")
    
finally:
    cursor.close()
    conn.close()
    print("\n数据库连接已关闭")
