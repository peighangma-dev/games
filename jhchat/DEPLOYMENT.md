# 江湖聊天室 - 服务器部署文档

## 目录结构

```
/workspace/jhchat/
├── scripts/                    # 部署脚本目录
│   ├── deploy.sh              # 主部署脚本
│   ├── db-manage.sh          # 数据库管理脚本
│   └── frontend-sync.sh      # 前端同步脚本
├── backend/                   # 后端代码
├── frontend/                  # 前端代码
├── database/                  # 数据库相关文件
├── docker-compose.yml         # Docker 开发环境
└── docker-compose.prod.yml    # Docker 生产环境
```

## 部署方式

### 方式一：完整部署（推荐）

```bash
# 1. 进入项目目录
cd /workspace/jhchat

# 2. 执行部署脚本
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# 3. 查看日志
tail -f /var/log/jhchat/*/*.log
```

### 方式二：Docker Compose 部署（生产环境）

```bash
# 1. 复制环境变量文件
cp .env.example .env

# 2. 编辑环境变量
vim .env

# 3. 构建并启动
docker-compose -f docker-compose.prod.yml up -d

# 4. 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 方式三：手动部署

```bash
# 1. 构建前端
cd frontend
npm install
npm run build

# 2. 部署到 Web 目录
cp -r dist/* /var/www/jhchat/

# 3. 安装后端依赖
cd ../backend
npm install --production

# 4. 启动后端
pm2 start src/server.js --name jhchat-backend

# 5. 导入数据库
./scripts/db-manage.sh import
```

## 数据库管理

### 备份数据库

```bash
./scripts/db-manage.sh backup
```

### 导入数据库

```bash
./scripts/db-manage.sh import
```

### 查看数据库状态

```bash
./scripts/db-manage.sh status
```

### 执行 SQL 文件

```bash
./scripts/db-manage.sh run /path/to/migration.sql
```

### 恢复备份

```bash
./scripts/db-manage.sh restore /backup/jhchat/mysql/jhchat_backup_20260422.sql.gz
```

## 前端部署

### 构建并部署

```bash
# 快速部署
./scripts/frontend-sync.sh deploy

# 仅构建
./scripts/frontend-sync.sh build

# 仅同步
./scripts/frontend-sync.sh sync /var/www/jhchat
```

### 增量同步

```bash
./scripts/frontend-sync.sh sync-rsync /var/www/jhchat
```

### 验证部署

```bash
./scripts/frontend-sync.sh verify
```

## 更新部署

### 更新代码

```bash
cd /workspace/jhchat
git pull origin main
```

### 快速更新

```bash
# 更新前后端
./scripts/deploy.sh
```

### 回滚

```bash
# 回滚到上一个版本
./scripts/deploy.sh rollback

# 指定备份恢复
./scripts/deploy.sh restore /backup/jhchat/backup_20260422_120000
```

## 环境变量配置

创建 `.env` 文件：

```bash
# MySQL 配置
MYSQL_ROOT_PASSWORD=你的 root 密码
MYSQL_DATABASE=jhchat
MYSQL_USER=jhchat
MYSQL_PASSWORD=你的用户密码

# JWT 密钥（生产环境务必修改）
JWT_SECRET=your-secret-key-change-this

# 端口配置
MYSQL_PORT=3306
BACKEND_PORT=3001
FRONTEND_PORT=80

# 前端 URL
FRONTEND_URL=https://your-domain.com
```

## Nginx 配置

### 创建配置

```bash
cat > /etc/nginx/sites-available/jhchat << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/jhchat;
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
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# 启用配置
ln -s /etc/nginx/sites-available/jhchat /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 监控和维护

### 查看服务状态

```bash
# Docker 方式
docker-compose ps

# PM2 方式
pm2 list

# Nginx
systemctl status nginx
```

### 查看日志

```bash
# 后端日志
docker-compose logs backend
# 或
pm2 logs jhchat-backend

# 前端日志
docker-compose logs frontend
# 或
tail -f /var/log/nginx/access.log

# MySQL 日志
docker-compose logs mysql
# 或
tail -f /var/log/mysql/error.log
```

### 健康检查

```bash
# 检查后端 API
curl http://localhost:3001/api/ping

# 检查前端
curl http://localhost/

# 检查数据库
docker exec jhchat-mysql mysqladmin -u root -p ping
```

## 常见问题

### Q1: 部署失败

```bash
# 查看详细日志
./scripts/deploy.sh 2>&1 | tee deploy.log

# 检查权限
ls -la scripts/
chmod +x scripts/*.sh
```

### Q2: 数据库连接失败

```bash
# 检查 MySQL 容器
docker ps | grep mysql

# 测试连接
docker exec jhchat-mysql mysql -u root -p -e "SHOW DATABASES;"
```

### Q3: 前端 404

```bash
# 检查 Nginx 配置
nginx -t
systemctl reload nginx

# 检查文件
ls -la /var/www/jhchat/
```

### Q4: Socket.IO 连接失败

检查 Nginx 的 WebSocket 代理配置是否正确：
- `proxy_set_header Upgrade $http_upgrade;`
- `proxy_set_header Connection "upgrade";`

## 性能优化

### Redis 缓存

```bash
# 配置 Redis
cat > redis.conf << 'EOF'
maxmemory 512mb
maxmemory-policy allkeys-lru
appendonly yes
EOF
```

### Nginx 缓存

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Docker 资源限制

在 `docker-compose.prod.yml` 中已配置资源限制：
- MySQL: 2 CPU, 2GB 内存
- 后端：1 CPU, 1GB 内存
- 前端：0.5 CPU, 256MB 内存

## 备份策略

### 自动备份脚本

```bash
cat > /etc/cron.daily/jhchat-backup << 'EOF'
#!/bin/bash
cd /workspace/jhchat
./scripts/db-manage.sh backup
find /backup/jhchat -mtime +30 -delete
EOF

chmod +x /etc/cron.daily/jhchat-backup
```

### 备份位置

| 类型 | 位置 | 保留周期 |
|------|------|---------|
| 数据库 | `/backup/jhchat/mysql/` | 30 天 |
| Web 文件 | `/backup/jhchat/web/` | 7 天 |
| 完整备份 | `/backup/jhchat/` | 7 天 |

## SSL/HTTPS 配置

### 使用 Let's Encrypt

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx -y

# 获取证书
certbot --nginx -d your-domain.com

# 自动续期
certbot renew --dry-run
```

### Nginx HTTPS 配置

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL 优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # ... 其他配置 ...
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 安全加固

### 1. 防火墙配置

```bash
# 只开放必要端口
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3306/tcp  # 仅限内网访问
ufw enable
```

### 2. MySQL 安全

```sql
-- 限制用户权限
CREATE USER 'jhchat'@'localhost' IDENTIFIED BY 'password';
GRANT SELECT, INSERT, UPDATE, DELETE ON jhchat.* TO 'jhchat'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 禁用危险配置

```bash
# Docker 环境
cat >> /etc/docker/daemon.json << 'EOF'
{
  "no-new-privileges": true
}
EOF
```

### 4. 定期更新

```bash
# 系统更新
apt update && apt upgrade -y

# 依赖更新
cd frontend && npm audit fix
cd ../backend && npm audit fix
```

## 故障排查

### 1. 服务无法启动

```bash
# 查看端口占用
netstat -tulpn | grep 3001
netstat -tulpn | grep 80

# 查看容器日志
docker-compose logs -f
```

### 2. 数据库问题

```bash
# 检查数据库连接
docker exec jhchat-mysql mysql -u root -p -e "SHOW PROCESSLIST;"

# 优化表
docker exec jhchat-mysql mysql -u root -p jhchat -e "OPTIMIZE TABLE users;"
```

### 3. 性能监控

```bash
# 查看资源使用
docker stats

# 查看慢查询
docker exec jhchat-mysql tail -f /var/log/mysql/slow.log
```

## 升级指南

### 从旧版本升级

1. 备份当前版本
2. 拉取新代码
3. 执行迁移脚本
4. 重启服务

```bash
# 备份
./scripts/deploy.sh backup

# 更新代码
git pull

# 执行数据库迁移
./scripts/db-manage.sh run backend/migrations/latest.sql

# 重新启动
./scripts/deploy.sh
```

## 联系方式

如遇问题，请联系开发团队或查看详细文档。
