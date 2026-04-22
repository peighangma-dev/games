@echo off
REM 江湖聊天室 Windows 桌面版构建脚本

echo ================================
echo 江湖聊天室 - Windows 桌面版构建
echo ================================
echo.

REM 检查 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：未找到 Node.js
    exit /b 1
)

echo [1/4] 安装依赖...
call npm install
if %errorlevel% neq 0 exit /b 1

echo.
echo [2/4] 构建前端...
call npm run build
if %errorlevel% neq 0 exit /b 1

echo.
echo [3/4] 复制图标文件...
if not exist "icon.ico" (
    echo 警告：未找到 icon.ico，请手动添加
)

echo.
echo [4/4] 构建 Electron 应用...
call npm run electron:build
if %errorlevel% neq 0 exit /b 1

echo.
echo ================================
echo 构建完成！
echo ================================
echo.
echo 安装包位置：dist-electron\
echo.
echo 安装程序：dist-electron\江湖聊天室 Setup *.exe
echo 便携版：dist-electron\win-unpacked\
echo.
pause
