<template>
  <div class="stats-panel">
    <div class="stats-header">
      <h3>📊 人物属性详情</h3>
      <button class="btn-refresh" @click="loadStats" :disabled="loading">
        {{ loading ? '刷新中...' : '🔄 刷新' }}
      </button>
    </div>

    <!-- 基础属性 -->
    <div class="stats-section">
      <h4 class="section-title">⚔️ 基础属性</h4>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">💪</div>
          <div class="stat-label">攻击</div>
          <div class="stat-value" :class="{ increased: stats.attack > baseStats.attack }">
            {{ stats.attack }}
          </div>
          <div v-if="stats.attack > baseStats.attack" class="stat-bonus">
            +{{ stats.attack - baseStats.attack }}
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🛡️</div>
          <div class="stat-label">防御</div>
          <div class="stat-value" :class="{ increased: stats.defense > baseStats.defense }">
            {{ stats.defense }}
          </div>
          <div v-if="stats.defense > baseStats.defense" class="stat-bonus">
            +{{ stats.defense - baseStats.defense }}
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">💨</div>
          <div class="stat-label">轻功</div>
          <div class="stat-value" :class="{ increased: stats.speed > baseStats.speed }">
            {{ stats.speed }}
          </div>
          <div v-if="stats.speed > baseStats.speed" class="stat-bonus">
            +{{ stats.speed - baseStats.speed }}
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">✨</div>
          <div class="stat-label">魅力</div>
          <div class="stat-value" :class="{ increased: stats.charm > baseStats.charm }">
            {{ stats.charm }}
          </div>
          <div v-if="stats.charm > baseStats.charm" class="stat-bonus">
            +{{ stats.charm - baseStats.charm }}
          </div>
        </div>
      </div>
    </div>

    <!-- 战斗属性 -->
    <div class="stats-section">
      <h4 class="section-title">⚡ 战斗属性</h4>
      <div class="stats-grid">
        <div class="stat-card large">
          <div class="stat-icon">⚔️</div>
          <div class="stat-label">攻击力</div>
          <div class="stat-value highlight">{{ stats.attack_power }}</div>
          <div class="stat-formula">
            (攻击 + 武功/2) × (1 + 内力/1000)
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🔮</div>
          <div class="stat-label">内力</div>
          <div class="stat-value">{{ stats.neili }}/{{ stats.max_neili || 100 }}</div>
          <div class="stat-bar">
            <div class="bar-fill neili" :style="{ width: (stats.neili / (stats.max_neili || 100) * 100) + '%' }"></div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">❤️</div>
          <div class="stat-label">体力</div>
          <div class="stat-value">{{ stats.tili }}</div>
          <div class="stat-bar">
            <div class="bar-fill tili" :style="{ width: Math.min(stats.tili / 100 * 100, 100) + '%' }"></div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🧘</div>
          <div class="stat-label">武功</div>
          <div class="stat-value" :class="{ increased: stats.wugong > baseStats.wugong }">
            {{ stats.wugong }}
          </div>
          <div v-if="stats.wugong > baseStats.wugong" class="stat-bonus">
            +{{ stats.wugong - baseStats.wugong }}
          </div>
        </div>
      </div>
    </div>

    <!-- 经济属性 -->
    <div class="stats-section">
      <h4 class="section-title">💰 经济状况</h4>
      <div class="economy-grid">
        <div class="econ-card">
          <div class="econ-label">现金</div>
          <div class="econ-value">{{ formatNumber(stats.silver) }}</div>
          <div class="econ-icon">💵</div>
        </div>
        <div class="econ-card">
          <div class="econ-label">存款</div>
          <div class="econ-value">{{ formatNumber(stats.deposit || 0) }}</div>
          <div class="econ-icon">🏦</div>
        </div>
        <div class="econ-card">
          <div class="econ-label">总资产</div>
          <div class="econ-value highlight">{{ formatNumber(stats.silver + (stats.deposit || 0)) }}</div>
          <div class="econ-icon">💎</div>
        </div>
      </div>
    </div>

    <!-- Buff 列表 -->
    <div v-if="buffs.length > 0" class="stats-section">
      <h4 class="section-title">✨ 增益效果 ({{ buffs.length }})</h4>
      <div class="buff-list">
        <div v-for="buff in buffs" :key="buff.id" class="buff-item">
          <div class="buff-info">
            <span class="buff-name">{{ getBuffName(buff.bonus_type) }}</span>
            <span class="buff-source">{{ buff.source || '游戏' }}</span>
          </div>
          <div class="buff-value">
            <span v-if="buff.bonus_value > 0" class="bonus-positive">+{{ buff.bonus_value }}</span>
            <span v-if="buff.bonus_percent > 0" class="bonus-positive">+{{ buff.bonus_percent }}%</span>
          </div>
          <div class="buff-time" v-if="buff.expires_at">
            {{ formatExpires(buff.expires_at) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 游戏统计 -->
    <div class="stats-section">
      <h4 class="section-title">🎮 游戏统计</h4>
      <div class="game-stats">
        <div class="game-stat-row">
          <span class="label">总场数</span>
          <span class="value">{{ gameStats.total_games || 0 }}</span>
        </div>
        <div class="game-stat-row">
          <span class="label">胜率</span>
          <span class="value highlight">{{ gameStats.win_rate || 0 }}%</span>
        </div>
        <div class="game-stat-row">
          <span class="label">总盈利</span>
          <span :class="['value', gameStats.total_profit >= 0 ? 'profit' : 'loss']">
            {{ gameStats.total_profit >= 0 ? '+' : '' }}{{ formatNumber(gameStats.total_profit || 0) }}
          </span>
        </div>
        <div class="game-stat-row">
          <span class="label">最高连胜</span>
          <span class="value">{{ gameStats.best_streak || 0 }}🔥</span>
        </div>
        <div class="game-stat-row">
          <span class="label">当前连胜</span>
          <span class="value">{{ gameStats.current_streak || 0 }}🔥</span>
        </div>
      </div>
    </div>

    <!-- 成就 -->
    <div class="stats-section">
      <h4 class="section-title">🏆 成就进度</h4>
      <div class="achievement-grid">
        <div v-for="ach in achievements" :key="ach.id" class="achievement-card" :class="{ unlocked: ach.unlocked }">
          <div class="ach-icon">{{ ach.unlocked ? ach.icon : '❓' }}</div>
          <div class="ach-info">
            <div class="ach-name">{{ ach.name }}</div>
            <div class="ach-desc">{{ ach.description }}</div>
            <div v-if="!ach.unlocked" class="ach-progress">
              进度：{{ ach.progress }} / {{ ach.requirement_value }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const userStore = useUserStore()
const loading = ref(false)

const stats = ref({
  silver: 0,
  neili: 0,
  tili: 0,
  wugong: 0,
  attack: 0,
  defense: 0,
  speed: 0,
  charm: 0,
  attack_power: 0,
  exp: 0,
  deposit: 0,
  max_neili: 100
})

const baseStats = ref({})
const buffs = ref([])
const gameStats = ref({})
const achievements = ref([])

function formatNumber(num) {
  if (num >= 10000) return (num / 10000).toFixed(1) + '万'
  return num.toString()
}

function formatExpires(dateStr) {
  const expires = new Date(dateStr)
  const now = new Date()
  const diff = expires - now
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}小时`
  return `${minutes}分钟`
}

function getBuffName(type) {
  const names = {
    attack: '攻击',
    defense: '防御',
    speed: '轻功',
    charm: '魅力',
    neili: '内力',
    tili: '体力',
    wugong: '武功',
    exp: '经验',
    silver: '银两'
  }
  return names[type] || type
}

async function loadStats() {
  loading.value = true
  try {
    const [statsRes, bonusRes, gameRes] = await Promise.all([
      api.get('/game-bonus/stats/calculate'),
      api.get('/game-bonus/bonus'),
      api.get('/game-bonus/stats')
    ])

    if (statsRes.success) {
      stats.value = statsRes.data.final
      baseStats.value = statsRes.data.base
    }

    if (bonusRes.success) {
      buffs.value = bonusRes.data.all || []
    }

    if (gameRes.success) {
      gameStats.value = gameRes.data
    }
  } catch (e) {
    console.error('加载属性失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.stats-panel {
  padding: 20px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.stats-header h3 {
  color: #7eb8da;
  margin: 0;
  font-size: 20px;
}

.btn-refresh {
  padding: 8px 16px;
  background: rgba(75, 135, 195, 0.2);
  border: 1px solid rgba(75, 135, 195, 0.4);
  border-radius: 6px;
  color: #7eb8da;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: rgba(75, 135, 195, 0.3);
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stats-section {
  margin-bottom: 24px;
}

.section-title {
  color: #ffd700;
  font-size: 16px;
  margin: 0 0 16px 0;
  padding-left: 10px;
  border-left: 3px solid #ffd700;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.stat-card {
  background: rgba(30, 30, 50, 0.6);
  border: 1px solid rgba(75, 135, 195, 0.2);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(75, 135, 195, 0.4);
}

.stat-card.large {
  grid-column: span 2;
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.stat-label {
  color: #888;
  font-size: 12px;
  margin-bottom: 8px;
}

.stat-value {
  color: #eee;
  font-size: 20px;
  font-weight: bold;
}

.stat-value.highlight {
  color: #ffd700;
  font-size: 24px;
}

.stat-value.increased {
  color: #2ecc71;
}

.stat-bonus {
  color: #2ecc71;
  font-size: 12px;
  margin-top: 4px;
}

.stat-formula {
  color: #666;
  font-size: 11px;
  margin-top: 8px;
  font-style: italic;
}

.stat-bar {
  height: 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  margin-top: 8px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s;
}

.bar-fill.neili {
  background: linear-gradient(90deg, #3498db, #2980b9);
}

.bar-fill.tili {
  background: linear-gradient(90deg, #e74c3c, #c0392b);
}

.economy-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.econ-card {
  position: relative;
  background: rgba(30, 30, 50, 0.6);
  border: 1px solid rgba(255, 215, 70, 0.2);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.econ-label {
  color: #888;
  font-size: 12px;
  margin-bottom: 8px;
}

.econ-value {
  color: #ffd700;
  font-size: 18px;
  font-weight: bold;
}

.econ-value.highlight {
  font-size: 22px;
}

.econ-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 24px;
  opacity: 0.3;
}

.buff-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.buff-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(46, 204, 113, 0.1);
  border: 1px solid rgba(46, 204, 113, 0.3);
  border-radius: 8px;
}

.buff-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.buff-name {
  color: #eee;
  font-weight: 500;
}

.buff-source {
  color: #888;
  font-size: 12px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.bonus-positive {
  color: #2ecc71;
  font-weight: bold;
}

.buff-time {
  color: #f39c12;
  font-size: 12px;
}

.game-stats {
  background: rgba(30, 30, 50, 0.6);
  border-radius: 12px;
  padding: 16px;
}

.game-stat-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.game-stat-row:last-child {
  border-bottom: none;
}

.game-stat-row .label {
  color: #888;
}

.game-stat-row .value {
  color: #eee;
  font-weight: 500;
}

.game-stat-row .value.highlight {
  color: #ffd700;
}

.game-stat-row .value.profit {
  color: #2ecc71;
}

.game-stat-row .value.loss {
  color: #e74c3c;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.achievement-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: rgba(30, 30, 50, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  opacity: 0.5;
}

.achievement-card.unlocked {
  opacity: 1;
  border-color: rgba(255, 215, 70, 0.3);
  background: rgba(255, 215, 70, 0.05);
}

.ach-icon {
  font-size: 32px;
}

.ach-info {
  flex: 1;
}

.ach-name {
  color: #eee;
  font-weight: 500;
  margin-bottom: 4px;
}

.ach-desc {
  color: #888;
  font-size: 12px;
  margin-bottom: 8px;
}

.ach-progress {
  color: #f39c12;
  font-size: 11px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-card.large {
    grid-column: span 2;
  }
  
  .economy-grid {
    grid-template-columns: 1fr;
  }
}
</style>
