#!/bin/bash

#===============================================================================
# 江湖聊天室 - 生产环境回滚脚本
# 版本：v1.0
# 用途：在更新失败时快速回滚到之前的版本
#===============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
BACKUP_DIR="/backup/jhchat"
LOG_FILE="/var/log/jhchat_rollback_$(date +%Y%m%d_%H%M%S).log"

# 数据库配置
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-jhchat}"
DB_PASSWORD="${DB_PASSWORD:-JhChat@2026Secure!}"
DB_NAME="${DB_NAME:-jhchat}"

info() { echo -e "${BLUE}INFO${NC} $1" | tee -a "${LOG_FILE}"; }
success() { echo -e "${GREEN}SUCCESS${NC} $1" | tee -a "${LOG_FILE}"; }
warn() { echo -e "${YELLOW}WARN${NC} $1" | tee -a "${LOG_FILE}"; }
error() { echo -e "${RED}ERROR${NC} $1" | tee -a "${LOG_FILE}"; }

# 查找最新备份
find_latest_backup() {
    info "查找最新备份..."
    
    # 查找最新的数据库备份
    local db_backup=$(ls -t "${BACKUP_DIR}"/jhchat_*.sql.gz 2>/dev/null | head -1)
    
    if [ -z "${db_backup}" ]; then
        db_backup=$(ls -t "${BACKUP_DIR}"/jhchat_*.sql 2>/dev/null | head -1)
    fi
    
    if [ -z "${db_backup}" ]; then
        error "未找到数据库备份文件"
        exit 1
    fi
    
    info "找到数据库备份：${db_backup}"
    echo "${db_backup}"
}

# 查找最新代码备份
find_latest_code_backup() {
    info "查找最新代码备份..."
    
    local code_backup=$(ls -dt "${BACKUP_DIR}"/jhchat_code_* 2>/dev/null | head -1)
    
    if [ -z "${code_backup}" ]; then
        error "未找到代码备份文件"
        exit 1
    fi
    
    info "找到代码备份：${code_backup}"
    echo "${code_backup}"
}

# 停止服务
stop_services() {
    info "停止服务..."
    
    if command -v pm2 &> /dev/null; then
        pm2 stop jhchat-backend 2>/dev/null || true
        pm2 stop jhchat-frontend 2>/dev/null || true
        pm2 save
    else
        pkill -f "node.*server.js" 2>/dev/null || true
        pkill -f "vite" 2>/dev/null || true
    fi
    
    sleep 2
    success "服务已停止"
}

# 恢复数据库
restore_database() {
    local backup_file="$1"
    
    info "恢复数据库..."
    
    # 如果是 gzip 压缩文件，先解压
    if [[ "${backup_file}" == *.gz ]]; then
        info "解压备份文件..."
        gunzip -c "${backup_file}" > /tmp/jhchat_restore.sql
        backup_file="/tmp/jhchat_restore.sql"
    fi
    
    # 恢复数据
    mysql -h "${DB_HOST}" \
          -P "${DB_PORT}" \
          -u "${DB_USER}" \
          -p"${DB_PASSWORD}" \
          "${DB_NAME}" \
          < "${backup_file}" 2>&1
    
    # 清理临时文件
    rm -f /tmp/jhchat_restore.sql
    
    success "数据库恢复成功"
}

# 恢复代码
restore_code() {
    local backup_dir="$1"
    local project_dir="/path/to/jhchat"
    
    info "恢复代码..."
    
    # 备份当前代码
    local temp_backup="${project_dir}.rollback.tmp"
    if [ -d "${project_dir}" ]; then
        mv "${project_dir}" "${temp_backup}"
    fi
    
    # 恢复备份
    cp -r "${backup_dir}" "${project_dir}"
    
    # 删除临时备份
    rm -rf "${temp_backup}"
    
    success "代码恢复成功"
}

# 启动服务
start_services() {
    info "启动服务..."
    
    if command -v pm2 &> /dev/null; then
        cd /path/to/jhchat/backend
        pm2 start jhchat-backend
        
        cd /path/to/jhchat/frontend
        pm2 start jhchat-frontend
        
        pm2 save
    else
        cd /path/to/jhchat/backend
        nohup npm run dev > /var/log/jhchat-backend.log 2>&1 &
        
        cd /path/to/jhchat/frontend
        nohup npm run dev > /var/log/jhchat-frontend.log 2>&1 &
    fi
    
    sleep 5
    success "服务已启动"
}

# 验证服务
verify_services() {
    info "验证服务..."
    
    sleep 5
    
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        success "后端服务正常"
    else
        error "后端服务异常"
        return 1
    fi
    
    if curl -s http://localhost:5173/admin > /dev/null 2>&1 || \
       curl -s http://localhost:5174/admin > /dev/null 2>&1; then
        success "前端服务正常"
    else
        error "前端服务异常"
        return 1
    fi
    
    success "服务验证通过"
}

# 主函数
main() {
    echo -e "${BLUE}=================================================${NC}"
    echo -e "${BLUE}       江湖聊天室回滚脚本${NC}"
    echo -e "${BLUE}=================================================${NC}"
    echo ""
    
    if [ "$EUID" -ne 0 ]; then
        error "请使用 root 或 sudo 权限运行此脚本"
        exit 1
    fi
    
    local db_backup=$(find_latest_backup)
    local code_backup=$(find_latest_code_backup)
    
    echo ""
    warn "即将回滚到以下版本："
    echo "  数据库备份：${db_backup}"
    echo "  代码备份：${code_backup}"
    echo ""
    read -p "确定要继续吗？(y/N): " confirm
    
    if [ "${confirm}" != "y" ] && [ "${confirm}" != "Y" ]; then
        info "回滚已取消"
        exit 0
    fi
    
    echo ""
    info "开始回滚..."
    echo ""
    
    stop_services
    restore_database "${db_backup}"
    restore_code "${code_backup}"
    start_services
    verify_services
    
    echo ""
    echo -e "${GREEN}=================================================${NC}"
    echo -e "${GREEN}          回滚成功！${NC}"
    echo -e "${GREEN}=================================================${NC}"
    echo ""
    echo "请验证系统功能是否正常"
    echo "如有问题，请查看日志：${LOG_FILE}"
}

main "$@"
