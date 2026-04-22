# 江湖聊天室 - Android 移动端

## 快速开始

### 方式一：使用构建脚本 (推荐)

```bash
cd frontend
bash scripts/build-android.sh
```

### 方式二：手动构建

```bash
# 1. 安装依赖
cd frontend
npm install

# 2. 构建前端
npm run build

# 3. 同步到 Android
npx cap sync android

# 4. 构建 APK
cd android
./gradlew assembleDebug

# APK 输出路径
# android/app/build/outputs/apk/debug/app-debug.apk
```

## 安装到手机

### 方法 1: USB 调试安装

1. 在手机设置中开启「开发者选项」和「USB 调试」
2. 连接手机到电脑
3. 运行命令：

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 方法 2: 直接传输安装

1. 将 APK 文件复制到手机
2. 在手机上打开 APK 文件
3. 允许「未知来源应用」安装
4. 点击安装

## 配置服务器地址

应用首次运行需要配置后端服务器地址：

1. 打开应用，进入**设置**页面
2. 输入后端服务器地址，例如：
   - 本地开发：`http://192.168.1.100:3001`
   - 公网地址：`https://jhchat.example.com`
3. 点击「测试」确认连接
4. 保存配置

## 后端服务部署

### 本地开发

```bash
cd backend
npm install
npm run dev
```

确保服务器运行在可通过网络访问的地址。

### 生产环境

建议使用 Docker 或 Linux 服务器部署：

```bash
# 使用 PM2
npm install -g pm2
pm2 start src/server.js --name jhchat
pm2 startup
pm2 save
```

## 构建 Release 版本

### 1. 生成签名密钥

```bash
keytool -genkey -v \
  -keystore jhchat-release-key.keystore \
  -alias jhchat \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### 2. 配置签名

创建 `android/keystore.properties`:

```properties
storePassword=你的密钥库密码
keyPassword=你的密钥密码
keyAlias=jhchat
storeFile=../jhchat-release-key.keystore
```

### 3. 构建 Release APK

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

## 常用命令

```bash
# 用 Android Studio 打开
npm run mobile:open

# 构建 Debug 版本
npm run android:build

# 构建 Release 版本
npm run android:release

# 完全重新同步
npx cap sync android
```

## 调试

### 使用 Chrome DevTools

1. 手机连接电脑，开启 USB 调试
2. Chrome 浏览器访问：`chrome://inspect/#devices`
3. 找到设备并点击「inspect」

### 使用 ADB 日志

```bash
# 查看应用日志
adb logcat | grep jhchat

# 清除日志
adb logcat -c

# 保存到文件
adb logcat > app.log
```

## 文件结构

```
frontend/
├── android/                    # Android 工程
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── assets/public/  # 前端构建产物
│   │   │   └── res/           # 资源文件
│   │   └── build.gradle
│   └── gradlew
├── src/
│   ├── views/
│   │   ├── MobileLayout.vue   # 移动端布局
│   │   └── MobileSettings.vue # 设置页面
│   └── styles/
│       └── mobile.css         # 移动端样式
├── scripts/
│   └── build-android.sh       # 构建脚本
├── capacitor.config.json      # Capacitor 配置
└── package.json
```

## 功能特性

- ✅ 完整聊天功能
- ✅ 门派系统管理
- ✅ 游戏娱乐功能
- ✅ 排行榜系统
- ✅ 个人中心
- ✅ 服务器配置管理
- ✅ 响应式移动端 UI
- ✅ 原生状态栏适配
- ✅ 安全区域适配（iPhone）
- ✅ 暗黑模式支持

## 系统要求

- **最低 Android 版本**: 5.0 (API 21)
- **推荐 Android 版本**: 10.0+ (API 29)
- **网络**: 需要网络连接

## 注意事项

1. **HTTP 明文流量**
   - Debug 版本已允许 HTTP 明文流量
   - Release 版本建议使用 HTTPS

2. **服务器地址**
   - 本地测试使用局域网 IP
   - 公网部署需要配置 HTTPS 和域名

3. **性能优化**
   - 建议后端使用 Redis 缓存
   - 使用 CDN 加速静态资源

## 常见问题

**Q: APK 无法安装？**
- 检查是否开启「未知来源应用」
- 确认 APK 文件完整
- 检查 Android 系统版本兼容性

**Q: 白屏/无法连接？**
- 确认后端服务已启动
- 检查服务器地址配置
- 查看网络连接状态

**Q: 如何修改应用名称？**
- 编辑 `android/app/src/main/res/values/strings.xml`
- 修改 `<string name="app_name">江湖聊天室</string>`

**Q: 如何修改应用图标？**
- 替换 `android/app/src/main/res/mipmap-*/ic_launcher.png`
- 建议使用 512x512 PNG 图片生成

## 技术支持

如遇问题，请：
1. 查看应用日志
2. 检查后端服务状态
3. 确认网络配置正确
4. 联系开发团队或提交 Issue
