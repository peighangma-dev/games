#!/bin/bash

# ========================================
# 生产端一键更新安装脚本
# ========================================
# 使用方法:
#   ./install-update.sh <admin_url> [current_version]
# 示例:
#   ./install-update.sh https://admin.example.com v1.0.0
# ========================================

set -e

# 配置
ADMIN_URL="${1:-}"
CURRENT_VERSION="${2:-v1.0.0}"
WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$WORKSPACE_ROOT/backups"
DOWNLOAD_DIR="$WORKSPACE_ROOT/downloads"
LOG_FILE="$WORKSPACE_ROOT/update-install-$(date +%Y%m%d-%H%M%S).log"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log() {
  local level=$1
  shift
  local message="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

info() { log "INFO" "$@"; }
warn() { log "${YELLOW}WARN${NC}" "$@"; }
error() { log "${RED}ERROR${NC}" "$@"; }
success() { log "${GREEN}SUCCESS${NC}" "$@"; }

# 检查参数
if [ -z "$ADMIN_URL" ]; then
  echo "用法：$0 <admin_url> [current_version]"
  echo "示例：$0 https://admin.example.com v1.0.0"
  exit 1
fi

# 移除尾随斜杠
ADMIN_URL="${ADMIN_URL%/}"

info "========================================="
info "开始执行一键更新安装"
info "========================================="
info "管理后台地址：$ADMIN_URL"
info "当前版本：$CURRENT_VERSION"
info "日志文件：$LOG_FILE"
info ""

# 创建必要目录
mkdir -p "$BACKUP_DIR"
mkdir -p "$DOWNLOAD_DIR"

# 步骤 1: 检查更新
info "步骤 1: 检查可用更新..."
CHECK_RESPONSE=$(curl -s -f "$ADMIN_URL/api/updates/available?currentVersion=$CURRENT_VERSION" || echo '{"success":false,"error":"network_error"}')

HAS_UPDATE=$(echo "$CHECK_RESPONSE" | jq -r '.data.hasUpdate // false')

if [ "$HAS_UPDATE" != "true" ]; then
  info "✅ 无需更新，已是最新版本"
  exit 0
fi

# 获取更新信息
UPDATE_COUNT=$(echo "$CHECK_RESPONSE" | jq -r '.data.updates | length')
info "发现 $UPDATE_COUNT 个可用更新"

# 获取最新更新版本
LATEST_UPDATE=$(echo "$CHECK_RESPONSE" | jq -r '.data.updates[-1]')
UPDATE_ID=$(echo "$LATEST_UPDATE" | jq -r '.id')
NEW_VERSION=$(echo "$LATEST_UPDATE" | jq -r '.version')
UPDATE_TITLE=$(echo "$LATEST_UPDATE" | jq -r '.title')
PACKAGE_URL=$(echo "$LATEST_UPDATE" | jq -r '.package.download_url')
PACKAGE_HASH=$(echo "$LATEST_UPDATE" | jq -r '.package.hash')
PACKAGE_SIZE=$(echo "$LATEST_UPDATE" | jq -r '.package.size')

info ""
info "最新更新信息:"
info "  版本：$NEW_VERSION"
info "  标题：$UPDATE_TITLE"
info "  包大小：$((PACKAGE_SIZE / 1024)) KB"
info ""

# 步骤 2: 备份当前版本
info "步骤 2: 备份当前版本..."
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# 备份 jhchat 目录
if [ -d "$WORKSPACE_ROOT/jhchat" ]; then
  tar -czf "$BACKUP_PATH" -C "$WORKSPACE_ROOT" jhchat 2>/dev/null
  info "✅ 备份完成：$BACKUP_PATH"
else
  warn "⚠️  jhchat 目录不存在，跳过备份"
fi

# 步骤 3: 下载更新包
info "步骤 3: 下载更新包..."
DOWNLOAD_FILE="$DOWNLOAD_DIR/update-$NEW_VERSION.zip"

curl -L -f -o "$DOWNLOAD_FILE" \
  -H "X-Update-Client: production-install-script" \
  "$PACKAGE_URL"

if [ $? -ne 0 ]; then
  error "❌ 下载更新包失败"
  exit 1
fi

info "✅ 下载完成：$DOWNLOAD_FILE"

# 验证文件哈希
info "验证文件完整性..."
DOWNLOAD_HASH=$(sha256sum "$DOWNLOAD_FILE" | cut -d' ' -f1)

if [ "$DOWNLOAD_HASH" != "$PACKAGE_HASH" ]; then
  error "❌ 文件哈希不匹配!"
  error "  预期：$PACKAGE_HASH"
  error "  实际：$DOWNLOAD_HASH"
  # 恢复备份
  if [ -f "$BACKUP_PATH" ]; then
    info "正在恢复备份..."
    tar -xzf "$BACKUP_PATH" -C "$WORKSPACE_ROOT"
  fi
  exit 1
fi

info "✅ 文件完整性验证通过"

# 步骤 4: 解压更新包
info "步骤 4: 解压更新包..."
UNPACK_DIR="$DOWNLOAD_DIR/unpack-$$"
mkdir -p "$UNPACK_DIR"

unzip -q -o "$DOWNLOAD_FILE" -d "$UNPACK_DIR"

if [ $? -ne 0 ]; then
  error "❌ 解压更新包失败"
  exit 1
fi

info "✅ 解压完成"

# 步骤 5: 安装更新
info "步骤 5: 安装更新..."

# 复制文件到目标位置
if [ -d "$UNPACK_DIR/jhchat" ]; then
  # 停止服务
  info "停止当前服务..."
  pkill -f "node.*server.js" 2>/dev/null || true
  sleep 2
  
  # 复制文件
  info "复制更新文件..."
  cp -rf "$UNPACK_DIR/jhchat"/* "$WORKSPACE_ROOT/jhchat/"
  
  info "✅ 文件复制完成"
  
  # 安装依赖（如果有 package.json）
  if [ -f "$WORKSPACE_ROOT/jhchat/backend/package.json" ]; then
    info "安装后端依赖..."
    cd "$WORKSPACE_ROOT/jhchat/backend"
    npm install --production 2>&1 | tee -a "$LOG_FILE"
  fi
  
  # 执行数据库更新（如果有）
  if [ -f "$WORKSPACE_ROOT/jhchat/database/updates_table.sql" ]; then
    info "执行数据库更新..."
    source "$WORKSPACE_ROOT/jhchat/backend/.env" 2>/dev/null || true
    mysql -h"${DB_HOST:-localhost}" -u"${DB_USER:-jhchat}" -p"${DB_PASSWORD}" "$DB_NAME" \
      < "$WORKSPACE_ROOT/jhchat/database/updates_table.sql" 2>&1 | tee -a "$LOG_FILE"
    info "✅ 数据库更新完成"
  fi
  
  # 启动服务
  info "启动服务..."
  cd "$WORKSPACE_ROOT/jhchat/backend"
  nohup node src/server.js > /tmp/backend.log 2>&1 &
  sleep 3
  
  # 检查服务是否正常启动
  if curl -s http://localhost:3001/api/ping | grep -q "pong"; then
    success "✅ 服务启动成功"
  else
    error "❌ 服务启动失败，正在回滚..."
    # 回滚
    cd "$WORKSPACE_ROOT"
    tar -xzf "$BACKUP_PATH" -C "$WORKSPACE_ROOT"
    cd "$WORKSPACE_ROOT/jhchat/backend"
    nohup node src/server.js > /tmp/backend.log 2>&1 &
    error "已回滚到版本 $CURRENT_VERSION"
    exit 1
  fi
else
  warn "⚠️  更新包中没有 jhchat 目录"
fi

# 清理临时文件
info "清理临时文件..."
rm -rf "$UNPACK_DIR"

# 步骤 6: 报告安装状态
info "步骤 6: 报告安装状态..."
INSTALL_RESPONSE=$(curl -s -X POST "$ADMIN_URL/api/updates/$UPDATE_ID/install" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "success",
    "server_url": "'$(hostname)':3001",
    "installed_by": "auto-update-script"
  }')

if echo "$INSTALL_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  info "✅ 安装状态已报告"
else
  warn "⚠️  报告安装状态失败（非致命）"
fi

# 完成
info ""
success "========================================="
success "更新安装完成!"
success "========================================="
info "从版本 $CURRENT_VERSION 更新到 $NEW_VERSION"
info "备份文件：$BACKUP_PATH"
info "日志文件：$LOG_FILE"
info ""

# 显示更新内容
echo "更新内容:"
echo "$LATEST_UPDATE" | jq -r '.title'
echo ""

exit 0
