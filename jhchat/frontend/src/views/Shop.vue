<template>
  <div class="shop-page">
    <div class="nav-bar">
      <router-link to="/main" class="nav-btn">首页</router-link>
      <router-link to="/chat" class="nav-btn">聊天</router-link>
      <router-link to="/market" class="nav-btn">商城</router-link>
      <router-link to="/shop" class="nav-btn active">商店</router-link>
      <span class="nav-spacer"></span>
      <div class="user-info">
        <span class="silver-badge">💰 {{ userStore.silver }}两</span>
        <router-link to="/profile" class="nav-btn">{{ userStore.username }}</router-link>
      </div>
    </div>

    <div class="page-container">
      <div class="shop-header">
        <h1 class="page-title">🏪 江湖商店</h1>
        <p class="shop-desc">购买各类兵器、防具、药品，助你闯荡江湖</p>
      </div>

      <div class="category-tabs">
        <button :class="['tab-btn', { active: currentCategory === 'all' }]" @click="currentCategory = 'all'">
          🏷️ 全部
        </button>
        <button :class="['tab-btn', { active: currentCategory === 'weapon' }]" @click="currentCategory = 'weapon'">
          ⚔️ 兵器
        </button>
        <button :class="['tab-btn', { active: currentCategory === 'armor' }]" @click="currentCategory = 'armor'">
          🛡️ 防具
        </button>
        <button :class="['tab-btn', { active: currentCategory === 'medicine' }]" @click="currentCategory = 'medicine'">
          💊 药品
        </button>
        <button :class="['tab-btn', { active: currentCategory === 'poison' }]" @click="currentCategory = 'poison'">
          ☠️ 毒药
        </button>
      </div>

      <div class="item-grid">
        <div v-for="item in filteredItems" :key="item.id" class="shop-item">
          <div class="item-image-wrapper">
            <img :src="`/assets/items/${item.image_file || '1.gif'}`" :alt="item.name" class="item-image" />
            <div class="type-badge" :class="`type-${item.type}`">{{ getTypeName(item.type) }}</div>
          </div>
          <div class="item-body">
            <h3 class="item-name">{{ item.name }}</h3>
            <div class="item-stats">
              <span v-if="item.attack > 0" class="stat attack">⚔️ +{{ item.attack }}</span>
              <span v-if="item.defense > 0" class="stat defense">🛡️ +{{ item.defense }}</span>
              <span v-if="item.neili_bonus > 0" class="stat neili">✨ +{{ item.neili_bonus }}内力</span>
              <span v-if="item.tili_bonus > 0" class="stat tili">💪 +{{ item.tili_bonus }}体力</span>
              <span v-if="item.neili_bonus < 0" class="stat danger">☠️ {{ item.neili_bonus }}内力</span>
              <span v-if="item.tili_bonus < 0" class="stat danger">☠️ {{ item.tili_bonus }}体力</span>
            </div>
            <div class="item-footer">
              <span class="item-price">{{ getPrice(item) }}两</span>
              <button class="btn-buy" @click="buyItem(item)" :disabled="!canBuy(item)">
                {{ canBuy(item) ? '购买' : '已购买' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const userStore = useUserStore()
const shopItems = ref([])
const currentCategory = ref('all')

const filteredItems = computed(() => {
  if (currentCategory.value === 'all') {
    return shopItems.value
  }
  return shopItems.value.filter(item => item.type === currentCategory.value)
})

function getTypeName(type) {
  const names = {
    'weapon': '兵器',
    'armor': '防具',
    'medicine': '药品',
    'poison': '毒药'
  }
  return names[type] || '其他'
}

function getPrice(item) {
  // 使用数据库中的 price 字段
  if (item.price && item.price > 0) {
    return item.price
  }
  // 兼容旧数据：毒药价格基于伤害值计算
  if (item.type === 'poison') {
    const damage = Math.abs(item.neili_bonus) + Math.abs(item.tili_bonus)
    if (damage === 0) return 50
    return damage * 5
  }
  // 其他物品价格基于属性加成计算
  const basePrice = item.attack + item.defense + Math.abs(item.neili_bonus) + Math.abs(item.tili_bonus)
  if (basePrice === 0) return 50
  return basePrice * 10
}

function canBuy(item) {
  return userStore.silver >= getPrice(item)
}

async function buyItem(item) {
  const price = getPrice(item)
  if (!confirm(`确定花费 ${price} 两购买 "${item.name}"？`)) return
  
  if (userStore.silver < price) {
    alert('❌ 银两不足！')
    return
  }
  
  try {
    const res = await api.post('/shop/buy', {
      itemName: item.name,
      price: price
    })
    
    if (res.success) {
      await userStore.fetchProfile()
      alert(`🎉 购买成功！获得 ${item.name}`)
    } else {
      alert('❌ ' + (res.message || '购买失败'))
    }
  } catch (err) {
    alert('❌ ' + (err.message || '购买失败'))
  }
}

async function loadShopItems() {
  try {
    const res = await api.get('/shop/items')
    console.log('Shop API response:', res)
    if (res.success) {
      shopItems.value = res.data || []
      console.log('Loaded shop items:', shopItems.value.length)
    }
    await userStore.fetchProfile()
    console.log('User silver:', userStore.silver)
  } catch (e) {
    console.error('Load shop items failed:', e)
  }
}

onMounted(() => {
  loadShopItems()
})
</script>

<style scoped>
.shop-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%);
  padding: 0 0 20px 0;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.shop-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  color: #7eb8da;
  font-size: 32px;
  margin: 0 0 10px 0;
  text-shadow: 0 0 20px rgba(126, 184, 218, 0.3);
}

.shop-desc {
  color: #a0aec0;
  font-size: 14px;
  margin: 0;
}

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  justify-content: center;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: rgba(0, 0, 0, 0.3);
  color: #888;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
  font-size: 14px;
}

.tab-btn:hover {
  background: rgba(74, 144, 226, 0.15);
  color: #7eb8da;
}

.tab-btn.active {
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: white;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.shop-item {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(75, 135, 195, 0.2);
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.shop-item:hover {
  transform: translateY(-5px);
  border-color: rgba(74, 144, 226, 0.5);
  box-shadow: 0 8px 30px rgba(74, 144, 226, 0.2);
}

.item-image-wrapper {
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

.shop-item:hover .item-image {
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

.item-body {
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
  margin-bottom: 12px;
  min-height: 50px;
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

.stat.danger {
  background: rgba(139, 0, 0, 0.3);
  color: #ff6b6b;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.item-price {
  color: #f0c040;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(240, 192, 64, 0.3);
}

.btn-buy {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-buy:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.4);
}

.btn-buy:disabled {
  background: #4a5568;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@media (max-width: 768px) {
  .item-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}
</style>
