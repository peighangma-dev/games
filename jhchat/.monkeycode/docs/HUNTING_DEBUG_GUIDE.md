# 打猎系统错误排查指南

## 问题现象

访问 `/api/hunting/hunt/start` 返回 400 Bad Request 错误

## 可能的原因

### 1. 数据库表不存在或结构不正确

**症状**: 后端日志显示 SQL 相关错误

**检查方法**:
```sql
-- 检查表是否存在
SHOW TABLES LIKE 'hunting_states';
SHOW TABLES LIKE 'hunting_records';
SHOW TABLES LIKE 'hunting_items';

-- 检查表结构
DESC hunting_states;
DESC hunting_records;
DESC hunting_items;
```

**解决方案**:
```bash
# 执行修复脚本
mysql -u root -p jhchat < backend/src/scripts/fix-hunting-tables.sql
```

### 2. 用户体力不足

**症状**: 返回错误信息包含"体力不足"

**检查方法**:
```sql
-- 查看当前用户体力
SELECT id, username, tili FROM users WHERE id = <你的用户 ID>;
```

**解决方案**:
- 体力需要至少 200 点才能打猎
- 可以购买人参恢复体力
- 或者等待自然恢复

### 3. 打猎冷却时间未到

**症状**: 返回错误信息包含"冷却"

**检查方法**:
```sql
-- 查看上次打猎时间
SELECT * FROM hunting_records 
WHERE user_id = <你的用户 ID> 
AND type = 'hunt' 
ORDER BY completed_at DESC 
LIMIT 1;
```

**解决方案**:
- 打猎需要冷却 120 分钟（2 小时）
- 等待冷却时间结束

### 4. 已经有进行中的打猎

**症状**: 返回错误信息包含"已经在打猎中"

**检查方法**:
```sql
-- 查看是否有进行中的打猎
SELECT * FROM hunting_states 
WHERE user_id = <你的用户 ID> 
AND is_active = 1 
AND type = 'hunt';
```

**解决方案**:
```sql
-- 清除未完成的状态（谨慎使用）
UPDATE hunting_states 
SET is_active = 0 
WHERE user_id = <你的用户 ID> 
AND type = 'hunt';
```

### 5. hunting_items 表为空

**症状**: 完成打猎时出错

**检查方法**:
```sql
SELECT COUNT(*) FROM hunting_items;
```

**解决方案**:
```bash
# 执行修复脚本插入物品数据
mysql -u root -p jhchat < backend/src/scripts/fix-hunting-tables.sql
```

## 完整测试流程

### 1. 检查数据库表
```sql
-- 确认所有必需表存在
SHOW TABLES;

-- 应该看到:
-- hunting_states
-- hunting_records
-- hunting_items
```

### 2. 插入测试物品数据
```sql
INSERT INTO hunting_items (item_name, item_type, effect_neili, effect_tili, silver_value, rarities) VALUES
('人参', '药材', 50, 0, 100, 'common'),
('灵芝', '药材', 100, 0, 300, 'rare');
```

### 3. 测试 API

```bash
# 获取狩猎状态
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/hunting/status

# 开始打猎
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/hunting/hunt/start

# 完成打猎
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/hunting/hunt/finish
```

### 4. 查看后端日志
```bash
# Docker 环境
docker-compose logs -f backend

# 或者查看日志文件
tail -f backend/logs/error.log
```

## 常见错误及解决方案

### 错误 1: "Table 'jhchat.hunting_states' doesn't exist"
**解决**: 执行建表脚本
```bash
mysql -u root -p jhchat < backend/src/scripts/fix-hunting-tables.sql
```

### 错误 2: "Column 'xxx' not found"
**解决**: 表结构过旧，需要更新
```sql
-- 检查字段
DESC hunting_states;

-- 如果没有 cooldown_minutes 字段，需要重建表
DROP TABLE hunting_states;
-- 然后执行修复脚本
```

### 错误 3: "体力不足"
**解决**: 补充体力
```sql
-- 临时增加体力（仅测试用）
UPDATE users SET tili = 300 WHERE id = <用户 ID>;
```

### 错误 4: "打猎需要冷却 120 分钟"
**解决**: 清除冷却（仅测试用）
```sql
-- 清除打猎记录
DELETE FROM hunting_records WHERE user_id = <用户 ID> AND type = 'hunt';
```

## 快速修复脚本

如果以上方法都不起作用，可以执行完整重置：

```bash
#!/bin/bash
# 重置打猎系统（仅用于测试环境！）

DB_USER="root"
DB_PASS="your_password"
DB_NAME="jhchat"

mysql -u$DB_USER -p$DB_PASS $DB_NAME <<EOF
-- 清除所有打猎状态和记录
TRUNCATE TABLE hunting_states;
TRUNCATE TABLE hunting_records;

-- 重建物品表
DROP TABLE IF EXISTS hunting_items;
CREATE TABLE hunting_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_name VARCHAR(50) NOT NULL,
  item_type VARCHAR(20) DEFAULT NULL,
  effect_neili INT NOT NULL DEFAULT 0,
  effect_tili INT NOT NULL DEFAULT 0,
  silver_value INT NOT NULL DEFAULT 0,
  rarities ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') NOT NULL DEFAULT 'common',
  image_file VARCHAR(100) DEFAULT NULL,
  description VARCHAR(200) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入物品数据
INSERT INTO hunting_items (item_name, item_type, effect_neili, effect_tili, silver_value, rarities) VALUES
('人参', '药材', 50, 0, 100, 'common'),
('鹿茸', '药材', 80, 0, 200, 'uncommon'),
('灵芝', '药材', 100, 0, 300, 'rare'),
('千年何首乌', '药材', 200, 0, 1000, 'epic'),
('龙涎香', '药材', 500, 0, 5000, 'legendary');
EOF

echo "打猎系统已重置！"
```

## 预防措施

1. **数据库迁移**: 使用迁移脚本管理表结构变更
2. **数据验证**: 在代码中添加数据验证逻辑
3. **错误日志**: 详细记录错误信息便于排查
4. **单元测试**: 编写测试用例覆盖各种场景

## 联系支持

如果以上方法都无法解决问题，请提供：
- 完整的错误信息
- 后端日志
- 数据库表结构
- 测试步骤

---

**最后更新**: 2026-04-20  
**适用版本**: v2.0
