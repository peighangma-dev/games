<template>
  <PageLayout>
    <div class="pets-page">
      <div class="page-header">
        <h1 class="page-title">🐾 宠物系统</h1>
        <p class="page-desc">养育宠物，陪伴成长</p>
      </div>

      <!-- 宠物商店 -->
      <div class="pet-shop card" v-if="!hasAnyPet && currentTab === null">
        <h2 class="section-title">🏪 宠物商店</h2>
        <div class="shop-items">
          <div class="shop-item" @click="selectAndBuy('sheep')">
            <div class="item-icon">🐑</div>
            <div class="item-name">宠物羊</div>
            <div class="item-price">💰 5000 两</div>
            <div class="item-desc">温顺可爱，可以产奶</div>
          </div>
          <div class="shop-item" @click="selectAndBuy('star')">
            <div class="item-icon">⭐</div>
            <div class="item-name">星河宠物</div>
            <div class="item-price">💰 10000 两</div>
            <div class="item-desc">可以战斗和冒险</div>
          </div>
          <div class="shop-item" @click="selectAndBuy('mini')">
            <div class="item-icon">🐹</div>
            <div class="item-name">小宠</div>
            <div class="item-price">💰 3000 两</div>
            <div class="item-desc">小巧可爱，易于饲养</div>
          </div>
        </div>
      </div>

      <!-- 宠物 Tabs -->
      <div class="pet-tabs" v-if="hasAnyPet || currentTab">
        <button 
          v-for="tab in petTabs" 
          :key="tab.id"
          :class="['tab-btn', { active: currentTab === tab.id }]"
          @click="currentTab = tab.id; loadSpecificPet(tab.id)"
        >
          {{ tab.icon }} {{ tab.name }}
        </button>
        <button class="tab-btn shop-btn" @click="currentTab = null">
          🏪 宠物商店
        </button>
      </div>

      <!-- 宠物羊 -->
      <div v-if="currentTab === 'sheep' && sheep" class="pet-section">
        <div class="pet-card">
          <div class="pet-avatar">🐑</div>
          <h3 class="pet-name">{{ sheep.name || '小羊' }}</h3>
          
          <div class="pet-stats">
            <div class="stat-row">
              <span class="stat-label">💚 健康</span>
              <div class="stat-bar">
                <div class="stat-fill health" :style="{ width: (sheep.health || 0) + '%' }"></div>
              </div>
              <span class="stat-value">{{ sheep.health || 0 }}/{{ sheep.life || 100 }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">😊 心情</span>
              <div class="stat-bar">
                <div class="stat-fill mood" :style="{ width: (sheep.happiness || 0) + '%' }"></div>
              </div>
              <span class="stat-value">{{ sheep.happiness || 0 }}/100</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">🍖 饱食</span>
              <div class="stat-bar">
                <div class="stat-fill hunger" :style="{ width: (sheep.hunger || 0) + '%' }"></div>
              </div>
              <span class="stat-value">{{ sheep.hunger || 0 }}/100</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">✨ 清洁</span>
              <div class="stat-bar">
                <div class="stat-fill clean" :style="{ width: (sheep.cleanliness || 0) + '%' }"></div>
              </div>
              <span class="stat-value">{{ sheep.cleanliness || 0 }}/100</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">🥛 牛奶</span>
              <span class="stat-value">{{ sheep.milk || 0 }} 瓶</span>
            </div>
          </div>

          <div class="action-buttons">
            <button class="action-btn" @click="feedSheep" :disabled="actionLoading">
              🍖 喂食 (100 两)
            </button>
            <button class="action-btn" @click="cleanSheep" :disabled="actionLoading">
              🧼 清洗
            </button>
            <button class="action-btn" @click="sunSheep" :disabled="actionLoading">
              ☀️ 晒太阳
            </button>
            <button class="action-btn" @click="breedSheep" :disabled="actionLoading">
              💕 繁殖 (2000 两)
            </button>
            <button class="action-btn success" @click="sellMilk" :disabled="actionLoading || !sheep.milk">
              🥛 卖牛奶
            </button>
            <button class="action-btn danger" @click="sellSheep" :disabled="actionLoading">
              💰 出售宠物
            </button>
          </div>
        </div>
      </div>

      <!-- 星河宠物 -->
      <div v-if="currentTab === 'star' && starPet" class="pet-section">
        <div class="pet-card battle-pet">
          <div class="pet-avatar">⭐</div>
          <h3 class="pet-name">{{ starPet.name || '星河' }}</h3>
          <div class="pet-level">Lv.{{ starPet.level || 1 }}</div>
          
          <div class="battle-stats">
            <div class="stat-row">
              <span class="stat-label">❤️ 生命值</span>
              <div class="stat-bar">
                <div class="stat-fill hp" :style="{ width: hpPercent + '%' }"></div>
              </div>
              <span class="stat-value">{{ starPet.hp || 0 }}/{{ starPet.max_hp || 500 }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">💙 法力值</span>
              <div class="stat-bar">
                <div class="stat-fill mp" :style="{ width: mpPercent + '%' }"></div>
              </div>
              <span class="stat-value">{{ starPet.mp || 0 }}/{{ starPet.max_mp || 100 }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">⚔️ 攻击力</span>
              <span class="stat-value">{{ starPet.attack || 0 }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">🛡️ 防御力</span>
              <span class="stat-value">{{ starPet.defense || 0 }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">⭐ 经验值</span>
              <div class="stat-bar">
                <div class="stat-fill exp" :style="{ width: expPercent + '%' }"></div>
              </div>
              <span class="stat-value">{{ starPet.exp || 0 }}/{{ nextLevelExp }}</span>
            </div>
          </div>

          <div class="action-buttons">
            <button class="action-btn" @click="fightStar" :disabled="actionLoading || starPet.hp <= 0">
              ⚔️ 战斗
            </button>
            <button class="action-btn" @click="adventureStar" :disabled="actionLoading || starPet.hp <= 0">
              🗺️ 冒险
            </button>
            <button class="action-btn success" @click="healStar" :disabled="actionLoading">
              💖 治疗
            </button>
          </div>

          <div v-if="starPet.hp <= 0" class="pet-dead">
            ⚠️ 宠物已阵亡，请使用治疗恢复
          </div>
        </div>
      </div>

      <!-- 小宠 -->
      <div v-if="currentTab === 'mini' && miniPet" class="pet-section">
        <div class="pet-card mini-pet">
          <div class="pet-avatar">🐹</div>
          <h3 class="pet-name">{{ miniPet.name || '小宠' }}</h3>
          <div class="pet-level">Lv.{{ miniPet.level || 1 }}</div>
          
          <div class="mini-attrs">
            <div class="attr-item">
              <span class="attr-label">⚔️ 攻击力</span>
              <span class="attr-value">{{ miniPet.attack || 0 }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">🛡️ 防御力</span>
              <span class="attr-value">{{ miniPet.defense || 0 }}</span>
            </div>
          </div>

          <div class="action-buttons">
            <button class="action-btn" @click="trainMini" :disabled="actionLoading">
              💪 训练
            </button>
          </div>
        </div>
      </div>

      <!-- 消息提示 -->
      <div v-if="petMsg" class="message" :class="msgType">
        {{ petMsg }}
      </div>

      <!-- 历史记录 (仅宠物羊显示) -->
      <div v-if="currentTab === 'sheep' && sheep" class="history-section card">
        <h3 class="section-title">📜 养育日志</h3>
        <div class="history-list">
          <div v-for="(log, i) in history" :key="i" class="history-item">
            <span class="history-time">{{ log.time }}</span>
            <span class="history-text">{{ log.text }}</span>
          </div>
          <div v-if="history.length === 0" class="empty-history">
            暂无记录
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
const currentTab = ref('sheep')
const actionLoading = ref(false)
const petMsg = ref('')
const msgType = ref('info')
const history = ref([])
const hasAnyPet = ref(false)

const sheep = ref(null)
const starPet = ref(null)
const miniPet = ref(null)

const petTabs = [
  { id: 'sheep', name: '宠物羊', icon: '🐑' },
  { id: 'star', name: '星河宠物', icon: '⭐' },
  { id: 'mini', name: '小宠', icon: '🐹' }
]

const hpPercent = computed(() => {
  if (!starPet.value || !starPet.value.max_hp) return 0
  return Math.floor((starPet.value.hp / starPet.value.max_hp) * 100)
})

const mpPercent = computed(() => {
  if (!starPet.value || !starPet.value.max_mp) return 0
  return Math.floor((starPet.value.mp / starPet.value.max_mp) * 100)
})

const expPercent = computed(() => {
  if (!starPet.value) return 0
  const next = starPet.value.level * 100
  return Math.min(100, Math.floor((starPet.value.exp / next) * 100))
})

const nextLevelExp = computed(() => {
  if (!starPet.value) return 100
  return starPet.value.level * 100
})

function addHistory(text) {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  history.value.unshift({ time, text })
  if (history.value.length > 20) history.value.pop()
}

function showMessage(msg, type = 'info') {
  petMsg.value = msg
  msgType.value = type
  setTimeout(() => { petMsg.value = '' }, 3000)
}

async function loadAllPets() {
  try {
    const [sheepRes, starRes, miniRes] = await Promise.allSettled([
      api.get('/pets/sheep'),
      api.get('/pets/star'),
      api.get('/pets/mini')
    ])
    
    if (sheepRes.status === 'fulfilled' && sheepRes.value.success && sheepRes.value.data) {
      sheep.value = sheepRes.value.data
    }
    if (starRes.status === 'fulfilled' && starRes.value.success && starRes.value.data) {
      starPet.value = starRes.value.data
    }
    if (miniRes.status === 'fulfilled' && miniRes.value.success && miniRes.value.data) {
      miniPet.value = miniRes.value.data
    }
    
    // 更新 hasAnyPet
    hasAnyPet.value = !!(sheep.value || starPet.value || miniPet.value)
  } catch (e) {
    console.error('Load pets failed:', e)
  }
}

async function loadSpecificPet(type) {
  try {
    const res = await api.get(`/pets/${type}`)
    if (res.success && res.data) {
      if (type === 'sheep') sheep.value = res.data
      else if (type === 'star') starPet.value = res.data
      else if (type === 'mini') miniPet.value = res.data
    }
  } catch (e) {
    console.error(`Load ${type} pet failed:`, e)
  }
}

function selectAndBuy(type) {
  currentTab.value = type
  buyPet(type)
}
async function buyPet(type) {
  actionLoading.value = true
  try {
    let res
    if (type === 'sheep') {
      res = await api.post('/pets/sheep/buy', { name: '小羊' })
    } else if (type === 'star') {
      res = await api.post('/pets/star/adopt', { name: '星河' })
    } else if (type === 'mini') {
      res = await api.post('/pets/mini/adopt', { name: '小宠' })
    }
    
    if (res.success) {
      showMessage(res.message, 'success')
      addHistory(`购买了${type === 'sheep' ? '宠物羊' : type === 'star' ? '星河宠物' : '小宠'}`)
      await loadAllPets()
      hasAnyPet.value = true
      currentTab.value = type
    }
  } catch (e) {
    showMessage(e.message || '购买失败', 'error')
  } finally {
    actionLoading.value = false
  }
}

// 宠物羊操作
async function feedSheep() {
  actionLoading.value = true
  try {
    const res = await api.post('/pets/sheep/feed')
    if (res.success) {
      showMessage(res.message, 'success')
      addHistory('喂养了宠物羊')
      await loadAllPets()
    }
  } catch (e) {
    showMessage(e.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

async function cleanSheep() {
  actionLoading.value = true
  try {
    const res = await api.post('/pets/sheep/clean')
    if (res.success) {
      showMessage(res.message, 'success')
      addHistory('清洗了宠物羊')
      await loadAllPets()
    }
  } catch (e) {
    showMessage(e.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

async function sunSheep() {
  actionLoading.value = true
  try {
    const res = await api.post('/pets/sheep/sun')
    if (res.success) {
      showMessage(res.message, 'success')
      addHistory('让宠物羊晒太阳')
      await loadAllPets()
    }
  } catch (e) {
    showMessage(e.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

async function breedSheep() {
  actionLoading.value = true
  try {
    const res = await api.post('/pets/sheep/breed')
    if (res.success) {
      showMessage(`配种成功！获得${res.data.milkGain}瓶牛奶`, 'success')
      addHistory(`宠物羊配种，获得${res.data.milkGain}瓶牛奶`)
      await loadAllPets()
    }
  } catch (e) {
    showMessage(e.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

async function sellMilk() {
  actionLoading.value = true
  try {
    const res = await api.post('/pets/sheep/sell-milk')
    if (res.success) {
      showMessage(`卖出${res.data.milkSold}瓶牛奶，获得${res.data.value}两银子`, 'success')
      addHistory(`卖出牛奶，获得${res.data.value}两`)
      await userStore.fetchProfile()
      await loadAllPets()
    }
  } catch (e) {
    showMessage(e.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

async function sellSheep() {
  if (!confirm('确定要出售宠物羊吗？出售后将无法恢复！')) return
  actionLoading.value = true
  try {
    const res = await api.post('/pets/sheep/sell')
    if (res.success) {
      showMessage(`出售成功，获得${res.data.value}两银子`, 'success')
      addHistory(`出售宠物羊，获得${res.data.value}两`)
      sheep.value = null
      await userStore.fetchProfile()
      await loadAllPets()
    }
  } catch (e) {
    showMessage(e.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

// 星河宠物操作
async function fightStar() {
  actionLoading.value = true
  try {
    const res = await api.post('/pets/star/fight')
    if (res.success) {
      const result = res.data
      let msg = `战斗${result.won ? '胜利' : '失败'}！`
      msg += ` 经验 +${result.expGain}`
      if (result.hpLoss > 0) msg += `, 生命 -${result.hpLoss}`
      showMessage(msg, result.won ? 'success' : 'info')
      addHistory(`星河宠物战斗${result.won ? '胜利' : '失败'}`)
      await loadAllPets()
    }
  } catch (e) {
    showMessage(e.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

async function adventureStar() {
  actionLoading.value = true
  try {
    const res = await api.post('/pets/star/adventure')
    if (res.success) {
      const r = res.data
      let msg = `${r.event}！`
      if (r.silverGain) msg += `银子 +${r.silverGain} `
      if (r.expGain) msg += `经验 +${r.expGain} `
      if (r.hpLoss > 0) msg += `生命 -${r.hpLoss}`
      if (r.hpLoss < 0) msg += `生命 +${Math.abs(r.hpLoss)}`
      showMessage(msg, 'success')
      addHistory(`星河宠物冒险：${r.event}`)
      await userStore.fetchProfile()
      await loadAllPets()
    }
  } catch (e) {
    showMessage(e.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

async function healStar() {
  actionLoading.value = true
  try {
    const res = await api.post('/pets/star/heal')
    if (res.success) {
      showMessage(res.message, 'success')
      addHistory('星河宠物接受治疗，完全恢复')
      await userStore.fetchProfile()
      await loadAllPets()
    }
  } catch (e) {
    showMessage(e.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

// 小宠操作
async function trainMini() {
  actionLoading.value = true
  try {
    const res = await api.post('/pets/mini/train')
    if (res.success) {
      showMessage(res.message, 'success')
      addHistory(`训练小宠：攻击 +${res.data.atkGain}，防御 +${res.data.defGain}`)
      await userStore.fetchProfile()
      await loadAllPets()
    }
  } catch (e) {
    showMessage(e.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  loadAllPets()
})
</script>

<style scoped>
.pets-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  color: #fbbf24;
  font-size: 32px;
  margin: 0 0 10px 0;
  text-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
}

.page-desc {
  color: #9ca3af;
  font-size: 14px;
  margin: 0;
}

.card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-title {
  color: #7eb8da;
  font-size: 18px;
  margin: 0 0 15px 0;
  border-left: 3px solid #4B87C3;
  padding-left: 10px;
}

/* 宠物商店 */
.shop-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.shop-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.shop-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.item-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.item-name {
  color: #fbbf24;
  font-size: 16px;
  margin-bottom: 5px;
}

.item-price {
  color: #34d399;
  font-size: 14px;
  margin-bottom: 5px;
}

.item-desc {
  color: #9ca3af;
  font-size: 12px;
}

/* Pet Tabs */
.pet-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: #e5e7eb;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: rgba(74, 124, 89, 0.3);
  border-color: #4a7c59;
  color: #8fc9a0;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.shop-btn {
  margin-left: auto;
  background: rgba(251, 191, 36, 0.2);
  border-color: rgba(251, 191, 36, 0.3);
}

/* Pet Card */
.pet-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 25px;
  text-align: center;
}

.pet-card.battle-pet {
  border-color: rgba(99, 102, 241, 0.3);
}

.pet-card.mini-pet {
  border-color: rgba(236, 72, 153, 0.3);
}

.pet-avatar {
  font-size: 80px;
  margin-bottom: 10px;
}

.pet-name {
  color: #fbbf24;
  font-size: 24px;
  margin: 0 0 5px 0;
}

.pet-level {
  display: inline-block;
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  margin-bottom: 20px;
}

.pet-stats, .battle-stats {
  text-align: left;
  margin-bottom: 20px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.stat-label {
  width: 80px;
  color: #9ca3af;
  font-size: 14px;
}

.stat-bar {
  flex: 1;
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.3s;
}

.stat-fill.health { background: linear-gradient(90deg, #ef4444, #10b981); }
.stat-fill.mood { background: linear-gradient(90deg, #f59e0b, #3b82f6); }
.stat-fill.hunger { background: linear-gradient(90deg, #f97316, #84cc16); }
.stat-fill.clean { background: linear-gradient(90deg, #06b6d4, #a855f7); }
.stat-fill.hp { background: linear-gradient(90deg, #dc2626, #ef4444); }
.stat-fill.mp { background: linear-gradient(90deg, #2563eb, #3b82f6); }
.stat-fill.exp { background: linear-gradient(90deg, #7c3aed, #a855f7); }

.stat-value {
  width: 80px;
  color: #e5e7eb;
  font-size: 14px;
  text-align: right;
}

.mini-attrs {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 20px;
}

.attr-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.attr-label {
  color: #9ca3af;
  font-size: 14px;
  margin-bottom: 5px;
}

.attr-value {
  color: #fbbf24;
  font-size: 20px;
  font-weight: bold;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  padding: 10px 20px;
  background: rgba(74, 124, 89, 0.3);
  border: 1px solid rgba(74, 124, 89, 0.5);
  border-radius: 8px;
  color: #8fc9a0;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: rgba(74, 124, 89, 0.5);
  transform: translateY(-2px);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.success {
  background: rgba(16, 185, 129, 0.3);
  border-color: rgba(16, 185, 129, 0.5);
  color: #34d399;
}

.action-btn.danger {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
  color: #f87171;
}

.pet-dead {
  margin-top: 15px;
  padding: 10px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 8px;
  color: #f87171;
  font-size: 14px;
}

/* Message */
.message {
  margin-top: 15px;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
}

.message.success {
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #34d399;
}

.message.error {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #f87171;
}

.message.info {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #60a5fa;
}

/* History */
.history-section {
  max-height: 300px;
  overflow-y: auto;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  gap: 15px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 13px;
}

.history-time {
  color: #6b7280;
  min-width: 50px;
}

.history-text {
  color: #9ca3af;
}

.empty-history {
  text-align: center;
  color: #6b7280;
  padding: 20px;
}
</style>
