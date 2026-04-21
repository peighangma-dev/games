<template>
  <div class="fishing-game">
    <!-- 钓鱼场景 -->
    <div class="fishing-scene" ref="sceneRef">
      <!-- 天空背景 -->
      <div class="sky">
        <div class="sun">☀️</div>
        <div class="cloud cloud1">☁️</div>
        <div class="cloud cloud2">☁️</div>
        <div class="cloud cloud3">☁️</div>
      </div>
      
      <!-- 水面 -->
      <div class="water">
        <div class="wave wave1"></div>
        <div class="wave wave2"></div>
        <div class="wave wave3"></div>
      </div>
      
      <!-- 玩家 -->
      <div class="player">
        <div class="player-sprite">🎣</div>
        <div class="player-name">{{ userStore.user?.username }}</div>
      </div>
      
      <!-- 鱼漂 -->
      <div
        v-if="isFishing"
        class="bobber"
        :class="{ 'biting': isBiting, 'pulled': isPulled }"
        :style="bobberStyle"
      >
        <div class="bobber-float"></div>
        <div class="bobber-line"></div>
      </div>
      
      <!-- 鱼跃出效果 -->
      <transition name="fish-jump">
        <div v-if="showFishJump" class="jumping-fish" :style="fishJumpStyle">
          🐟
        </div>
      </transition>
      
      <!-- 其他玩家（多人模式） -->
      <div v-for="player in otherPlayers" :key="player.username" class="other-player">
        <div class="player-sprite">🎣</div>
        <div class="player-name">{{ player.username }}</div>
      </div>
    </div>
    
    <!-- 控制区域 -->
    <div class="control-panel">
      <!-- 状态显示 -->
      <div class="status-bar">
        <div class="status-item">
          <span class="label">状态：</span>
          <span class="value" :class="fishingStatusClass">{{ fishingStatusText }}</span>
        </div>
        <div class="status-item">
          <span class="label">时间：</span>
          <span class="value">{{ elapsedTime }}s</span>
        </div>
        <div class="status-item">
          <span class="label">银两：</span>
          <span class="value">{{ userStore.user?.silver || 0 }} 两</span>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button
          v-if="!isFishing"
          class="action-btn cast-btn"
          @click="startFishing"
          :disabled="isProcessing"
        >
          抛竿
        </button>
        
        <button
          v-if="isFishing && !waitingForBite"
          class="action-btn reel-btn"
          @click="reelIn"
          :disabled="isProcessing"
        >
          收竿
        </button>
        
        <div v-if="waitingForBite" class="waiting-message">
          <div class="spinner">🌊</div>
          <p>等待鱼儿上钩...</p>
          <p class="hint">最佳收竿时机：3-12 秒</p>
        </div>
      </div>
      
      <!-- 鱼获显示 -->
      <div v-if="catchResult" class="catch-panel">
        <div class="catch-header" :class="catchRarity">
          <h3>{{ catchResult.name }}</h3>
          <div class="catch-value">+{{ catchResult.value }} 两</div>
        </div>
        
        <div v-if="catchResult.message" class="catch-message">
          {{ catchResult.message }}
        </div>
        
        <button class="continue-btn" @click="resetFishing">
          继续钓鱼
        </button>
      </div>
      
      <!-- 鱼类图鉴 -->
      <div class="fish-dex">
        <details>
          <summary>📖 鱼类图鉴</summary>
          <div class="dex-grid">
            <div
              v-for="fish in fishTypes"
              :key="fish.name"
              class="dex-entry"
              :class="{ caught: caughtFish.has(fish.name) }"
            >
              <div class="dex-icon">{{ fish.icon }}</div>
              <div class="dex-info">
                <div class="dex-name">{{ fish.name }}</div>
                <div class="dex-value">{{ fish.value }} 两</div>
                <div class="dex-count">x{{ caughtCount[fish.name] || 0 }}</div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '../../stores/user'
import api from '../../utils/api'

const userStore = useUserStore()

// 游戏状态
const isFishing = ref(false)
const isProcessing = ref(false)
const waitingForBite = ref(false)
const fishingStartTime = ref(null)
const elapsedTime = ref(0)
const catchResult = ref(null)
const showFishJump = ref(false)
const fishJumpStyle = ref({})

// 多人模式
const otherPlayers = ref([])
const socket = ref(null)

// 鱼类数据
const fishTypes = [
  { name: '草鞋板', value: 10, icon: '🐟', chance: 30 },
  { name: '小鲫鱼', value: 50, icon: '🐠', chance: 25 },
  { name: '鲤鱼', value: 100, icon: '🎏', chance: 15 },
  { name: '大草鱼', value: 200, icon: '🐟', chance: 10 },
  { name: '金龙鱼', value: 500, icon: '🐉', chance: 5 },
  { name: '锦鲤', value: 1000, icon: '🌟', chance: 1 },
  { name: '什么也没钓到', value: 0, icon: '🌊', chance: 14 }
]

// 捕获统计
const caughtFish = ref(new Set())
const caughtCount = ref({})

// 钓鱼计时器
let timerInterval = null

// 计算属性
const fishingStatusText = computed(() => {
  if (!isFishing.value) return '未开始'
  if (waitingForBite.value) return '等待中'
  return '已上钩'
})

const fishingStatusClass = computed(() => {
  if (!isFishing.value) return ''
  if (waitingForBite.value) return 'waiting'
  return 'ready'
})

const bobberStyle = computed(() => {
  if (!isFishing.value) return {}
  
  // 鱼漂浮动动画
  const time = Date.now() / 1000
  const bobbing = Math.sin(time * 2) * 10
  
  return {
    transform: `translateY(${bobbing}px)`
  }
})

// 方法
async function startFishing() {
  try {
    isProcessing.value = true
    
    const res = await api.post('/game/fish/start')
    
    if (res.data.success) {
      isFishing.value = true
      waitingForBite.value = true
      fishingStartTime.value = Date.now()
      elapsedTime.value = 0
      catchResult.value = null
      
      // 开始计时
      timerInterval = setInterval(() => {
        elapsedTime.value = Math.floor((Date.now() - fishingStartTime.value) / 1000)
      }, 1000)
      
      // 模拟咬钩时间（3-8 秒随机）
      setTimeout(() => {
        if (isFishing.value) {
          waitingForBite.value = false
          // 播放咬钩动画
          playBiteAnimation()
        }
      }, 3000 + Math.random() * 5000)
    } else {
      catchResult.value = {
        name: '失败',
        value: 0,
        message: res.data.message || '钓鱼失败'
      }
    }
  } catch (error) {
    catchResult.value = {
      name: '失败',
      value: 0,
      message: error.message || '钓鱼失败'
    }
  } finally {
    isProcessing.value = false
  }
}

async function reelIn() {
  try {
    isProcessing.value = true
    
    const res = await api.post('/game/fish/reel')
    
    if (res.data.success) {
      const data = res.data.data
      catchResult.value = {
        name: data.catch,
        value: data.value,
        message: getFishMessage(data.catch)
      }
      
      // 更新统计数据
      if (data.value > 0) {
        caughtFish.value.add(data.catch)
        caughtCount.value[data.catch] = (caughtCount.value[data.catch] || 0) + 1
      }
      
      // 播放鱼跃动画
      playFishJump()
      
      // 更新用户银两
      await userStore.fetchProfile()
    }
  } catch (error) {
    catchResult.value = {
      name: '失败',
      value: 0,
      message: error.message || '收竿失败'
    }
  } finally {
    isProcessing.value = false
    stopFishing()
  }
}

function stopFishing() {
  isFishing.value = false
  waitingForBite.value = false
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function resetFishing() {
  catchResult.value = null
  elapsedTime.value = 0
}

function getFishMessage(fishName) {
  const messages = {
    '草鞋板': '一条小鱼，聊胜于无',
    '小鲫鱼': '不错不错，今晚有鱼吃了',
    '鲤鱼': '哇！是鲤鱼！好运来！',
    '大草鱼': '大鱼！力道真大！',
    '金龙鱼': '传说中的金龙鱼！发财了！',
    '锦鲤': '锦鲤附体！运气爆棚！',
    '什么也没钓到': '鱼儿都不给面子...'
  }
  return messages[fishName] || '收竿完成'
}

function playBiteAnimation() {
  // 咬钩动画效果
  const bobber = document.querySelector('.bobber')
  if (bobber) {
    bobber.classList.add('biting')
    setTimeout(() => {
      bobber.classList.remove('biting')
      bobber.classList.add('pulled')
    }, 500)
  }
}

function playFishJump() {
  showFishJump.value = true
  fishJumpStyle.value = {
    left: '50%',
    transform: 'translateX(-50%)'
  }
  
  setTimeout(() => {
    showFishJump.value = false
  }, 1000)
}

// Socket.IO 多人模式（预留）
function initSocket() {
  // TODO: 集成 Socket.IO 实现多人钓鱼房间
  // socket = io()
  // socket.on('fishing:players', (players) => {
  //   otherPlayers.value = players.filter(p => p.username !== userStore.user.username)
  // })
}

// 生命周期
onMounted(() => {
  initSocket()
})

onUnmounted(() => {
  stopFishing()
  if (socket.value) {
    socket.value.disconnect()
  }
})
</script>

<style scoped>
.fishing-game {
  max-width: 900px;
  margin: 0 auto;
}

/* 钓鱼场景 */
.fishing-scene {
  position: relative;
  height: 300px;
  background: linear-gradient(180deg, 
    #87CEEB 0%,
    #4A90E2 40%,
    #2E5C8A 60%,
    #1a3a5c 100%
  );
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

/* 天空 */
.sky {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60%;
  padding: 20px;
}

.sun {
  position: absolute;
  top: 20px;
  right: 40px;
  font-size: 60px;
  animation: sun-glow 2s infinite;
}

@keyframes sun-glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.2); }
}

.cloud {
  position: absolute;
  font-size: 40px;
  opacity: 0.8;
  animation: float 20s linear infinite;
}

.cloud1 { left: 10%; top: 30px; animation-duration: 25s; }
.cloud2 { left: 40%; top: 60px; animation-duration: 30s; }
.cloud3 { left: 70%; top: 20px; animation-duration: 22s; }

@keyframes float {
  0% { transform: translateX(-100px); }
  100% { transform: translateX(calc(100vw + 100px)); }
}

/* 水面 */
.water {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(180deg,
    #2E5C8A 0%,
    #1a3a5c 100%
  );
  overflow: hidden;
}

.wave {
  position: absolute;
  width: 200%;
  height: 100px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120'%3E%3Cpath d='M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z' fill='rgba(255,255,255,0.1)'/%3E%3C/svg%3E");
  background-size: 50% 100%;
  animation: wave-animation 5s linear infinite;
}

.wave1 { bottom: 0; animation-duration: 5s; }
.wave2 { bottom: 30px; animation-duration: 7s; opacity: 0.7; }
.wave3 { bottom: 60px; animation-duration: 3s; opacity: 0.5; }

@keyframes wave-animation {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* 玩家 */
.player {
  position: absolute;
  bottom: 60px;
  left: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.player-sprite {
  font-size: 60px;
  animation: fish-stand 2s infinite;
}

@keyframes fish-stand {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(5deg); }
}

.player-name {
  color: #fff;
  font-size: 12px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
  white-space: nowrap;
}

.other-player {
  position: absolute;
  bottom: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 鱼漂 */
.bobber {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  transition: transform 0.3s;
}

.bobber-float {
  width: 20px;
  height: 30px;
  background: linear-gradient(180deg, #fff 50%, #ff4444 50%);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.bobber-line {
  width: 2px;
  height: 100px;
  background: rgba(255,255,255,0.5);
  position: absolute;
  bottom: -100px;
  left: 50%;
  transform: translateX(-50%);
}

.bobber.biting .bobber-float {
  animation: bite-shake 0.5s infinite;
}

@keyframes bite-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.bobber.pulled {
  transform: translateX(-50%) translateY(30px);
}

.bobber.pulled .bobber-float {
  background: linear-gradient(180deg, #fff 50%, #4ade80 50%);
}

/* 鱼跃动画 */
.fish-jump-enter-active,
.fish-jump-leave-active {
  transition: all 0.5s;
}

.fish-jump-enter-from {
  opacity: 0;
  transform: translateX(-50%) scale(0.5);
}

.fish-jump-leave-to {
  opacity: 0;
  transform: translateX(-50%) scale(1.5);
}

.jumping-fish {
  position: absolute;
  bottom: 80px;
  font-size: 60px;
  z-index: 10;
}

/* 控制面板 */
.control-panel {
  background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
  border-radius: 16px;
  padding: 24px;
  margin-top: 20px;
}

.status-bar {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
}

.status-item {
  text-align: center;
}

.status-item .label {
  display: block;
  color: #94a3b8;
  font-size: 12px;
  margin-bottom: 4px;
}

.status-item .value {
  display: block;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.status-item .value.waiting {
  color: #f59e0b;
  animation: pulse-yellow 1s infinite;
}

.status-item .value.ready {
  color: #22c55e;
  animation: pulse-green 1s infinite;
}

@keyframes pulse-yellow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes pulse-green {
  0%, 100% { opacity: 1; box-shadow: 0 0 10px rgba(34, 197, 94, 0.5); }
  50% { opacity: 0.7; box-shadow: 0 0 20px rgba(34, 197, 94, 0.8); }
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.action-btn {
  padding: 18px 48px;
  font-size: 20px;
  font-weight: bold;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.cast-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
}

.cast-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
}

.reel-btn {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: #fff;
}

.reel-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(34, 197, 94, 0.4);
}

.waiting-message {
  text-align: center;
  color: #fff;
}

.spinner {
  font-size: 40px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.hint {
  color: #94a3b8;
  font-size: 14px;
  margin-top: 8px;
}

/* 鱼获面板 */
.catch-panel {
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}

.catch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.catch-header.common {
  background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
}

.catch-header.rare {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.catch-header.epic {
  background: linear-gradient(135deg, #a855f7 0%, #7e22ce 100%);
}

.catch-header.legendary {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  animation: glow-gold 1s infinite;
}

@keyframes glow-gold {
  0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.5); }
  50% { box-shadow: 0 0 40px rgba(245, 158, 11, 0.8); }
}

.catch-header h3 {
  color: #fff;
  font-size: 24px;
}

.catch-value {
  color: #ffd700;
  font-size: 22px;
  font-weight: bold;
}

.catch-message {
  color: #94a3b8;
  text-align: center;
  padding: 12px;
  font-size: 16px;
  margin-bottom: 16px;
}

.continue-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

/* 鱼类图鉴 */
.fish-dex {
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 16px;
}

.fish-dex summary {
  color: #ffd700;
  cursor: pointer;
  font-weight: bold;
  margin-bottom: 12px;
}

.dex-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.dex-entry {
  background: rgba(255,255,255,0.05);
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s;
}

.dex-entry.caught {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.dex-icon {
  font-size: 32px;
}

.dex-info {
  flex: 1;
}

.dex-name {
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
}

.dex-value {
  color: #ffd700;
  font-size: 12px;
  margin-bottom: 4px;
}

.dex-count {
  color: #94a3b8;
  font-size: 11px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .fishing-scene {
    height: 200px;
  }
  
  .player-sprite {
    font-size: 40px;
  }
  
  .status-bar {
    flex-direction: column;
    gap: 12px;
  }
  
  .action-btn {
    padding: 14px 32px;
    font-size: 18px;
  }
  
  .dex-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
