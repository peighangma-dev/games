# 江湖聊天室 - 生产环境手动部署说明

## 生产环境信息

| 项目 | 值 |
|------|-----|
| **前端目录** | `/www/jhchat` |
| **后端目录** | `/www/jhchat/backend` |
| **数据库容器** | `jhchat-db` |
| **MySQL 用户名** | `root` |
| **MySQL 密码** | `LmPNsiGKRKLCkH48` |
| **数据库名** | `jhchat` |

---

## 部署前准备

### 1.  SSH 登录服务器

```bash
ssh root@45.192.101.76
```

### 2.  检查环境要求

```bash
# 检查 Node.js 版本（需要 18+）
node -v

# 检查 Docker 和 Docker Compose
docker -v
docker-compose -v

# 检查 Nginx
nginx -v

# 检查 MySQL 容器是否运行
docker ps --filter "name=jhchat-db"
```

### 3.  创建部署目录

```bash
mkdir -p /www/jhchat/backend
mkdir -p /www/backup/jhchat
```

---

## 第一步：获取源代码

```bash
# 进入 www 目录
cd /www

# 克隆代码仓库
git clone -b 260413-feat-jhchat-refactor --depth 1 https://github.com/peighangma-dev/games.git

# 进入项目目录
cd /www/games/jhchat
```

---

## 第二步：构建前端

```bash
# 进入前端目录
cd /www/games/jhchat/frontend

# 安装依赖
npm install

# 构建生产版本
npm run build

# 复制构建产物到部署目录
cp -r dist/* /www/jhchat/

# 验证复制结果
ls -la /www/jhchat/
```

---

## 第三步：部署后端

```bash
# 进入后端目录
cd /www/games/jhchat/backend

# 安装生产环境依赖
npm install --production

# 复制后端代码到部署目录
cp -r src /www/jhchat/backend/
cp -r migrations /www/jhchat/backend/
cp package.json /www/jhchat/backend/
cp .env.production.example /www/jhchat/backend/.env

# 编辑环境变量配置
vim /www/jhchat/backend/.env
```

### 环境变量配置示例

```env
# /www/jhchat/backend/.env

# 服务器配置
PORT=3001
NODE_ENV=production

# 数据库配置
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=jhchat
DB_USER=root
DB_PASSWORD=LmPNsiGKRKLCkH48

# JWT 配置
JWT_SECRET=your-production-secret-key-change-this

# 文件上传配置
UPLOAD_DIR=/www/jhchat/uploads
MAX_FILE_SIZE=10485760

# 日志配置
LOG_LEVEL=info
LOG_DIR=/www/jhchat/backend/logs
```

---

## 第四步：导入数据库

```bash
# 1. 创建数据库
docker exec jhchat-db mysql -u root -pLmPNsiGKRKLCkH48 -e "CREATE DATABASE IF NOT EXISTS jhchat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. 导入数据库结构和数据
docker exec -i jhchat-db mysql -u root -pLmPNsiGKRKLCkH48 jhchat < /www/games/jhchat/数据库.sql

# 3. 验证数据库导入
docker exec jhchat-db mysql -u root -pLmPNsiGKRKLCkH48 jhchat -e "SHOW TABLES;"

# 4. 查看数据库大小
docker exec jhchat-db mysql -u root -pLmPNsiGKRKLCkH48 jhchat -e "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = 'jhchat';"
```

---

## 第五步：配置 Nginx

### 创建 Nginx 配置文件

```bash
cat > /etc/nginx/conf.d/jhchat.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    root /www/jhchat;
    index index.html;
    
    # 前端静态文件
    location / {
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Socket.IO 代理
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Socket.IO 需要更长的超时
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 120s;
        
        # 缓冲设置
        proxy_buffering off;
        proxy_cache off;
    }
    
    # 文件上传目录
    location /uploads/ {
        alias /www/jhchat/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }
    
    # 访问日志
    access_log /var/log/nginx/jhchat_access.log;
    error_log /var/log/nginx/jhchat_error.log;
}
EOF
```

### 测试并启用配置

```bash
# 测试 Nginx 配置
nginx -t

# 重新加载 Nginx
nginx -s reload

# 或者重启 Nginx
systemctl restart nginx
```

---

## 第六步：启动后端服务

### 方法一：使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 进入后端目录
cd /www/jhchat/backend

# 启动应用
pm2 start src/server.js --name jhchat-backend

# 设置开机自启动
pm2 startup
pm2 save

# 查看状态
pm2 status

# 查看日志
pm2 logs jhchat-backend
```

### 方法二：使用 systemd 服务

```bash
cat > /etc/systemd/system/jhchat-backend.service << 'EOF'
[Unit]
Description=JHChat Backend Service
Documentation=https://github.com/peighangma-dev/games
After=network.target docker.service

[Service]
Type=simple
User=root
WorkingDirectory=/www/jhchat/backend
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=jhchat-backend
Environment=NODE_ENV=production
Environment=PORT=3001

# 安全设置
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

# 重新加载 systemd 配置
systemctl daemon-reload

# 启动服务
systemctl start jhchat-backend

# 设置开机自启
systemctl enable jhchat-backend

# 查看状态
systemctl status jhchat-backend

# 查看日志
journalctl -u jhchat-backend -f
```

### 方法三：使用 nohup（简单方式）

```bash
# 创建日志目录
mkdir -p /www/jhchat/backend/logs

# 启动后端
cd /www/jhchat/backend
nohup node src/server.js > /www/jhchat/backend/logs/app.log 2>&1 &

# 查看进程
ps aux | grep "node.*server.js"

# 查看日志
tail -f /www/jhchat/backend/logs/app.log
```

---

## 第七步：验证部署

### 1. 检查服务状态

```bash
# 检查后端进程
ps aux | grep "node.*server.js"
# 或 PM2
pm2 list
# 或 systemd
systemctl status jhchat-backend

# 检查 Nginx 状态
systemctl status nginx

# 检查 MySQL 容器
docker ps --filter "name=jhchat-db"
```

### 2. 测试 API 连接

```bash
# 测试 ping 接口
curl http://localhost:3001/api/ping

# 预期输出：{"success": true, "message": "pong"}

# 测试登录接口
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 测试获取用户列表
curl http://localhost:3001/api/users
```

### 3. 测试 Web 访问

```bash
# 测试前端
curl http://localhost/

# 检查返回的 HTML
curl -I http://localhost/
```

### 4. 从外部访问

在浏览器中访问：

```
http://45.192.101.76
```

---

## 常用维护命令

### 查看日志

```bash
# 后端日志（PM2）
pm2 logs jhchat-backend

# 后端日志（systemd）
journalctl -u jhchat-backend -f

# 后端日志（nohup）
tail -f /www/jhchat/backend/logs/app.log

# Nginx 访问日志
tail -f /var/log/nginx/jhchat_access.log

# Nginx 错误日志
tail -f /var/log/nginx/jhchat_error.log

# Docker 容器日志
docker logs jhchat-db
```

### 重启服务

```bash
# 重启后端（PM2）
pm2 restart jhchat-backend

# 重启后端（systemd）
systemctl restart jhchat-backend

# 重启后端（nohup）
pkill -f "node.*server.js"
cd /www/jhchat/backend
nohup node src/server.js > /www/jhchat/backend/logs/app.log 2>&1 &

# 重启 Nginx
systemctl restart nginx

# 重启 MySQL 容器
docker restart jhchat-db
```

### 停止服务

```bash
# 停止后端（PM2）
pm2 stop jhchat-backend

# 停止后端（systemd）
systemctl stop jhchat-backend

# 停止 Nginx
systemctl stop nginx
```

### 更新代码

```bash
# 进入代码目录
cd /www/games/jhchat

# 拉取最新代码
git pull origin 260413-feat-jhchat-refactor

# 重新构建前端
cd frontend
npm install
npm run build
cp -r dist/* /www/jhchat/

# 更新后端依赖
cd ../backend
npm install --production

# 重启后端
pm2 restart jhchat-backend
```

### 备份数据库

```bash
# 备份整个数据库
docker exec jhchat-db mysqldump -u root -pLmPNsiGKRKLCkH48 \
  --single-transaction \
  --routines \
  --triggers \
  jhchat > /www/backup/jhchat/db_$(date +%Y%m%d_%H%M%S).sql

# 压缩备份
docker exec jhchat-db mysqldump -u root -pLmPNsiGKRKLCkH48 jhchat | \
  gzip > /www/backup/jhchat/db_$(date +%Y%m%d_%H%M%S).sql.gz

# 查看备份文件
ls -lh /www/backup/jhchat/
```

### 恢复数据库

```bash
# 从 SQL 文件恢复
docker exec -i jhchat-db mysql -u root -pLmPNsiGKRKLCkH48 jhchat < /www/backup/jhchat/db_YYYYMMDD.sql

# 从压缩文件恢复
gunzip < /www/backup/jhchat/db_YYYYMMDD.sql.gz | \
  docker exec -i jhchat-db mysql -u root -pLmPNsiGKRKLCkH48 jhchat
```

### 清理备份（保留最近 30 天）

```bash
find /www/backup/jhchat/ -name "*.sql" -mtime +30 -delete
find /www/backup/jhchat/ -name "*.sql.gz" -mtime +30 -delete
```

---

## 常见问题排查

### 后端无法启动

```bash
# 检查 Node.js 版本
node -v  # 需要 18+

# 检查端口占用
netstat -tlnp | grep 3001
lsof -i :3001

# 手动启动测试
cd /www/jhchat/backend
node src/server.js

# 查看详细错误日志
tail -f /www/jhchat/backend/logs/app.log
# 或
pm2 logs jhchat-backend --lines 100

# 检查数据库连接
docker exec jhchat-db mysql -u root -pLmPNsiGKRKLCkH48 -e "SHOW DATABASES;"
```

### 页面空白或 404

```bash
# 检查 Web 目录内容
ls -la /www/jhchat/

# 检查 index.html 是否存在
cat /www/jhchat/index.html

# 检查 Nginx 配置
nginx -t

# 查看 Nginx 错误日志
tail -f /var/log/nginx/jhchat_error.log

# 清除浏览器缓存后重试
```

### API 返回 502 Bad Gateway

```bash
# 检查后端是否运行
pm2 status
# 或
systemctl status jhchat-backend
# 或
ps aux | grep "node.*server.js"

# 检查后端监听端口
netstat -tlnp | grep 3001

# 测试直接访问后端 API
curl http://localhost:3001/api/ping

# 检查 Nginx 配置
cat /etc/nginx/conf.d/jhchat.conf

# 查看后端日志
pm2 logs jhchat-backend
# 或
journalctl -u jhchat-backend -n 100
```

### 数据库连接失败

```bash
# 检查 MySQL 容器状态
docker ps --filter "name=jhchat-db"

# 测试数据库连接
docker exec -it jhchat-db mysql -u root -pLmPNsiGKRKLCkH48

# 查看后端数据库配置
cat /www/jhchat/backend/.env

# 检查数据库是否存在
docker exec jhchat-db mysql -u root -pLmPNsiGKRKLCkH48 -e "SHOW DATABASES;"

# 查看数据库用户权限
docker exec jhchat-db mysql -u root -pLmPNsiGKRKLCkH48 -e "SELECT user, host FROM mysql.user;"
```

### Socket.IO 连接失败

```bash
# 检查 Nginx WebSocket 配置
cat /etc/nginx/conf.d/jhchat.conf | grep -A 15 "location /socket.io"

# 验证配置包含以下内容：
# proxy_set_header Upgrade $http_upgrade;
# proxy_set_header Connection "upgrade";
# proxy_buffering off;

# 重新加载 Nginx
nginx -t && nginx -s reload

# 查看浏览器控制台错误信息
```

### 文件上传失败

```bash
# 检查上传目录权限
ls -la /www/jhchat/uploads/
chmod -R 755 /www/jhchat/uploads/

# 检查 Nginx 上传大小限制
cat /etc/nginx/nginx.conf | grep client_max_body_size

# 检查后端文件大小限制
cat /www/jhchat/backend/.env | grep MAX_FILE_SIZE
```

---

## 性能优化

### 1.  Nginx Gzip 压缩

在 `http` 块中添加：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied any;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
gzip_comp_level 6;
```

### 2.  Nginx 缓存优化

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

### 3.  Node.js 性能优化

```bash
# 使用 cluster 模式启动（如果应用支持）
# 在 src/server.js 中添加 cluster 模块

# 增加文件描述符限制
ulimit -n 65535
```

### 4.  MySQL 优化

```sql
-- 查看慢查询
docker exec jhchat-db mysql -u root -pLmPNsiGKRKLCkH48 -e "SHOW VARIABLES LIKE 'slow_query_log%';"

-- 优化表
docker exec jhchat-db mysql -u root -pLmPNsiGKRKLCkH48 jhchat -e "OPTIMIZE TABLE users, messages, rooms;"

-- 添加索引（根据实际需求）
docker exec jhchat-db mysql -u root -pLmPNsiGKRKLCkH48 jhchat -e "SHOW INDEX FROM messages;"
```

### 5.  系统资源监控

```bash
# 查看 CPU 和内存使用
top
htop

# 查看磁盘使用
df -h
du -sh /www/jhchat/*

# 查看网络连接
netstat -an | grep :3001

# Docker 资源使用
docker stats jhchat-db
```

---

## 安全加固

### 1.  防火墙配置

```bash
# 配置 UFW 防火墙
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS（如果启用 SSL）
ufw allow 22/tcp    # SSH

# 限制数据库端口只允许本地访问
ufw deny 3306/tcp

# 启用防火墙
ufw enable
```

### 2.  配置 SSL/HTTPS（推荐）

```bash
# 安装 Certbot
apt update
apt install certbot python3-certbot-nginx -y

# 获取 SSL 证书
certbot --nginx -d your-domain.com

# 自动续期
certbot renew --dry-run
```

### 3.  保护敏感文件

```bash
# 设置 .env 文件权限
chmod 600 /www/jhchat/backend/.env

# 防止访问敏感文件
cat >> /etc/nginx/conf.d/jhchat.conf << 'EOF'

# 禁止访问敏感文件
location ~ /\.(env|git|htaccess) {
    deny all;
    return 404;
}
EOF

nginx -t && nginx -s reload
```

### 4.  定期更新系统

```bash
# 定期更新系统包
apt update && apt upgrade -y

# 更新 Node.js 依赖
cd /www/games/jhchat/backend
npm audit fix

cd ../frontend
npm audit fix
```

---

## 监控和告警

### 1.  PM2 监控

```bash
# 启用 PM2 Plus（监控服务）
pm2 plus

# 查看应用监控
pm2 monit
```

### 2.  创建健康检查脚本

```bash
cat > /www/jhchat/health-check.sh << 'EOF'
#!/bin/bash

# 检查后端
if curl -s http://localhost:3001/api/ping | grep -q '"success":true'; then
    echo "[OK] Backend is running"
else
    echo "[FAIL] Backend is down"
    pm2 restart jhchat-backend
fi

# 检查 Nginx
if systemctl is-active --quiet nginx; then
    echo "[OK] Nginx is running"
else
    echo "[FAIL] Nginx is down"
    systemctl restart nginx
fi

# 检查 MySQL 容器
if docker ps --filter "name=jhchat-db" | grep -q jhchat-db; then
    echo "[OK] MySQL is running"
else
    echo "[FAIL] MySQL is down"
    docker start jhchat-db
fi
EOF

chmod +x /www/jhchat/health-check.sh
```

### 3.  定时任务

```bash
# 添加健康检查到 crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /www/jhchat/health-check.sh >> /www/jhchat/logs/health.log 2>&1") | crontab -

# 添加数据库备份到 crontab
(crontab -l 2>/dev/null; echo "0 2 * * * docker exec jhchat-db mysqldump -u root -pLmPNsiGKRKLCkH48 jhchat | gzip > /www/backup/jhchat/db_$(date +\\%Y\\%m\\%d).sql.gz") | crontab -

# 添加备份清理任务
(crontab -l 2>/dev/null; echo "0 3 * * * find /www/backup/jhchat/ -name '*.sql.gz' -mtime +30 -delete") | crontab -
```

---

## 部署检查清单

在部署完成后，请确认以下项目：

- [ ] 前端文件已正确复制到 `/www/jhchat/`
- [ ] 后端依赖已安装（`node_modules`）
- [ ] `.env` 配置文件已更新
- [ ] 数据库已创建并导入数据
- [ ] Nginx 配置已测试并启用
- [ ] 后端服务已启动（PM2/systemd/nohup）
- [ ] API 测试返回正常（`/api/ping`）
- [ ] 前端页面可以正常访问
- [ ] Socket.IO 连接正常
- [ ] 日志文件可正常写入
- [ ] 备份脚本已配置
- [ ] 健康检查已配置

---

## 快速参考

### 目录结构

```
/
├── www/
│   ├── jhchat/                  # Web 部署目录
│   │   ├── index.html
│   │   ├── assets/
│   │   ├── uploads/
│   │   ├── backend/
│   │   │   ├── src/
│   │   │   ├── node_modules/
│   │   │   └── .env
│   │   ├── logs/
│   │   └── health-check.sh
│   ├── games/jhchat/           # 源代码目录
│   └── backup/jhchat/          # 备份目录
├── etc/nginx/conf.d/jhchat.conf
└── etc/systemd/system/jhchat-backend.service
```

### 重要文件

| 文件 | 说明 |
|------|------|
| `/www/jhchat/backend/.env` | 后端环境变量 |
| `/etc/nginx/conf.d/jhchat.conf` | Nginx 配置 |
| `/www/jhchat/health-check.sh` | 健康检查脚本 |
| `/www/backup/jhchat/` | 数据库备份 |

### 端口说明

| 端口 | 服务 |
|------|------|
| 80 | Nginx HTTP |
| 3001 | 后端 Node.js API |
| 3306 | MySQL（容器内部） |
| 22 | SSH |

---

## 附录：完整部署脚本

```bash
#!/bin/bash
# 完整部署脚本 - deploy-production.sh

set -e

echo "==== 江湖聊天室 - 生产环境部署 ===="

# 1. 创建目录
echo "[1/10] 创建部署目录..."
mkdir -p /www/jhchat/backend
mkdir -p /www/jhchat/uploads
mkdir -p /www/jhchat/logs
mkdir -p /www/backup/jhchat

# 2. 克隆代码
echo "[2/10] 克隆代码..."
cd /www
if [ ! -d "games" ]; then
  git clone -b 260413-feat-jhchat-refactor --depth 1 https://github.com/peighangma-dev/games.git
else
  cd games && git pull origin 260413-feat-jhchat-refactor
fi

# 3. 构建前端
echo "[3/10] 构建前端..."
cd /www/games/jhchat/frontend
npm install
npm run build
cp -r dist/* /www/jhchat/

# 4. 部署后端
echo "[4/10] 部署后端..."
cd /www/games/jhchat/backend
npm install --production
cp -r src /www/jhchat/backend/
cp -r migrations /www/jhchat/backend/
cp package.json /www/jhchat/backend/

# 5. 配置环境变量
echo "[5/10] 配置环境变量..."
cat > /www/jhchat/backend/.env << 'ENVEOF'
PORT=3001
NODE_ENV=production
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=jhchat
DB_USER=root
DB_PASSWORD=LmPNsiGKRKLCkH48
JWT_SECRET=your-production-secret-key-change-this
UPLOAD_DIR=/www/jhchat/uploads
LOG_DIR=/www/jhchat/backend/logs
ENVEOF

# 6. 导入数据库
echo "[6/10] 导入数据库..."
docker exec jhchat-db mysql -u root -pLmPNsiGKRKLCkH48 -e "CREATE DATABASE IF NOT EXISTS jhchat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
docker exec -i jhchat-db mysql -u root -pLmPNsiGKRKLCkH48 jhchat < /www/games/jhchat/数据库.sql

# 7. 配置 Nginx
echo "[7/10] 配置 Nginx..."
cat > /etc/nginx/conf.d/jhchat.conf << 'NGINXEOF'
server {
    listen 80;
    server_name _;
    root /www/jhchat;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_buffering off;
    }
}
NGINXEOF
nginx -t
nginx -s reload

# 8. 启动后端
echo "[8/10] 启动后端..."
pm2 delete jhchat-backend 2>/dev/null || true
pm2 start /www/jhchat/backend/src/server.js --name jhchat-backend
pm2 save

# 9. 验证
echo "[9/10] 验证部署..."
sleep 3
curl http://localhost:3001/api/ping
curl http://localhost/

# 10. 完成
echo "[10/10] 部署完成！"
echo ""
echo "访问地址：http://45.192.101.76"
echo "后端日志：pm2 logs jhchat-backend"
echo "Nginx 日志：tail -f /var/log/nginx/jhchat_access.log"
```

使用方式：

```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

---

文档版本：1.0
最后更新：2026-04-23
