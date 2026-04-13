<template>
  <div class="main-page">
    <div class="nav-bar">
      <router-link to="/main" class="active">首页</router-link>
      <router-link to="/chat">聊天</router-link>
      <router-link to="/messages">邮件</router-link>
      <router-link to="/sect">门派</router-link>
      <router-link to="/skills">武功</router-link>
      <router-link to="/items">物品</router-link>
      <router-link to="/games">游戏</router-link>
      <router-link to="/rankings">排行</router-link>
      <router-link v-if="userStore.isAdmin" to="/admin">管理后台</router-link>
      <span class="nav-spacer"></span>
      <span class="nav-user" @click="$router.push('/profile')">{{ userStore.username }}</span>
      <span class="nav-logout" @click="handleLogout">退出</span>
    </div>

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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const router = useRouter()
const userStore = useUserStore()

const announcement = ref('')
const onlineUsers = ref([])

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

.nav-spacer {
  flex: 1;
}

.nav-user {
  color: #7eb8da;
  cursor: pointer;
  padding: 10px 12px;
  white-space: nowrap;
}

.nav-user:hover {
  color: #a0d4ef;
}

.nav-logout {
  color: #e74c3c;
  cursor: pointer;
  padding: 10px 12px;
  white-space: nowrap;
  font-size: 13px;
}

.nav-logout:hover {
  color: #ff6b6b;
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
