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

# ==========================================
# 检查并清理占用端口的进程
# ==========================================
echo "=========================================="
echo "  检查端口占用情况"
echo "=========================================="
echo ""

# 定义需要检查的端口
PORTS=(65080 5000)

for PORT in "${PORTS[@]}"; do
    echo "检查端口 $PORT..."

    # 使用 lsof 查找占用端口的进程
    PIDS=$(sudo lsof -t -i:$PORT 2>/dev/null)

    if [ -n "$PIDS" ]; then
        echo "⚠️  端口 $PORT 被占用，PID: $PIDS"

        # 获取进程名称
        PROCESS_NAMES=$(sudo lsof -t -i:$PORT 2>/dev/null | xargs -I {} ps -p {} -o comm= 2>/dev/null)
        echo "   进程名称: $PROCESS_NAMES"

        # 检查是否是 Docker 容器
        for PID in $PIDS; do
            # 检查是否是 Docker 容器进程
            if sudo lsof -p $PID 2>/dev/null | grep -q "/docker/"; then
                echo "   检测到 Docker 容器占用端口，正在清理..."
                CONTAINER_ID=$(sudo docker ps -q --filter "publish=$PORT" 2>/dev/null)
                CONTAINER_NAME=$(sudo docker ps -q --filter "publish=$PORT" --format "{{.Names}}" 2>/dev/null)

                if [ -n "$CONTAINER_NAME" ]; then
                    echo "   停止 Docker 容器: $CONTAINER_NAME"
                    sudo docker stop $CONTAINER_NAME 2>/dev/null
                    sudo docker rm $CONTAINER_NAME 2>/dev/null
                    echo "   ✅ Docker 容器已清理"
                fi
            else
                # 非 Docker 进程，询问是否 kill
                echo "   进程 $PID ($PROCESS_NAMES) 不是 Docker 容器"
                echo "   正在 kill 进程 $PID..."
                sudo kill -9 $PID 2>/dev/null
                if [ $? -eq 0 ]; then
                    echo "   ✅ 进程已终止"
                else
                    echo "   ❌ 无法终止进程，可能需要 sudo 权限"
                fi
            fi
        done
    else
        echo "✅ 端口 $PORT 未被占用"
    fi
    echo ""
done

# ==========================================
# 检查并删除已存在的容器
# ==========================================
echo "=========================================="
echo "  检查已存在的容器"
echo "=========================================="
echo ""

CONTAINER_NAME="energy-monitor-prod"
EXISTING_CONTAINER=$(docker ps -aq -f name=$CONTAINER_NAME)

if [ -n "$EXISTING_CONTAINER" ]; then
    echo "⚠️  发现运行中的容器: $CONTAINER_NAME"
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

# ==========================================
# 构建 Docker 镜像
# ==========================================
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

# ==========================================
# 启动 Docker Compose 服务
# ==========================================
echo "=========================================="
echo "  启动 Docker Compose 服务"
echo "=========================================="
echo ""

# 停止已有的 docker-compose 服务
docker-compose down 2>/dev/null

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
    echo "   查看状态：docker ps | grep energy-monitor"
    echo ""
else
    echo "❌ Docker Compose 启动失败"
    echo "请检查端口占用情况和容器日志"
    exit 1
fi
