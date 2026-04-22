# 江湖聊天室 - 生产环境部署指南

## 服务器信息

- **IP 地址**: 45.192.101.76
- **用户名**: root
- **站点目录**: /www/jhchat
- **MySQL**: Docker 容器（容器名：mysql80）
- **MySQL 密码**: LmPNsiGKRKLCkH48

---

## 快速部署（推荐）

### 步骤 1: SSH 登录服务器

```bash
ssh root@45.192.101.76
```

### 步骤 2: 下载并执行部署脚本

```bash
# 创建临时目录
cd /tmp

# 下载部署脚本
wget https://raw.githubusercontent.com/peighangma-dev/games/260413-feat-jhchat-refactor/jhchat/deploy.sh -O deploy.sh

# 或手动创建（如果 wget 不可用）
cat > deploy.sh << 'EOF'
#!/bin/bash
set -e
cd /www
if [ ! -d "games" ]; then
  git clone -b 260413-feat-jhchat-refactor --depth 1 https://github.com/peighangma-dev/games.git
else
  cd games && git pull origin 260413-feat-jhchat-refactor
fi
cd /www/games/jhchat
bash scripts/quick-deploy.sh
EOF

# 执行部署
chmod +x deploy.sh
./deploy.sh
```

---

## 手动部署（详细步骤）

### 1. 克隆代码仓库

```bash
cd /www
git clone -b 260413-feat-jhchat-refactor --depth 1 https://github.com/peighangma-dev/games.git
cd /www/games/jhchat
```

### 2. 创建目录

```bash
mkdir -p /www/jhchat
mkdir -p /www/backup/jhchat
```

### 3. 构建前端

```bash
cd /www/games/jhchat/frontend

# 安装依赖
npm install

# 构建生产版本
npm run build

# 复制到部署目录
cp -r dist/* /www/jhchat/
```

### 4. 部署后端

```bash
cd /www/games/jhchat/backend
npm install --production
```

### 5. 导入数据库

```bash
# 检查 MySQL 容器
docker ps --filter "name=mysql"

# 导入数据库
docker exec -i mysql80 mysql -u root -pLmPNsiGKRKLCkH48 -e "CREATE DATABASE IF NOT EXISTS jhchat;"
docker exec -i mysql80 mysql -u root -pLmPNsiGKRKLCkH48 jhchat < /www/games/jhchat/数据库.sql
```

### 6. 配置 Nginx

```bash
cat > /etc/nginx/conf.d/jhchat.conf << 'EOF'
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
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF

# 测试配置
nginx -t

# 重新加载
nginx -s reload
```

### 7. 启动后端服务

```bash
# 方法 1: 使用 PM2（推荐）
npm install -g pm2
cd /www/games/jhchat/backend
pm2 start src/server.js --name jhchat-backend
pm2 startup
pm2 save

# 方法 2: 使用 nohup
cd /www/games/jhchat/backend
nohup node src/server.js > /www/jhchat/backend.log 2>&1 &
```

---

## 验证部署

```bash
# 1. 检查后端进程
ps aux | grep "node.*server.js"
# 或 PM2
pm2 list

# 2. 测试 API
curl http://localhost:3001/api/ping

# 3. 测试 Web 访问
curl http://localhost/

# 4. 从外部访问
# 浏览器打开：http://45.192.101.76
```

---

## 常用维护命令

### 查看日志

```bash
# 后端日志
tail -f /www/jhchat/backend.log
# 或 PM2
pm2 logs jhchat-backend

# Nginx 访问日志
tail -f /var/log/nginx/access.log

# Nginx 错误日志
tail -f /var/log/nginx/error.log
```

### 重启服务

```bash
# PM2
pm2 restart jhchat-backend

# nohup
pkill -f "node.*server.js"
cd /www/games/jhchat/backend
nohup node src/server.js > /www/jhchat/backend.log 2>&1 &
```

### 更新代码

```bash
cd /www/games/jhchat
git pull origin 260413-feat-jhchat-refactor

# 重新构建前端
cd frontend
npm run build
cp -r dist/* /www/jhchat/

# 重启后端
pm2 restart jhchat-backend
```

### 备份数据库

```bash
docker exec mysql80 mysqldump -u root -pLmPNsiGKRKLCkH48 jhchat > /www/backup/jhchat/db_$(date +%Y%m%d).sql
```

### 恢复数据库

```bash
docker exec -i mysql80 mysql -u root -pLmPNsiGKRKLCkH48 jhchat < /www/backup/jhchat/db_YYYYMMDD.sql
```

---

## 常见问题排查

### 后端无法启动

```bash
# 检查 Node.js 版本
node -v  # 需要 18+

# 检查端口占用
netstat -tlnp | grep 3001

# 手动启动测试
cd /www/games/jhchat/backend
node src/server.js
```

### 页面空白

```bash
# 检查 Web 目录内容
ls -la /www/jhchat

# 检查 Nginx 配置
nginx -t

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log
```

### API 返回 502

```bash
# 检查后端是否运行
pm2 status
# 或
ps aux | grep "node.*server.js"

# 检查后端日志
tail -f /www/jhchat/backend.log
```

### 数据库连接失败

```bash
# 检查 MySQL 容器
docker ps | grep mysql

# 测试数据库连接
docker exec -it mysql80 mysql -u root -pLmPNsiGKRKLCkH48

# 查看后端数据库配置
cat /www/games/jhchat/backend/src/config/database.js
```

---

## 附录：目录结构

```
/www/
├── games/
│   └── jhchat/
│       ├── backend/          # 后端代码
│       │   ├── src/
│       │   ├── package.json
│       │   └── node_modules/
│       ├── frontend/         # 前端代码
│       │   ├── src/
│       │   ├── package.json
│       │   └── dist/        # 构建产物
│       ├── scripts/          # 部署脚本
│       ├── 数据库.sql        # 数据库结构
│       └── README.md
├── jhchat/                   # Web 部署目录
│   ├── index.html
│   ├── assets/
│   └── backend.log
└── backup/
    └── jhchat/              # 数据库备份
```

---

## 支持

如遇到问题，请检查：

1. 日志文件
2. Git 仓库分支是否正确（`260413-feat-jhchat-refactor`）
3. Node.js 版本是否 >= 18
4. MySQL 容器是否正常
5. Nginx 配置是否正确

技术文档：
- `/www/games/jhchat/DEPLOYMENT.md` - 完整部署文档
- `/www/games/jhchat/ANDROID.md` - Android 版本说明
- `/www/games/jhchat/DESKTOP.md` - Windows 版本说明
