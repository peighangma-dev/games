<template>
  <div class="blackjack-game">
    <!-- 牌桌区域 -->
    <div class="table-area">
      <!-- 庄家区域 -->
      <div class="dealer-area">
        <div class="player-info">
          <div class="avatar dealer-avatar">🤖</div>
          <span class="player-name">庄家</span>
        </div>
        
        <div class="card-container">
          <transition-group name="card-deal">
            <div
              v-for="(card, index) in visibleDealerCards"
              :key="'dealer-' + index"
              class="card-slot"
            >
              <img
                :src="getCardImage(card)"
                class="playing-card"
                :class="{ 'card-hidden': card.hidden }"
                alt="card"
              />
            </div>
            <!-- 隐藏牌 -->
            <div
              v-if="showHiddenCard"
              :key="'dealer-hidden'"
              class="card-slot"
            >
              <img
                src="/assets/cards/card-back.svg"
                class="playing-card"
                alt="hidden card"
              />
            </div>
          </transition-group>
        </div>
        
        <div class="points-display">
          <span>点数：</span>
          <span class="points-value">{{ dealerPoints }}</span>
        </div>
      </div>
      
      <!-- 中央信息区 -->
      <div class="table-center">
        <div class="pot-display" v-if="bet > 0">
          <span class="chip-icon">💰</span>
          <span class="pot-amount">{{ bet }} 两</span>
        </div>
        
        <div class="game-message" :class="messageType">
          {{ message }}
        </div>
        
        <!-- 操作按钮区域 -->
        <div class="action-buttons" v-if="gamePhase === 'playing'">
          <button
            class="action-btn btn-hit"
            @click="hit"
            :disabled="isProcessing"
          >
            要牌
          </button>
          <button
            class="action-btn btn-stand"
            @click="stand"
            :disabled="isProcessing"
          >
            停牌
          </button>
          <button
            class="action-btn btn-double"
            @click="doubleDown"
            :disabled="!canDoubleDown"
          >
            加倍
          </button>
        </div>
        
        <!-- 结算按钮 -->
        <div class="action-buttons" v-if="gamePhase === 'result'">
          <button
            class="action-btn btn-new-game"
            @click="resetGame"
          >
            新游戏
          </button>
        </div>
      </div>
      
      <!-- 玩家区域 -->
      <div class="player-area">
        <div class="player-info">
          <div class="avatar player-avatar">
            {{ userStore.user?.avatar || '👤' }}
          </div>
          <span class="player-name">{{ userStore.user?.username || '玩家' }}</span>
          <span class="player-silver">{{ userStore.user?.silver || 0 }} 两</span>
        </div>
        
        <div class="card-container">
          <transition-group name="card-deal">
            <div
              v-for="(card, index) in playerCards"
              :key="'player-' + index"
              class="card-slot"
            >
              <img
                :src="getCardImage(card)"
                class="playing-card"
                alt="card"
              />
            </div>
          </transition-group>
        </div>
        
        <div class="points-display">
          <span>点数：</span>
          <span class="points-value player-points">{{ playerPoints }}</span>
        </div>
      </div>
    </div>
    
    <!-- 下注区域 -->
    <div class="bet-area" v-if="gamePhase === 'betting'">
      <h3 class="bet-title">请下注</h3>
      
      <div class="chip-selector">
        <div
          v-for="chip in chipValues"
          :key="chip"
          class="chip"
          :class="{ selected: bet === chip }"
          @click="selectChip(chip)"
        >
          {{ chip }}
        </div>
        <div
          class="chip custom"
          :class="{ selected: isCustomBet }"
          @click="selectChip('custom')"
        >
          自定义
        </div>
      </div>
      
      <div class="bet-input" v-if="isCustomBet">
        <input
          v-model.number="customBet"
          type="number"
          min="1"
          :max="userStore.user?.silver || 0"
          placeholder="输入下注金额"
        />
      </div>
      
      <div class="bet-actions">
        <button
          class="bet-btn"
          @click="placeBet"
          :disabled="!isValidBet"
        >
          确认下注
        </button>
        <button
          class="bet-btn bet-all"
          @click="betAll"
          :disabled="userStore.user?.silver <= 0"
        >
          全押
        </button>
      </div>
      
      <div class="quick-bets">
        <button @click="quickBet(100)">100</button>
        <button @click="quickBet(500)">500</button>
        <button @click="quickBet(1000)">1000</button>
        <button @click="quickBet(5000)">5000</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '../../stores/user'
import api from '../../utils/api'

const userStore = useUserStore()

// 游戏状态
const gamePhase = ref('betting') // 'betting', 'playing', 'result'
const isProcessing = ref(false)
const message = ref('请下注开始游戏')
const messageType = ref('info')

// 下注相关
const bet = ref(0)
const customBet = ref(0)
const isCustomBet = ref(false)
const chipValues = [100, 500, 1000, 5000, 10000]

// 牌面数据
const dealerCards = ref([])
const playerCards = ref([])
const dealerPoints = ref(0)
const playerPoints = ref(0)

// 计算属性
const visibleDealerCards = computed(() => {
  if (gamePhase.value === 'result') {
    return dealerCards.value
  }
  // 游戏进行中只显示第一张牌
  return dealerCards.value.slice(0, 1)
})

const showHiddenCard = computed(() => {
  return gamePhase.value === 'playing' && dealerCards.value.length > 1
})

const canDoubleDown = computed(() => {
  return gamePhase.value === 'playing' && 
         playerCards.value.length === 2 && 
         userStore.user?.silver >= bet.value
})

const isValidBet = computed(() => {
  if (isCustomBet.value) {
    return customBet.value > 0 && customBet.value <= (userStore.user?.silver || 0)
  }
  return bet.value > 0 && bet.value <= (userStore.user?.silver || 0)
})

// 方法
function getCardImage(card) {
  if (!card) return '/assets/cards/card-back.svg'
  if (card.hidden) return '/assets/cards/card-back.svg'
  
  const suitMap = {
    'H': 'Hearts',
    'D': 'Diamonds',
    'C': 'Clubs',
    'S': 'Spades'
  }
  
  return `/assets/cards/${card.value}${suitMap[card.suit]}.svg`
}

function selectChip(value) {
  if (value === 'custom') {
    isCustomBet.value = true
    bet.value = 0
  } else {
    isCustomBet.value = false
    bet.value = value
  }
}

function quickBet(amount) {
  bet.value = Math.min(amount, userStore.user?.silver || 0)
  isCustomBet.value = false
}

function betAll() {
  bet.value = userStore.user?.silver || 0
  isCustomBet.value = false
}

async function placeBet() {
  try {
    isProcessing.value = true
    message.value = '发牌中...'
    messageType.value = 'info'
    
    const betAmount = isCustomBet.value ? customBet.value : bet.value
    
    const res = await api.post('/game/blackjack/bet', { bet: betAmount })
    
    if (res.data.success) {
      const data = res.data.data
      dealerCards.value = parseDealerCards(data.dealerCards)
      playerCards.value = parsePlayerCards(data.playerCards)
      dealerPoints.value = data.dealerPoints
      playerPoints.value = data.playerPoints
      bet.value = betAmount
      
      // 检查 Blackjack
      if (data.result === 'blackjack') {
        message.value = `Blackjack! 赢得 ${data.winAmount} 两！`
        messageType.value = 'win'
        gamePhase.value = 'result'
        await userStore.fetchProfile()
      } else {
        gamePhase.value = 'playing'
        message.value = '要牌还是停牌？'
        messageType.value = 'info'
      }
    } else {
      message.value = res.data.message || '下注失败'
      messageType.value = 'error'
    }
  } catch (error) {
    message.value = error.message || '下注失败'
    messageType.value = 'error'
  } finally {
    isProcessing.value = false
  }
}

async function hit() {
  try {
    isProcessing.value = true
    message.value = '要牌中...'
    
    const res = await api.post('/game/blackjack/hit')
    
    if (res.data.success) {
      const data = res.data.data
      playerCards.value = parsePlayerCards(data.playerCards)
      playerPoints.value = data.playerPoints
      
      if (data.result === 'bust') {
        message.value = `爆牌！失去 ${data.loss} 两`
        messageType.value = 'lose'
        gamePhase.value = 'result'
        await userStore.fetchProfile()
      } else {
        message.value = '继续要牌还是停牌？'
      }
    }
  } catch (error) {
    message.value = error.message || '要牌失败'
    messageType.value = 'error'
  } finally {
    isProcessing.value = false
  }
}

async function stand() {
  try {
    isProcessing.value = true
    message.value = '庄家要牌中...'
    
    const res = await api.post('/game/blackjack/stand')
    
    if (res.data.success) {
      const data = res.data.data
      dealerCards.value = parseDealerCards(data.dealerCards)
      dealerPoints.value = data.dealerPoints
      
      gamePhase.value = 'result'
      
      switch (data.result) {
        case 'win':
          message.value = `胜利！赢得 ${data.winAmount} 两`
          messageType.value = 'win'
          break
        case 'lose':
          message.value = `失败！失去 ${bet.value} 两`
          messageType.value = 'lose'
          break
        case 'push':
          message.value = `平局！返还 ${data.winAmount} 两`
          messageType.value = 'info'
          break
      }
      
      await userStore.fetchProfile()
    }
  } catch (error) {
    message.value = error.message || '停牌失败'
    messageType.value = 'error'
  } finally {
    isProcessing.value = false
  }
}

async function doubleDown() {
  // TODO: 实现加倍功能
  message.value = '加倍功能开发中...'
}

async function resetGame() {
  gamePhase.value = 'betting'
  bet.value = 0
  dealerCards.value = []
  playerCards.value = []
  dealerPoints.value = 0
  playerPoints.value = 0
  message.value = '请下注开始游戏'
  messageType.value = 'info'
}

// 辅助函数：解析牌面数据
function parseDealerCards(data) {
  if (!data) return []
  return data.split(',').map(card => parseCard(card))
}

function parsePlayerCards(data) {
  if (!data) return []
  return data.split(',').map(card => parseCard(card))
}

function parseCard(cardStr) {
  if (!cardStr || cardStr.trim() === '') return null
  
  // 后端返回格式：如 "H10", "SA", "D3" 等
  // 第一个字符是花色，后面是点数
  const suit = cardStr.charAt(0)
  const value = cardStr.substring(1)
  
  return { suit, value, hidden: false }
}
</script>

<style scoped>
.blackjack-game {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

/* 牌桌区域 */
.table-area {
  background: linear-gradient(135deg, #0a482a 0%, #1a7a4a 50%, #0a482a 100%);
  border-radius: 100px;
  border: 8px solid #5a3a2a;
  padding: 40px 20px;
  position: relative;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
}

/* 玩家/庄家区域 */
.dealer-area,
.player-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  border: 3px solid #ffd700;
}

.player-name {
  color: #fff;
  font-weight: bold;
  font-size: 18px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.player-silver {
  background: rgba(255, 215, 0, 0.3);
  padding: 4px 12px;
  border-radius: 20px;
  color: #ffd700;
  font-size: 14px;
  font-weight: bold;
}

/* 卡牌容器 */
.card-container {
  display: flex;
  justify-content: center;
  gap: 8px;
  min-height: 150px;
  perspective: 1000px;
}

.card-slot {
  width: 70px;
  height: 100px;
  position: relative;
}

.playing-card {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  transition: transform 0.3s ease;
}

.card-hidden {
  filter: brightness(0.7);
}

/* 点数显示 */
.points-display {
  margin-top: 15px;
  color: #fff;
  font-size: 20px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.points-value {
  font-weight: bold;
  color: #ffd700;
  font-size: 28px;
  min-width: 40px;
  display: inline-block;
}

/* 中央区域 */
.table-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin: 20px 0;
}

.pot-display {
  background: rgba(0,0,0,0.4);
  padding: 10px 24px;
  border-radius: 30px;
  border: 2px solid #ffd700;
  color: #ffd700;
  font-size: 24px;
  font-weight: bold;
}

.game-message {
  padding: 12px 24px;
  border-radius: 20px;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.game-message.win {
  background: rgba(34, 197, 94, 0.3);
  color: #4ade80;
  border: 2px solid #22c55e;
}

.game-message.lose {
  background: rgba(239, 68, 68, 0.3);
  color: #f87171;
  border: 2px solid #ef4444;
}

.game-message.info {
  background: rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  border: 2px solid #3b82f6;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  padding: 16px 32px;
  font-size: 18px;
  font-weight: bold;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  min-width: 100px;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-hit {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: #fff;
}

.btn-hit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
}

.btn-stand {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
}

.btn-stand:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

.btn-double {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
}

.btn-new-game {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
}

/* 下注区域 */
.bet-area {
  background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
  border-radius: 20px;
  padding: 30px;
  margin-top: 30px;
  border: 3px solid #3b82f6;
}

.bet-title {
  color: #fff;
  font-size: 24px;
  text-align: center;
  margin-bottom: 20px;
}

.chip-selector {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.chip {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  border: 4px dashed #fff;
  transition: all 0.2s;
}

.chip:hover {
  transform: scale(1.1);
}

.chip.selected {
  border-style: solid;
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.6);
  animation: none;
}

.chip.custom {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
}

.bet-input {
  margin-bottom: 20px;
  text-align: center;
}

.bet-input input {
  width: 200px;
  padding: 12px 20px;
  font-size: 18px;
  border: 2px solid #3b82f6;
  border-radius: 10px;
  background: rgba(255,255,255,0.1);
  color: #fff;
  text-align: center;
}

.bet-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 20px;
}

.bet-btn {
  padding: 14px 40px;
  font-size: 18px;
  font-weight: bold;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.bet-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bet-btn:not(:disabled) {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: #fff;
}

.bet-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
}

.bet-all {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
}

.quick-bets {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-bets button {
  padding: 8px 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 20px;
  background: rgba(255,255,255,0.1);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-bets button:hover {
  background: rgba(255,255,255,0.2);
  border-color: #fff;
}

/* 卡牌动画 */
.card-deal-enter-from,
.card-deal-leave-to {
  opacity: 0;
  transform: translateY(-50px) rotate(-10deg);
}

.card-deal-enter-active {
  transition: all 0.5s ease;
}

.card-deal-leave-active {
  transition: all 0.3s ease;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .table-area {
    border-radius: 20px;
    padding: 20px 10px;
    border-width: 4px;
  }
  
  .card-slot {
    width: 50px;
    height: 75px;
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    font-size: 22px;
  }
  
  .player-name {
    font-size: 14px;
  }
  
  .points-value {
    font-size: 22px;
  }
  
  .action-btn {
    padding: 12px 20px;
    font-size: 16px;
    min-width: 80px;
  }
  
  .chip {
    width: 56px;
    height: 56px;
    font-size: 14px;
  }
  
  .bet-area {
    padding: 20px 15px;
  }
}
</style>
