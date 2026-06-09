# Ubuntu 22 离线 Docker 镜像部署指南

本文档用于指导你在一台**可以连接互联网的 Ubuntu 22 服务器**上构建、测试 Docker 镜像，然后把镜像传输到另一台**不能连接互联网、只能内网登录的 Ubuntu 22 云主机**上运行。

本项目推荐使用仓库根目录的单镜像部署方式：

- `Dockerfile`
- `docker-compose.yml`
- `nginx.conf`
- `entrypoint.sh`

> 简单理解：
> - 在线服务器：负责下载依赖、构建镜像、测试镜像、导出镜像包。
> - 离线云主机：只负责接收镜像包、导入镜像、启动容器。

---

## 1. 服务器角色说明

### 1.1 在线构建服务器

这台服务器需要能访问互联网，用来：

1. 拉取项目代码。
2. 下载 Python / Ubuntu / 前端依赖。
3. 构建 Docker 镜像。
4. 先在本机测试镜像是否能启动。
5. 把镜像导出成 `.tar.gz` 文件。

### 1.2 离线云主机

这台云主机不能访问互联网，只能通过内网登录，用来：

1. 接收在线服务器打好的镜像包。
2. 执行 `docker load` 导入镜像。
3. 执行 `docker compose up -d` 启动服务。

> 离线云主机上不要执行 `docker build`，因为它无法联网下载依赖。

### 1.3 可选：跳板机或个人电脑

如果在线服务器不能直接 SSH 到离线云主机，可以用跳板机或个人电脑中转文件。

---

## 2. 前置条件检查

### 2.1 在线构建服务器需要具备

```bash
git --version
docker --version
docker compose version
```

如果这些命令不存在，需要先安装 Git、Docker Engine、Docker Compose 插件。

### 2.2 离线云主机需要具备

```bash
docker --version
docker compose version
```

如果离线云主机还没有 Docker，需要先通过内网软件源或 Docker 离线安装包安装 Docker。

> 注意：Docker 镜像包不能替代 Docker Engine。离线主机必须先安装好 Docker，才能导入和运行镜像。

### 2.3 网络和端口要求

离线云主机需要满足：

1. 能访问数据库：

```text
10.38.78.217:3220
```

2. 允许内网访问前端端口：

```text
65080
```

3. 有足够磁盘空间存放：
   - 压缩镜像包：`changzhou-energy-monitor_latest.tar.gz`
   - 导入后的 Docker 镜像

---

## 3. 在线服务器：获取代码

进入你准备放项目的目录，例如：

```bash
mkdir -p ~/deploy
cd ~/deploy
```

拉取代码：

```bash
git clone <你的仓库地址> changzhou-energy-monitor
cd changzhou-energy-monitor
```

如果代码已经存在，则进入目录后更新：

```bash
cd ~/deploy/changzhou-energy-monitor
git pull
```

---

## 4. 在线服务器：确认前端本地库文件

项目在内网环境中不能依赖 CDN，所以需要确认以下文件已经存在：

```text
js/libs/echarts.min.js
js/libs/xlsx.full.min.js
```

检查：

```bash
ls -lh js/libs/echarts.min.js js/libs/xlsx.full.min.js
```

如果文件不存在，在在线服务器上下载：

```bash
mkdir -p js/libs
curl -L -o js/libs/echarts.min.js https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js
curl -L -o js/libs/xlsx.full.min.js https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js
```

再次确认：

```bash
ls -lh js/libs/echarts.min.js js/libs/xlsx.full.min.js
```

---

## 5. 在线服务器：构建 Docker 镜像

在项目根目录执行：

```bash
docker build -t changzhou-energy-monitor:latest .
```

查看镜像：

```bash
docker images | grep changzhou-energy-monitor
```

应该能看到类似：

```text
changzhou-energy-monitor   latest   xxxxxxxxxxxx   ...
```

---

## 6. 在线服务器：先测试镜像

启动：

```bash
docker compose up -d
```

查看容器状态：

```bash
docker ps
```

查看日志：

```bash
docker compose logs -f
```

另开一个终端，检查后端健康接口：

```bash
curl http://localhost:5000/api/health
```

检查前端是否能访问：

```bash
curl -I http://localhost:65080/
```

如果在线服务器的防火墙允许，也可以在浏览器访问：

```text
http://在线服务器IP:65080/
```

测试完成后停止容器：

```bash
docker compose down
```

---

## 7. 在线服务器：导出镜像包

导出并压缩镜像：

```bash
docker save changzhou-energy-monitor:latest | gzip > changzhou-energy-monitor_latest.tar.gz
```

生成校验文件：

```bash
sha256sum changzhou-energy-monitor_latest.tar.gz > changzhou-energy-monitor_latest.tar.gz.sha256
```

确认文件：

```bash
ls -lh changzhou-energy-monitor_latest.tar.gz changzhou-energy-monitor_latest.tar.gz.sha256
```

建议一起准备以下文件，用于传到离线云主机：

```text
changzhou-energy-monitor_latest.tar.gz
changzhou-energy-monitor_latest.tar.gz.sha256
docker-compose.yml
nginx.conf
```

---

## 8. 把文件传到离线云主机

下面几种方式任选一种，取决于你的网络环境。

### 8.1 在线服务器可以直接 SSH 到离线云主机

在在线服务器执行（注意端口用 `-P` 大写）：

```bash
scp -P 2202 changzhou-energy-monitor_latest.tar.gz \
    changzhou-energy-monitor_latest.tar.gz.sha256 \
    docker-compose.yml \
    nginx.conf \
    root@10.38.78.228:/home/user/docker-images
```

登录离线云主机（注意端口用 `-p` 小写）：

```bash
ssh -p 2202 root@10.38.78.228
```

创建部署目录并移动文件（如果目录尚不存在）：

```bash
mkdir -p /home/dean/docker-images
cd /home/dean/docker-images
ls -lh
```

### 8.2 需要跳板机

如果需要跳板机，可以使用 `scp -J`：

```bash
scp -o Port=2202 -J 跳板机用户@跳板机IP \
    changzhou-energy-monitor_latest.tar.gz \
    changzhou-energy-monitor_latest.tar.gz.sha256 \
    docker-compose.yml \
    nginx.conf \
    root@10.38.78.228:/home/dean/docker-images/
```

然后登录离线云主机：

```bash
ssh -p 2202 root@10.38.78.228
cd /home/dean/docker-images
ls -lh
```

### 8.3 通过个人电脑中转

如果你的个人电脑既能访问在线服务器，又能访问离线云主机：

1. 先从在线服务器下载到个人电脑。
2. 再从个人电脑上传到离线云主机。

示例：

```bash
scp 在线服务器用户@在线服务器IP:/项目路径/changzhou-energy-monitor_latest.tar.gz .
scp 在线服务器用户@在线服务器IP:/项目路径/changzhou-energy-monitor_latest.tar.gz.sha256 .
scp 在线服务器用户@在线服务器IP:/项目路径/docker-compose.yml .
scp 在线服务器用户@在线服务器IP:/项目路径/nginx.conf .

scp -P 2202 changzhou-energy-monitor_latest.tar.gz \
    changzhou-energy-monitor_latest.tar.gz.sha256 \
    docker-compose.yml \
    nginx.conf \
    root@10.38.78.228:/home/dean/docker-images/
```

---

## 9. 离线云主机：校验镜像包

登录离线云主机后：

```bash
cd /home/dean/docker-images
sha256sum -c changzhou-energy-monitor_latest.tar.gz.sha256
```

如果正常，会显示类似：

```text
changzhou-energy-monitor_latest.tar.gz: OK
```

如果校验失败，说明传输过程中可能损坏，需要重新传输。

---

## 10. 离线云主机：导入 Docker 镜像

执行：

```bash
gunzip -c changzhou-energy-monitor_latest.tar.gz | docker load
```

查看镜像：

```bash
docker images | grep changzhou-energy-monitor
```

应该能看到：

```text
changzhou-energy-monitor   latest   xxxxxxxxxxxx   ...
```

---

## 11. 离线云主机：启动服务

在 `/home/dean/docker-images` 目录执行：

```bash
docker compose up -d
```

查看容器：

```bash
docker ps
```

查看日志：

```bash
docker compose logs -f
```

健康检查：

```bash
curl http://localhost:5000/api/health
```

前端检查：

```bash
curl -I http://localhost:65080/
```

在能访问这台内网云主机的电脑浏览器中打开：

```text
http://离线云主机IP:65080/
```

---

## 12. 后续更新版本

以后如果项目代码更新，重复以下流程。

### 12.1 在线服务器重新构建并导出

```bash
cd ~/deploy/changzhou-energy-monitor
git pull

docker build -t changzhou-energy-monitor:latest .
docker compose up -d
curl http://localhost:5000/api/health
curl -I http://localhost:65080/
docker compose down

docker save changzhou-energy-monitor:latest | gzip > changzhou-energy-monitor_latest.tar.gz
sha256sum changzhou-energy-monitor_latest.tar.gz > changzhou-energy-monitor_latest.tar.gz.sha256
```

### 12.2 传输到离线云主机

把新生成的文件传到离线云主机：

```text
changzhou-energy-monitor_latest.tar.gz
changzhou-energy-monitor_latest.tar.gz.sha256
docker-compose.yml
nginx.conf
```

### 12.3 离线云主机更新

```bash
cd /home/dean/docker-images

docker compose down
sha256sum -c changzhou-energy-monitor_latest.tar.gz.sha256
gunzip -c changzhou-energy-monitor_latest.tar.gz | docker load
docker compose up -d

docker ps
curl http://localhost:5000/api/health
curl -I http://localhost:65080/
```

---

## 13. 常见问题排查

### 13.1 `docker: command not found`

说明当前服务器没有安装 Docker。

在线服务器可以联网安装 Docker。

离线云主机需要提前准备 Docker 离线安装包，或通过内网软件源安装。

---

### 13.2 `docker compose: command not found`

说明 Docker Compose 插件不存在。

检查：

```bash
docker compose version
```

如果没有，需要安装 Docker Compose 插件。

---

### 13.3 离线云主机上不要执行 `docker build`

离线云主机不能访问互联网，执行 `docker build` 通常会失败，因为它需要下载 Ubuntu 包、Python 包等依赖。

正确做法是：

```bash
gunzip -c changzhou-energy-monitor_latest.tar.gz | docker load
docker compose up -d
```

---

### 13.4 `65080` 访问不了

检查容器是否运行：

```bash
docker ps
```

检查日志：

```bash
docker compose logs -f
```

检查本机端口：

```bash
curl -I http://localhost:65080/
```

如果本机能访问，但其他机器不能访问，需要检查：

1. 云主机安全组。
2. 系统防火墙。
3. 内网路由策略。

---

### 13.5 `/api/health` 失败

检查后端日志：

```bash
docker compose logs -f
```

检查数据库连通性：

```bash
nc -vz 10.38.78.217 3220
```

如果没有 `nc` 命令，可以先进入容器检查，或让运维确认离线云主机到数据库的网络策略。

---

### 13.6 页面打开但图表不显示

检查前端库文件是否在镜像中：

```bash
docker exec -it energy-monitor-prod ls -lh /app/js/libs/
```

应包含：

```text
echarts.min.js
xlsx.full.min.js
```

如果没有，需要回到在线服务器下载这两个文件后重新构建镜像。

---

### 13.7 数据加载失败或报表为空

可能原因：

1. 离线云主机不能访问数据库。
2. `docker-compose.yml` 中数据库配置不正确。
3. 数据库账号密码变更。
4. 数据表或接口异常。

查看日志：

```bash
docker compose logs -f
```

---

## 14. 当前项目的关键端口

| 服务 | 地址 |
|---|---|
| 前端页面 | `http://主机IP:65080/` |
| Nginx 本机检查 | `http://localhost:65080/` |
| Flask 后端健康检查 | `http://localhost:5000/api/health` |
| 数据库 | `10.38.78.217:3220` |

---

## 15. 安全提醒

当前 `docker-compose.yml` 中包含数据库连接信息。请注意：

1. 不要把包含真实密码的文件发到无关人员或公开渠道。
2. 传输文件时尽量使用 SSH / SCP。
3. 如果后续需要更规范的部署，可以把数据库账号密码迁移到 `.env` 文件或云主机环境变量中。
