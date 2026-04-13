<template>
  <div class="alchemy-page">
    <div class="nav-bar">
      <router-link to="/main">首页</router-link>
      <router-link to="/chat">聊天</router-link>
      <span class="nav-spacer"></span>
      <router-link to="/profile">{{ userStore.username }}</router-link>
    </div>

    <div class="page-container">
      <div class="title-bar">
        <h1>配药</h1>
      </div>

      <div class="alchemy-tabs">
        <span :class="['alchemy-tab', { active: alchemyTab === 'recipes' }]" @click="alchemyTab = 'recipes'">药方</span>
        <span :class="['alchemy-tab', { active: alchemyTab === 'inventory' }]" @click="alchemyTab = 'inventory'; loadInventory()">药材</span>
        <span :class="['alchemy-tab', { active: alchemyTab === 'potions' }]" @click="alchemyTab = 'potions'; loadPotions()">成品</span>
      </div>

      <div v-if="alchemyTab === 'recipes'" class="recipes-section">
        <div v-for="r in recipes" :key="r.id" class="card recipe-card">
          <div class="recipe-header">
            <span class="recipe-name">{{ r.name }}</span>
            <span class="recipe-level">{{ r.level || r.difficulty }}</span>
          </div>
          <div class="recipe-desc">{{ r.description }}</div>
          <div class="recipe-materials" v-if="r.materials">
            <span class="mat-label">所需药材:</span>
            <span v-for="(mat, idx) in parseMaterials(r.materials)" :key="idx" class="mat-item">{{ mat }}</span>
          </div>
          <button class="btn btn-sm btn-primary" @click="craft(r.id)">炼制</button>
        </div>
        <div v-if="recipes.length === 0" class="empty-text">暂无药方</div>
      </div>

      <div v-if="alchemyTab === 'inventory'">
        <div v-for="item in inventory" :key="item.id" class="card inv-card">
          <span class="inv-name">{{ item.name }}</span>
          <span class="inv-qty">x{{ item.quantity }}</span>
        </div>
        <div v-if="inventory.length === 0" class="empty-text">暂无药材</div>
      </div>

      <div v-if="alchemyTab === 'potions'">
        <div v-for="item in potions" :key="item.id" class="card inv-card">
          <span class="inv-name">{{ item.name }}</span>
          <span class="inv-qty">x{{ item.quantity }}</span>
        </div>
        <div v-if="potions.length === 0" class="empty-text">暂无成品</div>
      </div>

      <div v-if="craftResult" class="craft-result">{{ craftResult }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const userStore = useUserStore()

const alchemyTab = ref('recipes')
const recipes = ref([])
const inventory = ref([])
const potions = ref([])
const craftResult = ref('')

function parseMaterials(materials) {
  if (Array.isArray(materials)) return materials.map(m => typeof m === 'string' ? m : `${m.name}x${m.quantity}`)
  if (typeof materials === 'string') return materials.split(',')
  return []
}

async function loadRecipes() {
  try {
    const res = await api.get('/alchemy/recipes')
    if (res.success) recipes.value = res.data || []
  } catch (e) {}
}

async function loadInventory() {
  try {
    const res = await api.get('/alchemy/inventory')
    if (res.success) inventory.value = res.data || []
  } catch (e) {}
}

async function loadPotions() {
  try {
    const res = await api.get('/alchemy/potions')
    if (res.success) potions.value = res.data || []
  } catch (e) {}
}

async function craft(id) {
  craftResult.value = ''
  try {
    const res = await api.post(`/alchemy/craft/${id}`)
    if (res.success) {
      craftResult.value = res.message || '炼制成功'
      await userStore.fetchProfile()
      loadInventory()
      loadPotions()
    } else {
      craftResult.value = res.message || '炼制失败'
    }
  } catch (err) {
    craftResult.value = err.message || '炼制失败'
  }
}

onMounted(() => {
  loadRecipes()
})
</script>

<style scoped>
.alchemy-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.alchemy-tab {
  padding: 10px 20px;
  cursor: pointer;
  color: #888;
  font-size: 14px;
  transition: all 0.2s;
}

.alchemy-tab.active {
  color: #7eb8da;
  border-bottom: 2px solid #4B87C3;
}

.alchemy-tab:hover {
  color: #ccc;
}

.recipe-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recipe-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.recipe-name {
  color: #7eb8da;
  font-size: 16px;
  font-weight: bold;
}

.recipe-level {
  color: #f0c040;
  font-size: 12px;
  padding: 2px 6px;
  background: rgba(240, 192, 64, 0.15);
  border-radius: 3px;
}

.recipe-desc {
  color: #aaa;
  font-size: 13px;
}

.recipe-materials {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.mat-label {
  color: #888;
  font-size: 12px;
}

.mat-item {
  padding: 2px 8px;
  background: rgba(75, 135, 195, 0.15);
  border-radius: 3px;
  color: #7eb8da;
  font-size: 12px;
}

.inv-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.inv-name {
  color: #7eb8da;
  font-size: 14px;
}

.inv-qty {
  color: #888;
  font-size: 13px;
}

.craft-result {
  margin-top: 16px;
  padding: 10px;
  background: rgba(74, 124, 89, 0.2);
  border: 1px solid rgba(74, 124, 89, 0.4);
  border-radius: 4px;
  color: #8fc9a0;
}

.empty-text {
  text-align: center;
  color: #666;
  padding: 30px;
}

.nav-spacer {
  flex: 1;
}
</style>
