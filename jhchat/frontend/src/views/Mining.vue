<template>
  <PageLayout>
    <div class="mining-page">
      <div class="page-container">
        <div class="mining-header">
          <h1 class="page-title">⛏️ 江湖挖矿</h1>
          <p class="mining-desc">挖掘矿石，收集炼丹材料</p>
        </div>

        <!-- 挖矿状态 -->
        <div v-if="status" class="mining-status">
          <!-- 可以挖矿 -->
          <div v-if="!status.isMining && status.cooldownRemaining === 0" class="can-mine">
            <div class="mining-area" @click="startMining">
              <div class="mining-icon">⛏️</div>
              <p class="mining-hint">点击开始挖矿<br><span class="cost">消耗 20 两银子购买工具</span></p>
            </div>
          </div>

          <!-- 挖矿中 -->
          <div v-else-if="status.isMining" class="is-mining">
            <div class="mining-animation">
              <div class="miner">⛏️</div>
              <div class="rock">🪨</div>
              <div class="sparks" v-if="status.isMining">
                <span class="spark spark1">✨</span>
                <span class="spark spark2">✨</span>
                <span class="spark spark3">✨</span>
              </div>
            </div>
            <p class="mining-message">正在挖掘矿石...</p>
            <button class="btn-finish" @click="finishMining" :disabled="!canFinish">
              💎 收获矿石
            </button>
          </div>

          <!-- 冷却中 -->
          <div v-else class="cooldown">
            <div class="cooldown-icon">⏳</div>
            <p class="cooldown-message">挖矿需要冷却 60 分钟</p>
            <p class="cooldown-time">请{{ status.cooldownRemaining }}分钟后再试</p>
          </div>
        </div>

        <!-- 挖矿记录 -->
        <div class="records-section">
          <h2 class="section-title">📋 挖矿记录</h2>
          <div v-if="records.length === 0" class="empty-records">
            <p>暂无挖矿记录</p>
          </div>
          <div v-else class="records-list">
            <div v-for="record in records" :key="record.id" class="record-item" :class="record.rarities">
              <div class="record-info">
                <span class="record-name">{{ record.item_name }} {{ record.item_name.includes('矿石') || record.item_name.includes('金沙') || record.item_name.includes('玉石') || record.item_name.includes('寒铁') ? '💊' : '' }}</span>
                <span class="record-type">{{ record.item_type }}</span>
                <span class="record-rarity">{{ getRarityName(record.rarities) }}</span>
              </div>
              <div class="record-effect">
                <span v-if="record.effect_neili">内力{{ record.effect_neili > 0 ? '+' : ''}}{{ record.effect_neili }}</span>
                <span v-if="record.effect_tili">体力{{ record.effect_tili > 0 ? '+' : ''}}{{ record.effect_tili }}</span>
                <span v-if="record.silver_reward && record.item_type !== '药材'">银子 +{{ record.silver_reward }}</span>
              </div>
              <span class="record-time">{{ formatDate(record.mined_at) }}</span>
            </div>
          </div>
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
const status = ref(null)
const records = ref([])
const isMining = ref(false)

const canFinish = computed(() => {
  return isMining.value
})

function getRarityName(rarity) {
  const names = {
    common: '普通',
    uncommon: '稀有',
    rare: '珍贵',
    epic: '史诗',
    legendary: '传说'
  }
  return names[rarity] || rarity
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

async function loadStatus() {
  try {
    const res = await api.get('/mining/status')
    if (res.success) {
      status.value = res.data
      isMining.value = res.data.isMining
    }
  } catch (e) {
    console.error('Load mining status failed:', e)
  }
}

async function loadRecords() {
  try {
    const res = await api.get('/mining/records')
    if (res.success) {
      records.value = res.data || []
    }
  } catch (e) {
    console.error('Load mining records failed:', e)
  }
}

async function startMining() {
  try {
    const res = await api.post('/mining/start')
    if (res.success) {
      isMining.value = true
      status.value = { isMining: true }
      setTimeout(() => {
        loadStatus()
      }, 1000)
    } else {
      alert(res.message)
    }
  } catch (e) {
    alert('开始挖矿失败：' + (e.response?.data?.message || '未知错误'))
  }
}

async function finishMining() {
  try {
    const res = await api.post('/mining/finish')
    if (res.success) {
      alert(res.message)
      isMining.value = false
      await loadStatus()
      await loadRecords()
      await userStore.fetchProfile()
    } else {
      alert(res.message)
    }
  } catch (e) {
    alert('完成挖矿失败：' + (e.response?.data?.message || '未知错误'))
  }
}

onMounted(() => {
  loadStatus()
  loadRecords()
})
</script>

<style scoped>
.mining-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #2d2416 0%, #1a1f2e 100%);
  padding: 20px;
}

.page-container {
  max-width: 800px;
  margin: 0 auto;
}

.mining-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  color: #f4a460;
  font-size: 32px;
  margin: 0 0 10px 0;
  text-shadow: 0 0 20px rgba(244, 164, 96, 0.3);
}

.mining-desc {
  color: #a0aec0;
  font-size: 14px;
  margin: 0;
}

.mining-status {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  text-align: center;
  border: 1px solid rgba(244, 164, 96, 0.2);
}

.can-mine .mining-area {
  cursor: pointer;
  padding: 40px 20px;
  transition: all 0.3s;
}

.can-mine .mining-area:hover {
  transform: scale(1.05);
}

.mining-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.mining-hint {
  color: #f4a460;
  font-size: 16px;
  line-height: 1.8;
}

.cost {
  color: #a0aec0;
  font-size: 14px;
}

.mining-animation {
  position: relative;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.miner {
  font-size: 60px;
  animation: mine 0.5s infinite alternate;
}

@keyframes mine {
  from { transform: translateY(0) rotate(0deg); }
  to { transform: translateY(20px) rotate(-20deg); }
}

.rock {
  font-size: 70px;
  position: absolute;
  bottom: 20px;
}

.sparks {
  position: absolute;
  width: 100%;
  height: 100%;
}

.spark {
  position: absolute;
  font-size: 20px;
  animation: sparkle 0.3s infinite;
}

.spark1 { left: 40%; top: 40%; animation-delay: 0s; }
.spark2 { left: 50%; top: 30%; animation-delay: 0.1s; }
.spark3 { left: 60%; top: 40%; animation-delay: 0.2s; }

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
}

.mining-message {
  color: #f4a460;
  font-size: 16px;
  margin: 20px 0;
}

.btn-finish {
  padding: 12px 40px;
  background: linear-gradient(135deg, #f4a460, #cd853f);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-finish:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 164, 96, 0.4);
}

.btn-finish:disabled {
  background: #4a5568;
  cursor: not-allowed;
  opacity: 0.7;
}

.cooldown-icon {
  font-size: 60px;
  margin-bottom: 15px;
}

.cooldown-message {
  color: #f4a460;
  font-size: 16px;
  margin: 10px 0;
}

.cooldown-time {
  color: #a0aec0;
  font-size: 14px;
}

.records-section {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(244, 164, 96, 0.2);
}

.section-title {
  color: #f4a460;
  font-size: 20px;
  margin: 0 0 20px 0;
}

.empty-records {
  text-align: center;
  color: #718096;
  padding: 30px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-item.legendary {
  border-left: 4px solid #fbbf24;
  background: rgba(251, 191, 36, 0.1);
}

.record-item.epic {
  border-left: 4px solid #a855f7;
  background: rgba(168, 85, 247, 0.1);
}

.record-item.rare {
  border-left: 4px solid #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.record-item.uncommon {
  border-left: 4px solid #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.record-item.common {
  border-left: 4px solid #6b7280;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.record-name {
  color: #f4a460;
  font-weight: bold;
  font-size: 15px;
}

.record-type {
  color: #718096;
  font-size: 12px;
}

.record-rarity {
  color: #a0aec0;
  font-size: 12px;
}

.record-effect {
  display: flex;
  gap: 15px;
  color: #48bb78;
  font-size: 13px;
}

.record-time {
  color: #718096;
  font-size: 12px;
}
</style>
