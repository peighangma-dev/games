<template>
  <div class="games-page">
    <div class="nav-bar">
      <router-link to="/main">首页</router-link>
      <router-link to="/chat">聊天</router-link>
      <span class="nav-spacer"></span>
      <router-link to="/profile">{{ userStore.username }}</router-link>
    </div>

    <div class="page-container">
      <div class="title-bar">
        <h1>游戏大厅</h1>
      </div>

      <div class="game-grid">
        <div class="game-card card" @click="openGame('blackjack')">
          <div class="game-icon">&#9824;</div>
          <div class="game-name">21点</div>
          <div class="game-desc">经典纸牌，点数过21则输</div>
        </div>
        <div class="game-card card" @click="openGame('dice')">
          <div class="game-icon">&#9856;</div>
          <div class="game-name">骰子</div>
          <div class="game-desc">押大小，一掷千金</div>
        </div>
        <div class="game-card card" @click="openGame('high-low')">
          <div class="game-icon">&#8597;</div>
          <div class="game-name">猜大小</div>
          <div class="game-desc">猜中翻倍，猜错归零</div>
        </div>
        <div class="game-card card" @click="openGame('fish')">
          <div class="game-icon">&#9875;</div>
          <div class="game-name">钓鱼</div>
          <div class="game-desc">湖边垂钓，收获惊喜</div>
        </div>
        <div class="game-card card" @click="openGame('hunt')">
          <div class="game-icon">&#127993;</div>
          <div class="game-name">打猎</div>
          <div class="game-desc">深山打猎，获取资源</div>
        </div>
        <div class="game-card card" @click="openGame('othello')">
          <div class="game-icon">&#9675;</div>
          <div class="game-name">比山论剑</div>
          <div class="game-desc">黑白棋对弈，斗智斗勇</div>
        </div>
      </div>

      <div v-if="currentGame" class="modal-overlay" @click.self="currentGame = null">
        <div class="modal-card card game-modal">
          <h3>{{ gameTitle }}</h3>
          <div class="game-content">
            <div v-if="currentGame === 'blackjack'" class="game-panel">
              <div class="form-group">
                <label>下注金额</label>
                <input v-model.number="betAmount" type="number" min="1" />
              </div>
              <div v-if="gameState.hand" class="hand-info">
                <p>手牌: {{ gameState.hand }}</p>
                <p>点数: {{ gameState.score }}</p>
              </div>
              <div class="game-btns">
                <button class="btn btn-primary" @click="blackjackBet" v-if="!gameState.playing">下注</button>
                <button class="btn btn-primary" @click="blackjackHit" v-if="gameState.playing">要牌</button>
                <button class="btn" @click="blackjackStand" v-if="gameState.playing">停牌</button>
              </div>
            </div>

            <div v-if="currentGame === 'dice'" class="game-panel">
              <div class="form-group">
                <label>下注金额</label>
                <input v-model.number="betAmount" type="number" min="1" />
              </div>
              <div class="form-group">
                <label>押注</label>
                <select v-model="diceChoice">
                  <option value="big">大</option>
                  <option value="small">小</option>
                </select>
              </div>
              <button class="btn btn-primary" @click="playDice">掷骰子</button>
            </div>

            <div v-if="currentGame === 'high-low'" class="game-panel">
              <div class="form-group">
                <label>下注金额</label>
                <input v-model.number="betAmount" type="number" min="1" />
              </div>
              <div class="form-group">
                <label>猜</label>
                <select v-model="highLowChoice">
                  <option value="high">大</option>
                  <option value="low">小</option>
                </select>
              </div>
              <button class="btn btn-primary" @click="playHighLow">猜大小</button>
            </div>

            <div v-if="currentGame === 'fish'" class="game-panel">
              <button class="btn btn-primary" @click="startFish" v-if="!gameState.fishing">开始钓鱼</button>
              <button class="btn" @click="reelFish" v-if="gameState.fishing">收竿</button>
            </div>

            <div v-if="currentGame === 'hunt'" class="game-panel">
              <button class="btn btn-primary" @click="doHunt">开始打猎</button>
            </div>

            <div v-if="currentGame === 'othello'" class="game-panel">
              <p class="game-hint">请在聊天室中使用命令与其他玩家对弈</p>
            </div>
          </div>
          <div v-if="gameResult" class="game-result">{{ gameResult }}</div>
          <div class="modal-actions">
            <button class="btn" @click="currentGame = null">关闭</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const userStore = useUserStore()

const currentGame = ref(null)
const betAmount = ref(100)
const diceChoice = ref('big')
const highLowChoice = ref('high')
const gameResult = ref('')
const gameState = reactive({
  playing: false,
  hand: '',
  score: 0,
  fishing: false
})

const gameTitle = computed(() => {
  const map = {
    blackjack: '21点', dice: '骰子', 'high-low': '猜大小',
    fish: '钓鱼', hunt: '打猎', othello: '比山论剑'
  }
  return map[currentGame.value] || ''
})

function openGame(name) {
  currentGame.value = name
  gameResult.value = ''
  gameState.playing = false
  gameState.hand = ''
  gameState.score = 0
  gameState.fishing = false
}

async function blackjackBet() {
  try {
    const res = await api.post('/games/blackjack/bet', { amount: betAmount.value })
    if (res.success) {
      gameState.playing = true
      gameState.hand = res.data?.hand || ''
      gameState.score = res.data?.score || 0
      gameResult.value = ''
    } else {
      gameResult.value = res.message || '下注失败'
    }
  } catch (err) {
    gameResult.value = err.message || '下注失败'
  }
}

async function blackjackHit() {
  try {
    const res = await api.post('/games/blackjack/hit')
    if (res.success) {
      gameState.hand = res.data?.hand || ''
      gameState.score = res.data?.score || 0
      if (res.data?.done) {
        gameState.playing = false
        gameResult.value = res.message || '结束'
        await userStore.fetchProfile()
      }
    } else {
      gameState.playing = false
      gameResult.value = res.message || '要牌失败'
      await userStore.fetchProfile()
    }
  } catch (err) {
    gameState.playing = false
    gameResult.value = err.message || '要牌失败'
  }
}

async function blackjackStand() {
  try {
    const res = await api.post('/games/blackjack/stand')
    gameState.playing = false
    gameResult.value = res.message || '停牌'
    await userStore.fetchProfile()
  } catch (err) {
    gameState.playing = false
    gameResult.value = err.message || '停牌失败'
  }
}

async function playDice() {
  try {
    const res = await api.post('/games/dice', { amount: betAmount.value, choice: diceChoice.value })
    gameResult.value = res.message || '掷骰子完成'
    await userStore.fetchProfile()
  } catch (err) {
    gameResult.value = err.message || '掷骰子失败'
  }
}

async function playHighLow() {
  try {
    const res = await api.post('/games/high-low', { amount: betAmount.value, choice: highLowChoice.value })
    gameResult.value = res.message || '猜大小完成'
    await userStore.fetchProfile()
  } catch (err) {
    gameResult.value = err.message || '猜大小失败'
  }
}

async function startFish() {
  try {
    const res = await api.post('/games/fish/start')
    if (res.success) {
      gameState.fishing = true
      gameResult.value = '鱼已上钩，快收竿！'
    } else {
      gameResult.value = res.message || '钓鱼失败'
    }
  } catch (err) {
    gameResult.value = err.message || '钓鱼失败'
  }
}

async function reelFish() {
  try {
    const res = await api.post('/games/fish/reel')
    gameState.fishing = false
    gameResult.value = res.message || '收竿完成'
    await userStore.fetchProfile()
  } catch (err) {
    gameState.fishing = false
    gameResult.value = err.message || '收竿失败'
  }
}

async function doHunt() {
  try {
    const res = await api.post('/games/hunt')
    gameResult.value = res.message || '打猎完成'
    await userStore.fetchProfile()
  } catch (err) {
    gameResult.value = err.message || '打猎失败'
  }
}
</script>

<style scoped>
.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.game-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.game-card:hover {
  border-color: #4B87C3;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(75, 135, 195, 0.2);
}

.game-icon {
  font-size: 36px;
  color: #7eb8da;
}

.game-name {
  color: #eee;
  font-size: 16px;
  font-weight: bold;
}

.game-desc {
  color: #888;
  font-size: 13px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.game-modal {
  width: 450px;
  max-width: 90vw;
}

.game-modal h3 {
  color: #7eb8da;
  margin-bottom: 16px;
  text-align: center;
}

.game-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  color: #aaa;
  font-size: 13px;
}

.hand-info {
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.hand-info p {
  color: #ccc;
  margin-bottom: 4px;
}

.game-btns {
  display: flex;
  gap: 8px;
}

.game-hint {
  color: #888;
  text-align: center;
  padding: 20px;
}

.game-result {
  margin-top: 12px;
  padding: 10px;
  background: rgba(74, 124, 89, 0.2);
  border: 1px solid rgba(74, 124, 89, 0.4);
  border-radius: 4px;
  color: #8fc9a0;
  text-align: center;
}

.modal-actions {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

.nav-spacer {
  flex: 1;
}
</style>
