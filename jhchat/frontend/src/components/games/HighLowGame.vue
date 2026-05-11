<template>
  <div class="high-low-game">
    <div class="game-content">
      <!-- 下注区域 -->
      <div class="bet-section">
        <!-- 卡牌区域 -->
        <div class="cards-area">
          <div class="card-container">
            <div class="card-label">当前牌</div>
            <div class="current-card" :class="cardClass" @click="flipCard">
              <div class="card-inner" :class="{ 'is-flipping': isFlipping }">
                <div class="card-front">
                  <div class="card-back-face">?</div>
                </div>
                <div class="card-back">
                  <div class="card-value">{{ currentCard.value }}</div>
                  <div class="card-suit">{{ currentCard.suit }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card-arrow" v-if="gameState === 'guessing'">
            <span>→</span>
          </div>
          
          <div class="card-container" v-if="gameState === 'guessing' || gameState === 'result'">
            <div class="card-label">下一张</div>
            <div class="current-card next-card" :class="nextCardClass">
              <div class="card-inner" :class="{ 'reveal': gameState === 'result' }">
                <div class="card-front">
                  <div class="card-back-face">?</div>
                </div>
                <div class="card-back">
                  <div class="card-value">{{ nextCard.value }}</div>
                  <div class="card-suit">{{ nextCard.suit }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 连击显示 -->
        <div class="streak-display" v-if="streak >= 2">
          <span class="streak-fire">🔥</span>
          <span class="streak-count">{{ streak }}连赢!</span>
          <span class="streak-fire">🔥</span>
        </div>
        
        <div class="bet-controls">
          <div class="bet-input">
            <label>下注金额</label>
            <div class="bet-buttons">
              <button @click="setBet(10)">10</button>
              <button @click="setBet(50)">50</button>
              <button @click="setBet(100)">100</button>
              <button @click="setBet('max')">MAX</button>
            </div>
            <input type="number" v-model="betAmount" :disabled="gameState !== 'betting'" />
          </div>
          
          <button 
            v-if="gameState === 'betting'" 
            class="guess-btn" 
            :disabled="!canGuess"
            @click="makeGuess"
          >
            开始游戏
          </button>
          
          <div v-else class="guess-buttons">
            <button 
              class="guess-btn low" 
              :disabled="gameState !== 'guessing'"
              @click="makeGuess('low')"
            >
              ⬇️ 小
            </button>
            <button 
              class="guess-btn high" 
              :disabled="gameState !== 'guessing'"
              @click="makeGuess('high')"
            >
              ⬆️ 大
            </button>
          </div>
        </div>
      </div>

      <!-- 结果显示 -->
      <div v-if="result" class="result-display" :class="resultClass">
        <div class="result-icon">{{ resultIcon }}</div>
        <div class="result-text">{{ result }}</div>
        <div class="result-amount">{{ resultAmount }}</div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">连赢</span>
          <span class="stat-value">{{ streak }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">今日盈利</span>
          <span class="stat-value profit">{{ todayProfit }}</span>
        </div>
      </div>
    </div>

    <!-- 胜利动画 -->
    <div v-if="showWinAnimation" class="win-overlay">
      <div class="win-text">🎉 胜利！ 🎉</div>
      <div class="coin-rain">
        <span v-for="i in 20" :key="i" class="coin" :style="coinStyle(i)"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../../stores/user'
import api from '../../utils/api'

const userStore = useUserStore()
const gameState = ref('betting') // betting, guessing, result
const currentCard = ref({ value: '7', suit: '♠' })
const nextCard = ref({ value: 'K', suit: '♥' })
const betAmount = ref(10)
const result = ref(null)
const resultAmount = ref(0)
const streak = ref(0)
const todayProfit = ref(0)
const showWinAnimation = ref(false)
const isFlipping = ref(false)
const showStreakAnimation = ref(false)

const cardSuites = ['♠', '♥', '♣', '♦']
const cardValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

function randomCard() {
  return {
    value: cardValues[Math.floor(Math.random() * cardValues.length)],
    suit: cardSuites[Math.floor(Math.random() * cardSuites.length)]
  }
}

function getCardValue(card) {
  const valueMap = { 'A': 1, 'J': 11, 'Q': 12, 'K': 13 }
  return valueMap[card.value] || parseInt(card.value)
}

const cardClass = computed(() => {
  if (currentCard.value.suit === '♥' || currentCard.value.suit === '♦') {
    return 'card-red'
  }
  return 'card-black'
})

const nextCardClass = computed(() => {
  if (nextCard.value.suit === '♥' || nextCard.value.suit === '♦') {
    return 'card-red'
  }
  return 'card-black'
})

const canGuess = computed(() => {
  return betAmount.value > 0 && betAmount.value <= userStore.profile.silver
})

const resultClass = computed(() => {
  if (!result.value) return ''
  return result.value.includes('赢') ? 'win' : 'lose'
})

const resultIcon = computed(() => {
  if (!result.value) return ''
  return result.value.includes('赢') ? '🎉' : '😢'
})

function setBet(amount) {
  if (amount === 'max') {
    betAmount.value = userStore.profile.silver
  } else {
    betAmount.value = amount
  }
}

function flipCard() {
  if (gameState.value !== 'guessing') return
  isFlipping.value = true
  setTimeout(() => {
    isFlipping.value = false
  }, 600)
}

function makeGuess(guess = null) {
  if (gameState.value === 'betting') {
    // 开始游戏，生成新卡片
    currentCard.value = randomCard()
    nextCard.value = randomCard()
    gameState.value = 'guessing'
    result.value = null
    isFlipping.value = false
  } else {
    // 猜测大小
    isFlipping.value = true
    
    const currentValue = getCardValue(currentCard.value)
    const nextValue = getCardValue(nextCard.value)
    
    const isWin = (guess === 'high' && nextValue >= currentValue) || 
                  (guess === 'low' && nextValue <= currentValue)
    
    setTimeout(() => {
      isFlipping.value = false
      
      if (isWin) {
        const winAmount = betAmount.value * 2
        result.value = `猜${guess === 'high' ? '大' : '小'}赢了！`
        resultAmount.value = `+${winAmount}两`
        todayProfit.value += winAmount
        streak.value++
        
        // 连击动画
        if (streak.value >= 2) {
          showStreakAnimation.value = true
          setTimeout(() => showStreakAnimation.value = false, 1500)
        }
        
        showWinAnimation.value = true
        setTimeout(() => showWinAnimation.value = false, 2000)
      } else {
        result.value = `猜${guess === 'high' ? '大' : '小'}错了！`
        resultAmount.value = `-${betAmount.value}两`
        todayProfit.value -= betAmount.value
        streak.value = 0
      }
      
      gameState.value = 'result'
      setTimeout(() => {
        gameState.value = 'betting'
        result.value = null
        resultAmount.value = 0
      }, 2000)
    }, 300)
  }
}

function coinStyle(index) {
  return {
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 0.5}s`,
    '--rotation': `${Math.random() * 360}deg`
  }
}

onMounted(() => {
  currentCard.value = randomCard()
})
</script>

<style scoped>
.high-low-game {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
}

.game-content {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.9), rgba(15, 23, 30, 0.9));
  border: 2px solid rgba(126, 184, 218, 0.3);
  border-radius: 20px;
  padding: 40px;
  max-width: 600px;
  width: 100%;
}

/* 卡牌区域 */
.cards-area {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  margin-bottom: 30px;
}

.card-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.card-label {
  color: #888;
  font-size: 14px;
}

.card-arrow {
  font-size: 40px;
  color: #7eb8da;
  animation: arrowPulse 1.5s infinite;
}

@keyframes arrowPulse {
  0%, 100% { opacity: 0.5; transform: translateX(0); }
  50% { opacity: 1; transform: translateX(5px); }
}

/* 连击显示 */
.streak-display {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(255, 140, 0, 0.3), rgba(255, 69, 0, 0.3));
  border: 2px solid rgba(255, 215, 0, 0.5);
  border-radius: 20px;
  animation: streakGlow 0.8s infinite;
}

@keyframes streakGlow {
  0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.3); }
  50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.8); }
}

.streak-fire {
  font-size: 24px;
  animation: fireFlicker 0.5s infinite;
}

@keyframes fireFlicker {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.streak-count {
  color: #ffd700;
  font-size: 20px;
  font-weight: bold;
}

.current-card {
  width: 150px;
  height: 220px;
  perspective: 1000px;
  cursor: pointer;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.card-inner.is-flipping,
.card-inner.reveal {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.card-front {
  background: linear-gradient(135deg, #2c3e50, #34495e);
}

.card-back-face {
  font-size: 72px;
  color: rgba(255, 255, 255, 0.3);
  font-weight: bold;
}

.card-back {
  background: #fff;
  transform: rotateY(180deg);
}

.card-red { color: #e74c3c; }
.card-black { color: #2c3e50; }

.card-value {
  font-size: 48px;
  font-weight: bold;
  line-height: 1;
}

.card-suit {
  font-size: 40px;
  margin-top: 10px;
}

.bet-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.bet-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.bet-input label {
  color: #7eb8da;
  font-size: 14px;
}

.bet-buttons {
  display: flex;
  gap: 10px;
}

.bet-buttons button {
  padding: 8px 16px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.bet-buttons button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
}

.bet-input input {
  width: 150px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(126, 184, 218, 0.3);
  border-radius: 8px;
  color: #fff;
  font-size: 18px;
  text-align: center;
}

.bet-input input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.guess-btn, .guess-buttons {
  width: 100%;
  padding: 15px 30px;
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.guess-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.guess-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(46, 204, 113, 0.4);
}

.guess-buttons {
  display: flex;
  gap: 20px;
}

.guess-btn.low {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.guess-btn.high {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.result-display {
  margin-top: 30px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  text-align: center;
  animation: resultPop 0.3s ease-out;
}

@keyframes resultPop {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.result-display.win { border: 2px solid #2ecc71; }
.result-display.lose { border: 2px solid #e74c3c; }

.result-icon { font-size: 48px; margin-bottom: 10px; }
.result-text { color: #fff; font-size: 20px; margin-bottom: 5px; }
.result-amount { 
  color: #2ecc71; 
  font-size: 24px; 
  font-weight: bold;
}
.result-display.lose .result-amount { color: #e74c3c; }

.stats-row {
  display: flex;
  justify-content: space-around;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid rgba(126, 184, 218, 0.2);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label { color: #888; font-size: 12px; margin-bottom: 5px; }
.stat-value { color: #7eb8da; font-size: 20px; font-weight: bold; }
.stat-value.profit { color: #2ecc71; }

/* 胜利动画 */
.win-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  pointer-events: none;
}

.win-text {
  font-size: 72px;
  color: #ffd700;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
  animation: winPulse 0.5s ease-in-out infinite;
}

@keyframes winPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.coin-rain {
  position: absolute;
  top: -50px;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.coin {
  position: absolute;
  width: 30px;
  height: 30px;
  background: radial-gradient(circle, #ffd700, #f39c12);
  border-radius: 50%;
  animation: coinFall 2s linear forwards;
}

@keyframes coinFall {
  0% { 
    top: -50px; 
    opacity: 1;
    transform: rotate(0deg);
  }
  100% { 
    top: 100vh; 
    opacity: 0;
    transform: rotate(var(--rotation));
  }
}
</style>
