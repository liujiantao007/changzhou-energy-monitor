# 常州能耗云驾驶舱 - 完整部署文档（GitHub 源码拉取 → 公网构建 → 内网部署）

## 📋 文档说明

本文档详细描述了从 GitHub 拉取项目源码，在公网 Linux 环境构建 Docker 镜像，导出后传输到内网 Linux 系统部署的完整流程。

**适用场景**：
- 公网环境：有互联网访问，可访问 GitHub 和 Docker Hub
- 内网环境：无互联网访问，需要离线部署

**重要提示**：
- ✅ 项目已包含 CDN 资源文件（`js/libs/echarts.min.js` 和 `js/libs/xlsx.full.min.js`）
- ✅ 无需额外下载，直接克隆即可使用
- ✅ 支持公网构建镜像 → 内网导入部署的工作流
- ✅ 已修复 Flask 依赖和 Nginx 配置问题

---

## 🗺️ 部署流程总览

```
┌─────────────────────────────────────────────────────────────┐
│              第一阶段：公网环境（有互联网）                    │
├─────────────────────────────────────────────────────────────┤
│  1. 从 GitHub 拉取项目源码                                     │
│  2. 安装 Docker 环境                                           │
│  3. 配置项目（数据库连接等）                                  │
│  4. 构建 Docker 镜像                                           │
│  5. 测试运行并验证                                           │
│  6. 导出镜像为 tar 文件                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓ 传输（SCP/U盘/内网共享）
┌─────────────────────────────────────────────────────────────┐
│              第二阶段：内网环境（无互联网）                    │
├─────────────────────────────────────────────────────────────┤
│  1. 安装 Docker 环境（离线或内网源）                            │
│  2. 导入镜像文件                                              │
│  3. 适配内网配置（数据库地址等）                              │
│  4. 启动容器                                                  │
│  5. 验证部署                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

# 第一阶段：公网环境操作

## 1.1 环境要求（公网）

| 项目 | 最低要求 | 推荐配置 |
|------|---------|---------|
| **操作系统** | Ubuntu 18.04 / CentOS 7 | Ubuntu 20.04 / CentOS 8 |
| **CPU** | 1 核 | 2 核 + |
| **内存** | 2GB | 4GB+ |
| **磁盘空间** | 10GB | 20GB+ |
| **网络** | 可访问 GitHub 和 Docker Hub | 稳定互联网连接 |

## 1.2 安装 Git

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y git

# CentOS/RHEL
sudo yum install -y git

# 验证安装
git --version
```

## 1.3 从 GitHub 拉取项目源码

### 方式 A：HTTPS 克隆（推荐）

```bash
# 创建工作目录（使用系统级应用目录）
sudo mkdir -p /usr/local/energy-monitor
sudo chown -R $USER:$USER /usr/local/energy-monitor
cd /usr/local/energy-monitor

# 克隆项目
git clone https://github.com/liujiantao007/changzhou-energy-monitor.git .

# 查看项目文件
ls -la

# 验证 CDN 资源文件
ls -lh js/libs/
# 应显示：
# -rw-r--r-- 1 user user 1.0M echarts.min.js
# -rw-r--r-- 1 user user 862K xlsx.full.min.js
```

### 方式 B：SSH 克隆（需配置 SSH 密钥）

```bash
# 生成 SSH 密钥（如果没有）
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 查看公钥
cat ~/.ssh/id_rsa.pub

# 将公钥添加到 GitHub: Settings → SSH and GPG keys → New SSH key

# 创建工作目录
sudo mkdir -p /usr/local/energy-monitor
sudo chown -R $USER:$USER /usr/local/energy-monitor
cd /usr/local/energy-monitor

# 克隆项目
git clone git@github.com:liujiantao007/changzhou-energy-monitor.git .
```

### 方式 C：国内加速（GitHub 访问慢）

```bash
# 创建工作目录
sudo mkdir -p /usr/local/energy-monitor
sudo chown -R $USER:$USER /usr/local/energy-monitor
cd /usr/local/energy-monitor

# 使用镜像加速
git clone https://ghproxy.com/https://github.com/liujiantao007/changzhou-energy-monitor.git .

# 或使用代理
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
git clone https://github.com/liujiantao007/changzhou-energy-monitor.git .
```

### 验证源码完整性

```bash
# 检查关键文件
ls -la | grep -E "Dockerfile|app.py|requirements.txt|index.html"

# 检查 CDN 资源（已包含在 Git 仓库中）
ls -lh js/libs/
# 应显示：
# -rw-r--r-- 1 user user 1.0M echarts.min.js
# -rw-r--r-- 1 user user 862K xlsx.full.min.js

# 查看项目结构
tree -L 2 -I '__pycache__|*.pyc|node_modules'
```

## 1.4 安装 Docker

### Ubuntu/Debian 安装 Docker

```bash
# 更新包索引
sudo apt update

# 安装依赖
sudo apt install -y ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 添加 Docker 仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
sudo docker run hello-world
```

### CentOS/RHEL 安装 Docker

```bash
# 安装依赖
sudo yum install -y yum-utils

# 添加 Docker 仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
```

### 配置 Docker 用户权限

```bash
# 将当前用户添加到 docker 组（避免每次使用 sudo）
sudo usermod -aG docker $USER

# 重新登录或执行
newgrp docker

# 验证
docker ps
```

## 1.5 配置项目

### 查看并修改数据库配置

```bash
# 查看当前配置
grep -A 6 "DB_CONFIG" app.py

# 编辑配置
vim app.py
```

修改 `app.py` 中的数据库配置：

```python
db_config = {
    'host': os.environ.get('DB_HOST', '10.38.78.217'),  # 数据库 IP
    'port': int(os.environ.get('DB_PORT', 3220)),       # 数据库端口
    'user': os.environ.get('DB_USER', 'liujiantao'),    # 用户名
    'password': os.environ.get('DB_PASSWORD', 'Liujt!@#'),  # 密码
    'database': os.environ.get('DB_NAME', 'energy_management_2026'),
    'charset': 'utf8mb4',
    'connect_timeout': 60,
    'read_timeout': 300
}
```

### 测试数据库连接（可选）

```bash
# 安装 Python 依赖
pip3 install pymysql

# 测试连接
python3 -c "
import pymysql
conn = pymysql.connect(
    host='10.38.78.217',
    port=3220,
    user='liujiantao',
    password='Liujt!@#',
    database='energy_management_2026',
    connect_timeout=5
)
print('✅ 数据库连接成功！')
conn.close()
"
```

## 1.6 构建 Docker 镜像

### 查看 Dockerfile

```bash
cat Dockerfile
```

### 构建镜像

```bash
# 进入项目目录
cd /usr/local/energy-monitor

# 构建镜像（设置标签）
docker build -t changzhou-energy-monitor:latest .

# 或指定版本号
docker build -t changzhou-energy-monitor:v1.0 .

# 查看构建的镜像
docker images | grep changzhou-energy-monitor

# 查看镜像详细信息
docker image inspect changzhou-energy-monitor:latest | head -50
```

**预期输出**：
```
REPOSITORY                     TAG       IMAGE ID       CREATED         SIZE
changzhou-energy-monitor       latest    abc123def456   2 minutes ago   450MB
```

## 1.7 测试运行容器

### 启动测试容器

```bash
# 前台运行（用于测试）
docker run -it --name energy-monitor-test \
    -p 80:80 \
    -p 5000:5000 \
    changzhou-energy-monitor:latest

# 或后台运行（生产环境推荐）
docker run -d --name energy-monitor-prod \
    -p 65080:80 \
    -p 5000:5000 \
    --restart always \
    changzhou-energy-monitor:latest
```

### 验证服务

```bash
# 查看容器状态
docker ps | grep energy-monitor

# 查看容器日志
docker logs energy-monitor-test

# 测试 API 健康检查
curl http://127.0.0.1:5000/api/health

# 预期输出：
# {"status":"healthy","database":"connected"}

# 测试前端页面
curl -I http://127.0.0.1/

# 测试数据 API
curl "http://127.0.0.1:5000/api/summary_data?latest_date_only=true" | python3 -m json.tool | head -20
```

### 停止并删除测试容器

```bash
# 停止容器
docker stop energy-monitor-test

# 删除容器
docker rm energy-monitor-test
```

## 1.8 导出 Docker 镜像

### 导出为 tar 文件

```bash
# 创建导出目录
mkdir -p ~/docker-images

# 导出镜像（未压缩）
docker save -o ~/docker-images/changzhou-energy-monitor.tar changzhou-energy-monitor:latest

# 查看文件大小
ls -lh ~/docker-images/changzhou-energy-monitor.tar
# 约 400-600MB
```

### 压缩镜像文件（推荐）

```bash
# 使用 gzip 压缩
gzip ~/docker-images/changzhou-energy-monitor.tar

# 查看压缩后大小
ls -lh ~/docker-images/changzhou-energy-monitor.tar.gz
# 约 150-250MB

# 或使用更高压缩率（耗时更长）
gzip -9 ~/docker-images/changzhou-energy-monitor.tar
```

### 计算文件校验和（用于传输验证）

```bash
# 计算 MD5
md5sum ~/docker-images/changzhou-energy-monitor.tar.gz

# 计算 SHA256
sha256sum ~/docker-images/changzhou-energy-monitor.tar.gz

# 保存校验和到文件
cd ~/docker-images
sha256sum changzhou-energy-monitor.tar.gz > changzhou-energy-monitor.tar.gz.sha256
```

---

# 第二阶段：传输镜像文件

## 2.1 传输方式选择

| 方式 | 适用场景 | 速度 | 安全性 |
|------|---------|------|--------|
| **SCP/SFTP** | 内网互通 | 快 | 高 |
| **U 盘/移动硬盘** | 完全隔离 | 中 | 中 |
| **内网文件共享** | 有文件服务器 | 快 | 中 |
| **HTTP 下载** | 有 Web 服务器 | 快 | 低 |

## 2.2 SCP 传输（推荐）

```bash
# 从公网服务器传输镜像文件到内网服务器（使用端口 2202）
scp -P 2202 ~/docker-images/changzhou-energy-monitor.tar.gz root@10.38.78.228:/home/user/docker-images/

# 传输校验和文件
scp -P 2202 ~/docker-images/changzhou-energy-monitor.tar.gz.sha256 root@10.38.78.228:/home/user/docker-images/
```

## 2.3 U 盘传输

```bash
# 1. 在公网服务器上复制文件到 U 盘
# 假设 U 盘挂载在 /media/usb

cp ~/docker-images/changzhou-energy-monitor.tar.gz /media/usb/
cp ~/docker-images/changzhou-energy-monitor.tar.gz.sha256 /media/usb/

# 2. 安全弹出 U 盘
sync
umount /media/usb

# 3. 在内网服务器上挂载 U 盘并复制
mount /dev/sdb1 /media/usb
cp /media/usb/changzhou-energy-monitor.tar.gz ~/
cp /media/usb/changzhou-energy-monitor.tar.gz.sha256 ~/
```

## 2.4 验证传输完整性

```bash
# 在内网服务器上验证
cd /home/user/
sha256sum -c changzhou-energy-monitor.tar.gz.sha256

# 预期输出：
# changzhou-energy-monitor.tar.gz: OK
```

---

# 第三阶段：内网环境部署

## 3.1 环境要求（内网）

| 项目 | 要求 |
|------|------|
| **操作系统** | Ubuntu 18.04+ / CentOS 7+ |
| **Docker** | 20.10+（需预装） |
| **网络** | 内网互通，可访问数据库 |
| **磁盘空间** | 至少 5GB |
| **内存** | 至少 1GB |

## 3.2 安装 Docker（内网环境）

### 方式 A：内网有 Docker 安装源

```bash
# 如果内网配置了 Docker 镜像源
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

sudo systemctl start docker
sudo systemctl enable docker
```

### 方式 B：完全离线安装

```bash
# 1. 在公网电脑下载 Docker 离线安装包
# 访问：https://download.docker.com/linux/ubuntu/dists/

# 2. 下载以下 deb 包（Ubuntu 20.04 示例）：
# - docker-ce_20.10.24~3-0~ubuntu-focal_amd64.deb
# - docker-ce-cli_20.10.24~3-0~ubuntu-focal_amd64.deb
# - containerd.io_1.6.20-1_amd64.deb
# - docker-compose-plugin_2.17.3-1~ubuntu.20.04~focal_amd64.deb

# 3. 传输到内网后安装
sudo dpkg -i containerd.io_*.deb
sudo dpkg -i docker-ce-cli_*.deb
sudo dpkg -i docker-ce_*.deb
sudo dpkg -i docker-compose-plugin_*.deb

# 4. 修复依赖（如有问题）
sudo apt-get install -f

# 5. 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 6. 验证
docker --version
```

## 3.3 导入 Docker 镜像

```bash
# 进入文件目录
cd /home/user/

# 解压镜像文件（如果压缩了）
gunzip changzhou-energy-monitor.tar.gz

# 导入镜像
docker load -i changzhou-energy-monitor.tar

# 预期输出：
# Loaded image: changzhou-energy-monitor:latest

# 验证镜像
docker images | grep changzhou-energy-monitor

# 查看镜像详细信息
docker image inspect changzhou-energy-monitor:latest
```

## 3.4 内网配置适配

### 差异点说明

| 配置项 | 公网环境 | 内网环境 | 是否需要修改 |
|--------|---------|---------|-------------|
| 数据库 HOST | 10.38.78.217 | 内网数据库 IP | **可能需要** |
| 数据库 PORT | 3220 | 根据实际 | 可能需要 |
| 访问域名 | 可用域名 | 仅 IP 访问 | 否 |
| SSL 证书 | 可配置 | 一般不用 | 否 |

### 方式 A：重新构建镜像（推荐）

如果内网数据库地址不同：

```bash
# 1. 修改 app.py 中的数据库配置
vim app.py
# 修改 DB_CONFIG 中的 host 为内网数据库 IP

# 2. 重新构建镜像
docker build -t changzhou-energy-monitor:internal .

# 3. 导出新镜像
docker save -o changzhou-energy-monitor-internal.tar changzhou-energy-monitor:internal
gzip changzhou-energy-monitor-internal.tar
```

### 方式 B：使用环境变量（需代码支持）

如果代码支持环境变量：

```bash
docker run -d --name energy-monitor \
    -e DB_HOST=192.168.1.50 \
    -e DB_PORT=3306 \
    -e DB_USER=liujiantao \
    -e DB_PASSWORD=Liujt!@# \
    -e DB_NAME=energy_management_2026 \
    -p 80:80 \
    -p 5000:5000 \
    changzhou-energy-monitor:latest
```

## 3.5 启动容器

### 启动命令

```bash
# 后台运行（推荐）
docker run -d --name energy-monitor \
    -p 80:80 \
    -p 5000:5000 \
    --restart=always \
    changzhou-energy-monitor:latest

# 或指定资源限制
docker run -d --name energy-monitor \
    -p 80:80 \
    -p 5000:5000 \
    --restart=always \
    --memory=1g \
    --cpus=1 \
    changzhou-energy-monitor:latest
```

### 查看容器状态

```bash
# 查看运行状态
docker ps | grep energy-monitor

# 查看详细信息
docker inspect energy-monitor

# 查看日志
docker logs energy-monitor

# 实时查看日志
docker logs -f energy-monitor

# 查看最近 100 行日志
docker logs --tail 100 energy-monitor
```

## 3.6 部署验证

### 验证清单

```bash
# 1. 容器运行状态
docker ps --filter "name=energy-monitor" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 2. 端口监听
netstat -tlnp | grep -E ':(80|5000)'

# 3. API 健康检查
curl http://127.0.0.1:5000/api/health

# 4. 数据 API 测试
curl "http://127.0.0.1:5000/api/summary_data?latest_date_only=true" | python3 -m json.tool | head -20

# 5. 前端页面访问
curl -I http://127.0.0.1/

# 6. CDN 文件检查（已包含在镜像中）
docker exec energy-monitor ls -lh /app/js/libs/
# 应显示：
# -rw-r--r-- 1 root root 1.0M echarts.min.js
# -rw-r--r-- 1 root root 862K xlsx.full.min.js

# 7. 数据库连接测试
docker exec energy-monitor python3 -c "
import pymysql
pymysql.connect(host='数据库 IP', port=3220, user='liujiantao', password='Liujt!@#', database='energy_management_2026')
print('Database OK')
"
```

### 浏览器访问

```
前端页面：http://内网服务器 IP/
后端 API：http://内网服务器 IP/api/health
```

---

# 第四阶段：运维管理

## 4.1 容器管理命令

```bash
# 启动容器
docker start energy-monitor

# 停止容器
docker stop energy-monitor

# 重启容器
docker restart energy-monitor

# 删除容器（需先停止）
docker stop energy-monitor
docker rm energy-monitor

# 进入容器 Shell
docker exec -it energy-monitor /bin/bash

# 从容器复制文件
docker cp energy-monitor:/app/app.py ./app.py.bak

# 查看容器资源使用
docker stats energy-monitor
```

## 4.2 日志管理

```bash
# 实时查看日志
docker logs -f energy-monitor

# 查看最近 N 行日志
docker logs --tail 100 energy-monitor

# 查看指定时间段日志
docker logs --since 2024-01-01T00:00:00 energy-monitor

# 导出日志
docker logs energy-monitor > energy-monitor.log

# 清理日志（重启容器）
docker restart energy-monitor
```

## 4.3 更新部署

```bash
# 1. 停止旧容器
docker stop energy-monitor
docker rm energy-monitor

# 2. 导入新镜像
docker load -i changzhou-energy-monitor-v2.tar

# 3. 启动新容器
docker run -d --name energy-monitor \
    -p 80:80 \
    -p 5000:5000 \
    --restart=always \
    changzhou-energy-monitor:v2

# 4. 验证
docker logs -f energy-monitor
```

## 4.4 Docker Compose 一键部署（推荐）

项目提供了 Docker Compose 配置文件和启动脚本，支持一键部署、自动清理端口占用、自动重启等功能。

### 文件说明

| 文件 | 说明 |
|------|------|
| `docker-compose.yml` | Docker Compose 配置文件 |
| `start.sh` | 一键部署启动脚本 |

### docker-compose.yml 配置

```yaml
version: '3.8'

services:
  energy-monitor:
    image: changzhou-energy-monitor:latest
    container_name: energy-monitor-prod
    restart: always
    ports:
      - "65080:80"      # 前端页面端口
      - "5000:5000"     # 后端 API 端口
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
```

### start.sh 脚本功能

**自动处理以下内容**：
- ✅ 检查 Docker 和 Docker Compose 是否安装
- ✅ 检查并自动清理占用端口（65080、5000）的进程
- ✅ 检查并删除已存在的容器
- ✅ 重新构建 Docker 镜像
- ✅ 使用 Docker Compose 启动服务

### 一键部署命令

```bash
# 1. 进入项目目录
cd /usr/local/energy-monitor

# 2. 拉取最新代码
git pull origin main

# 3. 给脚本添加执行权限
chmod +x start.sh

# 4. 执行启动脚本（会自动处理端口占用）
./start.sh
```

### 脚本执行流程

```
1. 检查 Docker 和 Docker Compose
2. 检查并清理占用端口的进程 (65080, 5000)
   - 如果是 Docker 容器 → 自动停止并删除
   - 如果是其他进程 → 自动 kill
3. 检查并删除已存在的容器
4. 构建 Docker 镜像
5. 启动 Docker Compose 服务
```

### 常用命令

```bash
# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看容器状态
docker ps | grep energy-monitor

# 强制重启（重新构建）
docker-compose down
./start.sh
```

### 访问地址

部署成功后，通过以下地址访问：

| 服务 | 地址 |
|------|------|
| **前端页面** | http://localhost:65080/ |
| **后端 API** | http://localhost:65080/api/health |

---

# 第五阶段：故障排除

## 5.1 常见问题与解决方案

### 问题 1：GitHub 克隆失败

**症状**：
```
fatal: unable to access 'https://github.com/...': Connection timed out
```

**解决方案**：
```bash
# 方案 A：使用镜像
git clone https://ghproxy.com/https://github.com/liujiantao007/changzhou-energy-monitor.git

# 方案 B：使用代理
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 方案 C：增加超时时间
git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 999999
```

### 问题 2：Docker 构建失败

**症状**：
```
ERROR: failed to solve: process "/bin/sh -c pip install" did not complete successfully
```

**排查步骤**：
```bash
# 1. 检查 Dockerfile 语法
docker build -t test . --no-cache --progress=plain

# 2. 检查网络连接
ping -c 3 pypi.org

# 3. 使用国内镜像源
# 在 Dockerfile 中添加：
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

### 问题 3：镜像导入失败

**症状**：
```
open changzhou-energy-monitor.tar: no such file or directory
```

**解决方案**：
```bash
# 1. 检查文件是否存在
ls -lh changzhou-energy-monitor.tar*

# 2. 如果是压缩文件，先解压
gunzip changzhou-energy-monitor.tar.gz

# 3. 检查文件完整性
file changzhou-energy-monitor.tar

# 4. 重新导入
docker load -i changzhou-energy-monitor.tar
```

### 问题 4：容器无法启动

**症状**：
```
docker ps -a 显示容器状态为 Exited
```

**排查步骤**：
```bash
# 1. 查看退出原因
docker inspect energy-monitor | grep -A 10 "State"

# 2. 查看日志
docker logs energy-monitor

# 3. 前台运行查看错误
docker run -it --name energy-monitor-debug \
    -p 80:80 \
    -p 5000:5000 \
    changzhou-energy-monitor:latest

# 4. 检查端口占用
netstat -tlnp | grep -E ':(80|5000)'
```

### 问题 5：数据库连接失败

**症状**：
```
{"status":"healthy","database":"disconnected"}
```

**排查步骤**：
```bash
# 1. 测试网络连通性
docker exec energy-monitor ping -c 3 数据库 IP

# 2. 测试端口开放
docker exec energy-monitor nc -zv 数据库 IP 3220

# 3. 测试数据库连接
docker exec energy-monitor python3 -c "
import pymysql
try:
    conn = pymysql.connect(host='数据库 IP', port=3220, user='liujiantao', password='Liujt!@#', database='energy_management_2026', connect_timeout=5)
    print('OK')
    conn.close()
except Exception as e:
    print(f'Failed: {e}')
"

# 4. 检查防火墙
sudo iptables -L -n | grep 3220
```

### 问题 6：前端页面空白

**症状**：浏览器显示空白页面

**排查步骤**：
```bash
# 1. 检查 CDN 文件（已包含在镜像中）
docker exec energy-monitor ls -lh /app/js/libs/
# 应显示 echarts.min.js 和 xlsx.full.min.js

# 2. 检查 Nginx 配置
docker exec energy-monitor cat /etc/nginx/nginx.conf

# 3. 查看 Nginx 错误日志
docker exec energy-monitor cat /var/log/nginx/error.log

# 4. 测试静态文件访问
curl http://127.0.0.1/js/libs/echarts.min.js | head -10
```

### 问题 7：端口被占用

**症状**：
```
Error: bind: address already in use
```

**解决方案**：
```bash
# 1. 查看端口占用
netstat -tlnp | grep :80
netstat -tlnp | grep :5000

# 2. 停止占用服务
sudo systemctl stop nginx
sudo systemctl stop apache2

# 3. 或使用不同端口
docker run -d --name energy-monitor \
    -p 8080:80 \
    -p 5001:5000 \
    changzhou-energy-monitor:latest
```

## 5.2 已知问题修复

### 修复 1：Flask 依赖缺失

**问题**：容器启动时报 `ModuleNotFoundError: No module named 'flask_cors'`

**原因**：`requirements.txt` 中缺少 `flask-cors` 依赖

**修复**：已在 `requirements.txt` 中添加 `flask-cors>=3.0.0`

**验证**：
```bash
# 重新构建镜像
docker build -t changzhou-energy-monitor:latest .

# 启动容器
docker run -d --name energy-monitor -p 80:80 -p 5000:5000 changzhou-energy-monitor:latest

# 查看日志
docker logs energy-monitor

# 应显示服务正常启动，无模块缺失错误
```

### 修复 2：Nginx 用户配置错误

**问题**：容器启动时报 `nginx: [emerg] getpwnam("nginx") failed`

**原因**：Ubuntu 系统中 Nginx 默认用户是 `www-data`，不是 `nginx`

**修复**：已将 `nginx.conf` 中的 `user nginx;` 改为 `user www-data;`

**验证**：
```bash
# 查看 Nginx 配置
grep "^user" nginx.conf
# 应显示：user www-data;

# 重新构建镜像
docker build -t changzhou-energy-monitor:latest .

# 启动容器
docker run -d --name energy-monitor -p 80:80 -p 5000:5000 changzhou-energy-monitor:latest

# 查看日志
docker logs energy-monitor

# 应显示 Nginx 正常启动，无用户错误
```

## 5.3 性能问题排查

```bash
# 查看容器资源使用
docker stats energy-monitor

# 查看容器进程
docker top energy-monitor

# 查看容器内存详情
docker exec energy-monitor free -m

# 查看容器磁盘使用
docker exec energy-monitor df -h

# 查看容器网络连接
docker exec energy-monitor netstat -an
```

---

# 附录 A：项目文件结构

```
changzhou-energy-monitor/
├── app.py                      # Flask 后端 API
├── requirements.txt            # Python 依赖（已包含 flask-cors）
├── Dockerfile                  # Docker 构建文件
├── nginx.conf                  # Nginx 配置（用户：www-data）
├── entrypoint.sh               # 容器启动脚本
├── index.html                  # 前端首页
├── css/
│   └── style.css              # 样式文件
├── js/
│   ├── app.js                 # 主逻辑
│   ├── charts.js              # 图表模块
│   ├── data.js                # 数据处理
│   ├── map.js                 # 地图模块
│   ├── nav-config.js          # 导航配置
│   └── libs/                  # CDN 本地资源（已包含在 Git 中）
│       ├── echarts.min.js     # ECharts 图表库 (1.0MB)
│       └── xlsx.full.min.js   # Excel 处理库 (862KB)
├── data/                       # 数据文件目录
├── docker/                     # Docker 配置目录
│   └── all-in-one/            # 一体化部署
├── DEPLOYMENT_COMPLETE.md     # 本文档
└── README.md                   # 项目说明
```

---

# 附录 B：快速命令参考

## 公网环境

```bash
# 创建目录并克隆项目
sudo mkdir -p /usr/local/energy-monitor
sudo chown -R $USER:$USER /usr/local/energy-monitor
cd /usr/local/energy-monitor
git clone https://github.com/liujiantao007/changzhou-energy-monitor.git .

# 验证 CDN 文件
ls -lh js/libs/

# 构建镜像
docker build -t changzhou-energy-monitor:latest .

# 测试运行
docker run -d --name test -p 80:80 -p 5000:5000 changzhou-energy-monitor:latest
curl http://127.0.0.1:5000/api/health

# 导出镜像
docker save changzhou-energy-monitor:latest | gzip > changzhou-energy-monitor.tar.gz
```

## 内网环境

```bash
# 导入镜像
gunzip changzhou-energy-monitor.tar.gz
docker load -i changzhou-energy-monitor.tar

# 启动容器
docker run -d --name energy-monitor \
    -p 80:80 \
    -p 5000:5000 \
    --restart=always \
    changzhou-energy-monitor:latest

# 验证
docker ps
curl http://127.0.0.1:5000/api/health
```

## 故障修复

```bash
# 如果遇到 flask_cors 模块缺失
# 1. 更新 requirements.txt（添加 flask-cors>=3.0.0）
# 2. 重新构建镜像
docker build -t changzhou-energy-monitor:latest .

# 如果遇到 Nginx 用户错误
# 1. 更新 nginx.conf（user www-data;）
# 2. 重新构建镜像
docker build -t changzhou-energy-monitor:latest .
```

---

# 附录 C：互联网 Linux 快速部署指南（推荐）

本文档提供在可访问互联网的 Linux 服务器上一键部署常州能耗云驾驶舱的完整流程。

## 🚀 快速开始

### 环境要求

| 项目 | 要求 |
|------|------|
| **操作系统** | Ubuntu 18.04+ / CentOS 7+ |
| **Docker** | 20.10+ |
| **Docker Compose** | 2.0+ |
| **网络** | 可访问 GitHub 和 Docker Hub |
| **磁盘空间** | 至少 10GB |

### 前置检查

在开始之前，请确认服务器满足以下条件：

```bash
# 1. 检查系统版本
cat /etc/os-release

# 2. 检查 Docker 是否安装
docker --version

# 3. 检查 Docker Compose 是否安装
docker-compose --version

# 4. 检查网络连接
curl -I https://github.com
```

## 📦 部署步骤

### 步骤 1：安装必要软件

如果服务器上没有 Docker 和 Docker Compose，执行以下命令安装：

**Ubuntu/Debian：**

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.17.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 添加当前用户到 docker 组（避免每次使用 sudo）
sudo usermod -aG docker $USER
newgrp docker
```

**CentOS/RHEL：**

```bash
# 安装 Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker

# 添加当前用户到 docker 组
sudo usermod -aG docker $USER
newgrp docker
```

### 步骤 2：创建项目目录并拉取代码

```bash
# 创建项目目录
sudo mkdir -p /usr/local/energy-monitor
sudo chown -R $USER:$USER /usr/local/energy-monitor
cd /usr/local/energy-monitor

# 克隆项目代码
git clone https://github.com/liujiantao007/changzhou-energy-monitor.git .

# 验证代码已下载
ls -la
# 应看到：Dockerfile, docker-compose.yml, start.sh, app.py 等文件
```

### 步骤 3：一键部署

```bash
# 给部署脚本添加执行权限
chmod +x start.sh

# 执行一键部署（包含镜像构建和容器启动）
./start.sh
```

**或者分步执行：**

```bash
# 1. 构建 Docker 镜像
docker build --no-cache -t changzhou-energy-monitor:latest .

# 2. 启动容器
chmod +x deploy.sh
./deploy.sh
```

### 步骤 4：验证部署

```bash
# 检查容器状态
docker ps | grep energy-monitor

# 查看容器日志
docker logs -f energy-monitor-prod

# 测试 API 健康检查
curl http://localhost:65080/api/health

# 测试前端页面
curl -I http://localhost:65080/
```

### 步骤 5：访问应用

部署成功后，通过以下地址访问：

| 服务 | 地址 | 说明 |
|------|------|------|
| **前端页面** | http://服务器IP:65080/ | 能耗监控主页面 |
| **后端 API** | http://服务器IP:65080/api/health | API 健康检查 |

## 🔧 常用运维命令

```bash
# 进入项目目录
cd /usr/local/energy-monitor

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看容器状态
docker ps | grep energy-monitor

# 更新部署（拉取最新代码并重新部署）
git pull origin main
./start.sh
```

## 🆘 故障排除

### 问题 1：端口被占用

**错误信息：**
```
Bind for 0.0.0.0:65080 failed: port is already allocated
```

**解决方案：**

```bash
# 查看端口占用
sudo lsof -i :65080
sudo lsof -i :5000

# 如果是被其他服务占用，停止它
sudo systemctl stop <服务名>

# 如果是被 Docker 容器占用，重新部署
docker-compose down
./deploy.sh
```

### 问题 2：Docker 镜像构建失败

**解决方案：**

```bash
# 清理 Docker 缓存
docker system prune -a

# 重新构建
docker build --no-cache -t changzhou-energy-monitor:latest .
```

### 问题 3：数据库连接失败

**解决方案：**

```bash
# 检查容器是否能访问数据库
docker exec energy-monitor-prod ping -c 3 10.38.78.217

# 检查数据库配置
docker exec energy-monitor-prod env | grep DB_

# 查看数据库连接日志
docker logs energy-monitor-prod | grep -i database
```

### 问题 4：前端页面空白

**解决方案：**

```bash
# 检查 Nginx 是否正常运行
docker exec energy-monitor-prod nginx -t

# 检查静态文件是否存在
docker exec energy-monitor-prod ls -la /app/index.html

# 查看 Nginx 错误日志
docker exec energy-monitor-prod cat /var/log/nginx/error.log
```

## 📊 部署检查清单

在完成部署后，使用以下清单验证系统是否正常运行：

- [ ] 容器状态为 `Up`
- [ ] API 健康检查返回 `{"status":"healthy","database":"connected"}`
- [ ] 前端页面可以正常加载
- [ ] 地图数据可以正常显示
- [ ] 数据库连接正常
- [ ] 所有图表数据正常显示

## 🔐 安全建议

### 生产环境建议

1. **修改默认端口**：将 65080 改为其他非标准端口
2. **配置防火墙**：只开放必要端口
   ```bash
   sudo firewall-cmd --permanent --add-port=65080/tcp
   sudo firewall-cmd --reload
   ```
3. **配置 SSL 证书**：使用 Nginx 反向代理配置 HTTPS
4. **定期更新**：定期执行 `git pull` 和 `./start.sh` 更新系统

### 数据库连接安全

当前配置使用数据库地址 `10.38.78.217:3220`，请确保：
- 内网环境安全
- 数据库密码足够复杂
- 定期更换密码

## 📞 技术支持

如遇到问题，请提供以下信息：

1. 执行 `docker logs energy-monitor-prod` 的完整输出
2. 执行 `docker ps -a` 的输出
3. 浏览器开发者工具（F12）的 Console 错误信息

---

**文档版本**：v8.0
**最后更新**：2026-03-31
**适用项目**：changzhou-energy-monitor 全部版本
**重要说明**：
- CDN 资源文件已包含在 Git 仓库中，无需额外下载
- 已修复 Flask 依赖（flask-cors）和 Nginx 用户配置（www-data）问题
- 支持一键部署，自动处理端口占用
