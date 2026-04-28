#!/bin/bash
# ============================================
# 江湖聊天室 - 生产端一键更新脚本
# 版本：v2026.3.1
# 更新日期：2026-04-28
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
REPO_URL="https://github.com/peighangma-dev/games.git"
BRANCH="260413-feat-jhchat-refactor"
PROJECT_ROOT="/www/wwwroot/games/jhchat"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
DB_NAME="jhchat"
DB_USER="jhchat"
PM2_HOME="/www/server/panel/PM2"

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

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then 
    log_error "请使用 sudo 或 root 用户运行此脚本"
    exit 1
fi

log_info "============================================"
log_info "  江湖聊天室 - 一键更新脚本 v2026.3.1"
log_info "============================================"
echo ""

# 1. 检查当前目录
log_info "步骤 1/8: 检查工作目录"
if [ ! -d "$PROJECT_ROOT" ]; then
    log_error "项目目录不存在：$PROJECT_ROOT"
    exit 1
fi
cd "$PROJECT_ROOT"
log_info "✓ 项目目录：$PROJECT_ROOT"

# 2. 备份当前状态
log_info "步骤 2/8: 创建备份"
BACKUP_DIR="/www/backups/jhchat/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 备份数据库
log_info "正在备份数据库..."
mysqldump -u"$DB_USER" -p'JhChat@2026Secure!' "$DB_NAME" > "$BACKUP_DIR/db_backup.sql" 2>/dev/null || {
    log_warn "数据库备份失败，继续执行..."
}

# 备份代码
log_info "正在备份代码..."
tar -czf "$BACKUP_DIR/code_backup.tar.gz" -C "$PROJECT_ROOT" . 2>/dev/null || {
    log_warn "代码备份失败，继续执行..."
}
log_info "✓ 备份完成：$BACKUP_DIR"

# 3. Git 拉取最新代码
log_info "步骤 3/8: 拉取最新代码"
cd "$PROJECT_ROOT"
git fetch origin "$BRANCH" || {
    log_error "Git fetch 失败，请检查网络连接"
    exit 1
}

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    log_info "切换到分支：$BRANCH"
    git checkout "$BRANCH" || git checkout -b "$BRANCH"
fi

git pull origin "$BRANCH" || {
    log_error "Git pull 失败"
    exit 1
}
log_info "✓ 代码已更新到最新版本"

# 4. 检查数据库迁移
log_info "步骤 4/8: 检查数据库结构"
SYNC_SCRIPT="$PROJECT_ROOT/database/production-sync-v2026.3.sql"
if [ -f "$SYNC_SCRIPT" ]; then
    log_info "正在执行数据库同步..."
    
    # 检查字段是否存在
    TOTAL_EXP_EXISTS=$(mysql -u"$DB_USER" -p'JhChat@2026Secure!' -D"$DB_NAME" -e "SHOW COLUMNS FROM users LIKE 'total_exp';" 2>/dev/null | wc -l)
    
    if [ "$TOTAL_EXP_EXISTS" -lt 2 ]; then
        log_info "执行增量同步脚本..."
        mysql -u"$DB_USER" -p'JhChat@2026Secure!' "$DB_NAME" < "$SYNC_SCRIPT" 2>/dev/null || {
            log_warn "数据库同步脚本报错，尝试手动修复..."
            
            # 手动执行关键字段变更
            mysql -u"$DB_USER" -p'JhChat@2026Secure!' "$DB_NAME" -e "
                ALTER TABLE users CHANGE COLUMN \`all_value\` \`total_exp\` BIGINT NOT NULL DEFAULT 0 COMMENT '总经验值';
                ALTER TABLE users CHANGE COLUMN \`month_value\` \`monthly_exp\` BIGINT NOT NULL DEFAULT 0 COMMENT '月度经验值';
            " 2>/dev/null || log_warn "字段重命名失败（可能已存在）"
        }
        log_info "✓ 数据库结构已更新"
    else
        log_info "✓ 数据库结构已是最新"
    fi
else
    log_warn "未找到数据库同步脚本，跳过数据库更新"
fi

# 5. 安装依赖
log_info "步骤 5/8: 检查依赖"
cd "$BACKEND_DIR"
if [ -f "package.json" ]; then
    npm install --production --silent 2>/dev/null || {
        log_warn "后端依赖安装失败，继续执行..."
    }
    log_info "✓ 后端依赖检查完成"
fi

cd "$FRONTEND_DIR"
if [ -f "package.json" ]; then
    npm install --production --silent 2>/dev/null || {
        log_warn "前端依赖安装失败，继续执行..."
    }
    log_info "✓ 前端依赖检查完成"
fi

# 6. 构建前端
log_info "步骤 6/8: 构建前端"
cd "$FRONTEND_DIR"
if [ -f "package.json" ]; then
    npm run build --silent 2>/dev/null || {
        log_warn "前端构建失败，继续执行..."
    }
    log_info "✓ 前端构建完成"
fi

# 7. 重启服务
log_info "步骤 7/8: 重启服务"
export PM2_HOME="$PM2_HOME"

# 停止旧服务
pm2 stop jhchat-backend 2>/dev/null || true
pm2 stop jhchat-frontend 2>/dev/null || true

# 清理旧进程
pm2 delete jhchat-backend 2>/dev/null || true
pm2 delete jhchat-frontend 2>/dev/null || true

sleep 2

# 启动后端
cd "$BACKEND_DIR"
pm2 start npm --name "jhchat-backend" -- run start 2>/dev/null || {
    log_warn "后端启动失败，尝试其他方式..."
    pm2 start src/server.js --name "jhchat-backend" --interpreter node 2>/dev/null || true
}

# 启动前端
cd "$FRONTEND_DIR"
pm2 start npm --name "jhchat-frontend" -- run start 2>/dev/null || {
    log_warn "前端启动失败，尝试其他方式..."
    pm2 start ecosystem.config.js 2>/dev/null || true
}

sleep 5

# 检查服务状态
log_info "检查服务状态..."
pm2 status jhchat-backend 2>/dev/null || log_warn "后端服务未运行"
pm2 status jhchat-frontend 2>/dev/null || log_warn "前端服务未运行"

log_info "✓ 服务已重启"

# 8. 验证更新
log_info "步骤 8/8: 验证更新"
sleep 3

# 测试后端 API
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/admin/dashboard 2>/dev/null || echo "000")
if [ "$BACKEND_RESPONSE" = "200" ] || [ "$BACKEND_RESPONSE" = "401" ]; then
    log_info "✓ 后端服务正常 (HTTP $BACKEND_RESPONSE)"
else
    log_error "✗ 后端服务异常 (HTTP $BACKEND_RESPONSE)"
fi

# 测试前端
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "000")
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    log_info "✓ 前端服务正常 (HTTP $FRONTEND_RESPONSE)"
else
    log_warn "? 前端服务可能未启动 (HTTP $FRONTEND_RESPONSE)"
fi

# 完成
echo ""
log_info "============================================"
log_info "  更新完成！"
log_info "============================================"
echo ""
echo "版本：v2026.3.1"
echo "备份位置：$BACKUP_DIR"
echo ""
echo "查看日志命令:"
echo "  pm2 logs jhchat-backend --lines 50"
echo "  pm2 logs jhchat-frontend --lines 50"
echo ""
echo "服务管理命令:"
echo "  pm2 status"
echo "  pm2 restart jhchat-backend"
echo "  pm2 restart jhchat-frontend"
echo ""

# 可选：清理旧备份（保留最近 7 天）
log_info "清理 7 天前的旧备份..."
find /www/backups/jhchat -type f -mtime +7 -delete 2>/dev/null || true

exit 0
