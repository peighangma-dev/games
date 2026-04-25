# 更新包系统使用指南

## 📦 功能概述

提供完整的更新包生成、分发和一键安装功能：

- ✅ **自动生成更新包** - 从 Git 提交差异自动打包
- ✅ **SHA256 安全校验** - 确保更新包完整性
- ✅ **一键安装脚本** - 生产端自动下载、备份、安装、回滚
- ✅ **更新检测接口** - 自动生成 Shell 脚本
- ✅ **安装状态追踪** - 记录和监控安装进度

---

## 🎯 使用流程

### 阶段一：开发端创建和发布更新

#### 1. 创建更新记录

访问管理后台 `/admin/updates` → 点击「创建更新」

```
版本号：v1.2.0
标题：新增游戏系统
描述：添加了钓鱼、挖矿等游戏功能
更新内容:
- 新增钓鱼系统
- 新增挖矿系统
- 新增物品交易系统
类型：minor
优先级：normal
```

#### 2. 发布更新

点击「发布」按钮 🚀

#### 3. 生成更新包

点击「生成更新包」按钮 📦

系统会自动：
- 从 Git 提取变更文件
- 创建 ZIP 压缩包
- 计算 SHA256 哈希
- 保存到 `update-packages/` 目录

---

### 阶段二：推送到生产环境

#### 方式 A：通过管理后台推送

1. 点击「推送更新」按钮 📤
2. 输入生产环境信息：
   ```
   环境：production
   服务器 URL: https://production.example.com
   ```
3. 系统会显示安装命令

#### 方式 B：手动部署

下载更新包，手动上传到生产服务器执行安装

---

### 阶段三：生产端安装更新

#### 方式 1：一键自动安装（推荐）

在生产服务器上执行：

```bash
# 替换 admin-url 为你的管理后台地址
curl -s admin-url/api/updates/latest.sh | bash
```

例如：
```bash
curl -s https://admin.example.com/api/updates/latest.sh | bash
```

脚本会自动：
1. ✅ 检测可用更新
2. ✅ 下载更新包
3. ✅ 验证 SHA256 哈希
4. ✅ 备份当前版本
5. ✅ 解压并安装
6. ✅ 重启服务
7. ✅ 报告安装状态
8. ✅ 失败自动回滚

#### 方式 2：手动执行安装脚本

```bash
# 下载安装脚本
curl -s admin-url/api/updates/latest.sh -o update.sh

# 添加执行权限
chmod +x update.sh

# 执行（会交互式确认）
./update.sh
```

#### 方式 3：使用本地脚本

```bash
# 上传 install-update.sh 到生产服务器
./install-update.sh https://admin.example.com v1.0.0
```

---

## 🔧 API 接口

### 1. 获取可用更新包

```http
GET /api/updates/available?currentVersion=v1.0.0
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "hasUpdate": true,
    "currentVersion": "v1.0.0",
    "updates": [{
      "id": 3,
      "version": "v1.2.0",
      "title": "新增游戏系统",
      "type": "minor",
      "forceUpdate": false,
      "package": {
        "file": "update-v1.2.0-1234567890.zip",
        "hash": "abc123...",
        "size": 1048576,
        "download_url": "https://admin.example.com/api/updates/packages/3/download"
      }
    }]
  }
}
```

### 2. 生成更新包

```http
POST /api/admin/updates/generate-package
Authorization: Bearer <token>
Content-Type: application/json

{
  "update_id": 3
}
```

### 3. 下载更新包

```http
GET /api/admin/updates/packages/:id/download
```

响应头：
- `X-Update-Version`: v1.2.0
- `X-Update-Hash`: abc123...
- `X-Update-Size`: 1048576

### 4. 获取安装脚本

```http
GET /api/updates/latest.sh
```

返回可执行的 Shell 脚本

### 5. 报告安装状态

```http
POST /api/updates/:id/install
Content-Type: application/json

{
  "status": "success",
  "server_url": "prod-server-1:3001",
  "installed_by": "auto-update"
}
```

---

## 📁 目录结构

```
jhchat/
├── update-packages/          # 更新包存储目录
│   ├── update-v1.2.0-1234567890.zip
│   ├── update-v1.2.0-1234567890.zip.sha256
│   └── ...
├── scripts/
│   ├── install-update.sh     # 本地安装脚本
│   └── generate-changelog.js # Git 日志生成脚本
└── database/
    └── updates_table.sql     # 数据库表结构
```

---

## 🔐 安全机制

### 1. 哈希校验

每个更新包都会生成 SHA256 哈希文件，安装时会验证：

```bash
# 验证失败会回滚
if [ "$DOWNLOAD_HASH" != "$PACKAGE_HASH" ]; then
  echo "文件哈希不匹配，回滚中..."
  tar -xzf "$BACKUP_PATH" -C "$WORKSPACE"
  exit 1
fi
```

### 2. 备份机制

安装前自动备份：

```bash
# 备份当前版本
tar -czf "backup-20260424-120000.tar.gz" -C "$WORKSPACE" jhchat
```

### 3. 自动回滚

如果服务启动失败，自动回滚到旧版本：

```bash
if ! curl -s http://localhost:3001/api/ping | grep -q "pong"; then
  echo "服务启动失败，回滚中..."
  tar -xzf "$BACKUP_PATH" -C "$WORKSPACE"
  exit 1
fi
```

---

## 📊 更新包内容

更新包包含：

```
update-v1.2.0-1234567890.zip
├── jhchat/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   └── ...
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── views/
│       │   └── ...
│       └── package.json
└── UPDATE_INFO.json
```

`UPDATE_INFO.json` 内容：
```json
{
  "version": "v1.2.0",
  "generated_at": "2026-04-24T12:00:00.000Z",
  "files": [
    "jhchat/backend/src/controllers/xxx.js",
    "jhchat/frontend/src/views/xxx.vue"
  ],
  "file_count": 15
}
```

---

## 🧪 测试流程

### 本地测试

1. **生成测试更新**
   ```bash
   # 修改一些文件
   git add .
   git commit -m "feat: 测试功能"
   
   # 创建更新记录
   # 访问 /admin/updates → 创建更新
   
   # 生成更新包
   # 点击「生成更新包」
   ```

2. **验证更新包**
   ```bash
   # 查看生成的包
   ls -lh update-packages/
   
   # 验证哈希
   sha256sum update-v1.2.0-xxx.zip
   cat update-v1.2.0-xxx.zip.sha256
   ```

3. **测试安装脚本**
   ```bash
   # 在测试服务器执行
   curl -s http://localhost:3001/api/updates/latest.sh | bash
   ```

---

## ⚠️ 注意事项

### 1. 依赖安装

需要安装 `archiver` 包：

```bash
cd jhchat/backend
npm install
```

### 2. 权限要求

生产服务器需要：
- 执行 shell 脚本的权限
- 访问 MySQL 的权限（更新数据库）
- 写入文件系统的权限

### 3. 网络要求

生产服务器需要能访问管理后台：
- 下载更新包
- 报告安装状态

### 4. 环境变量

生产环境需要 `.env` 文件配置正确，特别是：
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

---

## 📝 最佳实践

### 版本号管理

- 遵循 SemVer 规范：`v主版本.次版本.修订号`
- 破坏性变更升级主版本号
- 向下兼容的功能升级次版本号
- Bug 修复升级修订号

### 更新内容编写

✅ **推荐**:
```
- 新增钓鱼系统（包含 5 种鱼类）
- 修复用户登录时 token 过期 bug
- 优化数据库查询性能（提升 50%）
```

❌ **不推荐**:
```
- 修复了一些 bug
- 优化性能
- 更新代码
```

### 发布前检查清单

- [ ] 所有测试通过
- [ ] 代码已合并到主分支
- [ ] 更新了版本号
- [ ] 生成了更新包
- [ ] 验证了哈希值
- [ ] 在测试环境验证
- [ ] 备份了生产环境

---

## 🛠️ 故障排查

### 问题 1: 生成更新包失败

**错误**: `GENERATE_PACKAGE_ERROR`

**解决**:
```bash
# 检查 archiver 是否安装
npm list archiver

# 检查 Git 仓库是否正常
git status
git log --oneline -5
```

### 问题 2: 生产端下载失败

**错误**: `curl: (7) Failed to connect`

**解决**:
```bash
# 检查网络连通性
ping admin.example.com

# 检查防火墙
firewall-cmd --list-all

# 手动下载测试
curl -v https://admin.example.com/api/updates/packages/3/download
```

### 问题 3: 服务启动失败

**现象**: 更新后服务无法启动

**解决**:
```bash
# 查看日志
tail -100 /tmp/backend.log

# 手动启动测试
cd /workspace/jhchat/backend
node src/server.js

# 检查依赖
npm install --production
```

### 问题 4: 安装状态未上报

**解决**:
```bash
# 手动上报
curl -X POST https://admin.example.com/api/updates/3/install \
  -H "Content-Type: application/json" \
  -d '{
    "status": "success",
    "server_url": "prod-1:3001",
    "installed_by": "manual"
  }'
```

---

## 📞 技术支持

遇到问题请提供：

1. **更新日志**: `tail -100 update-install-*.log`
2. **后端日志**: `tail -100 /tmp/backend.log`
3. **管理后台日志**: `pm2 logs jhchat-backend`
4. **安装脚本版本**: `curl admin-url/api/updates/latest.sh | head -20`

---

## 🔗 相关文档

- [系统更新管理指南](./UPDATE_SYSTEM_GUIDE.md)
- [生产环境更新指南](./PRODUCTION_UPDATE_GUIDE.md)
- [本地测试指南](./UPDATE_SYSTEM_LOCAL_TEST.md)
