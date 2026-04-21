#!/bin/bash
# 后台管理经济监控功能测试脚本
# 使用方式：./test_economy_api.sh

API_URL="http://localhost:3001/api"

echo "=== 笑傲江湖 - 后台管理经济监控 API 测试 ==="
echo ""

# 1. 管理员登录
echo "1. 测试管理员登录..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"站长","password":"admin123"}')

echo "登录响应：$LOGIN_RESPONSE" | jq .

# 提取 token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ 登录失败，无法获取 token"
  exit 1
fi
echo "✅ 登录成功，Token: ${TOKEN:0:20}..."
echo ""

# 2. 测试经济统计 API
echo "2. 测试经济统计 API..."
curl -s "${API_URL}/admin/economy/stats" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 3. 测试富豪榜 API
echo "3. 测试富豪榜 API..."
curl -s "${API_URL}/admin/economy/rich-list?limit=10" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

echo "=== 测试完成 ==="
