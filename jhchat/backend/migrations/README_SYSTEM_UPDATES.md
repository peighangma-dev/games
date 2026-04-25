# 系统更新管理功能说明

## 功能概述

江湖聊天室现已支持在线一键更新功能，管理员可通过管理后台方便地管理系统版本更新。

## 主要功能

### 1. 更新管理菜单

**位置**：管理后台 → 系统配置 → 更新管理

**功能**：
- 查看所有版本更新记录
- 创建新的版本更新
- 生成更新包
- 推送更新到生产环境
- 查看更新推送历史

### 2. 仪表盘更新提示

当有可用的新版本时，管理后台仪表盘会自动显示更新提示卡片，包含：
- 最新版本号
- 更新标题和描述
- 优先級标记（紧急/重要/推荐）
- 快捷操作按钮（前往更新 / 稍后处理）

### 3. 数据库表结构

#### system_updates（系统更新记录表）

主要字段：
- `version`：版本号（v1.0.0）
- `version_code`：版本代码（用于排序）
- `title`：更新标题
- `description`：更新描述
- `changes`：更新内容（JSON 数组）
- `type`：更新类型（major/minor/patch/hotfix）
- `priority`：优先級（critical/high/normal/low）
- `force_update`：是否强制更新
- `status`：状态（draft/released/archived）

#### update_push_logs（更新推送记录表）

主要字段：
- `update_id`：关联的更新 ID
- `version`：版本号
- `environment`：推送环境（production/staging/development）
- `push_status`：推送状态（pending/success/failed/partial）
- `push_time`：推送时间
- `acknowledge_time`：确认时间

## 使用流程

### 创建新更新

1. 进入 **管理后台 → 系统配置 → 更新管理**
2. 点击 **创建更新** 按钮
3. 填写更新信息：
   - 版本号（格式：v1.0.0）
   - 更新标题
   - 更新描述
   - 更新内容（每行一个）
   - 选择类型和优先级
   - 是否强制更新
4. 保存更新记录

### 发布更新

1. 在更新列表中，找到需要发布的版本
2. 点击 **发布** 按钮（火箭图标 🚀）
3. 状态变更为 `released`

### 生成更新包

1. 在已发布的更新记录上，点击 **生成更新包** 按钮（包裹图标 📦）
2. 系统会自动打包更新文件
3. 生成后可查看包大小

### 推送更新到生产环境

1. 在已生成更新包的记录上，点击 **推送更新** 按钮（上传图标 📤）
2. 输入推送环境（production/staging/development）
3. 可选：输入目标服务器 URL
4. 系统会创建推送任务，并生成执行命令

### 查看更新推送记录

在更新详情页面，可以查看：
- 推送历史
- 推送状态
- 推送时间
- 确认人

## API 接口

### 管理后台 API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/admin/updates` | GET | 获取更新列表 |
| `/admin/updates/:id` | GET | 获取更新详情 |
| `/admin/updates` | POST | 创建更新记录 |
| `/admin/updates/:id` | PUT | 更新更新记录 |
| `/admin/updates/:id` | DELETE | 删除更新记录 |
| `/admin/updates/:id/release` | POST | 发布更新 |
| `/admin/updates/generate-package` | POST | 生成更新包 |
| `/admin/updates/:id/push` | POST | 推送更新 |
| `/admin/updates/latest` | GET | 获取最新版本 |

### 生产端 API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/updates/check` | GET | 检查更新（需 currentVersion 参数） |
| `/updates/latest.sh` | GET | 获取更新安装脚本 |
| `/updates/packages` | GET | 获取可用更新包 |
| `/updates/packages/:id/download` | GET | 下载更新包 |
| `/updates/:id/install` | POST | 记录安装状态 |

## 自动更新脚本

生产环境可以使用自动更新脚本：

```bash
curl -s https://your-server.com/api/updates/latest.sh | bash -s -- https://your-server.com v1.0.1
```

## 最佳实践

1. **版本号管理**：遵循语义化版本规范（Semantic Versioning）
   - major：重大版本（破坏性变更）
   - minor：功能版本（向后兼容）
   - patch：补丁版本（bug 修复）
   - hotfix：紧急修复

2. **推送流程**：
   - 先在 staging 环境测试
   - 确认无问题后再推送到 production
   - 记录推送确认人

3. **回滚策略**：
   - 在更新记录中指定可回滚版本
   - 保留历史版本备份
   - 记录回滚时间

## 注意事项

1. 强制更新（force_update）不可被用户跳过
2. 破坏性变更（breaking_changes）需要特别说明
3. 推送记录会记录到数据库，便于审计
4. 更新包存储在服务器，定期清理旧版本

## 迁移说明

如需启用此功能，需要执行数据库迁移：

```bash
mysql -u jhchat -p<password> jhchat < backend/migrations/20260425_create_system_updates_tables.sql
```

## 故障排除

### Dashboard 不显示更新提示

1. 检查是否有 `released` 状态的更新记录
2. 检查 API 是否正常：`GET /admin/updates/latest`
3. 清除浏览器缓存

### 生成更新包失败

1. 确保更新已发布（status=released）
2. 检查 uploads 目录权限
3. 查看后端日志

### 推送记录无法加载

1. 检查 update_push_logs 表是否存在
2. 检查 foreign key 约束
3. 刷新页面重试
