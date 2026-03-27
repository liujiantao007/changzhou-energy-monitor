#!/bin/bash

# 常州能耗云驾驶舱 - Docker容器启动脚本

echo "============================================="
echo "  常州能耗云运营驾驶舱"
echo "============================================="
echo ""

# 检查CDN资源是否存在
if [ ! -f "/app/js/libs/echarts.min.js" ] || [ ! -f "/app/js/libs/xlsx.full.min.js" ]; then
    echo "⚠️  警告：CDN资源文件不存在！"
    echo ""
    echo "请在有公网的环境中执行以下命令下载资源："
    echo "  mkdir -p /app/js/libs"
    echo "  curl -o /app/js/libs/echarts.min.js https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"
    echo "  curl -o /app/js/libs/xlsx.full.min.js https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
    echo ""
    echo "或者手动下载以下文件并放入项目的 js/libs/ 目录："
    echo "  - echarts.min.js (https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js)"
    echo "  - xlsx.full.min.js (https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js)"
    echo ""
fi

# 启动Flask后端（后台运行）
echo "📡 启动Flask后端服务（端口5000）..."
cd /app
python3 app.py &
FLASK_PID=$!

# 等待Flask启动
sleep 3

# 启动Nginx
echo "🌐 启动Nginx静态文件服务（端口80）..."
nginx -g 'daemon off;' &
NGINX_PID=$!

echo ""
echo "✅ 所有服务已启动！"
echo "============================================="
echo "访问地址：http://localhost"
echo "后端API：http://localhost/api"
echo "============================================="
echo ""

# 等待任意进程退出
wait
