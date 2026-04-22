#!/bin/bash

###############################################################################
# 江湖聊天室 - 数据库同步脚本
# 用途：导出本地数据库并导入到远程服务器
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
PROJECT_ROOT="/workspace/jhchat"
REMOTE_HOST="45.192.101.76"
REMOTE_USER="root"
REMOTE_DB_PASSWORD="LmPNsiGKRKLCkH48"
REMOTE_MYSQL_CONTAINER="mysql80"
LOCAL_DB_PASSWORD="jhchat_root_pass"
DB_NAME="jhchat"
TEMP_SQL="/tmp/jhchat_deploy_$$.sql"

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
}

# 导出本地数据库
export_local_db() {
    log_step "导出本地数据库"
    
    # 检查本地 MySQL 是否在 Docker 中
    if docker ps | grep -q mysql; then
        log_info "从 Docker 中的 MySQL 导出..."
        docker exec jhchat-mysql mysqldump -u root -p"$LOCAL_DB_PASSWORD" \
            --single-transaction --quick --lock-tables=false \
            "$DB_NAME" > "$TEMP_SQL"
    else
        log_info "从本地 MySQL 导出..."
        mysqldump -u root -p"$LOCAL_DB_PASSWORD" \
            --single-transaction --quick --lock-tables=false \
            "$DB_NAME" > "$TEMP_SQL"
    fi
    
    FILE_SIZE=$(du -h "$TEMP_SQL" | cut -f1)
    log_info "导出完成，文件大小：$FILE_SIZE"
}

# 压缩 SQL 文件
compress_sql() {
    log_step "压缩 SQL 文件"
    
    gzip -f "$TEMP_SQL"
    log_info "压缩完成：${TEMP_SQL}.gz"
}

# 上传到服务器
upload_to_server() {
    log_step "上传到服务器"
    
    scp -o StrictHostKeyChecking=no "${TEMP_SQL}.gz" "${REMOTE_USER}@${REMOTE_HOST}:/tmp/"
    
    log_info "上传完成"
}

# 在服务器上导入
import_remote_db() {
    log_step "在远程服务器导入数据库"
    
    ssh -o StrictHostKeyChecking=no "${REMOTE_USER}@${REMOTE_HOST}" << EOF
        log_info() {
            echo -e "\${GREEN}[INFO]\${NC} \$1"
        }
        
        GREEN='\033[0;32m'
        NC='\033[0m'
        
        # 解压文件
        log_info "解压 SQL 文件..."
        gunzip -f /tmp/${TEMP_SQL##*/}.gz
        
        # 导入数据库
        log_info "导入到 MySQL..."
        docker exec -i $REMOTE_MYSQL_CONTAINER mysql -u root -p$REMOTE_DB_PASSWORD $DB_NAME < /tmp/${TEMP_SQL##*/}
        
        # 清理临时文件
        rm -f /tmp/${TEMP_SQL##*/}
        
        log_info "数据库导入完成！"
EOF
    
    log_info "远程导入完成"
}

# 清理临时文件
cleanup() {
    log_step "清理临时文件"
    
    rm -f "$TEMP_SQL" "${TEMP_SQL}.gz"
    log_info "清理完成"
}

# 主函数
main() {
    log_step "江湖聊天室 - 数据库同步"
    
    export_local_db
    compress_sql
    upload_to_server
    import_remote_db
    cleanup
    
    log_info "数据库同步完成！"
}

# 执行
main
