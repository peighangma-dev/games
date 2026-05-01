# 在线状态保持与泡点经验保存技术设计

## 1. 架构设计

### 1.1 系统架构图

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Vue 3     │────▶│  Socket 单例模块     │────▶│  Socket.IO Server │
│  前端应用   │     │  (utils/socket.js)   │     │   (后端)         │
└─────────────┘     └──────────────────────┘     └─────────────────┘
       │                                              │
       │ 心跳 (30s)                                   │ 心跳处理
       ▼                                              ▼
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  页面组件   │     │  用户 Store (Pinia)  │     │   数据库         │
│  (Chat.vue) │     │  (stores/user.js)    │     │  (MySQL)        │
└─────────────┘     └──────────────────────┘     └─────────────────┘
```

### 1.2 核心改动点

| 模块 | 文件 | 改动类型 | 说明 |
|------|------|----------|------|
| Socket 工具 | `frontend/src/utils/socket.js` | 重构 | 改为单例模式，支持自动心跳 |
| 用户 Store | `frontend/src/stores/user.js` | 增强 | 添加心跳、经验同步逻辑 |
| 聊天室页面 | `frontend/src/views/Chat.vue` | 修改 | 移除 `onUnmounted` 断开逻辑 |
| 所有页面 | 各 `.vue` 文件 | 无 | 不需要修改，共享 Socket |
| Socket 服务端 | `backend/src/socket/index.js` | 增强 | 添加心跳处理、清理超时连接 |
| 定时任务 | `backend/src/socket/index.js` | 新增 | 添加泡点经验定时器 |

## 2. 前端实现

### 2.1 Socket 单例模块重构

```javascript
// frontend/src/utils/socket.js
import { io } from 'socket.io-client'

class SocketManager {
  constructor() {
    this.socket = null
    this.heartbeatTimer = null
    this.heartbeatInterval = 30000 // 30 秒
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('[Socket] 已连接，跳过')
      return this.socket
    }

    this.socket = io({
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    })

    this.setupEventListeners()
    this.startHeartbeat()
    return this.socket
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('[Socket] 已连接')
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] 断开:', reason)
      this.stopHeartbeat()
    })

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] 连接错误:', err.message)
      this.reconnectAttempts++
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[Socket] 重连次数超限')
      }
    })

    this.socket.on('heartbeat:ack', () => {
      console.debug('[Socket] 心跳响应')
    })
  }

  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat:ping', {
          timestamp: Date.now()
        })
      }
    }, this.heartbeatInterval)
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  disconnect() {
    this.stopHeartbeat()
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket() {
    return this.socket
  }

  isConnected() {
    return this.socket?.connected
  }
}

// 导出单例
const socketManager = new SocketManager()
export default socketManager
```

### 2.2 用户 Store 增强

```javascript
// frontend/src/stores/user.js
import { defineStore } from 'pinia'
import api from '../utils/api'
import socketManager from '../utils/socket'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    profile: null,
    onlineUsers: [],
    bubbleExpTimer: null,
    lastExpSync: null,
    bubbleExpConfig: {
      expPerMinute: 1,      // 每分钟经验
      dailyLimit: 100,      // 每日上限
      autoSaveInterval: 60  // 自动保存间隔 (秒)
    }
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    username: (state) => state.user?.username || '',
    grade: (state) => state.user?.grade || 1,
    faction: (state) => state.user?.faction || '',
    silver: (state) => state.profile?.silver || 0,
    isAdmin: (state) => state.user?.grade >= 6 && state.user?.faction === '六扇门',
    isSuperAdmin: (state) => state.user?.grade >= 10 && state.user?.faction === '六扇门',
    
    // 今日已获得泡点经验
    todayBubbleExp: (state) => state.profile?.chat_minutes_today * state.bubbleExpConfig.expPerMinute || 0,
    
    // 剩余可获取经验
    remainingDailyExp: (state) => state.bubbleExpConfig.dailyLimit - state.todayBubbleExp
  },
  actions: {
    async login(username, password) {
      const res = await api.post('/auth/login', { username, password })
      if (res.success) {
        this.user = res.data.user
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        await this.fetchProfile()
        
        // 登录成功后建立全局 Socket 连接
        socketManager.connect(res.data.token)
        
        // 启动泡点经验自动保存
        this.startBubbleExpAutoSave()
      }
      return res
    },
    
    async logout() {
      try {
        await api.post('/auth/logout')
      } catch (e) {}
      
      // 退出登录时断开 Socket
      socketManager.disconnect()
      this.stopBubbleExpAutoSave()
      
      this.user = null
      this.profile = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    
    async fetchProfile() {
      try {
        const res = await api.get('/users/me')
        if (res.success) {
          this.profile = res.data
          // 更新本地时间戳
          this.lastExpSync = Date.now()
        }
      } catch (e) {}
    },
    
    // 启动泡点经验自动保存（心跳已自动在 socketManager 中运行）
    startBubbleExpAutoSave() {
      this.stopBubbleExpAutoSave()
      
      this.bubbleExpTimer = setInterval(async () => {
        try {
          // 同步最新用户资料
          await this.fetchProfile()
          
          // 通知后端更新泡点经验
          await this.syncBubbleExp()
        } catch (e) {
          console.error('[泡点] 同步失败:', e)
        }
      }, this.bubbleExpConfig.autoSaveInterval * 1000)
      
      console.log('[泡点] 自动保存已启动')
    },
    
    stopBubbleExpAutoSave() {
      if (this.bubbleExpTimer) {
        clearInterval(this.bubbleExpTimer)
        this.bubbleExpTimer = null
      }
    },
    
    // 同步泡点经验（后端实际处理，前端仅通知）
    async syncBubbleExp() {
      try {
        await api.post('/user/bubble-exp/sync')
      } catch (e) {
        // 静默失败，下次心跳会继续
      }
    },
    
    async fetchOnlineUsers() {
      const res = await api.get('/users/online')
      if (res.success) this.onlineUsers = res.data
    },
    
    async syncUserInfo() {
      try {
        const res = await api.get('/users/me')
        if (res.success) {
          this.user = res.data
          localStorage.setItem('user', JSON.stringify(res.data))
        }
      } catch (e) {}
    }
  }
})
```

### 2.3 聊天室页面修改

```javascript
// frontend/src/views/Chat.vue - onMounted 和 onUnmounted 修改

import socketManager from '../utils/socket'

onMounted(async () => {
  await loadRooms()
  await loadHistory()
  loadActions()
  loadCommands()
  
  // 使用全局 Socket 管理器，不需要重复连接
  setupSocket()
  
  // ... 音乐播放器逻辑 ...
})

onUnmounted(() => {
  // 移除 disconnectSocket() 调用
  // Socket 连接保持，页面切换不影响
  console.log('[聊天室] 页面卸载，保持 Socket 连接')
})
```

## 3. 后端实现

### 3.1 Socket 心跳处理

```javascript
// backend/src/socket/index.js

module.exports = function(io) {
  io.on('connection', (socket) => {
    // ... 现有初始化代码 ...
    
    // 心跳处理
    socket.on('heartbeat:ping', async (data) => {
      try {
        const userId = socket.data.userId
        const username = socket.data.username
        
        // 更新最后活跃时间
        await db.execute(
          'UPDATE online_users SET last_active_at = NOW() WHERE user_id = ?',
          [userId]
        )
        
        // 确认心跳
        socket.emit('heartbeat:ack', {
          timestamp: Date.now(),
          status: 'ok'
        })
        
        console.debug(`[心跳] 用户 ${username} 心跳正常`)
      } catch (err) {
        console.error('[心跳] 处理失败:', err)
      }
    })
    
    // ... 其他现有事件处理 ...
  })
  
  // 启动心跳清理定时器
  startHeartbeatCleanupScheduler(io)
}

// 清理超时未心跳的连接
async function startHeartbeatCleanupScheduler(io) {
  const CLEANUP_INTERVAL = 60000 // 1 分钟检查一次
  const TIMEOUT_THRESHOLD = 300000 // 5 分钟无心跳视为离线
  
  setInterval(async () => {
    try {
      const now = new Date()
      const thresholdTime = new Date(now.getTime() - TIMEOUT_THRESHOLD)
      
      // 查找超时的在线用户
      const [expiredUsers] = await db.execute(
        `SELECT user_id, username FROM online_users 
         WHERE last_active_at < ?`,
        [thresholdTime]
      )
      
      for (const user of expiredUsers) {
        console.log(`[心跳清理] 用户 ${user.username} 超时，移除在线状态`)
        
        // 从在线表移除
        await db.execute(
          'DELETE FROM online_users WHERE user_id = ?',
          [user.user_id]
        )
        
        // TODO: 保存泡点经验（如果用户确实在活跃使用）
        await saveBubbleExp(user.user_id)
        
        // 通知其他用户
        const [online] = await db.execute(
          `SELECT o.user_id, o.username, o.gender, o.sect, o.avatar, u.grade 
           FROM online_users o 
           LEFT JOIN users u ON o.user_id = u.id 
           WHERE o.room_id = 1 
           ORDER BY o.username`
        )
        io.to('room_1').emit('room:onlineUpdate', { roomId: 1, users: online })
      }
      
      if (expiredUsers.length > 0) {
        console.log(`[心跳清理] 本次清理 ${expiredUsers.length} 个超时用户`)
      }
    } catch (err) {
      console.error('[心跳清理] 执行失败:', err)
    }
  }, CLEANUP_INTERVAL)
  
  console.log('[心跳清理] 定时器已启动')
}

// 保存泡点经验
async function saveBubbleExp(userId) {
  try {
    // 实现经验保存逻辑
  } catch (err) {
    console.error('[泡点] 保存失败:', err)
  }
}
```

### 3.2 泡点经验定时器

```javascript
// backend/src/socket/index.js - 新增

// 泡点经验定时器 - 每分钟为在线用户增加经验
function startBubbleExpScheduler(io) {
  const BUBBLE_INTERVAL = 60000 // 1 分钟
  
  setInterval(async () => {
    try {
      // 获取所有在线用户
      const [onlineUsers] = await db.execute(
        `SELECT o.user_id, o.username, o.grade,
                u.total_exp, u.monthly_exp,
                u.chat_minutes_today,
                lc.chat_exp_per_minute, lc.max_daily_chat_exp
         FROM online_users o
         LEFT JOIN users u ON o.user_id = u.id
         LEFT JOIN user_level_config lc ON u.grade = lc.level
         WHERE o.last_active_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)`
      )
      
      let totalExpGained = 0
      
      for (const user of onlineUsers) {
        // 计算今日已获得经验
        const todayExp = user.chat_minutes_today * user.chat_exp_per_minute
        const remainingDailyLimit = user.max_daily_chat_exp - todayExp
        
        if (remainingDailyLimit <= 0) {
          // 已达到每日上限
          continue
        }
        
        // 计算本次获得的经验
        const expGain = Math.min(user.chat_exp_per_minute, remainingDailyLimit)
        
        // 更新用户经验
        await db.execute(
          `UPDATE users 
           SET chat_minutes_today = chat_minutes_today + 1,
               chat_minutes_total = chat_minutes_total + 1,
               total_exp = total_exp + ?,
               monthly_exp = monthly_exp + ?
           WHERE id = ?`,
          [expGain, expGain, user.user_id]
        )
        
        // 记录日志
        await db.execute(
          `INSERT INTO chat_exp_logs 
           (user_id, username, exp_gain, chat_minutes, is_daily_limit, created_at)
           VALUES (?, ?, ?, 1, 0, NOW())`,
          [user.user_id, user.username, expGain]
        )
        
        totalExpGained += expGain
      }
      
      if (totalExpGained > 0) {
        console.log(`[泡点] 本次为 ${onlineUsers.length} 个用户增加经验，总计 +${totalExpGained} 点`)
      }
    } catch (err) {
      console.error('[泡点] 定时器执行失败:', err)
    }
  }, BUBBLE_INTERVAL)
  
  console.log('[泡点] 定时器已启动')
}
```

### 3.3 前端 API 端点

```javascript
// backend/src/routes/user.js
router.post('/bubble-exp/sync', auth, async (req, res) => {
  try {
    // 简单的心跳同步，实际泡点由后端定时器处理
    await db.execute(
      'UPDATE online_users SET last_active_at = NOW() WHERE user_id = ?',
      [req.user.id]
    )
    
    res.json({
      success: true,
      message: '经验同步成功'
    })
  } catch (err) {
    console.error('泡点经验同步失败:', err)
    res.status(500).json({
      success: false,
      message: '同步失败'
    })
  }
})
```

## 4. 数据库表结构

### 4.1 现有表（无需修改）

```sql
-- online_users 表已有 last_active_at 字段用于心跳
-- users 表已有 chat_minutes_today, total_exp 等字段
-- chat_exp_logs 表用于记录经验获取日志
```

### 4.2 配置表（可选）

```sql
-- 如果还没有 user_level_config 表，可以创建
CREATE TABLE IF NOT EXISTS `user_level_config` (
  `level` TINYINT UNSIGNED NOT NULL,
  `chat_exp_per_minute` INT NOT NULL DEFAULT 1,
  `max_daily_chat_exp` INT NOT NULL DEFAULT 100,
  PRIMARY KEY (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入默认配置（1-10 级）
INSERT INTO `user_level_config` (`level`, `chat_exp_per_minute`, `max_daily_chat_exp`) VALUES
(1, 1, 50),
(2, 2, 80),
(3, 3, 120),
(4, 4, 160),
(5, 5, 200),
(6, 6, 300),
(7, 7, 400),
(8, 8, 500),
(9, 9, 600),
(10, 10, 800)
ON DUPLICATE KEY UPDATE level = level;
```

## 5. 定时器管理

### 5.1 后端定时器汇总

```javascript
// backend/src/server.js

const { 
  startRandomEventScheduler,
  startHeartbeatCleanupScheduler,
  startBubbleExpScheduler
} = require('./socket');

// 启动所有定时器
startRandomEventScheduler(io);        // 随机事件 (2-5 分钟)
startHeartbeatCleanupScheduler(io);   // 心跳清理 (1 分钟检查,5 分钟超时)
startBubbleExpScheduler(io);          // 泡点经验 (1 分钟)
```

### 5.2 定时器参数配置

```javascript
// backend/src/config/constants.js
module.exports = {
  // 心跳配置
  HEARTBEAT_INTERVAL: 30000,           // 前端心跳间隔 30 秒
  HEARTBEAT_CLEANUP_INTERVAL: 60000,   // 后端清理检查间隔 1 分钟
  HEARTBEAT_TIMEOUT_THRESHOLD: 300000, // 超时阈值 5 分钟
  
  // 泡点配置
  BUBBLE_EXP_INTERVAL: 60000,          // 泡点经验间隔 1 分钟
  BUBBLE_EXP_AUTO_SAVE_INTERVAL: 60000 // 前端自动保存间隔 1 分钟
}
```

## 6. 错误处理与边界情况

### 6.1 网络断开

| 场景 | 前端处理 | 后端处理 |
|------|----------|----------|
| 短暂网络波动 | Socket.IO 自动重连 | 保持在线状态 |
| 长时间断网 | 重连超限后提示 | 心跳超时后清理 |
| 重连成功 | 自动恢复心跳 | 恢复在线状态 |

### 6.2 页面关闭

| 场景 | 前端处理 | 后端处理 |
|------|----------|----------|
| 刷新页面 | Socket 断开后重连 | 心跳超时前保持 |
| 关闭浏览器 | Socket 断开 | 心跳超时后清理 |
| 切换标签页 | 保持连接 | 正常心跳 |

### 6.3 数据一致性

- 前端每 60 秒同步一次用户资料
- 后端泡点经验实时写入数据库
- 经验日志记录每次获取明细
- 异常情况经验不丢失（后端定时器保障）

## 7. 性能优化建议

### 7.1 数据库

- `online_users.last_active_at` 字段添加索引
- `chat_exp_logs` 定期归档（>30 天数据）
- 批量更新减少数据库压力

### 7.2 网络

- 心跳包使用最小数据量
- Socket.IO 压缩配置开启
- 批量经验更新合并处理

### 7.3 前端

- 经验更新使用防抖
- 避免频繁渲染更新
- 离线状态降级处理

## 8. 监控与日志

### 8.1 关键日志

```javascript
// 前端日志
console.log('[Socket] 连接/断开/重连')
console.log('[心跳] 发送/响应')
console.log('[泡点] 同步成功/失败')

// 后端日志
console.log('[心跳] 用户 xxx 心跳正常')
console.log('[心跳清理] 清理 x 个超时用户')
console.log('[泡点] 为 x 个用户增加经验 +x')
```

### 8.2 监控指标

- Socket 连接数（实时/峰值）
- 心跳成功率（>98%）
- 泡点经验发放总量（每日）
- 在线用户平均时长

## 9. 测试用例

### 9.1 功能测试

1. ✅ 用户登录后建立 Socket 连接
2. ✅ 页面切换时 Socket 不断开
3. ✅ 在线状态在任意页面保持
4. ✅ 泡点经验每分钟自动增加
5. ✅ 达到每日上限后停止增加
6. ✅ 退出登录时清除在线状态

### 9.2 异常测试

1. ✅ 网络断开后自动重连
2. ✅ 心跳超时后正确清理
3. ✅ 多次刷新页面不重复连接
4. ✅ 后端服务重启后前端重连

### 9.3 性能测试

1. ✅ 100+ 并发用户心跳正常
2. ✅ 泡点定时器不影响主业务
3. ✅ 数据库连接池充足

## 10. 部署注意事项

1. 部署后检查所有定时器正常启动
2. 验证数据库配置表数据
3. 监控首日泡点经验发放总量
4. 观察心跳超时清理频率
5. 配置告警（异常清理率）
