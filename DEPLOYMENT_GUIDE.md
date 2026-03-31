# 常州能耗云驾驶舱 - 部署指南

## 1. 互联网 Linux 服务器部署步骤

### 1.1 克隆 GitHub 仓库

```bash
# 克隆仓库
git clone https://github.com/liujiantao007/changzhou-energy-monitor.git

# 进入项目目录
cd changzhou-energy-monitor
```

### 1.2 构建 Docker 镜像

```bash
# 构建镜像（约5-10分钟）
docker build -t changzhou-energy-monitor:latest .

# 查看构建结果
docker images
```

### 1.3 测试运行（可选）

```bash
# 运行容器
docker-compose up -d

# 检查运行状态
docker ps

# 查看日志
docker logs energy-monitor-prod

# 访问测试
curl http://localhost:65080
curl http://localhost:5000/api/health

# 停止容器（如果测试完成）
docker-compose down
```

### 1.4 导出 Docker 镜像

```bash
# 导出镜像为 tar 文件
docker save -o changzhou-energy-monitor.tar changzhou-energy-monitor:latest

# 查看文件大小
ls -lh changzhou-energy-monitor.tar
```

## 2. 传输到内网服务器

### 2.1 SCP 传输（推荐）

```bash
# 传输到内网服务器（使用端口2202）
scp -P 2202 changzhou-energy-monitor.tar root@10.38.78.217:/root/
```

### 2.2 其他传输方式
- 使用 U 盘复制
- 使用 FTP/SFTP 工具
- 使用内网文件共享

## 3. 内网服务器部署步骤

### 3.1 加载 Docker 镜像

```bash
# 加载镜像
docker load -i changzhou-energy-monitor.tar

# 查看加载结果
docker images
```

### 3.2 运行容器

```bash
# 克隆仓库（如果内网服务器可以访问GitHub）
git clone https://github.com/liujiantao007/changzhou-energy-monitor.git
cd changzhou-energy-monitor

# 或者直接创建 docker-compose.yml 文件
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  energy-monitor:
    image: changzhou-energy-monitor:latest
    container_name: energy-monitor-prod
    restart: always
    ports:
      - "65080:80"
      - "5000:5000"
    volumes:
      - ./data:/app/data:ro
    environment:
      - TZ=Asia/Shanghai
    networks:
      - energy-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

networks:
  energy-network:
    driver: bridge
EOF

# 启动容器
docker-compose up -d

# 检查运行状态
docker ps

# 查看日志
docker logs energy-monitor-prod
```

### 3.3 访问应用

```bash
# 访问地址
# 静态文件：http://服务器IP:65080
# 后端API：http://服务器IP:5000/api

# 健康检查
curl http://服务器IP:5000/api/health
```

## 4. 配置说明

### 4.1 数据库配置

修改 `app.py` 中的数据库连接信息：

```python
# 数据库连接配置
db_config = {
    'host': '10.38.78.217',
    'port': 3220,
    'user': 'liujiantao',
    'password': 'Liujt!@#',
    'database': 'energy_management_2026'
}
```

### 4.2 端口配置

修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "65080:80"  # 静态文件服务
  - "5000:5000"  # Flask 后端
```

### 4.3 CDN 资源

如果内网无法访问外网，需要手动下载 CDN 资源：

```bash
# 下载资源
mkdir -p js/libs
curl -o js/libs/echarts.min.js https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js
curl -o js/libs/xlsx.full.min.js https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js
```

## 5. 常见问题

### 5.1 镜像构建失败
- 检查网络连接
- 检查 Docker 服务是否运行
- 检查 Dockerfile 语法

### 5.2 容器启动失败
- 查看日志：`docker logs energy-monitor-prod`
- 检查端口是否被占用
- 检查数据库连接

### 5.3 访问 404
- 检查 Nginx 配置
- 检查静态文件是否存在
- 检查 Flask 服务是否启动

## 6. 维护命令

### 6.1 查看容器状态
```bash
docker ps
```

### 6.2 查看日志
```bash
docker logs energy-monitor-prod
```

### 6.3 停止容器
```bash
docker-compose down
```

### 6.4 重启容器
```bash
docker-compose restart
```

### 6.5 更新镜像
```bash
# 拉取最新代码
git pull

# 重新构建镜像
docker build -t changzhou-energy-monitor:latest .

# 重启容器
docker-compose up -d
```