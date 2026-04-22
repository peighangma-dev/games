# 江湖聊天室 - Windows 桌面版

## 快速开始

### 方式一：使用构建脚本

```bash
cd frontend
bash scripts/build-windows.sh
```

### 方式二：手动构建

```bash
# 1. 安装依赖
cd frontend
npm install

# 2. 构建前端
npm run build

# 3. 构建 Electron 应用
npm run electron:build
```

## 功能特性

### 🎯 核心功能

- ✅ **老板键** - 一键隐藏窗口，摸鱼必备
- ✅ **托盘图标** - 最小化到系统托盘
- ✅ **声音控制** - 全局静音/取消静音
- ✅ **桌面通知** - 新消息提醒
- ✅ **开机自启** - 可选自动启动
- ✅ **窗口置顶** - 聊天窗口始终可见
- ✅ **快捷键** - 自定义全局快捷键
- ✅ **配置持久化** - 设置自动保存

### 🛠️ 技术栈

- **Electron 41.x** - 跨平台桌面框架
- **Vue 3** - 前端框架
- **electron-builder** - 打包工具
- **NSIS** - Windows 安装程序

## 下载和安装

### 下载安装程序

构建完成后，在安装目录找到：
```
dist-electron/江湖聊天室 Setup x.x.x.exe
```

双击运行安装程序，按照提示完成安装。

### 便携版

```
dist-electron/win-unpacked/江湖聊天室.exe
```

直接运行，无需安装。

## 使用方法

### 启动应用

1. 双击桌面快捷方式
2. 或在开始菜单找到"江湖聊天室"

### 老板键

默认快捷键：**Alt+X**

按下后窗口会隐藏并最小化到系统托盘，再次按下恢复显示。

可在设置页面自定义老板键：
- 支持组合键：Ctrl+Alt+X, Shift+Win+X 等
- 点击输入框，按下想要的组合键即可

### 托盘图标

- **双击托盘图标**：显示/隐藏窗口
- **右键托盘图标**：打开菜单
  - 显示/隐藏
  - 静音/取消静音
  - 设置
  - 退出

### 配置设置

打开应用后，进入「设置」→「桌面版设置」

可配置项：
- **老板键**：自定义隐藏窗口的快捷键
- **启动行为**：启动时最小化到托盘
- **开机自启**：随系统启动
- **窗口置顶**：聊天窗口始终在最前
- **声音控制**：启用/禁用所有音效
- **通知**：启用/禁用桌面通知

## 配置存储

应用配置保存在：
```
C:\Users\你的用户名\AppData\Roaming\com.jhchat.desktop\config.json
```

### 配置文件示例

```json
{
  "bossKey": "Alt+X",
  "enableSound": true,
  "enableNotification": true,
  "alwaysOnTop": false,
  "startMinimized": false,
  "autoStart": false
}
```

## 常用操作

### 最小化到托盘

直接点最小化按钮，窗口会隐藏到托盘。

### 完全退出

1. 右键托盘图标 → 退出
2. 或按老板键隐藏后，右键托盘图标 → 退出

### 禁用声音

1. 右键托盘图标 → 静音/取消静音
2. 或在设置中关闭"启用背景声音和音效"

## 快捷键参考

| 功能 | 默认快捷键 | 说明 |
|------|----------|------|
| 老板键 | Alt+X | 隐藏/显示窗口 |
| 可自定义 | 任意组合 | 在设置中配置 |

## 开发调试

### 启动开发模式

```bash
# 终端1：启动 Vite 开发服务器
npm run dev

# 终端2：启动 Electron
npm run electron:start
```

### 使用开发者工具

- 应用内按 **F12** 打开 DevTools
- 或右键 → 检查元素

### 调试日志

打开后可以看到控制台输出，包括：
- 快捷键注册日志
- 配置加载日志
- 错误信息

## 项目结构

```
frontend/
├── electron/
│   ├── main.js          # Electron 主进程
│   └── preload.js       # 预加载脚本
├── src/
│   └── views/
│       └── DesktopSettings.vue  # 桌面版设置页面
├── scripts/
│   └── build-windows.sh  # Windows 构建脚本
├── icon.ico              # 应用图标
├── package.json          # Electron 配置
└── dist-electron/        # 构建输出
    ├── 江湖聊天室 Setup x.x.x.exe  # 安装程序
    └── win-unpacked/     # 便携版
```

## 自定义图标

替换 `icon.ico` 文件（256x256 PNG 格式最佳），然后重新构建即可。

## 常见问题

### Q1: 杀毒软件报毒

这是 Electron 应用的常见问题，因为是刚编译的可执行文件。

解决方法：
- 添加到杀毒软件白名单
- 或从源代码自行构建

### Q2: 老板键不生效

- 检查是否与其他软件快捷键冲突
- 在设置页面重新设置老板键
- 重启应用

### Q3: 无法最小化到托盘

- 检查系统托盘是否隐藏了该图标
- Windows 设置 → 任务栏 → 通知区域 → 选择哪些图标显示

### Q4: 无法播放声音

- 检查系统音量
- 在设置中确认已启用声音
- 检查音响/耳机连接

### Q5: 开机无法自启

- 检查杀毒软件是否阻止
- 任务管理器 → 启动 → 确认已启用

## 系统要求

- **操作系统**: Windows 10 或更高版本
- **内存**: 最低 2GB RAM，推荐 4GB+
- **存储**: 至少 200MB 可用空间
- **网络**: 需要网络连接访问后端服务

## 打包发布

### 构建 Windows 安装程序

```bash
npm run electron:build
```

输出：
- `dist-electron/江湖聊天室 Setup x.x.x.exe` - 安装程序
- `dist-electron/win-unpacked/` - 便携版

### 构建其他格式

编辑 `package.json` 的 `build.win.target` 字段：

```json
"win": {
  "target": [
    {"target": "nsis"},
    {"target": "portable"},
    {"target": "zip"}
  ]
}
```

## 更新策略

当前版本不支持自动更新，需要手动下载安装新版。

后续会添加自动更新功能。

## 技术支持

如遇问题：
1. 查看应用日志
2. 检查配置文件
3. 重启应用
4. 联系开发团队或提交 Issue
