<template>
  <div class="items-page">
    <div class="nav-bar">
      <router-link to="/main">首页</router-link>
      <router-link to="/chat">聊天</router-link>
      <span class="nav-spacer"></span>
      <router-link to="/profile">{{ userStore.username }}</router-link>
    </div>

    <div class="page-container">
      <div class="title-bar">
        <h1>物品</h1>
      </div>

      <div class="item-tabs">
        <span :class="['item-tab', { active: itemTab === 'bag' }]" @click="itemTab = 'bag'">背包</span>
        <span :class="['item-tab', { active: itemTab === 'cards' }]" @click="itemTab = 'cards'; loadCards()">卡片商店</span>
        <span :class="['item-tab', { active: itemTab === 'insurance' }]" @click="itemTab = 'insurance'; loadInsurances()">保险</span>
        <span :class="['item-tab', { active: itemTab === 'jobs' }]" @click="itemTab = 'jobs'; loadJobs()">打工</span>
      </div>

      <div v-if="itemTab === 'bag'">
        <div v-for="item in items" :key="item.id" class="card item-card">
          <div class="item-info">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-type">{{ item.type }}</span>
            <span v-if="item.attack" class="item-stat">攻+{{ item.attack }}</span>
            <span v-if="item.defense" class="item-stat">防+{{ item.defense }}</span>
            <span class="item-qty">x{{ item.quantity || 1 }}</span>
          </div>
          <div class="item-actions">
            <button class="btn btn-sm btn-primary" @click="useItem(item.id)" v-if="item.type !== '暗器'">使用</button>
            <button class="btn btn-sm btn-danger" @click="dropItem(item.id)">丢弃</button>
          </div>
        </div>
        <div v-if="items.length === 0" class="empty-text">背包空空如也</div>
      </div>

      <div v-if="itemTab === 'cards'">
        <div v-for="card in cards" :key="card.id" class="card item-card">
          <div class="item-info">
            <span class="item-name">{{ card.card_name || card.name }}</span>
            <span class="item-qty">x{{ card.quantity || 1 }}</span>
            <span v-if="card.price" class="item-price">{{ card.price }}两</span>
          </div>
          <button class="btn btn-sm btn-primary" @click="buyCard(card)">购买</button>
        </div>
        <div v-if="cards.length === 0" class="empty-text">暂无卡片</div>
      </div>

      <div v-if="itemTab === 'insurance'">
        <div v-for="ins in insurances" :key="ins.id" class="card item-card">
          <div class="item-info">
            <span class="item-name">{{ ins.name }}</span>
            <span class="item-price">{{ ins.price }}两</span>
          </div>
          <button class="btn btn-sm btn-primary" @click="buyInsurance(ins)">购买</button>
        </div>
        <div v-if="insurances.length === 0" class="empty-text">暂无保险</div>
      </div>

      <div v-if="itemTab === 'jobs'">
        <div v-for="job in jobs" :key="job.id" class="card item-card">
          <div class="item-info">
            <span class="item-name">{{ job.name }}</span>
            <span class="item-price">{{ job.reward || job.salary }}两</span>
          </div>
          <button class="btn btn-sm btn-primary" @click="doWork(job.id)">打工</button>
        </div>
        <div v-if="jobs.length === 0" class="empty-text">暂无工作</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const userStore = useUserStore()

const itemTab = ref('bag')
const items = ref([])
const cards = ref([])
const insurances = ref([])
const jobs = ref([])

async function loadItems() {
  try {
    const res = await api.get('/items')
    if (res.success) items.value = res.data || []
  } catch (e) {}
}

async function loadCards() {
  try {
    const res = await api.get('/items/cards')
    if (res.success) cards.value = res.data || []
  } catch (e) {}
}

async function loadInsurances() {
  try {
    const res = await api.get('/items/insurances')
    if (res.success) insurances.value = res.data || []
  } catch (e) {}
}

async function loadJobs() {
  try {
    const res = await api.get('/items/jobs')
    if (res.success) jobs.value = res.data || []
  } catch (e) {}
}

async function useItem(id) {
  try {
    const res = await api.post(`/items/${id}/use`)
    if (res.success) {
      await userStore.fetchProfile()
      loadItems()
    } else {
      alert(res.message || '使用失败')
    }
  } catch (err) {
    alert(err.message || '使用失败')
  }
}

async function dropItem(id) {
  if (!confirm('确定丢弃此物品？')) return
  try {
    await api.delete(`/items/${id}`)
    loadItems()
  } catch (e) {}
}

async function buyCard(card) {
  try {
    const res = await api.post('/items/cards/buy', { cardName: card.card_name || card.name })
    if (res.success) {
      await userStore.fetchProfile()
      loadCards()
    } else {
      alert(res.message || '购买失败')
    }
  } catch (err) {
    alert(err.message || '购买失败')
  }
}

async function buyInsurance(ins) {
  try {
    const res = await api.post('/items/insurances/buy', { id: ins.id })
    if (res.success) {
      await userStore.fetchProfile()
      loadInsurances()
    } else {
      alert(res.message || '购买失败')
    }
  } catch (err) {
    alert(err.message || '购买失败')
  }
}

async function doWork(jobId) {
  try {
    const res = await api.post(`/items/jobs/${jobId}/work`)
    if (res.success) {
      await userStore.fetchProfile()
      alert(res.message || '打工完成')
    } else {
      alert(res.message || '打工失败')
    }
  } catch (err) {
    alert(err.message || '打工失败')
  }
}

onMounted(() => {
  loadItems()
})
</script>

<style scoped>
.item-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.item-tab {
  padding: 10px 20px;
  cursor: pointer;
  color: #888;
  font-size: 14px;
  transition: all 0.2s;
}

.item-tab.active {
  color: #7eb8da;
  border-bottom: 2px solid #4B87C3;
}

.item-tab:hover {
  color: #ccc;
}

.item-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.item-name {
  color: #7eb8da;
  font-weight: bold;
  font-size: 15px;
}

.item-type {
  color: #f0c040;
  font-size: 12px;
  padding: 2px 6px;
  background: rgba(240, 192, 64, 0.15);
  border-radius: 3px;
}

.item-stat {
  color: #e8a0bf;
  font-size: 13px;
}

.item-qty {
  color: #888;
  font-size: 13px;
}

.item-price {
  color: #f0c040;
  font-size: 13px;
}

.item-actions {
  display: flex;
  gap: 6px;
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
