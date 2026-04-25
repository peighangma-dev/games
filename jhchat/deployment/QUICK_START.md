# 🚀 江湖聊天室 - 生产环境快速部署

**只需 3 步，10 分钟完成部署！**

---

## ⚡ 一键部署（推荐）

```bash
# 1️⃣ 上传部署脚本
cd /workspace/jhchat/deployment
scp deploy.sh root@your-server:/www/games/

# 2️⃣ 执行部署（在生产服务器）
ssh root@your-server "cd /www/games && chmod +x deploy.sh && ./deploy.sh"

# 3️⃣ 验证部署
ssh root@your-server "pm2 status"
```

---

## 📋 手动执行（快速版）

如果不想用脚本，可以直接复制执行以下命令：

```bash
# ========== 1. 拉取代码 ==========
cd /www/games/jhchat
git pull

# ========== 2. 同步后端 ==========
rsync -av --exclude 'node_modules' --exclude 'logs' /www/games/jhchat/backend/ /www/wwwroot/jhchat/backend/
cd /www/wwwroot/jhchat/backend && npm install

# ========== 3. 同步前端 ==========
rsync -av /www/games/jhchat/frontend/ /www/jhchat/
cd /www/jhchat && npm install && npm run build

# ========== 4. 数据库迁移 ==========
mysql -u jhchat -p'JhChat@2026Secure!' jhchat < /www/games/jhchat/backend/migrations/20260425_create_system_updates_tables.sql

# ========== 5. 重启服务 ==========
pm2 restart all
pm2 save

# ========== 6. 验证 ==========
pm2 status && curl http://localhost:3001/api/health
```

---

## ✅ 验证清单

```bash
# 检查 PM2 服务
pm2 status

# 后端日志
pm2 logs jhchat-backend --lines 50

# 前端日志
pm2 logs jhchat-frontend --lines 50

# 数据库检查
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "SELECT version, title FROM system_updates LIMIT 5"

# 访问管理后台
# http://your-domain.com/admin
```

---

## 🎯 核心目录

| 用途 | 路径 |
|------|------|
| Git 仓库 | `/www/games/jhchat` |
| 后端运行 | `/www/wwwroot/jhchat/backend` |
| 前端运行 | `/www/jhchat` |
| 备份目录 | `/www/backup/jhchat` |

---

## 🐛 快速排错

```bash
# 服务未启动
pm2 restart all

# 端口被占用
netstat -tulpn | grep :3001
kill -9 <PID>
pm2 restart all

# 需要重新构建
cd /www/jhchat && npm run build

# 查看实时日志
pm2 logs

# 查看部署日志
tail -f /var/log/jhchat_deploy_*.log
```

---

**就这些！有问题查看完整文档：`deployment/DEPLOY_STEPS.md`**
