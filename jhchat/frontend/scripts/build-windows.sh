#!/bin/bash

# 江湖聊天室 Windows 桌面版构建脚本

set -e

echo "================================"
echo "江湖聊天室 - Windows 桌面版构建"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误：未找到 Node.js${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/4] 安装依赖...${NC}"
npm install

echo -e "${YELLOW}[2/4] 构建前端...${NC}"
npm run build

echo -e "${YELLOW}[3/4] 复制图标文件...${NC}"
# 确保有图标文件，如果没有就创建一个简单的
if [ ! -f "icon.ico" ]; then
    echo -e "${YELLOW}警告：未找到 icon.ico，使用默认图标${NC}"
fi

echo -e "${YELLOW}[4/4] 构建 Electron 应用...${NC}"
npm run electron:build

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✓ 构建完成！${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "安装包位置：dist-electron/"
echo ""
echo "安装程序：dist-electron/江湖聊天室 Setup x.x.x.exe"
echo "便携版：dist-electron/win-unpacked/"
