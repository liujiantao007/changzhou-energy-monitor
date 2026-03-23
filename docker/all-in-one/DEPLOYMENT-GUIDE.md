# 完整部署指南 - 联网构建到内网部署

## 概述

本文档描述完整的部署流程：在有互联网连接的 Linux 主机上构建 Docker 镜像，然后传输到物理隔离的内网 Ubuntu 22.04 服务器进行部署。

## 部署架构

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              完整部署流程                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────────┐         ┌───────────────────┐         ┌────────────────┐│
│  │   联网 Linux 主机   │         │     传输介质       │         │ 内网 Ubuntu 22 ││
│  │                   │         │                   │         │                ││
│  │ 1. 克隆项目代码    │         │                   │         │                ││
│  │ 2. 构建 Docker镜像 │ ──────► │ 4. 拷贝镜像文件    │ ──────► │ 5. 导入镜像    ││
│  │ 3. 导出镜像文件    │         │                   │         │ 6. 部署运行    ││
│  │                   │         │                   │         │                ││
│  └───────────────────┘         └───────────────────┘         └────────────────┘│
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 第一阶段：联网 Linux 主机操作

### 1.1 环境要求

- **操作系统**: Ubuntu 20.04/22.04 或其他 Linux 发行版
- **权限**: root 或 sudo 权限
- **网络**: 可访问互联网
- **磁盘空间**: 至少 5GB 可用空间

### 1.2 安装 Docker（如未安装）

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
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl enable docker
sudo systemctl start docker

# 验证安装
docker --version
```

### 1.3 获取项目代码

#### 方式一：从 Git 克隆

```bash
# 克隆项目
git clone https://github.com/liujiantao007/changzhou-energy-monitor.git
cd changzhou-energy-monitor
```

#### 方式二：上传项目文件

如果项目代码已在本地，使用以下方式上传到联网 Linux 主机：

```bash
# 在本地 Windows 打包项目
# 排除 node_modules、.git 等目录
tar -czvf project_dianfeiv2.tar.gz --exclude='.git' --exclude='node_modules' --exclude='__pycache__' project_dianfeiv2

# 使用 SCP 上传到 Linux 主机
scp project_dianfeiv2.tar.gz user@linux-host:/home/user/

# 在 Linux 主机解压
ssh user@linux-host
cd /home/user
tar -xzvf project_dianfeiv2.tar.gz
cd project_dianfeiv2
```

### 1.4 配置环境变量

```bash
# 进入 Docker 配置目录
cd docker/all-in-one

# 创建环境配置文件
cp .env.example .env

# 编辑配置文件
nano .env
```

配置内容：
```ini
# Database Configuration
DB_HOST=10.38.78.217
DB_PORT=3220
DB_USER=liujiantao
DB_PASSWORD=Liujt!@#
DB_NAME=energy_management_2026

# Timezone
TZ=Asia/Shanghai
```

### 1.5 构建并导出镜像

```bash
# 添加执行权限
chmod +x build-export-linux.sh

# 执行构建脚本
sudo ./build-export-linux.sh
```

构建过程：
1. 检查 Docker 环境
2. 验证项目文件
3. 构建 Docker 镜像
4. 导出镜像为 tar.gz 文件
5. 计算校验值

### 1.6 验证导出文件

```bash
# 检查文件大小
ls -lh energy-monitor-0.1.5.tar.gz

# 验证 MD5
md5sum energy-monitor-0.1.5.tar.gz

# 验证 SHA256
sha256sum energy-monitor-0.1.5.tar.gz
```

---

## 第二阶段：文件传输

### 2.1 准备传输文件

需要传输到内网 Ubuntu 服务器的文件：

| 文件名 | 大小（约） | 说明 |
|--------|-----------|------|
| `energy-monitor-0.1.5.tar.gz` | ~200MB | Docker 镜像文件 |
| `deploy-ubuntu.sh` | ~5KB | 部署脚本 |
| `.env` | ~0.2KB | 环境配置文件 |

### 2.2 传输方式

#### 方式一：USB 存储设备

```bash
# 挂载 USB 设备
sudo mkdir -p /mnt/usb
sudo mount /dev/sdb1 /mnt/usb

# 复制文件
cp energy-monitor-0.1.5.tar.gz /mnt/usb/
cp deploy-ubuntu.sh /mnt/usb/
cp .env /mnt/usb/

# 卸载设备
sudo umount /mnt/usb
```

#### 方式二：SCP 传输（如有网络通道）

```bash
# 传输文件
scp energy-monitor-0.1.5.tar.gz user@offline-server:/home/user/
scp deploy-ubuntu.sh user@offline-server:/home/user/
scp .env user@offline-server:/home/user/
```

---

## 第三阶段：内网 Ubuntu 22.04 部署

### 3.1 准备部署目录

```bash
# 登录内网服务器
ssh user@offline-server

# 创建部署目录
mkdir -p ~/energy-monitor
cd ~/energy-monitor

# 复制文件（如果使用 USB）
cp /media/usb/energy-monitor-0.1.5.tar.gz .
cp /media/usb/deploy-ubuntu.sh .
cp /media/usb/.env .
```

### 3.2 验证文件完整性

```bash
# 验证文件大小
ls -lh energy-monitor-0.1.5.tar.gz

# 验证 MD5（与联网主机对比）
md5sum energy-monitor-0.1.5.tar.gz
```

### 3.3 执行部署

```bash
# 添加执行权限
chmod +x deploy-ubuntu.sh

# 执行部署脚本
sudo ./deploy-ubuntu.sh
```

部署脚本执行流程：
1. 检查/安装 Docker
2. 导入 Docker 镜像
3. 配置环境变量
4. 启动容器
5. 健康检查

### 3.4 验证部署

```bash
# 检查容器状态
sudo docker ps

# 检查服务健康
curl http://localhost/api/health

# 查看日志
sudo docker logs energy-monitor
```

### 3.5 浏览器访问

在浏览器中访问：
- **前端页面**: `http://<服务器IP>/`
- **API 接口**: `http://<服务器IP>/api/data`
- **健康检查**: `http://<服务器IP>/api/health`

---

## 第四阶段：运维管理

### 4.1 常用命令

```bash
# 查看容器状态
sudo docker ps

# 查看容器日志
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

### 4.2 更新部署

```bash
# 1. 停止并删除旧容器
sudo docker stop energy-monitor
sudo docker rm energy-monitor

# 2. 删除旧镜像
sudo docker rmi energy-monitor:0.1.5

# 3. 导入新镜像
sudo docker load < energy-monitor-0.1.5.tar.gz

# 4. 重新部署
sudo ./deploy-ubuntu.sh
```

### 4.3 日志管理

```bash
# 查看实时日志
sudo docker logs -f --tail 100 energy-monitor

# 导出日志
sudo docker logs energy-monitor > app.log 2>&1

# 查看容器内日志文件
sudo docker exec energy-monitor ls -la /var/log/
sudo docker exec energy-monitor cat /var/log/nginx/app-access.log
sudo docker exec energy-monitor cat /var/log/gunicorn/error.log
```

---

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

### 问题2：镜像导入失败

```bash
# 检查文件完整性
md5sum energy-monitor-0.1.5.tar.gz

# 检查磁盘空间
df -h

# 手动导入
sudo docker load < energy-monitor-0.1.5.tar.gz
```

### 问题3：容器无法启动

```bash
# 查看容器日志
sudo docker logs energy-monitor

# 检查端口占用
sudo netstat -tulpn | grep :80

# 检查镜像
sudo docker images
```

### 问题4：数据库连接失败

```bash
# 检查网络连通性
ping 10.38.78.217

# 检查端口
nc -zv 10.38.78.217 3220

# 检查环境变量
sudo docker exec energy-monitor env | grep DB
```

### 问题5：服务健康检查失败

```bash
# 检查容器内服务
sudo docker exec energy-monitor curl http://localhost/api/health

# 检查 Supervisor 状态
sudo docker exec energy-monitor supervisorctl status

# 重启容器内服务
sudo docker exec energy-monitor supervisorctl restart all
```

---

## 安全建议

1. **网络安全**
   - 配置防火墙规则限制访问
   - 使用 HTTPS 加密通信
   - 定期更新系统和 Docker

2. **访问控制**
   - 限制 SSH 访问
   - 使用非 root 用户运行容器
   - 配置适当的文件权限

3. **数据安全**
   - 定期备份数据库
   - 保护敏感配置信息
   - 审计日志记录

---

## 版本信息

- **应用版本**: 0.1.5
- **Docker 镜像**: energy-monitor:0.1.5
- **文档更新**: 2026-03-23
