# 常州能耗云驾驶舱 - 公网/内网Docker容器化部署文档

## 📋 项目概述

本项目为常州能耗云运营驾驶舱系统，包含前端静态页面（Nginx）和后端Flask API服务。

**核心特性**：
- Docker容器化部署，环境隔离，易于迁移
- CDN资源已本地化，无需互联网下载
- 支持公网构建镜像 → 内网导入部署的工作流
- 配置文件与代码分离，方便环境适配

---

## 🔧 文档结构说明

| 章节 | 适用环境 | 内容 |
|------|---------|------|
| [第一章](#第一章-公网环境构建与导出) | 公网Ubuntu | 构建Docker镜像并导出 |
| [第二章](#第二章-内网环境部署) | 内网Ubuntu | 导入镜像并启动服务 |
| [第三章](#第三章-部署验证与故障排除) | 通用 | 验证方法与常见问题 |
| [附录](#附录-配置文件参考) | 通用 | 完整配置文件示例 |

---

## 第一章 公网环境构建与导出

### 1.1 环境要求（公网）

| 项目 | 要求 |
|------|------|
| **操作系统** | Ubuntu 20.04+ / CentOS 7+ / Debian 10+ |
| **Docker版本** | Docker 20.10+ |
| **网络** | 可访问互联网（用于构建） |
| **磁盘空间** | 至少10GB可用空间 |
| **内存** | 至少2GB |

### 1.2 安装Docker（公网环境）

```bash
# Ubuntu/Debian 安装Docker
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release

# 添加Docker GPG密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 添加Docker仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 验证安装
docker --version
```

### 1.3 项目配置检查

在构建之前，检查项目文件结构：

```bash
# 检查关键文件
ls -la project_dianfeiv2/

# 确认Dockerfile存在
cat project_dianfeiv2/Dockerfile

# 确认CDN文件已本地化
ls -lh project_dianfeiv2/js/libs/
# 应显示：echarts.min.js (约1MB+), xlsx.full.min.js (约800KB+)
```

### 1.4 配置数据库连接

编辑 `app.py` 中的数据库配置（如果需要）：

```bash
vim project_dianfeiv2/app.py
```

```python
DB_CONFIG = {
    'host': '10.38.78.217',      # 数据库IP地址
    'port': 3220,                  # 数据库端口
    'user': 'liujiantao',         # 数据库用户名
    'password': 'Liujt!@#',       # 数据库密码
    'database': 'energy_management_2026',
    'charset': 'utf8mb4'
}
```

### 1.5 构建Docker镜像

```bash
cd project_dianfeiv2

# 构建镜像（设置镜像名和标签）
docker build -t changzhou-energy-monitor:latest .

# 查看构建的镜像
docker images | grep changzhou-energy-monitor

# 查看镜像大小
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

**预期输出示例**：
```
REPOSITORY                     TAG        SIZE
changzhou-energy-monitor        latest     450MB
```

### 1.6 导出镜像为可移植文件

```bash
# 导出镜像为tar文件
docker save -o changzhou-energy-monitor.tar changzhou-energy-monitor:latest

# 查看文件大小
ls -lh changzhou-energy-monitor.tar

# 压缩镜像（可选，推荐传输前压缩）
gzip changzhou-energy-monitor.tar
ls -lh changzhou-energy-monitor.tar.gz
```

**文件大小参考**：
- 未压缩：约 400-600MB
- gzip压缩后：约 150-250MB

---

## 第二章 内网环境部署

### 2.1 环境要求（内网）

| 项目 | 要求 | 备注 |
|------|------|------|
| **操作系统** | Ubuntu 20.04+ / CentOS 7+ | 与公网一致 |
| **Docker版本** | Docker 20.10+ | 必须预装 |
| **网络** | 内网互通 | 无需互联网 |
| **磁盘空间** | 至少5GB可用空间 | |
| **内存** | 至少1GB | |

### 2.2 安装Docker（内网环境）

**方式A：如果内网可以访问更新源**

```bash
# 与公网相同的安装步骤
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

**方式B：完全离线安装（参考）**

```bash
# 1. 在有网络的电脑上下载Docker deb包
# https://download.docker.com/linux/ubuntu/dists/

# 2. 使用U盘传输到内网

# 3. 安装
sudo dpkg -i /path/to/docker-ce*.deb
sudo apt-get install -f  # 修复依赖
```

### 2.3 传输镜像文件

根据内网环境选择传输方式：

| 方式 | 操作 | 适用场景 |
|------|------|---------|
| **SCP** | `scp changzhou-energy-monitor.tar.gz user@内网IP:/path/` | 内网互通 |
| **U盘** | 直接复制文件 | 完全隔离环境 |
| **内网共享** | SMB/NFS共享传输 | 有内网文件服务器 |

**传输示例（SCP）**：
```bash
# 公网执行
scp changzhou-energy-monitor.tar.gz internal-user@192.168.1.100:/home/internal-user/
```

### 2.4 导入Docker镜像

```bash
# 进入文件目录
cd /home/internal-user/

# 解压（如果传输的是压缩文件）
gunzip changzhou-energy-monitor.tar.gz

# 导入镜像
docker load -i changzhou-energy-monitor.tar

# 验证镜像
docker images | grep changzhou-energy-monitor

# 查看镜像标签
docker image inspect changzhou-energy-monitor:latest
```

### 2.5 修改内网数据库配置

**重要**：内网数据库配置通常与公网不同！

```bash
# 如果内网数据库IP与构建时不同，需要修改配置
# 有两种方式：

# 方式A：重新构建镜像（推荐）
# 1. 修改 app.py 中的 DB_CONFIG
# 2. 重新构建：
docker build -t changzhou-energy-monitor:internal .
docker save -o changzhou-energy-monitor-internal.tar changzhou-energy-monitor:internal

# 方式B：运行时通过环境变量覆盖（如果代码支持）
docker run -d \
  -e DB_HOST=内网数据库IP \
  -p 80:80 \
  -p 5000:5000 \
  changzhou-energy-monitor:latest
```

### 2.6 启动容器

```bash
# 启动容器（前台运行 - 用于调试）
docker run -it --name energy-monitor \
    -p 80:80 \
    -p 5000:5000 \
    changzhou-energy-monitor:latest

# 或后台运行（推荐用于生产）
docker run -d --name energy-monitor \
    -p 80:80 \
    -p 5000:5000 \
    --restart=always \
    changzhou-energy-monitor:latest

# 验证容器状态
docker ps

# 查看容器日志
docker logs energy-monitor
```

### 2.7 容器管理命令

```bash
# 停止容器
docker stop energy-monitor

# 启动容器
docker start energy-monitor

# 重启容器
docker restart energy-monitor

# 查看日志（实时）
docker logs -f energy-monitor

# 查看最近100行日志
docker logs --tail 100 energy-monitor

# 进入容器Shell
docker exec -it energy-monitor /bin/bash

# 容器内验证CDN文件
ls -lh /app/js/libs/

# 容器内测试数据库连接
docker exec -it energy-monitor python3 -c "
import pymysql
pymysql.connect(host='数据库IP', port=3220, user='liujiantao', password='Liujt!@#', database='energy_management_2026')
print('Database connection OK!')
"
```

---

## 第三章 部署验证与故障排除

### 3.1 验证清单

| 验证项 | 方法 | 预期结果 |
|--------|------|---------|
| **容器运行状态** | `docker ps` | 显示 `energy-monitor` 状态为 `Up` |
| **端口监听** | `netstat -tlnp \| grep -E ':(80\|5000)'` | 80和5000端口被监听 |
| **API健康检查** | `curl http://127.0.0.1:5000/api/health` | `{"status":"healthy","database":"connected"}` |
| **前端页面** | `curl http://127.0.0.1/` | 返回HTML内容 |
| **CDN文件** | `docker exec energy-monitor ls /app/js/libs/` | 显示echarts和xlsx文件 |

### 3.2 完整验证流程

```bash
# 1. 检查容器状态
docker ps --filter "name=energy-monitor" --format "{{.Status}}"

# 2. 测试API健康端点
curl -s http://127.0.0.1:5000/api/health | python3 -m json.tool

# 3. 测试数据API
curl -s "http://127.0.0.1:5000/api/summary_data?latest_date_only=true" | python3 -m json.tool | head -30

# 4. 测试前端访问
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/

# 5. 查看错误日志
docker logs --tail 50 energy-monitor | grep -i error
```

### 3.3 常见问题与解决方案

#### 问题1：CDN资源加载失败

**症状**：页面图表显示空白或报错

**排查步骤**：
```bash
# 1. 检查CDN文件是否存在
docker exec energy-monitor ls -lh /app/js/libs/

# 预期输出：
# -rw-r--r-- 1 root root 1.2M echarts.min.js
# -rw-r--r-- 1 root root  800K xlsx.full.min.js
```

**解决方案**：
如果文件不存在，说明构建镜像时文件未包含。需要重新构建：
```bash
# 在公网环境重新构建
docker build -t changzhou-energy-monitor:v2 .
docker save changzhou-energy-monitor:v2 | gzip > changzhou-energy-monitor-v2.tar.gz

# 传输并导入
gunzip changzhou-energy-monitor-v2.tar.gz
docker load -i changzhou-energy-monitor-v2.tar

# 启动新容器
docker stop energy-monitor
docker rm energy-monitor
docker run -d --name energy-monitor -p 80:80 -p 5000:5000 changzhou-energy-monitor:v2
```

#### 问题2：数据库连接失败

**症状**：`/api/health` 返回 `{"status":"healthy","database":"disconnected"}`

**排查步骤**：
```bash
# 1. 从容器内测试数据库连接
docker exec -it energy-monitor python3 -c "
import pymysql
try:
    conn = pymysql.connect(host='10.38.78.217', port=3220, user='liujiantao', password='Liujt!@#', database='energy_management_2026', connect_timeout=5)
    print('Database connection OK!')
    conn.close()
except Exception as e:
    print(f'Database connection failed: {e}')
"

# 2. 检查网络连通性（如果有ping）
docker exec energy-monitor ping -c 3 10.38.78.217

# 3. 检查端口开放
docker exec energy-monitor nc -zv 10.38.78.217 3220
```

**解决方案**：
- 确认内网数据库IP地址正确
- 确认数据库服务正在运行
- 确认防火墙允许3306/3220端口
- 确认数据库用户权限配置正确

#### 问题3：端口被占用

**症状**：`docker run` 报错 "Port is already allocated"

**排查步骤**：
```bash
# 查看端口占用
netstat -tlnp | grep -E ':(80|5000)'

# 或
docker ps --format "{{.Ports}}"
```

**解决方案A：停止占用端口的服务**
```bash
# 停止Nginx
sudo systemctl stop nginx

# 或停止旧容器
docker stop energy-monitor
docker rm energy-monitor
```

**解决方案B：使用不同端口映射**
```bash
# 映射到其他端口
docker run -d --name energy-monitor \
    -p 8080:80 \
    -p 5001:5000 \
    changzhou-energy-monitor:latest

# 修改后访问
# 前端：http://IP:8080/
# API：http://IP:5001/api/health
```

#### 问题4：502 Bad Gateway

**症状**：访问前端页面返回502错误

**排查步骤**：
```bash
# 1. 检查Flask是否运行
docker exec energy-monitor ps aux | grep python

# 2. 检查Flask进程监听
docker exec energy-monitor netstat -tlnp | grep 5000

# 3. 查看Nginx错误日志
docker logs energy-monitor 2>&1 | grep -A 5 "error"
```

**解决方案**：
```bash
# 重启容器
docker restart energy-monitor

# 查看启动日志
docker logs -f energy-monitor
```

#### 问题5：容器频繁重启

**症状**：`docker ps` 显示容器不断重启

**排查步骤**：
```bash
# 查看重启原因
docker inspect energy-monitor | grep -A 10 "State"

# 查看系统日志
sudo journalctl -u docker --since "5 minutes ago"
```

**解决方案**：
```bash
# 查看容器退出原因
docker logs energy-monitor

# 以前台模式运行查看实时错误
docker run -it --name energy-monitor-debug \
    -p 80:80 \
    -p 5000:5000 \
    changzhou-energy-monitor:latest
```

---

## 附录 配置文件中公网与内网的主要差异

### 差异点对比表

| 配置项 | 公网环境 | 内网环境 | 调整方法 |
|--------|---------|---------|---------|
| **数据库HOST** | `10.38.78.217` | 内网数据库IP | 修改 `app.py` 的 `DB_CONFIG.host` |
| **数据库端口** | `3220` | 根据实际 | 修改 `app.py` 的 `DB_CONFIG.port` |
| **访问域名** | 可用真实域名 | 只能用IP | 省略域名，直接用IP访问 |
| **SSL证书** | 可配置HTTPS | 一般不用 | 注释掉SSL相关配置 |
| **防火墙** | 需开放80/443 | 仅需内网互通 | 确保内网机器可访问 |

### Nginx配置适配（内网简化版）

如果在内网环境不需要HTTPS，可以简化Nginx配置：

```nginx
server {
    listen 80;
    server_name _;  # 匹配任意域名

    root /app;
    index index.html;

    # 静态文件缓存
    location /js/libs/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 前端页面
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 环境变量配置方案（推荐）

为方便在不同环境部署，可以使用环境变量：

```bash
# 启动时指定数据库配置
docker run -d --name energy-monitor \
    -e DB_HOST=192.168.1.100 \
    -e DB_PORT=3306 \
    -e DB_USER=liujiantao \
    -e DB_PASSWORD=Liujt!@# \
    -e DB_NAME=energy_management_2026 \
    -p 80:80 \
    -p 5000:5000 \
    changzhou-energy-monitor:latest
```

**注意**：这需要修改 `app.py` 支持环境变量读取。

---

## 📊 部署流程总览

```
┌─────────────────────────────────────────────────────────┐
│                     公网环境（构建）                      │
├─────────────────────────────────────────────────────────┤
│  1. 准备项目代码（Git clone或SCP上传）                   │
│  2. 配置数据库连接（app.py）                            │
│  3. 构建Docker镜像                                       │
│     docker build -t changzhou-energy-monitor:latest .   │
│  4. 导出镜像文件                                         │
│     docker save changzhou-energy-monitor | gzip > xxx.tar.gz │
└─────────────────────────────────────────────────────────┘
                          ↓ 传输（SCP/U盘/内网共享）
┌─────────────────────────────────────────────────────────┐
│                     内网环境（部署）                      │
├─────────────────────────────────────────────────────────┤
│  1. 传输镜像文件到内网                                   │
│  2. 导入镜像                                            │
│     gunzip xxx.tar.gz && docker load -i xxx.tar        │
│  3. 修改内网数据库配置（如有必要）                       │
│  4. 启动容器                                            │
│     docker run -d -p 80:80 -p 5000:5000 --name xxx     │
│  5. 验证部署                                            │
│     curl http://127.0.0.1:5000/api/health               │
└─────────────────────────────────────────────────────────┘
```

---

## 📞 技术支持

遇到问题时，请按以下格式提供信息：

```bash
# 1. 系统信息
cat /etc/os-release
docker --version

# 2. 容器状态
docker ps -a | grep energy

# 3. 容器日志（最近50行）
docker logs --tail 50 energy-monitor

# 4. 网络状态
netstat -tlnp | grep -E ':(80|5000)'

# 5. 端口测试
curl -v http://127.0.0.1:5000/api/health
```

---

**文档版本**：v4.0
**最后更新**：2026-03-27
**适用版本**：项目全部版本
