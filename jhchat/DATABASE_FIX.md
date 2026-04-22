# 数据库表修复指南

## 问题

访问管理后台页面时出现 500 错误，原因是以下数据库表不存在：
1. `admin_action_logs` - 操作日志表
2. `user_ip_logs` - 登录日志表（可能缺少某些字段）

## 解决方案

### 方法 1: 使用数据库管理工具（推荐）

通过 phpMyAdmin、Navicat、MySQL Workbench 等工具连接数据库，然后执行以下 SQL：

```sql
-- 创建管理员操作日志表
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

-- 确保 user_ip_logs 表有正确的字段
ALTER TABLE `user_ip_logs` 
MODIFY COLUMN `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
MODIFY COLUMN `user_id` int(10) unsigned NOT NULL,
MODIFY COLUMN `username` varchar(50) DEFAULT NULL,
MODIFY COLUMN `ip_address` varchar(45) NOT NULL,
MODIFY COLUMN `ip_type` enum('register','login','logout') NOT NULL DEFAULT 'login',
MODIFY COLUMN `user_agent` varchar(500) DEFAULT NULL,
MODIFY COLUMN `login_status` enum('success','failed') DEFAULT 'success',
MODIFY COLUMN `reason` varchar(200) DEFAULT NULL,
MODIFY COLUMN `country` varchar(50) DEFAULT NULL,
MODIFY COLUMN `region` varchar(50) DEFAULT NULL,
MODIFY COLUMN `city` varchar(50) DEFAULT NULL,
MODIFY COLUMN `created_at` datetime NOT NULL DEFAULT current_timestamp();
```

### 方法 2: 使用命令行

```bash
# 1. 编辑数据库配置
cd /workspace/jhchat/backend
vim .env

# 2. 设置正确的数据库密码
# DB_PASSWORD=你的数据库密码

# 3. 运行迁移脚本
npm run migrate
```

### 方法 3: 直接通过 mysql 命令行

```bash
# 登录 MySQL（需要正确的密码）
mysql -u root -p

# 选择数据库
USE jhchat;

# 创建 admin_action_logs 表
source /workspace/jhchat/backend/migrations/create_admin_action_logs.sql;

# 或者复制粘贴上面的 SQL
```

## 验证

执行 SQL 后，刷新管理后台页面：

- 操作日志：`https://5173-9a706b4ab80369c3.monkeycode-ai.online/admin/logs`
- 登录日志：`https://5173-9a706b4ab80369c3.monkeycode-ai.online/admin/login-logs`

应该能看到空列表而不是 500 错误。

## 常见错误

### ERROR 1045 (28000): Access denied for user 'root'@'localhost'

**原因**: 数据库密码错误或未配置

**解决**: 
1. 找到正确的数据库密码
2. 编辑 `/workspace/jhchat/backend/.env` 文件
3. 设置 `DB_PASSWORD=正确的密码`

### Table 'jhchat.user_ip_logs' doesn't exist

**原因**: user_ip_logs 表不存在

**解决**: 检查 `/workspace/jhchat/数据库.sql` 文件中是否有该表的定义，并执行建表 SQL。

### Column 'username' doesn't exist

**原因**: user_ip_logs 表结构过旧，缺少 username 字段

**解决**: 执行上面的 ALTER TABLE 语句更新表结构。
