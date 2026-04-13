<template>
  <div class="market-page">
    <div class="nav-bar">
      <router-link to="/main">首页</router-link>
      <router-link to="/chat">聊天</router-link>
      <span class="nav-spacer"></span>
      <router-link to="/profile">{{ userStore.username }}</router-link>
    </div>

    <div class="page-container">
      <div class="title-bar">
        <h1>二手市场</h1>
      </div>

      <div class="market-actions" style="margin-bottom: 16px;">
        <button class="btn btn-primary" @click="showSell = true">上架物品</button>
      </div>

      <div class="market-list">
        <div v-for="item in marketItems" :key="item.id" class="card market-card">
          <div class="market-info">
            <span class="market-name">{{ item.name }}</span>
            <span class="market-type">{{ item.type }}</span>
            <span v-if="item.attack" class="market-stat">攻+{{ item.attack }}</span>
            <span v-if="item.defense" class="market-stat">防+{{ item.defense }}</span>
          </div>
          <div class="market-meta">
            <span class="market-seller">卖家: {{ item.seller || item.owner }}</span>
            <span class="market-price">{{ item.price }}两</span>
          </div>
          <button class="btn btn-sm btn-primary" @click="buyItem(item)">购买</button>
        </div>
        <div v-if="marketItems.length === 0" class="empty-text">市场空空如也</div>
      </div>

      <div v-if="showSell" class="modal-overlay" @click.self="showSell = false">
        <div class="modal-card card">
          <h3>上架物品</h3>
          <div class="form-group">
            <label>选择物品</label>
            <select v-model="sellForm.itemId">
              <option value="">请选择</option>
              <option v-for="item in myItems" :key="item.id" :value="item.id">{{ item.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>售价 (两)</label>
            <input v-model="sellForm.price" type="number" min="1" placeholder="输入售价" />
          </div>
          <div v-if="sellError" class="error-msg">{{ sellError }}</div>
          <div class="modal-actions">
            <button class="btn btn-primary" @click="sellItem">上架</button>
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

const marketItems = ref([])
const myItems = ref([])
const showSell = ref(false)
const sellError = ref('')
const sellForm = reactive({ itemId: '', price: '' })

async function loadMarket() {
  try {
    const res = await api.get('/items/market')
    if (res.success) marketItems.value = res.data || []
  } catch (e) {}
}

async function loadMyItems() {
  try {
    const res = await api.get('/items')
    if (res.success) myItems.value = res.data || []
  } catch (e) {}
}

async function buyItem(item) {
  if (!confirm(`确定花费${item.price}两购买${item.name}？`)) return
  try {
    const res = await api.post(`/items/market/${item.id}/buy`)
    if (res.success) {
      await userStore.fetchProfile()
      loadMarket()
    } else {
      alert(res.message || '购买失败')
    }
  } catch (err) {
    alert(err.message || '购买失败')
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
    } else {
      sellError.value = res.message || '上架失败'
    }
  } catch (err) {
    sellError.value = err.message || '上架失败'
  }
}

onMounted(() => {
  loadMarket()
  loadMyItems()
})
</script>

<style scoped>
.market-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.market-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.market-name {
  color: #7eb8da;
  font-weight: bold;
}

.market-type {
  color: #f0c040;
  font-size: 12px;
  padding: 2px 6px;
  background: rgba(240, 192, 64, 0.15);
  border-radius: 3px;
}

.market-stat {
  color: #e8a0bf;
  font-size: 13px;
}

.market-meta {
  display: flex;
  gap: 12px;
}

.market-seller {
  color: #888;
  font-size: 13px;
}

.market-price {
  color: #f0c040;
  font-size: 14px;
  font-weight: bold;
}

.empty-text {
  text-align: center;
  color: #666;
  padding: 30px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-card {
  width: 420px;
  max-width: 90vw;
}

.modal-card h3 {
  color: #7eb8da;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  color: #aaa;
  font-size: 13px;
}

.error-msg {
  color: #e74c3c;
  font-size: 13px;
  margin-bottom: 10px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.nav-spacer {
  flex: 1;
}
</style>
