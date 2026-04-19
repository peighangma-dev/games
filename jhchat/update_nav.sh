#!/bin/bash

# 批量更新页面导航栏脚本

PAGES=(
  "Chat.vue"
  "Skills.vue"
  "Market.vue"
  "Shop.vue"
  "Games.vue"
  "Pets.vue"
  "Alchemy.vue"
  "Fishing.vue"
  "Fortune.vue"
  "Messages.vue"
  "Sect.vue"
  "Marriage.vue"
  "Profile.vue"
  "Rankings.vue"
  "Wishes.vue"
)

echo "顶部导航统一更新脚本"
echo "===================="
echo ""
echo "已更新的文件:"
echo "  ✅ Main.vue"
echo "  ✅ Items.vue"
echo ""
echo "待更新的文件:"
for page in "${PAGES[@]}"; do
  echo "  ⏳ $page"
done

echo ""
echo "预览地址：http://localhost:5173"
echo "管理后台：http://localhost:5173/admin"
echo "默认账号：站长 / admin123"
