"""下载CDN资源到本地，用于Docker容器内网部署"""

import urllib.request
import os
import sys

# 创建libs目录
libs_dir = os.path.join(os.path.dirname(__file__), 'js', 'libs')
if not os.path.exists(libs_dir):
    os.makedirs(libs_dir)
    print(f"已创建目录: {libs_dir}")

# 资源列表
resources = [
    {
        'url': 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js',
        'filename': 'echarts.min.js'
    },
    {
        'url': 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
        'filename': 'xlsx.full.min.js'
    }
]

print("=" * 60)
print("开始下载CDN资源")
print("=" * 60)

success_count = 0
fail_count = 0

for resource in resources:
    url = resource['url']
    filename = resource['filename']
    filepath = os.path.join(libs_dir, filename)
    
    print(f"\n正在下载: {filename}")
    print(f"来源: {url}")
    
    try:
        urllib.request.urlretrieve(url, filepath)
        file_size = os.path.getsize(filepath)
        print(f"✓ 下载成功！大小: {file_size:,} bytes")
        success_count += 1
    except Exception as e:
        print(f"✗ 下载失败: {e}")
        fail_count += 1

print("\n" + "=" * 60)
print(f"下载完成: {success_count} 成功, {fail_count} 失败")
print("=" * 60)

if fail_count > 0:
    print("\n警告: 部分文件下载失败！")
    print("请手动下载以下文件到 js/libs/ 目录:")
    for resource in resources:
        print(f"  - {resource['filename']}")
        print(f"    下载地址: {resource['url']}")
    sys.exit(1)
else:
    print("\n所有CDN资源已下载到本地！")
    print(f"目录位置: {libs_dir}")
