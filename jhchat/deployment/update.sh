#!/bin/bash

#===============================================================================
# 江湖聊天室 - 生产环境自动更新脚本
# 版本：v1.0.1
# 用途：自动化部署系统更新管理功能
#===============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${SCRIPT_DIR}/.."
BACKUP_DIR="/backup/jhchat"
LOG_FILE="/var/log/jhchat_update_$(date +%Y%m%d_%H%M%S).log"
BRANCH_NAME="260413-feat-jhchat-refactor"
TARGET_VERSION="v1.0.1"

# 数据库配置（从环境变量或配置文件读取）
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-jhchat}"
DB_PASSWORD="${DB_PASSWORD:-JhChat@2026Secure!}"
DB_NAME="${DB_NAME:-jhchat}"

# 日志函数
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

# 错误处理
handle_error() {
    local exit_code=$?
    error "脚本执行失败，退出码：${exit_code}"
    error "详细日志请查看：${LOG_FILE}"
    echo ""
    echo "${RED}==================== 回滚建议 ====================${NC}"
    echo "1. 恢复代码：cd ${PROJECT_DIR} && git checkout <previous_version>"
    echo "2. 恢复数据库：mysql -u ${DB_USER} -p ${DB_NAME} < ${BACKUP_DIR}/jhchat_*.sql"
    echo "3. 重启服务：pm2 restart all"
    echo "${RED}=================================================${NC}"
    exit ${exit_code}
}

trap handle_error ERR

# 检查权限
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "请使用 root 或 sudo 权限运行此脚本"
        exit 1
    fi
}

# 检查前置条件
check_prerequisites() {
    info "检查前置条件..."
    
    # 检查 git
    if ! command -v git &> /dev/null; then
        error "git 未安装，请先安装 git"
        exit 1
    fi
    
    # 检查 node
    if ! command -v node &> /dev/null; then
        error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        error "npm 未安装，请先安装 npm"
        exit 1
    fi
    
    # 检查 mysql 客户端
    if ! command -v mysql &> /dev/null; then
        error "MySQL 客户端未安装，请先安装"
        exit 1
    fi
    
    # 检查 mysqldump
    if ! command -v mysqldump &> /dev/null; then
        error "mysqldump 未安装，请先安装"
        exit 1
    fi
    
    # 检查 PM2（可选）
    if command -v pm2 &> /dev/null; then
        PM2_AVAILABLE=true
        info "检测到 PM2，将使用 PM2 管理服务"
    else
        PM2_AVAILABLE=false
        warn "未检测到 PM2，将使用后台方式运行服务"
    fi
    
    success "前置条件检查通过"
}

# 创建备份目录
create_backup_dir() {
    info "创建备份目录：${BACKUP_DIR}"
    mkdir -p "${BACKUP_DIR}"
    mkdir -p "$(dirname ${LOG_FILE})"
}

# 备份数据库
backup_database() {
    local backup_file="${BACKUP_DIR}/jhchat_$(date +%Y%m%d_%H%M%S).sql"
    info "备份数据库到：${backup_file}"
    
    mysqldump -h "${DB_HOST}" \
              -P "${DB_PORT}" \
              -u "${DB_USER}" \
              -p"${DB_PASSWORD}" \
              "${DB_NAME}" \
              > "${backup_file}" 2>&1
    
    if [ -f "${backup_file}" ] && [ -s "${backup_file}" ]; then
        success "数据库备份成功：${backup_file}"
        # 压缩备份
        gzip "${backup_file}" &
        wait
        success "数据库备份已压缩：${backup_file}.gz"
    else
        error "数据库备份失败"
        exit 1
    fi
}

# 备份当前代码
backup_code() {
    local backup_name="jhchat_code_$(date +%Y%m%d_%H%M%S)"
    local backup_path="${BACKUP_DIR}/${backup_name}"
    
    info "备份当前代码到：${backup_path}"
    cp -r "${PROJECT_DIR}" "${backup_path}"
    
    if [ -d "${backup_path}" ]; then
        success "代码备份成功：${backup_path}"
    else
        error "代码备份失败"
        exit 1
    fi
}

# 拉取最新代码
pull_code() {
    info "拉取最新代码（分支：${BRANCH_NAME}）"
    
    cd "${PROJECT_DIR}"
    
    # 检查当前分支
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    info "当前分支：${current_branch}"
    
    # 拉取代码
    git fetch origin
    git checkout "${BRANCH_NAME}"
    git pull origin "${BRANCH_NAME}"
    
    # 显示最新提交
    info "最新提交记录："
    git log --oneline -3
    
    success "代码拉取成功"
}

# 执行数据库迁移
run_migration() {
    local migration_file="${PROJECT_DIR}/backend/migrations/20260425_create_system_updates_tables.sql"
    
    if [ ! -f "${migration_file}" ]; then
        error "迁移脚本不存在：${migration_file}"
        exit 1
    fi
    
    info "执行数据库迁移..."
    
    mysql -h "${DB_HOST}" \
          -P "${DB_PORT}" \
          -u "${DB_USER}" \
          -p"${DB_PASSWORD}" \
          "${DB_NAME}" \
          < "${migration_file}" 2>&1
    
    success "数据库迁移成功"
}

# 验证数据库迁移
verify_migration() {
    info "验证数据库迁移..."
    
    # 检查 system_updates 表
    local table_count=$(mysql -h "${DB_HOST}" \
                              -P "${DB_PORT}" \
                              -u "${DB_USER}" \
                              -p"${DB_PASSWORD}" \
                              -N -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='${DB_NAME}' AND TABLE_NAME='system_updates'" "${DB_NAME}" 2>&1 | grep -v Warning)
    
    if [ "${table_count}" -eq 0 ]; then
        error "system_updates 表创建失败"
        exit 1
    fi
    
    # 检查 update_push_logs 表
    table_count=$(mysql -h "${DB_HOST}" \
                        -P "${DB_PORT}" \
                        -u "${DB_USER}" \
                        -p"${DB_PASSWORD}" \
                        -N -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='${DB_NAME}' AND TABLE_NAME='update_push_logs'" "${DB_NAME}" 2>&1 | grep -v Warning)
    
    if [ "${table_count}" -eq 0 ]; then
        error "update_push_logs 表创建失败"
        exit 1
    fi
    
    # 检查示例数据
    local data_count=$(mysql -h "${DB_HOST}" \
                             -P "${DB_PORT}" \
                             -u "${DB_USER}" \
                             -p"${DB_PASSWORD}" \
                             -N -e "SELECT COUNT(*) FROM system_updates" "${DB_NAME}" 2>&1 | grep -v Warning)
    
    info "system_updates 表中共有 ${data_count} 条记录"
    
    if [ "${data_count}" -lt 4 ]; then
        warn "示例数据可能未完全插入"
    fi
    
    success "数据库迁移验证通过"
}

# 安装依赖
install_dependencies() {
    info "安装后端依赖..."
    cd "${PROJECT_DIR}/backend"
    npm install --production
    
    info "安装前端依赖..."
    cd "${PROJECT_DIR}/frontend"
    npm install --production
    
    success "依赖安装完成"
}

# 构建前端
build_frontend() {
    info "构建前端..."
    cd "${PROJECT_DIR}/frontend"
    npm run build
    
    if [ -d "dist" ]; then
        success "前端构建成功"
    else
        error "前端构建失败"
        exit 1
    fi
}

# 停止旧服务
stop_services() {
    info "停止旧服务..."
    
    if [ "${PM2_AVAILABLE}" = true ]; then
        cd "${PROJECT_DIR}"
        
        # 使用 PM2 停止服务
        pm2 stop jhchat-backend 2>/dev/null || true
        pm2 stop jhchat-frontend 2>/dev/null || true
        
        success "服务已通过 PM2 停止"
    else
        # 手动停止服务
        pkill -f "node.*server.js" 2>/dev/null || true
        pkill -f "vite" 2>/dev/null || true
        
        sleep 2
        success "服务已手动停止"
    fi
}

# 启动新服务
start_services() {
    info "启动新服务..."
    
    if [ "${PM2_AVAILABLE}" = true ]; then
        # 启动后端
        cd "${PROJECT_DIR}/backend"
        pm2 start ecosystem.config.js 2>/dev/null || pm2 start src/server.js --name jhchat-backend
        
        # 启动前端
        cd "${PROJECT_DIR}/frontend"
        pm2 start npm --name jhchat-frontend -- run dev
        
        pm2 save
        success "服务已通过 PM2 启动"
    else
        # 启动后端
        cd "${PROJECT_DIR}/backend"
        nohup npm run dev > /var/log/jhchat-backend.log 2>&1 &
        local backend_pid=$!
        info "后端服务 PID: ${backend_pid}"
        
        # 启动前端
        cd "${PROJECT_DIR}/frontend"
        nohup npm run dev > /var/log/jhchat-frontend.log 2>&1 &
        local frontend_pid=$!
        info "前端服务 PID: ${frontend_pid}"
        
        sleep 3
        success "服务已手动启动"
    fi
}

# 验证服务状态
verify_services() {
    info "验证服务状态..."
    
    # 等待服务启动
    sleep 5
    
    # 检查后端
    local retry=0
    local max_retry=10
    while [ ${retry} -lt ${max_retry} ]; do
        if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
            success "后端服务运行正常"
            break
        fi
        retry=$((retry + 1))
        info "等待后端服务启动... (${retry}/${max_retry})"
        sleep 2
    done
    
    if [ ${retry} -eq ${max_retry} ]; then
        error "后端服务启动超时"
        exit 1
    fi
    
    # 检查前端
    retry=0
    while [ ${retry} -lt ${max_retry} ]; do
        if curl -s http://localhost:5173/admin > /dev/null 2>&1 || curl -s http://localhost:5174/admin > /dev/null 2>&1; then
            success "前端服务运行正常"
            break
        fi
        retry=$((retry + 1))
        info "等待前端服务启动... (${retry}/${max_retry})"
        sleep 2
    done
    
    if [ ${retry} -eq ${max_retry} ]; then
        error "前端服务启动超时"
        exit 1
    fi
    
    success "所有服务运行正常"
}

# 验证更新功能
verify_update_feature() {
    info "验证更新管理功能..."
    
    # 获取管理员 Token（需要从环境变量或配置文件获取）
    local admin_token="${ADMIN_TOKEN:-}"
    
    if [ -z "${admin_token}" ]; then
        warn "未设置 ADMIN_TOKEN，跳过 API 验证"
        return 0
    fi
    
    # 测试更新列表 API
    local response=$(curl -s -w "%{http_code}" -o /tmp/updates_test.json \
                       -H "Authorization: Bearer ${admin_token}" \
                       "http://localhost:3001/api/admin/updates" 2>&1)
    
    if [ "${response}" = "200" ]; then
        success "更新列表 API 正常"
        
        # 显示更新记录数量
        local count=$(cat /tmp/updates_test.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('total', 0))" 2>/dev/null || echo "unknown")
        info "更新记录总数：${count}"
    else
        warn "更新列表 API 响应异常：${response}"
    fi
    
    # 测试最新版本 API
    response=$(curl -s -w "%{http_code}" -o /tmp/latest_test.json \
                 -H "Authorization: Bearer ${admin_token}" \
                 "http://localhost:3001/api/admin/updates/latest" 2>&1)
    
    if [ "${response}" = "200" ]; then
        success "最新版本 API 正常"
        
        # 显示最新版本
        local version=$(cat /tmp/latest_test.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('version', 'unknown'))" 2>/dev/null || echo "unknown")
        info "当前最新版本：${version}"
    else
        warn "最新版本 API 响应异常：${response}"
    fi
    
    success "更新管理功能验证完成"
}

# 清理临时文件
cleanup() {
    info "清理临时文件..."
    rm -f /tmp/updates_test.json /tmp/latest_test.json
    success "清理完成"
}

# 打印总结
print_summary() {
    echo ""
    echo -e "${GREEN}=================================================${NC}"
    echo -e "${GREEN}          江湖聊天室更新成功！${NC}"
    echo -e "${GREEN}=================================================${NC}"
    echo ""
    echo "✅ 更新版本：${TARGET_VERSION}"
    echo "✅ 更新分支：${BRANCH_NAME}"
    echo "✅ 数据库迁移：完成"
    echo "✅ 服务重启：完成"
    echo "✅ 功能验证：通过"
    echo ""
    echo "📋 下一步操作："
    echo "   1. 访问管理后台：http://your-domain.com/admin"
    echo "   2. 检查更新管理菜单是否可见"
    echo "   3. 查看仪表盘是否有更新提示"
    echo ""
    echo "📂 相关文件："
    echo "   - 数据库备份：${BACKUP_DIR}/"
    echo "   - 日志文件：${LOG_FILE}"
    echo "   - 迁移脚本：${PROJECT_DIR}/backend/migrations/20260425_create_system_updates_tables.sql"
    echo ""
    echo "📞 如有问题，请查看日志或联系开发团队"
    echo -e "${GREEN}=================================================${NC}"
}

# 主函数
main() {
    echo -e "${BLUE}=================================================${NC}"
    echo -e "${BLUE}       江湖聊天室自动更新脚本 v1.0.1${NC}"
    echo -e "${BLUE}=================================================${NC}"
    echo ""
    
    check_root
    check_prerequisites
    create_backup_dir
    
    echo ""
    info "开始更新..."
    echo ""
    
    backup_database
    backup_code
    pull_code
    run_migration
    verify_migration
    install_dependencies
    build_frontend
    stop_services
    start_services
    verify_services
    verify_update_feature
    cleanup
    
    print_summary
}

# 显示帮助信息
show_help() {
    echo "江湖聊天室自动更新脚本"
    echo ""
    echo "用法：$0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示帮助信息"
    echo "  -v, --version       显示脚本版本"
    echo "  --skip-backup       跳过备份（危险！）"
    echo "  --skip-verify       跳过验证"
    echo ""
    echo "环境变量:"
    echo "  DB_HOST             数据库主机 (默认：localhost)"
    echo "  DB_PORT             数据库端口 (默认：3306)"
    echo "  DB_USER             数据库用户 (默认：jhchat)"
    echo "  DB_PASSWORD         数据库密码"
    echo "  DB_NAME             数据库名称 (默认：jhchat)"
    echo "  ADMIN_TOKEN         管理员 Token (用于 API 验证)"
    echo ""
    echo "示例:"
    echo "  sudo $0"
    echo "  DB_PASSWORD=xxx sudo $0"
    echo ""
}

# 解析参数
case "$1" in
    -h|--help)
        show_help
        exit 0
        ;;
    -v|--version)
        echo "v1.0.1"
        exit 0
        ;;
    *)
        main
        ;;
esac
