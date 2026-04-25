# 江湖聊天室 - 生产环境部署说明

## 环境要求

### 已安装环境
- **数据库**: MySQL 5.7
- **Web 服务器**: Nginx 1.28.0
- **Node.js**: 18+ (需安装)
- **PM2**: 进程管理 (需安装)

### 软件架构

```
┌─────────────┐
│   Nginx     │ 端口 80/443
│  1.28.0     │
└──────┬──────┘
       │
       ├─ 静态文件 → /www/jhchat (Vue 前端)
       │
       └─ 反向代理 → http://localhost:3001 (Node.js 后端)
                    │
                    ├─ MySQL 5.7 (端口 3306)
                    │
                    └─ Redis (端口 6379)
```

---

## 第一步：安装必要软件

### 1.1 安装 Node.js 18+

```bash
# 使用 NodeSource 官方源
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 验证版本
node -v  # 应该显示 v18.x.x 或更高
npm -v
```

### 1.2 安装 PM2 进程管理器

```bash
npm install -g pm2

# 设置开机自启
pm2 startup
# 按提示执行生成的命令
pm2 save
```

### 1.3 安装 Redis（可选，用于缓存）

```bash
apt-get install -y redis-server
systemctl enable redis
systemctl start redis

# 验证
redis-cli ping  # 应返回 PONG
```

---

## 第二步：项目部署

### 2.1 创建部署目录

```bash
mkdir -p /www/jhchat /www/games/jhchat
mkdir -p /www/backup/jhchat
mkdir -p /www/jhchat/logs
```

### 2.2 克隆代码

```bash
cd /www
git clone https://github.com/your-repo/games.git
cd /www/games/jhchat

# 或指定分支
git clone -b main --depth 1 https://github.com/your-repo/games.git
```

### 2.3 配置文件

```bash
# 后端环境变量
cd /www/games/jhchat/backend
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001

# 数据库配置 (使用现有 MySQL 5.7)
DB_HOST=localhost
DB_PORT=3306
DB_USER=jhchat
DB_PASSWORD=your_secure_password
DB_NAME=jhchat

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT 配置 (生产环境务必修改)
JWT_SECRET=your-random-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# 日志配置
LOG_LEVEL=info
LOG_DIR=/www/jhchat/logs

# 前端地址
FRONTEND_URL=http://your-domain.com
EOF

# 设置权限
chmod 600 .env
```

---

## 第三步：数据库配置

### 3.1 创建数据库和用户

```bash
# 登录 MySQL
mysql -u root -p

# 执行 SQL 命令
```

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS jhchat 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 创建用户 (生产环境使用强密码)
CREATE USER 'jhchat'@'localhost' IDENTIFIED BY 'your_secure_password';

-- 授权
GRANT ALL PRIVILEGES ON jhchat.* TO 'jhchat'@'localhost';
FLUSH PRIVILEGES;

-- 验证
SHOW GRANTS FOR 'jhchat'@'localhost';
EXIT;
```

### 3.2 导入表结构和数据

```bash
# 导入数据库初始化脚本
mysql -u jhchat -p jhchat < /www/games/jhchat/database/init.sql

# 或根据实际文件调整
mysql -u jhchat -p jhchat < /www/games/jhchat/数据库.sql
```

### 3.3 验证数据库连接

```bash
# 测试连接
mysql -u jhchat -p -e "SELECT 1" jhchat
```

---

## 第四步：安装依赖

### 4.1 安装后端依赖

```bash
cd /www/games/jhchat/backend
npm install --production

# 检查依赖
npm list --depth=0
```

### 4.2 安装前端依赖并构建

```bash
cd /www/games/jhchat/frontend
npm install

# 构建生产版本
npm run build

# 复制构建产物到 Web 目录
cp -r dist/* /www/jhchat/
```

---

## 第五步：配置 Nginx

### 5.1 创建 Nginx 配置文件

```bash
cat > /etc/nginx/conf.d/jhchat.conf << 'EOF'
# 江湖聊天室 - Nginx 生产环境配置
# Nginx 版本：1.28.0

# HTTP 服务器
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # 安全设置
    server_tokens off;
    
    # 重定向到 HTTPS（如果有 SSL 证书）
    # return 301 https://$server_name$request_uri;
    
    # 根位置，直接返回错误页面或跳转到 HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 服务器
server {
    listen 443 ssl http2;
    http2_push_preload on;
    server_name your-domain.com www.your-domain.com;

    # SSL 证书配置 (Let's Encrypt 示例)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL 优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # 安全头部
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # 前端静态文件
    root /www/jhchat;
    index index.html;

    # 安全设置
    server_tokens off;

    # 静态文件处理
    location / {
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 反向代理配置
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 缓冲设置
        proxy_buffering off;
        proxy_cache off;
    }

    # Socket.IO WebSocket 代理
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # WebSocket 支持
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # 文件上传代理
    location /uploads/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # 文件上传大小限制
        client_max_body_size 20M;
    }

    # 静态资源缓存
    location /assets/ {
        alias /www/jhchat/assets/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri $uri/ =404;
    }

    # 日志配置
    access_log /var/log/nginx/jhchat_access.log combined;
    error_log /var/log/nginx/jhchat_error.log warn;

    # 性能优化
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    gzip_min_length 256;

    # 限制请求频率
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        # ... 其他配置
    }
}
EOF
```

### 5.2 测试 Nginx 配置

```bash
# 测试配置文件语法
nginx -t

# 如果测试通过，重载配置
nginx -s reload

# 检查 Nginx 状态
systemctl status nginx
```

### 5.3 创建日志目录并设置权限

```bash
touch /var/log/nginx/jhchat_access.log
touch /var/log/nginx/jhchat_error.log
chown www-data:www-data /var/log/nginx/jhchat_*.log
chmod 640 /var/log/nginx/jhchat_*.log
```

---

## 第六步：启动后端服务

### 6.1 使用 PM2 启动

```bash
cd /www/games/jhchat/backend

# 启动服务
pm2 start src/server.js --name jhchat-backend --instances 1 --interpreter node

# 或指定配置文件
pm2 start ecosystem.config.js --env production

# 查看状态
pm2 status

# 查看日志
pm2 logs jhchat-backend

# 保存 PM2 配置（开机自启）
pm2 save
```

### 6.2 可选：创建 PM2 配置文件

```bash
cd /www/games/jhchat/backend
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'jhchat-backend',
    script: 'src/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/www/jhchat/logs/pm2-error.log',
    out_file: '/www/jhchat/logs/pm2-out.log',
    log_file: '/www/jhchat/logs/pm2-combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
```

---

## 第七步：配置 SSL 证书（推荐）

### 7.1 使用 Let's Encrypt 免费证书

```bash
# 安装 Certbot
apt-get install -y certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期测试
certbot renew --dry-run
```

### 7.2 设置自动续期

```bash
# Certbot 会自动添加 systemd timer
# 手动添加 crontab 任务（可选）
cat > /etc/cron.daily/certbot-renew << 'EOF'
#!/bin/bash
certbot renew --quiet
systemctl reload nginx
EOF

chmod +x /etc/cron.daily/certbot-renew
```

---

## 第八步：防火墙配置

### 8.1 使用 UFW（Ubuntu/Debian）

```bash
# 安装 UFW（如果未安装）
apt-get install -y ufw

# 启用 SSH（避免被锁）
ufw allow ssh

# 启用 HTTP/HTTPS
ufw allow http
ufw allow https

# 启用防火墙
ufw enable

# 查看状态
ufw status
```

### 8.2 使用 firewalld（CentOS/RHEL）

```bash
# 启动 firewalld
systemctl enable firewalld
systemctl start firewalld

# 开放端口
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=3001/tcp

# 重载配置
firewall-cmd --reload

# 查看状态
firewall-cmd --list-all
```

---

## 第九步：验证部署

### 9.1 检查所有服务

```bash
# 检查 Nginx
systemctl status nginx
curl -I http://localhost

# 检查后端
pm2 status
curl http://localhost:3001/api/ping

# 检查数据库
mysql -u jhchat -p -e "SELECT 1" jhchat

# 检查 Redis
redis-cli ping
```

### 9.2 测试完整功能

```bash
# 测试首页
curl https://your-domain.com/

# 测试 API
curl https://your-domain.com/api/ping

# 测试登录接口
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# 测试 WebSocket（使用浏览器开发者工具）
```

### 9.3 检查日志

```bash
# Nginx 日志
tail -f /var/log/nginx/jhchat_error.log
tail -f /var/log/nginx/jhchat_access.log

# 后端日志
pm2 logs jhchat-backend

# 应用程序日志
tail -f /www/jhchat/logs/*.log
```

---

## 第十步：性能优化

### 10.1 MySQL 5.7 优化

编辑 `/etc/mysql/my.cnf` 或 `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
# 基础配置
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# 性能优化（根据服务器配置调整）
innodb_buffer_pool_size = 1G  # 物理内存的 50-70%
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# 连接数
max_connections = 200
thread_cache_size = 50

# 查询缓存（MySQL 5.7）
query_cache_type = 1
query_cache_size = 64M
query_cache_limit = 2M

# 日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/mysql-slow.log
long_query_time = 2

# 临时表
tmp_table_size = 64M
max_heap_table_size = 64M
```

重启 MySQL:
```bash
systemctl restart mysql
```

### 10.2 Nginx 1.28.0 优化

在全局配置中添加：

```nginx
# /etc/nginx/nginx.conf 的 http 块中

# 工作进程和连接数
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    use epoll;
    worker_connections 4096;
    multi_accept on;
}

http {
    # 基础优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # 连接优化
    keepalive_requests 100;
    reset_timedout_connection on;

    # 请求体缓冲
    client_body_buffer_size 10K;
    client_header_buffer_size 1k;
    client_max_body_size 20M;
    large_client_header_buffers 2 1k;

    # 打开文件缓存
    open_file_cache max=10000 inactive=30s;
    open_file_cache_valid 60s;
    open_file_cache_min_uses 2;

    # 代理缓冲
    proxy_buffer_size 4k;
    proxy_buffers 4 32k;
    proxy_busy_buffers_size 64k;
}
```

### 10.3 Node.js 优化

```bash
# 设置 Node.js 内存限制（默认 1.4GB）
export NODE_OPTIONS="--max-old-space-size=1024"

# 或在 PM2 配置中设置
pm2 start src/server.js --name jhchat-backend --max-memory-restart 1G
```

---

## 第十一步：监控和日志

### 11.1 创建监控脚本

```bash
cat > /usr/local/bin/jhchat-monitor.sh << 'EOF'
#!/bin/bash
# 江湖聊天室 - 健康检查脚本

LOG_FILE="/www/jhchat/logs/health.log"
BACKEND_URL="http://localhost:3001/api/ping"
FRONTEND_URL="http://localhost/"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
}

# 检查后端
check_backend() {
    if curl -f -s $BACKEND_URL > /dev/null; then
        log "[OK] 后端服务正常"
        return 0
    else
        log "[ERROR] 后端服务异常"
        return 1
    fi
}

# 检查 Nginx
check_nginx() {
    if curl -f -s $FRONTEND_URL > /dev/null; then
        log "[OK] Nginx 服务正常"
        return 0
    else
        log "[ERROR] Nginx 服务异常"
        return 1
    fi
}

# 检查 MySQL
check_mysql() {
    if mysqladmin -u jhchat -p'your_password' ping > /dev/null 2>&1; then
        log "[OK] MySQL 服务正常"
        return 0
    else
        log "[ERROR] MySQL 服务异常"
        return 1
    fi
}

# 检查 Redis
check_redis() {
    if [ "$(redis-cli ping)" = "PONG" ]; then
        log "[OK] Redis 服务正常"
        return 0
    else
        log "[ERROR] Redis 服务异常"
        return 1
    fi
}

# 执行检查
log "========== 开始健康检查 =========="
check_backend
check_nginx
check_mysql
check_redis
log "========== 健康检查完成 =========="
EOF

chmod +x /usr/local/bin/jhchat-monitor.sh
```

### 11.2 设置定时检查

```bash
# 每 5 分钟执行一次
crontab -e
*/5 * * * * /usr/local/bin/jhchat-monitor.sh
```

### 11.3 配置日志轮转

```bash
cat > /etc/logrotate.d/jhchat << 'EOF'
/www/jhchat/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}

/var/log/nginx/jhchat_*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
EOF
```

---

## 第十二步：备份策略

### 12.1 创建备份脚本

```bash
cat > /usr/local/bin/jhchat-backup.sh << 'EOF'
#!/bin/bash
# 江湖聊天室 - 自动备份脚本

BACKUP_DIR="/www/backup/jhchat"
DATE=$(date +%Y%m%d_%H%M%S)
MYSQL_USER="jhchat"
MYSQL_PASS="your_secure_password"
MYSQL_DB="jhchat"

# 创建备份目录
mkdir -p $BACKUP_DIR/database
mkdir -p $BACKUP_DIR/code
mkdir -p $BACKUP_DIR/config

echo "开始备份 - $DATE"

# 1. 备份数据库
echo "备份数据库..."
mysqldump -u $MYSQL_USER -p$MYSQL_PASS \
    --single-transaction \
    --routines \
    --triggers \
    $MYSQL_DB | gzip > $BACKUP_DIR/database/jhchat_$DATE.sql.gz

# 2. 备份代码
echo "备份代码..."
tar -czf $BACKUP_DIR/code/backend_$DATE.tar.gz \
    -C /www/games/jhchat/backend .

tar -czf $BACKUP_DIR/code/frontend_$DATE.tar.gz \
    -C /www/games/jhchat/frontend .

# 3. 备份配置
echo "备份配置..."
cp /www/games/jhchat/backend/.env $BACKUP_DIR/config/env_$DATE
cp /etc/nginx/conf.d/jhchat.conf $BACKUP_DIR/config/nginx_$DATE
cp /etc/systemd/system/jhchat-backend.service $BACKUP_DIR/config/systemd_$DATE 2>/dev/null || true

# 4. 删除 30 天前的备份
echo "清理旧备份..."
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
find $BACKUP_DIR -name "env_*" -mtime +30 -delete
find $BACKUP_DIR -name "nginx_*" -mtime +30 -delete

echo "备份完成：$DATE"
echo "备份大小：$(du -sh $BACKUP_DIR | cut -f1)"

# 发送通知（可选）
# curl -X POST "https://your-webhook-url" -d "status=backup_ok&date=$DATE"
EOF

chmod +x /usr/local/bin/jhchat-backup.sh
```

### 12.2 设置定时备份

```bash
# 每天凌晨 2 点备份
crontab -e
0 2 * * * /usr/local/bin/jhchat-backup.sh >> /www/jhchat/logs/backup.log 2>&1
```

---

## 第十三步：故障排查

### 13.1 常见问题

#### 后端无法启动

```bash
# 检查端口占用
netstat -tlnp | grep 3001
lsof -i:3001

# 检查日志
pm2 logs jhchat-backend --lines 100

# 检查 Node.js 版本
node -v

# 检查依赖
cd /www/games/jhchat/backend
npm install --production

# 手动启动测试
node src/server.js
```

#### Nginx 无法访问

```bash
# 检查配置
nginx -t

# 检查日志
tail -f /var/log/nginx/jhchat_error.log

# 检查监听端口
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# 检查防火墙
ufw status
firewall-cmd --list-all
```

#### 数据库连接失败

```bash
# 检查 MySQL 状态
systemctl status mysql

# 测试连接
mysql -u jhchat -p -e "SELECT 1" jhchat

# 检查用户权限
mysql -u root -p -e "SHOW GRANTS FOR 'jhchat'@'localhost';"

# 检查配置文件中的数据库连接字符串
cat /www/games/jhchat/backend/.env
```

#### WebSocket 无法连接

```bash
# 检查 Nginx WebSocket 配置
nginx -t

# 检查后端 WebSocket 日志
pm2 logs jhchat-backend | grep socket

# 测试连接
curl -v http://localhost:3001/socket.io/?EIO=4&transport=polling
```

### 13.2 快速恢复脚本

```bash
cat > /usr/local/bin/jhchat-restart.sh << 'EOF'
#!/bin/bash
# 江湖聊天室 - 快速重启脚本

echo "重启江湖聊天室服务..."

# 重启后端
echo "重启后端..."
cd /www/games/jhchat/backend
pm2 restart jhchat-backend

# 重启 Nginx
echo "重启 Nginx..."
systemctl restart nginx

# 等待服务启动
sleep 5

# 健康检查
echo "健康检查..."
curl -f http://localhost:3001/api/ping && echo "✓ 后端正常"
curl -f http://localhost/ && echo "✓ 前端正常"

echo "重启完成"
EOF

chmod +x /usr/local/bin/jhchat-restart.sh
```

---

## 第十四步：更新和维护

### 14.1 代码更新流程

```bash
# 1. 备份当前版本
cd /www/games/jhchat
git log -1 > /www/backup/jhchat/last_version.txt

# 2. 拉取最新代码
cd /www/games/jhchat
git pull origin main

# 3. 安装新依赖
cd backend
npm install --production

cd ../frontend
npm install
npm run build

# 4. 复制前端文件
cp -r dist/* /www/jhchat/

# 5. 重启后端
pm2 restart jhchat-backend

# 6. 重载 Nginx
nginx -s reload

# 7. 验证
curl http://localhost:3001/api/ping
curl http://localhost/
```

### 14.2 回滚脚本

```bash
cat > /usr/local/bin/jhchat-rollback.sh << 'EOF'
#!/bin/bash
# 江湖聊天室 - 回滚脚本

BACKUP_DIR="/www/backup/jhchat"

# 选择最近的备份
LATEST_BACKUP=$(ls -t $BACKUP_DIR/code | grep backend | head -1)

echo "回滚到：$LATEST_BACKUP"

# 回滚后端
cd /www/games/jhchat
tar -xzf $BACKUP_DIR/code/$LATEST_BACKUP -C backend/

# 回滚数据库
LATEST_DB=$(ls -t $BACKUP_DIR/database | grep jhchat | head -1)
gunzip -c $BACKUP_DIR/database/$LATEST_DB | mysql -u jhchat -p jhchat

# 重启服务
pm2 restart jhchat-backend
nginx -s reload

echo "回滚完成"
EOF

chmod +x /usr/local/bin/jhchat-rollback.sh
```

---

## 附录

### A. 关键文件路径

```
/www/jhchat/                    # 前端文件部署目录
/www/games/jhchat/              # 源代码目录
/www/games/jhchat/backend/.env  # 后端配置文件
/etc/nginx/conf.d/jhchat.conf   # Nginx 配置
/var/log/nginx/jhchat_*.log     # Nginx 日志
/www/jhchat/logs/               # 应用程序日志
/www/backup/jhchat/             # 备份目录
```

### B. 常用命令汇总

```bash
# 服务状态
pm2 status
systemctl status nginx
systemctl status mysql
systemctl status redis

# 日志查看
pm2 logs jhchat-backend
tail -f /var/log/nginx/jhchat_error.log

# 重启服务
pm2 restart jhchat-backend
systemctl restart nginx
/usr/local/bin/jhchat-restart.sh

# 备份
/usr/local/bin/jhchat-backup.sh

# 健康检查
/usr/local/bin/jhchat-monitor.sh
```

### C. 安全建议

1. **修改默认密码**：数据库、JWT_SECRET 等所有默认密码
2. **启用 HTTPS**：生产环境必须使用 SSL 证书
3. **定期更新**：及时更新系统、Nginx、Node.js 安全补丁
4. **限制访问**：配置防火墙，只开放必要端口
5. **日志监控**：设置日志告警，及时发现异常
6. **定期备份**：至少保留 30 天备份，异地存储
7. **访问控制**：配置 API 限流，防止 DDoS

### D. 性能调优参考

根据服务器配置调整以下参数：

| 配置项 | 2 核 4GB | 4 核 8GB | 8 核 16GB |
|--------|----------|----------|-----------|
| innodb_buffer_pool_size | 2G | 4G | 8G |
| max_connections | 100 | 200 | 500 |
| worker_processes | 2 | 4 | 8 |
| worker_connections | 2048 | 4096 | 8192 |
| NODE_MAX_MEMORY | 512M | 1G | 2G |

---

## 技术支持

- 项目仓库：https://github.com/your-repo/games
- 问题反馈：提交 Issue
- 文档更新：查看 QUICK_DEPLOY.md 和 SERVER_CONFIG.md

---

*文档版本：1.0*
*最后更新：2026-04-23*
*适用环境：MySQL 5.7 + Nginx 1.28.0 + Node.js 18+*
