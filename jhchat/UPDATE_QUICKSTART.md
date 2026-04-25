# 更新检测与一键安装 - 快速开始

## 🚀 3 分钟快速上手

### 步骤 1: 创建更新（开发端）

1. 访问 `/admin/updates`
2. 点击「创建更新」
3. 填写信息：
   ```
   版本号：v1.2.0
   标题：新功能发布
   更新内容:
   - 新增功能 A
   - 修复 bug B
   ```
4. 点击「保存」

### 步骤 2: 发布并生成包（开发端）

1. 点击「发布」按钮 🚀
2. 点击「生成更新包」按钮 📦
3. 等待包生成完成

### 步骤 3: 生产端一键安装

在生产服务器上执行：

```bash
# 一行命令搞定更新
curl -s https://admin.example.com/api/updates/latest.sh | bash
```

**就这么简单！** 脚本会自动：
- ✅ 检测更新
- ✅ 下载安装包
- ✅ 验证完整性
- ✅ 备份旧版本
- ✅ 安装新版本
- ✅ 重启服务
- ✅ 报告状态

---

## 📋 详细使用

### 开发端完整流程

#### 1. 创建更新记录

```
访问：/admin/updates
操作：点击「创建更新」

示例数据:
- 版本号：v1.2.0
- 标题：新增游戏系统
- 描述：添加了钓鱼、挖矿等功能
- 更新内容:
  * 新增钓鱼系统（5 种鱼类）
  * 新增挖矿系统（3 种矿物）
  * 优化性能（提升 50%）
- 类型：minor
- 优先级：normal
```

#### 2. 发布更新

```
操作：点击「发布」按钮 🚀
确认：弹出确认框 → 确认
```

#### 3. 生成更新包

```
操作：点击「生成更新包」按钮 📦
等待：系统自动从 Git 打包差异文件
结果：生成 update-v1.2.0-xxx.zip
```

#### 4. 推送更新

```
操作：点击「推送更新」按钮 📤
输入:
- 环境：production
- 服务器 URL（可选）

系统返回安装命令:
curl -s https://admin.example.com/api/updates/latest.sh | bash
```

---

### 生产端安装方式

#### 方式 1：自动安装（推荐）

```bash
# 一行命令
curl -s https://admin.example.com/api/updates/latest.sh | bash
```

#### 方式 2：手动下载安装脚本

```bash
# 下载脚本
curl -s https://admin.example.com/api/updates/latest.sh -o update.sh

# 添加权限
chmod +x update.sh

# 执行（交互式）
./update.sh
```

#### 方式 3：使用本地脚本

```bash
# 上传脚本到生产服务器
scp scripts/install-update.sh user@prod-server:/tmp/

# 执行
ssh user@prod-server
/tmp/install-update.sh https://admin.example.com v1.0.0
```

---

## 🎯 核心功能

### 自动检测

```bash
# 脚本会自动检测当前版本
# 从 VERSION 文件读取
cat /path/to/workspace/VERSION
# v1.0.0

# 如果没有 VERSION 文件，默认 v1.0.0
```

### 安全验证

```bash
# 自动验证 SHA256 哈希
DOWNLOAD_HASH=$(sha256sum update.zip | cut -d' ' -f1)
EXPECTED_HASH="从 API 获取"

if [ "$DOWNLOAD_HASH" != "$EXPECTED_HASH" ]; then
  echo "验证失败，回滚"
  exit 1
fi
```

### 自动备份

```bash
# 安装前自动备份
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP_NAME" -C /workspace jhchat
```

### 失败回滚

```bash
# 如果服务启动失败
if ! curl -s http://localhost:3001/api/ping | grep -q "pong"; then
  echo "启动失败，回滚中..."
  tar -xzf "backup-xxx.tar.gz" -C /workspace
  exit 1
fi
```

---

## 📊 查看更新状态

### 开发端查看

访问 `/admin/updates`，可以看到：
- ✅ 更新包生成状态
- ✅ 推送状态
- ✅ 安装确认状态

### 生产端查看

```bash
# 查看当前版本
cat /path/to/workspace/VERSION
# v1.2.0

# 查看更新日志
ls -lt /path/to/workspace/*.log
# update-install-20260424-120000.log
```

### 管理后台查看

```sql
-- 查看更新历史
SELECT version, title, release_date, 
       JSON_EXTRACT(metadata, '$.package_file') as package
FROM system_updates 
ORDER BY release_date DESC;

-- 查看推送记录
SELECT u.version, l.environment, l.push_status, 
       l.acknowledge_time, l.server_url
FROM update_push_logs l
JOIN system_updates u ON l.update_id = u.id
ORDER BY l.created_at DESC;
```

---

## ⚠️ 注意事项

### 安装前检查

```bash
# 1. 检查磁盘空间
df -h /workspace

# 2. 检查 Node.js 版本
node --version

# 3. 检查数据库连接
mysql -u jhchat -p -e "SELECT 1"

# 4. 备份重要数据（额外保险）
mysqldump -u jhchat -p jhchat > backup.sql
```

### 安装时注意

- 服务会短暂停止（约 30 秒）
- 确保无重要用户操作
- 建议在维护窗口执行

### 安装后验证

```bash
# 1. 检查服务状态
curl http://localhost:3001/api/ping

# 2. 检查版本号
curl http://localhost:3001/api/server-info

# 3. 查看日志
tail -100 /tmp/backend.log

# 4. 功能测试
# 访问前端页面测试新功能
```

---

## 🔧 常用命令

### 检查更新（不安装）

```bash
curl -s "https://admin.example.com/api/updates/available?currentVersion=v1.0.0" | jq '.data'
```

### 查看可用更新包

```bash
curl -s "https://admin.example.com/api/updates/latest" | jq '.data'
```

### 手动下载更新包

```bash
curl -L -o update.zip "https://admin.example.com/api/admin/updates/packages/3/download"
```

### 手动报告安装状态

```bash
curl -X POST "https://admin.example.com/api/updates/3/install" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "success",
    "server_url": "prod-1:3001",
    "installed_by": "manual"
  }'
```

### 查看安装日志

```bash
tail -100 /path/to/workspace/update-install-*.log
```

---

## 🎨 示例输出

### 自动检测输出

```
=========================================
江湖聊天室 - 自动更新检测
=========================================

当前版本：v1.0.0

检查更新中...

发现 2 个可用更新:
  最新版本：v1.2.0
  更新标题：新增游戏系统
  包大小：1024 KB

是否立即更新？[y/N]: y

步骤 1: 备份当前版本...
✅ 备份完成：/workspace/backups/backup-20260424-120000.tar.gz

步骤 2: 下载更新包...
✅ 下载完成：/workspace/downloads/update-v1.2.0.zip

步骤 3: 校验文件完整性...
✅ 文件完整性验证通过

步骤 4: 解压更新包...
✅ 解压完成

步骤 5: 安装更新...
✅ 文件复制完成
安装依赖...
✅ 数据库更新完成

启动服务...
✅ 服务启动成功

清理临时文件...
报告安装状态...
✅ 安装状态已报告

=========================================
✅ 更新完成!
=========================================
已更新到版本：v1.2.0
```

---

## 📞 获取帮助

### 快速诊断

```bash
# 1. 检查网络
curl -I https://admin.example.com

# 2. 检查更新服务
curl https://admin.example.com/api/updates/latest

# 3. 检查本地环境
node --version
npm --version
mysql --version

# 4. 查看最近日志
tail -50 /tmp/backend.log
```

### 常见问题

**Q: 脚本报错 `permission denied`**
```bash
chmod +x update.sh
```

**Q: 下载超时**
```bash
# 手动下载后执行
./update.sh
```

**Q: 服务启动失败**
```bash
# 查看错误
tail -100 /tmp/backend.log
# 回滚会自动执行
```

---

## 📚 更多信息

- [完整使用指南](./UPDATE_PACKAGE_GUIDE.md)
- [系统架构文档](./UPDATE_SYSTEM_GUIDE.md)
- [故障排查指南](./TROUBLESHOOTING.md)
