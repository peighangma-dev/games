# 服务器地址配置指南

## 概述

江湖聊天室的 **Android 版** 和 **Windows 桌面版** 都提供了灵活的服务器地址配置功能，支持快速切换不同的后端服务器。

## 配置方式

### 方式一：UI 界面配置（推荐）

#### Android / 移动端

1. 打开应用
2. 进入 **设置** 页面
3. 点击 **服务器地址** 卡片
4. 选择预设或输入自定义地址
5. 点击 **测试** 确认连接
6. 保存配置

#### Windows 桌面版

1. 打开应用
2. 点击顶部菜单栏 **设置** 按钮
3. 选择 **服务器配置**
4. 选择预设或输入自定义地址
5. 点击 **测试** 确认连接
6. 保存配置

### 方式二：配置文件（高级）

#### Android

编辑文件：
```
/data/data/com.jhchat.app/shared_prefs/config.xml
```
或直接修改应用内配置。

#### Windows

编辑文件：
```
C:\Users\你的用户名\AppData\Roaming\com.jhchat.desktop\config.json
```

添加或修改：
```json
{
  "serverUrl": "https://your-server.com"
}
```

## 预设管理

### 默认预设

应用内置了 3 个默认预设：

| 名称 | 地址 | 说明 |
|------|------|------|
| 本地开发 | http://localhost:3001 | 本地开发环境 |
| 局域网 | http://192.168.1.100:3001 | 公司/家庭局域网 |
| 公网地址 | https://jhchat.example.com | 公网服务器 |

### 添加自定义预设

1. 进入 **服务器配置** 页面
2. 点击 **➕ 添加**
3. 填写：
   - **名称**：如"公司服务器"
   - **地址**：完整的 URL（含协议）
   - **描述**：可选说明
4. 保存

### 编辑/删除预设

- **编辑**：点击预设卡片，修改后保存
- **删除**：长按预设卡片（Android）或右键（Windows）
- **重置**：点击 **🔄 重置** 恢复默认预设

## 导入/导出配置

### 导出配置

当需要分享服务器配置或备份时：

1. 进入 **服务器配置** 页面
2. 点击 **📥 导入/导出**
3. 选择 **导出** 标签
4. 点击 **📋 复制配置**
5. 保存 JSON 字符串

导出的配置示例：
```json
{
  "serverUrl": "https://api.example.com",
  "presets": [
    {
      "name": "生产环境",
      "url": "https://api.example.com",
      "description": "生产服务器",
      "enabled": true
    },
    {
      "name": "测试环境",
      "url": "https://test.example.com",
      "description": "测试服务器",
      "enabled": true
    }
  ]
}
```

### 导入配置

当需要快速配置或接收他人分享的配置时：

1. 复制配置 JSON 字符串
2. 进入 **服务器配置** 页面
3. 点击 **📥 导入/导出**
4. 选择 **导入** 标签
5. 粘贴配置字符串
6. 点击 **📥 导入配置**
7. 自动测试连接并保存

## 域名/地址更换场景

### 场景 1: 开发环境切换

开发过程中经常需要切换本地服务器：

```json
{
  "serverUrl": "http://localhost:3001",
  "presets": [
    {"name": "本地-3001", "url": "http://localhost:3001"},
    {"name": "本地-3002", "url": "http://localhost:3002"},
    {"name": "本地-8080", "url": "http://localhost:8080"}
  ]
}
```

### 场景 2: 测试→生产切换

测试完成后切换到生产环境：

```json
{
  "serverUrl": "https://api.production.com",
  "presets": [
    {"name": "测试环境", "url": "https://test.example.com"},
    {"name": "生产环境", "url": "https://api.production.com"}
  ]
}
```

### 场景 3: 批量分发配置

为团队成员统一配置服务器地址：

1. 管理员导出配置 JSON
2. 通过邮件/聊天工具分发给团队
3. 团队成员导入配置
4. 所有人使用相同的服务器设置

## 后端配置

### 添加服务器信息接口

后端需要实现 `/api/ping` 和 `/api/server-info` 接口：

```javascript
// GET /api/ping
{
  "status": "ok",
  "message": "pong",
  "timestamp": 1713787200000,
  "app_name": "江湖聊天室",
  "version": "1.0.0"
}

// GET /api/server-info
{
  "success": true,
  "data": {
    "app_name": "江湖聊天室",
    "version": "1.0.0",
    "environment": "production",
    "database": "MySQL",
    "server_time": "2024-04-22T10:00:00Z"
  }
}
```

### 健康检查

客户端会定期调用 `/api/ping` 接口检查服务器状态：
- ✅ 绿色：服务器正常
- ❌ 红色：连接失败
- ⏳ 黄色：测试中

## 常见问题

### Q1: 配置不生效？

**解决**：
1. 确认已点击 **保存**
2. 重启应用
3. 清除应用缓存后重试

### Q2: 无法连接到服务器？

**检查**：
1. 服务器地址格式是否正确（含 http:// 或 https://）
2. 服务器是否正常运行
3. 网络是否通畅
4. 防火墙是否阻止

### Q3: 如何配置 HTTPS 证书？

**方案**：
1. 使用有效 SSL 证书（推荐 Let's Encrypt）
2. Android 需要在网络安全配置中信任证书
3. Windows 需要安装根证书

### Q4: 能否动态更新服务器列表？

可以，后端可以通过 API 返回可用服务器列表，客户端获取后更新预设。

### Q5: 如何为不同用户配置不同服务器？

使用配置导入功能：
1. 为不同用户组准备不同的配置 JSON
2. 分发对应的配置
3. 用户导入后自动设置

## 配置文件位置

### Android
```
/data/data/com.jhchat.app/shared_prefs/config.xml
/data/data/com.jhchat.app/files/server_presets.json
```

### Windows
```
C:\Users\你的用户名\AppData\Roaming\com.jhchat.desktop\config.json
```

### 浏览器
```
localStorage.setItem('server_url', '...')
localStorage.setItem('server_presets', '...')
```

## 配置同步

### 手动同步
通过导入/导出功能手动迁移配置。

### 自动同步（未来功能）
登录后自动从服务器下载用户的服务器配置偏好。

## 安全建议

1. **不要分享包含敏感信息的配置**
   - 检查配置中是否有内网地址
   - 移除测试服务器后再分享

2. **生产环境使用 HTTPS**
   - 避免明文传输数据
   - 配置有效的 SSL 证书

3. **定期更新服务器地址**
   - 服务器迁移后及时更新客户端配置
   - 清理不再使用的预设

## 技术支持

如遇问题，请：
1. 查看应用日志
2. 检查服务器状态
3. 确认网络配置正确
4. 联系开发团队或提交 Issue
