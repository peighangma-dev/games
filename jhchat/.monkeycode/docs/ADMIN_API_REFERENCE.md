# 管理后台 API 接口文档

## 概述

本文档描述了笑傲江湖聊天室管理后台的所有 API 接口。

### 基础信息

- **基础路径**: `/api/admin`
- **认证方式**: JWT Bearer Token
- **请求格式**: JSON (Content-Type: application/json)
- **响应格式**: JSON

### 认证头

```
Authorization: Bearer <token>
```

### 响应格式

所有响应遵循统一格式：

```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "code": "SUCCESS"
}
```

错误响应：

```json
{
  "success": false,
  "message": "错误描述",
  "code": "ERROR_CODE"
}
```

---

## 目录

1. [仪表盘](#仪表盘)
2. [用户管理](#用户管理)
3. [全服控制](#全服控制)
4. [公告管理](#公告管理)
5. [系统配置](#系统配置)
6. [聊天室管理](#聊天室管理)
7. [管理员管理](#管理员管理)
8. [IP 管理](#ip-管理)
9. [物品管理](#物品管理)
10. [商店管理](#商店管理)
11. [随机事件管理](#随机事件管理)
12. [经济调控](#经济调控)
13. [日志审计](#日志审计)

---

## 仪表盘

### 1.1 获取仪表盘总览

```http
GET /api/admin/dashboard
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "server": {
      "status": "online",
      "uptime": 86400,
      "version": "2.0.0"
    },
    "users": {
      "online": 156,
      "total": 5280,
      "newToday": 23,
      "newThisMonth": 456
    },
    "chat": {
      "messagesToday": 12580,
      "messagesTotal": 1250000
    },
    "economy": {
      "totalSilver": 50000000,
      "avgSilver": 9470,
      "totalDeposit": 20000000
    }
  }
}
```

### 1.2 获取实时数据

```http
GET /api/admin/dashboard/realtime
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "onlineUsers": 158,
    "messagesPerMinute": 45,
    "byRoom": [
      {"name": "公共频道", "count": 80},
      {"name": "门派频道", "count": 50}
    ]
  }
}
```

### 1.3 获取图表数据

```http
GET /api/admin/dashboard/charts?type=register&period=7d
```

**参数**:
- `type`: 图表类型 (register/chat/login)
- `period`: 时间周期 (7d/30d/90d)

---

## 用户管理

### 2.1 获取用户列表

```http
GET /api/admin/users?page=1&limit=20&search=张三&status=normal
```

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码，默认 1 |
| limit | number | 每页数量，默认 20 |
| search | string | 用户名搜索 |
| status | string | 状态筛选 |
| grade | string | 等级范围 (如：6-10) |
| sect | string | 门派 |
| vip | boolean | 是否 VIP |
| startDate | date | 注册开始日期 |
| endDate | date | 注册结束日期 |

### 2.2 获取用户详情

```http
GET /api/admin/users/:id
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "basic": {...},
    "stats": {
      "chatMessages": 1250,
      "trades": 45
    },
    "equipment": [...],
    "recentLogins": [...]
  }
}
```

### 2.3 更新用户信息

```http
PUT /api/admin/users/:id
Content-Type: application/json

{
  "grade": 5,
  "silver": 10000,
  "neili": 5000,
  "sect": "逍遥派"
}
```

### 2.4 封禁用户

```http
POST /api/admin/users/:id/ban
Content-Type: application/json

{
  "reason": "发布违规信息",
  "duration": 7,
  "notify": true
}
```

### 2.5 解封用户

```http
POST /api/admin/users/:id/unban
Content-Type: application/json

{
  "notify": true
}
```

### 2.6 踢出用户

```http
POST /api/admin/users/:id/kick
Content-Type: application/json

{
  "reason": "扰乱秩序",
  "cooldown": 30,
  "notify": true
}
```

### 2.7 重置密码

```http
POST /api/admin/users/:id/reset-password
Content-Type: application/json

{
  "newPassword": "temporary123",
  "notify": true,
  "forceChange": true
}
```

### 2.8 获取用户背包

```http
GET /api/admin/users/:id/inventory?page=1&limit=50
```

### 2.9 获取用户时间线

```http
GET /api/admin/users/:id/timeline?page=1&limit=20
```

### 2.10 删除用户

```http
DELETE /api/admin/users/:id
```

---

## 全服控制

### 3.1 全服广播

```http
POST /api/admin/server/broadcast
Content-Type: application/json

{
  "message": "【系统公告】今晚 8 点双倍经验活动",
  "type": "announcement",
  "priority": "high",
  "highlight": true
}
```

### 3.2 设置维护模式

```http
POST /api/admin/server/maintenance
Content-Type: application/json

{
  "enabled": true,
  "message": "服务器维护中，预计 30 分钟后恢复",
  "whitelist": [1, 2, 3],
  "kickExisting": false
}
```

### 3.3 获取服务器状态

```http
GET /api/admin/server/status
```

### 3.4 全服踢出

```http
POST /api/admin/server/kick-all
Content-Type: application/json

{
  "reason": "紧急维护",
  "excludeAdmins": true,
  "banNewLogins": true,
  "duration": 30
}
```

### 3.5 限制功能开关

```http
PUT /api/admin/server/features
Content-Type: application/json

{
  "feature": "chat",
  "enabled": false,
  "reason": "修复漏洞",
  "duration": 60
}
```

---

## 公告管理

### 4.1 获取公告列表

```http
GET /api/admin/announcements
```

### 4.2 发布公告

```http
POST /api/admin/announcements
Content-Type: application/json

{
  "topic": "系统维护公告",
  "content": "详细内容..."
}
```

### 4.3 修改公告

```http
PUT /api/admin/announcements/:id
Content-Type: application/json

{
  "topic": "新标题",
  "content": "新内容"
}
```

### 4.4 删除公告

```http
DELETE /api/admin/announcements/:id
```

---

## 系统配置

### 5.1 获取配置列表

```http
GET /api/admin/config
```

### 5.2 更新配置

```http
PUT /api/admin/config/:name
Content-Type: application/json

{
  "value": "new_value"
}
```

---

## 聊天室管理

### 6.1 获取房间列表

```http
GET /api/admin/rooms
```

### 6.2 创建房间

```http
POST /api/admin/rooms
Content-Type: application/json

{
  "name": "VIP 包厢",
  "min_grade": 5,
  "max_grade": 10,
  "fight_enabled": false
}
```

### 6.3 更新房间

```http
PUT /api/admin/rooms/:id
Content-Type: application/json

{
  "name": "新房间名",
  "min_grade": 6
}
```

### 6.4 删除房间

```http
DELETE /api/admin/rooms/:id
```

---

## 管理员管理

### 7.1 获取管理员列表

```http
GET /api/admin/managers
```

### 7.2 添加管理员

```http
POST /api/admin/managers
Content-Type: application/json

{
  "username": "张三",
  "grade": 6,
  "faction": "逍遥派"
}
```

### 7.3 修改管理员权限

```http
PUT /api/admin/managers/:id
Content-Type: application/json

{
  "grade": 7,
  "faction": "逍遥派"
}
```

### 7.4 开除管理员

```http
DELETE /api/admin/managers/:id
```

---

## IP 管理

### 8.1 获取 IP 临时封锁列表

```http
GET /api/admin/ip-locks
```

### 8.2 封锁 IP

```http
POST /api/admin/ip-locks
Content-Type: application/json

{
  "ip": "192.168.1.100",
  "hours": 24
}
```

### 8.3 解封 IP

```http
DELETE /api/admin/ip-locks/:id
```

### 8.4 获取 IP 永久封锁列表

```http
GET /api/admin/ip-bans
```

### 8.5 永久封锁 IP

```http
POST /api/admin/ip-bans
Content-Type: application/json

{
  "ip_pattern": "192.168.1.%",
  "reason": "恶意攻击"
}
```

### 8.6 获取 IP 日志

```http
GET /api/admin/ip-logs?user_id=123&ip_type=login
```

---

## 物品管理

### 9.1 获取物品列表

```http
GET /api/admin/items
```

### 9.2 添加物品

```http
POST /api/admin/items
Content-Type: application/json

{
  "name": "屠龙刀",
  "type": "weapon",
  "attack": 100,
  "defense": 0
}
```

### 9.3 修改物品

```http
PUT /api/admin/items/:id
Content-Type: application/json

{
  "attack": 120
}
```

### 9.4 删除物品

```http
DELETE /api/admin/items/:id
```

---

## 商店管理

### 10.1 获取商店物品列表

```http
GET /api/admin/shop-items
```

### 10.2 添加商店物品

```http
POST /api/admin/shop-items
Content-Type: application/json

{
  "name": "金创药",
  "type": "medicine",
  "price": 100,
  "stock_quantity": 999
}
```

### 10.3 更新商店物品

```http
PUT /api/admin/shop-items/:id
Content-Type: application/json

{
  "price": 80,
  "is_enabled": false
}
```

### 10.4 删除商店物品

```http
DELETE /api/admin/shop-items/:id
```

### 10.5 补货

```http
POST /api/admin/shop-items/:id/restock
Content-Type: application/json

{
  "quantity": 100
}
```

---

## 随机事件管理

### 11.1 获取随机事件列表

```http
GET /api/admin/random-events?page=1&limit=20&isEnabled=true
```

### 11.2 获取事件详情

```http
GET /api/admin/random-events/:id
```

### 11.3 创建随机事件

```http
POST /api/admin/random-events
Content-Type: application/json

{
  "event_name": "天降横财",
  "event_type": "fortune",
  "message_template": "天上掉下{amount}两银子",
  "effect_type": "silver",
  "effect_value_min": 100,
  "effect_value_max": 500,
  "probability": 50,
  "is_enabled": true
}
```

### 11.4 更新随机事件

```http
PUT /api/admin/random-events/:id
Content-Type: application/json

{
  "probability": 30
}
```

### 11.5 删除随机事件

```http
DELETE /api/admin/random-events/:id
```

### 11.6 切换事件状态

```http
POST /api/admin/random-events/:id/toggle
```

### 11.7 手动触发事件

```http
POST /api/admin/random-events/trigger
Content-Type: application/json

{
  "event_id": 123,
  "targetType": "all"
}
```

---

## 经济调控

### 12.1 获取经济统计

```http
GET /api/admin/economy/stats
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "money": {
      "totalSilver": 50000000,
      "circulation": 30000000,
      "avgPerUser": 9470
    },
    "income": {
      "daily": 125000,
      "sources": {...}
    },
    "spending": {
      "daily": 98000,
      "categories": {...}
    }
  }
}
```

### 12.2 发放银两

```http
POST /api/admin/economy/grant
Content-Type: application/json

{
  "targetType": "user",
  "targetId": 123,
  "amount": 1000,
  "reason": "活动奖励",
  "notify": true
}
```

### 12.3 扣除银两

```http
POST /api/admin/economy/revoke
Content-Type: application/json

{
  "targetType": "user",
  "targetId": 123,
  "amount": 5000,
  "reason": "非法刷银",
  "notify": true
}
```

### 12.4 获取经济配置

```http
GET /api/admin/economy/config
```

### 12.5 更新经济配置

```http
PUT /api/admin/economy/config
Content-Type: application/json

{
  "shopTaxRate": 0.05,
  "marketTaxRate": 0.03
}
```

---

## 日志审计

### 13.1 获取操作日志

```http
GET /api/admin/audit/actions?operator=admin&page=1&limit=50
```

**查询参数**:
- `operator`: 操作者用户名
- `actionType`: 操作类型
- `startDate`: 开始日期
- `endDate`: 结束日期
- `status`: 状态 (success/failed)

### 13.2 获取登录日志

```http
GET /api/admin/audit/logins?userId=123&status=success
```

### 13.3 获取错误日志

```http
GET /api/admin/audit/errors?level=error
```

### 13.4 获取审计统计

```http
GET /api/admin/audit/stats
```

### 13.5 导出日志

```http
POST /api/admin/audit/export
Content-Type: application/json

{
  "type": "actions",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "format": "csv"
}
```

---

## 错误码说明

### 认证相关
| 错误码 | 说明 |
|--------|------|
| AUTH_REQUIRED | 未登录 |
| AUTH_INVALID | 令牌无效 |
| AUTH_EXPIRED | 令牌已过期 |

### 权限相关
| 错误码 | 说明 |
|--------|------|
| ADMIN_REQUIRED | 需要管理员权限 |
| LEADER_REQUIRED | 需要掌门权限 |
| GRADE_INSUFFICIENT | 等级不足 |
| PERMISSION_DENIED | 权限不足 |

### 操作相关
| 错误码 | 说明 |
|--------|------|
| USER_NOT_FOUND | 用户不存在 |
| USER_NOT_BANNED | 用户未被封禁 |
| USER_NOT_ONLINE | 用户不在线 |
| PASSWORD_TOO_SHORT | 密码长度不足 |

---

## 权限级别说明

| 等级 | 称号 | 权限范围 |
|------|------|----------|
| 6-7 | 护法 | 基础用户管理、聊天室管理 |
| 8-9 | 长老 | 物品管理、活动管理、IP 管理 |
| 10 | 掌门 | 全部权限 |

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 2.0 | 2026-04-20 | 重构版，新增权限体系和审计日志 |
| 1.0 | - | 初始版本 |

---

**文档维护**: 开发团队  
**最后更新**: 2026-04-20
