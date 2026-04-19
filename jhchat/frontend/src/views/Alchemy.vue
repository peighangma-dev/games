<template>
  <PageLayout>
    <div class="alchemy-page">
      <div class="page-header">
        <h1 class="page-title">🧪 配药系统</h1>
        <p class="page-desc">采集药材，炼制丹药，增强功力</p>
      </div>

      <div class="alchemy-container">
        <!-- 左侧：药材列表 -->
        <div class="alchemy-sidebar">
          <div class="sidebar-header">
            <h3>📦 药材库存</h3>
            <button @click="loadInventory" class="btn-refresh">🔄</button>
          </div>
          <div class="herb-list">
            <div v-for="item in inventory" :key="item.id" class="herb-item">
              <span class="herb-name">{{ item.name }}</span>
              <span class="herb-qty">x{{ item.quantity }}</span>
            </div>
            <div v-if="inventory.length === 0" class="empty-herbs">
              <div class="empty-icon">🌿</div>
              <p>暂无药材</p>
              <p class="hint">可通过打渔、挖矿获得</p>
            </div>
          </div>
        </div>

        <!-- 中间：药方列表 -->
        <div class="alchemy-main">
          <div class="alchemy-tabs">
            <span :class="['alchemy-tab', { active: alchemyTab === 'recipes' }]" @click="alchemyTab = 'recipes'">
              📜 药方
            </span>
            <span :class="['alchemy-tab', { active: alchemyTab === 'potions' }]" @click="alchemyTab = 'potions'; loadPotions()">
              💊 成品
            </span>
          </div>

          <!-- 药方列表 -->
          <div v-if="alchemyTab === 'recipes'" class="recipes-section">
            <div v-for="recipe in recipes" :key="recipe.id" class="recipe-card" :class="{ 'can-craft': canCraft(recipe), 'high-level': recipe.level > 5 }">
              <div class="recipe-header">
                <div class="recipe-title">
                  <span class="recipe-name">{{ recipe.name }}</span>
                  <span class="recipe-level" v-if="recipe.level > 1">Lv.{{ recipe.level }}</span>
                </div>
                <span class="recipe-rate" :class="{ low: recipe.success_rate < 70 }">
                  成功率：{{ recipe.success_rate }}%
                </span>
              </div>
              
              <div class="recipe-desc">
                {{ recipe.description }}
                <span class="effect-value">{{ formatEffect(recipe.effect_type, recipe.effect_value) }}</span>
              </div>
              
              <div class="recipe-materials">
                <div class="materials-label">所需材料:</div>
                <div class="materials-grid">
                  <span v-for="(mat, idx) in parseMaterials(recipe.materials)" :key="idx" 
                        class="material-item" 
                        :class="{ 'missing': hasEnough(mat.name, mat.qty) === false }">
                    {{ mat.name }} x{{ mat.qty }}
                    <span v-if="hasEnough(mat.name, mat.qty) === false" class="missing-mark">❌</span>
                  </span>
                </div>
              </div>
              
              <button class="btn-craft" @click="craft(recipe)" :disabled="!canCraft(recipe)">
                {{ getCraftButtonText(recipe) }}
              </button>
            </div>
            
            <div v-if="recipes.length === 0" class="empty-text">暂无药方</div>
          </div>

          <!-- 成品列表 -->
          <div v-if="alchemyTab === 'potions'" class="potions-section">
            <div v-for="item in potions" :key="item.id" class="potion-card">
              <div class="potion-icon">💊</div>
              <div class="potion-info">
                <span class="potion-name">{{ item.name }}</span>
                <span class="potion-qty">数量：x{{ item.quantity }}</span>
              </div>
              <button class="btn-use" @click="usePotion(item)">使用</button>
            </div>
            <div v-if="potions.length === 0" class="empty-text">暂无成品丹药</div>
          </div>
        </div>

        <!-- 右侧：篝火动画 -->
        <div class="alchemy-fire-place">
          <div class="fire-animation">
            <div class="fire-placeholder">🔥</div>
            <div class="pot-placeholder">⚗️</div>
          </div>
          <!-- 炼丹炉状态 -->
          <div class="furnace-status" v-if="furnaceStatus">
            <div class="status-label">炼丹炉</div>
            <div class="status-value" :class="{ 'cooldown': furnaceCooldown > 0 }">
              <span v-if="furnaceStatus.isCrafting">🔮 炼制中...</span>
              <span v-else-if="furnaceCooldown > 0">⏳ {{ formatCooldown(furnaceCooldown) }}</span>
              <span v-else>✅ 可以炼制</span>
            </div>
          </div>
          <div class="crafting-log" v-if="craftLog">
            <div class="log-entry" :class="craftLog.success ? 'success' : 'fail'">
              {{ craftLog.message }}
            </div>
          </div>
          <!-- 药材市场入口 -->
          <router-link to="/herb-market" class="btn-market">
            💰 药材市场
          </router-link>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'
import PageLayout from '../components/PageLayout.vue'

const userStore = useUserStore()
const alchemyTab = ref('recipes')
const recipes = ref([])
const inventory = ref([])
const potions = ref([])
const craftLog = ref(null)
const crafting = ref(false)
const furnaceStatus = ref(null)
const furnaceCooldown = ref(0)

function formatEffect(type, value) {
  const names = {
    'neili': '内力',
    'tili': '体力',
    'wugong': '武功',
    'charm': '魅力',
    'attack': '攻击',
    'defense': '防御'
  }
  return `+${value}${names[type] || ''}`
}

function parseMaterials(materials) {
  if (Array.isArray(materials)) return materials
  if (typeof materials === 'string') {
    try {
      return JSON.parse(materials)
    } catch {
      return []
    }
  }
  return []
}

function hasEnough(name, qty) {
  const item = inventory.value.find(i => i.name === name)
  return item && item.quantity >= qty
}

function canCraft(recipe) {
  if (userStore.grade < recipe.level) return false
  const materials = parseMaterials(recipe.materials)
  return materials.every(mat => hasEnough(mat.name, mat.qty))
}

function getCraftButtonText(recipe) {
  if (userStore.grade < recipe.level) return `需要 Lv.${recipe.level}`
  if (!canCraft(recipe)) return '材料不足'
  return '🔥 炼制'
}

async function loadRecipes() {
  try {
    const res = await api.get('/alchemy/recipes')
    if (res.success) recipes.value = res.data || []
  } catch (e) {
    console.error('Load recipes failed:', e)
  }
}

async function loadInventory() {
  try {
    const res = await api.get('/alchemy/inventory')
    if (res.success) inventory.value = res.data || []
  } catch (e) {
    console.error('Load inventory failed:', e)
  }
}

async function loadPotions() {
  try {
    const res = await api.get('/alchemy/potions')
    if (res.success) potions.value = res.data || []
  } catch (e) {
    console.error('Load potions failed:', e)
  }
}

async function getFurnaceStatus() {
  try {
    const res = await api.get('/alchemy/furnace/status')
    if (res.success) {
      furnaceStatus.value = res.data
      furnaceCooldown.value = res.data.cooldownRemaining
    }
  } catch (e) {
    console.error('Get furnace status failed:', e)
  }
}

function formatCooldown(seconds) {
  if (seconds <= 0) return '可以炼制'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s}秒`
}

async function craft(recipe) {
  if (crafting.value) return
  if (!confirm(`确定炼制 ${recipe.name}？\n${recipe.description}`)) return
  
  crafting.value = true
  try {
    console.log('开始炼制:', recipe.name, 'recipeId:', recipe.id)
    const res = await api.post(`/alchemy/craft/${recipe.id}`)
    console.log('炼制结果:', res)
    
    craftLog.value = {
      success: res.success,
      message: res.message || (res.success ? '炼制成功' : '炼制失败')
    }
    
    if (res.success) {
      await userStore.fetchProfile()
      await loadInventory()
      await loadPotions()
      // 播放成功动画
      setTimeout(() => craftLog.value = null, 3000)
    } else {
      alert(res.message || '炼制失败')
    }
  } catch (err) {
    console.error('炼制错误:', err)
    craftLog.value = { success: false, message: '炼制失败：' + (err.message || '未知错误') }
    alert('炼制失败：' + (err.message || '未知错误'))
  } finally {
    crafting.value = false
  }
}

async function usePotion(item) {
  if (!confirm(`确定使用 ${item.name}？`)) return
  
  try {
    const res = await api.post(`/alchemy/use/${item.id}`)
    if (res.success) {
      await userStore.fetchProfile()
      await loadPotions()
      alert('✅ 使用成功！' + (res.message || ''))
    } else {
      alert('❌ ' + (res.message || '使用失败'))
    }
  } catch (err) {
    alert('❌ 使用失败：' + (err.message || '未知错误'))
  }
}

onMounted(() => {
  loadRecipes()
  loadInventory()
  getFurnaceStatus()
  // 每秒更新冷却时间
  setInterval(() => {
    if (furnaceCooldown.value > 0) {
      furnaceCooldown.value--
    } else {
      getFurnaceStatus()
    }
  }, 1000)
})
</script>

<style scoped>
.alchemy-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%);
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  color: #7eb8da;
  font-size: 32px;
  margin: 0 0 10px 0;
  text-shadow: 0 0 20px rgba(126, 184, 218, 0.3);
}

.page-desc {
  color: #a0aec0;
  font-size: 14px;
  margin: 0;
}

.alchemy-container {
  display: grid;
  grid-template-columns: 280px 1fr 200px;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(75, 135, 195, 0.2);
}

/* 左侧栏 - 药材 */
.alchemy-sidebar {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(75, 135, 195, 0.15);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(75, 135, 195, 0.2);
}

.sidebar-header h3 {
  color: #7eb8da;
  font-size: 16px;
  margin: 0;
}

.btn-refresh {
  background: rgba(74, 144, 226, 0.2);
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: rgba(74, 144, 226, 0.4);
}

.herb-list {
  max-height: 500px;
  overflow-y: auto;
}

.herb-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: rgba(46, 204, 113, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(46, 204, 113, 0.2);
}

.herb-name {
  color: #7eb8da;
  font-size: 14px;
}

.herb-qty {
  color: #2ecc71;
  font-size: 14px;
  font-weight: bold;
}

.empty-herbs {
  text-align: center;
  padding: 30px 20px;
  color: #718096;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-herbs .hint {
  font-size: 12px;
  color: #4a5568;
  margin-top: 8px;
}

/* 中间 - 主要内容 */
.alchemy-main {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(75, 135, 195, 0.15);
}

.alchemy-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-bottom: 2px solid rgba(75, 135, 195, 0.2);
}

.alchemy-tab {
  padding: 12px 24px;
  cursor: pointer;
  color: #a0aec0;
  font-size: 15px;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.alchemy-tab:hover {
  color: #7eb8da;
}

.alchemy-tab.active {
  color: #7eb8da;
  border-bottom-color: #4B87C3;
}

/* 药方卡片 */
.recipes-section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.recipe-card {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(75, 135, 195, 0.2);
  transition: all 0.3s;
}

.recipe-card.can-craft {
  border-color: rgba(46, 204, 113, 0.4);
  box-shadow: 0 0 20px rgba(46, 204, 113, 0.15);
}

.recipe-card.high-level {
  border-color: rgba(240, 192, 64, 0.3);
}

.recipe-card:hover {
  transform: translateY(-3px);
  border-color: rgba(74, 144, 226, 0.4);
}

.recipe-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.recipe-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recipe-name {
  color: #7eb8da;
  font-size: 16px;
  font-weight: bold;
}

.recipe-level {
  background: rgba(240, 192, 64, 0.15);
  color: #f0c040;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}

.recipe-rate {
  font-size: 12px;
  color: #2ecc71;
}

.recipe-rate.low {
  color: #e74c3c;
}

.recipe-desc {
  color: #a0aec0;
  font-size: 13px;
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
}

.effect-value {
  display: block;
  margin-top: 6px;
  color: #48bb78;
  font-weight: bold;
  font-size: 14px;
}

.recipe-materials {
  margin-bottom: 16px;
}

.materials-label {
  color: #718096;
  font-size: 12px;
  margin-bottom: 8px;
}

.materials-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.material-item {
  padding: 4px 10px;
  background: rgba(75, 135, 195, 0.15);
  border-radius: 4px;
  color: #7eb8da;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.material-item.missing {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.missing-mark {
  font-size: 10px;
}

.btn-craft {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #e67e22, #d35400);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-craft:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.4);
}

.btn-craft:disabled {
  background: #4a5568;
  cursor: not-allowed;
  opacity: 0.7;
}

/* 成品卡片 */
.potions-section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.potion-card {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(75, 135, 195, 0.2);
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
}

.potion-card:hover {
  border-color: rgba(46, 204, 113, 0.4);
}

.potion-icon {
  font-size: 32px;
}

.potion-info {
  flex: 1;
}

.potion-name {
  display: block;
  color: #7eb8da;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
}

.potion-qty {
  color: #a0aec0;
  font-size: 12px;
}

.btn-use {
  padding: 8px 16px;
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-use:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(46, 204, 113, 0.3);
}

/* 右侧 - 篝火 */
.alchemy-fire-place {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid rgba(230, 126, 34, 0.2);
}

.fire-animation {
  position: relative;
  width: 150px;
  height: 150px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.fire-placeholder {
  font-size: 64px;
  animation: flicker 0.5s ease-in-out infinite alternate;
}

.pot-placeholder {
  font-size: 48px;
  margin-top: -20px;
  animation: boil 2s ease-in-out infinite;
}

@keyframes flicker {
  from { opacity: 0.8; transform: scale(1); }
  to { opacity: 1; transform: scale(1.1); }
}

@keyframes boil {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.crafting-log {
  width: 100%;
  min-height: 60px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
}

/* 炼丹炉状态 */
.furnace-status {
  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  border: 1px solid rgba(126, 184, 218, 0.2);
  margin-top: 15px;
}

.status-label {
  color: #718096;
  font-size: 12px;
  margin-bottom: 6px;
}

.status-value {
  color: #48bb78;
  font-weight: bold;
  font-size: 14px;
}

.status-value.cooldown {
  color: #f59e0b;
}

/* 药材市场按钮 */
.btn-market {
  display: block;
  width: 100%;
  padding: 12px;
  margin-top: 15px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  text-align: center;
  border-radius: 8px;
  font-weight: bold;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-market:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.log-entry {
  font-size: 13px;
  padding: 8px;
  border-radius: 4px;
  animation: fadeIn 0.3s ease;
}

.log-entry.success {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
  border: 1px solid rgba(46, 204, 113, 0.3);
}

.log-entry.fail {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.empty-text {
  text-align: center;
  color: #718096;
  padding: 40px 20px;
  grid-column: 1 / -1;
}

/* 响应式 */
@media (max-width: 1024px) {
  .alchemy-container {
    grid-template-columns: 1fr;
  }
  
  .alchemy-sidebar,
  .alchemy-fire-place {
    display: none;
  }
}
</style>
