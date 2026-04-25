# 🚀 江湖聊天室 - 生产环境更新详细指南

**版本**: v1.0.1 - 系统更新管理功能  
**更新日期**: 2026-04-25  
**实际环境**:
- **仓库目录**: `/www/games/jhchat`
- **后端目录**: `/www/wwwroot/jhchat/backend`
- **前端目录**: `/www/jhchat`
- **备份目录**: `/www/backup/jhchat`

---

## ⚠️ 重要提示

### npm 镜像源问题

淘宝镜像 (`npmmirror.com`) 部分包已过期，**必须使用官方源或腾讯云镜像**：

```bash
# 推荐：使用腾讯云镜像（稳定）
npm config set registry https://mirrors.cloud.tencent.com/npm/

# 或者：使用官方源（可能需要科学上网）
npm config set registry https://registry.npmjs.org

# 验证当前源
npm config get registry
```

---

## 📋 更新前准备

### 1. 检查环境

```bash
# Node.js 版本（建议 v16+）
node -v

# npm 版本（建议 v8+）
npm -v

# PM2 状态
pm2 -v
pm2 status

# 检查磁盘空间
df -h

# 检查数据库连接
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "SELECT 1"
```

### 2. 手动备份（重要！）

```bash
# 创建备份目录
mkdir -p /www/backup/jhchat/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/www/backup/jhchat/$(date +%Y%m%d_%H%M%S)"

# 备份数据库
mysqldump -u jhchat -p'JhChat@2026Secure!' jhchat > ${BACKUP_DIR}/database.sql
gzip ${BACKUP_DIR}/database.sql

# 备份后端代码
cp -r /www/wwwroot/jhchat/backend ${BACKUP_DIR}/backend_$(date +%Y%m%d)

# 备份前端代码
cp -r /www/jhchat ${BACKUP_DIR}/frontend_$(date +%Y%m%d)

# 验证备份
ls -lh ${BACKUP_DIR}/
```

### 3. 停止服务

```bash
# 使用 PM2 停止
pm2 stop all
pm2 save

# 或者手动停止
pkill -f "node.*server.js"
pkill -f "vite"
```

---

## 📦 更新步骤

### 步骤 1：拉取最新代码

```bash
cd /www/games/jhchat
git config --global user.email "your@email.com"
git config --global user.name "Your Name"
git pull origin 260413-feat-jhchat-refactor

# 查看最新提交
git log --oneline -3
```

### 步骤 2：同步后端代码

```bash
# 同步到运行目录（排除不需要的文件）
rsync -av --delete \
    --exclude 'node_modules' \
    --exclude 'logs/*' \
    --exclude 'uploads/*' \
    --exclude '.env*' \
    /www/games/jhchat/backend/ /www/wwwroot/jhchat/backend/

# 进入后端目录
cd /www/wwwroot/jhchat/backend
```

### 步骤 3：安装后端依赖

```bash
# 清理缓存
npm cache clean --force

# 使用腾讯云镜像安装
npm config set registry https://mirrors.cloud.tencent.com/npm/

# 安装生产依赖
npm install --production

# 验证安装
ls -ld node_modules
```

### 步骤 4：同步前端代码

```bash
# 同步到运行目录
rsync -av --delete \
    --exclude 'node_modules' \
    --exclude 'dist' \
    /www/games/jhchat/frontend/ /www/jhchat/

# 进入前端目录
cd /www/jhchat
```

### 步骤 5：安装前端依赖并构建

```bash
# 设置镜像源
npm config set registry https://mirrors.cloud.tencent.com/npm/

# 清理旧的依赖
rm -rf node_modules package-lock.json

# 安装依赖
npm install

# 构建前端
npm run build

# 验证构建
ls -ld dist/
```

### 步骤 6：执行数据库迁移

```bash
# 执行迁移脚本
mysql -u jhchat -p'JhChat@2026Secure!' jhchat < /www/games/jhchat/backend/migrations/20260425_create_system_updates_tables.sql

# 验证迁移
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "
SELECT 
    TABLE_NAME, 
    TABLE_ROWS 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'jhchat' 
  AND TABLE_NAME IN ('system_updates', 'update_push_logs')
"

# 查看示例数据
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "
SELECT version, title, status FROM system_updates ORDER BY version_code DESC LIMIT 5
"
```

### 步骤 7：配置 PM2

```bash
# 配置后端服务
cd /www/wwwroot/jhchat/backend
pm2 delete jhchat-backend 2>/dev/null || true
pm2 start src/server.js --name jhchat-backend --env production

# 配置前端服务
cd /www/jhchat
pm2 delete jhchat-frontend 2>/dev/null || true
pm2 start npm --name jhchat-frontend -- run dev

# 保存配置
pm2 save

# 设置开机自启
pm2 startup
# 执行输出的命令
```

### 步骤 8：验证服务

```bash
# 查看服务状态
pm2 status

# 等待 10 秒服务启动
sleep 10

# 测试后端健康检查
curl -s http://localhost:3001/api/health | python3 -m json.tool

# 测试前端
curl -s http://localhost:5173/admin | head -20

# 查看后端日志
pm2 logs jhchat-backend --lines 20

# 查看前端日志
pm2 logs jhchat-frontend --lines 20
```

---

## ✅ 验证清单

请逐一执行以下验证：

### 服务状态验证

```bash
# 1. PM2 服务状态
pm2 status
# 应该显示：
# jhchat-backend   online
# jhchat-frontend  online
```

### 后端 API 验证

```bash
# 2. 健康检查
curl http://localhost:3001/api/health

# 3. 检查更新 API
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     http://localhost:3001/api/admin/updates/latest
```

### 前端验证

```bash
# 4. 前端页面加载
curl -s http://localhost:5173/admin | grep -o "<title>.*</title>"

# 5. 检查静态资源
curl -I http://localhost:5173/assets/
```

### 数据库验证

```bash
# 6. 检查更新表
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "
SELECT 
    version, 
    title, 
    status, 
    release_date 
FROM system_updates 
ORDER BY version_code DESC 
LIMIT 5"

# 7. 检查推送记录表
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "
SHOW TABLES LIKE 'update_push_logs'"
```

### 管理后台验证

```bash
# 8. 访问管理后台
# 浏览器打开：http://your-domain.com/admin
# 登录后检查以下内容：

# 9. 检查菜单
# 「系统配置」下应该有「更新管理」菜单

# 10. 检查仪表盘
# 应该显示 v1.0.1 更新提示卡片
```

---

## 🐛 故障排查

### 问题 1: npm install 失败

**错误**: `404 Not Found` 或 `registry.npmmirror.com`

**解决**:
```bash
# 切换镜像源
npm config set registry https://mirrors.cloud.tencent.com/npm/

# 清除缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 问题 2: 前端构建失败

**错误**: `Build failed with errors`

**解决**:
```bash
cd /www/jhchat

# 查看详细错误
npm run build --verbose

# 清理并重建
rm -rf node_modules dist
npm config set registry https://mirrors.cloud.tencent.com/npm/
npm install
npm run build
```

### 问题 3: PM2 服务无法启动

**错误**: 端口被占用

**解决**:
```bash
# 查看端口占用
netstat -tulpn | grep :3001
netstat -tulpn | grep :5173

# 杀死占用进程
kill -9 $(lsof -t -i:3001)
kill -9 $(lsof -t -i:5173)

# 重启 PM2
pm2 restart all
pm2 save
```

### 问题 4: 数据库迁移失败

**错误**: `Table 'system_updates' already exists`

**解决**:
```bash
# 情况 1：表已存在，跳过迁移
echo "表已存在，跳过迁移"

# 情况 2：需要重新创建
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "
DROP TABLE IF EXISTS update_push_logs;
DROP TABLE IF EXISTS system_updates;"

mysql -u jhchat -p'JhChat@2026Secure!' jhchat < /www/games/jhchat/backend/migrations/20260425_create_system_updates_tables.sql
```

### 问题 5: 管理后台 404

**错误**: Nginx 配置问题

**解决**:
```bash
# 检查 Nginx 配置
nginx -t

# 查看 Nginx 日志
tail -f /var/log/nginx/error.log

# 重启 Nginx
systemctl restart nginx
```

### 问题 6: WebSocket 连接失败

**错误**: Socket.IO 无法连接

**解决**:
```bash
# 检查 Nginx Socket.IO 配置
# 确保有以下配置：

location /socket.io {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# 重启 Nginx
systemctl reload nginx
```

---

## 🔄 回滚方案

### 快速回滚

```bash
# 1. 停止服务
pm2 stop all

# 2. 恢复数据库
BACKUP_FILE=$(ls -t /www/backup/jhchat/db_*.sql.gz | head -1)
gunzip -c ${BACKUP_FILE} | mysql -u jhchat -p'JhChat@2026Secure!' jhchat

# 3. 恢复代码
BACKEND_BACKUP=$(ls -dt /www/backup/jhchat/code_*_backend | head -1)
FRONTEND_BACKUP=$(ls -dt /www/backup/jhchat/code_*_frontend | head -1)

rsync -av --delete ${BACKEND_BACKUP}/ /www/wwwroot/jhchat/backend/
rsync -av --delete ${FRONTEND_BACKUP}/ /www/jhchat/

# 4. 重启服务
pm2 restart all
pm2 save

# 5. 验证
pm2 status
```

---

## 📊 监控和维护

### 日常监控命令

```bash
# 查看服务状态
pm2 status

# 查看实时日志
pm2 logs

# 查看资源使用
pm2 monit

# 数据库连接数
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "SHOW STATUS LIKE 'Threads_connected'"

# 系统资源
htop
```

### 日志位置

```bash
# PM2 日志
~/.pm2/logs/

# 应用日志
/www/wwwroot/jhchat/backend/logs/

# Nginx 日志
/var/log/nginx/

# 部署日志
/var/log/jhchat_deploy_*.log
```

### 清理命令

```bash
# 清理 PM2 旧日志
pm2 flush

# 清理 npm 缓存
npm cache clean --force

# 清理系统日志
journalctl --vacuum-time=7d
```

---

## 📞 获取支持

### 文档位置

| 文档 | 路径 |
|------|------|
| 快速开始 | `deployment/QUICK_START.md` |
| 详细部署 | `deployment/DEPLOY_STEPS.md` |
| 更新方案 | `deployment/PRODUCTION_UPDATE_PLAN.md` |
| 功能说明 | `backend/migrations/README_SYSTEM_UPDATES.md` |

### 日志文件

- **部署日志**: `/var/log/jhchat_deploy_*.log`
- **后端日志**: `/www/wwwroot/jhchat/backend/logs/`
- **PM2 日志**: `~/.pm2/logs/`

### 紧急联系

- **技术支持**: [联系方式]
- **运维负责人**: [联系方式]

---

## ✅ 更新成功标准

所有以下条件满足时，更新被认为成功：

- [ ] PM2 服务状态为 `online`
- [ ] 后端健康检查返回 `{"success": true}`
- [ ] 前端页面正常加载
- [ ] 数据库表 `system_updates` 存在且有数据
- [ ] 管理后台可访问
- [ ] 「更新管理」菜单可见
- [ ] 仪表盘显示更新提示
- [ ] 错误日志无异常

---

**祝更新顺利！** 🎉

**最后更新**: 2026-04-25  
**文档版本**: v1.0.2
