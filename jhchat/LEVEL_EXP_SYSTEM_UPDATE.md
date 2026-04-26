# 用户等级经验系统升级说明

## 版本：v2026.3

## 发布日期：2026-04-26

---

## 📋 更新概述

本次更新建立了完整的**聊天室时长 - 等级经验关联系统**，优化用户等级策略，增加管理员等级规划限制。

---

## 🎯 核心功能

### 1. 聊天室时长奖励

- **每分钟获得经验** = 当前等级对应的 `chat_exp_per_minute` 值
- **每日经验上限** = 当前等级对应的 `max_daily_chat_exp` 值
- **自动记录**：每次聊天自动统计分钟数并增加经验
- **经验分配**：同时增加 `total_exp`（总经验）和 `monthly_exp`（月经验）

### 2. 等级配置系统

| 等级 | 升级所需经验 | 每日聊天经验上限 | 每分钟经验 | 可任管理员 | 最少注册天数 | 最少总经验 |
|------|-------------|-----------------|-----------|-----------|-------------|----------|
| Lv.1 | 0 | 100 | 1 | ❌ | 0 天 | 0 |
| Lv.2 | 1,000 | 200 | 2 | ❌ | 0 天 | 0 |
| Lv.3 | 3,000 | 300 | 3 | ❌ | 1 天 | 1,000 |
| Lv.4 | 6,000 | 400 | 4 | ❌ | 3 天 | 3,000 |
| Lv.5 | 10,000 | 500 | 5 | ✅ | 7 天 | 6,000 |
| Lv.6 | 15,000 | 600 | 6 | ✅ | 15 天 | 10,000 |
| Lv.7 | 25,000 | 700 | 7 | ✅ | 30 天 | 15,000 |
| Lv.8 | 40,000 | 800 | 8 | ✅ | 60 天 | 25,000 |
| Lv.9 | 60,000 | 900 | 9 | ✅ | 90 天 | 40,000 |
| Lv.10 | 100,000 | 1,000 | 10 | ✅ | 180 天 | 60,000 |

### 3. 管理员资格限制

**申请管理员条件**：
- ✅ 等级 ≥ Lv.6
- ✅ 所属等级配置允许担任管理员 (`can_be_admin = 1`)
- ✅ 满足注册天数要求
- ✅ 满足总经验要求
- ✅ 加入"六扇门"门派

**管理员等级权限**：
- **Lv.6-7（护法）**：用户管理、聊天室管理、新闻发布
- **Lv.8-9（长老）**：物品管理、活动管理、IP 管理、经济调控
- **Lv.10（掌门）**：全部权限（包括管理员任免）

---

## 🗃️ 数据库变更

### 新增字段

```sql
-- 用户表新增字段
ALTER TABLE users 
ADD COLUMN `chat_minutes_today` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '今日聊天分钟数',
ADD COLUMN `chat_minutes_total` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '累计聊天分钟数',
ADD COLUMN `last_chat_time` DATETIME DEFAULT NULL COMMENT '最后聊天时间';

-- 重命名经验字段（兼容旧数据）
ALTER TABLE users 
CHANGE COLUMN `all_value` `total_exp` BIGINT NOT NULL DEFAULT 0 COMMENT '总经验值',
CHANGE COLUMN `month_value` `monthly_exp` BIGINT NOT NULL DEFAULT 0 COMMENT '月度经验值';
```

### 新增数据表

1. **`user_level_config`** - 等级配置表
2. **`chat_exp_logs`** - 聊天经验日志表
3. **`admin_applications`** - 管理员申请记录表

---

## 🔧 后端 API

### 管理后台接口

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/level-configs` | GET | 管理员 | 获取等级配置列表 |
| `/api/admin/level-configs/:level` | PUT | 掌门 | 更新等级配置 |
| `/api/admin/level-exp/calculate` | POST | 管理员 | 计算聊天经验 |
| `/api/admin/level-exp/verify-admin` | GET | 管理员 | 验证管理员资格 |
| `/api/admin/level-exp/user-stats` | GET | 管理员 | 获取用户经验统计 |
| `/api/admin/level-exp/chat-logs` | GET | 管理员 | 查询聊天经验日志 |
| `/api/admin/level-exp/admin-application` | POST | 用户 | 提交管理员申请 |
| `/api/admin/level-exp/admin-application/:id/review` | PUT | 掌门 | 审核管理员申请 |

---

## 🖥️ 前端页面

### 新增管理页面

**路径**: `/admin/level-exp`

**功能模块**：
1. **等级配置** - 查看和编辑各等级配置
2. **经验统计** - 查询用户经验详情
3. **聊天日志** - 查看聊天经验获得记录

---

## 📊 Socket.IO 变更

### 聊天消息事件增强

```javascript
socket.on('chat:message', async (data) => {
  // 自动记录聊天分钟数
  // 计算并增加经验值
  // 记录经验日志
});
```

**触发时机**：用户每次发送聊天消息时

**处理逻辑**：
1. 检查用户当前等级配置
2. 计算今日已获得经验
3. 判断是否达到日限制
4. 更新用户经验和聊天时长
5. 记录日志

---

## 🔐 安全与限制

### 防作弊机制

1. **每日经验上限** - 防止刷经验
2. **聊天时间间隔** - 每次有效聊天间隔至少 1 分钟
3. **管理员资格审查** - 自动验证注册天数和总经验
4. **日志记录** - 所有经验获得都有日志可追溯

### 数据一致性

- 迁移脚本自动重命名旧字段（`all_value` → `total_exp`, `month_value` → `monthly_exp`）
- 向后兼容现有代码
- 保留原有经验数据

---

## 📝 部署步骤

### 1. 执行数据库迁移

```bash
cd /workspace/jhchat/backend
mysql -u root -p jhchat < migrations/20260426_user_level_exp_system.sql
```

### 2. 验证迁移结果

```sql
-- 检查等级配置
SELECT * FROM user_level_config ORDER BY level;

-- 检查字段变更
DESC users;
```

### 3. 重启后端服务

```bash
cd /workspace/jhchat/backend
npm run dev
```

### 4. 验证功能

1. 访问管理后台 → 等级经验管理
2. 测试聊天室发送消息，检查经验增长
3. 验证不同等级的经验获取速度

---

## 🎮 用户体验变化

### 普通用户

- ✅ 聊天室聊天自动获得经验
- ✅ 每分钟获得经验值随等级提升而增加
- ✅ 达到日限制后获得系统提示
- ✅ 可查看自己的经验统计

### 管理员

- ✅ 等级配置动态调整
- ✅ 用户经验数据可视化
- ✅ 管理员资格自动验证
- ✅ 完整的经验日志追溯

---

## 📈 未来扩展

### 待开发功能

- [ ] 经验值排行榜
- [ ] 月度活跃用户奖励
- [ ] 特殊称号系统（基于经验积累）
- [ ] 经验值兑换系统
- [ ] 组队聊天经验加成

---

## 📞 问题反馈

如有问题，请联系开发团队或查看相关文档：

- 后端控制器：`backend/src/controllers/admin/LevelExpController.js`
- 前端页面：`frontend/src/views/admin/LevelExp.vue`
- Socket 实现：`backend/src/socket/index.js`

---

**版本**: v2026.3  
**更新日期**: 2026-04-26  
**兼容性**: MySQL 5.7+, Node.js 14+
