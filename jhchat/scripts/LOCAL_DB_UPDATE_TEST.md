# 本地数据库一键更新验证

## 当前状态

本地数据库已包含 v2026.3.1 的所有必要字段：

### ✅ 已存在的字段
- `total_exp` (bigint) - 总经验 ✓
- `monthly_exp` (bigint) - 月度经验 ✓
- `chat_minutes_today` (int) - 今日聊天分钟数 ✓
- `chat_minutes_total` (int) - 累计聊天分钟数 ✓
- `last_chat_time` (datetime) - 最后聊天时间 ✓

### ⚠️ 待清理的旧字段
- `all_value` (bigint) - 旧字段名，应删除或标记为废弃
- `month_value` (bigint) - 旧字段名，应删除或标记为废弃

---

## 快速验证命令

### 1. 验证数据库结构
```bash
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "
SELECT 
  COLUMN_NAME as 字段名,
  COLUMN_TYPE as 类型,
  COLUMN_COMMENT as 注释
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA='jhchat' 
  AND TABLE_NAME='users'
  AND COLUMN_NAME IN ('total_exp', 'monthly_exp', 'chat_minutes_today', 'chat_minutes_total', 'last_chat_time', 'all_value', 'month_value')
ORDER BY COLUMN_NAME;
"
```

### 2. 测试查询兼容性
```bash
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "
SELECT 
  id, 
  username, 
  total_exp, 
  monthly_exp,
  chat_minutes_today,
  chat_minutes_total
FROM users 
LIMIT 5;
"
```

### 3. 查看等级配置
```bash
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "SELECT level, required_exp, max_daily_chat_exp FROM user_level_config ORDER BY level;"
```

---

## 本地测试后端 API

### 测试用户列表
```bash
curl -s http://localhost:3001/api/admin/users?page=1&limit=5 | jq '.data.users[] | {id, username, total_exp, monthly_exp, chat_minutes_today}'
```

### 测试获取当前用户信息
```bash
# 先登录获取 token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# 使用 token 获取用户信息
curl -s http://localhost:3001/api/user/me \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.data | {username, total_exp, monthly_exp}'
```

---

## 清理重复字段（可选）

**警告：执行前请务必备份数据库！**

```bash
# 备份当前数据库
mysqldump -u jhchat -p'JhChat@2026Secure!' jhchat > backup_before_cleanup_$(date +%Y%m%d).sql

# 删除旧字段（谨慎执行！）
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "
-- 先验证新字段有数据
SELECT COUNT(*) as has_total_exp_data FROM users WHERE total_exp > 0;

-- 如果新字段有数据，删除旧字段
-- ALTER TABLE users DROP COLUMN all_value;
-- ALTER TABLE users DROP COLUMN month_value;
"
```

---

## 测试功能清单

部署完成后，请在管理后台测试：

### 用户管理
- [ ] 用户列表正常加载
- [ ] 经验字段显示正确
- [ ] 重置密码功能可用

### 管理员管理
- [ ] 添加管理员正常
- [ ] 调整管理员正常
- [ ] 开除管理员正常

### 门派管理
- [ ] 创建门派正常
- [ ] 编辑门派正常

### 等级经验管理
- [ ] 等级配置列表显示
- [ ] 用户经验详情显示
- [ ] 聊天时长统计显示

---

## 常见问题

### Q1: 字段重复会不会影响性能？
A: 会有轻微影响，但主要是存储空间。建议在生产环境清理旧字段。

### Q2: 为什么本地测试要用这个脚本？
A: 确保本地和生产环境数据库结构一致，避免部署后出现字段缺失问题。

### Q3: 如果脚本报错怎么办？
A: 查看 `/tmp/db-update.log` 日志文件，或手动执行 SQL 语句。

---

## 一键测试脚本

创建文件 `test-local-update.sh`:

```bash
#!/bin/bash
echo "测试本地数据库更新 v2026.3.1"
echo "=============================="

# 1. 检查字段
echo -e "\n1. 检查关键字段..."
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "
SELECT COLUMN_NAME, COLUMN_TYPE 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA='jhchat' AND TABLE_NAME='users' 
AND COLUMN_NAME IN ('total_exp', 'monthly_exp', 'chat_minutes_today', 'chat_minutes_total', 'last_chat_time')
ORDER BY COLUMN_NAME;
"

# 2. 测试查询
echo -e "\n2. 测试数据查询..."
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "
SELECT id, username, total_exp, monthly_exp, chat_minutes_today 
FROM users LIMIT 3;
"

# 3. 检查表
echo -e "\n3. 检查新表..."
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "
SHOW TABLES LIKE '%level%';
SHOW TABLES LIKE '%chat_exp%';
SHOW TABLES LIKE '%admin_application%';
"

echo -e "\n✅ 测试完成！"
```

---

**更新日期**: 2026-04-28  
**数据库版本**: v2026.3.1  
**本地测试状态**: ✅ 就绪
