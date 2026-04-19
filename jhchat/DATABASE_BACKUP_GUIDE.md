# 数据库备份与恢复指南

## 备份信息

- **备份时间:** 2026-04-19
- **数据库名称:** jhchat
- **备份文件:** `database/jhchat_full_backup.sql.gz`
- **备份大小:** 24 KB (压缩后)
- **包含内容:** 完整数据库结构和所有数据

## 备份内容

### 数据库表（75 张）

#### 核心表
- `users` - 用户信息
- `chat_messages` - 聊天消息
- `chat_rooms` - 聊天房间
- `online_users` - 在线用户
- `chat_actions` - 动作列表

#### 经济系统
- `items` - 物品
- `shop_items` - 商店物品
- `card_templates` - 卡片模板
- `user_cards` - 用户卡片
- `bank_accounts` - 银行账户
- `market_listings` - 市场列表
- `silver_logs` - 银两流水

#### 社交系统
- `messages` - 站内消息
- `marriages` - 婚姻关系
- `birth_records` -  birth records
- `sect_contributions` - 门派贡献

#### 游戏系统
- `pets` - 宠物
- `user_quests` - 用户任务
- `achievements` - 成就
- `user_achievements` - 用户成就
- `fishing_records` - 钓鱼记录
- `mining_records` - 挖矿记录
- `hunting_records` - 狩猎记录

#### 配置表
- `system_config` - 系统配置
- `bad_words` - 敏感词
- `banned_usernames` - 禁用用户名
- `ip_bans` - IP 封禁
- `ip_locks` - IP 锁定

完整表列表见备份文件头部。

### 基础数据

- ✅ 8 大门派数据
- ✅ 系统房间配置
- ✅ 初始管理员账户
- ✅ 商店物品配置
- ✅ 配药配方
- ✅ 成就配置
- ✅ 任务配置
- ✅ 钓鱼配置
- ✅ 挖矿配置
- ✅ 狩猎配置

## 恢复方法

### 方法 1: 使用 Docker（推荐）

```bash
# 1. 解压备份文件
cd /workspace/jhchat
gzip -d database/jhchat_full_backup.sql.gz

# 2. 进入 Docker 容器
docker-compose exec backend bash

# 3. 恢复数据库
mysql -u root -pjhchat_root_pass < database/jhchat_full_backup.sql

# 4. 验证恢复
mysql -u root -pjhchat_root_pass -e "USE jhchat; SHOW TABLES;"
```

### 方法 2: 本地 MySQL

```bash
# 1. 解压备份文件
cd /workspace/jhchat
gzip -d database/jhchat_full_backup.sql.gz

# 2. 恢复数据库
mysql -u root -p < database/jhchat_full_backup.sql

# 或指定密码
mysql -u root -pjhchat_root_pass < database/jhchat_full_backup.sql

# 3. 验证恢复
mysql -u root -pjhchat_root_pass -e "SHOW DATABASES LIKE 'jhchat';"
mysql -u root -pjhchat_root_pass -e "USE jhchat; SHOW TABLES;"
```

### 方法 3: 使用初始化脚本

```bash
# 如果已有初始化脚本，可以直接执行
cd /workspace/jhchat/backend
node src/scripts/init-db.js

# 然后恢复数据
mysql -u root -pjhchat_root_pass jhchat < database/jhchat_full_backup.sql
```

## 验证恢复

### 检查表数量

```sql
USE jhchat;
SELECT COUNT(*) AS table_count FROM information_schema.tables 
WHERE table_schema = 'jhchat';
-- 应该返回 75 左右
```

### 检查用户数据

```sql
SELECT id, username, gender, sect, grade, silver 
FROM users 
ORDER BY grade DESC, silver DESC 
LIMIT 10;
```

### 检查配置数据

```sql
-- 检查门派
SELECT * FROM sects;

-- 检查系统配置
SELECT * FROM system_config;

-- 检查房间
SELECT * FROM chat_rooms;
```

## 增量备份

如需进行增量备份，可以使用：

```bash
# 完整备份
mysqldump -u root -pjhchat_root_pass \
  --default-character-set=utf8mb4 \
  --hex-blob \
  --add-drop-database \
  --databases jhchat \
  > database/jhchat_full_$(date +%Y%m%d_%H%M%S).sql

# 压缩
gzip database/jhchat_full_*.sql
```

## 定期备份建议

### 每天备份（ cron 任务）

```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨 3 点备份
0 3 * * * mysqldump -u root -pjhchat_root_pass --default-character-set=utf8mb4 --hex-blob --add-drop-database --databases jhchat | gzip > /workspace/jhchat/database/jhchat_backup_$(date +\%Y\%m\%d).sql.gz
```

### 保留策略

- 保留最近 7 天的每日备份
- 保留最近 4 周的每周备份
- 保留最近 3 个月的每月备份

清理脚本：

```bash
#!/bin/bash
cd /workspace/jhchat/database

# 删除 7 天前的备份
find . -name "jhchat_backup_*.sql.gz" -mtime +7 -delete

# 保留每月 1 号的备份（最近 3 个月）
find . -name "*_01_*.sql.gz" -mtime +90 -delete
```

## 迁移到其他服务器

### 导出

```bash
# 在源服务器导出
mysqldump -u root -pjhchat_root_pass \
  --default-character-set=utf8mb4 \
  --hex-blob \
  --triggers \
  --routines \
  --events \
  jhchat > jhchat_export.sql

# 压缩
gzip jhchat_export.sql
```

### 传输

```bash
# 使用 scp 传输
scp jhchat_export.sql.gz user@target-server:/path/to/backup/

# 或使用 rsync
rsync -avz jhchat_export.sql.gz user@target-server:/path/to/backup/
```

### 导入

```bash
# 在目标服务器导入
gunzip jhchat_export.sql.gz
mysql -u root -pjhchat_root_pass < jhchat_export.sql
```

## 常见问题

### Q: 恢复时遇到 "Database already exists" 错误

A: 先删除现有数据库：

```sql
DROP DATABASE IF EXISTS jhchat;
```

### Q: 字符集乱码

A: 确保使用正确的字符集参数：

```bash
mysqldump --default-character-set=utf8mb4 ...
mysql --default-character-set=utf8mb4 ...
```

### Q: 权限错误

A: 使用正确的用户和密码：

```bash
# 使用 root 用户
mysql -u root -p

# 或创建专用用户
CREATE USER 'jhchat_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON jhchat.* TO 'jhchat_user'@'localhost';
FLUSH PRIVILEGES;
```

### Q: 备份文件过大

A: 使用压缩：

```bash
# 直接压缩输出
mysqldump ... | gzip > backup.sql.gz

# 或解压
gunzip backup.sql.gz
```

## 备份验证

定期验证备份文件的完整性：

```bash
# 1. 检查文件是否存在
ls -lh database/jhchat_full_backup.sql.gz

# 2. 测试解压
gzip -t database/jhchat_full_backup.sql.gz

# 3. 检查 SQL 语法
gunzip -c database/jhchat_full_backup.sql.gz | head -100

# 4. 在实际环境测试恢复
# （在测试环境执行完整恢复流程）
```

## 文件位置

- **备份文件:** `/workspace/jhchat/database/jhchat_full_backup.sql.gz`
- **本文档:** `/workspace/jhchat/DATABASE_BACKUP_GUIDE.md`
- **原始 SQL:** `/workspace/jhchat/database/jhchat_full_backup.sql`（解压后）

## 相关文档

- [README.md](./README.md) - 项目说明
- [安装说明.md](./安装说明.md) - 安装指南
- [docker-compose.yml](./docker-compose.yml) - Docker 配置

---

**最后更新:** 2026-04-19  
**数据库版本:** MySQL 8.0 / MariaDB 10.11  
**字符集:** utf8mb4
