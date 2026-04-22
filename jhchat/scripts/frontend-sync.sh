#!/bin/bash

###############################################################################
# 江湖聊天室 - 前端文件同步脚本
# 用途：构建前端并同步到 Web 目录
###############################################################################

set -e

# 配置
PROJECT_ROOT="/workspace/jhchat"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
WEB_DEPLOY_DIR="/var/www/jhchat"
BACKUP_DIR="/backup/jhchat/web"
DATE=$(date +%Y%m%d_%H%M%S)

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "\n${BLUE}====== $1 ======${NC}\n"; }

# 检查 Node.js
check_node() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    log_info "Node.js 版本：$(node -v)"
}

# 构建前端
build() {
    log_step "构建前端"
    
    cd "$FRONTEND_DIR"
    
    # 清理 node_modules（可选）
    # rm -rf node_modules
    
    # 安装依赖
    log_info "安装依赖..."
    npm install --production
    
    # 构建
    log_info "构建项目..."
    npm run build
    
    log_info "构建完成"
    
    # 显示构建产物大小
    log_info "构建产物:"
    ls -lh "$FRONTEND_DIR/dist" | tail -n +2
}

# 备份当前部署
backup() {
    log_step "备份当前 Web 文件"
    
    mkdir -p "$BACKUP_DIR"
    
    if [ -d "$WEB_DEPLOY_DIR" ] && [ "$(ls -A $WEB_DEPLOY_DIR)" ]; then
        BACKUP_FILE="$BACKUP_DIR/web_backup_$DATE.tar.gz"
        tar -czf "$BACKUP_FILE" -C "$(dirname $WEB_DEPLOY_DIR)" "$(basename $WEB_DEPLOY_DIR)"
        log_info "已备份：$BACKUP_FILE"
        
        # 保留最近 7 个备份
        cd "$BACKUP_DIR"
        ls -t web_backup_*.tar.gz | tail -n +8 | xargs -r rm -v
    else
        log_info "首次部署，无需备份"
    fi
}

# 同步到 Web 目录
sync() {
    log_step "同步到 Web 目录"
    
    DEST="$1"
    
    if [ -z "$DEST" ]; then
        DEST="$WEB_DEPLOY_DIR"
    fi
    
    # 创建目录
    mkdir -p "$DEST"
    
    # 清理
    log_info "清理目标目录..."
    rm -rf "$DEST"/*
    
    # 复制文件
    log_info "复制构建产物..."
    cp -r "$FRONTEND_DIR/dist/"* "$DEST/"
    
    # 设置权限
    log_info "设置权限..."
    chown -R www-data:www-data "$DEST" 2>/dev/null || true
    chmod -R 755 "$DEST"
    
    log_info "同步完成：$DEST"
}

# 增量同步（rsync）
sync_incremental() {
    local DEST="$1"
    
    if [ -z "$DEST" ]; then
        DEST="$WEB_DEPLOY_DIR"
    fi
    
    log_step "增量同步到 Web 目录"
    
    if ! command -v rsync &> /dev/null; then
        log_warn "rsync 未安装，使用普通复制"
        sync "$DEST"
        return
    fi
    
    mkdir -p "$DEST"
    
    log_info "增量同步..."
    rsync -avz --delete \
        --exclude '*.log' \
        "$FRONTEND_DIR/dist/" "$DEST/"
    
    # 设置权限
    chown -R www-data:www-data "$DEST" 2>/dev/null || true
    chmod -R 755 "$DEST"
    
    log_info "增量同步完成"
}

# 清理缓存
clear_cache() {
    log_step "清理缓存"
    
    cd "$FRONTEND_DIR"
    
    # 清理 npm 缓存
    # npm cache clean --force
    
    # 清理构建缓存
    rm -rf .vite 2>/dev/null || true
    rm -rf node_modules/.cache 2>/dev/null || true
    
    log_info "缓存已清理"
}

# 验证部署
verify() {
    log_step "验证部署"
    
    log_info "检查文件完整性..."
    
    REQUIRED_FILES=(
        "index.html"
        "assets"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ -e "$WEB_DEPLOY_DIR/$file" ]; then
            log_info "✓ $file 存在"
        else
            log_error "✗ $file 缺失"
            exit 1
        fi
    done
    
    log_info "验证通过"
}

# 重启 Nginx（如果需要）
restart_nginx() {
    log_step "重启 Nginx"
    
    if command -v systemctl &> /dev/null; then
        if systemctl is-active --quiet nginx; then
            systemctl reload nginx
            log_info "Nginx 已重新加载"
        else
            log_warn "Nginx 未运行"
        fi
    else
        log_warn "systemctl 不可用"
    fi
}

# 显示用法
show_help() {
    echo "江湖聊天室 - 前端构建和同步脚本"
    echo ""
    echo "用法：$0 <命令> [参数]"
    echo ""
    echo "命令:"
    echo "  build              构建前端"
    echo "  sync [目录]        同步到 Web 目录（默认：$WEB_DEPLOY_DIR）"
    echo "  sync-rsync [目录]  使用 rsync 增量同步"
    echo "  backup             备份当前部署"
    echo "  verify             验证部署完整性"
    echo "  deploy             完整部署流程（build + backup + sync + verify）"
    echo "  clear-cache        清理缓存"
    echo "  help               显示帮助"
    echo ""
    echo "示例:"
    echo "  $0 build                  # 仅构建"
    echo "  $0 deploy                 # 完整部署"
    echo "  $0 sync /path/to/www     # 同步到指定目录"
}

# 主逻辑
check_node

case "${1:-deploy}" in
    build)
        build
        ;;
    backup)
        backup
        ;;
    sync)
        sync "$2"
        ;;
    sync-rsync)
        sync_incremental "$2"
        ;;
    verify)
        verify
        ;;
    deploy)
        log_step "前端部署流程"
        build
        backup
        sync "$2"
        verify
        restart_nginx
        log_info "部署完成！"
        ;;
    clear-cache)
        clear_cache
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        exit 1
        ;;
esac
