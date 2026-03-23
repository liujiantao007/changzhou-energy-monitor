#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv

print("=" * 80)
print("数据库表 energy_charge 与 data.csv 字段对比分析")
print("=" * 80)

# 数据库表字段（从之前的测试结果获取）
db_fields = [
    'id',
    '日期',
    '电表',
    '用电方',
    '用电类型',
    '分摊比例',
    '倍率',
    '入网读数',
    '入网日期',
    '用电属性',
    '归属单元',
    '归属网格',
    'poi名称',
    'POI经度',
    'POI纬度',
    'POI类型',
    'POI业务编码',
    'POI包干人',
    'POI包干人号码',
    'POI点位状态',
    'POI物理点名称',
    '合同名称',
    '合同编号',
    '报账点名称',
    '报账点编号',
    '电费单价(不含电损)',
    '电费单价(含电损)',
    '计算时间',
    '度数',
    '电费',
    '电费(含税)',
    '电费(不含税)',
    '电费（暂估含税）',
    '电费（暂估不含税）',
    '暂估计算时间',
    '暂估合同编号',
    '暂估合同名称',
    '网络-分摊比例',
    '网络-度数',
    '网络电费（含税）',
    '网络电费（不含税）',
    '办公-分摊比例',
    '办公-度数',
    '办公-电费（含税）',
    '办公-电费（不含税）',
    '营业-分摊比例',
    '营业-度数',
    '营业-电费（含税）',
    '营业-电费（不含税）',
    '电信-分摊比例',
    '电信-度数',
    '电信-电费（含税）',
    '电信-电费（不含税）',
    '联通-分摊比例',
    '联通-度数',
    '联通-电费（含税）',
    '联通-电费（不含税）',
    '其他-分摊比例',
    '其他-度数',
    '其他-电费（含税）',
    '其他-电费（不含税）'
]

# CSV文件字段
csv_path = r'c:\Users\Dean\Documents\Code\project_dianfeiv2\data\data.csv'
csv_fields = []

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    csv_fields = next(reader)

print(f"\n1. 字段数量对比")
print("-" * 80)
print(f"数据库表字段数: {len(db_fields)}")
print(f"CSV文件字段数: {len(csv_fields)}")
print(f"字段数量差异: {len(db_fields) - len(csv_fields)} 个字段")

print(f"\n2. 数据库表字段列表")
print("-" * 80)
for i, field in enumerate(db_fields, 1):
    print(f"{i:2d}. {field}")

print(f"\n3. CSV文件字段列表")
print("-" * 80)
for i, field in enumerate(csv_fields, 1):
    print(f"{i:2d}. {field}")

print(f"\n4. 详细对比分析")
print("-" * 80)

# 对比字段数量
if len(db_fields) != len(csv_fields):
    print("\n【字段数量差异】")
    print(f"  数据库表: {len(db_fields)} 个字段")
    print(f"  CSV文件: {len(csv_fields)} 个字段")
    print(f"  差异: 数据库表多 {len(db_fields) - len(csv_fields)} 个字段")

# 检查数据库表有但CSV没有的字段
db_only = set(db_fields) - set(csv_fields)
if db_only:
    print("\n【数据库表独有字段】")
    for field in sorted(db_only):
        print(f"  - {field}")

# 检查CSV有但数据库表没有的字段
csv_only = set(csv_fields) - set(db_fields)
if csv_only:
    print("\n【CSV文件独有字段】")
    for field in sorted(csv_only):
        print(f"  - {field}")

# 检查大小写差异
db_lower = [f.lower() for f in db_fields]
csv_lower = [f.lower() for f in csv_fields]

case_diff = []
for i, (db_f, csv_f) in enumerate(zip(db_fields, csv_fields)):
    if i < min(len(db_fields), len(csv_fields)):
        if db_f.lower() == csv_f.lower() and db_f != csv_f:
            case_diff.append((i+1, db_f, csv_f))

if case_diff:
    print("\n【大小写差异字段】")
    for pos, db_f, csv_f in case_diff:
        print(f"  位置 {pos}: 数据库='{db_f}', CSV='{csv_f}'")

# 检查位置差异
print("\n5. 字段顺序对比")
print("-" * 80)

max_len = max(len(db_fields), len(csv_fields))
mismatch = []

for i in range(max_len):
    db_f = db_fields[i] if i < len(db_fields) else "(N/A)"
    csv_f = csv_fields[i] if i < len(csv_fields) else "(N/A)"
    
    if db_f.lower() != csv_f.lower():
        mismatch.append((i+1, db_f, csv_f))
        print(f"❌ 位置 {i+1}: 数据库='{db_f}', CSV='{csv_f}'")
    else:
        print(f"✅ 位置 {i+1}: 数据库='{db_f}', CSV='{csv_f}'")

if mismatch:
    print(f"\n【字段顺序/名称不匹配的位置】共 {len(mismatch)} 处")
    for pos, db_f, csv_f in mismatch:
        print(f"  位置 {pos}: 数据库='{db_f}', CSV='{csv_f}'")

print("\n" + "=" * 80)
print("对比分析完成")
print("=" * 80)
