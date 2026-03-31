#!/bin/bash

# 常州能耗云驾驶舱 - Docker 启动脚本

echo "=========================================="
echo "  常州能耗云驾驶舱 Docker 部署脚本"
echo "=========================================="
echo ""

# 检查 docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 docker-compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

echo "✅ Docker 和 Docker Compose 已安装"
echo ""

# 检查容器是否存在
CONTAINER_NAME="energy-monitor-prod"
EXISTING_CONTAINER=$(docker ps -aq -f name=$CONTAINER_NAME)

if [ -n "$EXISTING_CONTAINER" ]; then
    echo "⚠️  发现已存在的容器: $CONTAINER_NAME"
    echo "   正在停止并删除容器..."
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
    echo "✅ 容器已删除"
else
    # 也检查停止状态的容器
    STOPPED_CONTAINER=$(docker ps -aq -f status=exited -f name=$CONTAINER_NAME)
    if [ -n "$STOPPED_CONTAINER" ]; then
        echo "⚠️  发现已停止的容器: $CONTAINER_NAME"
        echo "   正在删除容器..."
        docker rm $CONTAINER_NAME
        echo "✅ 容器已删除"
    else
        echo "ℹ️  未发现已存在的容器"
    fi
fi

echo ""
echo "=========================================="
echo "  开始构建 Docker 镜像"
echo "=========================================="
echo ""

# 构建镜像
docker build --no-cache -t changzhou-energy-monitor:latest .

if [ $? -ne 0 ]; then
    echo "❌ Docker 镜像构建失败"
    exit 1
fi

echo "✅ Docker 镜像构建成功"
echo ""

echo "=========================================="
echo "  启动 Docker Compose 服务"
echo "=========================================="
echo ""

# 启动服务
docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  ✅ 部署成功！"
    echo "=========================================="
    echo ""
    echo "🌐 访问地址："
    echo "   前端页面：http://localhost:65080/"
    echo "   后端 API：http://localhost:65080/api/health"
    echo ""
    echo "📝 常用命令："
    echo "   查看日志：docker-compose logs -f"
    echo "   停止服务：docker-compose down"
    echo "   重启服务：docker-compose restart"
    echo ""
else
    echo "❌ Docker Compose 启动失败"
    exit 1
fi
