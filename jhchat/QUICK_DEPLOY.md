# 江湖聊天室 - 快速部署命令汇总

## 一键部署（推荐）

### 在服务器 root 用户下执行：

```bash
ssh root@45.192.101.76
```

```bash
# 下载并执行部署脚本
cd /tmp && cat > deploy.sh << 'EOF' && chmod +x deploy.sh && ./deploy.sh
#!/bin/bash
set -e
cd /www
[ ! -d "games" ] && git clone -b 260413-feat-jhchat-refactor --depth 1 https://github.com/peighangma-dev/games.git
cd games && git pull origin 260413-feat-jhchat-refactor
cd /www/games/jhchat && bash scripts/quick-deploy.sh
EOF
```

---

## 手动分步部署

### 1. 准备环境

```bash
# 安装必要的软件（如果未安装）
apt-get update
apt-get install -y git curl
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
npm install -g pm2
```

### 2. 克隆代码

```bash
cd /www
git clone -b 260413-feat-jhchat-refactor --depth 1 https://github.com/peighangma-dev/games.git
cd /www/games/jhchat
```

### 3. 创建目录

```bash
mkdir -p /www/jhchat /www/backup/jhchat
```

### 4. 部署前端

```bash
cd /www/games/jhchat/frontend
npm install
npm run build
cp -r dist/* /www/jhchat/
```

### 5. 部署后端

```bash
cd /www/games/jhchat/backend
npm install --production
```

### 6. 导入数据库

```bash
# 检查 MySQL 容器
docker ps --filter "name=mysql"

# 创建并导入数据库
docker exec -i mysql80 mysql -u root -pLmPNsiGKRKLCkH48 -e "CREATE DATABASE IF NOT EXISTS jhchat;"
docker exec -i mysql80 mysql -u root -pLmPNsiGKRKLCkH48 jhchat < /www/games/jhchat/数据库.sql
```

### 7. 配置 Nginx

```bash
cat > /etc/nginx/conf.d/jhchat.conf << 'EOF'
server {
    listen 80;
    root /www/jhchat;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    location /api/ { proxy_pass http://localhost:3001/api/; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection 'upgrade'; }
    location /socket.io/ { proxy_pass http://localhost:3001/socket.io/; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; }
}
EOF
nginx -t && nginx -s reload
```

### 8. 启动后端

```bash
cd /www/games/jhchat/backend
pm2 start src/server.js --name jhchat-backend
pm2 startup
pm2 save
```

---

## 验证

```bash
# 检查服务
pm2 list
curl http://localhost:3001/api/ping
curl http://localhost/

# 访问地址
echo "http://45.192.101.76"
```

---

## 维护命令

```bash
# 查看日志
pm2 logs jhchat-backend
tail -f /www/jhchat/backend.log

# 重启后端
pm2 restart jhchat-backend

# 更新代码
cd /www/games/jhchat && git pull && cd frontend && npm run build && cp -r dist/* /www/jhchat/ && cd ../backend && pm2 restart jhchat-backend

# 备份数据库
docker exec mysql80 mysqldump -u root -pLmPNsiGKRKLCkH48 jhchat > /www/backup/jhchat/db_$(date +%Y%m%d).sql
```

---

## 关键信息

- **访问地址**: http://45.192.101.76
- **前端目录**: /www/jhchat
- **后端代码**: /www/games/jhchat/backend
- **数据库**: Docker 容器 mysql80
- **MySQL 密码**: LmPNsiGKRKLCkH48
- **后端端口**: 3001
- **Nginx 配置**: /etc/nginx/conf.d/jhchat.conf
