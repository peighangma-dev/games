# 数据库部署指南

## 文件说明

### 本地备份文件
- **`database/backup/jhchat_full_backup_*.sql`** - 完整数据库备份（含数据）
  - 用于本地开发环境恢复
  - 包含所有表结构和数据
  - 文件大小：~324KB

### 生产部署文件
- **`database/jhchat_schema.sql`** - 数据库结构文件（不含数据）
  - 用于生产环境同步表结构
  - 不包含任何业务数据
  - 文件大小：~101KB
  - **生产端使用此文件**

## 生产端部署步骤

### 1. 拉取最新代码

```bash
cd /www/wwwroot/games/jhchat
git pull origin 260413-feat-jhchat-refactor
```

### 2. 备份当前数据库（重要！）

```bash
# 备份当前数据库
mysqldump -u jhchat -p'密码' --single-transaction jhchat > /www/backup/jhchat_backup_$(date +%Y%m%d_%H%M%S).sql

# 验证备份
ls -lh /www/backup/jhchat_backup_*.sql
```

### 3. 同步数据库结构

```bash
# 方法一：使用结构文件（推荐，仅同步表结构变更）
mysql -u jhchat -p'密码' jhchat < /www/wwwroot/games/jhchat/database/jhchat_schema.sql

# 方法二：手动执行迁移脚本
mysql -u jhchat -p'密码' jhchat < /www/wwwroot/games/jhchat/backend/migrations/20260426_user_level_exp_system.sql
```

### 4. 验证数据库变更

```bash
# 登录数据库
mysql -u jhchat -p'密码' jhchat

# 检查表数量（应该 98 个）
SHOW TABLES;

# 检查新表是否存在
SHOW TABLES LIKE '%level%';
SHOW TABLES LIKE '%chat_exp%';
SHOW TABLES LIKE '%admin_application%';

# 检查用户表字段
DESC users;

# 验证新字段
SELECT 
  total_exp, 
  monthly_exp, 
  all_value, 
  month_value,
  chat_minutes_today,
  chat_minutes_total
FROM users 
LIMIT 1;

# 退出
EXIT;
```

### 5. 重启后端服务

```bash
# 查看当前 PM2 进程
PM2_HOME=/www/server/panel/PM2 npx pm2 list

# 重启后端
PM2_HOME=/www/server/panel/PM2 npx pm2 restart backend

# 或（如果进程名不同）
PM2_HOME=/www/server/panel/PM2 npx pm2 restart all
```

### 6. 验证服务

```bash
# 测试 API
curl http://localhost:3001/api/ping

# 预期响应
# {"status":"ok","message":"pong",...}
```

## 新增数据表（v2026.3）

| 表名 | 说明 | 用途 |
|------|------|------|
| `user_level_config` | 等级配置表 | 存储 1-10 级的升级条件 |
| `chat_exp_logs` | 聊天经验日志 | 记录用户聊天获得经验 |
| `admin_applications` | 管理员申请表 | 管理员申请和审批记录 |

## 新增字段（users 表）

| 字段名 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| `total_exp` | BIGINT | 总经验值（新） | 0 |
| `monthly_exp` | BIGINT | 月度经验（新） | 0 |
| `all_value` | BIGINT | 总经验（兼容旧字段） | 0 |
| `month_value` | BIGINT | 月度经验（兼容旧字段） | 0 |
| `chat_minutes_today` | INT | 今日聊天分钟数 | 0 |
| `chat_minutes_total` | INT | 累计聊天分钟数 | 0 |
| `last_chat_time` | DATETIME | 最后聊天时间 | NULL |

## 注意事项

1. **数据备份**：执行任何数据库操作前必须备份！
2. **兼容性**：新老字段名同时存在，避免代码兼容性问题
3. **默认值**：新增整数类型字段有默认值，不会影响现有数据
4. **执行时机**：建议在访问量低的时段执行数据库变更
5. **回滚方案**：如出现问题，使用步骤 2 的备份恢复

## 常见问题

### Q: 执行 SQL 时报错怎么办？
A: 检查 MySQL 版本（需 5.7+），查看错误日志：`/www/server/data/mysql/*.err`

### Q: 字段已存在错误？
A: 结构文件使用 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`，如果仍有问题可跳过已存在的字段

### Q: 生产环境是否需要所有新表？
A: 是的，等级经验系统依赖这些表正常工作

---

**版本**: v2026.3  
**更新日期**: 2026-04-26  
**数据库版本**: MySQL 5.7+
