<template>
  <PageLayout>
    <div class="games-page">
      <div class="page-container">
        <div class="title-bar">
          <h1>游戏大厅</h1>
        </div>

        <div class="game-grid">
          <div class="game-card card" @click="openGame('blackjack')">
            <div class="game-icon">♠</div>
            <div class="game-name">21 点</div>
            <div class="game-desc">经典纸牌，点数过 21 则输</div>
          </div>
          <div class="game-card card" @click="openGame('dice')">
            <div class="game-icon">⚈</div>
            <div class="game-name">骰子</div>
            <div class="game-desc">押大小，一掷千金</div>
          </div>
          <div class="game-card card" @click="openGame('high-low')">
            <div class="game-icon">⇹</div>
            <div class="game-name">猜大小</div>
            <div class="game-desc">猜中翻倍，猜错归零</div>
          </div>
          <div class="game-card card" @click="openGame('fish')">
            <div class="game-icon">♣</div>
            <div class="game-name">钓鱼</div>
            <div class="game-desc">湖边垂钓，收获惊喜</div>
          </div>
          <div class="game-card card" @click="openGame('hunt')">
            <div class="game-icon">🏹</div>
            <div class="game-name">打猎</div>
            <div class="game-desc">深山打猎，获取资源</div>
          </div>
          <div class="game-card card" @click="openGame('othello')">
            <div class="game-icon">◯</div>
            <div class="game-name">比山论剑</div>
            <div class="game-desc">黑白棋对弈，斗智斗勇</div>
          </div>
        </div>

      <!-- 21 点全屏游戏 -->
      <div v-if="currentGame === 'blackjack'" class="fullscreen-game">
        <div class="game-header">
          <button class="back-btn" @click="closeGame">← 返回</button>
          <h2>21 点 BlackJack</h2>
          <div style="width:80px"></div>
        </div>
        <BlackjackGame />
      </div>
      
      <!-- 骰子全屏游戏 -->
      <div v-if="currentGame === 'dice'" class="fullscreen-game">
        <div class="game-header">
          <button class="back-btn" @click="closeGame">← 返回</button>
          <h2>骰子 Dice</h2>
          <div style="width:80px"></div>
        </div>
        <DiceGame />
      </div>
      
      <!-- 钓鱼全屏游戏 -->
      <div v-if="currentGame === 'fish'" class="fullscreen-game">
        <div class="game-header">
          <button class="back-btn" @click="closeGame">← 返回</button>
          <h2>钓鱼 Fishing</h2>
          <div style="width:80px"></div>
        </div>
        <FishingGame />
      </div>
      
      <!-- 战绩统计 -->
      <GameStats />
    </div>
  </div>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import PageLayout from '../components/PageLayout.vue'
import BlackjackGame from '../components/games/BlackjackGame.vue'
import DiceGame from '../components/games/DiceGame.vue'
import FishingGame from '../components/games/FishingGame.vue'
import GameStats from '../components/games/GameStats.vue'

const currentGame = ref(null)

function openGame(name) {
  currentGame.value = name
}

function closeGame() {
  currentGame.value = null
}
</script>

<style scoped>
.fullscreen-game {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 20px;
}

.back-btn {
  padding: 12px 24px;
  background: rgba(255,255,255,0.1);
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 10px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255,255,255,0.2);
  border-color: #fff;
}

.game-header h2 {
  color: #ffd700;
  font-size: 28px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.games-page {
  max-width: 1200px;
  margin: 0 auto;
}

<style scoped>
.games-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-container {
  padding: 20px;
}

.title-bar h1 {
  color: #ffd700;
  font-size: 32px;
  text-align: center;
  margin-bottom: 30px;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

.game-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
  background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
  border-radius: 16px;
  border: 2px solid rgba(126, 184, 218, 0.3);
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.game-card:hover {
  border-color: #7eb8da;
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(126, 184, 218, 0.3);
}

.game-icon {
  font-size: 48px;
}

.game-name {
  color: #ffd700;
  font-size: 18px;
  font-weight: bold;
}

.game-desc {
  color: #94a3b8;
  font-size: 14px;
}
</style>
