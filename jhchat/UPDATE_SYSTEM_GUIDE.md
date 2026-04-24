# 系统更新推送功能

## 📋 功能概述

提供完整的系统更新管理功能，支持：
- ✅ 版本更新记录管理
- ✅ 更新内容记录（变更列表）
- ✅ 发布和推送管理
- ✅ 生产端自动检查更新
- ✅ 推送历史记录追踪
- ✅ 从 Git 自动生成更新日志

---

## 🗄️ 数据库表

### system_updates - 系统更新记录表

```sql
-- 主要字段
version          - 版本号 (v1.0.0)
version_code     - 版本号数字 (用于比较，如 10000 代表 v1.0.0)
title            - 更新标题
description      - 更新描述
changes          - 更新内容列表 (JSON 数组)
type             - 更新类型 (major/minor/patch/hotfix)
priority         - 优先级 (low/normal/high/critical)
force_update     - 是否强制更新
status           - 状态 (draft/released/archived)
release_date     - 发布日期
breaking_changes - 是否有破坏性变更
```

### update_push_logs - 更新推送记录表

```sql
-- 主要字段
update_id        - 更新 ID
version          - 版本号
environment      - 环境 (development/staging/production)
server_url       - 服务器地址
push_status      - 推送状态 (pending/success/failed/partial)
push_time        - 推送时间
acknowledge_time - 生产端确认时间
rollback_status  - 回滚状态
```

---

## 🔧 后端 API

### 1. 获取更新列表

```http
GET /api/admin/updates
Authorization: Bearer <token>

Query Parameters:
- page: 页码 (默认 1)
- limit: 每页数量 (默认 20)
- status: 状态过滤 (draft/released/archived)
- type: 类型过滤 (major/minor/patch/hotfix)
- priority: 优先级过滤
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "updates": [
      {
        "id": 1,
        "version": "v1.1.0",
        "version_code": 10100,
        "title": "管理后台增强",
        "type": "minor",
        "priority": "normal",
        "status": "released",
        "release_date": "2026-04-24T10:00:00.000Z"
      }
    ],
    "total": 10,
    "page": 1,
    "totalPages": 1
  }
}
```

### 2. 获取更新详情

```http
GET /api/admin/updates/:id
Authorization: Bearer <token>
```

### 3. 创建更新记录

```http
POST /api/admin/updates
Authorization: Bearer <token>
Content-Type: application/json

{
  "version": "v1.2.0",
  "title": "新增游戏系统",
  "description": "添加了钓鱼、挖矿等游戏功能",
  "changes": [
    "新增钓鱼系统",
    "新增挖矿系统",
    "新增物品交易系统"
  ],
  "type": "minor",
  "priority": "normal",
  "force_update": false,
  "breaking_changes": false,
  "affected_modules": ["game", "item", "trade"]
}
```

### 4. 发布更新

```http
POST /api/admin/updates/:id/release
Authorization: Bearer <token>
Content-Type: application/json

{
  "release_date": "2026-04-24T10:00:00.000Z"
}
```

### 5. 推送更新到生产环境

```http
POST /api/admin/updates/:id/push
Authorization: Bearer <token>
Content-Type: application/json

{
  "environment": "production",
  "server_url": "https://production.example.com"
}
```

### 6. 检查更新（生产端使用）

```http
GET /api/updates/check?currentVersion=v1.0.0
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "hasUpdate": true,
    "currentVersion": "v1.0.0",
    "updates": [
      {
        "id": 2,
        "version": "v1.1.0",
        "versionCode": 10100,
        "title": "管理后台增强",
        "type": "minor",
        "priority": "normal",
        "forceUpdate": false,
        "releaseDate": "2026-04-24T10:00:00.000Z"
      }
    ]
  }
}
```

---

## 🎨 前端界面

### 访问路径

`/admin/updates` - 系统更新管理页面

### 功能特性

1. **更新列表** - 查看所有版本更新记录
2. **筛选过滤** - 按状态、类型、优先级筛选
3. **创建更新** - 手动创建更新记录
4. **编辑更新** - 修改更新内容
5. **发布更新** - 将草稿状态改为已发布
6. **推送更新** - 推送到生产环境
7. **查看详情** - 查看完整的更新信息和推送记录

---

## 📝 使用流程

### 场景 1: 手动创建更新记录

1. 访问 `/admin/updates`
2. 点击「创建更新」
3. 填写版本信息：
   - 版本号：`v1.2.0`
   - 标题：新增游戏系统
   - 更新内容：每行一个更新项
4. 点击保存
5. 点击「发布」按钮发布更新

### 场景 2: 从 Git 自动生成更新日志

```bash
# 生成最近更新的日志
node backend/scripts/generate-changelog.js v1.2.0 v1.1.0

# 输出 JSON 格式，可直接复制到创建更新的表单中
```

### 场景 3: 推送更新到生产环境

1. 在更新列表中点击「推送」按钮
2. 填写生产环境信息：
   - 环境：`production`
   - 服务器 URL: `https://api.example.com`
3. 确认推送
4. 在生产端执行更新后，更新推送状态为 `success`

---

## 🖥️ 生产端集成示例

### 检查更新脚本

```javascript
// production-update-checker.js
const axios = require('axios');

async function checkForUpdates() {
  const currentVersion = process.env.APP_VERSION || 'v1.0.0';
  
  try {
    const response = await axios.get(
      'https://admin.example.com/api/updates/check',
      { params: { currentVersion } }
    );
    
    if (response.data.success && response.data.data.hasUpdate) {
      const updates = response.data.data.updates;
      
      console.log(`发现 ${updates.length} 个更新:`);
      updates.forEach(update => {
        console.log(`  - ${update.version}: ${update.title}`);
      });
      
      // 检查是否有强制更新
      const forceUpdate = updates.find(u => u.forceUpdate);
      if (forceUpdate) {
        console.warn(`⚠️ 发现强制更新：${forceUpdate.version}`);
        // 执行强制更新逻辑
      }
      
      return updates;
    }
  } catch (error) {
    console.error('检查更新失败:', error.message);
  }
  
  return [];
}

// 定时检查（每天一次）
setInterval(checkForUpdates, 24 * 60 * 60 * 1000);

module.exports = { checkForUpdates };
```

### 自动更新脚本

```bash
#!/bin/bash
# auto-update.sh

CURRENT_VERSION=$(cat /app/VERSION)
ADMIN_URL="https://admin.example.com"

echo "当前版本：$CURRENT_VERSION"

# 检查更新
RESPONSE=$(curl -s "$ADMIN_URL/api/updates/check?currentVersion=$CURRENT_VERSION")

HAS_UPDATE=$(echo $RESPONSE | jq -r '.data.hasUpdate')

if [ "$HAS_UPDATE" = "true" ]; then
  echo "发现新版本！"
  
  # 获取最新版本号
  LATEST_VERSION=$(echo $RESPONSE | jq -r '.data.updates[-1].version')
  
  echo "最新版本：$LATEST_VERSION"
  
  # 执行更新操作
  # git pull, npm install, pm2 restart 等
  
  # 确认更新
  curl -X PUT "$ADMIN_URL/api/updates/push-logs/:id" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "push_status": "success",
      "acknowledge_time": "'$(date -Iseconds)'",
      "acknowledge_by": "auto-update"
    }'
fi
```

---

## 🔐 安全建议

1. **权限控制** - 只有管理员可以创建和发布更新
2. **推送验证** - 推送操作需要记录服务器 URL 和环境
3. **版本校验** - 生产端应验证版本号的真实性
4. **备份机制** - 推送前应有备份和回滚方案

---

## 📋 最佳实践

### 版本号规范

遵循 SemVer 规范：
- `v1.0.0` - 主版本号.次版本号.修订号
- `major` - 不兼容的 API 变更
- `minor` - 向下兼容的功能性新增
- `patch` - 向下兼容的问题修正

### 更新内容编写

```
✅ 好的更新内容:
- 新增用户管理模块
- 修复登录时 token 过期 bug
- 优化数据库查询性能

❌ 不好的更新内容:
- 修复了一些 bug
- 优化性能
- 更新代码
```

### 发布流程

1. 开发环境测试 → 创建更新记录 (draft)
2. 测试环境验证 → 发布更新 (released)
3. 推送到生产环境 → 更新推送记录
4. 生产环境验证 → 确认推送成功

---

## 🛠️ 数据库初始化

```bash
# 执行 SQL 脚本创建表
mysql -u jhchat -p jhchat < database/updates_table.sql
```

---

## 📞 故障排查

### 问题 1: 版本号冲突

**错误**: `VERSION_EXISTS`

**解决**: 确保版本号格式正确且唯一，不要重复使用版本号

### 问题 2: 推送状态不更新

**解决**: 检查网络连接和 API 认证 token，确保推送日志 ID 正确

### 问题 3: 生产端检查更新失败

**解决**: 
1. 检查 API URL 是否正确
2. 检查网络连接
3. 验证当前版本号格式

---

## 📚 相关文档

- [生产环境更新指南](./PRODUCTION_UPDATE_GUIDE.md)
- [API 接口文档](./API.md)
- [数据库设计文档](./DATABASE.md)
