<template>
  <div class="rankings-page">
    <div class="nav-bar">
      <router-link to="/main">首页</router-link>
      <router-link to="/chat">聊天</router-link>
      <span class="nav-spacer"></span>
      <router-link to="/profile">{{ userStore.username }}</router-link>
    </div>

    <div class="page-container">
      <div class="title-bar">
        <h1>排行榜</h1>
      </div>

      <div class="rank-tabs">
        <span
          v-for="tab in rankTypes"
          :key="tab.key"
          :class="['rank-tab', { active: currentRank === tab.key }]"
          @click="switchRank(tab.key)"
        >{{ tab.label }}</span>
      </div>

      <div class="rank-table">
        <div class="rank-header">
          <span class="rank-col-rank">排名</span>
          <span class="rank-col-name">侠名</span>
          <span class="rank-col-value">{{ currentRankLabel }}</span>
        </div>
        <div v-for="(item, idx) in rankings" :key="item.username || idx" class="rank-row">
          <span :class="['rank-col-rank', 'rank-num', { 'rank-top': idx < 3 }]">{{ idx + 1 }}</span>
          <span class="rank-col-name">{{ item.username }}</span>
          <span class="rank-col-value">{{ item.value }}</span>
        </div>
        <div v-if="rankings.length === 0" class="empty-text">暂无排行数据</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const userStore = useUserStore()

const rankTypes = [
  { key: 'wugong', label: '武功' },
  { key: 'neili', label: '内力' },
  { key: 'tili', label: '体力' },
  { key: 'silver', label: '银两' },
  { key: 'charm', label: '魅力' },
  { key: 'attack', label: '攻击' },
  { key: 'defense', label: '防御' },
  { key: 'grade', label: '等级' }
]

const currentRank = ref('wugong')
const rankings = ref([])

const currentRankLabel = computed(() => {
  const t = rankTypes.find(r => r.key === currentRank.value)
  return t ? t.label : ''
})

async function switchRank(key) {
  currentRank.value = key
  await loadRankings(key)
}

async function loadRankings(type) {
  try {
    const res = await api.get('/misc/rankings', { params: { type } })
    if (res.success) rankings.value = res.data || []
  } catch (e) {
    rankings.value = []
  }
}

loadRankings('wugong')
</script>

<style scoped>
.rank-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.rank-tab {
  padding: 10px 16px;
  cursor: pointer;
  color: #888;
  font-size: 14px;
  transition: all 0.2s;
  white-space: nowrap;
}

.rank-tab.active {
  color: #7eb8da;
  border-bottom: 2px solid #4B87C3;
}

.rank-tab:hover {
  color: #ccc;
}

.rank-table {
  display: flex;
  flex-direction: column;
}

.rank-header {
  display: flex;
  padding: 10px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: bold;
  color: #888;
  font-size: 13px;
}

.rank-row {
  display: flex;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.15s;
}

.rank-row:hover {
  background: rgba(75, 135, 195, 0.1);
}

.rank-col-rank {
  width: 60px;
}

.rank-col-name {
  flex: 1;
  color: #7eb8da;
}

.rank-col-value {
  width: 120px;
  text-align: right;
  color: #f0c040;
}

.rank-num {
  font-weight: bold;
  color: #888;
}

.rank-top {
  color: #f0c040;
  font-size: 16px;
}

.empty-text {
  text-align: center;
  color: #666;
  padding: 30px;
}

.nav-spacer {
  flex: 1;
}
</style>
