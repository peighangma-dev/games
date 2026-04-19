<template>
  <PageLayout>
    <div class="ranking-page">
      <div class="page-header">
        <h1 class="page-title">🏆 江湖排行榜</h1>
        <p class="page-desc">群雄逐鹿，谁与争锋</p>
      </div>

      <!-- 排行榜分类 -->
      <div class="ranking-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab-btn', { active: currentTab === tab.id }]"
          @click="switchTab(tab.id)"
        >
          {{ tab.icon }} {{ tab.name }}
        </button>
      </div>

      <!-- 排行榜列表 -->
      <div class="ranking-container">
        <div v-if="loading" class="loading">加载中...</div>
        
        <div v-else-if="rankingData.length === 0" class="empty">
          暂无数据
        </div>
        
        <div v-else class="ranking-list">
          <!-- 前三名特殊显示 -->
          <div class="top-three">
            <div v-if="rankingData[1]" class="rank-item rank-2">
              <span class="rank-num">2</span>
              <span class="medal">🥈</span>
              <span class="username">{{ rankingData[1].username }}</span>
              <span class="value">{{ formatValue(rankingData[1]) }}</span>
            </div>
            <div v-if="rankingData[0]" class="rank-item rank-1">
              <span class="rank-num">1</span>
              <span class="medal">🥇</span>
              <span class="username">{{ rankingData[0].username }}</span>
              <span class="value">{{ formatValue(rankingData[0]) }}</span>
            </div>
            <div v-if="rankingData[2]" class="rank-item rank-3">
              <span class="rank-num">3</span>
              <span class="medal">🥉</span>
              <span class="username">{{ rankingData[2].username }}</span>
              <span class="value">{{ formatValue(rankingData[2]) }}</span>
            </div>
          </div>

          <!-- 4-20 名 -->
          <div class="normal-ranks">
            <div 
              v-for="(item, index) in rankingData.slice(3)" 
              :key="item.rank"
              class="rank-item"
              :class="{ 'is-me': item.username === userStore.username }"
            >
              <span class="rank-num">{{ index + 4 }}</span>
              <span class="username">{{ item.username }}</span>
              <span v-if="item.sect" class="sect">{{ item.sect }}</span>
              <span class="value">{{ formatValue(item) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 我的排名 -->
      <div v-if="myRank" class="my-rank">
        <div class="my-rank-card">
          <span class="my-label">我的排名</span>
          <span class="my-rank-num">#{{ myRank.rank }}</span>
          <span class="my-value">{{ formatValue(myRank) }}</span>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'
import PageLayout from '../components/PageLayout.vue'

const userStore = useUserStore()
const currentTab = ref('comprehensive')
const rankingData = ref([])
const loading = ref(false)
const myRank = ref(null)

const tabs = [
  { id: 'comprehensive', name: '综合', icon: '👑' },
  { id: 'wealth', name: '财富', icon: '💰' },
  { id: 'neili', name: '内力', icon: '💪' },
  { id: 'wugong', name: '武功', icon: '⚔️' },
  { id: 'alchemy', name: '炼丹', icon: '🧪' },
  { id: 'fishing', name: '钓鱼', icon: '🎣' },
  { id: 'mining', name: '挖矿', icon: '⛏️' },
  { id: 'hunting', name: '狩猎', icon: '🏹' }
]

function formatValue(item) {
  switch (currentTab.value) {
    case 'comprehensive':
      return `总分 ${item.totalScore?.toLocaleString()}`
    case 'wealth':
      return `${item.value?.toLocaleString()} 两`
    case 'neili':
      return `内力 ${item.value?.toLocaleString()}`
    case 'wugong':
      return `武功 ${item.value?.toLocaleString()}`
    case 'alchemy':
      return `炼制 ${item.craftCount} 次`
    case 'fishing':
      return `总价值：${item.total_value?.toLocaleString()}两${item.rare_count ? `(稀有 x${item.rare_count})` : ''}${item.shenpin_count ? `(神品 x${item.shenpin_count})` : ''}`
    case 'mining':
      return `挖矿 ${item.mineCount} 次${item.legendaryCount ? `(传说 x${item.legendaryCount})` : ''}`
    case 'hunting':
      return `狩猎 ${item.huntCount} 次${item.legendaryCount ? `(传说 x${item.legendaryCount})` : ''}`
    default:
      return ''
  }
}

async function loadRanking() {
  loading.value = true
  try {
    const res = await api.get(`/rankings/${currentTab.value}`)
    if (res.success) {
      rankingData.value = res.data
      myRank.value = res.data.find(item => item.username === userStore.username) || null
    }
  } catch (e) {
    console.error('Load ranking failed:', e)
  } finally {
    loading.value = false
  }
}

function switchTab(tabId) {
  currentTab.value = tabId
  loadRanking()
}

onMounted(() => {
  loadRanking()
})
</script>

<style scoped>
.ranking-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  color: #fbbf24;
  font-size: 32px;
  margin: 0 0 10px 0;
  text-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
}

.page-desc {
  color: #9ca3af;
  font-size: 14px;
  margin: 0;
}

.ranking-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 30px;
}

.tab-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: #e5e7eb;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tab-btn.active {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  border-color: transparent;
}

.ranking-container {
  max-width: 800px;
  margin: 0 auto;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.loading, .empty {
  text-align: center;
  color: #9ca3af;
  padding: 40px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
}

.top-three {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  padding: 20px 0;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(251, 191, 36, 0.2);
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  min-width: 150px;
}

.rank-1 {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2));
  border: 2px solid #fbbf24;
  transform: scale(1.05);
}

.rank-2 {
  background: linear-gradient(135deg, rgba(194, 194, 194, 0.2), rgba(158, 158, 158, 0.2));
  border: 2px solid #9ca3af;
}

.rank-3 {
  background: linear-gradient(135deg, rgba(184, 134, 11, 0.2), rgba(146, 102, 20, 0.2));
  border: 2px solid #b45309;
}

.rank-num {
  font-size: 18px;
  font-weight: bold;
  color: #fbbf24;
  min-width: 30px;
}

.medal {
  font-size: 32px;
}

.username {
  color: #fbbf24;
  font-weight: bold;
  flex: 1;
}

.sect {
  color: #9ca3af;
  font-size: 12px;
}

.value {
  color: #4ade80;
  font-size: 14px;
  font-weight: bold;
}

.normal-ranks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.normal-ranks .rank-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.normal-ranks .rank-num {
  font-size: 16px;
  color: #9ca3af;
}

.rank-item.is-me {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
}

.my-rank {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
}

.my-rank-card {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  padding: 12px 30px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
}

.my-label {
  opacity: 0.9;
  font-size: 14px;
}

.my-rank-num {
  font-size: 20px;
  font-weight: bold;
}

.my-value {
  opacity: 0.9;
  font-size: 14px;
}

@media (max-width: 768px) {
  .top-three {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }
  
  .rank-item {
    width: 100%;
    justify-content: center;
  }
  
  .rank-1 { order: 1; }
  .rank-2 { order: 2; }
  .rank-3 { order: 3; }
}
</style>
