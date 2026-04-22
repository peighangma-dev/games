import axios from 'axios'

// 检测是否为移动端环境
const isMobile = () => {
  return typeof window !== 'undefined' && 
         (window.Capacitor || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
}

// API 基础 URL 配置
const getBaseURL = () => {
  // 移动端环境：使用实际服务器地址
  if (isMobile()) {
    // 可以通过 Capacitor Preferences 配置服务器地址
    const serverUrl = localStorage.getItem('server_url') || 'http://192.168.1.100:3001'
    return `${serverUrl}/api`
  }
  // Web 环境：使用代理
  return '/api'
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error.response?.data || error)
  }
)

export default api
