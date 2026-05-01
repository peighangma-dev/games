# 门派任务系统优化 - 技术设计

## 1. 数据库设计

### 1.1 修改 quests 表
```sql
ALTER TABLE quests ADD COLUMN `max_progress` INT DEFAULT 1 COMMENT '任务最大进度';
ALTER TABLE quests ADD COLUMN `refresh_type` ENUM('none','daily','manual') DEFAULT 'none' COMMENT '刷新类型';
```

### 1.2 新增 user_quest_progress 表
```sql
CREATE TABLE `user_quest_progress` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `quest_id` INT UNSIGNED NOT NULL,
  `progress` INT NOT NULL DEFAULT 0,
  `max_progress` INT NOT NULL DEFAULT 1,
  `status` ENUM('active','completed','claimed') DEFAULT 'active',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_quest` (`user_id`, `quest_id`)
);
```

### 1.3 新增 quest_achievements 表
```sql
CREATE TABLE `quest_achievements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `total_completed` INT DEFAULT 0,
  `daily_streak` INT DEFAULT 0,
  `best_streak` INT DEFAULT 0,
  `last_daily_completed` DATE DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`)
);
```

## 2. API 设计

### 2.1 获取任务列表
```
GET /api/sect/tasks
Query: type=daily|side|sect|bounty (可选，默认全部)
```

### 2.2 获取任务进度
```
GET /api/sect/tasks/:questId/progress
```

### 2.3 提交任务进度
```
POST /api/sect/tasks/:questId/submit
Body: { progress: 1 }  # 提交的进度数量
```

### 2.4 刷新任务
```
POST /api/sect/tasks/refresh
Body: { type: 'daily' }  # manual 为手动刷新
```

### 2.5 获取成就统计
```
GET /api/sect/tasks/achievements
```

## 3. 前端实现

### 3.1 组件结构
```
Sect.vue
├── TaskTabs (分类 Tab)
├── TaskList
│   ├── TaskItem
│   │   ├── TaskHeader (标题 + 难度 + 类型)
│   │   ├── TaskProgress (进度条)
│   │   ├── TaskRewards (奖励列表)
│   │   └── TaskAction (完成/提交按钮)
└── TaskAchievements (成就弹窗)
```

### 3.2 状态管理
```javascript
const tasks = ref({ daily: [], side: [], sect: [], bounty: [] })
const currentProgress = ref({})
const achievements = ref(null)
const activeCategory = ref('all')
```

## 4. 后端逻辑

### 4.1 任务刷新定时器
```javascript
// 每日 0 点刷新用户的日常任务
cron.schedule('0 0 * * *', async () => {
  await resetDailyQuests()
})
```

### 4.2 进度更新
- 打猎/采集等行为自动增加进度
- 手动提交进度（验证合理性）
- 进度满后自动标记可完成

### 4.3 成就更新
- 每次完成任务更新统计
- 计算连续登录天数
- 更新最佳记录

## 5. 实施步骤

1. 创建数据库迁移
2. 实现后端 API
3. 实现前端 UI
4. 添加定时器
5. 测试验证
