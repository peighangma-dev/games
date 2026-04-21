<template>
  <div class="login-page">
    <!-- 首页背景音乐 -->
    <audio 
      ref="landingMusicPlayer" 
      :src="musicStore.currentMusicUrl"
      loop
      @play="musicStore.onLandingPlay"
      @pause="musicStore.onLandingPause"
      @error="musicStore.onLandingError"
    ></audio>
    
    <div v-if="musicStore.isLandingPlaying" class="music-playing-indicator" @click="toggleMusic" title="暂停背景音乐">
      🔊 播放中
    </div>
    <button v-else @click="toggleMusic" class="music-toggle-btn" title="播放背景音乐">
      🔇 播放背景音乐
    </button>
    
    <div class="ripple-bg login-bg">
      <div class="ripple-circle r1"></div>
      <div class="ripple-circle r2"></div>
      <div class="ripple-circle r3"></div>
    </div>
    <div class="login-card">
      <div class="login-header">
        <h1>笑傲江湖</h1>
        <p class="subtitle">武侠世界 · 快意恩仇</p>
      </div>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>侠名</label>
          <input v-model="form.username" type="text" placeholder="请输入用户名" autocomplete="username" />
        </div>
        <div class="form-group">
          <label>口令</label>
          <input v-model="form.password" type="password" placeholder="请输入密码" autocomplete="current-password" />
        </div>
        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '进入江湖' }}
        </button>
      </form>
      <div class="login-footer">
        <router-link to="/register">初入江湖？前往注册</router-link>
        <span class="online-count">在线侠客: {{ onlineCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useMusicStore } from '../stores/music'
import api from '../utils/api'

const router = useRouter()
const userStore = useUserStore()
const musicStore = useMusicStore()

const form = ref({ username: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')
const onlineCount = ref(0)
const landingMusicPlayer = ref(null)

// 音乐控制
function toggleMusic() {
  if (musicStore.isLandingPlaying.value) {
    musicStore.pauseLandingMusic()
  } else {
    musicStore.playLandingMusic()
  }
}

// 监听路由变化，暂停音乐
onBeforeUnmount(() => {
  musicStore.stopLandingMusicForNavigation()
})

async function handleLogin() {
  if (!form.value.username.trim() || !form.value.password.trim()) {
    errorMsg.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await userStore.login(form.value.username, form.value.password)
    if (res.success) {
      router.push('/main')
    } else {
      errorMsg.value = res.message || '登录失败'
    }
  } catch (err) {
    errorMsg.value = err.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}

async function fetchOnlineCount() {
  try {
    const res = await api.get('/users/online')
    if (res?.success) onlineCount.value = res.data?.length || 0
  } catch (e) {
    onlineCount.value = 0
  }
}

onMounted(() => {
  fetchOnlineCount()
  // 注册 audio 元素
  musicStore.setLandingAudioElement(landingMusicPlayer.value)
  // 自动尝试播放背景音乐（浏览器可能阻止自动播放）
  setTimeout(() => {
    musicStore.playLandingMusic()
  }, 500)
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.ripple-circle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(75, 135, 195, 0.08) 0%, transparent 70%);
  animation: ripple 4s ease-out infinite;
}

.r1 {
  width: 400px;
  height: 400px;
  top: 30%;
  left: 20%;
  animation-delay: 0s;
}

.r2 {
  width: 300px;
  height: 300px;
  top: 50%;
  right: 15%;
  animation-delay: 1.5s;
}

.r3 {
  width: 250px;
  height: 250px;
  bottom: 10%;
  left: 40%;
  animation-delay: 3s;
}

@keyframes ripple {
  0% { transform: scale(0.8); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}

.login-card {
  position: relative;
  z-index: 1;
  background: rgba(26, 26, 46, 0.95);
  border: 1px solid rgba(75, 135, 195, 0.3);
  border-radius: 12px;
  padding: 40px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 60px rgba(75, 135, 195, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 32px;
  color: #7eb8da;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.6);
  letter-spacing: 8px;
}

.subtitle {
  color: #888;
  margin-top: 8px;
  font-size: 14px;
  letter-spacing: 4px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #aaa;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: #eee;
  font-size: 15px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #4B87C3;
  box-shadow: 0 0 8px rgba(75, 135, 195, 0.3);
}

.error-msg {
  color: #e74c3c;
  font-size: 13px;
  margin-bottom: 12px;
  text-align: center;
}

.login-btn {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  letter-spacing: 4px;
  border-radius: 6px;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  font-size: 13px;
}

.online-count {
  color: #4a7c59;
}

/* 音乐播放控制 */
.music-toggle-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1001;
  padding: 8px 16px;
  background: rgba(75, 135, 195, 0.3);
  border: 1px solid rgba(126, 184, 218, 0.4);
  border-radius: 20px;
  color: #c0d8e8;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.music-toggle-btn:hover {
  background: rgba(75, 135, 195, 0.5);
  color: #fff;
  transform: translateY(-1px);
}

.music-playing-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1001;
  padding: 8px 16px;
  background: rgba(46, 204, 113, 0.3);
  border: 1px solid rgba(46, 204, 113, 0.5);
  border-radius: 20px;
  color: #2ecc71;
  cursor: pointer;
  animation: pulse 2s infinite;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
}

.music-playing-indicator:hover {
  background: rgba(46, 204, 113, 0.5);
  transform: translateY(-1px);
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.4); }
  50% { box-shadow: 0 0 0 10px rgba(46, 204, 113, 0); }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
    width: 90vw;
  }
  
  .login-header h1 {
    font-size: 26px;
    letter-spacing: 6px;
  }
  
  .subtitle {
    font-size: 12px;
    letter-spacing: 3px;
  }
  
  .form-group input {
    padding: 9px 12px;
    font-size: 14px;
  }
  
  .login-btn {
    padding: 11px;
    font-size: 15px;
    letter-spacing: 3px;
  }
  
  .login-footer {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .music-toggle-btn,
  .music-playing-indicator {
    top: 12px;
    right: 12px;
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>
