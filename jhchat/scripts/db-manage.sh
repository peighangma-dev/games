#!/bin/bash

###############################################################################
# 江湖聊天室 - 数据库同步和迁移脚本
# 用途：管理 MySQL 8.0 (Docker) 数据库
###############################################################################

set -e

# 配置
DB_NAME="jhchat"
DB_USER="root"
DB_PASS="jhchat_root_pass"
MYSQL_CONTAINER="jhchat-mysql"
BACKUP_DIR="/backup/jhchat/mysql"
PROJECT_ROOT="/workspace/jhchat"
DATE=$(date +%Y%m%d_%H%M%S)

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查 Docker 环境
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    # 检查 MySQL 容器
    if ! docker ps | grep -q "$MYSQL_CONTAINER"; then
        log_warn "MySQL 容器未运行，尝试查找..."
        MYSQL_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i mysql | head -1)
        if [ -z "$MYSQL_CONTAINER" ]; then
            log_error "未找到 MySQL Docker 容器"
            exit 1
        fi
        log_info "使用 MySQL 容器：$MYSQL_CONTAINER"
    fi
}

# 备份数据库
backup() {
    log_info "开始备份数据库..."
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/jhchat_backup_$DATE.sql"
    
    # 从 Docker 容器导出
    docker exec -t "$MYSQL_CONTAINER" mysqldump -u$DB_USER -p$DB_PASS \
        --databases $DB_NAME \
        --single-transaction \
        --quick \
        --lock-tables=false \
        --default-character-set=utf8mb4 \
        > "$BACKUP_FILE"
    
    # 压缩
    gzip "$BACKUP_FILE"
    
    log_info "备份完成：${BACKUP_FILE}.gz"
    
    # 保留最近 30 个备份
    cd "$BACKUP_DIR"
    ls -t jhchat_backup_*.sql.gz | tail -n +31 | xargs -r rm -v
    
    echo "${BACKUP_FILE}.gz"
}

# 从文件导入数据库
import_from_file() {
    local SQL_FILE="$1"
    
    if [ ! -f "$SQL_FILE" ]; then
        log_error "文件不存在：$SQL_FILE"
        exit 1
    fi
    
    log_info "导入数据库：$SQL_FILE"
    
    # 判断是否压缩
    if [[ "$SQL_FILE" == *.gz ]]; then
        docker exec -i "$MYSQL_CONTAINER" sh -c \
            "mysql -u$DB_USER -p$DB_PASS $DB_NAME" < "$SQL_FILE"
    else
        docker exec -i "$MYSQL_CONTAINER" mysql -u$DB_USER -p$DB_PASS $DB_NAME < "$SQL_FILE"
    fi
    
    log_info "导入完成"
}

# 导入项目根目录的数据库文件
import_project_db() {
    local DB_SQL="$PROJECT_ROOT/数据库.sql"
    
    if [ ! -f "$DB_SQL" ]; then
        log_error "未找到数据库文件：$DB_SQL"
        exit 1
    fi
    
    log_info "导入项目数据库文件..."
    import_from_file "$DB_SQL"
    
    # 检查是否有迁移文件
    local MIGRATION_DIR="$PROJECT_ROOT/backend/migrations"
    if [ -d "$MIGRATION_DIR" ]; then
        log_info "发现迁移文件目录，检查是否需要执行..."
        
        for migration in "$MIGRATION_DIR"/*.sql; do
            if [ -f "$migration" ]; then
                log_info "执行迁移：$(basename $migration)"
                import_from_file "$migration"
            fi
        done
    fi
}

# 执行单条 SQL
exec_sql() {
    local SQL="$1"
    docker exec -i "$MYSQL_CONTAINER" mysql -u$DB_USER -p$DB_PASS $DB_NAME -e "$SQL"
}

# 查看数据库状态
db_status() {
    log_info "数据库状态"
    echo "================================"
    
    echo "1. 表数量:"
    exec_sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME';"
    
    echo ""
    echo "2. 数据量统计:"
    exec_sql "SELECT 
                table_name AS '表名',
                table_rows AS '行数',
                ROUND(((data_length + index_length) / 1024 / 1024), 2) AS '大小 (MB)'
              FROM information_schema.tables 
              WHERE table_schema = '$DB_NAME'
              ORDER BY (data_length + index_length) DESC
              LIMIT 10;"
    
    echo ""
    echo "3. 用户数:"
    exec_sql "SELECT COUNT(*) FROM users WHERE status != 'dead';"
    
    echo ""
    echo "4. 门派数:"
    exec_sql "SELECT COUNT(*) FROM sects;"
    
    echo "================================"
}

# 运行 SQL 文件
run_sql() {
    local SQL_FILE="$1"
    
    if [ ! -f "$SQL_FILE" ]; then
        log_error "SQL 文件不存在：$SQL_FILE"
        return 1
    fi
    
    log_info "执行 SQL 文件：$SQL_FILE"
    import_from_file "$SQL_FILE"
}

# 列出备份
list_backups() {
    log_info "备份文件列表（最近 10 个）:"
    echo "================================"
    ls -lht "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -10
    echo "================================"
}

# 恢复备份
restore() {
    local BACKUP_FILE="$1"
    
    if [ -z "$BACKUP_FILE" ]; then
        log_error "请指定备份文件"
        list_backups
        exit 1
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "备份文件不存在：$BACKUP_FILE"
        exit 1
    fi
    
    log_warn "即将恢复数据库，此操作不可逆！"
    read -p "确定要继续吗？(y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 先备份当前数据
        backup
        
        # 导入备份
        gunzip -c "$BACKUP_FILE" | docker exec -i "$MYSQL_CONTAINER" \
            mysql -u$DB_USER -p$DB_PASS $DB_NAME
        
        log_info "恢复完成"
    else
        log_info "已取消"
    fi
}

# 清理指定表
truncate_table() {
    local TABLE="$1"
    
    if [ -z "$TABLE" ]; then
        log_error "请指定表名"
        return 1
    fi
    
    log_warn "清空表：$TABLE"
    read -p "确定吗？(y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        exec_sql "SET FOREIGN_KEY_CHECKS=0; TRUNCATE TABLE $TABLE; SET FOREIGN_KEY_CHECKS=1;"
        log_info "表 $TABLE 已清空"
    fi
}

# 帮助信息
show_help() {
    echo "江湖聊天室 - 数据库管理脚本"
    echo ""
    echo "用法：$0 <命令> [参数]"
    echo ""
    echo "命令:"
    echo "  backup              备份数据库"
    echo "  import              导入项目数据库文件"
    echo "  import <文件>       导入指定 SQL 文件"
    echo "  status              查看数据库状态"
    echo "  run <SQL 文件>      执行 SQL 文件"
    echo "  restore <备份文件>  恢复备份"
    echo "  list                列出备份"
    echo "  clean <表名>        清空指定表"
    echo "  help                显示帮助"
    echo ""
    echo "示例:"
    echo "  $0 backup                    # 备份数据库"
    echo "  $0 import                    # 导入项目数据库"
    echo "  $0 run /path/to/file.sql    # 执行 SQL 文件"
    echo "  $0 restore backup.sql.gz    # 恢复备份"
    echo "  $0 status                    # 查看状态"
}

# 主逻辑
check_docker

case "${1:-}" in
    backup)
        backup
        ;;
    import)
        if [ -n "$2" ]; then
            import_from_file "$2"
        else
            import_project_db
        fi
        ;;
    status)
        db_status
        ;;
    run)
        run_sql "$2"
        ;;
    restore)
        restore "$2"
        ;;
    list)
        list_backups
        ;;
    clean)
        truncate_table "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        exit 1
        ;;
esac
