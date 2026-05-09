# 常州能耗云运营驾驶舱

## 📋 项目概述

本项目为常州能耗云运营驾驶舱系统，包含前端静态页面和后端 Flask API 服务，支持内网无公网环境部署。

## 🚀 快速启动

### 本地开发环境

```bash
# 启动前端服务
python serve_frontend.py

# 启动后端服务
python app.py
```

访问地址：
- 前端页面：http://localhost:65080/
- 后端 API：http://localhost:5000/api/health

### Docker 部署

```bash
# 构建镜像
docker build -t changzhou-energy-monitor:latest .

# 启动容器
docker-compose up -d
```

## 📁 项目结构

```
project_dianfeiv2/
├── css/
│   └── style.css          # 样式文件
├── js/
│   ├── app.js             # 应用主逻辑
│   ├── charts.js          # 图表模块
│   ├── data.js            # 数据处理模块
│   ├── map.js             # 地图模块
│   ├── nav-config.js      # 导航配置
│   └── libs/              # CDN 资源库
│       ├── echarts.min.js # ECharts 图表库
│       └── xlsx.full.min.js # Excel 处理库
├── data/
│   └── 常州区县网格地图.json  # 常州地理数据
├── app.py                 # Flask 后端
├── requirements.txt       # Python 依赖
├── Dockerfile             # Docker 构建文件
├── docker-compose.yml     # Docker Compose 配置
├── nginx.conf             # Nginx 配置
├── entrypoint.sh          # 容器启动脚本
└── README.md              # 项目说明文档
```

## 🔧 配置说明

### 数据库配置

修改 `app.py` 中的数据库连接信息：

```python
db_config = {
    'host': '10.38.78.217',
    'port': 3220,
    'user': 'liujiantao',
    'password': 'Liujt!@#',
    'database': 'energy_management_2026',
    'charset': 'utf8mb4'
}
```

### 端口配置

修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "65080:80"  # 前端页面端口
  - "5000:5000"  # 后端 API 端口
```

## 📦 Docker 部署流程

### 公网环境构建

```bash
# 克隆项目
git clone https://github.com/liujiantao007/changzhou-energy-monitor.git
cd changzhou-energy-monitor

# 构建镜像
docker build -t changzhou-energy-monitor:latest .

# 导出镜像
docker save -o changzhou-energy-monitor.tar changzhou-energy-monitor:latest
gzip changzhou-energy-monitor.tar
```

### 内网环境部署

```bash
# 导入镜像
gunzip changzhou-energy-monitor.tar.gz
docker load -i changzhou-energy-monitor.tar

# 启动容器
docker-compose up -d

# 验证服务
curl http://localhost:65080/api/health
```

## 🔌 API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/data` | GET | 获取所有能耗数据 |
| `/api/summary_data` | GET | 获取汇总数据 |
| `/api/summary` | GET | 获取汇总统计 |
| `/api/latest_valid_date` | GET | 获取最新有效日期 |
| `/api/health` | GET | 健康检查 |

## ⚠️ 常见问题

### 问题 1：页面空白
检查 CDN 资源文件是否存在：
```bash
ls -lh js/libs/
```

### 问题 2：数据库连接失败
检查数据库配置和网络连接：
```bash
docker exec energy-monitor ping -c 3 数据库IP
```

### 问题 3：端口被占用
```bash
netstat -tlnp | grep -E ':(80|5000|65080)'
```

## 📊 运维命令

```bash
# 查看容器状态
docker ps

# 查看日志
docker logs -f energy-monitor-prod

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

## 📝 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
./start.sh
```

---

**文档版本**：v1.0  
**最后更新**：2026-05-09  
**适用项目**：常州能耗云运营驾驶舱