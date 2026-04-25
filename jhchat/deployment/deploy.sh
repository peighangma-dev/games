#!/bin/bash

#===============================================================================
# 江湖聊天室 - 生产环境自动部署脚本
# 版本：v1.0.2
# 用途：自动化部署系统更新管理功能
#===============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==================== 目录配置（请确认后执行） ====================
REPO_DIR="/www/games/jhchat"           # Git 仓库目录
BACKEND_DIR="/www/wwwroot/jhchat/backend"  # 后端运行目录
FRONTEND_DIR="/www/jhchat"              # 前端运行目录
BACKUP_DIR="/www/backup/jhchat"         # 备份目录
LOG_FILE="/var/log/jhchat_deploy_$(date +%Y%m%d_%H%M%S).log"
BRANCH_NAME="260413-feat-jhchat-refactor"
TARGET_VERSION="v1.0.1"

# 数据库配置
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-jhchat}"
DB_PASSWORD="${DB_PASSWORD:-JhChat@2026Secure!}"
DB_NAME="${DB_NAME:-jhchat}"

# ==================== 函数定义 ====================

log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

info() { log "${BLUE}INFO${NC}" "$1"; }
success() { log "${GREEN}SUCCESS${NC}" "$1"; }
warn() { log "${YELLOW}WARN${NC}" "$1"; }
error() { log "${RED}ERROR${NC}" "$1"; }

handle_error() {
    local exit_code=$?
    error "部署执行失败，退出码：${exit_code}"
    error "详细日志请查看：${LOG_FILE}"
    echo ""
    echo "${RED}==================== 回滚建议 ====================${NC}"
    echo "1. 恢复代码：rsync -av ${BACKUP_DIR}/code_*/ ${BACKEND_DIR}/../"
    echo "2. 恢复数据库：mysql -u ${DB_USER} -p ${DB_NAME} < ${BACKUP_DIR}/db_*.sql"
    echo "3. 重启服务：pm2 restart all"
    echo "${RED}=================================================${NC}"
    exit ${exit_code}
}

trap handle_error ERR

check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "请使用 root 权限运行此脚本"
        exit 1
    fi
}

check_prerequisites() {
    info "检查环境依赖..."
    
    command -v git &> /dev/null || { error "git 未安装"; exit 1; }
    command -v node &> /dev/null || { error "Node.js 未安装"; exit 1; }
    command -v npm &> /dev/null || { error "npm 未安装"; exit 1; }
    command -v mysql &> /dev/null || { error "MySQL 客户端未安装"; exit 1; }
    command -v mysqldump &> /dev/null || { error "mysqldump 未安装"; exit 1; }
    
    if command -v pm2 &> /dev/null; then
        PM2_AVAILABLE=true
        info "✓ 检测到 PM2"
    else
        PM2_AVAILABLE=false
        warn "未检测到 PM2"
    fi
    
    success "环境检查通过"
}

create_dirs() {
    info "创建必要目录..."
    mkdir -p "${BACKUP_DIR}"
    mkdir -p "$(dirname ${LOG_FILE})"
    mkdir -p "${REPO_DIR}"
    success "目录创建完成"
}

backup_database() {
    local backup_file="${BACKUP_DIR}/db_$(date +%Y%m%d_%H%M%S).sql"
    info "备份数据库：${backup_file}"
    
    mysqldump -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" > "${backup_file}" 2>&1
    
    if [ -f "${backup_file}" ] && [ -s "${backup_file}" ]; then
        gzip "${backup_file}"
        success "数据库备份完成：${backup_file}.gz"
    else
        error "数据库备份失败"
        exit 1
    fi
}

backup_code() {
    local backup_path="${BACKUP_DIR}/code_$(date +%Y%m%d_%H%M%S)"
    info "备份现有代码..."
    
    if [ -d "${BACKEND_DIR}" ]; then
        cp -r "${BACKEND_DIR}" "${backup_path}_backend"
        success "后端代码已备份：${backup_path}_backend"
    fi
    
    if [ -d "${FRONTEND_DIR}" ]; then
        cp -r "${FRONTEND_DIR}" "${backup_path}_frontend"
        success "前端代码已备份：${backup_path}_frontend"
    fi
}

update_repo() {
    info "更新 Git 仓库代码..."
    
    if [ ! -d "${REPO_DIR}/.git" ]; then
        info "初始化 Git 仓库..."
        cd "${REPO_DIR}"
        git init
        git remote add origin https://github.com/peighangma-dev/games.git
        git fetch origin "${BRANCH_NAME}"
        git checkout -t origin/"${BRANCH_NAME}"
    else
        cd "${REPO_DIR}"
        git fetch origin
        git checkout "${BRANCH_NAME}"
        git pull origin "${BRANCH_NAME}"
    fi
    
    success "代码更新完成"
    cd "${REPO_DIR}"
    git log --oneline -1
}

sync_backend() {
    info "同步后端代码到 ${BACKEND_DIR}..."
    
    # 创建目录（如果不存在）
    mkdir -p "${BACKEND_DIR}"
    
    # 使用 rsync 同步（排除不需要的文件）
    rsync -av --delete \
        --exclude 'node_modules' \
        --exclude 'logs/*' \
        --exclude 'uploads/*' \
        --exclude '.env.local' \
        "${REPO_DIR}/backend/" "${BACKEND_DIR}/"
    
    success "后端代码同步完成"
}

sync_frontend() {
    info "同步前端代码到 ${FRONTEND_DIR}..."
    
    mkdir -p "${FRONTEND_DIR}"
    
    rsync -av --delete \
        --exclude 'node_modules' \
        --exclude 'dist' \
        "${REPO_DIR}/frontend/" "${FRONTEND_DIR}/"
    
    success "前端代码同步完成"
}

install_backend_deps() {
    info "安装后端依赖..."
    cd "${BACKEND_DIR}"
    npm install --production
    success "后端依赖安装完成"
}

install_frontend_deps() {
    info "安装前端依赖..."
    cd "${FRONTEND_DIR}"
    npm install
    success "前端依赖安装完成"
}

build_frontend() {
    info "构建前端..."
    cd "${FRONTEND_DIR}"
    npm run build
    
    if [ -d "dist" ]; then
        success "前端构建成功"
    else
        error "前端构建失败"
        exit 1
    fi
}

run_migration() {
    local migration_file="${BACKEND_DIR}/migrations/20260425_create_system_updates_tables.sql"
    
    if [ ! -f "${migration_file}" ]; then
        error "迁移脚本不存在：${migration_file}"
        exit 1
    fi
    
    info "执行数据库迁移..."
    mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" < "${migration_file}" 2>&1
    
    success "数据库迁移完成"
}

verify_migration() {
    info "验证数据库迁移..."
    
    local table_exists=$(mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" \
        -N -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='${DB_NAME}' AND TABLE_NAME='system_updates'" "${DB_NAME}" 2>&1 | grep -v Warning)
    
    if [ "${table_exists}" -eq 1 ]; then
        success "✓ system_updates 表已创建"
    else
        error "system_updates 表创建失败"
        exit 1
    fi
    
    local data_count=$(mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" \
        -N -e "SELECT COUNT(*) FROM system_updates" "${DB_NAME}" 2>&1 | grep -v Warning)
    
    info "system_updates 表中有 ${data_count} 条记录"
}

stop_services() {
    info "停止现有服务..."
    
    if [ "${PM2_AVAILABLE}" = true ]; then
        pm2 stop jhchat-backend 2>/dev/null || true
        pm2 stop jhchat-frontend 2>/dev/null || true
        pm2 save
        success "服务已停止（PM2）"
    else
        pkill -f "node.*server.js" 2>/dev/null || true
        pkill -f "vite" 2>/dev/null || true
        sleep 2
        success "服务已停止"
    fi
}

start_services() {
    info "启动服务..."
    
    if [ "${PM2_AVAILABLE}" = true ]; then
        # 启动后端
        cd "${BACKEND_DIR}"
        pm2 delete jhchat-backend 2>/dev/null || true
        pm2 start src/server.js --name jhchat-backend --env production
        
        # 启动前端
        cd "${FRONTEND_DIR}"
        pm2 delete jhchat-frontend 2>/dev/null || true
        pm2 start npm --name jhchat-frontend -- run dev
        
        pm2 save
        success "服务已通过 PM2 启动"
    else
        cd "${BACKEND_DIR}"
        nohup npm run dev > /var/log/jhchat-backend.log 2>&1 &
        local backend_pid=$!
        info "后端服务 PID: ${backend_pid}"
        
        cd "${FRONTEND_DIR}"
        nohup npm run dev > /var/log/jhchat-frontend.log 2>&1 &
        local frontend_pid=$!
        info "前端服务 PID: ${frontend_pid}"
        
        sleep 3
        success "服务已启动"
    fi
}

verify_services() {
    info "验证服务状态..."
    
    sleep 5
    
    local retry=0
    local max_retry=10
    
    # 验证后端
    while [ ${retry} -lt ${max_retry} ]; do
        if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
            success "✓ 后端服务运行正常"
            break
        fi
        retry=$((retry + 1))
        info "等待后端启动... (${retry}/${max_retry})"
        sleep 2
    done
    
    if [ ${retry} -eq ${max_retry} ]; then
        error "后端服务启动超时"
        exit 1
    fi
    
    # 验证前端
    retry=0
    while [ ${retry} -lt ${max_retry} ]; do
        if curl -s http://localhost:5173/admin > /dev/null 2>&1 || \
           curl -s http://localhost:5174/admin > /dev/null 2>&1; then
            success "✓ 前端服务运行正常"
            break
        fi
        retry=$((retry + 1))
        info "等待前端启动... (${retry}/${max_retry})"
        sleep 2
    done
    
    if [ ${retry} -eq ${max_retry} ]; then
        error "前端服务启动超时"
        exit 1
    fi
}

print_summary() {
    echo ""
    echo -e "${GREEN}=============================================${NC}"
    echo -e "${GREEN}   江湖聊天室部署成功！"
    echo -e "${GREEN}=============================================${NC}"
    echo ""
    echo "✅ 部署版本：${TARGET_VERSION}"
    echo "✅ 部署分支：${BRANCH_NAME}"
    echo "✅ 后端目录：${BACKEND_DIR}"
    echo "✅ 前端目录：${FRONTEND_DIR}"
    echo "✅ 数据库迁移：完成"
    echo "✅ 服务重启：完成"
    echo ""
    echo "📋 下一步操作："
    echo "   1. 验证 PM2 服务：pm2 status"
    echo "   2. 查看后端日志：pm2 logs jhchat-backend --lines 50"
    echo "   3. 查看前端日志：pm2 logs jhchat-frontend --lines 50"
    echo "   4. 访问管理后台：http://your-domain.com/admin"
    echo ""
    echo "📂 相关信息："
    echo "   - 代码仓库：${REPO_DIR}"
    echo "   - 备份目录：${BACKUP_DIR}"
    echo "   - 日志文件：${LOG_FILE}"
    echo -e "${GREEN}=============================================${NC}"
}

# ==================== 主流程 ====================

main() {
    echo -e "${BLUE}=============================================${NC}"
    echo -e "${BLUE}   江湖聊天室自动部署脚本 v1.0.2"
    echo -e "${BLUE}=============================================${NC}"
    echo ""
    
    check_root
    check_prerequisites
    create_dirs
    
    echo ""
    info "开始部署..."
    echo ""
    
    backup_database
    backup_code
    update_repo
    sync_backend
    sync_frontend
    install_backend_deps
    install_frontend_deps
    build_frontend
    run_migration
    verify_migration
    stop_services
    start_services
    verify_services
    print_summary
}

show_help() {
    echo "江湖聊天室自动部署脚本 v1.0.2"
    echo ""
    echo "用法：$0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示帮助信息"
    echo "  --dry-run           预演模式（不执行实际部署）"
    echo "  --skip-backup       跳过备份（危险！）"
    echo ""
    echo "目录配置:"
    echo "  仓库目录：${REPO_DIR}"
    echo "  后端目录：${BACKEND_DIR}"
    echo "  前端目录：${FRONTEND_DIR}"
    echo "  备份目录：${BACKUP_DIR}"
    echo ""
    echo "环境变量:"
    echo "  DB_HOST             数据库主机 (默认：localhost)"
    echo "  DB_PORT             数据库端口 (默认：3306)"
    echo "  DB_USER             数据库用户 (默认：jhchat)"
    echo "  DB_PASSWORD         数据库密码"
    echo "  DB_NAME             数据库名称 (默认：jhchat)"
    echo ""
}

case "$1" in
    -h|--help)
        show_help
        exit 0
        ;;
    --dry-run)
        info "预演模式：只检查不执行"
        check_prerequisites
        info "所有检查通过，可以执行部署"
        exit 0
        ;;
    *)
        main
        ;;
esac
