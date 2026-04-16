#!/bin/bash

# 系统运维脚本
# 用途：备份、恢复、监控、维护

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 备份数据库
backup_database() {
    local backup_dir="./backups"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${backup_dir}/jhchat_${timestamp}.sql"
    
    mkdir -p "$backup_dir"
    
    log_info "开始备份数据库..."
    docker-compose exec -T mysql mysqldump -ujhchat_root -pjhchat_root_pass --databases jhchat > "$backup_file"
    
    if [ -f "$backup_file" ]; then
        # 压缩备份
        gzip "$backup_file"
        log_info "数据库备份完成：${backup_file}.gz"
        
        # 清理 7 天前的备份
        find "$backup_dir" -name "jhchat_*.sql.gz" -mtime +7 -delete
        log_info "已清理 7 天前的旧备份"
    else
        log_error "备份失败"
        exit 1
    fi
}

# 恢复数据库
restore_database() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        log_error "请提供备份文件路径"
        echo "用法：$0 restore <备份文件.sql.gz>"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在：$backup_file"
        exit 1
    fi
    
    log_warn "警告：此操作将覆盖当前数据库！"
    read -p "确定要继续吗？(yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "操作已取消"
        exit 0
    fi
    
    log_info "开始恢复数据库..."
    
    # 解压并恢复
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | docker-compose exec -T mysql mysql -ujhchat_root -pjhchat_root_pass
    else
        docker-compose exec -T mysql mysql -ujhchat_root -pjhchat_root_pass < "$backup_file"
    fi
    
    log_info "数据库恢复完成"
}

# 查看服务状态
check_status() {
    log_info "服务状态:"
    docker-compose ps
    
    echo ""
    log_info "资源使用:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    
    echo ""
    log_info "数据库连接数:"
    docker-compose exec -T mysql mysql -ujhchat_root -pjhchat_root_pass -e "SHOW STATUS LIKE 'Threads_connected';"
}

# 清理服务
cleanup() {
    log_warn "警告：此操作将删除所有容器、网络和数据卷！"
    read -p "确定要继续吗？(yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "操作已取消"
        exit 0
    fi
    
    log_info "停止并删除所有服务..."
    docker-compose down -v
    
    log_info "清理完成"
}

# 重启服务
restart() {
    log_info "重启所有服务..."
    docker-compose restart
    
    log_info "等待服务启动..."
    sleep 10
    
    check_status
}

# 查看日志
logs() {
    local service=$1
    
    if [ -n "$service" ]; then
        docker-compose logs -f "$service"
    else
        docker-compose logs -f
    fi
}

# 数据库优化
optimize_database() {
    log_info "优化数据库..."
    
    # 分析表
    docker-compose exec -T mysql mysql -ujhchat_root -pjhchat_root_pass -e "
        USE jhchat;
        ANALYZE TABLE users;
        ANALYZE TABLE chat_messages;
        ANALYZE TABLE online_users;
        OPTIMIZE TABLE users;
        OPTIMIZE TABLE chat_messages;
    "
    
    log_info "数据库优化完成"
}

# 显示帮助
show_help() {
    cat << 'EOF'
系统运维脚本

用法：./ops.sh <命令> [参数]

命令:
  backup          备份数据库
  restore <文件>   从备份文件恢复数据库
  status          查看服务状态
  restart         重启服务
  cleanup         清理所有服务和数据
  logs [服务]     查看日志（不指定服务则查看所有）
  optimize        优化数据库

示例:
  ./ops.sh backup                    # 备份数据库
  ./ops.sh restore ./backups/jhchat_20260414.sql.gz  # 恢复数据库
  ./ops.sh status                    # 查看状态
  ./ops.sh logs backend              # 查看后端日志

EOF
}

# 主流程
case "${1:-help}" in
    backup)
        backup_database
        ;;
    restore)
        restore_database "$2"
        ;;
    status)
        check_status
        ;;
    restart)
        restart
        ;;
    cleanup)
        cleanup
        ;;
    logs)
        logs "$2"
        ;;
    optimize)
        optimize_database
        ;;
    *)
        show_help
        ;;
esac
