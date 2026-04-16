<template>
  <div class="encounter-widget">
    <button v-if="canTrigger" class="encounter-btn" @click="triggerEncounter">
      🎲 触发机缘
    </button>
    <div v-else class="encounter-status" @click="checkStatus">
      <span class="status-icon">⏳</span>
      <span class="status-text">
        <template v-if="status?.cooldownRemaining > 0">
          冷却 {{ status.cooldownRemaining }}分钟
        </template>
        <template v-else>
          今日已达上限
        </template>
      </span>
    </div>

    <!-- 机缘事件弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content" :class="eventData?.event_type">
        <div class="modal-header">
          <span class="modal-icon">{{ getEventIcon(eventData?.event_type) }}</span>
          <h2 class="modal-title">{{ eventData?.event_name }}</h2>
        </div>
        <div class="modal-body">
          <p class="event-desc">{{ eventMessage }}</p>
          <div v-if="eventData?.effect_value !== 0" class="event-effect">
            <span :class="eventData.effect_value > 0 ? 'gain' : 'loss'">
              {{ getEffectText(eventData) }}
            </span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-close" @click="closeModal">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../utils/api'

const status = ref(null)
const showModal = ref(false)
const eventData = ref(null)
const eventMessage = ref('')

const canTrigger = ref(false)

function getEventIcon(type) {
  const icons = {
    treasure: '💎',
    master: '🧙',
    danger: '⚠️',
    animal: '🦊',
    merchant: '💰',
    mystery: '❓'
  }
  return icons[type] || '🎲'
}

function getEffectText(data) {
  const typeMap = {
    silver: '两银子',
    neili: '内力',
    tili: '体力',
    wugong: '武功',
    item: '获得物品'
  }
  const unit = typeMap[data.effect_type] || ''
  const sign = data.effect_value > 0 ? '+' : ''
  return `${sign}${data.effect_value}${unit}`
}

async function checkStatus() {
  try {
    const res = await api.get('/encounter/status')
    if (res.success && res.data) {
      status.value = res.data
      canTrigger.value = res.data.canTrigger
    }
  } catch (err) {
    console.error('Check encounter status failed:', err)
  }
}

async function triggerEncounter() {
  try {
    const res = await api.post('/encounter/trigger')
    if (res.success && res.data) {
      eventData.value = res.data
      eventMessage.value = res.message
      showModal.value = true
      canTrigger.value = false
      setTimeout(() => checkStatus(), 60000) // 1 分钟后刷新状态
    } else {
      alert('❌ ' + (res.message || '触发机缘失败'))
    }
  } catch (err) {
    alert('❌ ' + (err.message || '触发机缘失败'))
  }
}

function closeModal() {
  showModal.value = false
  eventData.value = null
}

onMounted(() => {
  checkStatus()
  // 每小时自动检查一次
  setInterval(checkStatus, 3600000)
})
</script>

<style scoped>
.encounter-widget {
  position: fixed;
  bottom: 100px;
  right: 20px;
  z-index: 1000;
}

.encounter-btn {
  background: linear-gradient(135deg, #f0932b, #eb4d4b);
  color: white;
  border: none;
  padding: 15px 25px;
  border-radius: 50px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(235, 77, 75, 0.4);
  transition: all 0.3s;
  animation: pulse 2s infinite;
}

.encounter-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(235, 77, 75, 0.6);
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 4px 15px rgba(235, 77, 75, 0.4); }
  50% { box-shadow: 0 4px 25px rgba(235, 77, 75, 0.6); }
}

.encounter-status {
  background: rgba(45, 55, 72, 0.9);
  color: #a0aec0;
  padding: 12px 20px;
  border-radius: 50px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(75, 135, 195, 0.3);
  font-size: 14px;
}

.status-icon {
  font-size: 18px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 20px;
  max-width: 400px;
  width: 90%;
  overflow: hidden;
  border: 2px solid rgba(75, 135, 195, 0.3);
  animation: slideUp 0.3s;
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* 不同类型的事件边框颜色 */
.modal-content.treasure { border-color: #ffd700; }
.modal-content.master { border-color: #a855f7; }
.modal-content.danger { border-color: #ef4444; }
.modal-content.animal { border-color: #22c55e; }
.modal-content.merchant { border-color: #3b82f6; }
.modal-content.mystery { border-color: #ec4899; }

.modal-header {
  padding: 25px 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-icon {
  font-size: 50px;
  display: block;
  margin-bottom: 10px;
}

.modal-title {
  color: #e0e0e0;
  font-size: 22px;
  margin: 0;
}

.modal-body {
  padding: 30px 20px;
  text-align: center;
}

.event-desc {
  color: #a0aec0;
  font-size: 16px;
  line-height: 1.8;
  margin: 0 0 20px 0;
}

.event-effect {
  margin-top: 20px;
}

.event-effect .gain {
  color: #2ecc71;
  font-size: 24px;
  font-weight: bold;
}

.event-effect .loss {
  color: #e74c3c;
  font-size: 24px;
  font-weight: bold;
}

.modal-footer {
  padding: 20px;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-close {
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: white;
  border: none;
  padding: 12px 40px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
}

@media (max-width: 768px) {
  .encounter-widget {
    bottom: auto;
    top: 80px;
    right: 10px;
  }
  
  .encounter-btn {
    padding: 10px 16px;
    font-size: 13px;
  }
}
</style>
