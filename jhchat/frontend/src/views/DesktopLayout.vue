<template>
  <div class="desktop-layout">
    <!-- 顶部菜单栏 -->
    <header class="desktop-header">
      <div class="header-left">
        <h1 class="app-title">江湖聊天室</h1>
      </div>
      <div class="header-right">
        <button @click="toggleMute" class="icon-btn" :title="isMuted ? '取消静音' : '静音'">
          {{ isMuted ? '🔇' : '🔊' }}
        </button>
        <button @click="minimizeToTray" class="icon-btn" title="最小化到托盘">
          ➖
        </button>
        <button @click="openSettings" class="icon-btn" title="设置">
          ⚙️
        </button>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="desktop-main">
      <router-view />
    </main>

    <!-- 状态栏 -->
    <footer class="desktop-statusbar">
      <div class="status-left">
        <span class="status-item">🟢 在线</span>
        <span class="status-item" v-if="currentUser">{{ currentUser.username }}</span>
      </div>
      <div class="status-right">
        <span class="status-item">{{ currentTime }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isMuted = ref(false)
const currentTime = ref('')

const currentUser = computed(() => {
  return JSON.parse(localStorage.getItem('user') || '{}')
})

// 更新时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 切换静音
const toggleMute = () => {
  isMuted.value = !isMuted.value
  if (window.electron) {
    window.electron.saveConfig({ enableSound: !isMuted.value })
  }
  // 通知其他组件
  window.dispatchEvent(new CustomEvent('sound-toggle', { detail: { enable: !isMuted.value } }))
}

// 最小化到托盘
const minimizeToTray = () => {
  if (window.electron) {
    window.electron.minimizeToTray()
  } else {
    window.minimize()
  }
}

// 打开设置
const openSettings = () => {
  router.push('/desktop/desktop-settings')
}

// Electron 事件监听
let soundUnsubscribe = null

onMounted(() => {
  updateTime()
  const timer = setInterval(updateTime, 1000)
  
  if (window.electron) {
    // 监听来自 Electron 的静音切换事件
    window.electron.onSoundToggle((data) => {
      isMuted.value = !data.enable
    })
    
    // 监听打开设置请求
    window.electron.onOpenSettings(() => {
      openSettings()
    })
    
    // 加载配置
    window.electron.getConfig().then(config => {
      if (config) {
        isMuted.value = !config.enableSound
      }
    })
  }
  
  onUnmounted(() => {
    clearInterval(timer)
    if (soundUnsubscribe) soundUnsubscribe()
  })
})
</script>

<style scoped>
.desktop-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1a1a2e;
  overflow: hidden;
}

/* 顶部菜单栏 */
.desktop-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  -webkit-app-region: drag; /* 可拖拽区域 */
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  -webkit-app-region: no-drag;
}

.app-title {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  width: 36px;
  height: 36px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  -webkit-app-region: no-drag;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.icon-btn:active {
  transform: scale(0.95);
}

/* 主内容区 */
.desktop-main {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* 状态栏 */
.desktop-statusbar {
  background: #16162a;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  font-size: 12px;
}

.status-left,
.status-right {
  display: flex;
  gap: 16px;
}

.status-item {
  color: #888;
}

.status-item:first-child {
  color: #4CAF50;
}
</style>
