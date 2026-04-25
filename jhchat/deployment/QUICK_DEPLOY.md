# 🚀 生产环境快速部署指南

**适用场景**：首次部署或从 Git 仓库更新  
**目标服务器**：`/www/games/jhchat`

---

## ⚡ 快速部署（推荐）

### 步骤 0：确认服务器环境

```bash
# 检查 Node.js 版本
node -v  # 应该 >= 16.x

# 检查 npm 版本
npm -v  # 应该 >= 8.x

# 检查 Git
git --version

# 检查 PM2
pm2 -v

# 检查 MySQL
mysql --version
```

### 步骤 1：创建部署脚本并执行

```bash
# 进入 /www/games 目录
cd /www/games

# 创建必要目录
mkdir -p backup

# 下载部署脚本（在开发机器上执行）
cd /workspace/jhchat/deployment
scp deploy.sh root@your-server:/www/games/deploy.sh

# 或者在生产服务器上手动创建脚本（复制上面的 deploy.sh 内容）
```

### 步骤 2：执行部署脚本

```bash
cd /www/games
chmod +x deploy.sh
./deploy.sh
```

### 步骤 3：配置 PM2

```bash
# 配置后端服务
cd /www/games/jhchat/backend
pm2 start src/server.js --name jhchat-backend

# 配置前端服务
cd /www/games/jhchat/frontend
pm2 start npm --name jhchat-frontend -- run dev

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
# 按提示执行生成的命令
```

### 步骤 4：验证服务

```bash
# 查看服务状态
pm2 status

# 查看后端日志
pm2 logs jhchat-backend --lines 50

# 查看前端日志
pm2 logs jhchat-frontend --lines 50

# 测试后端 API
curl http://localhost:3001/api/health

# 测试前端
curl http://localhost:5173/admin

# 检查数据库表
mysql -u jhchat -p jhchat -e "SELECT version, title FROM system_updates ORDER BY version_code DESC"
```

---

## 📝 手动部署（详细步骤）

如果自动脚本不可用，可以手动执行以下步骤：

### 1. 拉取代码

```bash
cd /www/games
git clone -b 260413-feat-jhchat-refactor https://github.com/peighangma-dev/games.git jhchat
```

### 2. 安装后端依赖

```bash
cd /www/games/jhchat/backend
npm install --production
```

### 3. 安装前端依赖

```bash
cd /www/games/jhchat/frontend
npm install
```

### 4. 构建前端

```bash
cd /www/games/jhchat/frontend
npm run build
```

### 5. 执行数据库迁移

```bash
mysql -u jhchat -p jhchat < /www/games/jhchat/backend/migrations/20260425_create_system_updates_tables.sql
```

### 6. 启动服务

```bash
# 启动后端
cd /www/games/jhchat/backend
pm2 start src/server.js --name jhchat-backend

# 启动前端
cd /www/games/jhchat/frontend
pm2 start npm --name jhchat-frontend -- run dev

# 保存配置
pm2 save
```

---

## 🔧 Nginx 配置（可选）

如果需要配置反向代理：

```nginx
# /etc/nginx/sites-available/jhchat

server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

然后：

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/jhchat /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

---

## ✅ 验证清单

部署完成后逐一验证：

- [ ] **后端服务运行**
  ```bash
  pm2 status | grep jhchat-backend
  # 状态应为 'online'
  ```

- [ ] **前端服务运行**
  ```bash
  pm2 status | grep jhchat-frontend
  # 状态应为 'online'
  ```

- [ ] **后端 API 可访问**
  ```bash
  curl http://localhost:3001/api/health
  # 应返回 {"success": true, ...}
  ```

- [ ] **管理后台可访问**
  ```bash
  curl http://localhost:5173/admin
  # 应返回 HTML 内容
  ```

- [ ] **数据库迁移成功**
  ```bash
  mysql -u jhchat -p jhchat -e "SELECT COUNT(*) FROM system_updates"
  # 应返回至少 4 条记录
  ```

- [ ] **更新管理菜单可见**
  - 访问 http://your-domain.com/admin
  - 登录管理后台
  - 检查「系统配置」下是否有「更新管理」菜单

---

## 🐛 常见问题

### 1. frontend 目录不存在

**原因**：代码未拉取或路径错误

**解决**：
```bash
cd /www/games
git clone -b 260413-feat-jhchat-refactor https://github.com/peighangma-dev/games.git jhchat
```

### 2. npm install 失败

**原因**：Node.js 版本过低或网络问题

**解决**：
```bash
# 检查 Node.js 版本
node -v

# 如果版本过低，请升级
# 或使用淘宝镜像
npm config set registry https://registry.npmmirror.com
npm install
```

### 3. 构建失败

**原因**：依赖未安装完整

**解决**：
```bash
cd /www/games/jhchat/frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 4. PM2 服务无法启动

**原因**：端口被占用或配置错误

**解决**：
```bash
# 查看端口占用
netstat -tulpn | grep :3001
netstat -tulpn | grep :5173

# 停止占用进程
kill -9 <PID>

# 重新启动 PM2
pm2 restart all
```

### 5. 数据库迁移失败

**原因**：权限不足或表已存在

**解决**：
```bash
# 检查权限
mysql -u jhchat -p jhchat -e "SHOW TABLES"

# 如果表已存在，跳过迁移
# 或手动执行迁移
mysql -u jhchat -p jhchat < /www/games/jhchat/backend/migrations/20260425_create_system_updates_tables.sql
```

---

## 📞 获取支持

如有问题，请查看：

1. **PM2 日志**
   ```bash
   pm2 logs --lines 100
   ```

2. **后端日志**
   ```bash
   tail -f /www/games/jhchat/backend/logs/error.log
   ```

3. **Nginx 日志**
   ```bash
   tail -f /var/log/nginx/error.log
   ```

---

**祝部署顺利！** 🎉
