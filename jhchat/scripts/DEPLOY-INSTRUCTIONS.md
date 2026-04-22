# 江湖聊天室 - 生产环境部署命令

## 快速部署（在目标服务器上执行）

### 1. 登录服务器

```bash
ssh root@45.192.101.76
```

### 2. 克隆或更新代码

```bash
cd /www

# 首次部署
git clone -b 260413-feat-jhchat-refactor --depth 1 https://github.com/peighangma-dev/games.git

# 或更新现有部署
cd /www/games && git pull origin 260413-feat-jhchat-refactor
```

### 3. 运行部署脚本

```bash
cd /www/games/jhchat
bash scripts/quick-deploy.sh
```

### 4. 验证部署

```bash
# 检查前端
ls -la /www/jhchat

# 检查后端进程
ps aux | grep "node.*server.js"

# 检查 PM2（如果安装了）
pm2 list

# 测试 API
curl http://localhost:3001/api/ping

# 测试 Web 访问
curl http://localhost/
```

---

## 详细部署步骤（手动执行）

### 步骤 1: 环境检查

```bash
# 检查 Node.js
node -v
npm -v

# 检查 Docker（可选）
docker -v
docker ps

# 检查 Nginx
nginx -v
```

如果 Node.js 版本低于 18，需要升级：

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
```

### 步骤 2: 创建目录

```bash
mkdir -p /www/jhchat
mkdir -p /www/backup/jhchat
```

### 步骤 3: 构建前端

```bash
cd /www/games/jhchat/frontend

# 安装依赖
npm install

# 构建
npm run build

# 部署到 Web 目录
cp -r dist/* /www/jhchat/
```

### 步骤 4: 部署后端

```bash
cd /www/games/jhchat/backend

# 安装依赖
npm install --production
```

### 步骤 5: 导入数据库

```bash
# 找到 MySQL 容器名
docker ps --filter "name=mysql" --format "{{.Names}}"

# 假设容器名为 mysql80，导入数据库
docker exec -i mysql80 mysql -u root -pLmPNsiGKRKLCkH48 -e "CREATE DATABASE IF NOT EXISTS jhchat;"
docker exec -i mysql80 mysql -u root -pLmPNsiGKRKLCkH48 jhchat < /www/games/jhchat/数据库.sql
```

### 步骤 6: 配置 Nginx

```bash
cat > /etc/nginx/conf.d/jhchat.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    root /www/jhchat;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        proxy_read_timeout 86400;
    }
}
EOF

# 测试配置
nginx -t

# 重新加载
systemctl reload nginx
# 或
nginx -s reload
# 或
service nginx reload
```

### 步骤 7: 启动后端服务

**选项 A: 使用 PM2（推荐）**

```bash
# 安装 PM2（如果未安装）
npm install -g pm2

# 启动应用
cd /www/games/jhchat/backend
pm2 start src/server.js --name jhchat-backend
pm2 startup
pm2 save

# 查看状态
pm2 list
```

**选项 B: 使用 nohup**

```bash
cd /www/games/jhchat/backend
pkill -f "node.*server.js" || true
nohup node src/server.js > /www/jhchat/backend.log 2>&1 &
echo $! > /www/jhchat/backend.pid
```

---

## 验证部署

### 1. 检查服务

```bash
# 查看后端进程
ps aux | grep "node.*server.js"

# 查看端口监听
netstat -tlnp | grep -E "(80|3001)"

# 查看 PM2 状态
pm2 list
```

### 2. 测试 API

```bash
# 健康检查
curl http://localhost:3001/api/ping

# 系统信息
curl http://localhost:3001/api/server-info
```

### 3. 测试 Web 访问

```bash
# 本地测试
curl http://localhost/

# 从外部访问
# 打开浏览器：http://45.192.101.76
```

### 4. 查看日志

```bash
# 后端日志
tail -f /www/jhchat/backend.log

# 或 PM2 日志
pm2 logs jhchat-backend

# Nginx 访问日志
tail -f /var/log/nginx/access.log

# Nginx 错误日志
tail -f /var/log/nginx/error.log
```

---

## 常见问题排查

### 问题 1: 后端无法启动

```bash
# 检查端口占用
lsof -i :3001

# 检查 Node.js 版本
node -v

# 手动启动测试
cd /www/games/jhchat/backend
node src/server.js
```

### 问题 2: 前端页面空白

```bash
# 检查 Web 目录文件
ls -la /www/jhchat

# 检查 Nginx 配置
nginx -t

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log
```

### 问题 3: API 请求失败

```bash
# 检查后端是否响应
curl http://localhost:3001/api/ping

# 检查 Nginx 代理配置
cat /etc/nginx/conf.d/jhchat.conf

# 查看 Nginx 访问日志
tail -f /var/log/nginx/access.log
```

### 问题 4: 数据库连接失败

```bash
# 检查 MySQL 容器
docker ps | grep mysql

# 测试数据库连接
docker exec -it mysql80 mysql -u root -pLmPNsiGKRKLCkH48

# 检查数据库是否存在
docker exec -it mysql80 mysql -u root -pLmPNsiGKRKLCkH48 -e "SHOW DATABASES;"

# 查看后端数据库配置
cat /www/games/jhchat/backend/src/config/database.js
```

---

## 回滚方案

如果需要回滚到之前的版本：

```bash
# 1. 停止服务
pm2 stop jhchat-backend  # 或 kill 后端进程

# 2. 切换 Git 分支
cd /www/games
git checkout <previous-branch>

# 3. 重新构建前端
cd jhchat/frontend
npm run build
cp -r dist/* /www/jhchat/

# 4. 启动服务
pm2 start jhchat-backend
```

---

## 部署检查清单

- [ ] 代码已克隆/更新到 `/www/games/jhchat`
- [ ] 前端已构建并部署到 `/www/jhchat`
- [ ] 后端依赖已安装（`npm install`）
- [ ] 数据库已创建并导入
- [ ] Nginx 配置已创建（`/etc/nginx/conf.d/jhchat.conf`）
- [ ] Nginx 已重新加载
- [ ] 后端服务已启动
- [ ] API 健康检查通过（`/api/ping`）
- [ ] Web 页面可以正常访问
- [ ] 日志文件可以正常写入

---

## 安全建议

1. **配置防火墙**
   ```bash
   # 只开放必要的端口
   ufw allow 80/tcp
   ufw allow 443/tcp  # 如果启用 HTTPS
   ufw allow 22/tcp   # SSH
   ufw enable
   ```

2. **配置 SSL（推荐）**
   ```bash
   # 使用 Let's Encrypt
   apt-get install -y certbot python3-certbot-nginx
   certbot --nginx -d your-domain.com
   ```

3. **定期备份数据库**
   ```bash
   # 添加到 crontab
   0 2 * * * docker exec mysql80 mysqldump -u root -pYOURPASSWORD jhchat > /backup/jhchat/db_$(date +\%Y\%m\%d).sql
   ```

4. **监控服务状态**
   ```bash
   # 使用 PM2 监控
   pm2 monit
   
   # 或使用 systemd 监控
   systemctl status nginx
   ```
