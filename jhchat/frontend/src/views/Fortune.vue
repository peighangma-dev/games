<template>
  <div class="fortune-page">
    <div class="nav-bar">
      <router-link to="/main" class="nav-btn">首页</router-link>
      <router-link to="/chat" class="nav-btn">聊天</router-link>
      <router-link to="/fortune" class="nav-btn active">求签</router-link>
      <router-link to="/fishing" class="nav-btn">钓鱼</router-link>
      <span class="nav-spacer"></span>
      <div class="user-info">
        <span class="silver-badge">💰 {{ userStore.silver }}两</span>
        <router-link to="/profile" class="nav-btn">{{ userStore.username }}</router-link>
      </div>
    </div>

    <div class="page-container">
      <div class="fortune-header">
        <h1 class="page-title">🙏 每日求签</h1>
        <p class="fortune-desc">每日一签，预知今日运势</p>
      </div>

      <!-- 未求签状态 -->
      <div v-if="!fortune.isDrawn" class="fortune-status">
        <div class="fortune-card unopened" @click="drawFortune">
          <div class="card-content">
            <div class="fortune-icon">🎋</div>
            <p class="fortune-hint">点击求签</p>
          </div>
        </div>
        <p class="fortune-tips">每人每天只能求签一次</p>
      </div>

      <!-- 已求签状态 -->
      <div v-else class="fortune-result">
        <div class="fortune-card opened" :style="{ borderColor: fortune.color }">
          <div class="card-header" :style="{ backgroundColor: fortune.color }">
            <span class="fortune-title">{{ fortune.title }}</span>
          </div>
          <div class="card-body">
            <img :src="`/assets/fortune/${fortune.image}`" :alt="fortune.title" class="fortune-image" />
            <p class="fortune-description">{{ fortune.description }}</p>
          </div>
        </div>
        <div class="fortune-actions">
          <button class="btn-refresh" @click="loadFortune">
            🔄 查看今日运势
          </button>
          <p class="fortune-note">明日可再次求签</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const userStore = useUserStore()
const fortune = ref({
  isDrawn: false,
  title: '',
  description: '',
  color: '',
  image: ''
})

async function loadFortune() {
  try {
    const res = await api.get('/fortune/today')
    if (res.success && res.data) {
      fortune.value = res.data
    }
  } catch (err) {
    console.error('Load fortune failed:', err)
  }
}

async function drawFortune() {
  try {
    const res = await api.post('/fortune/draw')
    if (res.success && res.data) {
      fortune.value = res.data
    } else {
      alert('❌ ' + (res.message || '求签失败'))
    }
  } catch (err) {
    alert('❌ ' + (err.message || '求签失败'))
  }
}

onMounted(() => {
  loadFortune()
})
</script>

<style scoped>
.fortune-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%);
  padding: 0 0 20px 0;
}

.nav-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(75, 135, 195, 0.3);
  backdrop-filter: blur(10px);
}

.nav-btn {
  padding: 8px 16px;
  border-radius: 6px;
  text-decoration: none;
  color: #a0aec0;
  font-size: 14px;
  transition: all 0.2s;
  background: transparent;
  border: none;
  cursor: pointer;
}

.nav-btn:hover {
  background: rgba(75, 135, 195, 0.2);
  color: #7eb8da;
}

.nav-btn.active {
  background: #4a90e2;
  color: white;
}

.nav-spacer {
  flex: 1;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.silver-badge {
  background: linear-gradient(135deg, #f0c040, #d4a840);
  color: #1a1f24;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
}

.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.fortune-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  color: #7eb8da;
  font-size: 36px;
  margin: 0 0 10px 0;
  text-shadow: 0 0 20px rgba(126, 184, 218, 0.3);
}

.fortune-desc {
  color: #a0aec0;
  font-size: 16px;
  margin: 0;
}

.fortune-card {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 20px;
  overflow: hidden;
  border: 2px solid rgba(75, 135, 195, 0.3);
  transition: all 0.3s;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  margin: 0 auto;
  max-width: 400px;
}

.fortune-card.unopened {
  cursor: pointer;
  background: linear-gradient(135deg, #742424 0%, #4a2c2c 100%);
}

.fortune-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(74, 144, 226, 0.3);
}

.card-content {
  padding: 100px 40px;
  text-align: center;
}

.fortune-icon {
  font-size: 100px;
  margin-bottom: 20px;
}

.fortune-hint {
  color: #fff;
  font-size: 20px;
  margin: 0;
}

.fortune-card.opened .card-header {
  padding: 20px;
  text-align: center;
}

.fortune-title {
  color: white;
  font-size: 32px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.card-body {
  padding: 30px;
  text-align: center;
}

.fortune-image {
  max-width: 60%;
  margin-bottom: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.fortune-description {
  color: #e0e0e0;
  font-size: 16px;
  line-height: 1.8;
  margin: 0;
}

.fortune-tips {
  text-align: center;
  color: #7eb8da;
  margin-top: 20px;
  font-size: 14px;
}

.fortune-actions {
  text-align: center;
  margin-top: 30px;
}

.btn-refresh {
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
}

.fortune-note {
  color: #718096;
  margin-top: 15px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .nav-bar {
    flex-wrap: wrap;
  }
  
  .user-info {
    width: 100%;
    justify-content: flex-end;
    margin-top: 8px;
  }
  
  .page-title {
    font-size: 28px;
  }
  
  .fortune-icon {
    font-size: 80px;
  }
  
  .fortune-title {
    font-size: 24px;
  }
}
</style>
