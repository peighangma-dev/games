#!/bin/bash

# ========================================
# 系统更新管理数据库表 - 初始化脚本
# ========================================

set -e

# 数据库配置
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-jhchat}"
DB_NAME="${DB_NAME:-jhchat}"

echo "====================================="
echo "系统更新管理数据库表初始化"
echo "====================================="
echo "数据库：$DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# 检查 MySQL 连接
if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"${DB_PASSWORD}" -e "SELECT 1" > /dev/null 2>&1; then
  echo "❌ 数据库连接失败！请检查数据库配置"
  exit 1
fi

echo "✅ 数据库连接成功"
echo ""

# 执行 SQL 脚本
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/updates_table.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "❌ SQL 文件不存在：$SQL_FILE"
  exit 1
fi

echo "📝 执行 SQL 脚本..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"${DB_PASSWORD}" "$DB_NAME" < "$SQL_FILE"

echo "✅ 数据库表创建成功！"
echo ""

# 验证表是否存在
TABLES=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"${DB_PASSWORD}" "$DB_NAME" -e "SHOW TABLES LIKE 'system%';" | grep -E "system_updates|system_config")

if [ -n "$TABLES" ]; then
  echo "✅ 表结构验证成功:"
  echo "$TABLES"
else
  echo "❌ 表结构验证失败"
  exit 1
fi

echo ""
echo "====================================="
echo "初始化完成！"
echo "====================================="
echo ""
echo "下一步:"
echo "1. 访问 /admin/updates 管理更新记录"
echo "2. 创建第一个版本更新记录"
echo "3. 发布并推送到生产环境"
echo ""
