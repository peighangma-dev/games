# 生产端更新命令 (复制即用)

**服务器**: root@mpg22sol  
**Git 路径**: /www/wwwroot/games  
**生产路径**: /www/wwwroot/jhchat

---

## 快速更新流程

```bash
# 1. SSH 登录生产端
ssh root@mpg22sol

# 2. 进入 Git 仓库目录
cd /www/wwwroot/games

# 3. 拉取最新代码
git fetch origin
git checkout 260413-feat-jhchat-refactor
git pull origin 260413-feat-jhchat-refactor

# 4. 备份生产环境
cd /www/wwwroot/jhchat
BACKUP_DIR="./backup/deploy-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r backend/src "$BACKUP_DIR/" 2>/dev/null || true
cp -r dist "$BACKUP_DIR/dist" 2>/dev/null || true
cp VERSION "$BACKUP_DIR/" 2>/dev/null || true
echo "✓ 备份完成：$BACKUP_DIR"

# 5. 停止后端服务
fuser -k 3001/tcp 2>/dev/null || true
sleep 2

# 6. 同步代码到生产目录
rsync -av /www/wwwroot/games/backend/ /www/wwwroot/jhchat/backend/
rsync -av /www/wwwroot/games/frontend/ /www/wwwroot/jhchat/frontend/
rsync -av /www/wwwroot/games/scripts/ /www/wwwroot/jhchat/scripts/

# 7. 安装后端依赖
cd /www/wwwroot/jhchat/backend
npm install

# 8. 编译前端
cd /www/wwwroot/jhchat/frontend
npm install
npm run build

# 9. 修复脚本 API 路径
cd /www/wwwroot/jhchat
sed -i 's|/api/updates/|/api/admin/updates/|g' scripts/auto-update.sh 2>/dev/null || true

# 10. 启动后端服务
cd /www/wwwroot/jhchat/backend
nohup npm run dev > backend.log 2>&1 &
sleep 5

# 11. 验证服务
curl http://localhost:3001/api/ping

# 12. 更新版本号
echo "v1.2.0" > /www/wwwroot/jhchat/VERSION

# 13. 发送确认到服务端
curl -s -X POST \
  "https://5173-9a706b4ab80369c3.monkeycode-ai.online/api/admin/updates/acknowledge" \
  -H 'Content-Type: application/json' \
  -d '{"version":"v1.2.0","status":"success","serverName":"mpg22sol-prod"}'

# 14. 查看服务状态
curl http://localhost:3001/api/server-info
lsof -i :3001
echo "✓ 更新完成！"
```

---

## 一键部署脚本

```bash
#!/bin/bash
set -e
echo "========================================"
echo "江湖聊天室 - 生产端部署"
echo "========================================"

# 停止服务
fuser -k 3001/tcp 2>/dev/null || true
sleep 2

# 备份
BACKUP_DIR="/www/wwwroot/jhchat/backup/deploy-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r /www/wwwroot/jhchat/backend/src "$BACKUP_DIR/" 2>/dev/null || true
cp -r /www/wwwroot/jhchat/dist "$BACKUP_DIR/" 2>/dev/null || true

# 拉取代码
cd /www/wwwroot/games
git fetch origin
git checkout 260413-feat-jhchat-refactor
git pull origin 260413-feat-jhchat-refactor

# 同步
rsync -av backend/ /www/wwwroot/jhchat/backend/
rsync -av frontend/ /www/wwwroot/jhchat/frontend/
rsync -av scripts/ /www/wwwroot/jhchat/scripts/

# 安装依赖
cd /www/wwwroot/jhchat/backend && npm install
cd /www/wwwroot/jhchat/frontend && npm install && npm run build

# 启动
cd /www/wwwroot/jhchat/backend
nohup npm run dev > backend.log 2>&1 &
sleep 5

# 验证
curl http://localhost:3001/api/ping || { echo "服务启动失败"; exit 1; }

# 完成
echo "v1.2.0" > /www/wwwroot/jhchat/VERSION
echo "✓ 部署完成"
```

---

## 回滚命令

```bash
# 停止服务
fuser -k 3001/tcp 2>/dev/null || true
sleep 2

# 选择备份
cd /www/wwwroot/jhchat/backup
LATEST_BACKUP=$(ls -t | head -1)

# 恢复
cp -r "$LATEST_BACKUP/backend-src"/* /www/wwwroot/jhchat/backend/src/
cp -r "$LATEST_BACKUP/dist"/* /www/wwwroot/jhchat/dist/

# 重启
cd /www/wwwroot/jhchat/backend
nohup npm run dev > backend.log 2>&1 &
sleep 5

# 验证
curl http://localhost:3001/api/ping
echo "✓ 回滚完成"
```

---

## 常用检查命令

```bash
# 查看版本
cat /www/wwwroot/jhchat/VERSION

# 检查服务
curl http://localhost:3001/api/ping
lsof -i :3001

# 查看日志
tail -20 /www/wwwroot/jhchat/backend/backend.log
tail -20 /www/wwwroot/jhchat/auto-update.log

# 查看 Git 状态
cd /www/wwwroot/games && git status
git log --oneline -5
```
