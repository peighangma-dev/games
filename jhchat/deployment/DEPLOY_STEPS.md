# 🚀 江湖聊天室 - 生产环境部署指南

**实际目录结构**：
- **仓库目录**: `/www/games/jhchat` (Git 仓库)
- **后端目录**: `/www/wwwroot/jhchat/backend` (运行目录)
- **前端目录**: `/www/jhchat` (运行目录)
- **备份目录**: `/www/backup/jhchat`

---

## ⚡ 快速部署（推荐）

### 步骤 1：上传部署脚本

在本地执行：
```bash
# 从本地上传部署脚本到服务器
cd /workspace/jhchat/deployment
scp deploy.sh root@your-server:/www/games/
```

### 步骤 2：执行部署脚本

在生产服务器上执行：
```bash
cd /www/games
chmod +x deploy.sh
./deploy.sh
```

脚本会自动完成：
- ✅ 备份数据库和代码
- ✅ 拉取最新代码到 `/www/games/jhchat`
- ✅ 同步到运行目录
- ✅ 安装依赖
- ✅ 构建前端
- ✅ 执行数据库迁移
- ✅ 重启服务

---

## 📝 手动部署（详细步骤）

### 1. 拉取代码到仓库目录

```bash
cd /www/games
mkdir -p jhchat
cd jhchat
git init
git remote add origin https://github.com/peighangma-dev/games.git
git fetch
git checkout -t origin/260413-feat-jhchat-refactor
```

### 2. 同步后端代码

```bash
# 后端目录
mkdir -p /www/wwwroot/jhchat/backend

# 同步代码（排除 node_modules）
rsync -av --exclude 'node_modules' --exclude 'logs' /www/games/jhchat/backend/ /www/wwwroot/jhchat/backend/
```

### 3. 同步前端代码

```bash
# 前端目录
mkdir -p /www/jhchat

# 同步代码
rsync -av /www/games/jhchat/frontend/ /www/jhchat/
```

### 4. 安装依赖

```bash
# 后端
cd /www/wwwroot/jhchat/backend
npm install --production

# 前端
cd /www/jhchat
npm install
```

### 5. 构建前端

```bash
cd /www/jhchat
npm run build
```

### 6. 数据库迁移

```bash
mysql -u jhchat -p'JhChat@2026Secure!' jhchat < /www/games/jhchat/backend/migrations/20260425_create_system_updates_tables.sql
```

### 7. 启动服务（PM2）

```bash
# 后端服务
cd /www/wwwroot/jhchat/backend
pm2 start src/server.js --name jhchat-backend --env production

# 前端服务
cd /www/jhchat
pm2 start npm --name jhchat-frontend -- run dev

# 保存配置
pm2 save
```

---

## ✅ 验证部署

```bash
# 1. 查看服务状态
pm2 status

# 2. 查看后端日志
pm2 logs jhchat-backend --lines 50

# 3. 查看前端日志
pm2 logs jhchat-frontend --lines 50

# 4. 测试后端 API
curl http://localhost:3001/api/health

# 5. 测试数据库
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "SELECT version, title FROM system_updates ORDER BY version_code DESC"

# 6. 访问管理后台
# 浏览器打开：http://your-domain.com/admin
```

---

## 🔄 日常更新流程

后续更新只需执行：

```bash
# 1. 进入仓库目录
cd /www/games/jhchat

# 2. 拉取最新代码
git pull

# 3. 运行部署脚本
./deploy.sh

# 或直接手动更新：
# 同步后端
rsync -av --exclude 'node_modules' --exclude 'logs' /www/games/jhchat/backend/ /www/wwwroot/jhchat/backend/
cd /www/wwwroot/jhchat/backend && npm install

# 同步前端
rsync -av /www/games/jhchat/frontend/ /www/jhchat/
cd /www/jhchat && npm install && npm run build

# 4. 重启服务
pm2 restart all
```

---

## 🔧 PM2 配置

### 查看服务状态
```bash
pm2 status
```

### 查看日志
```bash
# 所有服务
pm2 logs

# 仅后端
pm2 logs jhchat-backend

# 仅前端
pm2 logs jhchat-frontend
```

### 重启服务
```bash
# 重启所有
pm2 restart all

# 单独重启
pm2 restart jhchat-backend
pm2 restart jhchat-frontend
```

### 开机自启
```bash
pm2 startup
# 执行输出的命令
pm2 save
```

---

## 📂 目录说明

```
/www/
├── games/
│   └── jhchat/              # Git 仓库目录
│       ├── backend/         # 后端源代码
│       ├── frontend/        # 前端源代码
│       └── deployment/      # 部署脚本
│
├── wwwroot/
│   └── jhchat/
│       └── backend/         # 后端运行目录
│           ├── node_modules/
│           ├── src/
│           ├── logs/
│           └── uploads/
│
├── jhchat/                  # 前端运行目录
│   ├── node_modules/
│   ├── dist/               # 构建输出
│   ├── src/
│   └── public/
│
└── backup/
    └── jhchat/             # 备份目录
        ├── db_*.sql.gz     # 数据库备份
        └── code_*/         # 代码备份
```

---

## ⚠️ 常见问题

### Q1: frontend 目录不存在

**原因**: 未创建目录或路径错误

**解决**:
```bash
mkdir -p /www/jhchat
rsync -av /www/games/jhchat/frontend/ /www/jhchat/
```

### Q2: npm install 报错

**原因**: Node.js 版本或网络问题

**解决**:
```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com
npm install
```

### Q3: 端口被占用

**解决**:
```bash
# 查看端口占用
netstat -tulpn | grep :3001
netstat -tulpn | grep :5173

# 停止旧进程
pkill -f "node.*server.js"
pkill -f "vite"

# 重启 PM2
pm2 restart all
```

### Q4: 数据库迁移失败（表已存在）

**解决**:
```bash
# 跳过迁移或手动检查
mysql -u jhchat -p jhchat -e "SELECT COUNT(*) FROM system_updates"
```

---

## 📞 获取帮助

### 日志位置
- **PM2 日志**: `~/.pm2/logs/`
- **后端日志**: `/www/wwwroot/jhchat/backend/logs/`
- **部署日志**: `/var/log/jhchat_deploy_*.log`

### 备份位置
- **数据库备份**: `/www/backup/jhchat/db_*.sql.gz`
- **代码备份**: `/www/backup/jhchat/code_*/`

---

**部署顺利！** 🎉
