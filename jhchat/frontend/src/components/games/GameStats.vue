<template>
  <div class="game-stats">
    <h3 class="stats-title">📊 我的战绩</h3>
    
    <div class="stats-summary">
      <div class="summary-item silver">
        <div class="icon">💰</div>
        <div class="label">银两</div>
        <div class="value">{{ userStore.user?.silver || 0 }}</div>
      </div>
      
      <div class="summary-item wins">
        <div class="icon">🏆</div>
        <div class="label">总胜利</div>
        <div class="value">{{ totalWins }}</div>
      </div>
      
      <div class="summary-item games">
        <div class="icon">🎮</div>
        <div class="label">游戏次数</div>
        <div class="value">{{ totalGames }}</div>
      </div>
      
      <div class="summary-item rate">
        <div class="icon">📈</div>
        <div class="label">胜率</div>
        <div class="value">{{ winRate }}%</div>
      </div>
    </div>
    
    <div class="stats-grid">
      <!-- 21 点战绩 -->
      <div class="stat-card">
        <div class="card-header blackjack">
          <span class="game-icon">♠</span>
          <h4>21 点</h4>
        </div>
        <div class="card-body">
          <div class="stat-row">
            <span class="stat-label">胜利</span>
            <span class="stat-value win">{{ blackjackStats.wins }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">失败</span>
            <span class="stat-value lose">{{ blackjackStats.losses }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Blackjack</span>
            <span class="stat-value special">{{ blackjackStats.blackjacks }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">胜率</span>
            <span class="stat-value">{{ calcWinRate(blackjackStats) }}%</span>
          </div>
        </div>
      </div>
      
      <!-- 骰子战绩 -->
      <div class="stat-card">
        <div class="card-header dice">
          <span class="game-icon">⚈</span>
          <h4>骰子</h4>
        </div>
        <div class="card-body">
          <div class="stat-row">
            <span class="stat-label">胜利</span>
            <span class="stat-value win">{{ diceStats.wins }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">失败</span>
            <span class="stat-value lose">{{ diceStats.losses }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">豹子</span>
            <span class="stat-value special">{{ diceStats.baozis }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">胜率</span>
            <span class="stat-value">{{ calcWinRate(diceStats) }}%</span>
          </div>
        </div>
      </div>
      
      <!-- 钓鱼战绩 -->
      <div class="stat-card">
        <div class="card-header fishing">
          <span class="game-icon">♣</span>
          <h4>钓鱼</h4>
        </div>
        <div class="card-body">
          <div class="stat-row">
            <span class="stat-label">次数</span>
            <span class="stat-value">{{ fishingStats.total }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">总价值</span>
            <span class="stat-value special">{{ fishingStats.totalValue }} 两</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">最大鱼</span>
            <span class="stat-value">{{ fishingStats.biggestCatch || '-' }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">成功率</span>
            <span class="stat-value">{{ fishingStats.successRate }}%</span>
          </div>
        </div>
      </div>
      
      <!-- 打猎战绩 -->
      <div class="stat-card">
        <div class="card-header hunt">
          <span class="game-icon">🏹</span>
          <h4>打猎</h4>
        </div>
        <div class="card-body">
          <div class="stat-row">
            <span class="stat-label">次数</span>
            <span class="stat-value">{{ huntStats.total }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">总价值</span>
            <span class="stat-value special">{{ huntStats.totalValue }} 两</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">最大猎物</span>
            <span class="stat-value">{{ huntStats.biggestHunt || '-' }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">成功率</span>
            <span class="stat-value">{{ huntStats.successRate }}%</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="achievements-section" v-if="achievements.length > 0">
      <h4 class="section-title">🏅 成就</h4>
      <div class="achievements-grid">
        <div
          v-for="achievement in achievements"
          :key="achievement.id"
          class="achievement-badge"
          :class="achievement.rarity"
        >
          <div class="badge-icon">{{ achievement.icon }}</div>
          <div class="badge-info">
            <div class="badge-name">{{ achievement.name }}</div>
            <div class="badge-desc">{{ achievement.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../../stores/user'
import api from '../../utils/api'

const userStore = useUserStore()

// 战绩数据
const stats = ref({
  blackjack: { wins: 0, losses: 0, blackjacks: 0 },
  dice: { wins: 0, losses: 0, baozis: 0 },
  fishing: { total: 0, totalValue: 0, biggestCatch: '' },
  hunt: { total: 0, totalValue: 0, biggestHunt: '' }
})

// 成就数据
const achievements = ref([])

// 计算属性
const blackjackStats = computed(() => stats.value.blackjack)
const diceStats = computed(() => stats.value.dice)
const fishingStats = computed(() => stats.value.fishing)
const huntStats = computed(() => stats.value.hunt)

const totalWins = computed(() => {
  return blackjackStats.value.wins + diceStats.value.wins
})

const totalGames = computed(() => {
  return (
    blackjackStats.value.wins + blackjackStats.value.losses +
    diceStats.value.wins + diceStats.value.losses +
    fishingStats.value.total +
    huntStats.value.total
  )
})

const winRate = computed(() => {
  const total = blackjackStats.value.wins + blackjackStats.value.losses +
                diceStats.value.wins + diceStats.value.losses
  if (total === 0) return 0
  return Math.round((totalWins.value / total) * 100)
})

// 方法
function calcWinRate(gameStats) {
  const total = gameStats.wins + gameStats.losses
  if (total === 0) return 0
  return Math.round((gameStats.wins / total) * 100)
}

async function fetchStats() {
  try {
    // TODO: 实现战绩统计 API
    // const res = await api.get('/game/stats')
    // stats.value = res.data
    
    // 临时模拟数据
    stats.value = {
      blackjack: { wins: 15, losses: 8, blackjacks: 3 },
      dice: { wins: 22, losses: 18, baozis: 2 },
      fishing: { total: 50, totalValue: 5800, biggestCatch: '锦鲤' },
      hunt: { total: 30, totalValue: 4200, biggestHunt: '老虎' }
    }
  } catch (error) {
    console.error('获取战绩失败:', error)
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.game-stats {
  background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
  border-radius: 16px;
  padding: 24px;
  margin-top: 30px;
}

.stats-title {
  color: #ffd700;
  font-size: 24px;
  margin-bottom: 20px;
  text-align: center;
}

/* 战绩总览 */
.stats-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 30px;
}

.summary-item {
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 2px solid rgba(255,255,255,0.1);
  transition: all 0.3s;
}

.summary-item:hover {
  transform: translateY(-3px);
  border-color: rgba(255,255,255,0.3);
}

.summary-item.silver .icon { color: #f59e0b; }
.summary-item.wins .icon { color: #fbbf24; }
.summary-item.games .icon { color: #3b82f6; }
.summary-item.rate .icon { color: #22c55e; }

.icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.label {
  color: #94a3b8;
  font-size: 12px;
  margin-bottom: 8px;
}

.value {
  color: #fff;
  font-size: 28px;
  font-weight: bold;
}

/* 战绩网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.stat-card {
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(255,255,255,0.1);
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  border-color: rgba(255,255,255,0.2);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  color: #fff;
}

.card-header.blackjack { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
.card-header.dice { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
.card-header.fishing { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); }
.card-header.hunt { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }

.game-icon {
  font-size: 28px;
}

.card-header h4 {
  font-size: 18px;
  font-weight: bold;
}

.card-body {
  padding: 16px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  color: #94a3b8;
  font-size: 14px;
}

.stat-value {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
}

.stat-value.win { color: #4ade80; }
.stat-value.lose { color: #f87171; }
.stat-value.special { color: #fbbf24; }

/* 成就区域 */
.achievements-section {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 2px solid rgba(255,255,255,0.1);
}

.section-title {
  color: #ffd700;
  font-size: 20px;
  margin-bottom: 16px;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.achievement-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 12px;
  border: 2px solid rgba(255,255,255,0.1);
  transition: all 0.3s;
}

.achievement-badge:hover {
  transform: scale(1.05);
}

.achievement-badge.common { border-color: #94a3b8; }
.achievement-badge.rare { border-color: #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.3); }
.achievement-badge.epic { border-color: #a855f7; box-shadow: 0 0 15px rgba(168, 85, 247, 0.4); }
.achievement-badge.legendary { border-color: #f59e0b; box-shadow: 0 0 20px rgba(245, 158, 11, 0.5); }

.badge-icon {
  font-size: 36px;
}

.badge-info {
  flex: 1;
}

.badge-name {
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
}

.badge-desc {
  color: #94a3b8;
  font-size: 11px;
  line-height: 1.3;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .stats-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .value {
    font-size: 22px;
  }
}
</style>
