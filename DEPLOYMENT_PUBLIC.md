# 常州能耗云驾驶舱 - 公网Linux主机部署文档

## 📋 项目概述

本项目为常州能耗云运营驾驶舱系统，包含前端静态页面和后端Flask API服务。

**重要提示**：
- 本项目CDN资源已下载到 `js/libs/` 目录，无需再次下载！
- 数据库配置在 `app.py` 的 `DB_CONFIG` 中修改
- 支持Python 3.8+和Nginx反向代理

---

## 🔧 环境要求

### 系统要求
- Linux (Ubuntu 20.04+ / CentOS 7+ / Debian 10+)
- Python 3.8 或更高版本
- Nginx 1.18+ 或 Apache2
- 网络可访问目标数据库

### 硬件配置（最低）
- CPU: 1核
- 内存: 1GB
- 磁盘: 5GB

---

## 🚀 第一步：环境准备

### 1.1 更新系统（Ubuntu/Debian）

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 安装Python和pip

```bash
sudo apt install -y python3 python3-pip python3-venv
```

### 1.3 安装Nginx

```bash
sudo apt install -y nginx
```

### 1.4 创建应用目录

```bash
sudo mkdir -p /var/www/energy-monitor
sudo chown -R $USER:$USER /var/www/energy-monitor
```

---

## 📦 第二步：部署应用到主机

### 2.1 上传代码到服务器

你可以选择以下任一方式：

**方式1：Git拉取（推荐）**
```bash
cd /var/www/energy-monitor
git clone https://github.com/liujiantao007/changzhou-energy-monitor.git .
```

**方式2：SCP上传**
```bash
scp -r local/path/to/project/* user@your-server:/var/www/energy-monitor/
```

### 2.2 创建虚拟环境

```bash
cd /var/www/energy-monitor
python3 -m venv venv
source venv/bin/activate
```

### 2.3 安装Python依赖

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

`requirements.txt` 内容应包含：
```
flask>=2.0.0
flask-cors>=3.0.0
pymysql>=1.0.0
cryptography>=3.0.0
```

### 2.4 验证依赖安装

```bash
pip list | grep -E "flask|pymysql"
```

---

## ⚙️ 第三步：配置数据库连接

### 3.1 编辑app.py配置

```bash
vim /var/www/energy-monitor/app.py
```

找到 `DB_CONFIG` 部分，修改为你的数据库信息：

```python
DB_CONFIG = {
    'host': '你的数据库IP',      # 例如：10.38.78.217
    'port': 3220,                   # 数据库端口
    'user': 'liujiantao',           # 数据库用户名
    'password': 'Liujt!@#',         # 数据库密码
    'database': 'energy_management_2026',  # 数据库名
    'charset': 'utf8mb4'
}
```

### 3.2 测试数据库连接

```bash
python3 -c "
import pymysql
conn = pymysql.connect(
    host='你的数据库IP',
    port=3220,
    user='liujiantao',
    password='Liujt!@#',
    database='energy_management_2026'
)
print('Database connected successfully!')
conn.close()
"
```

---

## 🌐 第四步：配置Nginx反向代理

### 4.1 创建Nginx配置文件

```bash
sudo vim /etc/nginx/sites-available/energy-monitor
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或IP

    # 前端静态文件
    root /var/www/energy-monitor;
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

    # Flask API反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
}
```

### 4.2 启用站点配置

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/energy-monitor /etc/nginx/sites-enabled/

# 测试配置语法
sudo nginx -t

# 重载Nginx
sudo systemctl reload nginx
```

### 4.3 配置防火墙（如果需要）

```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 🔒 第五步：配置SSL证书（可选但推荐）

### 5.1 安装Certbot

```bash
# Ubuntu/Debian
sudo apt install -y certbot python3-certbot-nginx

# CentOS
sudo yum install -y certbot python3-certbot-nginx
```

### 5.2 获取SSL证书

```bash
sudo certbot --nginx -d your-domain.com
```

### 5.3 自动续期测试

```bash
sudo certbot renew --dry-run
```

---

## 📝 第六步：配置Systemd服务（开机自启）

### 6.1 创建服务文件

```bash
sudo vim /etc/systemd/system/energy-monitor.service
```

添加以下内容：

```ini
[Unit]
Description=常州能耗云驾驶舱 Flask Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/energy-monitor
Environment="PATH=/var/www/energy-monitor/venv/bin"
ExecStart=/var/www/energy-monitor/venv/bin/python /var/www/energy-monitor/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 6.2 设置目录权限

```bash
sudo chown -R www-data:www-data /var/www/energy-monitor
sudo chmod -R 755 /var/www/energy-monitor
```

### 6.3 启动服务

```bash
# 重新加载systemd配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start energy-monitor

# 设置开机自启
sudo systemctl enable energy-monitor

# 查看服务状态
sudo systemctl status energy-monitor
```

---

## ✅ 第七步：验证部署

### 7.1 测试API

```bash
# 测试健康检查端点
curl http://127.0.0.1:5000/api/health

# 预期输出：
# {"status":"healthy","database":"connected"}
```

### 7.2 测试Web访问

```bash
# 测试前端页面
curl http://127.0.0.1/

# 测试API通过Nginx
curl http://127.0.0.1/api/health
```

### 7.3 查看日志

```bash
# Flask应用日志
sudo journalctl -u energy-monitor -f

# Nginx访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx错误日志
sudo tail -f /var/log/nginx/error.log
```

---

## 🔧 常用运维命令

### 服务管理

```bash
# 启动服务
sudo systemctl start energy-monitor

# 停止服务
sudo systemctl stop energy-monitor

# 重启服务
sudo systemctl restart energy-monitor

# 查看状态
sudo systemctl status energy-monitor

# 查看日志
sudo journalctl -u energy-monitor -f
```

### Nginx管理

```bash
# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx

# 重启Nginx
sudo systemctl restart nginx
```

### 代码更新

```bash
cd /var/www/energy-monitor

# 停止服务
sudo systemctl stop energy-monitor

# 拉取更新
git pull

# 重启服务
sudo systemctl start energy-monitor
```

---

## 🐛 常见问题排查

### 问题1：API返回500错误

**排查步骤**：
```bash
# 1. 检查Flask服务状态
sudo systemctl status energy-monitor

# 2. 查看Flask日志
sudo journalctl -u energy-monitor -n 50

# 3. 测试数据库连接
python3 -c "import pymysql; pymysql.connect(host='IP', port=3220, user='liujiantao', password='Liujt!@#', database='energy_management_2026')"

# 4. 检查Nginx错误日志
sudo tail -20 /var/log/nginx/error.log
```

### 问题2：页面显示空白

**排查步骤**：
```bash
# 1. 检查Nginx配置
sudo nginx -t

# 2. 检查静态文件权限
ls -la /var/www/energy-monitor/js/libs/

# 3. 检查浏览器控制台错误
# 按F12打开开发者工具，查看Console和Network标签
```

### 问题3：502 Bad Gateway

**排查步骤**：
```bash
# 1. 检查Flask服务是否运行
sudo systemctl status energy-monitor

# 2. 检查Flask是否监听5000端口
netstat -tlnp | grep 5000

# 3. 检查Nginx配置中的proxy_pass
sudo tail -20 /var/log/nginx/error.log
```

### 问题4：端口被占用

```bash
# 查看端口占用
sudo netstat -tlnp | grep :5000

# 如果5000端口被占用，修改app.py中的端口
# app.py中修改：app.run(host='0.0.0.0', port=5001, debug=True)
# 同时修改Nginx配置中的端口
```

---

## 📁 项目文件结构

```
/var/www/energy-monitor/
├── app.py                      # Flask后端API
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
│   └── libs/                # CDN本地资源
│       ├── echarts.min.js
│       └── xlsx.full.min.js
├── nginx.conf                # Nginx配置
├── Dockerfile                # Docker构建文件（备用）
└── DEPLOYMENT_PUBLIC.md      # 本文档
```

---

## 🌐 访问地址

部署完成后，通过以下地址访问：

| 服务 | 地址 |
|------|------|
| **前端页面** | `http://你的服务器IP/` 或 `https://你的域名/` |
| **后端API** | `http://你的服务器IP/api/health` |

---

## 📞 技术支持

如有问题，请提供以下信息：
1. 操作系统和版本
2. `sudo systemctl status energy-monitor` 的输出
3. `sudo journalctl -u energy-monitor -n 50` 的日志
4. 浏览器控制台（F12）的错误信息

---

**文档版本**：v3.0
**最后更新**：2026-03-27
