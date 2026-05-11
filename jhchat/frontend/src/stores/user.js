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
      expPerMinute: 1,
      dailyLimit: 100,
      autoSaveInterval: 60
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
    todayBubbleExp: (state) => state.profile?.chat_minutes_today * state.bubbleExpConfig.expPerMinute || 0,
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
        
        socketManager.connect(res.data.token)
        this.startBubbleExpAutoSave()
      }
      return res
    },
    
    async logout() {
      try {
        await api.post('/auth/logout')
      } catch (e) {}
      
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
          this.lastExpSync = Date.now()
        }
      } catch (e) {}
    },
    
    startBubbleExpAutoSave() {
      this.stopBubbleExpAutoSave()
      
      this.bubbleExpTimer = setInterval(async () => {
        try {
          await this.fetchProfile()
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
    
    async syncBubbleExp() {
      try {
        await api.post('/user/bubble-exp/sync')
      } catch (e) {}
    },
    
    async fetchOnlineUsers() {
      const res = await api.get('/users/online')
      if (res.success) this.onlineUsers = res.data
    },
    
    async restoreSession() {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      
      if (!token || !user) return false
      
      try {
        // 验证 token 是否有效
        const res = await api.get('/users/me')
        if (res.success) {
          this.user = res.data
          this.profile = res.data
          localStorage.setItem('user', JSON.stringify(res.data))
          
          // 重新连接 Socket
          socketManager.connect(token)
          this.startBubbleExpAutoSave()
          
          return true
        }
      } catch (e) {
        console.error('[恢复会话] 验证失败:', e)
        // Token 失效，清除本地存储
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      
      return false
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
