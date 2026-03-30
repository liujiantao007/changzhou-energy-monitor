
"""
检查 energy_charge_daily_summary 表的完整结构
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

TARGET_TABLE = 'energy_charge_daily_summary'

conn = pymysql.connect(**DB_CONFIG)
cursor = conn.cursor(DictCursor)

try:
    print("=" * 70)
    print(f"检查表结构: {TARGET_TABLE}")
    print("=" * 70)
    
    cursor.execute(f"SHOW FULL COLUMNS FROM {TARGET_TABLE}")
    columns = cursor.fetchall()
    
    print(f"\n共 {len(columns)} 个字段:\n")
    for i, col in enumerate(columns, 1):
        print(f"{i:2d}. {col['Field']:40} {col['Type']:20} {col['Null']:5} {col['Default'] if col['Default'] is not None else ''}")
        if col['Comment']:
            print(f"    注释: {col['Comment']}")
    
    # 提取所有字段名
    field_names = [col['Field'] for col in columns]
    print(f"\n字段名列表（按顺序）:")
    print(", ".join(field_names))
    
finally:
    cursor.close()
    conn.close()
    print("\n数据库连接已关闭")

