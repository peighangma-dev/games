<template>
  <PageLayout>
    <div class="herb-market-page">
      <div class="market-header">
        <h1 class="page-title">💰 药材市场</h1>
        <p class="market-desc">买卖药材，互通有无</p>
        <div class="market-refresh" @click="loadPrices">
          🔄 <span>刷新价格</span>
          <span v-if="lastUpdate" class="update-time">({{ lastUpdate }})</span>
        </div>
      </div>

      <!-- 价格提示 -->
      <div class="price-tip">
        <span class="tip-icon">💡</span>
        <span>药材价格每小时自动刷新，浮动范围 ±20%</span>
      </div>

      <!-- 药材价格列表 -->
      <div class="market-container">
        <!-- 买入区 -->
        <div class="market-section buy-section">
          <h2 class="section-title">🌿 买入药材</h2>
          <div class="price-list">
            <div v-for="(price, name) in prices" :key="'buy-'+name" class="price-item">
              <div class="item-info">
                <span class="item-name">{{ name }}</span>
                <span class="item-price">💰 {{ price }}两</span>
              </div>
              <div class="item-action">
                <input 
                  type="number" 
                  :value="buyQty[name] || ''" 
                  @input="setBuyQty(name, $event.target.value)"
                  min="1" 
                  max="999" 
                  placeholder="数量" 
                  class="qty-input" 
                />
                <button @click="buyHerb(name, price)" class="btn-buy" :disabled="!isValidQuantity(buyQty[name])">
                  买入
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 卖出区 -->
        <div class="market-section sell-section">
          <h2 class="section-title">💊 卖出药材</h2>
          <div class="price-list">
            <div v-for="item in myHerbs" :key="'sell-'+item.id" class="price-item">
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-price">💰 {{ prices[item.name] || 1 }}两</span>
                <span class="item-stock">库存：x{{ item.quantity }}</span>
              </div>
              <div class="item-action">
                <input 
                  type="number" 
                  :value="sellQty[item.id] || ''" 
                  @input="setSellQty(item.id, $event.target.value)"
                  min="1" 
                  :max="item.quantity" 
                  placeholder="数量" 
                  class="qty-input"
                />
                <button @click="sellHerb(item, prices[item.name])" class="btn-sell" :disabled="!isValidQuantity(sellQty[item.id]) || sellQty[item.id] > item.quantity">
                  卖出
                </button>
              </div>
            </div>
            <div v-if="myHerbs.length === 0" class="empty-stock">
              暂无可卖出的药材
            </div>
          </div>
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
const prices = ref({})
const myHerbs = ref([])
const buyQty = ref({})
const sellQty = ref({})
const lastUpdate = ref('')

function isValidQuantity(val) {
  if (val === null || val === undefined || val === '') return false
  const num = Number(val)
  return Number.isInteger(num) && num >= 1
}

function setBuyQty(name, value) {
  buyQty.value[name] = value === '' ? null : Number(value)
}

function setSellQty(id, value) {
  sellQty.value[id] = value === '' ? null : Number(value)
}

function formatTime(date) {
  const d = new Date(date)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

async function loadPrices() {
  try {
    const res = await api.get('/alchemy/market/prices')
    if (res.success) {
      prices.value = res.data.prices || {}
      lastUpdate.value = formatTime(res.data.lastUpdated)
    }
  } catch (e) {
    console.error('Load prices failed:', e)
  }
}

async function loadInventory() {
  try {
    const res = await api.get('/alchemy/inventory')
    if (res.success) {
      myHerbs.value = res.data || []
    }
  } catch (e) {
    console.error('Load inventory failed:', e)
  }
}

async function buyHerb(name, price) {
  const quantity = buyQty.value[name]
  console.log('Buy herb:', { name, price, quantity, type: typeof quantity, buyQty: buyQty.value })
  if (!isValidQuantity(quantity)) {
    console.log('Invalid quantity:', quantity)
    alert('请输入有效数量')
    return
  }
  
  const totalCost = price * quantity
  if (!confirm(`确定购买${name} x${quantity}？\n总价：${totalCost}两银子`)) return
  
  try {
    console.log('Sending buy request:', { name, quantity })
    const res = await api.post('/alchemy/market/buy', { name, quantity })
    console.log('Buy response:', res)
    if (res.success) {
      alert(res.message)
      buyQty.value[name] = null
      await loadPrices()
      await loadInventory()
      await userStore.fetchProfile()
    } else {
      alert('❌ ' + res.message)
    }
  } catch (e) {
    console.error('Buy error:', e)
    alert('购买失败：' + (e.response?.data?.message || '未知错误'))
  }
}

async function sellHerb(item, price) {
  const quantity = sellQty[item.id]
  if (!isValidQuantity(quantity) || quantity > item.quantity) {
    alert('请输入有效数量')
    return
  }
  
  const totalSilver = price * quantity
  if (!confirm(`确定卖出${item.name} x${quantity}？\n总价：${totalSilver}两银子`)) return
  
  try {
    const res = await api.post('/alchemy/market/sell', { name: item.name, quantity })
    if (res.success) {
      alert(res.message)
      sellQty[item.id] = null
      await loadPrices()
      await loadInventory()
      await userStore.fetchProfile()
    } else {
      alert('❌ ' + res.message)
    }
  } catch (e) {
    alert('卖出失败：' + (e.response?.data?.message || '未知错误'))
  }
}

onMounted(() => {
  loadPrices()
  loadInventory()
  // 每 5 秒自动刷新库存
  setInterval(loadInventory, 5000)
})
</script>

<style scoped>
.herb-market-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3a2f 0%, #1a1f2e 100%);
  padding: 20px;
}

.market-header {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
}

.page-title {
  color: #fbbf24;
  font-size: 32px;
  margin: 0 0 10px 0;
  text-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
}

.market-desc {
  color: #a0aec0;
  font-size: 14px;
  margin: 0 0 15px 0;
}

.market-refresh {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #4ade80;
  cursor: pointer;
  padding: 8px 16px;
  background: rgba(74, 222, 128, 0.1);
  border-radius: 8px;
  transition: all 0.2s;
}

.market-refresh:hover {
  background: rgba(74, 222, 128, 0.2);
}

.update-time {
  color: #718096;
  font-size: 12px;
}

.price-tip {
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  margin-bottom: 20px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.tip-icon {
  margin-right: 5px;
}

.market-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.market-section {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.section-title {
  color: #fbbf24;
  font-size: 20px;
  margin: 0 0 20px 0;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(251, 191, 36, 0.2);
}

.price-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 600px;
  overflow-y: auto;
}

.price-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-name {
  color: #f4a460;
  font-weight: bold;
  font-size: 15px;
}

.item-price {
  color: #fbbf24;
  font-size: 14px;
}

.item-stock {
  color: #718096;
  font-size: 12px;
}

.item-action {
  display: flex;
  gap: 10px;
  align-items: center;
}

.qty-input {
  width: 70px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 6px;
  color: #e5e7eb;
  font-size: 14px;
  text-align: center;
}

.qty-input:focus {
  outline: none;
  border-color: #fbbf24;
}

.btn-buy {
  padding: 8px 20px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-buy:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-buy:disabled {
  background: #4a5568;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-sell {
  padding: 8px 20px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sell:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-sell:disabled {
  background: #4a5568;
  cursor: not-allowed;
  opacity: 0.7;
}

.empty-stock {
  text-align: center;
  color: #718096;
  padding: 30px;
  font-size: 14px;
}

@media (max-width: 900px) {
  .market-container {
    grid-template-columns: 1fr;
  }
}
</style>
