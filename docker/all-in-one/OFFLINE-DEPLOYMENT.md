# 离线部署指南 - Windows 11 到 Ubuntu 22.04

## 概述

本文档描述如何将 Energy Monitor 应用程序在 Windows 11 上打包为 Docker 镜像，然后传输到内网 Ubuntu 22.04 服务器进行部署。

## 部署流程图

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│    Windows 11       │     │      传输介质       │     │    Ubuntu 22.04     │
│                     │     │   (U盘/网络共享)    │     │      (内网)         │
│  1. 构建 Docker镜像  │ ──► │                     │ ──► │  4. 导入 Docker镜像  │
│  2. 导出镜像文件     │     │   3. 拷贝文件       │     │  5. 配置环境变量     │
│  3. 生成校验文件     │     │                     │     │  6. 启动容器        │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

## 第一部分：Windows 11 环境准备

### 1.1 安装 Docker Desktop

1. 下载 Docker Desktop for Windows
   - 访问：https://www.docker.com/products/docker-desktop
   - 下载 Windows 版本

2. 安装 Docker Desktop
   ```powershell
   # 运行安装程序
   # 启用 WSL 2 后端（推荐）
   # 重启计算机
   ```

3. 验证安装
   ```powershell
   docker --version
   docker compose version
   ```

### 1.2 准备项目文件

确保项目目录结构完整：
```
project_dianfeiv2/
├── app.py
├── requirements.txt
├── index.html
├── css/
├── js/
├── data/
└── docker/all-in-one/
    ├── Dockerfile
    ├── nginx.conf
    ├── default.conf
    ├── supervisord.conf
    ├── entrypoint.sh
    ├── .env.example
    └── build-export.bat
```

## 第二部分：构建和导出镜像

### 2.1 配置环境变量

1. 进入项目目录
   ```powershell
   cd C:\Users\Dean\Documents\Code\project_dianfeiv2\docker\all-in-one
   ```

2. 创建环境配置文件
   ```powershell
   copy .env.example .env
   notepad .env
   ```

3. 编辑 `.env` 文件，配置数据库连接：
   ```ini
   DB_HOST=10.38.78.217
   DB_PORT=3220
   DB_USER=liujiantao
   DB_PASSWORD=Liujt!@#
   DB_NAME=energy_management_2026
   TZ=Asia/Shanghai
   ```

### 2.2 执行构建脚本

1. 运行构建脚本
   ```powershell
   .\build-export.bat
   ```

2. 脚本执行过程：
   - 检查 Docker 环境
   - 构建 Docker 镜像
   - 导出镜像为 tar.gz 文件
   - 计算 MD5 校验值

3. 输出文件：
   - `energy-monitor-0.1.5.tar.gz` - Docker 镜像文件

### 2.3 验证导出文件

```powershell
# 检查文件大小
dir energy-monitor-0.1.5.tar.gz

# 计算 MD5 校验值
certutil -hashfile energy-monitor-0.1.5.tar.gz MD5
```

## 第三部分：文件传输

### 3.1 准备传输文件

需要传输到 Ubuntu 服务器的文件：
- `energy-monitor-0.1.5.tar.gz` - Docker 镜像文件
- `deploy-ubuntu.sh` - 部署脚本
- `.env` - 环境配置文件（可选，可在服务器上创建）

### 3.2 传输方式

#### 方式一：U盘传输
```powershell
# 复制文件到U盘
copy energy-monitor-0.1.5.tar.gz E:\
copy deploy-ubuntu.sh E:\
copy .env E:\
```

#### 方式二：网络共享
```powershell
# 使用 SMB 共享
# 或使用 SCP（如果已安装 OpenSSH）
scp energy-monitor-0.1.5.tar.gz user@ubuntu-server:/home/user/
scp deploy-ubuntu.sh user@ubuntu-server:/home/user/
```

#### 方式三：内网文件服务器
```powershell
# 上传到内网文件服务器
# 然后在 Ubuntu 上下载
```

## 第四部分：Ubuntu 22.04 部署

### 4.1 准备 Ubuntu 环境

1. 登录 Ubuntu 服务器
   ```bash
   ssh user@ubuntu-server
   ```

2. 创建部署目录
   ```bash
   mkdir -p ~/energy-monitor
   cd ~/energy-monitor
   ```

3. 复制文件到部署目录
   ```bash
   # 如果使用U盘
   cp /media/usb/energy-monitor-0.1.5.tar.gz .
   cp /media/usb/deploy-ubuntu.sh .
   cp /media/usb/.env .
   ```

### 4.2 执行部署脚本

1. 添加执行权限
   ```bash
   chmod +x deploy-ubuntu.sh
   ```

2. 执行部署脚本
   ```bash
   sudo ./deploy-ubuntu.sh
   ```

3. 脚本执行过程：
   - 检查并安装 Docker（如未安装）
   - 导入 Docker 镜像
   - 配置并启动容器
   - 验证服务状态

### 4.3 手动部署（可选）

如果需要手动部署：

1. 安装 Docker
   ```bash
   # 更新包索引
   sudo apt-get update
   
   # 安装依赖
   sudo apt-get install -y ca-certificates curl gnupg lsb-release
   
   # 添加 Docker 官方 GPG 密钥
   sudo mkdir -p /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   
   # 添加 Docker 仓库
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   
   # 安装 Docker
   sudo apt-get update
   sudo apt-get install -y docker-ce docker-ce-cli containerd.io
   
   # 启动 Docker
   sudo systemctl enable docker
   sudo systemctl start docker
   ```

2. 导入镜像
   ```bash
   sudo docker load < energy-monitor-0.1.5.tar.gz
   ```

3. 创建环境配置
   ```bash
   cat > .env << EOF
   DB_HOST=10.38.78.217
   DB_PORT=3220
   DB_USER=liujiantao
   DB_PASSWORD=Liujt!@#
   DB_NAME=energy_management_2026
   TZ=Asia/Shanghai
   EOF
   ```

4. 启动容器
   ```bash
   sudo docker run -d \
       --name energy-monitor \
       --restart unless-stopped \
       -p 80:80 \
       --env-file .env \
       --memory="1g" \
       --cpus="2.0" \
       energy-monitor:0.1.5
   ```

## 第五部分：验证部署

### 5.1 检查容器状态

```bash
# 查看容器状态
sudo docker ps

# 查看容器日志
sudo docker logs energy-monitor

# 查看容器详细信息
sudo docker inspect energy-monitor
```

### 5.2 测试服务

```bash
# 测试前端
curl http://localhost/

# 测试 API
curl http://localhost/api/data

# 测试健康检查
curl http://localhost/api/health
```

### 5.3 浏览器访问

在浏览器中访问：
- `http://<ubuntu-server-ip>/` - 前端页面
- `http://<ubuntu-server-ip>/api/health` - 健康检查

## 第六部分：运维管理

### 6.1 常用命令

```bash
# 查看日志
sudo docker logs -f energy-monitor

# 进入容器
sudo docker exec -it energy-monitor /bin/bash

# 重启容器
sudo docker restart energy-monitor

# 停止容器
sudo docker stop energy-monitor

# 启动容器
sudo docker start energy-monitor

# 删除容器
sudo docker rm -f energy-monitor
```

### 6.2 更新部署

1. 停止并删除旧容器
   ```bash
   sudo docker stop energy-monitor
   sudo docker rm energy-monitor
   ```

2. 删除旧镜像
   ```bash
   sudo docker rmi energy-monitor:0.1.5
   ```

3. 导入新镜像并部署
   ```bash
   sudo docker load < energy-monitor-0.1.5.tar.gz
   sudo ./deploy-ubuntu.sh
   ```

### 6.3 备份和恢复

```bash
# 备份容器配置
sudo docker inspect energy-monitor > container-config.json

# 导出容器数据（如有数据卷）
sudo docker export energy-monitor > container-backup.tar
```

## 故障排除

### 问题1：Docker 服务未启动

```bash
# 检查 Docker 服务状态
sudo systemctl status docker

# 启动 Docker 服务
sudo systemctl start docker

# 设置开机自启
sudo systemctl enable docker
```

### 问题2：端口被占用

```bash
# 检查端口占用
sudo netstat -tulpn | grep :80

# 停止占用端口的服务
sudo systemctl stop nginx  # 如果有其他 Nginx
sudo systemctl stop apache2  # 如果有 Apache
```

### 问题3：容器无法启动

```bash
# 查看容器日志
sudo docker logs energy-monitor

# 检查容器状态
sudo docker ps -a

# 检查镜像是否存在
sudo docker images
```

### 问题4：数据库连接失败

```bash
# 检查网络连通性
ping 10.38.78.217

# 检查端口
telnet 10.38.78.217 3220

# 检查环境变量
sudo docker exec energy-monitor env | grep DB
```

## 文件清单

| 文件名 | 大小（约） | 说明 |
|--------|-----------|------|
| energy-monitor-0.1.5.tar.gz | ~200MB | Docker 镜像文件 |
| deploy-ubuntu.sh | ~5KB | 部署脚本 |
| .env | ~0.2KB | 环境配置文件 |

## 版本信息

- **应用版本**: 0.1.5
- **Docker 镜像**: energy-monitor:0.1.5
- **更新日期**: 2026-03-23
