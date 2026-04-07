#!/usr/bin/env python
# -*- coding: utf-8 -*-

# 读取文件
with open(r'c:\Users\Dean\Documents\Code\project_dianfeiv2\js\charts.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 删除从第 51 行到第 1199 行的 updateElectricityChart 函数
# 注意：Python 中列表索引从 0 开始
start_line = 50  # 第 51 行
end_line = 1200  # 第 1200 行（包含）

new_lines = lines[:start_line] + lines[end_line:]

# 写回文件
with open(r'c:\Users\Dean\Documents\Code\project_dianfeiv2\js\charts.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f'已删除第 {start_line+1} 到 {end_line} 行，共删除 {end_line - start_line} 行')
