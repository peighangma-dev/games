<template>
  <div class="statistics">
    <h3 class="section-title">系统统计</h3>
    
    <div class="card">
      <!-- 在线统计 -->
      <div class="stats-section">
        <h4 class="subsection-title">在线统计</h4>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ onlineStats.total || 0 }}</div>
            <div class="stat-label">当前在线人数</div>
          </div>
        </div>
        <div v-if="onlineStats.byRoom && onlineStats.byRoom.length > 0" class="room-stats">
          <h5>各房间在线分布</h5>
          <div v-for="room in onlineStats.byRoom" :key="room.room_id" class="room-stat-row">
            <span>房间 {{ room.room_id }}:</span>
            <span class="stat-value">{{ room.count }} 人</span>
          </div>
        </div>
      </div>

      <!-- 注册统计 -->
      <div class="stats-section">
        <h4 class="subsection-title">注册统计</h4>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ regStats.total || 0 }}</div>
            <div class="stat-label">总注册用户</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ regStats.today || 0 }}</div>
            <div class="stat-label">今日注册</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ regStats.thisMonth || 0 }}</div>
            <div class="stat-label">本月注册</div>
          </div>
        </div>
      </div>

      <!-- 聊天统计 -->
      <div class="stats-section">
        <h4 class="subsection-title">聊天统计</h4>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ chatStats.today || 0 }}</div>
            <div class="stat-label">今日消息数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ chatStats.total || 0 }}</div>
            <div class="stat-label">总消息数</div>
          </div>
        </div>
      </div>

      <!-- 经济统计 -->
      <div class="stats-section">
        <h4 class="subsection-title">经济统计</h4>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ econStats.totalSilver || 0 }}</div>
            <div class="stat-label">流通银两总量</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ econStats.avgSilver || 0 }}</div>
            <div class="stat-label">人均银两</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ econStats.totalDeposit || 0 }}</div>
            <div class="stat-label">存款总量</div>
          </div>
        </div>
      </div>

      <button @click="loadAllStats" class="btn btn-primary refresh-btn">刷新统计</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../utils/api'

const onlineStats = ref({ total: 0, byRoom: [] })
const regStats = ref({})
const chatStats = ref({})
const econStats = ref({})

async function loadAllStats() {
  try {
    const [onlineRes, regRes, chatRes, econRes] = await Promise.all([
      api.get('/admin/statistics/online'),
      api.get('/admin/statistics/registration'),
      api.get('/admin/statistics/chat'),
      api.get('/admin/statistics/economy')
    ])
    
    if (onlineRes.success) onlineStats.value = onlineRes.data || {}
    if (regRes.success) regStats.value = regRes.data || {}
    if (chatRes.success) chatStats.value = chatRes.data || {}
    if (econRes.success) econStats.value = econRes.data || {}
  } catch (e) {
    alert('加载统计失败：' + (e.message || '未知错误'))
  }
}

onMounted(() => loadAllStats())
</script>

<style scoped>
.statistics { padding: 20px; }
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 16px; border-left: 3px solid #4B87C3; padding-left: 10px; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.stats-section { margin-bottom: 30px; padding-bottom: 30px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.stats-section:last-child { border-bottom: none; }
.subsection-title { color: #fff; font-size: 14px; margin-bottom: 16px; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 16px; }
.stat-card { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 6px; text-align: center; }
.stat-value { color: #4B87C3; font-size: 28px; font-weight: bold; margin-bottom: 8px; }
.stat-label { color: #aaa; font-size: 12px; }
.room-stats { margin-top: 16px; }
.room-stats h5 { color: #aaa; font-size: 13px; margin-bottom: 10px; }
.room-stat-row { display: flex; justify-content: space-between; padding: 6px 12px; background: rgba(255,255,255,0.03); border-radius: 4px; margin-bottom: 6px; font-size: 13px; }
.refresh-btn { margin-top: 20px; }
.btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; background: #555; color: #fff; transition: all 0.3s; }
.btn:hover { opacity: 0.8; }
.btn-primary { background: #4B87C3; }
</style>
