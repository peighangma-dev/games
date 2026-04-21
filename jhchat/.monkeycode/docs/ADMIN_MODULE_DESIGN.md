# 笑傲江湖聊天室 - 后台管理模块重构设计文档

## 一、设计目标

### 1.1 核心目标
- **全面可控**: 确保网站的每一个功能模块都在管理员的掌控之中
- **权限分级**: 实现细粒度的权限控制，不同级别管理员拥有不同权限
- **操作可溯**: 所有管理操作都有详细的日志记录，可追溯、可审计
- **安全优先**: 防止越权操作、恶意操作，保护系统安全
- **易用高效**: 界面友好，操作简单，提高管理效率

### 1.2 管理范围
- 用户管理（封禁、踢出、权限、属性修改）
- 全服控制（公告、维护模式、全服消息）
- 经济调控（银两、物价、税率）
- 游戏内容（技能、物品、宠物、门派）
- 日志审计（操作日志、登录日志、异常监控）
- 系统配置（参数配置、功能开关）

---

## 二、权限体系设计

### 2.1 管理员等级

| 等级 | 称号 | 说明 | 主要权限 |
|------|------|------|----------|
| 1-5 | 侠客 | 普通用户 | 无管理权限 |
| 6-7 | 护法 | 初级管理员 | 用户管理、聊天室管理、新闻发布 |
| 8-9 | 长老 | 高级管理员 | 物品管理、活动管理、IP 管理、经济调控 |
| 10 | 掌门 | 超级管理员 | 全部权限，包括管理员任免、系统配置 |

### 2.2 权限标识

```javascript
// 用户管理
'user:view'         // 查看用户列表
'user:edit'         // 修改用户信息
'user:ban'          // 封禁/解封用户
'user:kick'         // 踢出用户
'user:delete'       // 删除用户
'user:reset_password'  // 重置密码
'user:change_status'   // 修改用户状态

// 管理员管理
'admin:view'        // 查看管理员列表
'admin:add'         // 添加管理员
'admin:edit'        // 修改管理员权限
'admin:remove'      // 开除管理员

// 内容管理
'news:manage'       // 新闻公告管理
'config:view'       // 查看系统配置
'config:edit'       // 修改系统配置
'room:manage'       // 聊天室管理
'announcement:manage' // 全服公告

// IP 管理
'ip:lock'           // IP 临时封锁
'ip:bans_view'      // 查看 IP 封禁列表
'ip:ban'            // IP 永久封禁
'ip:logs_view'      // 查看 IP 日志

// 物品管理
'item:view'         // 查看物品
'item:edit'         // 修改物品
'item:delete'       // 删除物品
'shop:manage'       // 商店管理
'inventory:view'    // 查看用户背包

// 经济控制
'economy:grant'     // 发放银两
'economy:revoke'    // 扣除银两
'economy:config'    // 经济参数配置

// 游戏管理
'game:config'       // 游戏配置
'event:trigger'     // 触发事件
'event:manage'      // 随机事件管理
'skill:manage'      // 技能管理
'pet:manage'        // 宠物管理
'sect:manage'       // 门派管理

// 日志审计
'log:view'          // 查看日志
'log:clear'         // 清除日志
'audit:view'        // 审计日志

// 系统控制
'server:maintenance' // 维护模式
'server:restart'    // 重启服务
'server:broadcast'  // 全服广播
'server:kick_all'   // 全服踢出
```

### 2.3 权限中间件

```javascript
// 使用示例
router.put('/users/:id/ban', 
  permissionAuth('user:ban'), 
  logAction('user_ban'), 
  adminCtrl.banUser
);

router.post('/admin/add', 
  permissionAuth('admin:add'), 
  logAction('admin_add'), 
  adminCtrl.addManager
);
```

---

## 三、管理模块架构

### 3.1 目录结构

```
backend/src/
├── controllers/
│   └── admin/
│       ├── index.js           # 管理模块主控制器
│       ├── dashboard.js       # 仪表盘统计
│       ├── user.js            # 用户管理
│       ├── content.js         # 内容管理
│       ├── economy.js         # 经济调控
│       ├── game.js            # 游戏管理
│       ├── security.js        # 安全管理
│       ├── system.js          # 系统控制
│       └── audit.js           # 审计日志
├── middleware/
│   └── adminAuth.js           # 管理员认证与权限
├── routes/
│   └── admin.js               # 管理路由
└── services/
    └── admin/
        ├── UserService.js     # 用户服务层
        ├── EconomyService.js  # 经济服务层
        └── AuditService.js    # 审计服务层
```

### 3.2 路由设计

```javascript
// /api/admin/ 路由规划
GET    /dashboard              # 仪表盘总览
GET    /dashboard/realtime     # 实时数据

// 用户管理
GET    /users                  # 用户列表
GET    /users/:id              # 用户详情
PUT    /users/:id              # 修改用户
DELETE /users/:id              # 删除用户
POST   /users/:id/ban          # 封禁用户
POST   /users/:id/kick         # 踢出用户
POST   /users/:id/reset-pwd    # 重置密码
GET    /users/:id/inventory    # 查看背包
GET    /users/:id/logs         # 用户日志

// 全服控制
POST   /server/broadcast       # 全服广播
POST   /server/maintenance     # 维护模式
POST   /server/kick-all        # 全服踢出
GET    /server/status          # 服务状态

// 公告管理
GET    /announcements          # 公告列表
POST   /announcements          # 发布公告
PUT    /announcements/:id      # 修改公告
DELETE /announcements/:id      # 删除公告

// 经济管理
GET    /economy/stats          # 经济统计
POST   /economy/grant          # 发放银两
POST   /economy/revoke         # 扣除银两
PUT    /economy/config         # 经济配置

// 游戏内容管理
GET    /games/items            # 物品管理
GET    /games/skills           # 技能管理
GET    /games/pets             # 宠物管理
GET    /games/sects            # 门派管理
GET    /games/events           # 随机事件管理

// 安全管理
GET    /security/ip-locks      # IP 临时封锁
GET    /security/ip-bans       # IP 永久封禁
GET    /security/ip-logs       # IP 日志
POST   /security/ban-ip        # 封锁 IP

// 审计日志
GET    /audit/actions          # 操作日志
GET    /audit/logins           # 登录日志
GET    /audit/errors           # 错误日志
```

---

## 四、核心功能模块详细设计

### 4.1 仪表盘模块 (Dashboard)

#### 功能说明
提供实时、全面的服务器状态和数据统计，帮助管理员快速了解服务器运行情况。

#### API 接口

```javascript
// 1. 总览数据
GET /api/admin/dashboard

Response:
{
  "success": true,
  "data": {
    "server": {
      "status": "online",
      "uptime": 86400,        // 运行时长 (秒)
      "version": "2.0.0",
      "environment": "production"
    },
    "users": {
      "online": 156,          // 在线人数
      "total": 5280,          // 总用户数
      "newToday": 23,         // 今日新增
      "newThisMonth": 456     // 本月新增
    },
    "chat": {
      "messagesToday": 12580, // 今日消息数
      "messagesTotal": 1250000 // 总消息数
    },
    "economy": {
      "totalSilver": 50000000,  // 流通银两总量
      "avgSilver": 9470,        // 人均银两
      "totalDeposit": 20000000  // 银行总存款
    }
  }
}

// 2. 实时数据（WebSocket 推送）
WS /api/admin/realtime

推送数据:
{
  "type": "realtime_update",
  "data": {
    "onlineUsers": 158,
    "messagesPerMinute": 45,
    "tps": 120
  }
}

// 3. 图表数据
GET /api/admin/dashboard/charts?type=register&period=7d

Response:
{
  "success": true,
  "data": {
    "labels": ["2024-01-01", "2024-01-02", ...],
    "datasets": [
      {
        "label": "新增用户",
        "data": [23, 45, 67, ...]
      }
    ]
  }
}
```

#### 数据可视化
- 实时在线人数曲线
- 7 日新增用户趋势
- 30 日活跃度热力图
- 经济分布饼图
- 聊天消息时段分布

---

### 4.2 用户管理模块 (User Management)

#### 功能说明
全面管理用户账号，包括信息查询、状态控制、属性修改、惩罚措施等。

#### 核心 API

```javascript
// 1. 高级搜索用户列表
GET /api/admin/users?page=1&limit=20&filters=...

Query Parameters:
- search: 用户名搜索
- status: 状态筛选 (normal/jailed/banned/dead)
- grade: 等级范围
- sect: 门派
- vip: 是否 VIP
- registerIp: 注册 IP
- lastLoginIp: 最后登录 IP
- dateRange: 注册日期范围

Response:
{
  "success": true,
  "data": {
    "users": [...],
    "total": 1250,
    "page": 1,
    "limit": 20
  }
}

// 2. 用户详情
GET /api/admin/users/:id

Response:
{
  "success": true,
  "data": {
    "basic": { ... },      // 基本信息
    "stats": { ... },      // 统计数据
    "equipment": [...],    // 装备
    "inventory": [...],    // 背包
    "skills": [...],       // 技能
    "logs": [...]          // 最近日志
  }
}

// 3. 封禁用户
POST /api/admin/users/:id/ban

Body:
{
  "reason": "发布违规信息",
  "duration": 7,  // 天数，0 为永久
  "notify": true  // 是否发送站内通知
}

// 4. 踢出用户
POST /api/admin/users/:id/kick

Body:
{
  "reason": "扰乱聊天室秩序",
  "cooldown": 30  // 禁止登录时长 (分钟)
}

// 5. 查看用户背包
GET /api/admin/users/:id/inventory

// 6. 修改用户属性
PUT /api/admin/users/:id/attributes

Body:
{
  "silver": 10000,
  "neili": 5000,
  "wugong": 800,
  "grade": 5
}

// 7. 重置密码
POST /api/admin/users/:id/reset-password

Body:
{
  "newPassword": "temporary123",
  "notify": true,
  "forceChange": true  // 强制下次登录修改
}

// 8. 用户时间线
GET /api/admin/users/:id/timeline?page=1

Response:
{
  "success": true,
  "data": {
    "events": [
      {
        "type": "login",
        "time": "2024-01-15 10:30:00",
        "ip": "192.168.1.1",
        "details": "从北京登录"
      },
      {
        "type": "purchase",
        "time": "2024-01-15 11:00:00",
        "details": "在商店购买 屠龙刀"
      }
    ]
  }
}
```

#### 批量操作

```javascript
// 批量封禁
POST /api/admin/users/batch-ban
Body: { "userIds": [1,2,3], "reason": "...", "duration": 7 }

// 批量发送邮件
POST /api/admin/users/batch-mail
Body: { "userIds": [1,2,3], "title": "...", "content": "..." }

// 批量修改属性
POST /api/admin/users/batch-update
Body: { 
  "filter": { "sect": "唐门" },
  "updates": { "silver": "+1000" }
}
```

---

### 4.3 全服控制模块 (Server Control)

#### 功能说明
控制整个服务器的运行状态，发布全局通知，紧急情况下快速响应。

#### 核心 API

```javascript
// 1. 全服广播
POST /api/admin/server/broadcast

Body:
{
  "message": "【系统公告】今晚 8 点进行双倍经验活动",
  "type": "announcement",  // announcement/alert/system
  "priority": "high",      // low/normal/high/critical
  "channels": ["chat", "websocket", "push"],
  "highlight": true,       // 是否高亮显示
  "sticky": true           // 是否置顶
}

// 2. 维护模式
POST /api/admin/server/maintenance

Body:
{
  "enabled": true,
  "message": "服务器正在维护，预计 30 分钟后恢复",
  "whitelist": [1, 2, 3],  // 允许登录的用户 ID（管理员）
  "kickExisting": false    // 是否踢出已在线用户
}

// 3. 服务状态
GET /api/admin/server/status

Response:
{
  "success": true,
  "data": {
    "http": { status: "online", port: 3001 },
    "websocket": { status: "online", connections: 156 },
    "database": { status: "online", connections: 15 },
    "redis": { status: "online", memory: "50MB" },
    "uptime": 86400,
    "load": { cpu: 45, memory: 68 }
  }
}

// 4. 全服踢出（紧急情况）
POST /api/admin/server/kick-all

Body:
{
  "reason": "紧急维护",
  "excludeAdmins": true,
  "banNewLogins": true,
  "duration": 30
}

// 5. 限制功能
PUT /api/admin/server/features

Body:
{
  "feature": "chat",  // chat/trade/pk/event
  "enabled": false,
  "reason": "修复 PK 漏洞",
  "duration": 60
}

// 6. 资源清理
POST /api/admin/server/cleanup

Body:
{
  "type": "cache",  // cache/logs/sessions
  "dryRun": true    // 仅预览，不实际执行
}
```

---

### 4.4 经济调控模块 (Economy Control)

#### 功能说明
监控和调控游戏经济系统，防止通货膨胀，维护经济平衡。

#### 核心 API

```javascript
// 1. 经济统计
GET /api/admin/economy/stats

Response:
{
  "success": true,
  "data": {
    "money": {
      "totalSilver": 50000000,
      "totalDeposit": 20000000,
      "circulation": 30000000,
      "avgPerUser": 9470
    },
    "income": {
      "daily": 125000,
      "sources": {
        "quest": 45000,
        "trade": 35000,
        "gift": 25000,
        "other": 20000
      }
    },
    "spending": {
      "daily": 98000,
      "categories": {
        "shop": 45000,
        "market": 35000,
        "tax": 18000
      }
    },
    "inflation": {
      "rate": 2.3,
      "trend": "stable"
    }
  }
}

// 2. 发放银两
POST /api/admin/economy/grant

Body:
{
  "targetType": "user",  // user/all/vip/sect
  "targetId": 123,       // 用户 ID 或门派 ID
  "amount": 1000,
  "reason": "活动奖励",
  "notify": true
}

// 3. 扣除银两
POST /api/admin/economy/revoke

Body:
{
  "targetType": "user",
  "targetId": 123,
  "amount": 5000,
  "reason": "非法刷银",
  "notify": true
}

// 4. 经济配置
PUT /api/admin/economy/config

Body:
{
  "shopTaxRate": 0.05,        // 商店税率
  "marketTaxRate": 0.03,      // 市场税率
  "maxDailyIncome": 100000,   // 单日收入上限
  "minWage": 100,             // 最低工资
  "itemPriceFloor": 0.5,      // 物品价格下限
  "itemPriceCeiling": 10.0    // 物品价格上限
}

// 5. 物价监控
GET /api/admin/economy/price-monitor

Response:
{
  "success": true,
  "data": {
    "abnormalItems": [
      {
        "name": "屠龙刀",
        "avgPrice": 5000,
        "currentPrice": 500,
        "changeRate": -90,
        "alert": "价格异常"
      }
    ]
  }
}

// 6. 交易审计
GET /api/admin/economy/transactions?userId=123&date=2024-01-15
```

---

### 4.5 游戏内容管理模块 (Game Content)

#### 功能说明
管理游戏内的各种内容，包括物品、技能、宠物、门派、随机事件等。

#### 核心 API

```javascript
// 1. 物品管理
GET /api/admin/game/items?page=1&type=weapon
POST /api/admin/game/items
PUT /api/admin/game/items/:id
DELETE /api/admin/game/items/:id

// 批量操作
POST /api/admin/game/items/batch-import
POST /api/admin/game/items/batch-export

// 2. 技能管理
GET /api/admin/game/skills
POST /api/admin/game/skills
PUT /api/admin/game/skills/:id

// 3. 宠物管理
GET /api/admin/game/pets
POST /api/admin/game/pets
PUT /api/admin/game/pets/:id

// 4. 门派管理
GET /api/admin/game/sects
POST /api/admin/game/sects
PUT /api/admin/game/sects/:id
DELETE /api/admin/game/sects/:id

// 5. 随机事件管理
GET /api/admin/game/events?enabled=true
POST /api/admin/game/events
PUT /api/admin/game/events/:id
DELETE /api/admin/game/events/:id
POST /api/admin/game/events/:id/toggle  // 启用/禁用
POST /api/admin/game/events/trigger     // 手动触发

Body:
{
  "eventId": 123,
  "targetType": "all",  // all/user/sect
  "targetId": 456
}

// 6. 副本/任务管理
GET /api/admin/game/quests
POST /api/admin/game/quests
PUT /api/admin/game/quests/:id

// 7. 排行榜管理
GET /api/admin/game/rankings/reset
POST /api/admin/game/rankings/config
```

---

### 4.6 安全管理模块 (Security)

#### 功能说明
保护服务器安全，防止作弊、攻击和恶意行为。

#### 核心 API

```javascript
// 1. IP 管理
GET /api/admin/security/ip-locks
POST /api/admin/security/ip-locks
DELETE /api/admin/security/ip-locks/:id

GET /api/admin/security/ip-bans
POST /api/admin/security/ip-bans
DELETE /api/admin/security/ip-bans/:id

// 2. IP 日志查询
GET /api/admin/security/ip-logs?ip=192.168.1.1&userId=123

// 3. 异常行为监控
GET /api/admin/security/anomalies

Response:
{
  "success": true,
  "data": {
    "suspiciousUsers": [
      {
        "userId": 123,
        "username": "张三",
        "reason": "短时间内大量交易",
        "riskLevel": "high",
        "detectedAt": "2024-01-15 10:30:00"
      }
    ],
    "attackAttempts": [...],
    "cheatReports": [...]
  }
}

// 4. 举报处理
GET /api/admin/security/reports
PUT /api/admin/security/reports/:id/handle

Body:
{
  "action": "ban",  // ban/ignore/warn
  "reason": "查证属实",
  "duration": 7
}

// 5. 敏感词管理
GET /api/admin/security/sensitive-words
POST /api/admin/security/sensitive-words
DELETE /api/admin/security/sensitive-words/:id

// 6. 反作弊配置
PUT /api/admin/security/anti-cheat

Body:
{
  "enabled": true,
  "autoBanThreshold": 5,
  "alertOnSuspicion": true
}
```

---

### 4.7 审计日志模块 (Audit & Logs)

#### 功能说明
记录所有重要操作，支持追溯和审计，帮助分析问题。

#### 核心 API

```javascript
// 1. 操作日志
GET /api/admin/audit/actions?operator=admin&page=1

Query Parameters:
- operator: 操作者
- actionType: 操作类型
- dateRange: 日期范围
- keyword: 关键词搜索

Response:
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "userId": 10,
        "username": "管理员 A",
        "action": "POST /api/admin/users/123/ban",
        "ip": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "requestData": {...},
        "responseStatus": "success",
        "timestamp": "2024-01-15 10:30:00"
      }
    ],
    "total": 1250,
    "page": 1
  }
}

// 2. 登录日志
GET /api/admin/audit/logins?userId=123

// 3. 错误日志
GET /api/admin/audit/errors?level=error

// 4. 系统日志
GET /api/admin/audit/system?service=mysql

// 5. 用户行为日志
GET /api/admin/audit/user/:id/actions

// 6. 导出日志
POST /api/admin/audit/export

Body:
{
  "type": "actions",
  "dateRange": ["2024-01-01", "2024-01-31"],
  "format": "csv"  // csv/json
}

// 7. 日志统计
GET /api/admin/audit/stats

Response:
{
  "success": true,
  "data": {
    "totalActions": 12580,
    "byType": {
      "user_ban": 23,
      "user_kick": 45,
      "config_change": 12
    },
    "byOperator": [
      { "username": "管理员 A", "count": 450 },
      { "username": "管理员 B", "count": 320 }
    ]
  }
}
```

---

## 五、数据库设计

### 5.1 新增表结构

```sql
-- 管理员操作日志表
CREATE TABLE `admin_action_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL COMMENT '管理员 ID',
  `username` VARCHAR(20) NOT NULL COMMENT '管理员用户名',
  `action_type` VARCHAR(50) NOT NULL COMMENT '操作类型',
  `action` VARCHAR(500) NOT NULL COMMENT '具体操作',
  `ip` VARCHAR(45) DEFAULT NULL COMMENT '操作 IP',
  `user_agent` VARCHAR(200) DEFAULT NULL COMMENT '浏览器信息',
  `request_data` TEXT COMMENT '请求数据',
  `response_status` ENUM('success', 'failed') NOT NULL DEFAULT 'success',
  `error_message` TEXT COMMENT '错误信息',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_time` (`created_at`),
  KEY `idx_action_type` (`action_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员操作日志';

-- 用户 IP 日志表（已存在，增强）
ALTER TABLE `user_ip_logs` 
ADD INDEX `idx_ip` (`ip_address`),
ADD INDEX `idx_created` (`created_at`);

-- 经济交易日志表
CREATE TABLE `economy_transaction_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `type` VARCHAR(20) NOT NULL COMMENT '交易类型',
  `amount` BIGINT NOT NULL COMMENT '金额',
  `balance_before` BIGINT NOT NULL COMMENT '交易前余额',
  `balance_after` BIGINT NOT NULL COMMENT '交易后余额',
  `operator_id` INT UNSIGNED DEFAULT NULL COMMENT '操作管理员 ID',
  `reason` VARCHAR(500) COMMENT '原因',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_time` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='经济交易日志';

-- 系统配置变更日志
CREATE TABLE `config_change_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `config_name` VARCHAR(50) NOT NULL,
  `old_value` TEXT,
  `new_value` TEXT,
  `operator_id` INT UNSIGNED NOT NULL,
  `operator_name` VARCHAR(20) NOT NULL,
  `reason` VARCHAR(500),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_config` (`config_name`),
  KEY `idx_time` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配置变更日志';

-- 异常行为记录表
CREATE TABLE `security_anomalies` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `anomaly_type` VARCHAR(50) NOT NULL COMMENT '异常类型',
  `description` TEXT,
  `risk_level` ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  `evidence` TEXT COMMENT '证据数据',
  `status` ENUM('pending', 'investigating', 'resolved', 'false_alarm') NOT NULL DEFAULT 'pending',
  `handler_id` INT UNSIGNED DEFAULT NULL COMMENT '处理人',
  `resolved_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_risk` (`risk_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='异常行为记录';
```

---

## 六、安全设计

### 6.1 权限验证

```javascript
// 所有管理请求必须经过以下验证
1. Token 验证 (JWT)
2. 管理员身份验证 (grade >= 6 && faction === '逍遥派')
3. 权限点验证 (permissionAuth)
4. 操作日志记录 (logAction)
```

### 6.2 敏感操作保护

```javascript
// 需要二次验证的操作
- 管理员任免
- 永久封禁用户
- IP 永久封锁
- 经济大额操作 (>10000 银两)
- 系统配置修改
- 数据删除操作

// 实现方式
- 邮件验证码
- Google Authenticator
- 管理员密码确认
```

### 6.3 防护机制

```javascript
// 速率限制
- 管理 API 单独限流：100 次/分钟
- 敏感操作限流：10 次/分钟

// IP 白名单（可选）
- 只允许特定 IP 访问管理后台

// 会话管理
- 管理员会话 30 分钟无操作自动过期
- 单管理员最多 3 个并发会话

// 审计告警
- 连续失败登录 5 次告警
- 异常操作频率告警
- 敏感操作实时通知
```

---

## 七、前端管理界面设计

### 7.1 页面结构

```
/admin                      # 管理后台首页
├── /dashboard             # 仪表盘
├── /users                 # 用户管理
│   ├── /list             # 用户列表
│   └── /:id              # 用户详情
├── /security             # 安全管理
│   ├── /ip-management    # IP 管理
│   └── /anomalies        # 异常监控
├── /content              # 内容管理
│   ├── /items            # 物品管理
│   ├── /skills           # 技能管理
│   └── /events           # 随机事件
├── /economy              # 经济调控
│   ├── /stats            # 经济统计
│   └── /transactions     # 交易审计
├── /system               # 系统设置
│   ├── /config           # 系统配置
│   └── /announcement     # 公告管理
└── /audit                # 审计日志
    ├── /actions          # 操作日志
    ├── /logins           # 登录日志
    └── /errors           # 错误日志
```

### 7.2 组件设计

```vue
<!-- 管理员布局 -->
<AdminLayout>
  <Sidebar>导航菜单</Sidebar>
  <Header>
    <UserMenu />
    <NotificationBell />
  </Header>
  
  <MainContent>
    <Dashboard v-if="path === '/dashboard'" />
    <UserList v-else-if="path === '/users'" />
    <!-- 其他页面 -->
  </MainContent>
</AdminLayout>

<!-- 权限指令 -->
<div v-permission="'user:edit'">编辑按钮</div>

<!-- 操作确认 -->
<ConfirmDialog
  title="封禁用户"
  message="确定要封禁该用户吗？"
  type="warning"
  @confirm="handleBan"
/>
```

---

## 八、实施计划

### Phase 1: 基础架构 (1-2 周)
- [x] 权限中间件开发
- [ ] 管理路由重构
- [ ] 操作日志记录
- [ ] 基础仪表盘

### Phase 2: 核心功能 (2-3 周)
- [ ] 用户管理增强
- [ ] 全服控制功能
- [ ] 经济调控模块
- [ ] 安全管理模块

### Phase 3: 游戏内容 (2 周)
- [ ] 物品管理
- [ ] 技能管理
- [ ] 宠物管理
- [ ] 随机事件管理

### Phase 4: 审计与优化 (1-2 周)
- [ ] 完整日志系统
- [ ] 数据导出功能
- [ ] 性能优化
- [ ] 安全加固

### Phase 5: 前端界面 (3-4 周)
- [ ] 管理后台 UI
- [ ] 图表可视化
- [ ] 响应式设计
- [ ] 用户体验优化

---

## 九、API 错误码规范

```javascript
// 认证相关 (AUTH_XXXX)
AUTH_REQUIRED: '未登录',
AUTH_INVALID: '令牌无效',
AUTH_EXPIRED: '令牌已过期',

// 权限相关 (PERM_XXXX)
ADMIN_REQUIRED: '需要管理员权限',
LEADER_REQUIRED: '需要掌门权限',
GRADE_INSUFFICIENT: '等级不足',
PERMISSION_DENIED: '权限不足',

// 操作相关 (OP_XXXX)
OP_FAILED: '操作失败',
OP_NOT_ALLOWED: '不允许的操作',
OP_CONFLICT: '操作冲突',

// 资源相关 (RES_XXXX)
RES_NOT_FOUND: '资源不存在',
RES_ALREADY_EXISTS: '资源已存在',
RES_IN_USE: '资源被使用',

// 系统相关 (SYS_XXXX)
SYS_ERROR: '系统错误',
SYS_MAINTENANCE: '系统维护中',
SYS_OVERLOAD: '系统过载'
```

---

## 十、监控与告警

### 10.1 监控指标

```javascript
// 系统指标
- CPU 使用率
- 内存使用率
- 磁盘空间
- 网络流量

// 业务指标
- 在线人数
- 消息吞吐量
- 数据库连接数
- 经济总量

// 安全指标
- 失败登录次数
- 异常请求频率
- 封禁用户数
- 举报数量
```

### 10.2 告警规则

```javascript
// 高优先级告警
- 服务宕机
- 数据库连接失败
- 异常流量峰值

// 中优先级告警
- CPU/内存超过 80%
- 错误日志激增
- 大量用户举报

// 低优先级告警
- 单日新增用户异常
- 经济数据异常
- 管理员操作异常
```

---

## 附录

### A. 管理员权限速查表

| 功能模块 | 护法 (6-7) | 长老 (8-9) | 掌门 (10) |
|---------|-----------|-----------|----------|
| 用户管理 | ✓ | ✓ | ✓ |
| 封禁用户 | 7 天以内 | 30 天以内 | 永久 |
| 管理员管理 | ✗ | 查看 | ✓ |
| 物品管理 | 查看 | ✓ | ✓ |
| 经济调控 | ✗ | 部分 | ✓ |
| 系统配置 | ✗ | 查看 | ✓ |
| IP 管理 | ✗ | 临时封锁 | ✓ |
| 日志审计 | 部分 | ✓ | ✓ |

### B. 快速命令参考

```bash
# 查看帮助
GET /api/admin/help

# 紧急维护
POST /api/admin/emergency/maintenance

# 数据备份
POST /api/admin/backup

# 清空缓存
POST /api/admin/cache/clear
```

### C. 相关文档

- [错误提示指南](./ERROR_MESSAGES_GUIDE.md)
- [API 接口文档](./API_REFERENCE.md)
- [管理员手册](./ADMIN_MANUAL.md)

---

**文档版本**: 2.0  
**最后更新**: 2026-04-20  
**维护者**: 开发团队
