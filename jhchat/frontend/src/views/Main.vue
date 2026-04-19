<template>
  <div class="main-page">
    <div class="nav-bar">
      <router-link to="/main" class="nav-logo">
        <span class="logo-icon">⚔️</span>
        <span class="logo-text">笑傲江湖</span>
      </router-link>
      <router-link to="/main" class="nav-btn active">首页</router-link>
      <router-link to="/chat" class="nav-btn">聊天</router-link>
      <router-link to="/messages" class="nav-btn">邮件</router-link>
      <router-link to="/sect" class="nav-btn">门派</router-link>
      <router-link to="/marriage" class="nav-btn">婚姻</router-link>
      <router-link to="/skills" class="nav-btn">武功</router-link>
      <div class="nav-dropdown">
        <button class="nav-btn dropdown-toggle">
          游乐 <span class="dropdown-arrow">▼</span>
        </button>
        <div class="dropdown-menu">
          <router-link to="/items" class="dropdown-item">🎒 物品</router-link>
          <router-link to="/shop" class="dropdown-item">🏪 商店</router-link>
          <router-link to="/market" class="dropdown-item">💰 商城</router-link>
          <router-link to="/games" class="dropdown-item">🎲 游戏</router-link>
          <router-link to="/pets" class="dropdown-item">🐾 宠物</router-link>
          <router-link to="/alchemy" class="dropdown-item">🧪 配药</router-link>
          <router-link to="/herb-market" class="dropdown-item">💰 药材市场</router-link>
          <router-link to="/garden" class="dropdown-item">🌱 药园</router-link>
          <router-link to="/fishing" class="dropdown-item">🎣 钓鱼</router-link>
          <router-link to="/mining" class="dropdown-item">⛏️ 挖矿</router-link>
          <router-link to="/hunting" class="dropdown-item">🏹 狩猎</router-link>
          <router-link to="/quests" class="dropdown-item">📜 任务</router-link>
          <router-link to="/achievements" class="dropdown-item">🏅 成就</router-link>
          <router-link to="/fortune" class="dropdown-item">🔮 求签</router-link>
        </div>
      </div>
      <router-link to="/rankings" class="nav-btn">排行</router-link>
      <router-link to="/wishes" class="nav-btn">许愿</router-link>
      <!-- 后台管理入口（管理员可见） -->
      <router-link v-if="userStore.grade >= 6" to="/admin" class="nav-btn nav-admin">⚙️ 后台</router-link>
      <span class="nav-spacer"></span>
      <span class="nav-user-info">
        <span class="user-silver">💰 {{ userStore.silver }}两</span>
      </span>
      <router-link to="/profile" class="nav-btn nav-profile">{{ userStore.username }}</router-link>
      <!-- 背景音乐控制 -->
      <div class="nav-music-control">
        <button @click="toggleMusic" class="nav-btn nav-music" :class="{ playing: isMusicPlaying }" :title="isMusicPlaying ? '暂停音乐' : '播放音乐'">
          🎵 {{ isMusicPlaying ? currentMusicName : '音乐' }}
        </button>
        <select v-model="currentMusicId" @change="changeMusic" class="music-select" v-if="isMusicPlaying">
          <option v-for="music in musicList" :key="music.id" :value="music.id">{{ music.name }}</option>
        </select>
      </div>
      <button @click="handleLogout" class="nav-btn nav-logout">退出</button>
    </div>
    
    <!-- 隐藏的音乐播放器 -->
    <audio ref="musicPlayer" :src="currentMusicUrl" loop @play="onMusicPlay" @pause="onMusicPause" @error="onMusicError"></audio>

    <div class="page-container">
      <div class="announcement card" v-if="announcement">
        <h3 class="section-title">江湖公告</h3>
        <p>{{ announcement }}</p>
      </div>

      <div class="user-summary card" v-if="userStore.profile">
        <h3 class="section-title">侠客信息</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">侠名</span>
            <span class="value">{{ userStore.profile.username }}</span>
          </div>
          <div class="summary-item">
            <span class="label">性别</span>
            <span class="value">{{ userStore.profile.gender === 'male' ? '男' : '女' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">门派</span>
            <span class="value">{{ userStore.profile.sect || '无' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">等级</span>
            <span class="value">{{ userStore.profile.grade }}</span>
          </div>
          <div class="summary-item">
            <span class="label">银两</span>
            <span class="value">{{ userStore.profile.silver }}</span>
          </div>
          <div class="summary-item">
            <span class="label">武功</span>
            <span class="value">{{ userStore.profile.wugong }}</span>
          </div>
        </div>
      </div>

      <h3 class="section-title" style="margin: 20px 0 12px;">快速入口</h3>
      <div class="entry-grid">
        <router-link to="/chat" class="entry-card card">
          <span class="entry-icon">&#9830;</span>
          <span class="entry-name">江湖聊天</span>
        </router-link>
        <router-link to="/messages" class="entry-card card">
          <span class="entry-icon">&#9993;</span>
          <span class="entry-name">飞鸽传书</span>
        </router-link>
        <router-link to="/sect" class="entry-card card">
          <span class="entry-icon">&#9888;</span>
          <span class="entry-name">门派</span>
        </router-link>
        <router-link to="/marriage" class="entry-card card">
          <span class="entry-icon">&#9829;</span>
          <span class="entry-name">月老祠</span>
        </router-link>
        <router-link to="/skills" class="entry-card card">
          <span class="entry-icon">&#9775;</span>
          <span class="entry-name">武功</span>
        </router-link>
        <router-link to="/items" class="entry-card card">
          <span class="entry-icon">&#9831;</span>
          <span class="entry-name">物品</span>
        </router-link>
        <router-link to="/market" class="entry-card card">
          <span class="entry-icon">&#9832;</span>
          <span class="entry-name">二手市场</span>
        </router-link>
        <router-link to="/games" class="entry-card card">
          <span class="entry-icon">&#9884;</span>
          <span class="entry-name">游戏大厅</span>
        </router-link>
        <router-link to="/pets" class="entry-card card">
          <span class="entry-icon">&#9818;</span>
          <span class="entry-name">宠物</span>
        </router-link>
        <router-link to="/alchemy" class="entry-card card">
          <span class="entry-icon">&#9883;</span>
          <span class="entry-name">配药</span>
        </router-link>
        <router-link to="/quests" class="entry-card card">
          <span class="entry-icon">&#128218;</span>
          <span class="entry-name">任务</span>
        </router-link>
        <router-link to="/rankings" class="entry-card card">
          <span class="entry-icon">&#9733;</span>
          <span class="entry-name">排行榜</span>
        </router-link>
        <router-link to="/wishes" class="entry-card card">
          <span class="entry-icon">&#10050;</span>
          <span class="entry-name">许愿墙</span>
        </router-link>
        <router-link to="/profile" class="entry-card card">
          <span class="entry-icon">&#9812;</span>
          <span class="entry-name">个人状态</span>
        </router-link>
      </div>

      <div class="online-section card">
        <h3 class="section-title">在线侠客 ({{ onlineUsers.length }})</h3>
        <div class="online-list" v-if="onlineUsers.length">
          <span v-for="u in onlineUsers" :key="u.user_id || u.username" class="online-user" @click="goToUser(u.username)">
            {{ u.username }}
          </span>
        </div>
        <p v-else class="empty-text">暂无在线侠客</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const router = useRouter()
const userStore = useUserStore()

const announcement = ref('')
const onlineUsers = ref([])

// 背景音乐配置
const musicList = [
  { id: 39, name: '笑傲江湖' },
  { id: 1, name: '爱的奉献' },
  { id: 2, name: '爱之初体验' },
  { id: 3, name: '把悲伤留给自己' },
  { id: 4, name: '博基上校进行曲' },
  { id: 5, name: '不要分离' },
  { id: 6, name: '不知不觉想起你' },
  { id: 7, name: '不装饰你的梦' },
  { id: 8, name: '长江之歌' },
  { id: 9, name: '迟来的爱' },
  { id: 10, name: '春节' },
  { id: 11, name: '春节序曲' },
  { id: 12, name: '单身情歌' },
  { id: 13, name: '独钓一江秋' },
  { id: 14, name: '对你太在乎' },
  { id: 15, name: '飞船即将坠毁' },
  { id: 16, name: '奉献' },
  { id: 17, name: '敢去承担爱' },
  { id: 18, name: '给你一份惊喜' },
  { id: 19, name: '国歌' },
  { id: 20, name: '好日子' },
  { id: 21, name: '洪湖水 2' },
  { id: 22, name: '呼吸我' },
  { id: 23, name: '加尔各答的天使' },
  { id: 24, name: '将自己给你' },
  { id: 25, name: '今宵多珍重' },
  { id: 26, name: '京腔京韵' },
  { id: 27, name: '九月九的酒' },
  { id: 28, name: '辣妹子' },
  { id: 29, name: '流浪歌手的情人' },
  { id: 30, name: '路边的野花不要采' },
  { id: 31, name: '没有恋爱的日子' },
  { id: 32, name: '没有雨的夜里' },
  { id: 33, name: '每一句说话' },
  { id: 34, name: '梦回故园' },
  { id: 35, name: '梦驼铃' },
  { id: 36, name: '秘密情人' },
  { id: 37, name: '呢喃' },
  { id: 38, name: '你怎么舍得我难过' },
  { id: 40, name: '千千阙歌' },
  { id: 41, name: '如果可以再见你' },
  { id: 42, name: '山丹丹' },
  { id: 43, name: '伤了三个心' },
  { id: 44, name: '伤心太平洋' },
  { id: 45, name: '死不了' },
  { id: 46, name: '天涯' },
  { id: 47, name: '天意' },
  { id: 48, name: '同桌的你' },
  { id: 49, name: '童年' },
  { id: 50, name: '弯弯的月亮' }
]
const currentMusicId = ref(39) // 默认播放笑傲江湖
const isMusicPlaying = ref(false)
const musicPlayer = ref(null)

async function handleLogout() {
  await userStore.logout()
  router.push('/login')
}

function goToUser(username) {
  router.push('/profile')
}

// 背景音乐控制方法
const currentMusicName = computed(() => {
  const music = musicList.find(m => m.id === currentMusicId.value)
  return music ? music.name : '音乐'
})

const currentMusicUrl = computed(() => {
  return `/assets/music/${currentMusicId.value}.mp3`
})

function toggleMusic() {
  if (!musicPlayer.value) return
  if (isMusicPlaying.value) {
    musicPlayer.value.pause()
  } else {
    musicPlayer.value.play().catch(err => {
      console.warn('音乐播放失败:', err)
      alert('🎵 请点击页面任意位置后再试（浏览器自动播放策略限制）')
    })
  }
}

function changeMusic() {
  if (!musicPlayer.value || !isMusicPlaying.value) return
  musicPlayer.value.pause()
  nextTick(() => {
    musicPlayer.value.play()
  })
}

function onMusicPlay() {
  isMusicPlaying.value = true
}

function onMusicPause() {
  isMusicPlaying.value = false
}

function onMusicError(e) {
  console.warn('音乐播放失败:', e)
  isMusicPlaying.value = false
}

// 页面加载时自动播放音乐
async function autoPlayMusic() {
  await nextTick()
  if (musicPlayer.value) {
    try {
      await musicPlayer.value.play()
    } catch (err) {
      console.log('自动播放被浏览器阻止，需要用户交互')
    }
  }
}

async function loadNews() {
  try {
    const res = await api.get('/misc/news')
    if (res.success && res.data?.length) {
      announcement.value = res.data[0].content || res.data[0].title || ''
    }
  } catch (e) {}
}

async function loadOnline() {
  try {
    const res = await api.get('/users/online')
    if (res.success) onlineUsers.value = res.data || []
  } catch (e) {}
}

onMounted(async () => {
  await userStore.fetchProfile()
  loadNews()
  loadOnline()
  // 尝试自动播放音乐
  autoPlayMusic()
})
</script>

<style scoped>
.main-page {
  min-height: 100vh;
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

.nav-profile {
  background: rgba(126, 184, 218, 0.1);
}

.nav-admin {
  background: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: #ffc107;
}

.nav-admin:hover {
  background: rgba(255, 193, 7, 0.25);
  border-color: rgba(255, 193, 7, 0.5);
}

.nav-logout {
  border: none;
  background: transparent;
}

.nav-logout:hover {
  background: rgba(231, 76, 60, 0.2);
  color: #ff6b6b;
}

/* 背景音乐控制 */
.nav-music-control {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 8px;
}

.nav-music {
  background: rgba(126, 184, 218, 0.15);
  border: 1px solid rgba(126, 184, 218, 0.3);
  color: #7eb8da;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  transition: all 0.3s;
  white-space: nowrap;
}

.nav-music:hover {
  background: rgba(126, 184, 218, 0.25);
  border-color: rgba(126, 184, 218, 0.5);
  transform: translateY(-1px);
}

.nav-music.playing {
  background: rgba(106, 172, 122, 0.3);
  border-color: rgba(106, 172, 122, 0.6);
  color: #6aac7a;
  animation: musicPulse 2s ease-in-out infinite;
}

@keyframes musicPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(106, 172, 122, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(106, 172, 122, 0);
  }
}

.music-select {
  background: rgba(10, 10, 20, 0.9);
  border: 1px solid rgba(126, 184, 218, 0.3);
  color: #ccc;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  max-width: 120px;
  cursor: pointer;
  transition: all 0.2s;
}

.music-select:hover {
  border-color: rgba(126, 184, 218, 0.6);
}

.music-select:focus {
  outline: none;
  border-color: #7eb8da;
  box-shadow: 0 0 8px rgba(126, 184, 218, 0.3);
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.section-title {
  color: #7eb8da;
  font-size: 16px;
  margin-bottom: 12px;
  border-left: 3px solid #4B87C3;
  padding-left: 10px;
}

.announcement p {
  color: #ccc;
  font-size: 14px;
  line-height: 1.6;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-item .label {
  color: #888;
  font-size: 12px;
}

.summary-item .value {
  color: #eee;
  font-size: 15px;
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.entry-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.entry-card:hover {
  border-color: #4B87C3;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(75, 135, 195, 0.2);
}

.entry-icon {
  font-size: 28px;
  color: #7eb8da;
}

.entry-name {
  color: #ccc;
  font-size: 14px;
}

.online-section {
  margin-top: 20px;
}

.online-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.online-user {
  padding: 4px 12px;
  background: rgba(74, 124, 89, 0.2);
  border: 1px solid rgba(74, 124, 89, 0.4);
  border-radius: 12px;
  font-size: 13px;
  color: #8fc9a0;
  cursor: pointer;
  transition: all 0.2s;
}

.online-user:hover {
  background: rgba(74, 124, 89, 0.4);
  color: #fff;
}

.empty-text {
  color: #666;
  font-size: 13px;
}

@media (max-width: 600px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .entry-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
