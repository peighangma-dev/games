# 武功页面 - 藏经阁 Tab 优化文档

## 优化概述

本次优化全面增强了"武功"页面的"藏经阁"功能，使其成为一个功能完善、信息丰富的武学学习中心。

**完成日期**：2026 年 4 月 20 日

**涉及文件**：
- `frontend/src/views/Skills.vue` (+862 行，新增藏经阁完整功能)
- `backend/src/controllers/skill.js` (藏经阁 API)
- `backend/src/scripts/seed-secret-skills.sql` (16 部武功秘籍数据)

---

## 一、新增功能

### 1. 藏经阁总览统计

**统计卡片**展示：
- 📖 武功总数 - 藏经阁收录的武功秘籍总数
- ✅ 已习得 - 当前已学习的武功数量
- 📕 未习得 - 还可学习的武功数量
- 💪 总内力加成 - 已学武功提供的内力总和
- 🏃 总轻功加成 - 已学武功提供的轻功总和

**价值**：让用户一目了然地了解武学收集进度和属性收益。

### 2. 相关任务进度关联

展示与武功学习相关的任务：
- 任务标题和描述
- 进度条可视化（当前进度/目标进度）
- 任务奖励说明

**技术实现**：
```javascript
async function loadRelatedQuests() {
  const res = await api.get('/quests')
  // 筛选 learn_skill 类型或包含"武功"、"武学"关键词的任务
  relatedQuests.value = res.data
    .filter(q => q.type === 'learn_skill' || q.title?.includes('武功'))
    .map(q => ({
      id: q.id,
      title: q.title,
      current: q.current_progress,
      target: q.target_progress,
      progressPercent: (current / target) * 100,
      reward: q.reward
    }))
}
```

### 3. 属性现状与预测

**对比展示**：
- 当前属性值（武功、内力、轻功）
- 预测属性值 = 当前值 + 潜在增益
- 潜在增益用绿色 +X 标记

**预测逻辑**：
```javascript
const potentialNeiliGain = computed(() => {
  return secretSkills.value
    .filter(s => !hasLearned(s.name) && canMeetLevelRequirement(s) && s.neili_bonus > 0)
    .reduce((sum, s) => sum + s.neili_bonus, 0)
})
```

**用例**：
- 用户可以看到学习所有可学习武功后的属性提升
- 激励用户收集更多武功秘籍

### 4. 高级筛选系统

**4 个维度筛选**：

| 维度 | 选项 | 说明 |
|------|------|------|
| 类型 | 全部/内功/轻功/全能 | 按属性加成类型筛选 |
| 稀有度 | 全部/普通/稀有/珍贵/史诗/传说 | 按武功稀有度筛选 |
| 状态 | 全部/可学习/已习得/等级不足 | 按学习状态筛选 |
| 排序 | 按等级/按价格/按加成 | 结果排序方式 |

**实现代码**：
```javascript
const filteredSecretSkills = computed(() => {
  let list = [...secretSkills.value]
  
  // 类型筛选
  if (secretFilter.value === 'neili') {
    list = list.filter(s => s.neili_bonus > 0 && !s.speed_bonus)
  }
  
  // 稀有度筛选
  if (secretRarity.value !== 'all') {
    list = list.filter(s => s.rarity === secretRarity.value)
  }
  
  // 状态筛选
  if (secretStatus.value === 'learnable') {
    list = list.filter(s => !hasLearned(s.name) && canMeetLevelRequirement(s) && canAfford(s))
  }
  
  // 排序
  if (secretSort.value === 'bonus') {
    list.sort((a, b) => (b.neili_bonus + b.speed_bonus) - (a.neili_bonus + a.speed_bonus))
  }
  
  return list
})
```

### 5. 武功详情弹窗

**详情内容**：
- 武功名称和等级要求
- 学习费用
- 稀有度（带颜色标识）
- 类型（内功/轻功/全能）
- 属性加成列表
- 详细描述
- 立即学习按钮

**UI 特点**：
- 点击"ℹ️ 详情"按钮打开
- 背景遮罩 + 毛玻璃效果
- 点击外部关闭
- 响应式设计

### 6. 卡片视觉增强

**稀有度指示条**：
- 左侧彩色条标识稀有度
- 颜色对应：普通（灰）/稀有（绿）/珍贵（蓝）/史诗（紫）/传说（金）

**状态样式**：
- 已习得：绿色背景，半透明
- 可学习：金色边框高亮
- 等级不足：整体半透明，锁定状态

**智能按钮状态**：
- 🔒 需要 Lv.X - 等级不足时显示
- 💰 银两不足 - 钱不够时显示
- 📖 学习 - 满足条件时显示

---

## 二、UI/UX 改进

### 视觉层次

```
藏经阁页面结构
├── 📚 藏经阁总览卡片 (5 项统计)
├── 📋 相关任务进度 (动态关联)
├── 📊 属性现状与预测 (对比展示)
├── 🔍 筛选工具栏 (4 个维度)
└── 📜 武功卡片列表
    ├── 稀有度指示条
    ├── 名称 + 等级 + 状态徽章
    ├── 描述文本
    ├── 属性加成展示
    ├── 稀有度&类型标签
    └── 操作按钮组（学习/详情）
```

### 交互优化

1. **hover 效果**：卡片鼠标悬停时右移 4px
2. **即时反馈**：按钮状态实时变化
3. **详情弹窗**：不打断浏览，可随时关闭
4. **筛选联动**：切换筛选条件立即刷新列表

### 响应式设计

```css
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr); /* 移动端 3 列 */
  }
  
  .skill-filter {
    flex-wrap: wrap; /* 筛选器换行 */
  }
}
```

---

## 三、数据结构

### 武功卡片数据模型

```javascript
{
  id: 1,
  name: "北冥神功",
  level: 8,           // 等级要求
  price: 50000,       // 学习费用（两）
  neili_bonus: 500,   // 内力加成
  speed_bonus: 0,     // 轻功加成
  rarity: "legendary", // 稀有度
  description: "逍遥派绝学，吸人内力为己用"
}
```

### 任务数据模型

```javascript
{
  id: 15,
  title: "武学宗师",
  description: "学习 10 门武功",
  current: 7,
  target: 10,
  progressPercent: 70,
  reward: "5000 两银子 + 修为丹"
}
```

---

## 四、计算属性

### 核心统计

| 属性 | 计算逻辑 |
|------|----------|
| `learnedCount` | 已习得武功数量 |
| `totalNeiliBonus` | 已学武功内力总和 |
| `totalSpeedBonus` | 已学武功轻功总和 |
| `potentialNeiliGain` | 未习得但可学习武功的内力和 |
| `potentialSpeedGain` | 未习得但可学习武功的轻功和 |
| `potentialWugongGain` | 潜在武功值增益（内力 + 轻功）|

---

## 五、样式系统

### 稀有度颜色规范

```css
.common { background: #6b7280; color: #9ca3af; }       /* 灰色 */
.uncommon { background: #22c55e; color: #4ade80; }     /* 绿色 */
.rare { background: #3b82f6; color: #60a5fa; }         /* 蓝色 */
.epic { background: #a855f7; color: #c084fc; }         /* 紫色 */
.legendary { 
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #fff;
}                                                       /* 金色渐变 */
```

### 属性颜色

- 💪 武功/内力：`#7eb8da`（蓝色系）
- 🏃 轻功：`#8fc9a0`（绿色系）
- 💰 银两：`#f0c040`（金色系）
- ✅ 已习得：`#8fc9a0`（绿色系）

---

## 六、性能优化

### 1. 计算属性缓存

Vue 的 `computed` 自动缓存结果，只在依赖变化时重新计算：

```javascript
const filteredSecretSkills = computed(() => {
  // 只在 secretSkills、筛选条件变化时重新计算
})
```

### 2. 条件渲染优化

- 使用 `v-if` 而非 `v-show` 减少 DOM 渲染
- 详情弹窗按需加载（打开时才渲染）

### 3. 列表渲染优化

```vue
<div v-for="s in filteredSecretSkills" :key="s.id">
  <!-- 使用稳定唯一 key -->
</div>
```

---

## 七、用户体验提升

### before

1. ❌ 只有简单的武功列表
2. ❌ 不知道学习后能提升多少属性
3. ❌ 无法快速找到可学习的武功
4. ❌ 没有任务进度的关联
5. ❌ 看不到武功详细描述

### after

1. ✅ 完整的统计概览
2. ✅ 属性预测对比
3. ✅ 多维度筛选和排序
4. ✅ 相关任务实时展示
5. ✅ 详细弹窗说明

---

## 八、后续优化建议

### 1. 武功收集册

- 添加收集进度百分比
- 按门派/类型分组展示
- 收集成就徽章

### 2. 武功推荐系统

根据用户当前状态智能推荐：
- 等级匹配
- 银两充足
- 属性互补（缺内力推荐内功）

### 3. 批量学习

- 一键学习所有可学习武功
- 批量比较选择

### 4. 武功预览

- 学习前预览效果
- 对比已学武功

### 5. 武林排行榜

- 武功收集数量排行
- 总属性加成排行

---

## 九、测试建议

### 功能测试

1. **筛选功能**：
   - 测试各筛选条件组合
   - 验证排序正确性
   
2. **状态判断**：
   - 等级不足时显示锁定
   - 银两不足时提示
   - 已习得显示绿色标记

3. **属性预测**：
   - 验证潜在增益计算准确性
   - 对比当前值和预测值

4. **任务关联**：
   - 确认相关任务正确过滤
   - 进度条更新及时

### UI 测试

1. **响应式布局**：
   - 桌面端（1920x1080）
   - 平板端（768x1024）
   - 手机端（375x667）

2. **弹窗交互**：
   - 点击外部关闭
   - 详情按钮响应
   - 关闭按钮有效

3. **视觉样式**：
   - 稀有度颜色正确
   - 渐变效果显示
   - 动画流畅

---

## 十、文件清单

### 修改的文件

| 文件 | 变更内容 | 行数变化 |
|------|----------|----------|
| `frontend/src/views/Skills.vue` | 藏经阁 Tab 完全重构 | +862 行 |

### 新增功能模块

```
Skills.vue
├── 藏经阁统计卡片 (50 行)
├── 任务进度卡片 (40 行)
├── 属性预测卡片 (60 行)
├── 筛选工具栏 (30 行)
├── 武功卡片增强 (120 行)
├── 详情弹窗 (80 行)
├── 计算属性 (100 行)
├── 辅助函数 (80 行)
└── 样式增强 (302 行)
```

---

## 十一、测试清单 ✅

### 已完成测试

- [x] 前端编译成功（Skills.js 19.41KB, gzip 6.77KB）
- [x] 藏经阁 API 响应正常（`/api/skills/secret`）
- [x] 数据库插入 16 部武功秘籍
- [x] 稀有度分类正确（common/uncommon/rare/epic/legendary）
- [x] 价格梯度合理（150~10000 两）
- [x] 等级分布均匀（1~12 级）
- [x] 内力/轻功加成明确

### 待测试功能

需要在浏览器中测试：

1. **藏经阁页面渲染**：
   - [ ] 统计卡片数值正确
   - [ ] 武功卡片列表展示
   - [ ] 稀有度颜色显示
   - [ ] 筛选和排序功能正常

2. **交互功能**：
   - [ ] 点击切换 Tab 响应
   - [ ] 详情弹窗显示/关闭
   - [ ] 学习武功按钮功能
   - [ ] 任务进度条动画

3. **数据流**：
   - [ ] `loadSecret()` 加载数据
   - [ ] `loadLearned()` 获取已学武功
   - [ ] `loadRelatedQuests()` 加载任务

---

## 十二、下一步计划

1. **完成端到端测试**：
   - 登录系统后访问武功页面
   - 验证所有统计数字准确
   - 测试学习武功流程
   - 确认属性加成生效

2. **UI/UX 优化**（可选）：
   - 添加加载骨架屏
   - 增强筛选动画效果
   - 优化移动端样式

3. **功能扩展**（可选）：
   - 武功组合效果提示
   - 武功修炼进度追踪
   - 武功兑换历史

---

## 总结

本次优化将藏经阁从一个简单的武功列表，升级为一个功能完善的武学学习中心，包含统计、预测、筛选、任务关联等全方位功能，极大提升了用户体验。

**关键提升**：
- 信息可视化：统计数据 + 属性预测
- 任务关联性：实时展示相关任务进度
- 筛选便捷性：4 维度筛选 + 3 排序方式
- 交互友好性：详情弹窗 + 智能按钮状态
- 视觉美观：稀有度颜色 + 状态样式
