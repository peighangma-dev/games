<template>
  <div class="mobile-layout">
    <!-- 顶部导航栏 -->
    <header class="mobile-header">
      <div class="header-content">
        <h1 class="app-title">江湖聊天室</h1>
        <div class="header-actions">
          <button @click="showNotifications = true" class="icon-btn">
            🔔
            <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
          </button>
          <button @click="goToProfile" class="icon-btn">
            👤
          </button>
        </div>
      </div>
    </header>

    <!-- 内容区域 -->
    <main class="mobile-content">
      <router-view />
    </main>

    <!-- 底部导航栏 -->
    <nav class="bottom-navbar">
      <router-link to="/mobile/chat" class="nav-item">
        <span class="nav-icon">💬</span>
        <span class="nav-label">聊天</span>
      </router-link>
      <router-link to="/mobile/games" class="nav-item">
        <span class="nav-icon">🎮</span>
        <span class="nav-label">游戏</span>
      </router-link>
      <router-link to="/mobile/sect" class="nav-item">
        <span class="nav-icon">⚔️</span>
        <span class="nav-label">门派</span>
      </router-link>
      <router-link to="/mobile/rankings" class="nav-item">
        <span class="nav-icon">🏆</span>
        <span class="nav-label">排行</span>
      </router-link>
      <router-link to="/mobile/settings" class="nav-item">
        <span class="nav-icon">⚙️</span>
        <span class="nav-label">设置</span>
      </router-link>
    </nav>

    <!-- 通知弹窗 -->
    <div v-if="showNotifications" class="modal-overlay" @click="showNotifications = false">
      <div class="modal notification-modal" @click.stop>
        <div class="modal-header">
          <h3>通知</h3>
          <button @click="showNotifications = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="notification-item">
            <div class="notif-content">
              <span class="notif-title">系统通知</span>
              <p class="notif-message">欢迎使用江湖聊天室！</p>
              <span class="notif-time">刚刚</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Capacitor } from '@capacitor/core'

const router = useRouter()
const unreadCount = ref(0)
const showNotifications = ref(false)

const goToProfile = () => {
  router.push('/profile')
}

// 初始化状态栏
const initStatusBar = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await StatusBar.setStyle({ style: Style.Dark })
      await StatusBar.setBackgroundColor({ color: '#1a1a2e' })
    } catch (e) {
      console.log('状态栏设置失败:', e)
    }
  }
}

onMounted(() => {
  initStatusBar()
})
</script>

<style scoped>
.mobile-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1a1a2e;
}

/* 顶部导航栏 */
.mobile-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%);
  padding: env(safe-area-inset-top) 0 0 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.app-title {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.icon-btn {
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #ff3b30;
  color: #fff;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 10px;
  font-weight: bold;
  min-width: 16px;
  text-align: center;
}

/* 内容区域 */
.mobile-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 70px;
}

/* 底部导航栏 */
.bottom-navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
  height: calc(60px + env(safe-area-inset-bottom));
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  text-decoration: none;
  color: #888;
  transition: all 0.2s;
}

.nav-item.router-link-active {
  color: #4B87C3;
}

.nav-item:active {
  background: rgba(255, 255, 255, 0.05);
}

.nav-icon {
  font-size: 22px;
  margin-bottom: 2px;
}

.nav-label {
  font-size: 11px;
  white-space: nowrap;
}

/* 通知弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.notification-modal {
  width: 100%;
  max-height: 70vh;
  background: #1a1a2e;
  border-radius: 16px 16px 0 0;
  border: none;
  margin: 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #fff;
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  max-height: 50vh;
  overflow-y: auto;
}

.notification-item {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.notif-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notif-title {
  font-size: 14px;
  font-weight: bold;
  color: #7eb8da;
}

.notif-message {
  margin: 0;
  font-size: 13px;
  color: #ccc;
}

.notif-time {
  font-size: 11px;
  color: #666;
}

/* 适配横屏 */
@media (orientation: landscape) and (max-height: 500px) {
  .bottom-navbar {
    height: 50px;
  }

  .nav-label {
    display: none;
  }

  .nav-icon {
    margin-bottom: 0;
  }
}
</style>
