<template>
  <div class="mobile-settings">
    <h3>⚙️ 应用设置</h3>

    <!-- 服务器配置入口 -->
    <div class="settings-section quick-access" @click="goToServerConfig">
      <div class="quick-access-item">
        <span class="icon">🌐</span>
        <div class="info">
          <span class="title">服务器地址</span>
          <span class="subtitle">配置后端服务器连接地址</span>
        </div>
        <span class="arrow">›</span>
      </div>
    </div>

    <div class="settings-section">
      <h4>服务器配置</h4>
      <div class="form-group">
        <label>服务器地址</label>
        <div class="input-with-btn">
          <input 
            v-model="serverUrl" 
            type="url" 
            class="form-input" 
            placeholder="http://192.168.1.100:3001"
          />
          <button @click="testConnection" class="btn btn-sm" :disabled="testing">
            {{ testing ? '测试中...' : '测试' }}
          </button>
        </div>
        <p class="form-hint">请输入后端服务器的完整地址（包含协议和端口）</p>
      </div>

      <div class="form-group">
        <label>快捷选择</label>
        <div class="quick-select">
          <button 
            v-for="preset in serverPresets" 
            :key="preset.url"
            @click="selectServer(preset.url)"
            class="btn btn-sm btn-secondary"
          >
            {{ preset.name }}
          </button>
        </div>
      </div>

      <div v-if="connectionStatus" :class="['connection-status', connectionStatus.success ? 'success' : 'error']">
        {{ connectionStatus.message }}
      </div>
    </div>

    <div class="settings-section">
      <h4>应用信息</h4>
      <div class="info-item">
        <span class="label">版本</span>
        <span class="value">{{ appVersion }}</span>
      </div>
      <div class="info-item">
        <span class="label">构建时间</span>
        <span class="value">{{ buildTime }}</span>
      </div>
      <div class="info-item">
        <span class="label">平台</span>
        <span class="value">{{ platform }}</span>
      </div>
    </div>

    <div class="settings-section">
      <h4>数据管理</h4>
      <button @click="clearCache" class="btn btn-danger full-width">清除缓存</button>
      <button @click="logout" class="btn btn-warning full-width">退出登录</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import api from '../utils/api'

const router = useRouter()
const serverUrl = ref('')
const testing = ref(false)
const connectionStatus = ref(null)
const appVersion = ref('1.0.0')
const buildTime = ref('2026-04-22')
const platform = ref('Web')

const serverPresets = [
  { name: '本地开发', url: 'http://localhost:3001' },
  { name: '局域网', url: 'http://192.168.1.100:3001' },
  { name: '公网地址', url: 'https://jhchat.example.com' }
]

const goToServerConfig = () => {
  router.push('/mobile/server-config')
}

const testConnection = async () => {
  if (!serverUrl.value) {
    connectionStatus.value = { success: false, message: '请输入服务器地址' }
    return
  }

  testing.value = true
  try {
    const response = await fetch(`${serverUrl.value}/api/ping`, {
      method: 'GET',
      timeout: 5000
    })
    
    if (response.ok) {
      connectionStatus.value = { success: true, message: '连接成功！' }
      localStorage.setItem('server_url', serverUrl.value)
    } else {
      connectionStatus.value = { success: false, message: '连接失败，请检查服务器地址' }
    }
  } catch (error) {
    connectionStatus.value = { success: false, message: '无法连接到服务器，请检查网络或服务器地址' }
  } finally {
    testing.value = false
  }
}

const selectServer = (url) => {
  serverUrl.value = url
  testConnection()
}

const clearCache = () => {
  if (confirm('确定要清除所有缓存数据吗？')) {
    localStorage.clear()
    location.reload()
  }
}

const logout = () => {
  if (confirm('确定要退出登录吗？')) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }
}

const loadInfo = async () => {
  // 加载服务器地址
  serverUrl.value = localStorage.getItem('server_url') || ''
  
  // 获取平台信息
  if (Capacitor.isNativePlatform()) {
    platform.value = Capacitor.getPlatform() === 'android' ? 'Android' : 'iOS'
    
    try {
      const appInfo = await App.getInfo()
      appVersion.value = appInfo.version
    } catch (e) {
      console.log('无法获取应用信息')
    }
  } else {
    platform.value = 'Web'
  }
}

onMounted(() => {
  loadInfo()
})
</script>

<style scoped>
.mobile-settings {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

/* 快速访问 */
.quick-access {
  cursor: pointer;
  transition: transform 0.2s;
}

.quick-access:hover {
  transform: translateY(-2px);
}

.quick-access-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(75, 135, 195, 0.1);
  border-radius: 8px;
  border: 2px solid rgba(75, 135, 195, 0.3);
}

.quick-access-item .icon {
  font-size: 32px;
}

.quick-access-item .info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quick-access-item .title {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.quick-access-item .subtitle {
  font-size: 12px;
  color: #888;
}

.quick-access-item .arrow {
  font-size: 24px;
  color: #4B87C3;
}

h3 {
  color: #7eb8da;
  font-size: 20px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(75, 135, 195, 0.3);
}

h4 {
  color: #fff;
  font-size: 16px;
  margin-bottom: 12px;
}

.settings-section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  color: #ccc;
  font-size: 14px;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 4px;
  font-size: 16px;
}

.form-input:focus {
  outline: none;
  border-color: #4B87C3;
}

.input-with-btn {
  display: flex;
  gap: 8px;
}

.input-with-btn .form-input {
  flex: 1;
}

.form-hint {
  color: #888;
  font-size: 12px;
  margin-top: 6px;
}

.quick-select {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.connection-status {
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
  margin-top: 12px;
}

.connection-status.success {
  background: rgba(100, 200, 100, 0.2);
  color: #8f8;
  border: 1px solid rgba(100, 200, 100, 0.3);
}

.connection-status.error {
  background: rgba(200, 50, 50, 0.2);
  color: #f88;
  border: 1px solid rgba(200, 50, 50, 0.3);
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #888;
  font-size: 14px;
}

.info-item .value {
  color: #fff;
  font-size: 14px;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn-warning {
  background: #ffc107;
  color: #000;
}

.btn-danger {
  background: #dc3545;
  color: #fff;
}

.full-width {
  width: 100%;
  margin-bottom: 8px;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .mobile-settings {
    padding: 16px;
  }

  .settings-section {
    padding: 12px;
  }

  .quick-select {
    flex-direction: column;
  }

  .quick-select button {
    width: 100%;
  }
}
</style>
