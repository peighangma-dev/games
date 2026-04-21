<template>
  <PageLayout>
    <div class="main-page">
      <div class="page-container">
      <!-- 欢迎横幅 -->
      <div class="welcome-banner card">
        <div class="welcome-content">
          <h2 class="welcome-title">🏮 欢迎重回江湖 🏮</h2>
          <p class="welcome-text">
            多年不见，甚是想念。<br>
            曾经的热血江湖，如今的快意恩仇，<br>
            让我们一起回忆那段仗剑走天涯的时光...
          </p>
          <p class="welcome-sub">
            愿君在此重拾初心，再续江湖梦
          </p>
        </div>
      </div>

      <!-- 江湖公告（滚动显示） -->
      <div class="announcement card" v-if="announcement">
        <div class="announcement-header">
          <h3 class="section-title">📜 江湖公告</h3>
          <span class="announcement-badge">最新</span>
        </div>
        <div class="announcement-scroll-container">
          <div class="announcement-scroll-content" :style="{ animationDuration: scrollDuration + 's' }">
            <p class="announcement-content">{{ announcement }}</p>
            <p class="announcement-content">{{ announcement }}</p>
          </div>
        </div>
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
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../utils/api'
import PageLayout from '../components/PageLayout.vue'

const router = useRouter()
const userStore = useUserStore()

const announcement = ref('')
const onlineUsers = ref([])
const scrollDuration = ref(30) // 滚动周期（秒）

async function handleLogout() {
  await userStore.logout()
  router.push('/login')
}

function goToUser(username) {
  router.push('/profile')
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
})
</script>

<style scoped>
.main-page {
  min-height: 100vh;
}

.nav-dropdown {
  position: relative;
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

/* 欢迎横幅 */
.welcome-banner {
  background: linear-gradient(135deg, rgba(75, 135, 195, 0.15) 0%, rgba(26, 58, 92, 0.2) 100%);
  border: 1px solid rgba(126, 184, 218, 0.3);
  padding: 30px 40px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.welcome-banner::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(126, 184, 218, 0.05) 0%, transparent 70%);
  animation: welcome-rotate 30s linear infinite;
}

@keyframes welcome-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.welcome-content {
  position: relative;
  z-index: 1;
}

.welcome-title {
  font-size: 28px;
  color: #7eb8da;
  margin-bottom: 16px;
  text-shadow: 0 0 20px rgba(126, 184, 218, 0.4);
  letter-spacing: 4px;
}

.welcome-text {
  font-size: 16px;
  color: #c0d8e8;
  line-height: 1.8;
  margin-bottom: 12px;
}

.welcome-sub {
  font-size: 14px;
  color: #888;
  font-style: italic;
  letter-spacing: 2px;
}

/* 公告优化（滚动显示） */
.announcement {
  background: linear-gradient(135deg, rgba(230, 180, 60, 0.1) 0%, rgba(75, 135, 195, 0.08) 100%);
  border: 1px solid rgba(230, 180, 60, 0.3);
  padding: 16px 20px;
  margin-bottom: 20px;
  overflow: hidden;
}

.announcement-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.announcement-badge {
  display: inline-block;
  padding: 2px 10px;
  background: linear-gradient(135deg, #e6b43c, #f0c840);
  color: #1a1a2e;
  font-size: 12px;
  font-weight: bold;
  border-radius: 12px;
  animation: badge-pulse 2s infinite;
  box-shadow: 0 2px 8px rgba(230, 180, 60, 0.4);
}

@keyframes badge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.announcement-scroll-container {
  overflow: hidden;
  position: relative;
  height: 60px; /* 固定高度 */
}

@media (max-width: 600px) {
  .announcement-scroll-container {
    height: 50px; /* 移动端减小高度 */
  }
}

.announcement-scroll-content {
  position: absolute;
  width: 100%;
  animation: scroll-up 30s linear infinite;
}

@keyframes scroll-up {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-100%);
  }
}

.announcement-content {
  color: #f0e68c;
  font-size: 14px;
  line-height: 1.8;
  padding-left: 12px;
  border-left: 2px solid rgba(230, 180, 60, 0.5);
  white-space: pre-line; /* 保留换行 */
  margin: 0;
}

/* 暂停滚动（hover 时） */
.announcement-scroll-container:hover .announcement-scroll-content {
  animation-play-state: paused;
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
  .page-container {
    padding: 12px;
  }
  
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .entry-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .welcome-banner {
    padding: 20px 16px;
  }
  
  .welcome-title {
    font-size: 20px;
    letter-spacing: 2px;
  }
  
  .welcome-text {
    font-size: 14px;
    line-height: 1.6;
  }
  
  .welcome-sub {
    font-size: 12px;
  }
  
  .announcement {
    padding: 12px 14px;
  }
  
  .announcement-header {
    margin-bottom: 8px;
  }
  
  .announcement-scroll-container {
    height: 50px; /* 移动端减小高度 */
  }
  
  .announcement-content {
    font-size: 12px;
    line-height: 1.6;
  }
}
</style>
