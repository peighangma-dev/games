# 江湖聊天室 - 数据库恢复指南

## 快速恢复

### 方法 1：使用干净的备份文件（推荐）

```bash
# 使用 jhchat 用户恢复
mysql -ujhchat -p'JhChat@2026Secure!' jhchat < /workspace/jhchat/database/jhchat_clean_backup.sql
```

### 方法 2：使用 root 用户恢复

```bash
# 如果有 root 权限
mysql -uroot -p jhchat < /workspace/jhchat/database/jhchat_clean_backup.sql
```

## 备份文件说明

| 文件 | 大小 | 说明 | 使用建议 |
|------|------|------|----------|
| `jhchat_clean_backup.sql` | 265KB | 干净的 jhchat 数据库备份 | ✅ **推荐使用** |
| `database_full.sql` | 2.7MB | 完整导出（含 MySQL 系统表） | ❌ 不推荐使用 |
| `01-schema.sql` | 6.8KB | 基础表结构 | 初始化时使用 |
| `02-seed-data.sql` | 4.4KB | 初始种子数据 | 初始化时使用 |
| `03-migrations.sql` | 13KB | 迁移脚本 | 按需使用 |

## 常见错误及解决方案

### 错误 1：Table 'mysql.xxx' doesn't exist

```
ERROR 1146 (42S02): Table 'mysql.tables_priv' doesn't exist
```

**原因**：使用了 `database_full.sql`，该文件包含 MySQL 系统表结构。

**解决方案**：使用 `jhchat_clean_backup.sql` 替代。

### 错误 2：Access denied for user 'jhchat'@'localhost' to database 'mysql'

```
ERROR 1044 (42000): Access denied for user 'jhchat'@'localhost' to database 'mysql'
```

**原因**：jhchat 用户没有权限访问 MySQL 系统数据库。

**解决方案**：使用 `jhchat_clean_backup.sql` 替代。

### 错误 3：SQL syntax error near 'PAGE_CHECKSUM=1'

```
ERROR 1064 (42000): You have an error in your SQL syntax... PAGE_CHECKSUM=1 TRANSACTIONAL=1
```

**原因**：MySQL 版本不兼容或使用了系统表导出文件。

**解决方案**：使用 `jhchat_clean_backup.sql` 替代。

## 创建新的备份

### 使用 mysqldump

```bash
# 使用 root 用户创建干净备份
mysqldump -u root jhchat --no-tablespaces --skip-triggers > jhchat_backup_$(date +%Y%m%d_%H%M%S).sql

# 使用 jhchat 用户创建备份
mysqldump -ujhchat -p'JhChat@2026Secure!' jhchat --no-tablespaces --skip-triggers > jhchat_backup.sql
```

### 压缩备份（节省空间）

```bash
# 创建压缩备份
mysqldump -u root jhchat --no-tablespaces --skip-triggers | gzip > jhchat_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# 恢复压缩备份
gunzip < jhchat_backup_20260423_084146.sql.gz | mysql -ujhchat -p'JhChat@2026Secure!' jhchat
```

## 定时自动备份

### 创建备份脚本

```bash
#!/bin/bash
# /workspace/jhchat/scripts/backup-db.sh

BACKUP_DIR="/workspace/backup/database"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/jhchat_backup_$DATE.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -u root jhchat --no-tablespaces --skip-triggers > $BACKUP_FILE

# 压缩备份
gzip $BACKUP_FILE

# 删除 30 天前的备份
find $BACKUP_DIR -name "jhchat_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### 添加定时任务

```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨 2 点备份
0 2 * * * /workspace/jhchat/scripts/backup-db.sh >> /workspace/jhchat/logs/backup.log 2>&1
```

## 验证备份完整性

```bash
# 1. 检查文件大小
ls -lh jhchat_backup*.sql*

# 2. 检查文件内容（前 50 行）
head -50 jhchat_backup.sql

# 3. 测试恢复（在测试数据库）
mysql -uroot -p -e "CREATE DATABASE IF NOT EXISTS jhchat_test;"
mysql -uroot -p jhchat_test < jhchat_backup.sql
mysql -uroot -p -e "DROP DATABASE jhchat_test;"
```

## 数据表清单

当前数据库包含 75 个表，主要分类：

### 核心功能
- `users` - 用户信息
- `chat_rooms` - 聊天房间
- `chat_messages` - 聊天消息
- `online_users` - 在线用户

### 游戏功能
- `sects` - 门派
- `items` - 物品
- `skills` - 技能
- `pets` - 宠物
- `marriages` - 婚姻

### 经济系统
- `shop_items` - 商店物品
- `market_listings` - 市场挂单
- `bank_accounts` - 银行账户

### 排行榜
- `ranking_*` - 各类排行榜数据

### 日志记录
- `admin_action_logs` - 管理员操作日志
- `user_event_logs` - 用户事件日志
- `operation_logs` - 操作日志

## 故障排查

### 检查数据库连接

```bash
mysql -ujhchat -p'JhChat@2026Secure!' -e "SELECT 'Connection OK' AS status;"
```

### 检查表是否存在

```bash
mysql -ujhchat -p'JhChat@2026Secure!' jhchat -e "SHOW TABLES;" | wc -l
```

### 检查数据完整性

```bash
mysql -ujhchat -p'JhChat@2026Secure!' jhchat -e "
SELECT 
  'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'chat_rooms', COUNT(*) FROM chat_rooms
UNION ALL
SELECT 'items', COUNT(*) FROM items;
"
```

## 相关文档

- [生产环境部署指南](./DEPLOYMENT_PRODUCTION.md)
- [快速部署命令](./QUICK_DEPLOY.md)
- [MySQL 5.7 兼容性报告](./MYSQL57_COMPATIBILITY_REPORT.md)
