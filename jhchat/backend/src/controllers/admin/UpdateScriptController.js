/**
 * 生产端更新检测 Shell 脚本接口
 * GET /api/updates/latest.sh
 * 返回可执行的 shell 脚本，用于生产端一键更新
 */

const updateScripts = `#!/bin/bash

# ========================================
# 江湖聊天室 - 一键更新检测安装脚本
# ========================================
# 使用方法:
#   curl -s https://admin.example.com/api/updates/latest.sh | bash
# 或:
#   curl -s https://admin.example.com/api/updates/latest.sh -o update.sh
#   chmod +x update.sh
#   ./update.sh
# ========================================

set -e

# 配置
ADMIN_URL="{{ADMIN_URL}}"
CURRENT_VERSION="{{CURRENT_VERSION}}"
WORKSPACE="{{WORKSPACE}}"
BACKUP_DIR="$WORKSPACE/backups"
DOWNLOAD_DIR="$WORKSPACE/downloads"

# 颜色
RED='\\\\033[0;31m'
GREEN='\\\\033[0;32m'
YELLOW='\\\\033[1;33m'
NC='\\\\033[0m'

echo -e "\${GREEN}=========================================\${NC}"
echo -e "\${GREEN}江湖聊天室 - 自动更新检测\${NC}"
echo -e "\${GREEN}=========================================\${NC}"
echo ""

# 读取当前版本
if [ -f "$WORKSPACE/VERSION" ]; then
  CURRENT_VERSION=$(cat "$WORKSPACE/VERSION")
  echo "当前版本：$CURRENT_VERSION"
else
  CURRENT_VERSION="v1.0.0"
  echo "未检测到 VERSION 文件，假设当前版本：$CURRENT_VERSION"
fi

echo ""
echo "检查更新中..."
echo ""

# 检查更新
RESPONSE=$(curl -s -f "{{ADMIN_URL}}/api/updates/available?currentVersion=$CURRENT_VERSION" || echo '{"success":false}')

HAS_UPDATE=$(echo "$RESPONSE" | jq -r '.data.hasUpdate // false')

if [ "$HAS_UPDATE" != "true" ]; then
  echo -e "\${GREEN}✅ 已是最新版本，无需更新\${NC}"
  exit 0
fi

# 获取更新信息
UPDATE_COUNT=$(echo "$RESPONSE" | jq -r '.data.updates | length')
LATEST_UPDATE=$(echo "$RESPONSE" | jq -r '.data.updates[-1]')

NEW_VERSION=$(echo "$LATEST_UPDATE" | jq -r '.version')
UPDATE_TITLE=$(echo "$LATEST_UPDATE" | jq -r '.title')
PACKAGE_URL=$(echo "$LATEST_UPDATE" | jq -r '.package.download_url')
PACKAGE_HASH=$(echo "$LATEST_UPDATE" | jq -r '.package.hash')
PACKAGE_SIZE=$(echo "$LATEST_UPDATE" | jq -r '.package.size')

echo -e "\${YELLOW}发现 $UPDATE_COUNT 个可用更新:\${NC}"
echo "  最新版本：$NEW_VERSION"
echo "  更新标题：$UPDATE_TITLE"
echo "  包大小：$((PACKAGE_SIZE / 1024)) KB"
echo ""

# 用户确认
read -p "是否立即更新？[y/N]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "取消更新"
  exit 0
fi

echo ""
echo "开始更新..."
echo ""

# 创建目录
mkdir -p "$BACKUP_DIR"
mkdir -p "$DOWNLOAD_DIR"

# 备份当前版本
echo "步骤 1: 备份当前版本..."
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

tar -czf "$BACKUP_PATH" -C "$WORKSPACE" jhchat 2>/dev/null || true
echo "✅ 备份完成：$BACKUP_PATH"
echo ""

# 下载更新包
echo "步骤 2: 下载更新包..."
DOWNLOAD_FILE="$DOWNLOAD_DIR/update-$NEW_VERSION.zip"

curl -L -f -o "$DOWNLOAD_FILE" "$PACKAGE_URL"

if [ $? -ne 0 ]; then
  echo -e "\${RED}❌ 下载更新包失败\${NC}"
  exit 1
fi

echo "✅ 下载完成：$DOWNLOAD_FILE"
echo ""

# 校验哈希
echo "步骤 3: 校验文件完整性..."
DOWNLOAD_HASH=$(sha256sum "$DOWNLOAD_FILE" | cut -d' ' -f1)

if [ "$DOWNLOAD_HASH" != "$PACKAGE_HASH" ]; then
  echo -e "\${RED}❌ 文件哈希不匹配!\${NC}"
  echo "  预期：$PACKAGE_HASH"
  echo "  实际：$DOWNLOAD_HASH"
  exit 1
fi

echo "✅ 文件完整性验证通过"
echo ""

# 解压
echo "步骤 4: 解压更新包..."
UNPACK_DIR="$DOWNLOAD_DIR/unpack-$$"
mkdir -p "$UNPACK_DIR"

unzip -q -o "$DOWNLOAD_FILE" -d "$UNPACK_DIR"

echo "✅ 解压完成"
echo ""

# 停止服务
echo "步骤 5: 安装更新..."
pkill -f "node.*server.js" 2>/dev/null || true
sleep 2

# 复制文件
if [ -d "$UNPACK_DIR/jhchat" ]; then
  cp -rf "$UNPACK_DIR/jhchat"/* "$WORKSPACE/jhchat/"
  echo "✅ 文件复制完成"
  
  # 安装依赖
  echo "安装依赖..."
  cd "$WORKSPACE/jhchat/backend"
  npm install --production 2>&1 | head -20
  
  # 执行数据库更新
  if [ -f "$WORKSPACE/jhchat/backend/.env" ]; then
    source "$WORKSPACE/jhchat/backend/.env"
    mysql -h"\${DB_HOST:-localhost}" -u"\${DB_USER:-jhchat}" -p"\${DB_PASSWORD}" "\${DB_NAME:-jhchat}" \
      < "$WORKSPACE/jhchat/database/updates_table.sql" 2>/dev/null || true
  fi
else
  echo -e "\${YELLOW}⚠️  更新包中没有 jhchat 目录\${NC}"
fi

# 启动服务
echo "启动服务..."
cd "$WORKSPACE/jhchat/backend"
nohup node src/server.js > /tmp/backend.log 2>&1 &
sleep 3

# 检查服务状态
if curl -s http://localhost:3001/api/ping | grep -q "pong"; then
  echo -e "\${GREEN}✅ 服务启动成功\${NC}"
else
  echo -e "\${RED}❌ 服务启动失败\${NC}"
  echo "正在回滚..."
  tar -xzf "$BACKUP_PATH" -C "$WORKSPACE"
  cd "$WORKSPACE/jhchat/backend"
  nohup node src/server.js > /tmp/backend.log 2>&1 &
  echo -e "\${YELLOW}已回滚到版本 $CURRENT_VERSION\${NC}"
  exit 1
fi

# 清理
echo "清理临时文件..."
rm -rf "$UNPACK_DIR"

# 报告安装状态
echo "报告安装状态..."
curl -s -X POST "{{ADMIN_URL}}/api/updates/install" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "success",
    "server_url": "'$(hostname)':3001",
    "installed_by": "auto-update-script"
  }' > /dev/null || true

echo ""
echo -e "\${GREEN}=========================================\${NC}"
echo -e "\${GREEN}✅ 更新完成!\${NC}"
echo -e "\${GREEN}=========================================\${NC}"
echo "已更新到版本：$NEW_VERSION"
echo "日志文件：/tmp/backend.log"
echo ""

# 更新 VERSION 文件
echo "$NEW_VERSION" > "$WORKSPACE/VERSION"

exit 0
`;

module.exports = {
  /**
   * 生成更新检测脚本
   */
  generateScript: (baseUrl) => {
    return updateScripts.replace(/\{\{ADMIN_URL\}\}/g, baseUrl);
  }
};
