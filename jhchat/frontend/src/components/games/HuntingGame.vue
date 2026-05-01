<template>
  <div class="hunting-game">
    <div class="hunt-scene">
      <!-- 场景背景 -->
      <div class="scene-background">
        <div class="mountain"></div>
        <div class="trees"></div>
        <div class="ground"></div>
      </div>

      <!-- 猎物 -->
      <div 
        v-for="animal in animals" 
        :key="animal.id"
        class="animal"
        :class="{ 'clicked': animal.clicked, 'running': animal.isMoving }"
        :style="animalStyle(animal)"
        @click="huntAnimal(animal)"
      >
        <div class="animal-sprite">{{ animal.icon }}</div>
        <div v-if="animal.hp < animal.maxHp" class="hp-bar">
          <div class="hp-fill" :style="{ width: (animal.hp / animal.maxHp * 100) + '%' }"></div>
        </div>
      </div>

      <!-- 弓箭效果 -->
      <div v-if="showArrow" class="arrow" :style="arrowStyle"></div>

      <!--  HUD -->
      <div class="hud">
        <div class="hud-item">
          <span>🎯 命中率</span>
          <span class="value">{{ accuracy }}%</span>
        </div>
        <div class="hud-item">
          <span>🏆 积分</span>
          <span class="value">{{ score }}</span>
        </div>
      </div>
    </div>

    <!-- 结果提示 -->
    <div v-if="huntResult" class="hunt-result" :class="resultClass">
      {{ huntResult }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../../utils/api'

const animals = ref([])
const score = ref(0)
const accuracy = ref(100)
const huntResult = ref(null)
const showArrow = ref(false)
const arrowStyle = ref({})

const animalTypes = [
  { type: 'rabbit', icon: '🐇', points: 10, hp: 1, speed: 'fast' },
  { type: 'deer', icon: '🦌', points: 30, hp: 2, speed: 'medium' },
  { type: 'bear', icon: '🐻', points: 50, hp: 3, speed: 'slow' },
  { type: 'wolf', icon: '🐺', points: 40, hp: 2, speed: 'medium' },
  { type: 'fox', icon: '🦊', points: 20, hp: 1, speed: 'fast' }
]

let gameInterval = null
let shotCount = 0
let hitCount = 0

function randomAnimal() {
  const type = animalTypes[Math.floor(Math.random() * animalTypes.length)]
  return {
    id: Date.now() + Math.random(),
    ...type,
    x: Math.random() * 80 + 10, // 10-90%
    y: Math.random() * 40 + 30, // 30-70%
    hp: type.hp,
    maxHp: type.hp,
    clicked: false,
    isMoving: true,
    direction: Math.random() > 0.5 ? 1 : -1
  }
}

function animalStyle(animal) {
  return {
    left: animal.x + '%',
    top: animal.y + '%',
    transform: `scaleX(${animal.direction})`
  }
}

function huntAnimal(animal) {
  shotCount++
  animal.clicked = true
  animal.hp--
  
  if (animal.hp <= 0) {
    hitCount++
    accuracy.value = Math.round(hitCount / shotCount * 100)
    score.value += animal.points
    huntResult.value = `+${animal.points}分`
    
    // 移除动物
    setTimeout(() => {
      animals.value = animals.value.filter(a => a.id !== animal.id)
    }, 300)
  } else {
    // 动物逃跑
    animal.isMoving = true
    animal.direction = -animal.direction
  }
  
  // 弓箭动画
  showArrowEffect()
  
  // 清除结果提示
  setTimeout(() => {
    huntResult.value = null
  }, 1000)
}

function showArrowEffect() {
  showArrow.value = true
  arrowStyle.value = {
    top: '50%',
    left: '50%',
    transform: `rotate(${Math.random() * 360}deg)`
  }
  setTimeout(() => showArrow.value = false, 300)
}

const resultClass = computed(() => {
  return huntResult.value && huntResult.value.includes('+') ? 'win' : 'info'
})

onMounted(() => {
  // 生成初始动物
  for (let i = 0; i < 3; i++) {
    animals.value.push(randomAnimal())
  }
  
  // 定时器生成新动物
  gameInterval = setInterval(() => {
    if (animals.value.length < 5) {
      animals.value.push(randomAnimal())
    }
  }, 3000)
})

onUnmounted(() => {
  if (gameInterval) clearInterval(gameInterval)
})
</script>

<style scoped>
.hunting-game {
  width: 100%;
  height: 500px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom, #87CEEB 0%, #87CEEB 50%, #228B22 50%, #228B22 100%);
  border-radius: 15px;
}

.hunt-scene {
  width: 100%;
  height: 100%;
  position: relative;
}

.scene-background {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 50%;
  background: linear-gradient(to bottom, #228B22, #006400);
  border-radius: 0 0 15px 15px;
}

.animal {
  position: absolute;
  width: 80px;
  height: 80px;
  cursor: crosshair;
  transition: transform 0.2s;
  animation: animalMove 2s ease-in-out infinite;
}

@keyframes animalMove {
  0%, 100% { transform: translateX(-10px); }
  50% { transform: translateX(10px); }
}

.animal.clicked {
  animation: animalHit 0.3s ease-out;
}

@keyframes animalHit {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.5); opacity: 0; }
}

.animal-sprite {
  font-size: 60px;
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
}

.hp-bar {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 6px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 3px;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  background: #2ecc71;
  transition: width 0.3s;
}

.hud {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.hud-item {
  background: rgba(0, 0, 0, 0.6);
  padding: 10px 20px;
  border-radius: 10px;
  color: #fff;
  font-size: 16px;
}

.hud-item .value {
  color: #ffd700;
  font-weight: bold;
  margin-left: 10px;
}

.arrow {
  position: absolute;
  width: 100px;
  height: 4px;
  background: linear-gradient(to right, #8B4513, #D2691E);
  border-radius: 2px;
  z-index: 100;
  animation: arrowFly 0.3s ease-out forwards;
}

@keyframes arrowFly {
  0% { opacity: 1; }
  100% { opacity: 0; transform: translateX(200px); }
}

.hunt-result {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  font-weight: bold;
  text-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  animation: resultFloat 1s ease-out forwards;
  pointer-events: none;
}

@keyframes resultFloat {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
  100% { opacity: 0; transform: translate(-50%, -150%) scale(1.2); }
}

.hunt-result.win { color: #2ecc71; }
.hunt-result.info { color: #e74c3c; }
</style>
