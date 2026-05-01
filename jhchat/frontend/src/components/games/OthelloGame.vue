<template>
  <div class="othello-game">
    <div class="game-header">
      <div class="player-info" :class="{ active: currentPlayer === 'black' }">
        <div class="player-piece black"></div>
        <div class="player-details">
          <div class="player-name">黑方（你）</div>
          <div class="player-count">{{ blackCount }}</div>
        </div>
      </div>
      
      <div class="vs-divider">VS</div>
      
      <div class="player-info" :class="{ active: currentPlayer === 'white' }">
        <div class="player-details">
          <div class="player-name">白方（AI）</div>
          <div class="player-count">{{ whiteCount }}</div>
        </div>
        <div class="player-piece white"></div>
      </div>
    </div>

    <!-- 棋盘 -->
    <div class="board-container">
      <div class="board">
        <div 
          v-for="(cell, index) in board" 
          :key="index"
          class="cell"
          :class="{ 'valid-move': isValidMove(index), 'last-move': lastMove === index }"
          @click="placePiece(index)"
        >
          <div v-if="cell" class="piece" :class="[cell, 'piece-animate']"></div>
          <div v-if="isValidMove(index)" class="valid-marker"></div>
        </div>
      </div>
    </div>

    <!-- 游戏信息 -->
    <div class="game-info">
      <div v-if="winner" class="game-result">
        <div class="result-text">
          {{ winner === 'draw' ? '平局！' : (winner === 'black' ? '🎉 你赢了！' : '😢 AI 获胜！') }}
        </div>
        <button class="restart-btn" @click="restartGame">再来一局</button>
      </div>
      <div v-else class="turn-indicator">
        {{ currentPlayer === 'black' ? '你的回合' : 'AI 思考中...' }}
      </div>
    </div>

    <!-- 胜利动画 -->
    <div v-if="showWinAnimation" class="win-animation">
      <div class="win-text">🎊 胜利！ 🎊</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const BOARD_SIZE = 8
const board = ref(Array(BOARD_SIZE * BOARD_SIZE).fill(null))
const currentPlayer = ref('black')
const blackCount = ref(2)
const whiteCount = ref(2)
const lastMove = ref(null)
const winner = ref(null)
const showWinAnimation = ref(false)

// 初始化棋盘
function initBoard() {
  const center = BOARD_SIZE * BOARD_SIZE / 2
  board.value[center - BOARD_SIZE / 2 - 1] = 'white'
  board.value[center - BOARD_SIZE / 2] = 'black'
  board.value[center + BOARD_SIZE / 2 - 1] = 'black'
  board.value[center + BOARD_SIZE / 2] = 'white'
  updateCounts()
}

// 计算棋子数量
function updateCounts() {
  blackCount.value = board.value.filter(c => c === 'black').length
  whiteCount.value = board.value.filter(c => c === 'white').length
}

// 检查是否为有效移动
function isValidMove(index) {
  if (board.value[index] || currentPlayer.value !== 'black') return false
  
  const row = Math.floor(index / BOARD_SIZE)
  const col = index % BOARD_SIZE
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]
  
  for (const [dr, dc] of directions) {
    let r = row + dr
    let c = col + dc
    let hasOpposite = false
    
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
      const idx = r * BOARD_SIZE + c
      if (!board.value[idx]) break
      if (board.value[idx] === 'white') {
        hasOpposite = true
      } else if (hasOpposite) {
        return true
      }
      r += dr
      c += dc
    }
  }
  return false
}

// 放置棋子
function placePiece(index) {
  if (!isValidMove(index)) return
  
  board.value[index] = 'black'
  lastMove.value = index
  flipPieces(index)
  updateCounts()
  checkGameState()
  
  if (!winner.value) {
    currentPlayer.value = 'white'
    // AI 回合
    setTimeout(aiMove, 1000)
  }
}

// 翻转棋子
function flipPieces(index) {
  const row = Math.floor(index / BOARD_SIZE)
  const col = index % BOARD_SIZE
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]
  
  for (const [dr, dc] of directions) {
    let r = row + dr
    let c = col + dc
    const toFlip = []
    
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
      const idx = r * BOARD_SIZE + c
      if (!board.value[idx]) break
      if (board.value[idx] === 'white') {
        toFlip.push(idx)
      } else {
        toFlip.forEach(i => board.value[i] = 'black')
        break
      }
      r += dr
      c += dc
    }
  }
}

// AI 移动（简单）
function aiMove() {
  const validMoves = []
  board.value.forEach((cell, idx) => {
    if (!cell && isValidAILogic(idx)) {
      validMoves.push(idx)
    }
  })
  
  if (validMoves.length > 0) {
    const move = validMoves[Math.floor(Math.random() * validMoves.length)]
    board.value[move] = 'white'
    lastMove.value = move
    flipAIPieces(move)
    updateCounts()
    checkGameState()
    currentPlayer.value = 'black'
  }
}

function isValidAILogic(index) {
  // 简化的 AI 逻辑
  return true
}

function flipAIPieces(index) {
  // 类似 flipPieces 但针对白棋
  const row = Math.floor(index / BOARD_SIZE)
  const col = index % BOARD_SIZE
  
  for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    let r = row + dr, c = col + dc
    const toFlip = []
    
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
      const idx = r * BOARD_SIZE + c
      if (!board.value[idx]) break
      if (board.value[idx] === 'black') toFlip.push(idx)
      else { toFlip.forEach(i => board.value[i] = 'white'); break }
      r += dr; c += dc
    }
  }
}

// 检查游戏状态
function checkGameState() {
  if (blackCount.value === 0 || whiteCount.value === 0 || 
      blackCount.value + whiteCount.value === BOARD_SIZE * BOARD_SIZE) {
    winner.value = blackCount.value > whiteCount.value ? 'black' : 
                   whiteCount.value > blackCount.value ? 'white' : 'draw'
    if (winner.value === 'black') showWinAnimation.value = true
  }
}

function restartGame() {
  board.value = Array(BOARD_SIZE * BOARD_SIZE).fill(null)
  currentPlayer.value = 'black'
  blackCount.value = 2
  whiteCount.value = 2
  winner.value = null
  showWinAnimation.value = false
  initBoard()
}

onMounted(() => {
  initBoard()
})
</script>

<style scoped>
.othello-game {
  padding: 20px;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 20px;
  border-radius: 10px;
  transition: all 0.3s;
}

.player-info.active {
  background: rgba(126, 184, 218, 0.2);
  box-shadow: 0 0 15px rgba(126, 184, 218, 0.3);
}

.player-piece {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
}

.player-piece.black {
  background: radial-gradient(circle at 30% 30%, #555, #000);
}

.player-piece.white {
  background: radial-gradient(circle at 30% 30%, #fff, #ccc);
}

.player-details {
  display: flex;
  flex-direction: column;
}

.player-name { color: #7eb8da; font-size: 14px; margin-bottom: 5px; }
.player-count { color: #ffd700; font-size: 24px; font-weight: bold; }

.vs-divider {
  color: #888;
  font-weight: bold;
  font-size: 18px;
}

.board-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.board {
  display: grid;
  grid-template-columns: repeat(8, 50px);
  grid-template-rows: repeat(8, 50px);
  gap: 2px;
  background: #2d5016;
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border: 4px solid #8B4513;
}

.cell {
  width: 50px;
  height: 50px;
  background: #35601a;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.cell:hover {
  background: #3d6e1e;
}

.cell.valid-move {
  background: #4a8024;
}

.valid-marker {
  width: 15px;
  height: 15px;
  background: rgba(0, 255, 0, 0.3);
  border-radius: 50%;
}

.piece {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
  transition: transform 0.3s;
}

.piece.black {
  background: radial-gradient(circle at 30% 30%, #555, #000);
}

.piece.white {
  background: radial-gradient(circle at 30% 30%, #fff, #ccc);
}

.piece-animate {
  animation: piecePlace 0.3s ease-out;
}

@keyframes piecePlace {
  0% { transform: scale(0.5) translateY(-20px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

.game-info {
  text-align: center;
  margin-top: 20px;
}

.game-result {
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

.result-text {
  font-size: 24px;
  color: #ffd700;
  margin-bottom: 15px;
}

.restart-btn {
  padding: 12px 30px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.restart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
}

.turn-indicator {
  color: #7eb8da;
  font-size: 18px;
  font-weight: bold;
}

.win-animation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
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
  animation: winPop 0.5s ease-out;
}

@keyframes winPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
</style>
