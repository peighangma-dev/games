<template>
  <PageLayout>
    <div class="games-page">
      <div class="page-header">
        <h1 class="page-title animate-title">🎮 游戏大厅</h1>
        <div class="player-stats" v-if="userStore.profile">
          <div class="stat-badge">
            <span class="stat-icon">💰</span>
            <span class="stat-value">{{ userStore.profile.silver }}</span>
          </div>
          <div class="stat-badge">
            <span class="stat-icon">⚡</span>
            <span class="stat-value">{{ userStore.profile.tili }}</span>
          </div>
        </div>
      </div>

      <div class="game-grid">
        <div 
          v-for="(game, index) in games" 
          :key="game.id" 
          class="game-card card" 
          :style="{ animationDelay: `${index * 0.1}s` }"
          @click="openGame(game.id)"
        >
          <div class="game-icon-wrapper">
            <div class="game-icon">{{ game.icon }}</div>
            <div class="icon-glow"></div>
          </div>
          <div class="game-info">
            <div class="game-name">{{ game.name }}</div>
            <div class="game-desc">{{ game.desc }}</div>
          </div>
          <div class="game-overlay"></div>
        </div>
      </div>

      <!-- 粒子效果容器 -->
      <div ref="particleContainer" class="particle-container"></div>

      <!-- 全屏游戏 -->
      <transition name="game-fullscreen">
        <div v-if="currentGame" class="fullscreen-game">
          <div class="game-header">
            <button class="back-btn btn-click" @click="closeGame">
              <span>←</span> 返回
            </button>
            <h2 class="game-title">{{ getGameTitle(currentGame) }}</h2>
            <div class="header-spacer"></div>
          </div>
          <component :is="getGameComponent(currentGame)" />
        </div>
      </transition>

      <!-- 战绩统计 -->
      <GameStats />
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import PageLayout from '../components/PageLayout.vue'
import BlackjackGame from '../components/games/BlackjackGame.vue'
import DiceGame from '../components/games/DiceGame.vue'
import FishingGame from '../components/games/FishingGame.vue'
import GameStats from '../components/games/GameStats.vue'

const userStore = useUserStore()
const currentGame = ref(null)
const particleContainer = ref(null)

const games = [
  { id: 'blackjack', icon: '♠', name: '21 点', desc: '经典纸牌，点数过 21 则输' },
  { id: 'dice', icon: '⚈', name: '骰子', desc: '押大小，一掷千金' },
  { id: 'high-low', icon: '⇹', name: '猜大小', desc: '猜中翻倍，猜错归零' },
  { id: 'fish', icon: '♣', name: '钓鱼', desc: '湖边垂钓，收获惊喜' },
  { id: 'hunt', icon: '🏹', name: '打猎', desc: '深山打猎，获取资源' },
  { id: 'othello', icon: '◯', name: '比山论剑', desc: '黑白棋对弈，斗智斗勇' }
]

function getGameTitle(id) {
  const game = games.find(g => g.id === id)
  return game ? `${game.name} ${game.id.toUpperCase()}` : '游戏'
}

function getGameComponent(id) {
  const components = {
    blackjack: BlackjackGame,
    dice: DiceGame,
    fish: FishingGame
  }
  return components[id] || null
}

function openGame(name) {
  createClickEffect(event)
  currentGame.value = name
}

function closeGame() {
  currentGame.value = null
}

// 创建点击特效
function createClickEffect(e) {
  if (!particleContainer.value) return
  
  const rect = e.target.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  // 创建金币粒子
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div')
    particle.className = 'particle'
    particle.style.left = x + 'px'
    particle.style.top = y + 'px'
    particle.style.background = `hsl(${45 + Math.random() * 15}, 100%, 50%)`
    particle.style.setProperty('--tx', `${(Math.random() - 0.5) * 200}px`)
    particle.style.setProperty('--ty', `${(Math.random() - 0.5) * 200}px`)
    particleContainer.value.appendChild(particle)
    
    setTimeout(() => particle.remove(), 1000)
  }
}

onMounted(() => {
  // 页面加载时的入场动画
  setTimeout(() => {
    const cards = document.querySelectorAll('.game-card')
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('fade-in')
      }, index * 100)
    })
  }, 100)
})
</script>

<style scoped>
/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(30, 58, 95, 0.5), rgba(15, 23, 42, 0.5));
  border-radius: 16px;
  border: 1px solid rgba(126, 184, 218, 0.2);
}

.page-title {
  color: #ffd700;
  font-size: 36px;
  margin: 0;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.animate-title {
  animation: titleGlow 3s ease-in-out infinite;
}

@keyframes titleGlow {
  0%, 100% { text-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
  50% { text-shadow: 0 0 40px rgba(255, 215, 0, 0.8); }
}

.player-stats {
  display: flex;
  gap: 16px;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.stat-icon {
  font-size: 20px;
}

.stat-value {
  color: #ffd700;
  font-weight: bold;
  font-size: 16px;
}

/* 游戏列表 */
.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
  padding: 20px;
}

.game-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 20px;
  background: linear-gradient(135deg, rgba(30, 58, 95, 0.8), rgba(15, 23, 42, 0.8));
  border-radius: 20px;
  border: 2px solid rgba(126, 184, 218, 0.2);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
  opacity: 0;
}

.game-card.fade-in {
  opacity: 1;
  animation: cardEntrance 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes cardEntrance {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.game-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(126, 184, 218, 0.1) 50%,
    transparent 70%
  );
  transform: rotate(45deg);
  transition: all 0.6s;
}

.game-card:hover::before {
  left: 100%;
}

.game-card:hover {
  border-color: #7eb8da;
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(126, 184, 218, 0.3);
}

.game-icon-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-icon {
  font-size: 56px;
  z-index: 2;
  transition: transform 0.3s;
}

.game-card:hover .game-icon {
  transform: scale(1.2) rotate(10deg);
}

.icon-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.3), transparent);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

.game-info {
  text-align: center;
  z-index: 1;
}

.game-name {
  color: #ffd700;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.game-desc {
  color: #94a3b8;
  font-size: 14px;
  line-height: 1.4;
}

.game-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent, rgba(255, 215, 0, 0.05));
  opacity: 0;
  transition: opacity 0.3s;
}

.game-card:hover .game-overlay {
  opacity: 1;
}

/* 全屏游戏 */
.fullscreen-game {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
  z-index: 1000;
  overflow-y: auto;
  animation: fadeIn 0.3s ease-out;
}

.game-fullscreen-enter-active,
.game-fullscreen-leave-active {
  transition: opacity 0.3s;
}

.game-fullscreen-enter-from,
.game-fullscreen-leave-to {
  opacity: 0;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(126, 184, 218, 0.2);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: #7eb8da;
  transform: translateX(-4px);
}

.game-title {
  color: #ffd700;
  font-size: 28px;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.header-spacer {
  width: 120px;
}

/* 粒子容器 */
.particle-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .page-title {
    font-size: 28px;
  }
  
  .game-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .game-card {
    padding: 20px 12px;
  }
  
  .game-icon {
    font-size: 40px;
  }
  
  .game-name {
    font-size: 16px;
  }
}
</style>
