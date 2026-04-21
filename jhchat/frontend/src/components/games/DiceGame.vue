<template>
  <div class="dice-game">
    <!-- 骰盅区域 -->
    <div class="dice-bowl" @click="!isRolling && rollDice">
      <div class="bowl-inner">
        <transition-group name="dice-shake">
          <div
            v-for="(die, index) in dice"
            :key="index"
            class="die"
            :class="{ 'rolling': isRolling }"
            :style="{ transform: getDieTransform(index) }"
          >
            <div class="die-face">
              <div
                v-for="pip in getPips(die.value)"
                :key="pip"
                class="pip"
                :style="pipStyle(pip, die.value)"
              ></div>
            </div>
          </div>
        </transition-group>
        
        <div v-if="isRolling" class="rolling-overlay">
          <div class="shake-icon">🎲</div>
          <p>摇晃中...</p>
        </div>
      </div>
    </div>
    
    <!-- 下注区域 -->
    <div class="bet-section">
      <h3 class="section-title">下注</h3>
      
      <div class="bet-input-group">
        <label>下注金额</label>
        <div class="input-with-buttons">
          <button class="chip-btn" @click="adjustBet(-100)">-100</button>
          <input
            v-model.number="bet"
            type="number"
            min="1"
            :max="userStore.user?.silver || 0"
            class="bet-input"
          />
          <button class="chip-btn" @click="adjustBet(100)">+100</button>
        </div>
      </div>
      
      <div class="quick-bets">
        <button
          v-for="amount in [100, 500, 1000, 5000]"
          :key="amount"
          :class="{ selected: bet === amount }"
          @click="bet = amount"
          class="quick-bet-btn"
        >
          {{ amount }}
        </button>
        <button
          :class="{ selected: bet === userStore.user?.silver }"
          @click="betAll"
          class="quick-bet-btn all-in"
        >
          全押
        </button>
      </div>
    </div>
    
    <!-- 押注选项 -->
    <div class="bet-options">
      <h3 class="section-title">押注</h3>
      
      <div class="option-grid">
        <div
          class="bet-option"
          :class="{
            selected: choice === 'big',
            result: gameResult !== null,
            win: choice === 'big' && won,
            lose: choice === 'big' && !won
          }"
          @click="selectOption('big')"
        >
          <div class="option-icon">📈</div>
          <div class="option-name">大</div>
          <div class="option-desc">(11-17)</div>
          <div class="option-rate">1:1</div>
        </div>
        
        <div
          class="bet-option"
          :class="{
            selected: choice === 'small',
            result: gameResult !== null,
            win: choice === 'small' && won,
            lose: choice === 'small' && !won
          }"
          @click="selectOption('small')"
        >
          <div class="option-icon">📉</div>
          <div class="option-name">小</div>
          <div class="option-desc">(4-10)</div>
          <div class="option-rate">1:1</div>
        </div>
        
        <div
          class="bet-option special"
          :class="{
            selected: choice === 'baozi',
            result: gameResult !== null,
            win: choice === 'baozi' && isBaozi,
            lose: choice === 'baozi' && !isBaozi
          }"
          @click="selectOption('baozi')"
        >
          <div class="option-icon">🎊</div>
          <div class="option-name">豹子</div>
          <div class="option-desc">(3 同)</div>
          <div class="option-rate">1:30</div>
        </div>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="action-section">
      <button
        class="roll-btn"
        :disabled="!canRoll"
        @click="rollDice"
      >
        {{ isRolling ? '摇晃中...' : '掷骰子' }}
      </button>
    </div>
    
    <!-- 结果展示 -->
    <div v-if="gameResult !== null" class="result-section">
      <div class="result-header" :class="resultType">
        <h2>{{ resultTitle }}</h2>
        <div class="result-details">
          <div v-if="choice === 'baozi'" class="baozi-result">
            <span v-if="isBaozi">🎉 豹子！三颗相同！</span>
            <span v-else>❌ 不是豹子</span>
          </div>
          <div v-else class="normal-result">
            <span>总点数：{{ total }}</span>
            <span>{{ resultText }}</span>
          </div>
          <div class="result-amount" :class="won || (choice === 'baozi' && isBaozi) ? 'win' : 'lose'">
            {{ winAmount > 0 ? '+' : '' }}{{ winAmount }} 两
          </div>
        </div>
      </div>
      
      <button class="new-game-btn" @click="resetGame">
        再来一局
      </button>
    </div>
    
    <!-- 游戏规则 -->
    <div class="rules-section">
      <details>
        <summary>游戏规则</summary>
        <ul>
          <li>三个骰子总点数 4-10 为小，11-17 为大</li>
          <li>豹子（三颗相同）赔率 1:30</li>
          <li>猜中大/小赔率 1:1</li>
          <li>围骰（豹子）通杀大小注</li>
        </ul>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '../../stores/user'
import api from '../../utils/api'

const userStore = useUserStore()

// 游戏状态
const dice = ref([
  { value: 1 },
  { value: 1 },
  { value: 1 }
])
const isRolling = ref(false)
const bet = ref(100)
const choice = ref('big')
const gameResult = ref(null)
const won = ref(false)
const winAmount = ref(0)
const total = ref(0)
const isBaozi = ref(false)

const canRoll = computed(() => {
  return !isRolling.value && 
         bet.value > 0 && 
         bet.value <= (userStore.user?.silver || 0) &&
         choice.value
})

const resultType = computed(() => {
  if (gameResult.value === 'win') return 'win'
  if (gameResult.value === 'lose') return 'lose'
  return 'draw'
})

const resultTitle = computed(() => {
  if (gameResult.value === 'win') return '🎉 恭喜获胜！'
  if (gameResult.value === 'lose') return '❌ 很遗憾，输了'
  return '🤝 平局'
})

const resultText = computed(() => {
  if (total.value <= 10) return '开小'
  return '开大'
})

// 方法
function getPips(value) {
  const pipCounts = {
    1: [1],
    2: [1, 2],
    3: [1, 2, 3],
    4: [1, 2, 3, 4],
    5: [1, 2, 3, 4, 5],
    6: [1, 2, 3, 4, 5, 6]
  }
  return pipCounts[value] || []
}

function pipStyle(pip, value) {
  // 简单的点数位置样式
  const positions = {
    1: { gridArea: '2 / 2 / 3 / 3' },
    2: { gridArea: pip === 1 ? '1 / 1 / 2 / 2' : '3 / 3 / 4 / 4' },
    3: { gridArea: pip === 2 ? '2 / 2 / 3 / 3' : (pip === 1 ? '1 / 1 / 2 / 2' : '3 / 3 / 4 / 4') },
    // 简化处理
  }
  return positions[value] || {}
}

function getDieTransform(index) {
  if (!isRolling.value) return 'rotateX(0) rotateY(0)'
  const rotations = [
    `rotateX(${Math.random() * 720}deg) rotateY(${Math.random() * 720}deg)`,
    `rotateX(${Math.random() * 720}deg) rotateY(${Math.random() * 720}deg)`,
    `rotateX(${Math.random() * 720}deg) rotateY(${Math.random() * 720}deg)`
  ]
  return rotations[index]
}

function selectOption(option) {
  choice.value = option
  gameResult.value = null
}

function adjustBet(delta) {
  const max = userStore.user?.silver || 0
  bet.value = Math.max(1, Math.min(max, bet.value + delta))
}

function betAll() {
  bet.value = userStore.user?.silver || 0
}

async function rollDice() {
  if (!canRoll.value) return
  
  try {
    isRolling.value = true
    gameResult.value = null
    
    // 播放摇晃动画
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 调用 API
    const res = await api.post('/game/dice', {
      bet: bet.value,
      guess: choice.value
    })
    
    if (res.data.success) {
      const data = res.data.data
      
      // 更新骰子值（3 个骰子）
      dice.value = [
        { value: data.d1 },
        { value: data.d2 },
        { value: data.d3 }
      ]
      
      total.value = data.total
      isBaozi.value = data.d1 === data.d2 && data.d2 === data.d3
      won.value = data.won
      winAmount.value = data.amount || 0
      gameResult.value = data.won ? 'win' : 'lose'
      
      // 更新用户银两
      await userStore.fetchProfile()
    } else {
      gameResult.value = 'error'
    }
  } catch (error) {
    gameResult.value = 'error'
  } finally {
    isRolling.value = false
  }
}

function resetGame() {
  gameResult.value = null
  dice.value = [
    { value: 1 },
    { value: 1 },
    { value: 1 }
  ]
  total.value = 0
  isBaozi.value = false
  won.value = false
  winAmount.value = 0
}
</script>

<style scoped>
.dice-game {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

/* 骰盅区域 */
.dice-bowl {
  background: linear-gradient(135deg, #8B4513 0%, #5C3317 100%);
  border-radius: 100px;
  padding: 40px;
  margin-bottom: 30px;
  border: 8px solid #3D2416;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.dice-bowl:hover:not(.rolling) {
  transform: scale(1.02);
  box-shadow: 0 15px 50px rgba(139, 69, 19, 0.4);
}

.bowl-inner {
  display: flex;
  justify-content: center;
  gap: 20px;
  min-height: 150px;
  align-items: center;
  position: relative;
  perspective: 1000px;
}

/* 骰子样式 */
.die {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  display: grid;
  grid-template-areas: 
    ". . ."
    ". c ."
    ". . .";
  padding: 8px;
  transition: transform 0.5s ease;
  transform-style: preserve-3d;
}

.die.rolling {
  animation: shake 0.5s infinite;
}

@keyframes shake {
  0%, 100% { transform: translateX(0) rotateX(0); }
  25% { transform: translateX(-10px) rotateX(-30deg); }
  50% { transform: translateX(10px) rotateX(30deg); }
  75% { transform: translateX(-10px) rotateX(-30deg); }
}

.die-face {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 4px;
}

.pip {
  background: #000;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  justify-self: center;
  align-self: center;
}

/* 红色点数（1 点） */
.die:has(.pip:only-child) .pip {
  background: #e74c3c;
  width: 20px;
  height: 20px;
}

.rolling-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-radius: 100px;
}

.shake-icon {
  font-size: 60px;
  animation: bounce 0.5s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

/* 下注区域 */
.bet-section {
  background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
}

.section-title {
  color: #ffd700;
  font-size: 20px;
  margin-bottom: 16px;
}

.bet-input-group {
  margin-bottom: 16px;
}

.bet-input-group label {
  display: block;
  color: #94a3b8;
  font-size: 14px;
  margin-bottom: 8px;
}

.input-with-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bet-input {
  flex: 1;
  padding: 12px 16px;
  font-size: 18px;
  border: 2px solid #3b82f6;
  border-radius: 10px;
  background: rgba(255,255,255,0.1);
  color: #fff;
  text-align: center;
}

.chip-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.chip-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

/* 快速下注 */
.quick-bets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-bet-btn {
  flex: 1;
  min-width: 80px;
  padding: 12px;
  background: rgba(255,255,255,0.1);
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.quick-bet-btn:hover {
  background: rgba(255,255,255,0.2);
  border-color: #fff;
}

.quick-bet-btn.selected {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border-color: #22c55e;
}

.quick-bet-btn.all-in {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-color: #f59e0b;
}

/* 押注选项 */
.bet-options {
  background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.bet-option {
  background: rgba(255,255,255,0.05);
  border: 2px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.bet-option:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.4);
}

.bet-option.selected {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: #3b82f6;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
}

.bet-option.result.win {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border-color: #22c55e;
  animation: pulse-green 1s infinite;
}

@keyframes pulse-green {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.bet-option.result.lose {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-color: #ef4444;
}

.option-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.option-name {
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 4px;
}

.option-desc {
  color: #94a3b8;
  font-size: 12px;
  margin-bottom: 8px;
}

.option-rate {
  color: #ffd700;
  font-size: 14px;
  font-weight: bold;
}

/* 动作区域 */
.action-section {
  margin-bottom: 20px;
}

.roll-btn {
  width: 100%;
  padding: 20px;
  font-size: 22px;
  font-weight: bold;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: #fff;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
}

.roll-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(34, 197, 94, 0.5);
}

.roll-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 结果区域 */
.result-section {
  margin-top: 20px;
}

.result-header {
  background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  margin-bottom: 20px;
  border: 3px solid;
}

.result-header.win {
  border-color: #22c55e;
  animation: glow-green 1s infinite;
}

@keyframes glow-green {
  0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.5); }
  50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.8); }
}

.result-header.lose {
  border-color: #ef4444;
}

.result-header h2 {
  font-size: 32px;
  margin-bottom: 16px;
}

.result-details {
  color: #fff;
  font-size: 18px;
  line-height: 2;
}

.baozi-result, .normal-result {
  margin-bottom: 12px;
}

.result-amount {
  font-size: 36px;
  font-weight: bold;
  margin-top: 16px;
}

.result-amount.win {
  color: #4ade80;
}

.result-amount.lose {
  color: #f87171;
}

.new-game-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.new-game-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

/* 规则区域 */
.rules-section {
  margin-top: 30px;
}

.rules-section details {
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 16px;
}

.rules-section summary {
  color: #ffd700;
  cursor: pointer;
  font-weight: bold;
  margin-bottom: 12px;
}

.rules-section ul {
  color: #94a3b8;
  padding-left: 20px;
}

.rules-section li {
  margin-bottom: 8px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .dice-bowl {
    padding: 20px;
  }
  
  .die {
    width: 60px;
    height: 60px;
  }
  
  .bowl-inner {
    gap: 12px;
  }
  
  .option-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .bet-option {
    padding: 12px 8px;
  }
  
  .option-icon {
    font-size: 24px;
  }
  
  .option-name {
    font-size: 16px;
  }
  
  .roll-btn {
    padding: 16px;
    font-size: 18px;
  }
}
</style>
