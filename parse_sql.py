
"""
解析 rebuild_summary.py 中的 SQL
"""

with open('rebuild_summary.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 找到 INSERT 和 SELECT 部分
import re

# 提取 INSERT 语句
insert_match = re.search(r'INSERT INTO.*?\(', content, re.DOTALL)
if insert_match:
    # 找到 INSERT 列定义
    start_idx = insert_match.end()
    end_idx = content.find(')', start_idx)
    insert_columns_str = content[start_idx:end_idx]
    # 清理并分割
    insert_columns = [col.strip() for col in insert_columns_str.replace('\n', ' ').split(',') if col.strip()]
    print(f"INSERT语句列数: {len(insert_columns)}")
    print("列名:")
    for i, col in enumerate(insert_columns, 1):
        print(f"{i:2d}. {col}")

print()

# 提取 SELECT 语句
select_match = re.search(r'SELECT\s*(.*?)\s*FROM\s*\(', content, re.DOTALL)
if select_match:
    select_part = select_match.group(1)
    # 清理并分割，排除空字符串
    select_values = []
    current_val = ''
    parenthesis_depth = 0
    for c in select_part:
        if c == ',' and parenthesis_depth == 0:
            if current_val.strip():
                select_values.append(current_val.strip())
            current_val = ''
        else:
            current_val += c
            if c == '(':
                parenthesis_depth += 1
            elif c == ')':
                parenthesis_depth -= 1
    if current_val.strip():
        select_values.append(current_val.strip())
    
    print(f"SELECT语句值数: {len(select_values)}")
    print("值列表:")
    for i, val in enumerate(select_values, 1):
        print(f"{i:2d}. {val[:60]}")

print()
if len(insert_columns) == len(select_values):
    print("✅ 列数匹配！")
else:
    print(f"❌ 列数不匹配！INSERT: {len(insert_columns)}, SELECT: {len(select_values)}")

