<template>
  <PageLayout>
    <div class="fishing-page">
      <div class="page-container">
        <div class="fishing-header">
          <h1 class="page-title">🎣 江湖钓鱼</h1>
          <p class="fishing-desc">垂钓江湖，惊喜无限</p>
        </div>

        <!-- 钓鱼状态 -->
      <div v-if="status" class="fishing-status">
        <!-- 可以钓鱼 -->
        <div v-if="!status.isFishing && status.cooldownRemaining === 0" class="can-fish">
          <div class="fishing-area" @click="startFishing">
            <div class="fishing-icon">🎏</div>
            <p class="fishing-hint">点击开始钓鱼<br><span class="cost">消耗 10 两银子购买鱼饵</span></p>
          </div>
        </div>

        <!-- 钓鱼中 -->
        <div v-else-if="status.isFishing" class="is-fishing">
          <div class="fishing-animation">
            <div class="bobber" :class="{ 'biting': canFinish }">🎣</div>
            <div class="water">
              <div class="wave wave1"></div>
              <div class="wave wave2"></div>
              <div class="wave wave3"></div>
            </div>
            <div v-if="canFinish" class="ready-indicator">
              <span class="pulse-text">✨ 鱼儿上钩了！✨</span>
            </div>
          </div>
          <p class="fishing-message">{{ canFinish ? '快收杆！' : '正在等待鱼儿上钩...' }}</p>
          <button class="btn-finish" @click="finishFishing" :disabled="!canFinish">
            🐟 收杆
          </button>
        </div>

        <!-- 冷却中 -->
        <div v-else class="cooldown">
          <div class="cooldown-icon">⏳</div>
          <p class="cooldown-message">钓鱼需要冷却 30 分钟</p>
          <p class="cooldown-time">请{{ status.cooldownRemaining }}分钟后再试</p>
        </div>
      </div>

      <!-- 钓鱼记录 -->
      <div class="records-section">
        <h2 class="section-title">📋 钓鱼记录</h2>
        <div v-if="records.length === 0" class="empty-records">
          <p>暂无钓鱼记录</p>
        </div>
        <div v-else class="records-list">
          <div v-for="record in records" :key="record.id" class="record-item" :class="record.rarities">
            <div class="record-info">
              <span class="record-name">{{ record.item_name }}</span>
              <span class="record-type">{{ record.item_type }}</span>
              <span class="record-rarity">{{ getRarityName(record.rarities) }}</span>
            </div>
            <div class="record-effect">
              <span v-if="record.effect_neili">内力{{ record.effect_neili > 0 ? '+' : ''}}{{ record.effect_neili }}</span>
              <span v-if="record.effect_tili">体力{{ record.effect_tili > 0 ? '+' : ''}}{{ record.effect_tili }}</span>
              <span v-if="record.silver_reward">银子 +{{ record.silver_reward }}</span>
            </div>
            <span class="record-time">{{ formatDate(record.fished_at) }}</span>
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
const isFishing = ref(false)
const fishTimer = ref(null)

const canFinish = computed(() => {
  return isFishing.value
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
    const res = await api.get('/fishing/status')
    if (res.success) {
      status.value = res.data
      isFishing.value = res.data.isFishing
      
      if (res.data.isFishing) {
        startFinishTimer()
      }
    }
  } catch (err) {
    console.error('Load fishing status failed:', err)
  }
}

async function loadRecords() {
  try {
    const res = await api.get('/fishing/records')
    if (res.success) {
      records.value = res.data || []
    }
  } catch (err) {
    console.error('Load records failed:', err)
  }
}

function startFinishTimer() {
  // 随机钓鱼时间（3-8 秒）
  const minTime = status.value?.minTime || 3000
  const maxTime = status.value?.maxTime || 8000
  const fishTime = Math.floor(Math.random() * (maxTime - minTime)) + minTime
  
  if (fishTimer.value) clearTimeout(fishTimer.value)
  
  fishTimer.value = setTimeout(() => {
    // 可以收杆了
  }, fishTime)
}

async function startFishing() {
  try {
    const res = await api.post('/fishing/start')
    if (res.success) {
      status.value = { isFishing: true }
      isFishing.value = true
      startFinishTimer()
      alert('✅ ' + res.message)
    } else {
      alert('❌ ' + (res.message || '开始钓鱼失败'))
    }
  } catch (err) {
    alert('❌ ' + (err.message || '开始钓鱼失败'))
  }
}

async function finishFishing() {
  try {
    const res = await api.post('/fishing/finish')
    if (res.success) {
      alert('✅ ' + res.message)
      status.value = { isFishing: false, cooldownRemaining: 30 }
      isFishing.value = false
      if (fishTimer.value) clearTimeout(fishTimer.value)
      await loadRecords()
      await userStore.fetchProfile()
    } else {
      alert('❌ ' + (res.message || '完成钓鱼失败'))
    }
  } catch (err) {
    alert('❌ ' + (err.message || '完成钓鱼失败'))
  }
}

onMounted(() => {
  loadStatus()
  loadRecords()
})
</script>

<style scoped>
.fishing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0c1929 0%, #1a365d 100%);
  padding: 0 0 20px 0;
}

.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.fishing-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  color: #7eb8da;
  font-size: 32px;
  margin: 0 0 10px 0;
}

.fishing-desc {
  color: #a0aec0;
  font-size: 14px;
  margin: 0;
}

.fishing-area {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 20px;
  padding: 60px 40px;
  text-align: center;
  cursor: pointer;
  border: 2px solid rgba(75, 135, 195, 0.3);
  transition: all 0.3s;
  margin: 0 auto;
  max-width: 400px;
}

.fishing-area:hover {
  transform: translateY(-5px);
  border-color: #4a90e2;
  box-shadow: 0 8px 30px rgba(74, 144, 226, 0.3);
}

.fishing-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.fishing-hint {
  color: #e0e0e0;
  font-size: 16px;
  line-height: 1.8;
  margin: 0;
}

.cost {
  color: #f0c040;
  font-size: 14px;
}

.fishing-animation {
  text-align: center;
  padding: 40px;
}

.bobber {
  font-size: 60px;
  animation: bob 2s ease-in-out infinite;
  display: inline-block;
}

@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(20px); }
}

.bobber.biting {
  animation: bite 0.3s ease-in-out infinite;
}

@keyframes bite {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.2) rotate(-10deg); }
  75% { transform: scale(1.2) rotate(10deg); }
}

.ready-indicator {
  margin-top: 20px;
  padding: 15px 30px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 20px;
  display: inline-block;
  animation: pulse-bg 1s ease-in-out infinite;
}

.pulse-text {
  color: white;
  font-size: 18px;
  font-weight: bold;
  animation: pulse-text 0.5s ease-in-out infinite;
}

@keyframes pulse-bg {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes pulse-text {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.water {
  position: relative;
  height: 100px;
  margin-top: 40px;
  overflow: hidden;
}

.wave {
  position: absolute;
  width: 200%;
  height: 60px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 88.7'%3E%3Cpath d='M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.8h800v-.2-31.6z' fill='%234A90E2'/%3E%3C/svg%3E");
  opacity: 0.3;
  animation: wave 3s linear infinite;
}

.wave1 { bottom: 0; animation-delay: 0s; }
.wave2 { bottom: 20px; animation-delay: 1s; }
.wave3 { bottom: 40px; animation-delay: 2s; }

@keyframes wave {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.fishing-message {
  color: #7eb8da;
  margin-top: 30px;
  font-size: 16px;
}

.btn-finish {
  margin-top: 30px;
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
  border: none;
  padding: 15px 40px;
  border-radius: 10px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-finish:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(46, 204, 113, 0.4);
}

.btn-finish:disabled {
  background: #4a5568;
  cursor: not-allowed;
}

.cooldown {
  text-align: center;
  padding: 60px;
}

.cooldown-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.cooldown-message {
  color: #e0e0e0;
  font-size: 16px;
  margin: 0 0 10px 0;
}

.cooldown-time {
  color: #f0c040;
  font-size: 18px;
  font-weight: bold;
}

.records-section {
  margin-top: 50px;
}

.section-title {
  color: #7eb8da;
  font-size: 20px;
  margin-bottom: 20px;
  text-align: center;
}

.empty-records {
  text-align: center;
  color: #718096;
  padding: 40px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-item {
  background: rgba(45, 55, 72, 0.8);
  border-radius: 10px;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid rgba(75, 135, 195, 0.2);
}

.record-item.legendary { border-color: #ffd700; background: rgba(255, 215, 0, 0.1); }
.record-item.epic { border-color: #a855f7; background: rgba(168, 85, 247, 0.1); }
.record-item.rare { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
.record-item.uncommon { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); }

.record-info {
  display: flex;
  gap: 10px;
  align-items: center;
}

.record-name {
  color: #e0e0e0;
  font-weight: bold;
}

.record-type {
  color: #7eb8da;
  font-size: 12px;
  padding: 2px 8px;
  background: rgba(126, 184, 218, 0.2);
  border-radius: 4px;
}

.record-rarity {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  color: white;
}

.legendary .record-rarity { background: #ffd700; color: #000; }
.epic .record-rarity { background: #a855f7; }
.rare .record-rarity { background: #3b82f6; }
.uncommon .record-rarity { background: #22c55e; }

.record-effect {
  color: #a0aec0;
  font-size: 13px;
}

.record-time {
  color: #718096;
  font-size: 12px;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }
  
  .record-item {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
}
</style>
