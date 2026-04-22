# 操作日志记录修复

## 问题现象

访问 `/admin/logs` 页面时返回 **500 Internal Server Error**

## 问题原因

1. **数据库表不存在**: `admin_action_logs` 表未创建
2. **路由未使用日志中间件**: 所有管理路由没有调用 `logAction` 中间件
3. **查询错误的表**: `AuditController.getLogs` 查询的是 `operation_logs` 而不是 `admin_action_logs`

## 快速修复（推荐）

### 方法 1: 使用 npm 脚本（最简单）

```bash
cd /workspace/jhchat/backend
npm run migrate
```

### 方法 2: 使用 Node.js 脚本

```bash
cd /workspace/jhchat/backend
node scripts/create-admin-action-logs-table.js
```

### 方法 3: 手动执行 SQL

如果上述方法都失败，直接连接数据库执行：

```sql
CREATE TABLE IF NOT EXISTS `admin_action_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `action_type` varchar(50) NOT NULL,
  `action` varchar(200) NOT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` varchar(200) DEFAULT NULL,
  `request_data` text,
  `response_status` enum('success','failed') NOT NULL DEFAULT 'success',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`username`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 验证修复

1. **检查表是否创建成功**
   ```bash
   cd /workspace/jhchat/backend
   node scripts/create-admin-action-logs-table.js
   ```
   应该显示：`✓ admin_action_logs 表已存在`

2. **访问操作日志页面**
   ```
   https://5173-9a706b4ab80369c3.monkeycode-ai.online/admin/logs
   ```
   应该能看到空列表（如果没有操作记录）

3. **执行测试操作**
   - 在管理后台删除一个物品
   - 或者修改一个配置
   - 刷新日志页面，应该能看到新的操作记录

## 已修复的文件

| 文件 | 修改内容 |
|------|---------|
| `AuditController.js` | 改为查询 `admin_action_logs` 表，添加表不存在检查 |
| `routes/admin.js` | 添加 `logAction` 中间件到所有写操作路由 |
| `scripts/create-admin-action-logs-table.js` | 新建自动迁移脚本 |
| `package.json` | 添加 `migrate` 脚本命令 |

## 记录的操作类型（36 种）

所有管理员的写操作都会被自动记录：

| 模块 | 操作类型 |
|------|---------|
| 安全监控 | `warn_user`, `ban_user`, `clear_all_cheats` |
| IP 管理 | `create_ip_lock`, `delete_ip_lock`, `create_ip_ban`, `delete_ip_ban` |
| 日志管理 | `clear_logs` |
| 系统配置 | `update_config`, `batch_update_config`, `clear_cache` |
| 聊天记录 | `delete_chat_log` |
| 物品管理 | `create_item`, `update_item`, `delete_item` |
| 房间管理 | `create_room`, `update_room`, `delete_room` |
| 公告管理 | `create_news`, `update_news`, `delete_news` |
| 藏经阁 | `create_secret_skill`, `update_secret_skill`, `delete_secret_skill` |
| 任务管理 | `create_quest`, `update_quest`, `delete_quest` |
| 宠物管理 | `create_pet`, `update_pet`, `delete_pet` |
| 门派管理 | `update_sect` |
| 市场管理 | `cancel_listing` |
| 商店管理 | `create_shop_item`, `update_shop_item`, `delete_shop_item`, `restock_shop_item` |

## 常见错误排查

### 错误：Access denied for user 'root'@'localhost'

**原因**: 数据库密码配置错误

**解决**: 检查 `.env` 文件或 `src/config/db.js` 中的数据库连接配置

### 错误：Can't connect to MySQL server

**原因**: MySQL 服务未启动

**解决**: 
```bash
# 检查 MySQL 状态
systemctl status mysql

# 启动 MySQL
systemctl start mysql
```

### 错误：Table 'jhchat.admin_action_logs' doesn't exist

**原因**: 迁移脚本未执行

**解决**: 运行 `npm run migrate`

