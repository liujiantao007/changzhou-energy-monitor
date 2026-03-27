# 常州能耗云驾驶舱 - Docker容器化部署文档

## 📋 项目概述

本项目为常州能耗云运营驾驶舱系统，包含前端静态页面（Nginx）和后端Flask API服务，支持内网无公网环境部署。

---

## 🔧 配置文件说明

| 文件 | 说明 |
|-----|------|
| `requirements.txt` | Python依赖包 |
| `Dockerfile` | Docker镜像构建文件 |
| `nginx.conf` | Nginx配置（静态文件+API反向代理） |
| `entrypoint.sh` | 容器启动脚本 |
| `.dockerignore` | Docker构建忽略文件 |
| `download_cdn.py` | CDN资源下载脚本 |

---

## 🚀 第一步：公网环境准备（有互联网连接的Ubuntu）

### 1.1 下载CDN资源到本地

由于内网环境无法访问公网CDN，需要在有公网的Ubuntu上先下载资源：

```bash
# 创建libs目录
mkdir -p js/libs

# 下载 echarts.min.js
curl -o js/libs/echarts.min.js https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js

# 下载 xlsx.full.min.js
curl -o js/libs/xlsx.full.min.js https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js

# 验证文件
ls -lh js/libs/
```

或者使用Python脚本下载：
```bash
python3 download_cdn.py
```

### 1.2 验证文件

检查文件是否下载成功：
```bash
# 检查文件大小
ls -lh js/libs/

# 预期输出：
# - echarts.min.js (约 1MB+)
# - xlsx.full.min.js (约 800KB+)
```

---

## 🔨 第二步：构建Docker镜像（公网Ubuntu）

### 2.1 构建镜像

```bash
# 在项目根目录执行
docker build -t changzhou-energy-monitor:latest .
```

### 2.2 查看镜像

```bash
docker images | grep changzhou-energy-monitor
```

### 2.3 导出镜像文件

```bash
# 导出为tar文件（约300MB-500MB）
docker save -o changzhou-energy-monitor.tar changzhou-energy-monitor:latest

# 压缩镜像（可选，减小文件体积）
gzip changzhou-energy-monitor.tar
# 生成 changzhou-energy-monitor.tar.gz
```

---

## 📦 第三步：传输镜像到内网Ubuntu

### 3.1 传输方式

根据网络环境选择：

| 方式 | 命令 |
|-----|------|
| **SCP/SFTP** | `scp changzhou-energy-monitor.tar.gz user@内网IP:/path/to/destination/` |
| **U盘/移动硬盘** | 直接复制文件 |
| **内网共享** | 通过内网文件共享传输 |

### 3.2 传输示例（SCP）

```bash
# 从公网Ubuntu传输到内网Ubuntu
scp changzhou-energy-monitor.tar.gz \
    internal-user@192.168.1.100:/home/internal-user/
```

---

## 🏁 第四步：内网Ubuntu部署（无互联网连接）

### 4.1 导入Docker镜像

```bash
# 进入文件目录
cd /home/internal-user/

# 解压（如果压缩了）
gunzip changzhou-energy-monitor.tar.gz

# 导入镜像
docker load -i changzhou-energy-monitor.tar

# 验证镜像
docker images | grep changzhou-energy-monitor
```

### 4.2 配置数据库连接

根据实际环境修改 `app.py` 中的数据库配置：

```python
# 编辑 app.py，修改 DB_CONFIG
DB_CONFIG = {
    'host': '内网数据库IP',      # 例如：192.168.1.50
    'port': 3220,                   # 根据实际端口修改
    'user': 'liujiantao',
    'password': 'Liujt!@#',
    'database': 'energy_management_2026',
    'charset': 'utf8mb4'
}
```

**注意**：修改配置后需要重新构建镜像！

### 4.3 启动容器

```bash
# 启动容器（前台运行）
docker run -it --name energy-monitor \
    -p 80:80 \
    -p 5000:5000 \
    changzhou-energy-monitor:latest

# 或者后台运行（推荐）
docker run -d --name energy-monitor \
    -p 80:80 \
    -p 5000:5000 \
    --restart=always \
    changzhou-energy-monitor:latest
```

### 4.4 验证服务

```bash
# 查看容器状态
docker ps

# 查看容器日志
docker logs -f energy-monitor

# 测试API（在内网Ubuntu上执行）
curl http://127.0.0.1:5000/api/health

# 预期输出：
# {"status":"healthy","database":"connected"}
```

---

## 🌐 第五步：访问系统

### 5.1 浏览器访问

在内网环境的任意机器浏览器中打开：

| 服务 | 访问地址 |
|-----|---------|
| **前端页面** | `http://内网UbuntuIP` |
| **后端API** | `http://内网UbuntuIP/api` |

### 5.2 端口说明

| 端口 | 用途 |
|-----|------|
| **80** | Nginx静态文件服务 |
| **5000** | Flask后端API |

---

## 🔧 常用运维命令

### 容器管理

```bash
# 停止容器
docker stop energy-monitor

# 启动容器
docker start energy-monitor

# 重启容器
docker restart energy-monitor

# 删除容器
docker rm energy-monitor

# 删除镜像
docker rmi changzhou-energy-monitor:latest
```

### 日志查看

```bash
# 实时日志
docker logs -f energy-monitor

# 最近100行日志
docker logs --tail 100 energy-monitor
```

### 进入容器

```bash
# 进入容器Shell
docker exec -it energy-monitor /bin/bash

# 进入容器后查看文件
ls -la /app
```

---

## ⚠️ 常见问题排查

### 问题1：CDN资源未加载

**症状**：页面空白或图表无法显示

**解决方案**：
```bash
# 检查文件是否存在
docker exec energy-monitor ls -la /app/js/libs/

# 如果文件不存在，需要在公网重新下载并构建镜像
```

### 问题2：数据库连接失败

**症状**：API返回500错误

**解决方案**：
1. 检查 `app.py` 中的数据库配置
2. 确认数据库在内网可访问
3. 测试数据库连接：
```bash
# 从容器内测试（需要安装mysql客户端）
docker exec -it energy-monitor /bin/bash
apt-get update && apt-get install -y mysql-client
mysql -h 数据库IP -P 3220 -u liujiantao -p
```

### 问题3：端口被占用

**症状**：启动容器时报 "address already in use"

**解决方案**：
```bash
# 查看端口占用
netstat -tlnp | grep -E ':(80|5000)'

# 或者修改映射端口
docker run -d --name energy-monitor \
    -p 8080:80 \
    -p 5001:5000 \
    changzhou-energy-monitor:latest
```

---

## 📝 更新部署流程

当项目代码更新后：

1. **在公网Ubuntu**：
   ```bash
   # 更新代码
   git pull  # 或手动复制文件
   
   # 重新构建镜像
   docker build -t changzhou-energy-monitor:v2.0 .
   
   # 导出新镜像
   docker save -o changzhou-energy-monitor-v2.0.tar changzhou-energy-monitor:v2.0
   ```

2. **传输到内网**，然后：
   ```bash
   # 停止旧容器
   docker stop energy-monitor
   docker rm energy-monitor
   
   # 导入新镜像
   docker load -i changzhou-energy-monitor-v2.0.tar
   
   # 启动新容器
   docker run -d --name energy-monitor \
       -p 80:80 -p 5000:5000 \
       changzhou-energy-monitor:v2.0
   ```

---

## 📊 项目文件结构

```
project_dianfeiv2/
├── app.py                      # Flask后端
├── requirements.txt            # Python依赖
├── index.html                 # 前端首页
├── css/
│   └── style.css             # 样式文件
├── js/
│   ├── app.js                # 主逻辑
│   ├── charts.js             # 图表
│   ├── data.js               # 数据
│   ├── map.js                # 地图
│   ├── nav-config.js         # 导航配置
│   └── libs/                # CDN本地资源（需下载）
│       ├── echarts.min.js
│       └── xlsx.full.min.js
├── Dockerfile                # Docker构建文件
├── nginx.conf                # Nginx配置
├── entrypoint.sh             # 启动脚本
├── .dockerignore             # Docker忽略文件
├── download_cdn.py           # CDN下载脚本
└── DEPLOYMENT.md             # 本文档
```

---

## 📞 技术支持

如有问题，请检查：
1. Docker容器日志：`docker logs -f energy-monitor`
2. 浏览器控制台（F12）的错误信息
3. 数据库连接是否正常

---

**文档版本**：v1.0  
**最后更新**：2026-03-27
