import { io } from 'socket.io-client'

class SocketManager {
  constructor() {
    this.socket = null
    this.heartbeatTimer = null
    this.heartbeatInterval = 30000
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
      reconnectionAttempts: this.maxReconnectAttempts,
      randomizationFactor: 0.5,
      timeout: 20000
    })

    this.setupEventListeners()
    this.startHeartbeat()
    return this.socket
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('[Socket] 已连接')
      this.reconnectAttempts = 0
      // 触发重连成功事件
      window.dispatchEvent(new CustomEvent('socket:reconnected'))
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] 断开:', reason)
      this.stopHeartbeat()
      // 触发断开事件
      window.dispatchEvent(new CustomEvent('socket:disconnected', { detail: { reason } }))
    })

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] 连接错误:', err.message)
      this.reconnectAttempts++
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[Socket] 重连次数超限')
        window.dispatchEvent(new CustomEvent('socket:reconnect_failed'))
      }
      // 触发错误事件
      window.dispatchEvent(new CustomEvent('socket:error', { detail: { error: err } }))
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket] 重连成功，尝试次数:', attemptNumber)
      window.dispatchEvent(new CustomEvent('socket:reconnected'))
    })

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] 尝试重连:', attemptNumber)
      window.dispatchEvent(new CustomEvent('socket:reconnecting', { detail: { attemptNumber } }))
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

const socketManager = new SocketManager()
export default socketManager

// 导出便捷函数
export function connectSocket(token) {
  return socketManager.connect(token)
}

export function getSocket() {
  return socketManager.getSocket()
}
