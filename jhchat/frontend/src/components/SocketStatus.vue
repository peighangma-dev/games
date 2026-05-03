<template>
  <div class="socket-status" :class="statusClass">
    <div class="status-indicator">
      <span class="indicator-dot"></span>
    </div>
    <span class="status-text">{{ statusText }}</span>
    
    <!-- 重连中的提示 -->
    <div v-if="isReconnecting" class="reconnect-toast">
      <div class="toast-content">
        <span class="toast-icon">🔄</span>
        <span>正在重新连接... {{ reconnectAttempt }}/{{ maxReconnectAttempts }}</span>
      </div>
      <div class="toast-progress">
        <div class="progress-bar" :style="{ width: reconnectProgress + '%' }"></div>
      </div>
    </div>
    
    <!-- 连接失败的错误提示 -->
    <div v-if="isError" class="error-toast">
      <div class="toast-content">
        <span class="toast-icon">❌</span>
        <span>连接失败，请检查网络</span>
        <button class="btn-reconnect" @click="manualReconnect">重新连接</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const isConnected = ref(true)
const isReconnecting = ref(false)
const isError = ref(false)
const reconnectAttempt = ref(0)
const maxReconnectAttempts = ref(5)
const reconnectProgress = ref(0)

const statusClass = computed(() => {
  if (isError.value) return 'status-error'
  if (isReconnecting.value) return 'status-reconnecting'
  if (isConnected.value) return 'status-connected'
  return 'status-disconnected'
})

const statusText = computed(() => {
  if (isError.value) return '连接失败'
  if (isReconnecting.value) return '重连中'
  if (isConnected.value) return '已连接'
  return '未连接'
})

function handleConnected() {
  isConnected.value = true
  isReconnecting.value = false
  isError.value = false
  reconnectAttempt.value = 0
}

function handleDisconnected(event) {
  isConnected.value = false
  console.log('[SocketStatus] 断开连接:', event.detail?.reason)
}

function handleReconnecting(event) {
  isReconnecting.value = true
  reconnectAttempt.value = event.detail?.attemptNumber || 0
  // 模拟进度条
  reconnectProgress.value = Math.min((reconnectAttempt.value / maxReconnectAttempts.value) * 100, 90)
}

function handleReconnected() {
  handleConnected()
}

function handleReconnectFailed() {
  isReconnecting.value = false
  isError.value = true
}

function handleError(event) {
  console.error('[SocketStatus] 连接错误:', event.detail?.error)
}

function manualReconnect() {
  isError.value = false
  isReconnecting.value = true
  reconnectAttempt.value = 1
  reconnectProgress.value = 20
  
  // 尝试重新连接
  try {
    const socketManager = require('@/utils/socket').default
    const token = localStorage.getItem('token')
    if (token) {
      socketManager.connect(token)
    }
  } catch (err) {
    console.error('手动重连失败:', err)
  }
}

onMounted(() => {
  // 监听 Socket 事件
  window.addEventListener('socket:connected', handleConnected)
  window.addEventListener('socket:disconnected', handleDisconnected)
  window.addEventListener('socket:reconnecting', handleReconnecting)
  window.addEventListener('socket:reconnected', handleReconnected)
  window.addEventListener('socket:reconnect_failed', handleReconnectFailed)
  window.addEventListener('socket:error', handleError)
})

onUnmounted(() => {
  window.removeEventListener('socket:connected', handleConnected)
  window.removeEventListener('socket:disconnected', handleDisconnected)
  window.removeEventListener('socket:reconnecting', handleReconnecting)
  window.removeEventListener('socket:reconnected', handleReconnected)
  window.removeEventListener('socket:reconnect_failed', handleReconnectFailed)
  window.removeEventListener('socket:error', handleError)
})
</script>

<style scoped>
.socket-status {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 20px;
  font-size: 13px;
  color: #fff;
  z-index: 9999;
  transition: all 0.3s;
}

.status-indicator {
  position: relative;
  width: 12px;
  height: 12px;
}

.indicator-dot {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-connected .indicator-dot {
  background: #2ecc71;
  box-shadow: 0 0 10px #2ecc71;
}

.status-reconnecting .indicator-dot {
  background: #f39c12;
  animation: pulse 0.5s infinite;
}

.status-error .indicator-dot {
  background: #e74c3c;
  box-shadow: 0 0 10px #e74c3c;
}

.status-disconnected .indicator-dot {
  background: #95a5a6;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.reconnect-toast, .error-toast {
  position: absolute;
  bottom: 60px;
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 8px;
  padding: 12px 16px;
  min-width: 200px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-size: 13px;
}

.toast-icon {
  font-size: 16px;
}

.btn-reconnect {
  margin-left: auto;
  padding: 4px 12px;
  background: #3498db;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reconnect:hover {
  background: #2980b9;
}

.toast-progress {
  margin-top: 8px;
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #f39c12, #e67e22);
  transition: width 0.3s;
}

.error-toast {
  border-left: 3px solid #e74c3c;
}

.reconnect-toast {
  border-left: 3px solid #f39c12;
}
</style>
