<template>
  <div class="sect-page">
    <div class="nav-bar">
      <router-link to="/main">首页</router-link>
      <router-link to="/chat">聊天</router-link>
      <span class="nav-spacer"></span>
      <router-link to="/profile">{{ userStore.username }}</router-link>
    </div>

    <div class="page-container">
      <div class="title-bar">
        <h1>门派</h1>
      </div>

      <div v-if="!selectedSect" class="sect-list">
        <div v-for="s in sects" :key="s.name" class="sect-card card" @click="viewSect(s.name)">
          <div class="sect-name">{{ s.name }}</div>
          <div class="sect-info">
            <span>掌门: {{ s.leader || '无' }}</span>
            <span>成员: {{ s.member_count || 0 }}</span>
          </div>
        </div>
        <div v-if="sects.length === 0" class="empty-text">暂无门派</div>
      </div>

      <div v-else class="sect-detail">
        <button class="btn btn-sm" @click="selectedSect = null">返回列表</button>
        <div class="card" v-if="sectDetail">
          <h2 class="sect-title">{{ sectDetail.name }}</h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">掌门</span>
              <span class="value">{{ sectDetail.leader || '无' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">成员数</span>
              <span class="value">{{ sectDetail.member_count || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="label">性别限制</span>
              <span class="value">{{ genderText(sectDetail.fit_gender) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">介绍</span>
              <span class="value">{{ sectDetail.description || '暂无' }}</span>
            </div>
          </div>
          <div class="sect-actions">
            <button v-if="userSect !== sectDetail.name" class="btn btn-primary" @click="joinSect(sectDetail.name)">加入门派</button>
            <button v-if="userSect === sectDetail.name" class="btn btn-danger" @click="leaveSect">离开门派</button>
          </div>
        </div>

        <div class="card">
          <h3 class="section-title">门派成员</h3>
          <div class="member-list">
            <div v-for="m in sectMembers" :key="m.username" class="member-item">
              <span class="member-name">{{ m.username }}</span>
              <span class="member-title">{{ m.sect_title }}</span>
              <span class="member-grade">等级{{ m.grade }}</span>
            </div>
            <div v-if="sectMembers.length === 0" class="empty-text">暂无成员</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const userStore = useUserStore()

const sects = ref([])
const selectedSect = ref(null)
const sectDetail = ref(null)
const sectMembers = ref([])

const userSect = computed(() => userStore.profile?.sect || userStore.user?.sect || '无')

function genderText(g) {
  if (g === 'male') return '仅男性'
  if (g === 'female') return '仅女性'
  return '不限'
}

async function loadSects() {
  try {
    const res = await api.get('/sects')
    if (res.success) sects.value = res.data || []
  } catch (e) {}
}

async function viewSect(name) {
  selectedSect.value = name
  try {
    const res = await api.get(`/sects/${name}`)
    if (res.success) sectDetail.value = res.data
  } catch (e) {}
  try {
    const res = await api.get(`/sects/${name}/members`)
    if (res.success) sectMembers.value = res.data || []
  } catch (e) {}
}

async function joinSect(name) {
  try {
    const res = await api.post('/commands/join-sect', { target: name })
    if (res.success) {
      await userStore.fetchProfile()
      viewSect(name)
    } else {
      alert(res.message || '加入失败')
    }
  } catch (err) {
    alert(err.message || '加入失败')
  }
}

async function leaveSect() {
  if (!confirm('离开门派需扣除5万两和500内力，确定离开？')) return
  try {
    const res = await api.post('/commands/leave-sect')
    if (res.success) {
      await userStore.fetchProfile()
      selectedSect.value = null
      loadSects()
    } else {
      alert(res.message || '离开失败')
    }
  } catch (err) {
    alert(err.message || '离开失败')
  }
}

onMounted(() => {
  loadSects()
})
</script>

<style scoped>
.section-title {
  color: #7eb8da;
  font-size: 16px;
  margin-bottom: 12px;
  border-left: 3px solid #4B87C3;
  padding-left: 10px;
}

.sect-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.sect-card {
  cursor: pointer;
  transition: all 0.2s;
}

.sect-card:hover {
  border-color: #4B87C3;
  transform: translateY(-2px);
}

.sect-name {
  color: #7eb8da;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

.sect-info {
  display: flex;
  gap: 16px;
  color: #aaa;
  font-size: 13px;
}

.sect-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sect-title {
  color: #7eb8da;
  font-size: 22px;
  margin-bottom: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-item .label {
  color: #888;
  font-size: 12px;
}

.detail-item .value {
  color: #eee;
  font-size: 14px;
}

.sect-actions {
  display: flex;
  gap: 10px;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.member-name {
  color: #7eb8da;
  font-size: 14px;
}

.member-title {
  color: #f0c040;
  font-size: 13px;
}

.member-grade {
  color: #888;
  font-size: 12px;
  margin-left: auto;
}

.empty-text {
  text-align: center;
  color: #666;
  padding: 20px;
}

.nav-spacer {
  flex: 1;
}
</style>
