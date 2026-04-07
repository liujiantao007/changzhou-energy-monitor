#!/usr/bin/env python
# -*- coding: utf-8 -*-

# 读取文件
with open(r'c:\Users\Dean\Documents\Code\project_dianfeiv2\js\app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到需要删除的代码块起始和结束行
start_line = 600  # "// 计算上期日期范围"
end_line = 764  # "                    // 更新趋势图" 之前的空行

# 删除从 start_line 到 end_line-1 的行
new_lines = lines[:start_line] + lines[end_line:]

# 写回文件
with open(r'c:\Users\Dean\Documents\Code\project_dianfeiv2\js\app.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f'已删除第 {start_line} 到 {end_line-1} 行，共删除 {end_line - start_line} 行')
