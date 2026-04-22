<template>
  <div class="economy-management">
    <h3 class="section-title">💰 经济监控</h3>
    
    <div class="card">
      <!-- 经济指标 -->
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">💵 流通银两总额</span>
          <span class="stat-value">{{ formatNumber(economy.totalSilver) }} <small>两</small></span>
        </div>
        <div class="stat-item">
          <span class="stat-label">👤 人均银两</span>
          <span class="stat-value">{{ formatNumber(economy.avgSilver) }} <small>两</small></span>
        </div>
        <div class="stat-item">
          <span class="stat-label">🏦 银行存款总额</span>
          <span class="stat-value">{{ formatNumber(economy.totalDeposit) }} <small>两</small></span>
        </div>
        <div class="stat-item">
          <span class="stat-label">📊 市场交易额（今日）</span>
          <span class="stat-value">{{ formatNumber(economy.marketToday) }} <small>两</small></span>
        </div>
      </div>

      <!-- 经济健康度和通胀率 -->
      <div class="info-grid">
        <div class="info-card">
          <h4 class="info-title">📈 经济健康度</h4>
          <div class="health-bar">
            <div class="health-fill" :style="{ width: economy.healthScore + '%' }" :class="healthClass"></div>
          </div>
          <div class="health-text">{{ economy.healthScore }}% - {{ healthText }}</div>
        </div>
        <div class="info-card">
          <h4 class="info-title">📉 通货膨胀率</h4>
          <div class="inflation-display">
            <span class="inflation-value">{{ economy.inflationRate }}%</span>
            <span class="inflation-trend">↑ 较上月 +0.5%</span>
          </div>
        </div>
      </div>

      <!-- 富豪排行榜 -->
      <div class="subsection">
        <h4 class="subsection-title">🏆 富豪排行榜 TOP 10</h4>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 60px;">排名</th>
                <th>用户名</th>
                <th style="width: 150px;">银两</th>
                <th style="width: 150px;">存款</th>
                <th style="width: 150px;">总资产</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in richList" :key="item.user_id || index">
                <td>
                  <span :class="['rank-badge', 'rank-'+(index+1)]">
                    {{ getRankIcon(index+1) }} {{ index+1 }}
                  </span>
                </td>
                <td><strong>{{ item.username }}</strong></td>
                <td class="price">{{ formatNumber(item.silver) }} 两</td>
                <td class="price">{{ formatNumber(item.deposit || 0) }} 两</td>
                <td class="price">{{ formatNumber(item.silver + (item.deposit || 0)) }} 两</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="richList.length === 0" class="empty-text">暂无数据</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import api from '../../utils/api'

const economy = reactive({
  totalSilver: 0,
  avgSilver: 0,
  totalDeposit: 0,
  marketToday: 0,
  healthScore: 85,
  inflationRate: 2.3
})

const richList = ref([])

const healthClass = computed(() => {
  return economy.healthScore >= 80 ? 'health-good' : 'health-warning'
})

const healthText = computed(() => {
  return economy.healthScore >= 80 ? '健康' : '需要调整'
})

const formatNumber = (num) => {
  return Number(num || 0).toLocaleString()
}

const getRankIcon = (rank) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return '🏅'
}

const loadEconomyData = async () => {
  try {
    const res = await api.get('/admin/economy/stats')
    if (res.success) {
      const data = res.data
      economy.totalSilver = Number(data.money?.totalSilver) || 0
      economy.avgSilver = Number(data.money?.avgPerUser) || 0
      economy.totalDeposit = Number(data.money?.totalDeposit) || 0
      economy.marketToday = Number(data.spending?.daily) || 0
    }
  } catch (error) {
    console.error('加载经济数据失败:', error)
  }
}

const loadRichList = async () => {
  try {
    const res = await api.get('/admin/economy/rich-list?limit=10')
    if (res.success) {
      richList.value = res.data?.list || []
    }
  } catch (error) {
    console.error('加载富豪榜失败:', error)
  }
}

onMounted(() => {
  loadEconomyData()
  loadRichList()
})
</script>

<style scoped>
.economy-management { padding: 20px; }
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 16px; border-left: 3px solid #f39c12; padding-left: 10px; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.stats-row { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.stat-item { flex: 1; min-width: 200px; background: rgba(255,255,255,0.05); border-radius: 6px; padding: 16px; border: 1px solid rgba(255,255,255,0.1); }
.stat-label { color: #a0a0a0; font-size: 13px; display: block; margin-bottom: 8px; }
.stat-value { color: #ffd700; font-size: 24px; font-weight: bold; }
.stat-value small { font-size: 14px; color: #a0a0a0; font-weight: normal; }
.info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px; }
.info-card { background: rgba(255,255,255,0.05); border-radius: 6px; padding: 16px; border: 1px solid rgba(255,255,255,0.1); }
.info-title { color: #f39c12; font-size: 14px; margin: 0 0 12px 0; }
.health-bar { height: 24px; background: rgba(0,0,0,0.3); border-radius: 12px; overflow: hidden; margin-bottom: 8px; }
.health-fill { height: 100%; transition: width 0.5s; }
.health-good { background: linear-gradient(90deg, #27ae60, #2ecc71); }
.health-warning { background: linear-gradient(90deg, #f39c12, #e67e22); }
.health-text { color: #fff; font-size: 13px; text-align: center; }
.inflation-display { display: flex; flex-direction: column; align-items: center; }
.inflation-value { color: #fff; font-size: 42px; font-weight: bold; }
.inflation-trend { color: #27ae60; font-size: 14px; margin-top: 8px; }
.subsection { margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.subsection-title { color: #f39c12; font-size: 16px; margin-bottom: 16px; }
.table-container { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
.data-table th { color: #f39c12; font-weight: 600; font-size: 14px; white-space: nowrap; background: rgba(243, 156, 18, 0.1); }
.data-table td { font-size: 13px; }
.data-table tr:hover { background: rgba(255,255,255,0.02); }
.rank-badge { font-size: 14px; }
.rank-1 { color: #ffd700; }
.rank-2 { color: #c0c0c0; }
.rank-3 { color: #cd7f32; }
.price { color: #ffd700; font-weight: bold; }
.empty-text { text-align: center; color: #888; padding: 40px 20px; }
</style>
