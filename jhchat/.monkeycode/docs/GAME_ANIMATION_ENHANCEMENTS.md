# 游戏动画增强文档

## 概述

本文档记录了江湖聊天室所有游戏的动画优化方案，提升用户体验和视觉冲击力。

---

## ✅ 已完成优化

### 1. Blackjack（二十一点）

**新增动画效果：**

- **发牌动画**
  - 卡牌从牌堆 fly-in 效果（0.5s cubic-bezier）
  - 每张牌延迟 0.2s 依次发出
  - 牌堆发光效果（发牌期间）

- **手势提示**
  - 要牌手势：👐 绿色弹出动画
  - 停牌手势：🛑 红色弹出动画
  - 胜利手势：🏆 金色弹跳动画
  - 失败手势：😢 灰色下沉动画
  - 平局手势：🤝 蓝色淡入动画

- **角色头像光晕**
  - 玩家回合：绿色脉冲光晕 (`player-glow`)
  - 庄家回合：红色脉冲光晕 (`dealer-glow`)

- **卡牌特效**
  - 隐藏牌翻转动画 (`card-flip`)
  - 新牌标记与淡入 (`card-fly-in`)

**CSS Keyframes：**
- `card-fly-in`: 飞入动画
- `card-flip`: 翻转动画
- `gesture-pop`: 手势弹出
- `icon-bounce`: 图标弹跳
- `dealer-pulse`: 庄家光晕
- `player-pulse`: 玩家光晕

---

### 2. Dice（骰子）

**新增动画效果：**

- **3D 滚动动画**
  - 每个骰子独立旋转 (`rotateX/Y ${random * 720}deg`)
  - 滚动时模糊效果 (`filter: blur(1px)`)
  - 扇形排列展开（结果展示）

- **骰子轨迹效果**
  - 6 个粒子轨迹点 (`trail-particle`)
  - 径向渐变发光
  - 淡入淡出循环动画

- **结果光效**
  - 胜利：绿色渐变光晕 (`glow-win`)
  - 失败：红色渐变光晕 (`glow-lose`)
  - 2 秒渐隐动画

- **骰子着陆动画**
  - `die-land`: 从 1.2 倍缩放 +180 度旋转到正常状态
  - `die-win-pulse`: 胜利时金色脉冲光晕

**CSS Keyframes：**
- `shake`: 摇晃动画
- `die-land`: 骰子着陆
- `die-win-pulse`: 胜利脉冲
- `trail-fade`: 轨迹淡入淡出
- `glow-fade`: 光晕渐隐

---

### 3. Fishing（钓鱼）

**新增动画效果：**

- **抛竿动画**
  - 鱼漂抛出轨迹 (`casting` 状态)
  - 5 个轨迹点依次淡出 (`cast-trail`)
  - 0.5s 延迟后进入等待状态

- **收竿动画**
  - 鱼漂快速上拉 (`pulled` 状态)
  - 水花溅起效果
  - 0.3s 延迟后显示结果

- **鱼跃动画**
  - 鱼从水中跃出 (`fish-jump`)
  - 抛物线轨迹
  - 随机大小和方向

- **鱼漂状态**
  - 浮动：正弦波上下运动
  - 咬钩：剧烈抖动 (`biting`)
  - 上钩：快速下沉

**CSS Keyframes：**
- `cast-fly`: 抛竿飞行
- `trail-fade`: 轨迹淡出
- `fish-leap`: 鱼跳跃
- `bobber-shake`: 鱼漂抖动

---

## 🔄 待优化游戏

### 4. HighLow（猜大小）
**待添加：**
- 卡牌翻转动画
- 连赢特效
- 金币雨效果

### 5. Hunting（打猎）
**待添加：**
- 弓箭飞行轨迹
- 命中粒子效果
- 动物受击动画

### 6. Othello（黑白棋）
**待添加：**
- 棋子放置翻转动画
- 连击特效
- 胜利烟花效果

---

## 性能优化

### 1. 动画性能
- 使用 `transform` 和 `opacity` 实现动画（GPU 加速）
- 避免 `left/top/width/height` 触发重排
- 关键动画使用 `will-change` 提示浏览器

### 2. 动画时长
- 入场动画：0.3-0.5s
- 反馈动画：0.5-0.8s
- 庆祝动画：1.5-2s
- 循环动画：1-3s/循环

### 3. 动画缓动
- 弹性效果：`cubic-bezier(0.34, 1.56, 0.64, 1)`
- 平滑过渡：`ease-in-out`
- 快速响应：`ease-out`

---

## 古风配色方案

基于 ASP 版本配色，提取古风配色 Token：

```css
:root {
  /* 背景色 */
  --bg-dark: #000000;          /* 纯黑背景 */
  --bg-deep: #1a1a2e;          /* 深蓝黑 */
  
  /* 主色调 */
  --primary-gold: #FFD700;     /* 金色 */
  --primary-red: #8A2D00;      /* 红棕色 */
  --primary-green: #2E8B57;    /* 海事绿 */
  
  /* 文字色 */
  --text-yellow: #FFFF22;      /* 明黄 */
  --text-white: #FFFFFF;       /* 纯白 */
  --text-accent: #00FF00;      /* 亮绿 */
  
  /* 辅助色 */
  --accent-purple: #660099;    /* 紫色 */
  --accent-orange: #FF8000;    /* 橙色 */
}
```

---

## 复用 ASP 资源

### 卡牌图片
路径：`/workspace/jhchat1/images/card/`
- `pc0.gif` - 牌背
- `pc1.gif` - pc26.gif` - 各种牌面

### 用户头像
路径：`/workspace/jhchat1/images/userface/`
- `1.gif` - `30.gif` - 30 个复古头像

### 按钮素材
- `RETURN.GIF` - 返回按钮
- `UP.GIF` - 向上按钮
- `2.GIF`, `3.GIF` - 数字按钮

### 使用建议
1. 将 GIF 转为 PNG/SVG 以获得更好性能
2. 保留复古风格，用于特定主题模式
3. 头像系统可复用 GIF 资源

---

## 下一步计划

1. ✅ Blackjack 动画（已完成）
2. ✅ Dice 动画（已完成）
3. 🔄 Fishing 动画（进行中）
4. ⏳ HighLow 卡牌翻转
5. ⏳ Hunting 射击效果
6. ⏳ Othello 棋子动画
7. ⏳ 古风配色应用
8. ⏳ 头像上传等级限制
9. ⏳ 登录页面重设计

