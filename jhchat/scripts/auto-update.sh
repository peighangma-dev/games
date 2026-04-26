#!/bin/bash

# 江湖聊天室 - 一键自动更新脚本
# 使用方法：./auto-update.sh [服务器名称]

set -e

# 配置
ADMIN_URL="https://5173-9a706b4ab80369c3.monkeycode-ai.online"
CURRENT_VERSION_FILE="./VERSION"
UPDATE_PACKAGE_DIR="./update-packages"
LOG_FILE="./auto-update.log"
SERVER_NAME="${1:-production-server}"
BACKUP_DIR="./backup"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
  echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
  echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✓${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
  echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠${NC} $1" | tee -a "$LOG_FILE"
}

error() {
  echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ✗${NC} $1" | tee -a "$LOG_FILE"
}

# 获取当前版本
get_current_version() {
  if [ -f "$CURRENT_VERSION_FILE" ]; then
    cat "$CURRENT_VERSION_FILE"
  else
    echo "v1.0.0"
  fi
}

# 检查更新
check_updates() {
  local current_version="$1"
  
  log "正在检查更新 (当前版本：$current_version)..."
  
  local response
  response=$(curl -s -w "\n%{http_code}" \
    "${ADMIN_URL}/api/admin/updates/check?currentVersion=${current_version}&serverName=${SERVER_NAME}")
  
  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | head -n -1)
  
  if [ "$http_code" != "200" ]; then
    error "检查更新失败 (HTTP $http_code)"
    return 1
  fi
  
  local has_update=$(echo "$body" | jq -r '.data.hasUpdate')
  
  if [ "$has_update" = "true" ]; then
    local latest_version=$(echo "$body" | jq -r '.data.updates[-1].version')
    local title=$(echo "$body" | jq -r '.data.updates[-1].title')
    local force_update=$(echo "$body" | jq -r '.data.updates[-1].forceUpdate')
    
    success "发现新版本！"
    echo "  版本：$latest_version"
    echo "  标题：$title"
    
    if [ "$force_update" = "true" ]; then
      warning "⚠️  这是强制更新！"
    fi
    
    # 下载更新
    download_update "$latest_version"
    
    # 安装更新
    install_update "$latest_version"
    
    # 确认更新
    acknowledge_update "$latest_version" "success"
  else
    success "已是最新版本"
  fi
}

# 下载更新包
download_update() {
  local version="$1"
  
  log "正在下载更新包 $version..."
  
  mkdir -p "$UPDATE_PACKAGE_DIR"
  
  local package_file="${UPDATE_PACKAGE_DIR}/update-${version}.tar.gz"
  
  curl -L -o "$package_file" \
    "${ADMIN_URL}/api/admin/updates/download/${version}" \
    --progress-bar
  
  success "下载完成：$package_file"
}

# 安装更新
install_update() {
  local version="$1"
  
  log "正在安装更新 $version..."
  
  local package_file="${UPDATE_PACKAGE_DIR}/update-${version}.tar.gz"
  
  # 创建临时目录
  local temp_dir=$(mktemp -d)
  
  # 解压更新包
  tar -xzf "$package_file" -C "$temp_dir"
  
  # 备份当前版本
  local backup_subdir="${BACKUP_DIR}/update-$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$backup_subdir"
  
  if [ -d "backend/src" ]; then
    cp -r backend/src "$backup_subdir/" 2>/dev/null || true
  fi
  if [ -d "frontend/src" ]; then
    cp -r frontend/src "$backup_subdir/" 2>/dev/null || true
  fi
  cp "$CURRENT_VERSION_FILE" "$backup_subdir/" 2>/dev/null || true
  
  success "备份完成：$backup_subdir"
  
  # 停止服务
  log "停止服务..."
  fuser -k 3001/tcp 2>/dev/null || true
  sleep 2
  
  # 应用更新
  log "应用更新..."
  local update_content_dir="$temp_dir/update-${version}"
  
  if [ -d "$update_content_dir/backend/src" ]; then
    cp -r "$update_content_dir/backend/src"/* backend/src/ 2>/dev/null || true
    log "已更新后端代码"
  fi
  
  if [ -d "$update_content_dir/frontend/src" ]; then
    cp -r "$update_content_dir/frontend/src"/* frontend/src/ 2>/dev/null || true
    log "已更新前端代码"
  fi
  
  if [ -d "$update_content_dir/migrations" ]; then
    log "执行数据库迁移..."
    for migration in "$update_content_dir/migrations"/*.sql; do
      if [ -f "$migration" ]; then
        mysql -u jhchat -p'JhChat@2026Secure!' jhchat < "$migration"
        log "执行迁移：$(basename $migration)"
      fi
    done
  fi
  
  # 重启服务
  log "重启服务..."
  cd backend && nohup npm run dev > backend.log 2>&1 &
  cd ..
  
  sleep 5
  
  # 验证服务
  if curl -s http://localhost:3001/api/ping | grep -q "pong"; then
    success "服务重启成功"
  else
    error "服务重启失败！"
    warning "正在回滚..."
    rollback "$backup_subdir"
    return 1
  fi
  
  # 更新版本号
  echo "$version" > "$CURRENT_VERSION_FILE"
  
  # 清理临时文件
  rm -rf "$temp_dir"
  
  success "更新完成！当前版本：$version"
}

# 回滚
rollback() {
  local backup_dir="$1"
  
  error "正在回滚到备份版本..."
  
  # 停止服务
  fuser -k 3001/tcp 2>/dev/null || true
  sleep 2
  
  # 恢复备份
  if [ -d "$backup_dir/backend/src" ]; then
    cp -r "$backup_dir/backend/src"/* backend/src/ 2>/dev/null || true
  fi
  if [ -d "$backup_dir/frontend/src" ]; then
    cp -r "$backup_dir/frontend/src"/* frontend/src/ 2>/dev/null || true
  fi
  if [ -f "$backup_dir/VERSION" ]; then
    cp "$backup_dir/VERSION" "$CURRENT_VERSION_FILE"
  fi
  
  # 重启服务
  cd backend && nohup npm run dev > backend.log 2>&1 &
  cd ..
  sleep 5
  
  if curl -s http://localhost:3001/api/ping | grep -q "pong"; then
    success "回滚成功"
  else
    error "回滚失败！请手动处理"
    exit 1
  fi
}

# 确认更新
acknowledge_update() {
  local version="$1"
  local status="$2"
  
  log "发送更新确认..."
  
  curl -s -X POST "${ADMIN_URL}/api/admin/updates/acknowledge" \
    -H "Content-Type: application/json" \
    -d "{
      \"version\": \"$version\",
      \"status\": \"$status\",
      \"serverName\": \"$SERVER_NAME\"
    }" > /dev/null || true
  
  success "确认发送完成"
}

# 显示帮助
show_help() {
  echo "江湖聊天室 - 自动更新脚本"
  echo ""
  echo "使用方法:"
  echo "  $0 [选项] [服务器名称]"
  echo ""
  echo "选项:"
  echo "  -h, --help     显示帮助信息"
  echo "  -f, --force    强制检查更新（即使已是最新版本）"
  echo "  -r, --rollback 执行回滚到上一个备份"
  echo "  -v, --version  显示当前版本"
  echo ""
  echo "示例:"
  echo "  $0                      # 检查并安装更新"
  echo "  $0 production-server    # 指定服务器名称"
  echo "  $0 --version            # 查看当前版本"
  echo "  $0 --rollback           # 回滚到备份版本"
  echo ""
}

# 主函数
main() {
  echo "========================================"
  echo "江湖聊天室 - 自动更新"
  echo "服务端：${ADMIN_URL}"
  echo "服务器：${SERVER_NAME}"
  echo "========================================"
  echo ""
  
  # 解析参数
  while [[ $# -gt 0 ]]; do
    case $1 in
      -h|--help)
        show_help
        exit 0
        ;;
      -f|--force)
        FORCE_CHECK=true
        shift
        ;;
      -r|--rollback)
        # 回滚到最新备份
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR" 2>/dev/null | head -1)
        if [ -n "$LATEST_BACKUP" ]; then
          rollback "${BACKUP_DIR}/${LATEST_BACKUP}"
        else
          error "没有找到备份"
          exit 1
        fi
        exit 0
        ;;
      -v|--version)
        echo "当前版本：$(get_current_version)"
        exit 0
        ;;
      *)
        SERVER_NAME="$1"
        shift
        ;;
    esac
  done
  
  local current_version=$(get_current_version)
  log "当前版本：$current_version"
  
  check_updates "$current_version"
  
  echo ""
  echo "========================================"
  echo "更新完成"
  echo "日志：$LOG_FILE"
  echo "========================================"
}

# 执行
main "$@"
