#!/bin/bash

# 常州能耗云驾驶舱 - 镜像导出并传输到内网服务器脚本

set -e

echo "=========================================="
echo "  镜像导出并传输到内网服务器"
echo "=========================================="
echo ""

# 配置
IMAGE_NAME="changzhou-energy-monitor:latest"
OUTPUT_DIR="$HOME/docker-images"
REMOTE_HOST="root@10.38.78.228"
REMOTE_PORT="2202"
REMOTE_PATH="/home/user/docker-images"

# 创建输出目录
echo "创建输出目录..."
mkdir -p $OUTPUT_DIR

# 导出镜像并压缩
echo "=========================================="
echo "  导出镜像并压缩"
echo "=========================================="
echo ""

echo "停止并删除旧容器..."
docker stop energy-monitor-prod 2>/dev/null || true
docker rm energy-monitor-prod 2>/dev/null || true

echo "导出镜像: $IMAGE_NAME"
docker save -o $OUTPUT_DIR/changzhou-energy-monitor.tar $IMAGE_NAME

echo "压缩镜像文件..."
gzip $OUTPUT_DIR/changzhou-energy-monitor.tar

echo "计算校验和..."
cd $OUTPUT_DIR
md5sum changzhou-energy-monitor.tar.gz
sha256sum changzhou-energy-monitor.tar.gz
sha256sum changzhou-energy-monitor.tar.gz > changzhou-energy-monitor.tar.gz.sha256

echo ""
echo "=========================================="
echo "  传输文件到内网服务器"
echo "=========================================="
echo ""

echo "创建远程目录..."
ssh -p $REMOTE_PORT $REMOTE_HOST "mkdir -p $REMOTE_PATH"

echo "传输镜像文件..."
scp -P $REMOTE_PORT $OUTPUT_DIR/changzhou-energy-monitor.tar.gz $REMOTE_HOST:$REMOTE_PATH/

echo "传输校验和文件..."
scp -P $REMOTE_PORT $OUTPUT_DIR/changzhou-energy-monitor.tar.gz.sha256 $REMOTE_HOST:$REMOTE_PATH/

echo ""
echo "=========================================="
echo "  传输完成！"
echo "=========================================="
echo ""
echo "内网服务器访问地址: $REMOTE_HOST:$REMOTE_PATH"
echo ""
echo "下一步：在内网服务器上执行以下命令加载镜像："
echo "  cd $REMOTE_PATH"
echo "  gunzip changzhou-energy-monitor.tar.gz"
echo "  docker load -i changzhou-energy-monitor.tar"
echo ""
