# 武功修炼系统优化说明

## 优化概述

本次优化全面提升了"江湖武功"页面的玩法体验，增加了修炼间隔、修炼耗时、修为进度等核心玩法机制。

---

## 主要改动

### 1. ⏱️ 冷却时间系统

**优化前**: 可以无限连续修炼，缺乏真实感

**优化后**:
- 每次修炼后有 **60 秒** 冷却时间
- 冷却期间无法修炼
- 实时倒计时显示剩余时间

**代码实现**:
```javascript
// 冷却检查
if (cooldownMs < PRACTICE_CONFIG.baseCooldown) {
  const remainingTime = Math.ceil(PRACTICE_CONFIG.baseCooldown - cooldownMs);
  return res.status(400).json({
    message: `修炼未成，需调息${remainingTime}秒后方可继续`
  });
}
```

---

### 2. 🕐 修炼耗时系统

**优化前**: 修炼瞬间完成，缺乏沉浸感

**优化后**:
- 内功修炼：约 **15 秒**
- 外功修炼：约 **10 秒**
- 轻功修炼：约 **7 秒**
- 修为等级越高，耗时越短（最高减少 50%）

**代码实现**:
```javascript
function calculateTimeCost(practiceType, cultivationLevel) {
  let baseTime = PRACTICE_CONFIG.baseTimeCost;
  
  // 类型差异
  if (practiceType === 1) baseTime += 5; // 内功 +5 秒
  else if (practiceType === 3) baseTime -= 3; // 轻功 -3 秒
  
  // 修为等级减少耗时
  const reduction = Math.min(0.5, (cultivationLevel - 1) * 0.03);
  baseTime = Math.floor(baseTime * (1 - reduction));
  
  return Math.max(baseTime, 3); // 最低 3 秒
}
```

---

### 3. 📊 修为进度系统

**优化前**: 修炼无累积效果，缺乏成长感

**优化后**:
- 新增修为等级（1-∞重天）
- 每次修炼增加修为进度
- 突破境界获得额外属性加成
- 经验需求随等级递增

**等级经验公式**:
```
升级所需经验 = 1000 × (1.5 ^ (等级 -1))
```

| 等级 | 所需经验 | 累计经验 |
|------|---------|---------|
| 1→2 | 1,000 | 1,000 |
| 2→3 | 1,500 | 2,500 |
| 3→4 | 2,250 | 4,750 |
| 4→5 | 3,375 | 8,125 |
| 5→6 | 5,063 | 13,188 |

**代码实现**:
```javascript
// 获取修为详情
GET /api/skills/cultivation/detail

Response:
{
  "cultivations": [
    {
      "practiceType": 1,
      "typeName": "内功",
      "level": 5,
      "progress": 2500,
      "requiredProgress": 5063,
      "progressPercent": 49,
      "totalPractices": 120
    }
  ]
}
```

---

### 4. 📈 经验获取优化

**优化前**: 固定 10-60 点经验，缺乏变化

**优化后**:
```
最终经验 = 基础经验 × 类型系数 × 等级加成 × 修为加成
```

**影响因素**:
- **类型系数**: 外功 1.2x，内功/轻功 1.0x
- **等级加成**: 1 + (用户等级 -1) × 0.05
- **修为加成**: 1 + (修为等级 -1) × 0.1
- **单次上限**: 500 经验

**示例计算**:
```
用户等级 5，修为等级 3，修炼外功：
基础经验：30
类型系数：1.2
等级加成：1 + (5-1)×0.05 = 1.2
修为加成：1 + (3-1)×0.1 = 1.2
最终经验：30 × 1.2 × 1.2 × 1.2 = 51.84 ≈ 52 点
```

---

### 5. 📅 每日修炼限制

**新增功能**:
- 每日最多修炼 **50 次**
- 跨日自动重置计数
- 剩余次数实时显示

**代码实现**:
```javascript
// 检查每日次数
if (practiceCountToday >= PRACTICE_CONFIG.maxDailyPractices) {
  return res.status(400).json({
    message: `今日修炼次数已达上限（${max}次），请明日再来`
  });
}
```

---

### 6. 💪 属性加成系统

**优化前**: 固定 +1 属性

**优化后**:
```
属性加成 = floor(修为等级 × 系数) + 1
```

| 修炼类型 | 加成属性 | 系数 | 示例（修为 10 级） |
|---------|---------|------|-----------------|
| 内功 | 内力上限 | 0.5 | floor(10×0.5)+1 = **6** |
| 外功 | 武功值 | 0.3 | floor(10×0.3)+1 = **4** |
| 轻功 | 轻功值 | 0.3 | floor(10×0.3)+1 = **4** |

---

### 7. 📝 修炼日志系统

**新增数据表**:
```sql
CREATE TABLE practice_logs (
  id BIGINT AUTO_INCREMENT,
  user_id INT,
  practice_type TINYINT,  -- 1=内功，2=外功，3=轻功
  exp_gain INT,
  neili_cost INT,
  tili_cost INT,
  time_cost INT,  -- 实际耗时
  cultivation_progress INT,  -- 突破后的进度
  created_at DATETIME
);
```

**用途**:
- 追踪修炼历史
- 分析修炼效率
- 数据统计和报表

---

## 数据库变更

### 新增字段（users 表）
```sql
ALTER TABLE users ADD COLUMN (
  last_practice_at DATETIME,        -- 最后修炼时间
  practice_count_today INT DEFAULT 0, -- 今日修炼次数
  practice_exp_total BIGINT DEFAULT 0 -- 累计修炼经验
);
```

### 新增数据表
1. **practice_logs** - 修炼日志
2. **cultivation_progress** - 修为进度

---

## API 变更

### 新增接口

#### 1. 获取修炼状态
```http
GET /api/skills/practice/status
Authorization: Bearer <token>

Response:
{
  "data": {
    "cooldownRemaining": 45,  // 剩余冷却（秒）
    "practiceCountToday": 12,  // 今日已修炼次数
    "remainingDailyPractices": 38,  // 剩余次数
    "totalPracticeExp": 15680  // 累计经验
  }
}
```

#### 2. 获取修为详情
```http
GET /api/skills/cultivation/detail
Authorization: Bearer <token>

Response:
{
  "data": {
    "cultivations": [
      {
        "practiceType": 1,
        "typeName": "内功",
        "level": 5,
        "progress": 2500,
        "requiredProgress": 5063,
        "progressPercent": 49,
        "totalPractices": 120
      }
    ]
  }
}
```

### 修改接口

#### 修炼接口响应增强
```http
POST /api/skills/:id/practice

Response:
{
  "success": true,
  "message": "修炼内功成功！获得 52 点经验，内力上限 +6（修炼耗时 15 秒）\n🎉 恭喜！内功修为突破至第 6 重天！",
  "data": {
    "expGain": 52,
    "neiliCost": 15,
    "tiliCost": 5,
    "timeCost": 15,
    "cultivationLevel": 6,
    "levelUp": true,
    "attributeBoost": {
      "name": "内力上限",
      "value": 6
    },
    "remainingDailyPractices": 37
  }
}
```

---

## 前端优化

### 1. 修炼状态卡片
- 🕐 冷却时间倒计时
- 📈 今日修炼次数
- 💫 剩余修炼次数
- ✨ 累计经验值

### 2. 修为进度展示
- 进度条可视化
- 百分比显示
- 等级标识
- 统计数据

### 3. 练功选项增强
- 显示修炼耗时
- 显示体力和内力消耗
- 冷却期间按钮禁用
- 实时状态更新

### 4. 提示优化
- 冷却时间实时倒计时
- 剩余次数动态更新
- 修为突破动画效果
- 详细的状态反馈

---

## 游戏体验提升

### 优化前的问题
1. ❌ 可以无限制刷经验
2. ❌ 修炼瞬间完成，缺乏真实感
3. ❌ 没有累积成长感
4. ❌ 缺乏长期目标
5. ❌ 缺乏策略选择

### 优化后的改进
1. ✅ 60 秒冷却防止刷经验
2. ✅ 10-15 秒修炼耗时增加沉浸感
3. ✅ 修为系统提供累积成长
4. ✅ 等级突破提供长期目标
5. ✅ 多种修炼方式各有特色

---

## 数值平衡

### 修炼成本收益比

| 修炼类型 | 消耗内力 | 消耗体力 | 耗时 | 经验系数 | 适合阶段 |
|---------|---------|---------|------|---------|---------|
| 内功 | 15 | 5 | 15 秒 | 1.0x | 内力不足 |
| 外功 | 10 | 5 | 10 秒 | 1.2x | 性价比 |
| 轻功 | 15 | 5 | 7 秒 | 1.0x | 闪避流 |

### 每日收益上限
```
每日最多 50 次 × 平均 30 经验 = 1500 经验/天
每月理论最大：1500 × 30 = 45000 经验
```

---

## 升级建议

### 执行数据库迁移
```bash
# 1. 备份数据库
mysqldump -u root -p jhchat > backup_$(date +%Y%m%d).sql

# 2. 执行迁移脚本
mysql -u root -p jhchat < backend/src/scripts/migrate-skill-optimization.sql

# 3. 重启服务
docker-compose restart
# 或
pm2 restart all
```

### 验证测试
1. 测试冷却时间是否正确
2. 测试每日次数限制
3. 测试修为进度是否正确累积
4. 测试突破时属性加成
5. 测试日志记录

---

## 配置参数

所有可调参数集中在 `PRACTICE_CONFIG`：
```javascript
const PRACTICE_CONFIG = {
  baseCooldown: 60,        // 基础冷却（秒）
  maxDailyPractices: 50,   // 每日最大次数
  baseTimeCost: 10,        // 基础耗时（秒）
  cultivationBaseExp: 1000, // 修为基数经验
  cultivationExpGrowth: 1.5 // 修为经验成长
};
```

---

## 后续优化方向

### Phase 2（可选）
- [ ] 修炼暴击机制（随机双倍经验）
- [ ] 组队修炼加成
- [ ] 修炼丹药（临时提升经验获取）
- [ ] 修炼心得系统（记录修炼感悟）
- [ ] 闭关修炼（长时间离线修炼）

### Phase 3（可选）
- [ ] 武功秘籍收集
- [ ] 武功融合系统
- [ ] 自创武功
- [ ] 武功排行榜

---

**优化时间**: 2026-04-20  
**版本**: 2.0  
**影响范围**: 前端 + 后端
