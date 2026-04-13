<template>
  <div class="wishes-page">
    <div class="nav-bar">
      <router-link to="/main">首页</router-link>
      <router-link to="/chat">聊天</router-link>
      <span class="nav-spacer"></span>
      <router-link to="/profile">{{ userStore.username }}</router-link>
    </div>

    <div class="page-container">
      <div class="title-bar">
        <h1>许愿墙</h1>
      </div>

      <div class="wish-actions" style="margin-bottom: 16px;">
        <button class="btn btn-primary" @click="showNewWish = true">许愿</button>
      </div>

      <div class="wish-grid">
        <div v-for="w in wishes" :key="w.id" class="wish-card card">
          <div class="wish-content">{{ w.content || w.message }}</div>
          <div class="wish-meta">
            <span class="wish-author">{{ w.username }}</span>
            <span class="wish-time">{{ formatTime(w.created_at) }}</span>
          </div>
        </div>
        <div v-if="wishes.length === 0" class="empty-text">暂无许愿</div>
      </div>

      <div v-if="showNewWish" class="modal-overlay" @click.self="showNewWish = false">
        <div class="modal-card card">
          <h3>许下心愿</h3>
          <div class="form-group">
            <textarea v-model="wishContent" rows="4" placeholder="写下你的心愿..."></textarea>
          </div>
          <div v-if="wishError" class="error-msg">{{ wishError }}</div>
          <div class="modal-actions">
            <button class="btn btn-primary" @click="postWish">许愿</button>
            <button class="btn" @click="showNewWish = false">取消</button>
          </div>
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

const wishes = ref([])
const showNewWish = ref(false)
const wishContent = ref('')
const wishError = ref('')

function formatTime(t) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN')
}

async function loadWishes() {
  try {
    const res = await api.get('/misc/wishes')
    if (res.success) wishes.value = res.data || []
  } catch (e) {}
}

async function postWish() {
  if (!wishContent.value.trim()) {
    wishError.value = '请输入心愿内容'
    return
  }
  try {
    const res = await api.post('/misc/wishes', { content: wishContent.value })
    if (res.success) {
      showNewWish.value = false
      wishContent.value = ''
      wishError.value = ''
      loadWishes()
    } else {
      wishError.value = res.message || '许愿失败'
    }
  } catch (err) {
    wishError.value = err.message || '许愿失败'
  }
}

onMounted(() => {
  loadWishes()
})
</script>

<style scoped>
.wish-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.wish-card {
  position: relative;
  overflow: hidden;
}

.wish-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #4B87C3, #4a7c59);
  border-radius: 4px 0 0 4px;
}

.wish-content {
  color: #ccc;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 10px;
  padding-left: 8px;
}

.wish-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding-left: 8px;
}

.wish-author {
  color: #7eb8da;
}

.wish-time {
  color: #666;
}

.wish-actions {
  display: flex;
  justify-content: flex-end;
}

.empty-text {
  text-align: center;
  color: #666;
  padding: 30px;
  grid-column: 1 / -1;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-card {
  width: 420px;
  max-width: 90vw;
}

.modal-card h3 {
  color: #7eb8da;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 14px;
}

.error-msg {
  color: #e74c3c;
  font-size: 13px;
  margin-bottom: 10px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.nav-spacer {
  flex: 1;
}
</style>
