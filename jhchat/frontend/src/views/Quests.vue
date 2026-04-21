<template>
  <PageLayout>
    <div class="quest-page">
      <div class="page-header">
        <h1 class="page-title">📜 炼丹任务</h1>
        <p class="page-desc">完成 NPC 发布的任务，获取稀有药材和奖励</p>
      </div>

      <!-- NPC 分类 Tabs -->
      <div class="npc-tabs">
        <button 
          v-for="npc in npcList" 
          :key="npc.id"
          :class="['tab-btn', { active: currentNpc === npc.id }]"
          @click="currentNpc = npc.id"
        >
          {{ npc.icon }} {{ npc.name }}
        </button>
        <button 
          :class="['tab-btn', { active: currentNpc === 'all' }]"
          @click="currentNpc = 'all'"
        >
          📋 全部任务
        </button>
      </div>

      <!-- 任务列表 -->
      <div class="quest-list">
        <div v-if="loading" class="loading">加载中...</div>
        
        <div v-else-if="filteredQuests.length === 0" class="empty">
          暂无任务
        </div>
        
        <div v-for="quest in filteredQuests" :key="quest.id" class="quest-card" :class="{ completed: quest.is_completed, claimed: quest.claimed }">
          <div class="quest-header">
            <span class="quest-npc">{{ quest.npc_icon }} {{ quest.npc_name }}</span>
            <span class="quest-type" :class="quest.quest_type">{{ questTypeMap[quest.quest_type] }}</span>
          </div>
          
          <h3 class="quest-name">{{ quest.title }}</h3>
          <p class="quest-desc">{{ quest.description }}</p>
          
          <div class="quest-requirements">
            <div class="req-item" v-if="quest.require_fish">
              <span class="req-icon">🎣</span>
              <span>钓鱼：{{ quest.user_fish_count || 0 }}/{{ quest.require_fish }}</span>
            </div>
            <div class="req-item" v-if="quest.require_ore">
              <span class="req-icon">⛏️</span>
              <span>矿石：{{ quest.user_ore_count || 0 }}/{{ quest.require_ore }}</span>
            </div>
            <div class="req-item" v-if="quest.require_meat">
              <span class="req-icon">🍖</span>
              <span>兽肉：{{ quest.user_meat_count || 0 }}/{{ quest.require_meat }}</span>
            </div>
            <div class="req-item" v-if="quest.require_stone">
              <span class="req-icon">🪨</span>
              <span>奇石：{{ quest.user_stone_count || 0 }}/{{ quest.require_stone }}</span>
            </div>
            <div class="req-item" v-if="quest.require_alchemy_count">
              <span class="req-icon">🧪</span>
              <span>炼丹：{{ quest.user_alchemy_count || 0 }}/{{ quest.require_alchemy_count }}</span>
            </div>
          </div>
          
          <div class="quest-rewards">
            <span v-if="quest.reward_silver" class="reward">💰 {{ quest.reward_silver }}两</span>
            <span v-if="quest.reward_exp" class="reward">✨ {{ quest.reward_exp }} exp</span>
            <span v-if="quest.reward_item" class="reward rare">🎁 {{ quest.reward_item }}</span>
            <span v-if="quest.reward_contribution" class="reward">🏅 {{ quest.reward_contribution }} 贡献</span>
          </div>
          
          <div class="quest-actions">
            <button 
              v-if="quest.is_completed && !quest.claimed" 
              class="btn-claim" 
              @click="claimReward(quest)"
            >
              🎁 领取奖励
            </button>
            <div v-else-if="quest.claimed" class="claimed-badge">✅ 已领取</div>
            <div v-else class="progress-badge">
              📊 进度：{{ calculateProgress(quest) }}%
            </div>
          </div>
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
const currentNpc = ref('all')
const quests = ref([])

const npcList = [
  { id: 1, name: '张医师', icon: '👨‍⚕️' },
  { id: 2, name: '药王', icon: '🧙' },
  { id: 3, name: '江湖郎中', icon: '🚶' },
  { id: 4, name: '炼丹师', icon: '🔥' }
]

const questTypeMap = {
  daily: '日常任务',
  normal: '普通任务'
}

const filteredQuests = computed(() => {
  if (currentNpc.value === 'all') return quests.value
  return quests.value.filter(q => q.npc_id === currentNpc.value)
})

function calculateProgress(quest) {
  let progress = 0
  let total = 0
  
  if (quest.require_fish) {
    progress += Math.min(quest.user_fish_count || 0, quest.require_fish)
    total += quest.require_fish
  }
  if (quest.require_ore) {
    progress += Math.min(quest.user_ore_count || 0, quest.require_ore)
    total += quest.require_ore
  }
  if (quest.require_meat) {
    progress += Math.min(quest.user_meat_count || 0, quest.require_meat)
    total += quest.require_meat
  }
  if (quest.require_stone) {
    progress += Math.min(quest.user_stone_count || 0, quest.require_stone)
    total += quest.require_stone
  }
  if (quest.require_alchemy_count) {
    progress += Math.min(quest.user_alchemy_count || 0, quest.require_alchemy_count)
    total += quest.require_alchemy_count
  }
  
  return total > 0 ? Math.floor(progress / total * 100) : 0
}

async function loadQuests() {
  loading.value = true
  try {
    const res = await api.get('/quests/my')
    if (res.success) {
      quests.value = res.data
    }
  } catch (e) {
    console.error('Load quests failed:', e)
  } finally {
    loading.value = false
  }
}

async function claimReward(quest) {
  try {
    const res = await api.post('/quests/claim', { questId: quest.id })
    if (res.success) {
      alert('✅ ' + res.message)
      await loadQuests()
    } else {
      alert('❌ ' + res.message)
    }
  } catch (e) {
    alert('领取失败：' + (e.response?.data?.message || '未知错误'))
  }
}

onMounted(() => {
  loadQuests()
})
</script>

<style scoped>
.quest-page {
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

.npc-tabs {
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

.quest-list {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.quest-card {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s;
}

.quest-card.completed {
  border-color: rgba(251, 191, 36, 0.5);
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(0, 0, 0, 0.4));
}

.quest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.quest-npc {
  color: #e5e7eb;
  font-size: 14px;
  font-weight: bold;
}

.quest-type {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.quest-type.daily {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.quest-type.normal {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.quest-name {
  color: #fbbf24;
  font-size: 16px;
  margin: 0 0 10px 0;
}

.quest-desc {
  color: #9ca3af;
  font-size: 13px;
  margin: 0 0 15px 0;
}

.quest-requirements {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 15px;
}

.req-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e5e7eb;
  font-size: 13px;
  margin-bottom: 5px;
}

.req-item:last-child {
  margin-bottom: 0;
}

.req-icon {
  font-size: 16px;
}

.quest-rewards {
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

.reward.rare {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.2);
}

.quest-actions {
  display: flex;
  justify-content: center;
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

.claimed-badge, .progress-badge {
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  width: 100%;
}

.claimed-badge {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.progress-badge {
  background: rgba(255, 255, 255, 0.05);
  color: #60a5fa;
}

.loading, .empty {
  text-align: center;
  color: #9ca3af;
  padding: 40px;
  grid-column: 1 / -1;
}

@media (max-width: 600px) {
  .quest-list {
    grid-template-columns: 1fr;
  }
}
</style>
