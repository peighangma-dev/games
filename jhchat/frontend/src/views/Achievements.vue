<template>
  <PageLayout>
    <div class="achievement-page">
      <div class="page-header">
        <h1 class="page-title">🏅 成就系统</h1>
        <p class="page-desc">完成挑战，收集成就，赢取奖励</p>
      </div>

      <!-- 成就点数统计 -->
      <div class="stats-summary" v-if="stats">
        <div class="stat-card">
          <span class="stat-label">总成就点数</span>
          <span class="stat-value">{{ totalPoints }} / {{ stats.totalPoints || 0 }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">炼丹</span>
          <span class="stat-value">{{ stats.alchemy?.completed || 0 }}/{{ stats.alchemy?.total || 0 }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">钓鱼</span>
          <span class="stat-value">{{ stats.fishing?.completed || 0 }}/{{ stats.fishing?.total || 0 }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">挖矿</span>
          <span class="stat-value">{{ stats.mining?.completed || 0 }}/{{ stats.mining?.total || 0 }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">狩猎</span>
          <span class="stat-value">{{ stats.hunting?.completed || 0 }}/{{ stats.hunting?.total || 0 }}</span>
        </div>
      </div>

      <!-- 成就分类 Tabs -->
      <div class="category-tabs">
        <button 
          v-for="cat in categories" 
          :key="cat.id"
          :class="['tab-btn', { active: currentCategory === cat.id }]"
          @click="currentCategory = cat.id"
        >
          {{ cat.icon }} {{ cat.name }}
        </button>
      </div>

      <!-- 成就列表 -->
      <div class="achievement-list">
        <div v-if="loading" class="loading">加载中...</div>
        
        <div v-else-if="filteredAchievements.length === 0" class="empty">
          暂无成就
        </div>
        
        <div v-for="ach in filteredAchievements" :key="ach.id" class="achievement-card" :class="{ completed: ach.is_completed, claimed: ach.claimed }">
          <div class="ach-header">
            <span class="ach-icon">{{ ach.icon || '⭐' }}</span>
            <div class="ach-info">
              <h3 class="ach-name">{{ ach.name }}</h3>
              <p class="ach-desc">{{ ach.description }}</p>
            </div>
          </div>
          
          <div class="ach-progress">
            <div class="progress-value">{{ ach.progress || 0 }} / {{ ach.requirement_value }}</div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: Math.min(100, (ach.progress || 0) / ach.requirement_value * 100) + '%' }"></div>
            </div>
          </div>
          
          <div class="ach-rewards">
            <span v-if="ach.reward_silver" class="reward">💰 {{ ach.reward_silver }}两</span>
            <span v-if="ach.reward_exp" class="reward">✨ {{ ach.reward_exp }} exp</span>
            <span v-if="ach.reward_item" class="reward rare">🎁 {{ ach.reward_item }}</span>
            <span class="reward points">🏆 {{ ach.points }} 点数</span>
          </div>
          
          <button 
            v-if="ach.is_completed && !ach.claimed" 
            class="btn-claim" 
            @click="claimReward(ach)"
          >
            🎁 领取奖励
          </button>
          <div v-else-if="ach.claimed" class="claimed-badge">✅ 已领取</div>
          <div v-else class="locked-badge">🔒 未完成</div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'
import PageLayout from '../components/PageLayout.vue'

const userStore = useUserStore()
const loading = ref(false)
const currentCategory = ref('all')
const achievements = ref([])
const stats = ref(null)
const progress = ref(null)

const categories = [
  { id: 'all', name: '全部', icon: '📋' },
  { id: 'alchemy', name: '炼丹', icon: '🧪' },
  { id: 'fishing', name: '钓鱼', icon: '🎣' },
  { id: 'mining', name: '挖矿', icon: '⛏️' },
  { id: 'hunting', name: '狩猎', icon: '🏹' },
  { id: 'combat', name: '战斗', icon: '⚔️' },
  { id: 'social', name: '社交', icon: '👥' }
]

const filteredAchievements = computed(() => {
  if (currentCategory.value === 'all') return achievements.value
  return achievements.value.filter(ach => ach.category === currentCategory.value)
})

const totalPoints = computed(() => {
  return achievements.value
    .filter(ach => ach.is_completed)
    .reduce((sum, ach) => sum + ach.points, 0)
})

async function loadAchievements() {
  loading.value = true
  try {
    const res = await api.get('/achievements/my')
    if (res.success) {
      stats.value = res.data.stats
      progress.value = res.data.progress
      // 合并成就定义和用户进度
      const allDefs = await api.get('/achievements/definitions')
      if (allDefs.success) {
        achievements.value = allDefs.data.map(def => {
          const userAch = res.data.achievements.find(ua => ua.achievement_id === def.id)
          return {
            ...def,
            progress: userAch?.progress || 0,
            is_completed: userAch?.is_completed || false,
            claimed: userAch?.claimed || false,
            achieved_at: userAch?.achieved_at
          }
        })
      }
    }
  } catch (e) {
    console.error('Load achievements failed:', e)
  } finally {
    loading.value = false
  }
}

async function claimReward(ach) {
  try {
    const res = await api.post('/achievements/claim', { achievementId: ach.id })
    if (res.success) {
      alert(res.message)
      await loadAchievements()
    } else {
      alert('❌ ' + res.message)
    }
  } catch (e) {
    alert('领取失败：' + (e.response?.data?.message || '未知错误'))
  }
}

onMounted(() => {
  loadAchievements()
})
</script>

<style scoped>
.achievement-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #2d1b4e 0%, #1a1f2e 100%);
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

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
}

.stat-card {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 12px;
  padding: 15px;
  text-align: center;
}

.stat-label {
  display: block;
  color: #9ca3af;
  font-size: 13px;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  color: #fbbf24;
  font-size: 20px;
  font-weight: bold;
}

.category-tabs {
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
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border-color: transparent;
}

.achievement-list {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.achievement-card {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s;
}

.achievement-card.completed {
  border-color: rgba(251, 191, 36, 0.5);
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(0, 0, 0, 0.4));
}

.ach-header {
  display: flex;
  gap: 15px;
  align-items: flex-start;
  margin-bottom: 15px;
}

.ach-icon {
  font-size: 40px;
}

.ach-name {
  color: #fbbf24;
  font-size: 16px;
  margin: 0 0 5px 0;
}

.ach-desc {
  color: #9ca3af;
  font-size: 13px;
  margin: 0;
}

.ach-progress {
  margin-bottom: 15px;
}

.progress-value {
  color: #e5e7eb;
  font-size: 14px;
  margin-bottom: 8px;
  text-align: right;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  border-radius: 4px;
  transition: width 0.3s;
}

.ach-rewards {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.reward {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 12px;
  color: #e5e7eb;
}

.reward.points {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.2);
}

.reward.rare {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.2);
}

.btn-claim {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-claim:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.claimed-badge, .locked-badge {
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
}

.claimed-badge {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.locked-badge {
  background: rgba(255, 255, 255, 0.05);
  color: #6b7280;
}

.loading, .empty {
  text-align: center;
  color: #9ca3af;
  padding: 40px;
  grid-column: 1 / -1;
}

@media (max-width: 600px) {
  .achievement-list {
    grid-template-columns: 1fr;
  }
}
</style>
