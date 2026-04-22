# 江湖聊天室 - Android 移动端版本

## 编译说明

### 环境要求

1. **Android Studio** (推荐最新稳定版)
   - 下载地址：https://developer.android.com/studio
   - 或使用命令行工具：`sdkmanager` 和 `gradle`

2. **Node.js** 18+ 
   - 本项目已包含

3. **JDK 17+**
   - Android Studio 自带

### 快速开始

#### 1. 安装依赖

```bash
cd frontend
npm install
```

#### 2. 开发调试模式

```bash
# 在浏览器中开发
npm run dev

# 同步到 Android 工程
npm run mobile:build

# 用 Android Studio 打开
npm run mobile:open
```

#### 3. 构建 APK

##### Debug 版本（用于测试）

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

生成的 APK 路径：`android/app/build/outputs/apk/debug/app-debug.apk`

##### Release 版本（用于发布）

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

生成的 APK 路径：`android/app/build/outputs/apk/release/app-release-unsigned.apk`

### 配置说明

#### 1. 服务器地址配置

应用首次运行后，需要在设置页面配置后端服务器地址：

1. 打开应用
2. 进入「设置」页面
3. 输入服务器地址（如：`http://192.168.1.100:3001`）
4. 点击「测试」确认连接
5. 保存配置

#### 2. 后端服务部署

后端服务需要部署在可通过网络访问的服务器上：

```bash
cd backend
npm install
npm run dev
```

#### 3. 网络配置

确保客户端可以访问后端服务器：
- 局域网测试：使用 `http://192.168.x.x:3001`
- 公网访问：配置域名和 HTTPS

### Android 配置修改

#### 修改应用名称

编辑 `android/app/src/main/res/values/strings.xml`:

```xml
<string name="app_name">江湖聊天室</string>
```

#### 修改应用包名

1. 编辑 `android/app/build.gradle`
2. 修改 `applicationId` 字段
3. 同步 Gradle

#### 修改版本信息

编辑 `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        applicationId "com.jhchat.app"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

#### 权限配置

编辑 `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
```

### 签名发布版本

1. **生成签名密钥**

```bash
keytool -genkey -v -keystore jhchat-release-key.keystore -alias jhchat -keyalg RSA -keysize 2048 -validity 10000
```

2. **配置签名**

编辑 `android/keystore.properties`:

```properties
storePassword=你的密钥库密码
keyPassword=你的密钥密码
keyAlias=jhchat
storeFile=../jhchat-release-key.keystore
```

3. **修改 build.gradle**

编辑 `android/app/build.gradle`，添加签名配置。

### 常见问题

#### Q1: 无法连接后端服务器

- 确认后端服务已启动
- 确认服务器地址配置正确
- 确认防火墙允许访问
- 移动端使用 `http://` 需要在 AndroidManifest.xml 中配置：

```xml
<application android:usesCleartextTraffic="true">
```

#### Q2: APK 安装失败

- 确认已开启「未知来源应用」安装权限
- 确认 APK 文件完整
- 检查 Android 系统版本兼容性（最低 Android 5.0）

#### Q3: 白屏/闪退

- 清除应用缓存和数据
- 检查后端服务状态
- 使用 `adb logcat` 查看错误日志

### 使用 ADB 调试

```bash
# 查看连接的设备
adb devices

# 安装 APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# 查看日志
adb logcat | grep jhchat

# 卸载应用
adb uninstall com.jhchat.app
```

### 项目结构

```
frontend/
├── android/                  # Android 原生工程
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── assets/      # 前端构建产物
│   │   │   └── res/         # 资源文件
│   │   └── build.gradle
│   └── build.gradle
├── src/
│   ├── views/
│   │   └── MobileSettings.vue  # 移动端设置页面
│   └── styles/
│       └── mobile.css         # 移动端样式
├── capacitor.config.json      # Capacitor 配置
└── package.json
```

### 更新流程

1. 修改前端代码
2. 运行 `npm run build` 构建
3. 运行 `npx cap sync android` 同步到 Android
4. 在 Android Studio 中运行或构建 APK

## 技术支持

如有问题，请联系开发团队或提交 Issue。
