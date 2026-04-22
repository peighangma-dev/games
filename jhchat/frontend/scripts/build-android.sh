#!/bin/bash

# 江湖聊天室 Android 构建脚本

set -e

echo "================================"
echo "江湖聊天室 - Android 构建脚本"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 步骤 1: 安装依赖
echo -e "${YELLOW}[1/5] 安装依赖...${NC}"
npm install

# 步骤 2: 构建前端
echo -e "${YELLOW}[2/5] 构建前端...${NC}"
npm run build

# 步骤 3: 同步到 Capacitor
echo -e "${YELLOW}[3/5] 同步到 Android...${NC}"
npx cap sync android

# 步骤 4: 构建 APK
echo -e "${YELLOW}[4/5] 构建 Android APK...${NC}"
cd android
chmod +x gradlew
./gradlew assembleDebug

# 获取 APK 路径
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"

if [ -f "$APK_PATH" ]; then
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}✓ 构建成功！${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo "APK 路径：$APK_PATH"
    echo ""
    echo "安装到设备："
    echo "  adb install $APK_PATH"
    echo ""
    echo "使用 Android Studio 打开："
    echo "  npx cap open android"
else
    echo -e "${RED}================================${NC}"
    echo -e "${RED}✗ 构建失败${NC}"
    echo -e "${RED}================================${NC}"
    exit 1
fi
