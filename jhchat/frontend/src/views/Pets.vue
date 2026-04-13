<template>
  <div class="pets-page">
    <div class="nav-bar">
      <router-link to="/main">首页</router-link>
      <router-link to="/chat">聊天</router-link>
      <span class="nav-spacer"></span>
      <router-link to="/profile">{{ userStore.username }}</router-link>
    </div>

    <div class="page-container">
      <div class="title-bar">
        <h1>宠物</h1>
      </div>

      <div class="pet-tabs">
        <span :class="['pet-tab', { active: petTab === 'sheep' }]" @click="petTab = 'sheep'; loadSheep()">宠物羊</span>
        <span :class="['pet-tab', { active: petTab === 'star' }]" @click="petTab = 'star'; loadStar()">星河宠物</span>
        <span :class="['pet-tab', { active: petTab === 'mini' }]" @click="petTab = 'mini'; loadMini()">小宠</span>
      </div>

      <div v-if="petTab === 'sheep'" class="pet-section">
        <div class="card" v-if="sheep">
          <h3 class="section-title">我的宠物羊</h3>
          <div class="pet-attrs">
            <div class="attr-item"><span class="label">名字</span><span class="value">{{ sheep.name }}</span></div>
            <div class="attr-item"><span class="label">等级</span><span class="value">{{ sheep.level }}</span></div>
            <div class="attr-item"><span class="label">健康</span><span class="value">{{ sheep.health }}</span></div>
            <div class="attr-item"><span class="label">心情</span><span class="value">{{ sheep.mood }}</span></div>
          </div>
          <div class="pet-actions">
            <button class="btn btn-sm btn-primary" @click="feedSheep">喂食</button>
            <button class="btn btn-sm btn-primary" @click="cleanSheep">清洗</button>
            <button class="btn btn-sm btn-primary" @click="sunSheep">晒太阳</button>
            <button class="btn btn-sm btn-primary" @click="breedSheep">繁殖</button>
            <button class="btn btn-sm" @click="sellSheepMilk">卖奶</button>
            <button class="btn btn-sm btn-danger" @click="sellSheep">出售</button>
          </div>
        </div>
        <div class="card" v-else>
          <p class="empty-text">你还没有宠物羊</p>
          <button class="btn btn-primary" @click="buySheep">购买宠物羊</button>
        </div>
      </div>

      <div v-if="petTab === 'star'" class="pet-section">
        <div class="card" v-if="starPet">
          <h3 class="section-title">星河宠物</h3>
          <div class="pet-attrs">
            <div class="attr-item"><span class="label">名字</span><span class="value">{{ starPet.name }}</span></div>
            <div class="attr-item"><span class="label">等级</span><span class="value">{{ starPet.level }}</span></div>
            <div class="attr-item"><span class="label">攻击</span><span class="value">{{ starPet.attack }}</span></div>
            <div class="attr-item"><span class="label">防御</span><span class="value">{{ starPet.defense }}</span></div>
          </div>
          <div class="pet-actions">
            <button class="btn btn-sm btn-primary" @click="fightStar">战斗</button>
            <button class="btn btn-sm btn-primary" @click="adventureStar">冒险</button>
          </div>
        </div>
        <div class="card" v-else>
          <p class="empty-text">你还没有星河宠物</p>
          <button class="btn btn-primary" @click="adoptStar">领养星河宠物</button>
        </div>
      </div>

      <div v-if="petTab === 'mini'" class="pet-section">
        <div class="card" v-if="miniPet">
          <h3 class="section-title">小宠</h3>
          <div class="pet-attrs">
            <div class="attr-item"><span class="label">名字</span><span class="value">{{ miniPet.name }}</span></div>
            <div class="attr-item"><span class="label">类型</span><span class="value">{{ miniPet.type }}</span></div>
          </div>
        </div>
        <div class="card" v-else>
          <p class="empty-text">你还没有小宠</p>
          <button class="btn btn-primary" @click="adoptMini">领养小宠</button>
        </div>
      </div>

      <div v-if="petMsg" class="pet-msg">{{ petMsg }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const userStore = useUserStore()

const petTab = ref('sheep')
const sheep = ref(null)
const starPet = ref(null)
const miniPet = ref(null)
const petMsg = ref('')

async function loadSheep() {
  petMsg.value = ''
  try {
    const res = await api.get('/pets/sheep')
    if (res.success) sheep.value = res.data || null
  } catch (e) {}
}

async function loadStar() {
  petMsg.value = ''
  try {
    const res = await api.get('/pets/star')
    if (res.success) starPet.value = res.data || null
  } catch (e) {}
}

async function loadMini() {
  petMsg.value = ''
  try {
    const res = await api.get('/pets/mini')
    if (res.success) miniPet.value = res.data || null
  } catch (e) {}
}

async function petAction(url, reloadFn) {
  try {
    const res = await api.post(url)
    petMsg.value = res.message || '操作完成'
    if (res.success) reloadFn()
    await userStore.fetchProfile()
  } catch (err) {
    petMsg.value = err.message || '操作失败'
  }
}

function buySheep() { petAction('/pets/sheep/buy', loadSheep) }
function feedSheep() { petAction('/pets/sheep/feed', loadSheep) }
function cleanSheep() { petAction('/pets/sheep/clean', loadSheep) }
function sunSheep() { petAction('/pets/sheep/sun', loadSheep) }
function breedSheep() { petAction('/pets/sheep/breed', loadSheep) }
function sellSheepMilk() { petAction('/pets/sheep/sell-milk', loadSheep) }
function sellSheep() {
  if (!confirm('确定出售宠物羊？')) return
  petAction('/pets/sheep/sell', () => { sheep.value = null })
}
function adoptStar() { petAction('/pets/star/adopt', loadStar) }
function fightStar() { petAction('/pets/star/fight', loadStar) }
function adventureStar() { petAction('/pets/star/adventure', loadStar) }
function adoptMini() { petAction('/pets/mini/adopt', loadMini) }

onMounted(() => {
  loadSheep()
})
</script>

<style scoped>
.section-title {
  color: #7eb8da;
  font-size: 16px;
  margin-bottom: 12px;
  border-left: 3px solid #4B87C3;
  padding-left: 10px;
}

.pet-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.pet-tab {
  padding: 10px 20px;
  cursor: pointer;
  color: #888;
  font-size: 14px;
  transition: all 0.2s;
}

.pet-tab.active {
  color: #7eb8da;
  border-bottom: 2px solid #4B87C3;
}

.pet-tab:hover {
  color: #ccc;
}

.pet-attrs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.attr-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.attr-item .label {
  color: #888;
  font-size: 12px;
}

.attr-item .value {
  color: #eee;
  font-size: 14px;
}

.pet-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pet-msg {
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
  margin-bottom: 12px;
}

.nav-spacer {
  flex: 1;
}
</style>
