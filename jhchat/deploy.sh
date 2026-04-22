#!/bin/bash
# 江湖聊天室 - 一键部署包
# 用法：上传此文件到服务器后执行

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "======================================"
echo "  江湖聊天室 - 一键部署包"
echo "======================================"
echo -e "${NC}"

# 检查 git 是否安装
if ! command -v git &> /dev/null; then
    echo -e "${RED}错误：git 未安装${NC}"
    echo "请执行：apt-get update && apt-get install -y git"
    exit 1
fi

# 检查 node 是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误：Node.js 未安装${NC}"
    echo "请执行：curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y nodejs"
    exit 1
fi

echo -e "${GREEN}✓ 环境检查通过${NC}"
echo ""

# 克隆代码
if [ ! -d "/www/games" ]; then
    echo -e "${GREEN}正在克隆代码仓库...${NC}"
    mkdir -p /www
    cd /www
    git clone -b 260413-feat-jhchat-refactor --depth 1 https://github.com/peighangma-dev/games.git
else
    echo -e "${GREEN}正在更新代码...${NC}"
    cd /www/games
    git pull origin 260413-feat-jhchat-refactor
fi

echo ""
echo -e "${GREEN}代码已就绪，正在运行部署脚本...${NC}"
echo ""

# 运行部署脚本
cd /www/games/jhchat
bash scripts/quick-deploy.sh

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "访问地址：http://45.192.101.76"
echo ""
