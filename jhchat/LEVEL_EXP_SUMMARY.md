# 用户等级经验系统升级总结

## 🎯 更新内容（v2026.3）

### 1. 核心功能

- ✅ **聊天室时长奖励**：每分钟自动获得经验
- ✅ **等级策略优化**：10 个等级，差异化经验获取速度
- ✅ **管理员等级规划**：Lv.6+ 可申请管理员，需满足注册天数和经验要求

### 2. 数据库变更

#### 新增字段
```sql
users 表：
- chat_minutes_today      今日聊天分钟数
- chat_minutes_total      累计聊天分钟数  
- last_chat_time          最后聊天时间
- total_exp（重命名自 all_value）总经验值
- monthly_exp（重命名自 month_value）月度经验
```

#### 新增数据表
- `user_level_config` - 等级配置（10 个等级）
- `chat_exp_logs` - 聊天经验日志
- `admin_applications` - 管理员申请记录

### 3. 等级配置

| 等级 | 升级经验 | 每日上限 | 每分钟经验 | 可任管理员 | 注册天数 | 总经验 |
|------|---------|---------|-----------|-----------|---------|-------|
| Lv.1 | 0 | 100 | 1 | ❌ | 0 | 0 |
| Lv.2 | 1K | 200 | 2 | ❌ | 0 | 0 |
| Lv.3 | 3K | 300 | 3 | ❌ | 1 | 1K |
| Lv.4 | 6K | 400 | 4 | ❌ | 3 | 3K |
| Lv.5 | 10K | 500 | 5 | ✅ | 7 | 6K |
| Lv.6 | 15K | 600 | 6 | ✅ | 15 | 10K |
| Lv.7 | 25K | 700 | 7 | ✅ | 30 | 15K |
| Lv.8 | 40K | 800 | 8 | ✅ | 60 | 25K |
| Lv.9 | 60K | 900 | 9 | ✅ | 90 | 40K |
| Lv.10 | 100K | 1K | 10 | ✅ | 180 | 60K |

### 4. 后端 API

```
GET    /api/admin/level-configs          # 获取等级配置
PUT    /api/admin/level-configs/:level   # 更新等级配置
POST   /api/admin/level-exp/calculate    # 计算聊天经验
GET    /api/admin/level-exp/verify-admin # 验证管理员资格
GET    /api/admin/level-exp/user-stats   # 用户经验统计
GET    /api/admin/level-exp/chat-logs    # 聊天经验日志
```

### 5. 前端页面

**管理后台** → **等级经验管理** (`/admin/level-exp`)

- 等级配置：查看/编辑各等级参数
- 经验统计：查询用户经验详情
- 聊天日志：查看经验获得记录

### 6. Socket.IO 增强

每次聊天消息自动：
1. 计算经验收益（考虑等级和日限制）
2. 更新用户聊天时长和经验
3. 记录经验日志

### 7. 管理员权限

**申请条件**：
- 等级 ≥ Lv.6
- 所属等级允许担任管理员
- 满足注册天数要求
- 满足总经验要求
- 加入"六扇门"门派

**权限分级**：
- Lv.6-7（护法）：用户管理、聊天室管理、新闻发布
- Lv.8-9（长老）：物品管理、活动管理、IP 管理、经济调控
- Lv.10（掌门）：全部权限

## 📦 部署步骤

### 1. 执行数据库迁移

```bash
cd /workspace/jhchat/backend
mysql -u root -p jhchat < migrations/20260426_user_level_exp_system.sql
```

### 2. 验证迁移

```sql
-- 检查等级配置
SELECT * FROM user_level_config ORDER BY level;

-- 检查用户表字段
DESC users;
```

### 3. 重启后端服务

```bash
cd /workspace/jhchat/backend
npm run dev
```

### 4. 测试功能

1. 访问管理后台 → 等级经验管理
2. 发送聊天消息，检查经验增长
3. 验证用户管理页面显示经验字段

## 📝 文件清单

### 新增文件
- `backend/migrations/20260426_user_level_exp_system.sql` - 数据库迁移
- `backend/src/controllers/admin/LevelExpController.js` - 等级经验控制器
- `frontend/src/views/admin/LevelExp.vue` - 等级经验管理页面
- `LEVEL_EXP_SYSTEM_UPDATE.md` - 详细更新文档

### 修改文件
- `backend/src/socket/index.js` - 聊天消息经验计算
- `backend/src/controllers/admin/UserController.js` - 用户列表增加经验字段
- `backend/src/routes/admin.js` - 新增等级经验路由
- `backend/src/controllers/admin/index.js` - 导出新控制器
- `frontend/src/views/admin/Users.vue` - 显示经验相关列
- `frontend/src/router/index.js` - 添加等级经验路由
- `2026 部署说明.md` - 更新部署文档

## 🎮 用户体验

### 普通用户
- 聊天自动获得经验（每分钟）
- 经验值随等级提升而增加
- 达到日限制后不再获得
- 可查看个人经验统计

### 管理员
- 动态调整等级配置
- 可视化用户经验数据
- 自动验证管理员资格
- 完整的经验日志追溯

## ⚠️ 注意事项

1. **兼容性**：旧字段 `all_value` 和 `month_value` 已重命名，代码需同步更新
2. **防作弊**：每分钟只能获得一次经验，有日限制
3. **数据安全**：所有经验获得都有日志记录
4. **性能影响**：聊天消息处理增加数据库写入，建议在低峰期部署

## 📞 技术支持

- 详细文档：`LEVEL_EXP_SYSTEM_UPDATE.md`
- 后端控制器：`backend/src/controllers/admin/LevelExpController.js`
- 前端页面：`frontend/src/views/admin/LevelExp.vue`

---

**版本**: v2026.3  
**更新日期**: 2026-04-26  
**作者**: JHChat 开发团队
