import { defineStore } from 'pinia'
import api from '../utils/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    profile: null,
    onlineUsers: []
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    username: (state) => state.user?.username || '',
    grade: (state) => state.user?.grade || 1,
    faction: (state) => state.user?.faction || '',
    silver: (state) => state.profile?.silver || 0,
    isAdmin: (state) => state.user?.grade >= 6 && state.user?.faction === '六扇门',
    isSuperAdmin: (state) => state.user?.grade >= 10 && state.user?.faction === '六扇门'
  },
  actions: {
    async login(username, password) {
      const res = await api.post('/auth/login', { username, password })
      if (res.success) {
        this.user = res.data.user
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
      }
      return res
    },
    async register(data) {
      return await api.post('/auth/register', data)
    },
    async logout() {
      try { await api.post('/auth/logout') } catch (e) {}
      this.user = null
      this.profile = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    async fetchProfile() {
      try {
        const res = await api.get('/users/me')
        if (res.success) this.profile = res.data
      } catch (e) {}
    },
    async fetchOnlineUsers() {
      const res = await api.get('/users/online')
      if (res.success) this.onlineUsers = res.data
    }
  }
})
