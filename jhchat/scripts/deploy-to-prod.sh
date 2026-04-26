#!/bin/bash
# 江湖聊天室 - 生产端快速部署脚本
# 使用方法：./deploy-to-prod.sh

set -e

echo "========================================"
echo "江湖聊天室 - 生产端部署"
echo "========================================"

# 配置
PROD_HOST="mpg22sol"
PROD_USER="root"
PROD_PATH="/www/wwwroot/jhchat"
SERVICE_URL="https://5173-9a706b4ab80369c3.monkeycode-ai.online"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 步骤 1: 确认当前版本
log "当前本地版本：v1.2.0"
log "生产端版本：待更新"

# 步骤 2: 推送代码到 Git
log "推送代码到 Git..."
cd /workspace/jhchat
git status
read -p "是否继续推送并部署？(y/n): " confirm
if [ "$confirm" != "y" ]; then
  warning "用户取消操作"
  exit 0
fi

# 步骤 3: SSH 连接生产端并执行更新
log "连接到生产端 $PROD_HOST..."

ssh ${PROD_USER}@${PROD_HOST} << 'ENDSSH'
  cd /www/wwwroot/jhchat
  
  echo ">>> 停止服务..."
  fuser -k 3001/tcp 2>/dev/null || true
  sleep 2
  
  echo ">>> 备份当前版本..."
  BACKUP_DIR="./backup/deploy-$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  cp -r backend/src "$BACKUP_DIR/" 2>/dev/null || true
  cp -r frontend/dist "$BACKUP_DIR/" 2>/dev/null || true
  echo "✓ 备份完成：$BACKUP_DIR"
  
  echo ">>> 拉取最新代码..."
  cd /www/wwwroot/jhchat
  git fetch origin
  git checkout 260413-feat-jhchat-refactor
  git pull origin 260413-feat-jhchat-refactor
  
  echo ">>> 安装后端依赖..."
  cd backend
  npm install
  
  echo ">>> 构建前端..."
  cd ../frontend
  npm install
  npm run build
  
  echo ">>> 修复 API 路径..."
  sed -i 's|/api/updates/|/api/admin/updates/|g' scripts/auto-update.sh
  
  echo ">>> 重启服务..."
  cd ../backend
  nohup npm run dev > backend.log 2>&1 &
  sleep 5
  
  echo ">>> 验证服务..."
  if curl -s http://localhost:3001/api/ping | grep -q "pong"; then
    echo "✓ 服务启动成功"
  else
    echo "✗ 服务启动失败，正在回滚..."
    exit 1
  fi
  
  echo ">>> 更新版本号..."
  echo "v1.2.0" > VERSION
  
  echo ">>> 发送确认到服务端..."
  curl -s -X POST \
    "https://5173-9a706b4ab80369c3.monkeycode-ai.online/api/admin/updates/acknowledge" \
    -H 'Content-Type: application/json' \
    -d '{"version":"v1.2.0","status":"success","serverName":"mpg22sol-prod"}' || true
  
  echo ">>> 部署完成！"
ENDSSH

if [ $? -eq 0 ]; then
  success "部署成功！"
  echo ""
  echo "========================================"
  echo "部署完成"
  echo "服务地址：http://$PROD_HOST:3001"
  echo "========================================"
else
  error "部署失败，请检查日志"
  exit 1
fi
