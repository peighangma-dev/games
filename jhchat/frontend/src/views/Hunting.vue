<template>
  <PageLayout>
    <div class="hunting-page">
      <div class="page-container">
        <div class="hunting-header">
          <h1 class="page-title">🏹 江湖狩猎</h1>
          <p class="hunting-desc">打工赚银两，打猎得药材</p>
        </div>

        <!-- 状态显示 -->
        <div v-if="status" class="hunting-status">
          <!-- 打工状态 -->
          <div class="work-section">
            <h2 class="section-title">💼 打工赚钱</h2>
            <div v-if="status.isWorking" class="is-working">
              <div class="working-animation">
                <span class="worker">👷</span>
                <span class="work-tool">🔨</span>
              </div>
              <p class="working-message">正在{{ currentJob }}...</p>
              <button class="btn-finish" @click="finishWork" :disabled="!canWork">
                💰 领取工钱
              </button>
            </div>
            <div v-else-if="status.workCooldown > 0" class="cooldown">
              <span class="cooldown-icon">⏳</span>
              <p class="cooldown-message">打工需要休息</p>
              <p class="cooldown-time">请{{ status.workCooldown }}分钟后再来</p>
            </div>
            <div v-else class="can-work" @click="startWork">
              <div class="work-icon">🏪</div>
              <p class="work-hint">点击开始打工<br><span class="cost">冷却时间 30 分钟</span></p>
            </div>
          </div>

          <!-- 打猎状态 -->
          <div class="hunt-section">
            <h2 class="section-title">🏹 打猎采集</h2>
            <div v-if="status.isHunting" class="is-hunting">
              <div class="hunting-animation">
                <span class="hunter">🏹</span>
                <span class="prey">🐅</span>
              </div>
              <p class="hunting-message">正在追踪猎物...</p>
              <button class="btn-finish" @click="finishHunt" :disabled="!canHunt">
                🎯 收获猎物
              </button>
            </div>
            <div v-else-if="status.huntCooldown > 0" class="cooldown">
              <span class="cooldown-icon">⏳</span>
              <p class="cooldown-message">打猎需要冷却 120 分钟</p>
              <p class="cooldown-time">请{{ status.huntCooldown }}分钟后再来</p>
            </div>
            <div v-else class="can-hunt" @click="startHunt">
              <div class="hunt-icon">🌲</div>
              <p class="hunt-hint">点击开始打猎<br><span class="cost">消耗 200 点体力</span></p>
            </div>
          </div>
        </div>

        <!-- 狩猎记录 -->
        <div class="records-section">
          <h2 class="section-title">📋 狩猎记录</h2>
          <div v-if="records.length === 0" class="empty-records">
            <p>暂无狩猎记录</p>
          </div>
          <div v-else class="records-list">
            <div v-for="record in records" :key="record.id" class="record-item" :class="[record.type, record.rarities]">
              <div class="record-header">
                <span class="record-type-badge">{{ record.type === 'work' ? '打工' : '打猎' }}</span>
                <span class="record-name">{{ record.type === 'work' ? record.job_name : record.item_name }}</span>
                <span v-if="record.type === 'hunt'" class="record-rarity">{{ getRarityName(record.rarities) }}</span>
              </div>
              <div class="record-reward">
                <span v-if="record.reward_silver > 0">银子 +{{ record.reward_silver }}</span>
                <span v-if="record.reward_exp > 0">经验 +{{ record.reward_exp }}</span>
              </div>
              <span class="record-time">{{ formatDate(record.completed_at) }}</span>
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
const currentJob = ref('')

const canWork = computed(() => status.value?.isWorking)
const canHunt = computed(() => status.value?.isHunting)

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
    const res = await api.get('/hunting/status')
    if (res.success) {
      status.value = res.data
    }
  } catch (e) {
    console.error('Load hunting status failed:', e)
  }
}

async function loadRecords() {
  try {
    const res = await api.get('/hunting/records')
    if (res.success) {
      records.value = res.data || []
    }
  } catch (e) {
    console.error('Load hunting records failed:', e)
  }
}

async function startWork() {
  try {
    const res = await api.post('/hunting/work/start')
    if (res.success) {
      currentJob.value = res.job?.name || '打工'
      await loadStatus()
      setTimeout(() => {
        if (status.value?.isWorking) {
          finishWork()
        }
      }, res.duration || 3000)
    } else {
      alert(res.message)
    }
  } catch (e) {
    alert('开始打工失败：' + (e.response?.data?.message || '未知错误'))
  }
}

async function finishWork() {
  try {
    const res = await api.post('/hunting/work/finish')
    if (res.success) {
      alert(res.message)
      await loadStatus()
      await loadRecords()
      await userStore.fetchProfile()
    } else {
      alert(res.message)
    }
  } catch (e) {
    alert('完成打工失败：' + (e.response?.data?.message || '未知错误'))
  }
}

async function startHunt() {
  try {
    const res = await api.post('/hunting/hunt/start')
    if (res.success) {
      await loadStatus()
      setTimeout(() => {
        if (status.value?.isHunting) {
          finishHunt()
        }
      }, res.duration || 5000)
    } else {
      alert(res.message)
    }
  } catch (e) {
    alert('开始打猎失败：' + (e.response?.data?.message || '未知错误'))
  }
}

async function finishHunt() {
  try {
    const res = await api.post('/hunting/hunt/finish')
    if (res.success) {
      alert(res.message)
      await loadStatus()
      await loadRecords()
      await userStore.fetchProfile()
    } else {
      alert(res.message)
    }
  } catch (e) {
    alert('完成打猎失败：' + (e.response?.data?.message || '未知错误'))
  }
}

onMounted(() => {
  loadStatus()
  loadRecords()
})
</script>

<style scoped>
.hunting-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #2c5530 0%, #1a1f2e 100%);
  padding: 20px;
}

.page-container {
  max-width: 900px;
  margin: 0 auto;
}

.hunting-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  color: #4ade80;
  font-size: 32px;
  margin: 0 0 10px 0;
  text-shadow: 0 0 20px rgba(74, 222, 128, 0.3);
}

.hunting-desc {
  color: #a0aec0;
  font-size: 14px;
  margin: 0;
}

.hunting-status {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.work-section, .hunt-section {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(74, 222, 128, 0.2);
  text-align: center;
}

.section-title {
  color: #4ade80;
  font-size: 18px;
  margin: 0 0 20px 0;
}

.work-icon, .hunt-icon {
  font-size: 80px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: transform 0.3s;
}

.work-icon:hover, .hunt-icon:hover {
  transform: scale(1.1);
}

.work-hint, .hunt-hint {
  color: #4ade80;
  font-size: 16px;
  line-height: 1.8;
}

.cost {
  color: #a0aec0;
  font-size: 14px;
}

.working-animation, .hunting-animation {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
  font-size: 60px;
}

.worker, .hunter {
  animation: work 0.5s infinite alternate;
}

@keyframes work {
  from { transform: rotate(-10deg); }
  to { transform: rotate(10deg); }
}

.working-message, .hunting-message {
  color: #4ade80;
  font-size: 16px;
  margin: 15px 0;
}

.btn-finish {
  padding: 12px 40px;
  background: linear-gradient(135deg, #4ade80, #22c55e);
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
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.4);
}

.btn-finish:disabled {
  background: #4a5568;
  cursor: not-allowed;
  opacity: 0.7;
}

.cooldown {
  padding: 30px;
}

.cooldown-icon {
  font-size: 60px;
  display: block;
  margin-bottom: 15px;
}

.cooldown-message {
  color: #4ade80;
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
  border: 1px solid rgba(74, 222, 128, 0.2);
}

.section-title {
  color: #4ade80;
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

.record-item.work {
  border-left: 4px solid #fbbf24;
}

.record-item.hunt {
  border-left: 4px solid #4ade80;
}

.record-item.legendary {
  background: rgba(251, 191, 36, 0.15);
}

.record-item.epic {
  background: rgba(168, 85, 247, 0.15);
}

.record-item.rare {
  background: rgba(59, 130, 246, 0.15);
}

.record-item.uncommon {
  background: rgba(34, 197, 94, 0.1);
}

.record-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.record-type-badge {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  align-self: flex-start;
}

.record-name {
  color: #f4a460;
  font-weight: bold;
  font-size: 15px;
}

.record-rarity {
  color: #a0aec0;
  font-size: 12px;
}

.record-reward {
  display: flex;
  gap: 15px;
  color: #48bb78;
  font-size: 14px;
  font-weight: bold;
}

.record-time {
  color: #718096;
  font-size: 12px;
}

@media (max-width: 768px) {
  .hunting-status {
    grid-template-columns: 1fr;
  }
}
</style>
