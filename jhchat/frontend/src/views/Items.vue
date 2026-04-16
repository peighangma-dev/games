<template>
  <div class="items-page">
    <div class="nav-bar">
      <router-link to="/main" class="nav-btn">首页</router-link>
      <router-link to="/chat" class="nav-btn">聊天</router-link>
      <router-link to="/items" class="nav-btn active">物品</router-link>
      <router-link to="/shop" class="nav-btn">商店</router-link>
      <router-link to="/market" class="nav-btn">商城</router-link>
      <span class="nav-spacer"></span>
      <div class="user-info">
        <span class="silver-badge">💰 {{ userStore.silver }}两</span>
        <router-link to="/profile" class="nav-btn">{{ userStore.username }}</router-link>
      </div>
    </div>

    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">🎒 我的物品</h1>
      </div>

      <div class="item-tabs">
        <button :class="['item-tab', { active: itemTab === 'bag' }]" @click="itemTab = 'bag'">
          <span class="tab-icon">🎒</span> 背包
        </button>
        <button :class="['item-tab', { active: itemTab === 'cards' }]" @click="itemTab = 'cards'; loadCards()">
          <span class="tab-icon">🃏</span> 卡片
        </button>
        <button :class="['item-tab', { active: itemTab === 'insurance' }]" @click="itemTab = 'insurance'; loadInsurances()">
          <span class="tab-icon">📋</span> 保险
        </button>
        <button :class="['item-tab', { active: itemTab === 'jobs' }]" @click="itemTab = 'jobs'; loadJobs()">
          <span class="tab-icon">💼</span> 打工
        </button>
      </div>

      <!-- 背包 -->
      <div v-if="itemTab === 'bag'" class="tab-content">
        <div class="item-grid">
          <div v-for="item in items" :key="item.id" class="item-card" :class="{ 'equipped': item.is_equipped }">
            <div class="card-badge" v-if="item.is_equipped">已装备</div>
            <div class="image-wrapper">
              <img :src="`/assets/item-images/${item.image || 'KITTY.GIF'}`" :alt="item.name" class="item-image" />
              <div class="type-badge" :class="`type-${item.type}`">{{ getTypeName(item.type) }}</div>
            </div>
            <div class="card-body">
              <h3 class="item-name">{{ item.name }}</h3>
              <div class="item-stats">
                <span v-if="item.attack > 0" class="stat attack">⚔️ +{{ item.attack }}</span>
                <span v-if="item.defense > 0" class="stat defense">🛡️ +{{ item.defense }}</span>
                <span v-if="item.neili_bonus > 0" class="stat neili">✨ +{{ item.neili_bonus }}</span>
                <span v-if="item.tili_bonus > 0" class="stat tili">💪 +{{ item.tili_bonus }}</span>
              </div>
              <div class="item-meta">
                <span class="item-qty">×{{ item.quantity || 1 }}</span>
              </div>
              <div class="card-actions">
                <button class="btn-action btn-use" @click="useItem(item.id)" :disabled="item.is_equipped">
                  {{ item.is_equipped ? '已装备' : '使用' }}
                </button>
                <button class="btn-action btn-drop" @click="dropItem(item.id)" :disabled="item.is_equipped">
                  丢弃
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="items.length === 0" class="empty-state">
          <div class="empty-icon">🎒</div>
          <p>背包空空如也，去商店买些装备吧！</p>
          <router-link to="/shop" class="btn-shop">🛒 去商店</router-link>
        </div>
      </div>

      <!-- 卡片 -->
      <div v-if="itemTab === 'cards'" class="tab-content">
        <div class="card-grid">
          <div v-for="(card, index) in cards" :key="card.id" class="collect-card">
            <div class="card-image-wrapper">
              <img :src="`/assets/cards/pc${index}.gif`" :alt="card.name" class="card-img" />
              <div class="card-rarity" :class="card.card_type">
                {{ card.card_type === 'vip' ? '👑 VIP' : '⭐ 普通' }}
              </div>
            </div>
            <div class="card-body">
              <h3 class="card-name">{{ card.name }}</h3>
              <p class="card-desc">{{ card.description }}</p>
              <div class="card-footer">
                <span class="card-price">{{ card.price }}两</span>
                <button class="btn-buy" @click="buyCard(card)">购买</button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="cards.length === 0" class="empty-state">
          <div class="empty-icon">🃏</div>
          <p>暂无卡片</p>
        </div>
      </div>

      <!-- 保险 -->
      <div v-if="itemTab === 'insurance'" class="tab-content">
        <div class="item-grid">
          <div v-for="ins in insurances" :key="ins.id" class="insurance-card">
            <div class="insurance-icon">📋</div>
            <div class="insurance-body">
              <h3 class="insurance-name">{{ ins.name }}</h3>
              <p class="insurance-desc">{{ ins.description }}</p>
              <div class="insurance-meta">
                <span class="insurance-duration">📅 {{ ins.duration_days }}天</span>
                <span class="insurance-price">{{ ins.price }}两</span>
              </div>
              <button class="btn-buy-full" @click="buyInsurance(ins)">购买保险</button>
            </div>
          </div>
        </div>
        <div v-if="insurances.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <p>暂无保险产品</p>
        </div>
      </div>

      <!-- 打工 -->
      <div v-if="itemTab === 'jobs'" class="tab-content">
        <div class="job-grid">
          <div v-for="job in jobs" :key="job.id" class="job-card" :class="{ 'can-work': job.can_work, 'on-cooldown': !job.can_work }">
            <div class="job-header">
              <div class="job-icon">💼</div>
              <div class="job-level-badge" v-if="job.min_grade > 1">Lv.{{ job.min_grade }}+</div>
            </div>
            <div class="job-body">
              <h3 class="job-name">{{ job.name }}</h3>
              <div class="job-meta">
                <span class="job-reward">💰 {{ job.reward_min }}-{{ job.reward_max }}两</span>
                <span class="job-cost">💪 -{{ job.stamina_cost }}体力</span>
              </div>
              <div class="job-limits">
                <span class="limit-tag" v-if="job.cooldown_minutes > 0">
                  ⏱️ 冷却{{ job.cooldown_minutes }}分钟
                </span>
                <span class="limit-tag" v-if="job.max_daily_times > 0">
                  📅 每日{{ job.max_daily_times }}次
                </span>
                <span class="limit-tag today-times" v-if="job.today_times > 0">
                  ✅ 今日已完成 {{ job.today_times }}/{{ job.max_daily_times || '∞' }}次
                </span>
              </div>
              <div class="cooldown-info" v-if="job.cooldown_remaining > 0">
                <span class="cooldown-timer">⏳ 冷却中 {{ job.cooldown_remaining }}分钟</span>
              </div>
              <button 
                class="btn-work" 
                @click="doWork(job.id)" 
                :disabled="!job.can_work"
                :class="{ 'disabled': !job.can_work }"
              >
                {{ getWorkButtonText(job) }}
              </button>
            </div>
          </div>
        </div>
        <div v-if="jobs.length === 0" class="empty-state">
          <div class="empty-icon">💼</div>
          <p>暂无工作</p>
        </div>
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

function getTypeName(type) {
  const names = {
    'weapon': '兵器',
    'armor': '防具',
    'medicine': '药品',
    'poison': '毒药',
    'misc': '其他'
  }
  return names[type] || type
}

async function loadItems() {
  try {
    const res = await api.get('/items')
    if (res.success) items.value = res.data || []
  } catch (e) {
    console.error('Load items failed:', e)
  }
}

async function loadCards() {
  try {
    const res = await api.get('/items/cards')
    if (res.success) cards.value = res.data || []
  } catch (e) {
    console.error('Load cards failed:', e)
  }
}

async function loadInsurances() {
  try {
    const res = await api.get('/items/insurances')
    if (res.success) insurances.value = res.data || []
  } catch (e) {
    console.error('Load insurances failed:', e)
  }
}

async function loadJobs() {
  try {
    const res = await api.get('/items/jobs')
    if (res.success) jobs.value = res.data || []
  } catch (e) {
    console.error('Load jobs failed:', e)
  }
}

async function useItem(id) {
  try {
    const res = await api.post(`/items/${id}/use`)
    if (res.success) {
      await userStore.fetchProfile()
      loadItems()
      alert('✅ 使用成功')
    } else {
      alert('❌ ' + (res.message || '使用失败'))
    }
  } catch (err) {
    alert('❌ ' + (err.message || '使用失败'))
  }
}

async function dropItem(id) {
  if (!confirm('确定丢弃此物品？')) return
  try {
    await api.delete(`/items/${id}`)
    loadItems()
    alert('✅ 丢弃成功')
  } catch (e) {
    alert('❌ 丢弃失败')
  }
}

async function buyCard(card) {
  try {
    const res = await api.post('/items/cards/buy', { cardId: card.id })
    if (res.success) {
      await userStore.fetchProfile()
      loadCards()
      alert('🎉 购买成功')
    } else {
      alert('❌ ' + (res.message || '购买失败'))
    }
  } catch (err) {
    alert('❌ ' + (err.message || '购买失败'))
  }
}

async function buyInsurance(ins) {
  try {
    const res = await api.post('/items/insurances/buy', { insuranceId: ins.id })
    if (res.success) {
      await userStore.fetchProfile()
      loadInsurances()
      alert('🎉 购买保险成功')
    } else {
      alert('❌ ' + (res.message || '购买失败'))
    }
  } catch (err) {
    alert('❌ ' + (err.message || '购买失败'))
  }
}

async function doWork(jobId) {
  try {
    const res = await api.post(`/items/jobs/${jobId}/work`)
    if (res.success) {
      await userStore.fetchProfile()
      loadJobs()
      alert(`🎉 ${res.message || '打工成功'}`)
    } else {
      alert('❌ ' + (res.message || '打工失败'))
    }
  } catch (err) {
    alert('❌ ' + (err.message || '打工失败'))
  }
}

function getWorkButtonText(job) {
  if (!job.can_work) {
    if (job.cooldown_remaining > 0) {
      return `冷却中 ${job.cooldown_remaining}分钟`
    }
    if (job.today_times >= job.max_daily_times && job.max_daily_times > 0) {
      return '今日次数已满'
    }
    if (userStore.grade < job.min_grade) {
      return `需要 Lv.${job.min_grade}`
    }
  }
  return '开始打工'
}

onMounted(() => {
  loadItems()
})
</script>

<style scoped>
.items-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%);
  padding: 0 0 20px 0;
}

.nav-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(75, 135, 195, 0.3);
  backdrop-filter: blur(10px);
}

.nav-btn {
  padding: 8px 16px;
  border-radius: 6px;
  text-decoration: none;
  color: #a0aec0;
  font-size: 14px;
  transition: all 0.2s;
  background: transparent;
  border: none;
  cursor: pointer;
}

.nav-btn:hover {
  background: rgba(75, 135, 195, 0.2);
  color: #7eb8da;
}

.nav-btn.active {
  background: #4a90e2;
  color: white;
}

.nav-spacer {
  flex: 1;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.silver-badge {
  background: linear-gradient(135deg, #f0c040, #d4a840);
  color: #1a1f24;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  color: #7eb8da;
  font-size: 28px;
  margin: 0;
  text-shadow: 0 0 20px rgba(126, 184, 218, 0.3);
}

.item-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px;
  border-radius: 12px;
  border: 1px solid rgba(75, 135, 195, 0.2);
}

.item-tab {
  flex: 1;
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: #888;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.item-tab:hover {
  background: rgba(74, 144, 226, 0.15);
  color: #7eb8da;
}

.item-tab.active {
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: white;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.tab-icon {
  font-size: 18px;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.item-card {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(75, 135, 195, 0.2);
  transition: all 0.3s;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.item-card:hover {
  transform: translateY(-5px);
  border-color: rgba(74, 144, 226, 0.5);
  box-shadow: 0 8px 30px rgba(74, 144, 226, 0.2);
}

.item-card.equipped {
  border-color: rgba(46, 204, 113, 0.5);
  box-shadow: 0 4px 20px rgba(46, 204, 113, 0.2);
}

.card-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  z-index: 10;
}

.image-wrapper {
  position: relative;
  height: 180px;
  background: linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.item-image {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
  transition: transform 0.3s;
}

.item-card:hover .item-image {
  transform: scale(1.05);
}

.type-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: bold;
}

.type-badge.type-weapon {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.type-badge.type-armor {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.type-badge.type-medicine {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
}

.type-badge.type-poison {
  background: linear-gradient(135deg, #8b0000, #660000);
  color: white;
}

.type-badge.type-misc {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
  color: white;
}

.card-body {
  padding: 16px;
}

.item-name {
  color: #7eb8da;
  font-size: 16px;
  margin: 0 0 10px 0;
  font-weight: bold;
}

.item-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
  min-height: 40px;
}

.stat {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.stat.attack {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.stat.defense {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
}

.stat.neili {
  background: rgba(155, 89, 182, 0.2);
  color: #9b59b6;
}

.stat.tili {
  background: rgba(230, 126, 34, 0.2);
  color: #e67e22;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.item-qty {
  color: #a0aec0;
  font-size: 13px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-use {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
}

.btn-use:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.4);
}

.btn-use:disabled {
  background: #4a5568;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-drop {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.btn-drop:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
}

.btn-drop:disabled {
  background: #4a5568;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.collect-card {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(75, 135, 195, 0.2);
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.collect-card:hover {
  transform: translateY(-5px);
  border-color: rgba(74, 144, 226, 0.5);
  box-shadow: 0 8px 30px rgba(74, 144, 226, 0.2);
}

.card-image-wrapper {
  position: relative;
  height: 180px;
  background: linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.card-img {
  max-height: 70%;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
  transition: transform 0.3s;
}

.collect-card:hover .card-img {
  transform: scale(1.05);
}

.card-rarity {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: bold;
}

.card-rarity.vip {
  background: linear-gradient(135deg, #f0c040, #d4a840);
  color: #1a1f24;
}

.card-rarity.normal {
  background: rgba(126, 184, 218, 0.3);
  color: #7eb8da;
}

.card-name {
  color: #7eb8da;
  font-size: 16px;
  margin: 0 0 8px 0;
  font-weight: bold;
}

.card-desc {
  color: #a0aec0;
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 12px;
  min-height: 40px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.card-price {
  color: #f0c040;
  font-size: 16px;
  font-weight: bold;
}

.btn-buy {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-buy:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.4);
}

.job-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.job-card {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(75, 135, 195, 0.2);
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.job-card.can-work {
  border-color: rgba(46, 204, 113, 0.5);
  box-shadow: 0 4px 20px rgba(46, 204, 113, 0.2);
}

.job-card.can-work:hover {
  transform: translateY(-5px);
  border-color: rgba(74, 144, 226, 0.5);
  box-shadow: 0 8px 30px rgba(74, 144, 226, 0.2);
}

.job-card.on-cooldown {
  opacity: 0.7;
  filter: grayscale(0.5);
}

.job-card.on-cooldown:hover {
  transform: none;
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  position: relative;
}

.job-level-badge {
  background: linear-gradient(135deg, #f0c040, #d4a840);
  color: #1a1f24;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: bold;
  position: absolute;
  top: 0;
  right: 0;
}

.job-icon {
  font-size: 40px;
  text-align: left;
}

.job-body {
  text-align: center;
}

.job-name {
  color: #7eb8da;
  font-size: 18px;
  margin: 0 0 12px 0;
  font-weight: bold;
}

.job-meta {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}

.job-reward {
  color: #f0c040;
  font-size: 14px;
  font-weight: bold;
}

.job-cost {
  color: #e67e22;
  font-size: 14px;
}

.job-limits {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
  min-height: 30px;
}

.limit-tag {
  background: rgba(75, 135, 195, 0.15);
  color: #7eb8da;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.limit-tag.today-times {
  background: rgba(46, 204, 113, 0.2);
  color: #81c784;
}

.cooldown-info {
  background: rgba(231, 76, 60, 0.15);
  color: #e74c3c;
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: bold;
}

.btn-work {
  width: 100%;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-work:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.btn-work.disabled {
  background: linear-gradient(135deg, #4a5568, #2d3748);
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

.job-card.on-cooldown:hover {
  transform: none;
}

.insurance-card {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(75, 135, 195, 0.2);
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.insurance-card:hover {
  transform: translateY(-5px);
  border-color: rgba(74, 144, 226, 0.5);
  box-shadow: 0 8px 30px rgba(74, 144, 226, 0.2);
}

.insurance-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.insurance-body {
  text-align: center;
}

.insurance-name {
  color: #7eb8da;
  font-size: 18px;
  margin: 0 0 8px 0;
  font-weight: bold;
}

.insurance-desc {
  color: #a0aec0;
  font-size: 13px;
  margin-bottom: 12px;
}

.insurance-meta {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.insurance-duration {
  color: #9b59b6;
  font-size: 14px;
}

.insurance-price {
  color: #f0c040;
  font-size: 14px;
  font-weight: bold;
}

.btn-buy-full {
  width: 100%;
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-buy-full:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.4);
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #4a5568;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  margin: 0 0 20px 0;
}

.btn-shop {
  display: inline-block;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: white;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-shop:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.empty-text {
  text-align: center;
  color: #666;
  padding: 30px;
}

@media (max-width: 768px) {
  .item-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
  
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
  
  .nav-bar {
    flex-wrap: wrap;
  }
  
  .user-info {
    width: 100%;
    justify-content: flex-end;
    margin-top: 8px;
  }
}
</style>
