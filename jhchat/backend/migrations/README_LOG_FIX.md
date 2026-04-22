# 操作日志记录修复

## 问题原因

1. **数据库表不存在**: `admin_action_logs` 表未创建
2. **路由未使用日志中间件**: 所有管理路由没有调用 `logAction` 中间件
3. **查询错误的表**: `AuditController.getLogs` 查询的是 `operation_logs` 而不是 `admin_action_logs`

## 解决方案

### 1. 创建数据库表

运行以下 SQL 创建 `admin_action_logs` 表：

```sql
CREATE TABLE IF NOT EXISTS `admin_action_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `action_type` varchar(50) NOT NULL COMMENT '操作类型，如 create_user, delete_item',
  `action` varchar(200) NOT NULL COMMENT '操作描述，如 POST /admin/users',
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` varchar(200) DEFAULT NULL,
  `request_data` text COMMENT '请求参数 JSON',
  `response_status` enum('success','failed') NOT NULL DEFAULT 'success',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`username`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员操作日志';
```

### 2. 手动执行 SQL（使用正确的密码）

```bash
# 方法 1: 通过 mysql 命令行
mysql -u root -p'<你的数据库密码>' jhchat < /workspace/jhchat/backend/migrations/create_admin_action_logs.sql

# 方法 2: 通过 navicat/phpmyadmin 等工具执行上述 SQL
```

### 3. 验证日志记录

执行任何管理操作（如删除一个物品、修改配置等），然后查询：

```sql
SELECT * FROM admin_action_logs ORDER BY created_at DESC LIMIT 10;
```

应该能看到最新的管理操作记录。

## 已修复的文件

- ✅ `backend/src/controllers/admin/AuditController.js` - 修改查询 `admin_action_logs` 表
- ✅ `backend/src/routes/admin.js` - 添加 `logAction` 中间件到所有写操作路由
- ✅ `frontend/src/views/admin/Logs.vue` - 前端已适配新的数据结构

## 记录的操作类型

以下管理操作会被自动记录：

| 操作类型 | 说明 |
|---------|------|
| `clear_cache` | 清理缓存 |
| `create_secret_skill` | 创建武功秘籍 |
| `update_secret_skill` | 修改武功秘籍 |
| `delete_secret_skill` | 删除武功秘籍 |
| `create_quest` | 创建任务 |
| `update_quest` | 修改任务 |
| `delete_quest` | 删除任务 |
| `create_pet` | 创建宠物 |
| `update_pet` | 修改宠物 |
| `delete_pet` | 删除宠物 |
| `update_sect` | 修改门派信息 |
| `cancel_listing` | 下架市场订单 |
| `create_shop_item` | 添加商店物品 |
| `update_shop_item` | 修改商店物品 |
| `delete_shop_item` | 删除商店物品 |
| `restock_shop_item` | 补货商店物品 |
| `warn_user` | 警告用户 |
| `ban_user` | 封禁用户 |
| `clear_all_cheats` | 清除作弊记录 |
| `create_ip_lock` | 锁定 IP |
| `delete_ip_lock` | 删除 IP 锁定 |
| `clear_logs` | 清除日志 |
| `update_config` | 修改配置 |
| `batch_update_config` | 批量修改配置 |
| `delete_chat_log` | 删除聊天记录 |
| `create_item` | 添加物品 |
| `update_item` | 修改物品 |
| `delete_item` | 删除物品 |
| `create_room` | 添加房间 |
| `update_room` | 修改房间 |
| `delete_room` | 删除房间 |
| `create_news` | 发布公告 |
| `update_news` | 修改公告 |
| `delete_news` | 删除公告 |
