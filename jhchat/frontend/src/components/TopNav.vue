<template>
  <div class="top-nav">
    <div class="nav-left">
      <!-- 移动端汉堡菜单按钮 -->
      <button class="menu-toggle" @click="toggleDrawer" aria-label="菜单">
        <span class="hamburger"></span>
      </button>
      <router-link to="/main" class="nav-logo">
        <span class="logo-icon">⚔️</span>
        <span class="logo-text">笑傲江湖</span>
      </router-link>
    </div>
    
    <!-- 桌面端导航 -->
    <div class="nav-center desktop-only">
      <router-link to="/main" class="nav-item">
        <span class="nav-icon">🏠</span>
        <span class="nav-label">首页</span>
      </router-link>
      <router-link to="/chat" class="nav-item">
        <span class="nav-icon">💬</span>
        <span class="nav-label">聊天</span>
      </router-link>
      <router-link to="/messages" class="nav-item">
        <span class="nav-icon">✉️</span>
        <span class="nav-label">邮件</span>
      </router-link>
      <router-link to="/sect" class="nav-item">
        <span class="nav-icon">⚔️</span>
        <span class="nav-label">门派</span>
      </router-link>
      <router-link to="/marriage" class="nav-item">
        <span class="nav-icon">❤️</span>
        <span class="nav-label">婚姻</span>
      </router-link>
      <router-link to="/skills" class="nav-item">
        <span class="nav-icon">📜</span>
        <span class="nav-label">武功</span>
      </router-link>
      <div class="nav-dropdown">
        <button class="nav-item dropdown-toggle">
          <span class="nav-icon">🎮</span>
          <span class="nav-label">游乐</span>
          <span class="dropdown-arrow">▼</span>
        </button>
        <div class="dropdown-menu">
          <router-link to="/items" class="dropdown-item">🎒 物品</router-link>
          <router-link to="/shop" class="dropdown-item">🏪 商店</router-link>
          <router-link to="/market" class="dropdown-item">💰 商城</router-link>
          <router-link to="/games" class="dropdown-item">🎲 游戏</router-link>
          <router-link to="/pets" class="dropdown-item">🐾 宠物</router-link>
          <router-link to="/alchemy" class="dropdown-item">🧪 配药</router-link>
          <router-link to="/fishing" class="dropdown-item">🎣 钓鱼</router-link>
          <router-link to="/fortune" class="dropdown-item">🔮 求签</router-link>
        </div>
      </div>
      <router-link to="/rankings" class="nav-item">
        <span class="nav-icon">🏆</span>
        <span class="nav-label">排行</span>
      </router-link>
      <router-link to="/wishes" class="nav-item">
        <span class="nav-icon">🌟</span>
        <span class="nav-label">许愿</span>
      </router-link>
      <!-- 后台管理入口（管理员可见） -->
      <router-link v-if="userStore.grade >= 6" to="/admin" class="nav-item nav-admin">
        <span class="nav-icon">⚙️</span>
        <span class="nav-label">后台</span>
      </router-link>
    </div>
    
    <div class="nav-right">
      <span class="nav-user-info desktop-only">
        <span class="user-silver">💰 {{ userStore.silver }}两</span>
      </span>
      
      <!-- 背景音乐播放器 -->
      <div class="music-player-wrapper">
        <select v-model="musicStore.currentMusicId" @change="onMusicChange" class="nav-music-select" title="选择背景音乐">
          <option v-for="music in musicStore.musicList" :key="music.id" :value="music.id">{{ music.name }}</option>
        </select>
        <button 
          @click="toggleMusic" 
          :class="['music-btn', { playing: musicStore.isPlaying }]"
          :title="musicStore.isPlaying ? '暂停音乐' : '播放音乐'"
        >
          {{ musicStore.isPlaying ? '⏸️' : '▶️' }}
        </button>
      </div>
      
      <router-link to="/profile" class="nav-item nav-profile desktop-only">
        <span class="nav-icon">👤</span>
        <span class="nav-label">{{ userStore.username }}</span>
      </router-link>
      <button @click="handleLogout" class="nav-item nav-logout">
        <span class="nav-icon">🚪</span>
        <span class="nav-label desktop-only">退出</span>
      </button>
    </div>
    
    <!-- 移动端抽屉菜单 -->
    <div v-if="isDrawerOpen" class="drawer-overlay" @click="closeDrawer"></div>
    <div :class="['drawer-menu', { open: isDrawerOpen }]">
      <div class="drawer-header">
        <span class="drawer-title">笑傲江湖</span>
        <button class="drawer-close" @click="closeDrawer" aria-label="关闭菜单">✕</button>
      </div>
      <div class="drawer-user-info">
        <div class="drawer-avatar">{{ userStore.username?.charAt(0).toUpperCase() }}</div>
        <div class="drawer-user-details">
          <div class="drawer-username">{{ userStore.username }}</div>
          <div class="drawer-silver">💰 {{ userStore.silver }}两</div>
        </div>
      </div>
      <nav class="drawer-nav">
        <router-link to="/main" class="drawer-item" @click="closeDrawer">
          <span class="drawer-icon">🏠</span>
          <span class="drawer-label">首页</span>
        </router-link>
        <router-link to="/chat" class="drawer-item" @click="closeDrawer">
          <span class="drawer-icon">💬</span>
          <span class="drawer-label">聊天</span>
        </router-link>
        <router-link to="/messages" class="drawer-item" @click="closeDrawer">
          <span class="drawer-icon">✉️</span>
          <span class="drawer-label">邮件</span>
        </router-link>
        <router-link to="/sect" class="drawer-item" @click="closeDrawer">
          <span class="drawer-icon">⚔️</span>
          <span class="drawer-label">门派</span>
        </router-link>
        <router-link to="/marriage" class="drawer-item" @click="closeDrawer">
          <span class="drawer-icon">❤️</span>
          <span class="drawer-label">婚姻</span>
        </router-link>
        <router-link to="/skills" class="drawer-item" @click="closeDrawer">
          <span class="drawer-icon">📜</span>
          <span class="drawer-label">武功</span>
        </router-link>
        <div class="drawer-group">
          <div class="drawer-group-title">🎮 游乐</div>
          <router-link to="/items" class="drawer-item drawer-subitem" @click="closeDrawer">🎒 物品</router-link>
          <router-link to="/shop" class="drawer-item drawer-subitem" @click="closeDrawer">🏪 商店</router-link>
          <router-link to="/market" class="drawer-item drawer-subitem" @click="closeDrawer">💰 商城</router-link>
          <router-link to="/games" class="drawer-item drawer-subitem" @click="closeDrawer">🎲 游戏</router-link>
          <router-link to="/pets" class="drawer-item drawer-subitem" @click="closeDrawer">🐾 宠物</router-link>
          <router-link to="/alchemy" class="drawer-item drawer-subitem" @click="closeDrawer">🧪 配药</router-link>
          <router-link to="/fishing" class="drawer-item drawer-subitem" @click="closeDrawer">🎣 钓鱼</router-link>
          <router-link to="/fortune" class="drawer-item drawer-subitem" @click="closeDrawer">🔮 求签</router-link>
        </div>
        <router-link to="/rankings" class="drawer-item" @click="closeDrawer">
          <span class="drawer-icon">🏆</span>
          <span class="drawer-label">排行</span>
        </router-link>
        <router-link to="/wishes" class="drawer-item" @click="closeDrawer">
          <span class="drawer-icon">🌟</span>
          <span class="drawer-label">许愿</span>
        </router-link>
        <router-link v-if="userStore.grade >= 6" to="/admin" class="drawer-item drawer-admin" @click="closeDrawer">
          <span class="drawer-icon">⚙️</span>
          <span class="drawer-label">后台管理</span>
        </router-link>
        <router-link to="/profile" class="drawer-item mobile-only" @click="closeDrawer">
          <span class="drawer-icon">👤</span>
          <span class="drawer-label">个人资料</span>
        </router-link>
        <button @click="handleLogout" class="drawer-item drawer-logout">
          <span class="drawer-icon">🚪</span>
          <span class="drawer-label">退出登录</span>
        </button>
      </nav>
    </div>
    
    <!-- 隐藏的音频元素 -->
    <audio 
      id="bgm-audio"
      :src="musicStore.currentMusicUrl" 
      loop
      @play="musicStore.onPlay"
      @pause="musicStore.onPause"
      @ended="musicStore.onEnded"
      @error="musicStore.onError"
    ></audio>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useMusicStore } from '../stores/music'
import { onMounted, nextTick, ref } from 'vue'

const router = useRouter()
const userStore = useUserStore()
const musicStore = useMusicStore()
const isDrawerOpen = ref(false)

async function handleLogout() {
  await userStore.logout()
  router.push('/login')
}

function toggleMusic() {
  musicStore.toggle()
}

function onMusicChange() {
  musicStore.setMusic(musicStore.currentMusicId)
}

function toggleDrawer() {
  isDrawerOpen.value = !isDrawerOpen.value
  document.body.style.overflow = isDrawerOpen.value ? 'hidden' : ''
}

function closeDrawer() {
  isDrawerOpen.value = false
  document.body.style.overflow = ''
}

// 页面加载时初始化音频元素
onMounted(async () => {
  await nextTick()
  const audio = document.getElementById('bgm-audio')
  if (audio && !musicStore.audioElement) {
    musicStore.setAudioElement(audio)
    // 尝试自动播放默认音乐
    try {
      audio.volume = 0.7 // 设置默认音量为 70%
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('背景音乐自动播放成功')
        }).catch(err => {
          console.log('浏览器阻止自动播放，需要用户交互:', err)
          // 首次点击后自动播放
          const enableAutoPlay = () => {
            audio.play().then(() => {
              console.log('用户交互后开始播放背景音乐')
            }).catch(() => {})
            document.removeEventListener('click', enableAutoPlay)
            document.removeEventListener('keydown', enableAutoPlay)
          }
          document.addEventListener('click', enableAutoPlay, { once: true })
          document.addEventListener('keydown', enableAutoPlay, { once: true })
        })
      }
    } catch (err) {
      console.log('自动播放失败:', err)
    }
  }
})
</script>

<style scoped>
.top-nav {
  display: flex;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, #1a3a5c 0%, #2d5a7c 100%);
  padding: 0 20px;
  height: 56px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 汉堡菜单按钮 */
.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.menu-toggle:hover {
  background: rgba(126, 184, 218, 0.15);
}

.hamburger {
  display: block;
  width: 22px;
  height: 2px;
  background: #fff;
  position: relative;
  transition: background 0.2s;
}

.hamburger::before,
.hamburger::after {
  content: '';
  position: absolute;
  width: 22px;
  height: 2px;
  background: #fff;
  left: 0;
  transition: transform 0.3s;
}

.hamburger::before {
  top: -7px;
}

.hamburger::after {
  top: 7px;
}

/* 汉堡按钮激活状态 */
.menu-toggle.active .hamburger {
  background: transparent;
}

.menu-toggle.active .hamburger::before {
  transform: rotate(45deg);
  top: 0;
}

.menu-toggle.active .hamburger::after {
  transform: rotate(-45deg);
  top: 0;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-logo:hover {
  background: rgba(255, 255, 255, 0.1);
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  color: #7eb8da;
}

.nav-center {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  text-decoration: none;
  color: #c0d8e8;
  border-radius: 8px;
  transition: all 0.2s;
  font-size: 14px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(126, 184, 218, 0.15);
  color: #fff;
}

.nav-item.router-link-active {
  background: rgba(126, 184, 218, 0.25);
  color: #7eb8da;
}

.nav-icon {
  font-size: 16px;
}

.nav-label {
  white-space: nowrap;
}

.nav-dropdown {
  position: relative;
}

.dropdown-toggle {
  position: relative;
}

.dropdown-arrow {
  font-size: 10px;
  margin-left: 4px;
  opacity: 0.7;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: #1a3a5c;
  border: 1px solid rgba(126, 184, 218, 0.3);
  border-radius: 8px;
  padding: 8px 0;
  min-width: 160px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.2s;
  z-index: 1001;
}

.nav-dropdown:hover .dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  text-decoration: none;
  color: #c0d8e8;
  transition: all 0.2s;
}

.dropdown-item:hover {
  background: rgba(126, 184, 218, 0.15);
  color: #fff;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 20px;
  font-size: 13px;
  color: #ffd700;
}

.nav-profile {
  background: rgba(126, 184, 218, 0.1);
}

.nav-admin {
  background: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
}

.nav-admin:hover {
  background: rgba(255, 193, 7, 0.25);
  border-color: rgba(255, 193, 7, 0.5);
}

.nav-admin .nav-icon {
  filter: brightness(1.2);
}

.nav-logout:hover {
  background: rgba(231, 76, 60, 0.2);
  color: #ff6b6b;
}

/* 导航栏音乐播放器 */
.music-player-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: rgba(126, 184, 218, 0.1);
  border: 1px solid rgba(126, 184, 218, 0.2);
  border-radius: 8px;
  transition: all 0.2s;
}

.music-player-wrapper:hover {
  background: rgba(126, 184, 218, 0.15);
  border-color: rgba(126, 184, 218, 0.4);
}

.nav-music-select {
  appearance: none;
  background: linear-gradient(135deg, rgba(15, 15, 30, 0.8), rgba(20, 20, 40, 0.9));
  border: 1px solid rgba(126, 184, 218, 0.4);
  border-radius: 6px;
  color: #ddd;
  font-size: 12px;
  padding: 5px 24px 5px 10px;
  cursor: pointer;
  transition: all 0.2s;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%237eb8da' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 6px center;
  min-width: 120px;
}

.nav-music-select:hover {
  border-color: rgba(126, 184, 218, 0.7);
}

.nav-music-select:focus {
  outline: none;
  border-color: #7eb8da;
  box-shadow: 0 0 0 2px rgba(126, 184, 218, 0.2);
}

.music-btn {
  padding: 5px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
  background: rgba(75, 135, 195, 0.2);
}

.music-btn:hover {
  background: rgba(75, 135, 195, 0.35);
  transform: scale(1.1);
}

.music-btn.playing {
  background: rgba(46, 204, 113, 0.25);
  animation: musicPulse 1.5s infinite;
}

@keyframes musicPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(46, 204, 113, 0); }
}

/* 移动端抽屉菜单 */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1999;
  opacity: 0;
  animation: fadeIn 0.3s forwards;
}

.drawer-menu {
  position: fixed;
  top: 0;
  left: -280px;
  width: 280px;
  height: 100vh;
  background: linear-gradient(135deg, #1a3a5c 0%, #0f1a26 100%);
  z-index: 2000;
  box-shadow: 2px 0 24px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease;
  overflow-y: auto;
  overflow-x: hidden;
}

.drawer-menu.open {
  transform: translateX(280px);
}

@keyframes fadeIn {
  to { opacity: 1; }
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(126, 184, 218, 0.2);
  background: rgba(0, 0, 0, 0.2);
}

.drawer-title {
  font-size: 18px;
  font-weight: bold;
  color: #7eb8da;
}

.drawer-close {
  width: 32px;
  height: 32px;
  background: rgba(126, 184, 218, 0.15);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drawer-close:hover {
  background: rgba(126, 184, 218, 0.3);
}

.drawer-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid rgba(126, 184, 218, 0.1);
}

.drawer-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7eb8da, #4a7c9d);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

.drawer-user-details {
  flex: 1;
}

.drawer-username {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
}

.drawer-silver {
  font-size: 13px;
  color: #ffd700;
}

.drawer-nav {
  padding: 12px 0;
}

.drawer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  color: #c0d8e8;
  text-decoration: none;
  transition: all 0.2s;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  font-size: 15px;
}

.drawer-item:hover {
  background: rgba(126, 184, 218, 0.15);
  color: #fff;
}

.drawer-item.router-link-active {
  background: rgba(126, 184, 218, 0.25);
  color: #7eb8da;
  border-left: 3px solid #7eb8da;
}

.drawer-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.drawer-label {
  flex: 1;
}

.drawer-group {
  margin: 8px 0;
}

.drawer-group-title {
  padding: 10px 20px;
  font-size: 13px;
  color: #7eb8da;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.drawer-subitem {
  padding-left: 56px;
  font-size: 14px;
}

.drawer-admin {
  margin-top: 12px;
  border-top: 1px solid rgba(126, 184, 218, 0.15);
  background: rgba(255, 193, 7, 0.08);
}

.drawer-admin:hover {
  background: rgba(255, 193, 7, 0.15);
}

.drawer-logout {
  margin-top: 8px;
  border-top: 1px solid rgba(231, 76, 60, 0.2);
  color: #ff6b6b;
}

.drawer-logout:hover {
  background: rgba(231, 76, 60, 0.15);
  color: #ff5252;
}

/* 响应式工具类 */
.desktop-only {
  display: flex;
}

.mobile-only {
  display: none;
}

/* 移动端适配 */
@media (max-width: 992px) {
  .menu-toggle {
    display: flex;
  }
  
  .desktop-only {
    display: none !important;
  }
  
  .mobile-only {
    display: flex !important;
  }
  
  .nav-center {
    display: none;
  }
  
  .nav-music-select {
    min-width: 100px;
    font-size: 11px;
    padding: 4px 20px 4px 8px;
  }
  
  .music-btn {
    padding: 4px 8px;
    font-size: 14px;
  }
  
  .music-player-wrapper {
    padding: 4px 6px;
  }
}

@media (max-width: 768px) {
  .top-nav {
    padding: 0 12px;
    height: 52px;
    gap: 8px;
  }
  
  .nav-logo {
    font-size: 16px;
    padding: 6px 10px;
  }
  
  .logo-icon {
    font-size: 20px;
  }
  
  .nav-user-info.mobile-only {
    display: none !important;
  }
}

@media (max-width: 480px) {
  .nav-music-select {
    min-width: 90px;
    font-size: 10px;
  }
  
  .music-btn {
    font-size: 13px;
    padding: 3px 6px;
  }
}
</style>
