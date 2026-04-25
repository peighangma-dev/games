#!/bin/bash

#===============================================================================
# 江湖聊天室 - 生产环境快速部署脚本
# 用途：从 Git 仓库拉取代码并部署到生产环境
#===============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置（请根据实际情况修改）
PROJECT_DIR="/www/games/jhchat"
BACKUP_DIR="/www/games/backup"
REPO_URL="https://github.com/peighangma-dev/games.git"
BRANCH_NAME="260413-feat-jhchat-refactor"

# 数据库配置
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="jhchat"
DB_PASSWORD="JhChat@2026Secure!"
DB_NAME="jhchat"

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}   江湖聊天室 - 生产环境快速部署${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# 检查是否已安装
if [ -d "${PROJECT_DIR}/frontend" ] && [ -f "${PROJECT_DIR}/frontend/package.json" ]; then
    info "检测到已安装的项目，执行更新..."
    cd "${PROJECT_DIR}"
    git pull origin "${BRANCH_NAME}"
else
    info "未检测到项目，执行全新安装..."
    mkdir -p "${PROJECT_DIR}"
    cd /www/games
    git clone -b "${BRANCH_NAME}" "${REPO_URL}" "${PROJECT_DIR}"
fi

cd "${PROJECT_DIR}"
success "代码拉取完成"

# 显示当前版本
info "当前分支：$(git rev-parse --abbrev-ref HEAD)"
info "最新提交：$(git log --oneline -1)"

echo ""
info "开始安装依赖..."

# 安装后端依赖
info "安装后端依赖..."
cd "${PROJECT_DIR}/backend"
npm install --production
success "后端依赖安装完成"

# 安装前端依赖
info "安装前端依赖..."
cd "${PROJECT_DIR}/frontend"
npm install
success "前端依赖安装完成"

# 构建前端
echo ""
info "构建前端..."
cd "${PROJECT_DIR}/frontend"
npm run build
success "前端构建完成"

# 执行数据库迁移
echo ""
info "执行数据库迁移..."
mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" \
  < "${PROJECT_DIR}/backend/migrations/20260425_create_system_updates_tables.sql

success "数据库迁移完成"

# 验证数据库
info "验证数据库表..."
TABLE_COUNT=$(mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" \
  -N -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='${DB_NAME}' AND TABLE_NAME='system_updates'" "${DB_NAME}")

if [ "${TABLE_COUNT}" -eq 1 ]; then
    success "system_updates 表创建成功"
else
    error "system_updates 表创建失败"
    exit 1
fi

echo ""
success "============================================="
success "   部署完成！"
success "============================================="
echo ""
info "下一步操作："
echo "  1. 配置 PM2（如果未配置）"
echo "     cd ${PROJECT_DIR}/backend && pm2 start src/server.js --name jhchat-backend"
echo "     cd ${PROJECT_DIR}/frontend && pm2 start npm --name jhchat-frontend -- run dev"
echo ""
echo "  2. 重启服务"
echo "     pm2 restart all"
echo ""
echo "  3. 验证服务"
echo "     curl http://localhost:3001/api/health"
echo "     pm2 status"
echo ""
echo "  4. 访问管理后台"
echo "     http://your-domain.com/admin"
echo ""
