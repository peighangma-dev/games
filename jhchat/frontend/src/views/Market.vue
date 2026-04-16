<template>
  <div class="market-page">
    <div class="nav-bar">
      <router-link to="/main" class="nav-btn">首页</router-link>
      <router-link to="/chat" class="nav-btn">聊天</router-link>
      <router-link to="/market" class="nav-btn active">商城</router-link>
      <span class="nav-spacer"></span>
      <div class="user-info">
        <span class="silver-badge">💰 {{ userStore.silver }}两</span>
        <router-link to="/profile" class="nav-btn">{{ userStore.username }}</router-link>
      </div>
    </div>

    <div class="page-container">
      <div class="market-header">
        <h1 class="page-title">🏪 江湖商城</h1>
      </div>

      <div class="tab-bar">
        <button :class="['tab-btn', { active: currentTab === 'market' }]" @click="currentTab = 'market'">
          <span class="tab-icon">🏛️</span> 二手市场
        </button>
        <button :class="['tab-btn', { active: currentTab === 'cards' }]" @click="currentTab = 'cards'">
          <span class="tab-icon">🃏</span> 卡片商店
        </button>
        <button :class="['tab-btn', { active: currentTab === 'my' }]" @click="currentTab = 'my'">
          <span class="tab-icon">📦</span> 我的出售
        </button>
      </div>

      <!-- 二手市场 -->
      <div v-if="currentTab === 'market'" class="tab-content">
        <div class="section-header">
          <h2 class="section-title">集市摊位</h2>
          <button class="btn btn-primary" @click="showSell = true">
            <span class="btn-icon">➕</span> 上架物品
          </button>
        </div>
        
        <div class="item-grid">
          <div v-for="item in marketItems" :key="item.id" class="item-card" :class="{ 'own-item': item.seller === userStore.username }">
            <div class="card-badge" v-if="item.seller === userStore.username">自己的</div>
            <div class="card-image-wrapper">
              <img :src="`/assets/item-images/${item.image}`" :alt="item.item_name" class="card-image" />
              <div class="image-overlay">
                <div class="item-type-badge" :class="getItemTypeClass(item.item_type)">{{ item.item_type }}</div>
              </div>
            </div>
            <div class="card-body">
              <h3 class="item-name">{{ item.item_name }}</h3>
              <div class="item-stats">
                <span v-if="item.power" class="stat-item attack">⚔️ +{{ item.power }}</span>
                <span v-if="item.stamina" class="stat-item defense">🛡️ +{{ item.stamina }}</span>
              </div>
              <div class="item-meta">
                <span class="seller-name">👤 {{ item.seller }}</span>
                <span class="item-quantity">x{{ item.quantity }}</span>
              </div>
              <div class="card-footer">
                <span class="item-price">{{ item.selling_price }}两</span>
                <button 
                  class="btn btn-sm btn-buy" 
                  @click="buyItem(item)" 
                  :disabled="item.seller === userStore.username"
                >
                  {{ item.seller === userStore.username ? '已上架' : '购买' }}
                </button>
              </div>
            </div>
          </div>
          <div v-if="marketItems.length === 0" class="empty-state">
            <div class="empty-icon">🏚️</div>
            <p>市场空空如也，快来上架你的宝贝吧！</p>
          </div>
        </div>
      </div>

      <!-- 卡片商店 -->
      <div v-if="currentTab === 'cards'" class="tab-content">
        <div class="section-header">
          <h2 class="section-title">珍奇卡片</h2>
        </div>
        
        <div class="card-grid">
          <div v-for="(card, index) in cardTemplates" :key="card.id" class="card-item">
            <div class="card-image-wrapper card-wrapper">
              <img :src="`/assets/cards/pc${index}.gif`" :alt="card.name" class="card-image card-style" />
              <div class="card-rarity" :class="card.card_type">
                {{ card.card_type === 'vip' ? '👑 VIP' : '⭐ 普通' }}
              </div>
            </div>
            <div class="card-body">
              <h3 class="card-name">{{ card.name }}</h3>
              <p class="card-desc">{{ card.description }}</p>
              <div class="card-footer">
                <span class="card-price">{{ card.price }}两</span>
                <button class="btn btn-sm btn-buy" @click="buyCard(card)">购买</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 我的出售 -->
      <div v-if="currentTab === 'my'" class="tab-content">
        <div class="section-header">
          <h2 class="section-title">我的摊位</h2>
          <button class="btn btn-primary" @click="showSell = true">
            <span class="btn-icon">➕</span> 上架物品
          </button>
        </div>
        
        <div class="item-grid">
          <div v-for="item in myMarketListings" :key="item.id" class="item-card">
            <div class="card-image-wrapper">
              <img :src="`/assets/item-images/${item.image}`" :alt="item.item_name" class="card-image" />
              <div class="image-overlay">
                <div class="item-type-badge" :class="getItemTypeClass(item.item_type)">{{ item.item_type }}</div>
              </div>
            </div>
            <div class="card-body">
              <h3 class="item-name">{{ item.item_name }}</h3>
              <div class="item-stats">
                <span v-if="item.power" class="stat-item attack">⚔️ +{{ item.power }}</span>
                <span v-if="item.stamina" class="stat-item defense">🛡️ +{{ item.stamina }}</span>
              </div>
              <div class="item-meta">
                <span class="seller-name">📦 数量：{{ item.quantity }}</span>
              </div>
              <div class="card-footer">
                <span class="item-price">{{ item.selling_price }}两</span>
                <button class="btn btn-sm btn-danger" @click="cancelListing(item)">下架</button>
              </div>
            </div>
          </div>
          <div v-if="myMarketListings.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <p>暂无出售物品</p>
          </div>
        </div>
      </div>

      <!-- 上架弹窗 -->
      <div v-if="showSell" class="modal-overlay" @click.self="showSell = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3>📦 上架物品</h3>
            <button class="modal-close" @click="showSell = false">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>选择物品</label>
              <select v-model="sellForm.itemId" class="form-select">
                <option value="">请选择要上架的物品</option>
                <option v-for="item in myItems" :key="item.id" :value="item.id">
                  {{ item.name }} ×{{ item.quantity }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>售价 (两)</label>
              <input v-model="sellForm.price" type="number" min="1" placeholder="输入售价" class="form-input" />
            </div>
            <div v-if="sellError" class="error-msg">❌ {{ sellError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="sellItem">确认上架</button>
            <button class="btn" @click="showSell = false">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const userStore = useUserStore()

const currentTab = ref('market')
const marketItems = ref([])
const myItems = ref([])
const cardTemplates = ref([])
const myMarketListings = ref([])
const showSell = ref(false)
const sellError = ref('')
const sellForm = reactive({ itemId: '', price: '' })

function getItemTypeClass(type) {
  const classes = {
    'weapon': 'type-weapon',
    'armor': 'type-armor',
    'medicine': 'type-medicine',
    'misc': 'type-misc'
  }
  return classes[type] || 'type-misc'
}

async function loadMarket() {
  try {
    const res = await api.get('/items/market')
    if (res.success) marketItems.value = res.data || []
  } catch (e) {
    console.error('Load market failed:', e)
  }
}

async function loadMyItems() {
  try {
    const res = await api.get('/items')
    if (res.success) myItems.value = res.data || []
  } catch (e) {
    console.error('Load my items failed:', e)
  }
}

async function loadCards() {
  try {
    const res = await api.get('/items/cards')
    if (res.success) cardTemplates.value = res.data || []
  } catch (e) {
    console.error('Load cards failed:', e)
  }
}

async function loadMyListings() {
  try {
    const res = await api.get('/items/market/list')
    if (res.success) myMarketListings.value = res.data || []
  } catch (e) {
    console.error('Load my listings failed:', e)
  }
}

async function buyItem(item) {
  if (!confirm(`确定花费 ${item.selling_price} 两购买 "${item.item_name}"？`)) return
  try {
    const res = await api.post(`/items/market/${item.id}/buy`)
    if (res.success) {
      await userStore.fetchProfile()
      loadMarket()
      loadMyListings()
      alert('🎉 购买成功！')
    } else {
      alert('❌ ' + (res.message || '购买失败'))
    }
  } catch (err) {
    alert('❌ ' + (err.message || '购买失败'))
  }
}

async function sellItem() {
  if (!sellForm.itemId) {
    sellError.value = '请选择物品'
    return
  }
  if (!sellForm.price || sellForm.price <= 0) {
    sellError.value = '请输入有效售价'
    return
  }
  try {
    const res = await api.post('/items/market', {
      itemId: sellForm.itemId,
      price: parseInt(sellForm.price)
    })
    if (res.success) {
      showSell.value = false
      sellForm.itemId = ''
      sellForm.price = ''
      sellError.value = ''
      loadMarket()
      loadMyItems()
      loadMyListings()
      alert('✅ 上架成功！')
    } else {
      sellError.value = res.message || '上架失败'
    }
  } catch (err) {
    sellError.value = err.message || '上架失败'
  }
}

async function buyCard(card) {
  if (!confirm(`确定花费 ${card.price} 两购买 "${card.name}" 卡片？`)) return
  try {
    const res = await api.post('/items/cards/buy', { cardId: card.id })
    if (res.success) {
      await userStore.fetchProfile()
      alert('🎉 购买成功！')
    } else {
      alert('❌ ' + (res.message || '购买失败'))
    }
  } catch (err) {
    alert('❌ ' + (err.message || '购买失败'))
  }
}

async function cancelListing(item) {
  if (!confirm(`确定下架 "${item.item_name}"？`)) return
  try {
    const res = await api.delete(`/items/market/${item.id}`)
    if (res.success) {
      loadMarket()
      loadMyListings()
      loadMyItems()
      alert('✅ 下架成功！')
    } else {
      alert('❌ ' + (res.message || '下架失败'))
    }
  } catch (err) {
    alert('❌ ' + (err.message || '下架失败'))
  }
}

onMounted(() => {
  loadMarket()
  loadMyItems()
  loadCards()
  loadMyListings()
})
</script>

<style scoped>
.market-page {
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

.market-header {
  margin-bottom: 24px;
}

.page-title {
  color: #7eb8da;
  font-size: 28px;
  margin: 0;
  text-shadow: 0 0 20px rgba(126, 184, 218, 0.3);
}

.tab-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px;
  border-radius: 12px;
  border: 1px solid rgba(75, 135, 195, 0.2);
}

.tab-btn {
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

.tab-btn:hover {
  background: rgba(74, 144, 226, 0.15);
  color: #7eb8da;
}

.tab-btn.active {
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(75, 135, 195, 0.2);
}

.section-title {
  color: #fff;
  font-size: 18px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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

.item-card.own-item {
  border-color: rgba(240, 192, 64, 0.3);
}

.card-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(240, 192, 64, 0.9);
  color: #1a1f24;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  z-index: 10;
}

.card-image-wrapper {
  position: relative;
  height: 200px;
  background: linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.card-image {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
  transition: transform 0.3s;
}

.item-card:hover .card-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
}

.item-type-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
}

.item-type-badge.type-weapon {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.item-type-badge.type-armor {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.item-type-badge.type-medicine {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
}

.item-type-badge.type-misc {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
  color: white;
}

.card-body {
  padding: 16px;
}

.item-name, .card-name {
  color: #7eb8da;
  font-size: 16px;
  margin: 0 0 8px 0;
  font-weight: bold;
}

.item-stats {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.stat-item {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.stat-item.attack {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.stat-item.defense {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.seller-name {
  color: #888;
  font-size: 12px;
}

.item-quantity {
  color: #a0aec0;
  font-size: 12px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-price, .card-price {
  color: #f0c040;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(240, 192, 64, 0.3);
}

.card-desc {
  color: #a0aec0;
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 12px;
  min-height: 40px;
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

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.card-item {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(75, 135, 195, 0.2);
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.card-item:hover {
  transform: translateY(-5px);
  border-color: rgba(74, 144, 226, 0.5);
  box-shadow: 0 8px 30px rgba(74, 144, 226, 0.2);
}

.card-wrapper {
  height: 180px;
}

.card-style {
  max-height: 70%;
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
  margin: 0;
}

.empty-text {
  text-align: center;
  color: #666;
  padding: 30px;
  grid-column: 1 / -1;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(5px);
}

.modal-card {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 16px;
  width: 480px;
  max-width: 90vw;
  border: 1px solid rgba(75, 135, 195, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  color: #7eb8da;
  margin: 0;
  font-size: 18px;
}

.modal-close {
  background: transparent;
  border: none;
  color: #888;
  font-size: 28px;
  cursor: pointer;
  transition: color 0.2s;
  line-height: 1;
}

.modal-close:hover {
  color: #fff;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  color: #a0aec0;
  font-size: 13px;
  margin-bottom: 8px;
}

.form-select, .form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid rgba(75, 135, 195, 0.3);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  color: #e0e0e0;
  font-size: 14px;
  transition: all 0.2s;
}

.form-select:focus, .form-input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.error-msg {
  color: #e74c3c;
  font-size: 13px;
  background: rgba(231, 76, 60, 0.1);
  padding: 10px 12px;
  border-radius: 6px;
  margin-top: 8px;
}

.modal-footer {
  display: flex;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.btn-buy {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
  min-width: 80px;
  justify-content: center;
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

.btn-danger {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  min-width: 80px;
  justify-content: center;
}

.btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
}

.btn-sm {
  padding: 8px 16px;
  font-size: 13px;
}

.btn-icon {
  font-size: 16px;
}

@media (max-width: 768px) {
  .item-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
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
