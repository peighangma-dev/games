#!/bin/bash
# ============================================
# 江湖聊天室 - 本地数据库一键更新脚本
# 版本：v2026.3.1
# 更新日期：2026-04-28
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="jhchat"
DB_PASS="JhChat@2026Secure!"
DB_NAME="jhchat"
PROJECT_ROOT="/workspace/jhchat"
MIGRATION_SCRIPT="$PROJECT_ROOT/backend/migrations/20260426_user_level_exp_system.sql"
SYNC_SCRIPT="$PROJECT_ROOT/database/production-sync-v2026.3.sql"

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
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 执行 SQL 并检查错误
exec_sql() {
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$1" 2>/dev/null
}

# 检查 MySQL 连接
check_connection() {
    log_step "检查数据库连接..."
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1;" >/dev/null 2>&1; then
        log_info "✓ 数据库连接成功"
    else
        log_error "✗ 数据库连接失败，请检查配置"
        exit 1
    fi
}

# 检查字段是否存在
check_field_exists() {
    local table="$1"
    local field="$2"
    local result=$(exec_sql "SHOW COLUMNS FROM $table LIKE '$field';" | wc -l)
    [ "$result" -ge 2 ]
}

# 备份数据库
backup_database() {
    log_step "备份当前数据库"
    BACKUP_DIR="$PROJECT_ROOT/database/backups"
    mkdir -p "$BACKUP_DIR"
    
    BACKUP_FILE="$BACKUP_DIR/jhchat_backup_$(date +%Y%m%d_%H%M%S).sql"
    mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null
    
    if [ -f "$BACKUP_FILE" ]; then
        log_info "✓ 数据库备份完成：$BACKUP_FILE"
        # 压缩备份
        gzip "$BACKUP_FILE" 2>/dev/null && log_info "✓ 备份已压缩：${BACKUP_FILE}.gz"
    else
        log_warn "⚠ 数据库备份失败，继续执行..."
    fi
}

# 执行主迁移脚本
run_main_migration() {
    log_step "执行主迁移脚本 (20260426_user_level_exp_system.sql)"
    
    if [ ! -f "$MIGRATION_SCRIPT" ]; then
        log_error "✗ 迁移脚本不存在：$MIGRATION_SCRIPT"
        return 1
    fi
    
    # 检查是否已执行过
    if exec_sql "SELECT * FROM user_level_config LIMIT 1;" >/dev/null 2>&1; then
        log_info "✓ 等级配置表已存在，跳过主迁移"
    else
        log_info "正在执行迁移脚本..."
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$MIGRATION_SCRIPT" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            log_info "✓ 主迁移执行完成"
            
            # 验证迁移结果
            TABLE_COUNT=$(exec_sql "SHOW TABLES LIKE 'user_level_config';" | wc -l)
            if [ "$TABLE_COUNT" -ge 2 ]; then
                log_info "✓ 验证：user_level_config 表已创建"
            fi
            
            TABLE_COUNT=$(exec_sql "SHOW TABLES LIKE 'chat_exp_logs';" | wc -l)
            if [ "$TABLE_COUNT" -ge 2 ]; then
                log_info "✓ 验证：chat_exp_logs 表已创建"
            fi
            
            TABLE_COUNT=$(exec_sql "SHOW TABLES LIKE 'admin_applications';" | wc -l)
            if [ "$TABLE_COUNT" -ge 2 ]; then
                log_info "✓ 验证：admin_applications 表已创建"
            fi
        else
            log_error "✗ 主迁移执行失败"
            return 1
        fi
    fi
}

# 同步字段重命名
sync_field_rename() {
    log_step "同步字段重命名 (all_value → total_exp)"
    
    # 检查 all_value 是否存在
    if check_field_exists "users" "all_value"; then
        log_info "正在重命名 all_value → total_exp..."
        exec_sql "ALTER TABLE users CHANGE COLUMN \`all_value\` \`total_exp\` BIGINT NOT NULL DEFAULT 0 COMMENT '总经验值';"
        log_info "✓ 字段 all_value 已重命名为 total_exp"
    else
        log_info "✓ 字段 all_value 不存在（可能已重命名）"
    fi
    
    # 检查 month_value 是否存在
    if check_field_exists "users" "month_value"; then
        log_info "正在重命名 month_value → monthly_exp..."
        exec_sql "ALTER TABLE users CHANGE COLUMN \`month_value\` \`monthly_exp\` BIGINT NOT NULL DEFAULT 0 COMMENT '月度经验值';"
        log_info "✓ 字段 month_value 已重命名为 monthly_exp"
    else
        log_info "✓ 字段 month_value 不存在（可能已重命名）"
    fi
}

# 添加新字段
sync_new_fields() {
    log_step "添加新字段（聊天时长统计）"
    
    # chat_minutes_today
    if ! check_field_exists "users" "chat_minutes_today"; then
        log_info "添加字段 chat_minutes_today..."
        exec_sql "ALTER TABLE users ADD COLUMN \`chat_minutes_today\` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '今日聊天分钟数' AFTER practice_exp_total;"
        log_info "✓ 字段 chat_minutes_today 已添加"
    else
        log_info "✓ 字段 chat_minutes_today 已存在"
    fi
    
    # chat_minutes_total
    if ! check_field_exists "users" "chat_minutes_total"; then
        log_info "添加字段 chat_minutes_total..."
        exec_sql "ALTER TABLE users ADD COLUMN \`chat_minutes_total\` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '累计聊天分钟数' AFTER chat_minutes_today;"
        log_info "✓ 字段 chat_minutes_total 已添加"
    else
        log_info "✓ 字段 chat_minutes_total 已存在"
    fi
    
    # last_chat_time
    if ! check_field_exists "users" "last_chat_time"; then
        log_info "添加字段 last_chat_time..."
        exec_sql "ALTER TABLE users ADD COLUMN \`last_chat_time\` DATETIME DEFAULT NULL COMMENT '最后聊天时间' AFTER chat_minutes_total;"
        log_info "✓ 字段 last_chat_time 已添加"
    else
        log_info "✓ 字段 last_chat_time 已存在"
    fi
}

# 添加索引
sync_indexes() {
    log_step "添加索引"
    
    # total_exp 索引
    if ! exec_sql "SHOW INDEX FROM users WHERE Key_name='idx_total_exp';" | grep -q "idx_total_exp"; then
        log_info "添加索引 idx_total_exp..."
        exec_sql "ALTER TABLE users ADD INDEX \`idx_total_exp\` (\`total_exp\`);" || log_warn "索引 idx_total_exp 可能已存在"
        log_info "✓ 索引 idx_total_exp 已添加"
    else
        log_info "✓ 索引 idx_total_exp 已存在"
    fi
    
    # monthly_exp 索引
    if ! exec_sql "SHOW INDEX FROM users WHERE Key_name='idx_monthly_exp';" | grep -q "idx_monthly_exp"; then
        log_info "添加索引 idx_monthly_exp..."
        exec_sql "ALTER TABLE users ADD INDEX \`idx_monthly_exp\` (\`monthly_exp\`);" || log_warn "索引 idx_monthly_exp 可能已存在"
        log_info "✓ 索引 idx_monthly_exp 已添加"
    else
        log_info "✓ 索引 idx_monthly_exp 已存在"
    fi
}

# 验证数据库结构
verify_structure() {
    log_step "验证数据库结构"
    
    ERROR_COUNT=0
    
    # 检查关键字段
    for FIELD in "total_exp" "monthly_exp" "chat_minutes_today" "chat_minutes_total" "last_chat_time"; do
        if check_field_exists "users" "$FIELD"; then
            log_info "✓ 字段 users.$FIELD 存在"
        else
            log_error "✗ 字段 users.$FIELD 不存在"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
    done
    
    # 检查关键表
    for TABLE in "user_level_config" "chat_exp_logs" "admin_applications"; do
        if exec_sql "SELECT 1 FROM $TABLE LIMIT 1;" >/dev/null 2>&1; then
            log_info "✓ 表 $TABLE 存在"
        else
            log_error "✗ 表 $TABLE 不存在"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
    done
    
    if [ "$ERROR_COUNT" -gt 0 ]; then
        log_error "发现 $ERROR_COUNT 个错误，请检查日志"
        return 1
    else
        log_info "✓ 数据库结构验证通过"
        return 0
    fi
}

# 显示数据库信息
show_db_info() {
    log_step "数据库信息"
    
    echo ""
    echo "================================"
    echo "  数据库统计信息"
    echo "================================"
    
    # 用户总数
    USER_COUNT=$(exec_sql "SELECT COUNT(*) FROM users;" | tail -1)
    echo "用户总数：$USER_COUNT"
    
    # 有总经验值的用户数
    EXP_USER_COUNT=$(exec_sql "SELECT COUNT(*) FROM users WHERE total_exp > 0;" | tail -1)
    echo "有经验记录的用户：$EXP_USER_COUNT"
    
    # 等级配置数量
    LEVEL_COUNT=$(exec_sql "SELECT COUNT(*) FROM user_level_config;" | tail -1)
    echo "等级配置数量：$LEVEL_COUNT"
    
    # 聊天经验日志数量
    CHAT_LOG_COUNT=$(exec_sql "SELECT COUNT(*) FROM chat_exp_logs;" 2>/dev/null | tail -1 || echo "0")
    echo "聊天经验日志：$CHAT_LOG_COUNT"
    
    echo "================================"
    echo ""
}

# 清理旧备份
cleanup_backups() {
    log_step "清理 7 天前的备份"
    BACKUP_DIR="$PROJECT_ROOT/database/backups"
    
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "*.sql*" -mtime +7 -delete 2>/dev/null || true
        log_info "✓ 备份清理完成"
    fi
}

# 主函数
main() {
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  江湖聊天室 - 本地数据库更新 v2026.3.1${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    
    # 1. 检查连接
    check_connection
    
    # 2. 备份
    backup_database
    
    # 3. 执行迁移
    run_main_migration || true
    
    # 4. 字段重命名
    sync_field_rename
    
    # 5. 添加新字段
    sync_new_fields
    
    # 6. 添加索引
    sync_indexes
    
    # 7. 验证
    echo ""
    if verify_structure; then
        show_db_info
        
        log_info "============================================"
        log_info "  数据库更新完成！"
        log_info "============================================"
        echo ""
        log_info "备份文件：$BACKUP_DIR"
        echo ""
        log_info "测试命令:"
        echo "  mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e \"SELECT id, username, total_exp, chat_minutes_today FROM users LIMIT 5;\""
        echo ""
    else
        log_error "============================================"
        log_error "  数据库更新失败！"
        log_error "============================================"
        echo ""
        log_error "请查看上述错误日志"
        log_error "备份文件：$(ls -t $PROJECT_ROOT/database/backups/*.sql.gz 2>/dev/null | head -1)"
        echo ""
        exit 1
    fi
}

# 执行
main "$@"
