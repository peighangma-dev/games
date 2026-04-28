#!/bin/bash
# ============================================
# 江湖聊天室 - 本地数据库快速测试脚本
# 版本：v2026.3.1
# ============================================

set -e

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

DB_USER="jhchat"
DB_PASS="JhChat@2026Secure!"
DB_NAME="jhchat"

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  江湖聊天室 - 本地数据库测试 v2026.3.1${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# 1. 检查关键字段
echo -e "${BLUE}[1/4] 检查关键字段...${NC}"
mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT COLUMN_NAME as 字段, COLUMN_TYPE as 类型
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='users' 
AND COLUMN_NAME IN ('total_exp', 'monthly_exp', 'chat_minutes_today', 'chat_minutes_total', 'last_chat_time')
ORDER BY COLUMN_NAME;
" 2>/dev/null && echo -e "${GREEN}✓ 字段检查完成${NC}\n" || echo -e "${RED}✗ 字段检查失败${NC}\n"

# 2. 测试数据查询
echo -e "${BLUE}[2/4] 测试数据查询...${NC}"
mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT id, username, total_exp, monthly_exp, chat_minutes_today 
FROM users LIMIT 3;
" 2>/dev/null && echo -e "${GREEN}✓ 数据查询正常${NC}\n" || echo -e "${RED}✗ 数据查询失败${NC}\n"

# 3. 检查新表
echo -e "${BLUE}[3/4] 检查新表...${NC}"
echo "等级配置表:"
mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) as 配置数量 FROM user_level_config;" 2>/dev/null || echo "表不存在"

echo "聊天经验日志表:"
mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) as 日志数量 FROM chat_exp_logs;" 2>/dev/null || echo "表不存在"

echo "管理员申请表:"
mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) as 申请数量 FROM admin_applications;" 2>/dev/null || echo "表不存在"
echo ""

# 4. 测试后端 API
echo -e "${BLUE}[4/4] 测试后端 API...${NC}"
if curl -s http://localhost:3001/api/admin/dashboard >/dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端服务响应正常${NC}"
    
    # 测试用户列表
    USER_LIST_RESPONSE=$(curl -s "http://localhost:3001/api/admin/users?page=1&limit=1" 2>/dev/null)
    if echo "$USER_LIST_RESPONSE" | grep -q "total_exp"; then
        echo -e "${GREEN}✓ 用户列表 API 返回 total_exp 字段${NC}"
    else
        echo -e "${YELLOW}⚠ 用户列表 API 未返回 total_exp 字段${NC}"
    fi
else
    echo -e "${YELLOW}⚠ 后端服务未启动 (http://localhost:3001)${NC}"
fi
echo ""

# 完成
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  测试完成！${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "如需测试完整功能，请访问："
echo "  - 管理后台：http://localhost:5173/admin"
echo "  - 用户管理：http://localhost:5173/admin/users"
echo "  - 管理员管理：http://localhost:5173/admin/managers"
echo ""
