#!/bin/bash
# 江湖聊天室 - Git 同步部署脚本
# 适用场景：生产端从 Git 仓库拉取代码并部署
# 使用方法：./git-deploy.sh

set -e

# 配置
GIT_REPO_DIR="/www/wwwroot/games/jhchat"
PROD_DIR="/www/wwwroot/jhchat"
BACKUP_DIR="$PROD_DIR/backup"
LOG_FILE="$PROD_DIR/deploy.log"
BRANCH="260413-feat-jhchat-refactor"
SERVICE_URL="https://5173-9a706b4ab80369c3.monkeycode-ai.online"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"; }
success() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✓${NC} $1" | tee -a "$LOG_FILE"; }
warning() { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠${NC} $1" | tee -a "$LOG_FILE"; }
error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ✗${NC} $1" | tee -a "$LOG_FILE"; }

# 检查磁盘空间
check_disk_space() {
  log "检查磁盘空间..."
  local avail=$(df -P "$PROD_DIR" | tail -1 | awk '{print $4}')
  if [ "$avail" -lt 1048576 ]; then  # 小于 1GB
    error "磁盘空间不足 (可用：${avail}KB)"
    exit 1
  fi
  success "磁盘空间充足 (可用：$((avail/1024))MB)"
}

# 备份当前版本
backup_current() {
  local backup_subdir="$BACKUP_DIR/deploy-$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$backup_subdir"
  
  log "备份当前版本到：$backup_subdir"
  
  if [ -d "$PROD_DIR/backend/src" ]; then
    cp -r "$PROD_DIR/backend/src" "$backup_subdir/" 2>/dev/null || true
  fi
  if [ -d "$PROD_DIR/dist" ]; then
    cp -r "$PROD_DIR/dist" "$backup_subdir/" 2>/dev/null || true
  fi
  if [ -f "$PROD_DIR/VERSION" ]; then
    cp "$PROD_DIR/VERSION" "$backup_subdir/"
  fi
  
  # 保留最近 3 个备份
  cd "$BACKUP_DIR"
  ls -t | tail -n +4 | xargs rm -rf 2>/dev/null || true
  
  success "备份完成"
}

# 停止服务
stop_service() {
  log "停止后端服务..."
  fuser -k 3001/tcp 2>/dev/null || true
  sleep 2
  success "服务已停止"
}

# 拉取 Git 代码
pull_git_code() {
  log "拉取 Git 代码 (分支：$BRANCH)..."
  
  cd "$GIT_REPO_DIR"
  
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
  
  success "代码拉取完成"
}

# 同步代码到生产目录
sync_code() {
  log "同步代码到生产目录..."
  
  rsync -av --delete "$GIT_REPO_DIR/backend/" "$PROD_DIR/backend/"
  rsync -av --delete "$GIT_REPO_DIR/frontend/" "$PROD_DIR/frontend/"
  rsync -av --delete "$GIT_REPO_DIR/scripts/" "$PROD_DIR/scripts/"
  
  success "代码同步完成"
}

# 安装依赖
install_dependencies() {
  log "安装后端依赖..."
  cd "$PROD_DIR/backend"
  npm install --production
  
  log "安装前端依赖..."
  cd "$PROD_DIR/frontend"
  npm install
  
  success "依赖安装完成"
}

# 编译前端
build_frontend() {
  log "编译前端..."
  cd "$PROD_DIR/frontend"
  npm run build
  
  success "前端编译完成"
}

# 修复脚本路径
fix_scripts() {
  log "修复脚本 API 路径..."
  if [ -f "$PROD_DIR/scripts/auto-update.sh" ]; then
    sed -i 's|/api/updates/|/api/admin/updates/|g' "$PROD_DIR/scripts/auto-update.sh"
  fi
  success "脚本修复完成"
}

# 启动服务
start_service() {
  log "启动后端服务..."
  cd "$PROD_DIR/backend"
  nohup npm run dev > backend.log 2>&1 &
  sleep 5
  
  # 验证服务
  if curl -s http://localhost:3001/api/ping | grep -q "pong"; then
    success "服务启动成功"
  else
    error "服务启动失败，准备回滚..."
    rollback
    exit 1
  fi
}

# 回滚
rollback() {
  local latest_backup=$(ls -t "$BACKUP_DIR" 2>/dev/null | head -1)
  
  if [ -z "$latest_backup" ]; then
    error "没有可用备份，无法回滚"
    return 1
  fi
  
  warning "正在回滚到：$latest_backup"
  
  stop_service
  
  if [ -d "$BACKUP_DIR/$latest_backup/backend/src" ]; then
    cp -r "$BACKUP_DIR/$latest_backup/backend/src"/* "$PROD_DIR/backend/src/"
  fi
  if [ -d "$BACKUP_DIR/$latest_backup/dist" ]; then
    rm -rf "$PROD_DIR/dist"
    cp -r "$BACKUP_DIR/$latest_backup/dist" "$PROD_DIR/"
  fi
  
  start_service
  
  success "回滚完成"
}

# 发送确认
acknowledge() {
  local version="$1"
  
  log "发送更新确认到服务端..."
  curl -s -X POST "$SERVICE_URL/api/admin/updates/acknowledge" \
    -H 'Content-Type: application/json' \
    -d "{\"version\":\"$version\",\"status\":\"success\",\"serverName\":\"mpg22sol-prod\"}" > /dev/null || true
  
  success "确认发送完成"
}

# 主函数
main() {
  echo "========================================"
  echo "江湖聊天室 - Git 同步部署"
  echo "Git 仓库：$GIT_REPO_DIR"
  echo "生产目录：$PROD_DIR"
  echo "分支：$BRANCH"
  echo "========================================"
  echo ""
  
  # 1. 检查磁盘空间
  check_disk_space
  
  # 2. 备份当前版本
  backup_current
  
  # 3. 停止服务
  stop_service
  
  # 4. 拉取代码
  pull_git_code
  
  # 5. 同步代码
  sync_code
  
  # 6. 安装依赖
  install_dependencies
  
  # 7. 编译前端
  build_frontend
  
  # 8. 修复脚本
  fix_scripts
  
  # 9. 启动服务
  start_service
  
  # 10. 更新版本号
  cd "$PROD_DIR"
  local new_version=$(git -C "$GIT_REPO_DIR" describe --tags --always 2>/dev/null || echo "v1.2.0")
  echo "$new_version" > VERSION
  success "版本号已更新：$new_version"
  
  # 11. 发送确认
  acknowledge "$new_version"
  
  echo ""
  echo "========================================"
  success "部署完成！"
  echo "服务地址：http://localhost:3001"
  echo "日志文件：$LOG_FILE"
  echo "========================================"
}

# 执行
main "$@"
