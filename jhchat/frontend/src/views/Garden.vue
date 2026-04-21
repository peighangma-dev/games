<template>
  <PageLayout>
    <div class="garden-page">
      <div class="page-header">
        <h1 class="page-title">🌱 帮派药园</h1>
        <p class="page-desc">与同门一起种植药材，收获贡献</p>
      </div>

      <div v-if="!garden" class="loading">加载中...</div>
      
      <div v-else class="garden-container">
        <!-- 药园信息 -->
        <div class="garden-info card">
          <div class="info-row">
            <span class="label">药园等级：</span>
            <span class="value">{{ garden.level }}</span>
          </div>
          <div class="info-row">
            <span class="label">累计贡献：</span>
            <span class="value">{{ garden.contribution_total }}</span>
          </div>
          <div class="info-row">
            <span class="label">可种植地块：</span>
            <span class="value">{{ plots.filter(p => !p.plant_id || p.is_harvested).length }}/{{ garden.capacity }}</span>
          </div>
          <div class="info-row">
            <span class="label">今日浇水：</span>
            <span class="value">{{ userWaterCount }}/{{ maxWaterPerDay }}</span>
          </div>
        </div>

        <!-- 植物选择 -->
        <div class="plant-selector card">
          <h3 class="section-title">选择种子</h3>
          <div class="plant-list">
            <div 
              v-for="plant in plants" 
              :key="plant.id"
              :class="['plant-item', { selected: selectedPlant?.id === plant.id }]"
              @click="selectedPlant = plant"
            >
              <div class="plant-icon">🌿</div>
              <div class="plant-name">{{ plant.name }}</div>
              <div class="plant-info">
                <span>💰 {{ plant.seed_cost }}两</span>
                <span>⏱️ {{ plant.growth_time_minutes }}分钟</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 地块网格 -->
        <div class="plots-grid">
          <div 
            v-for="plot in plots" 
            :key="plot.id"
            :class="['plot-card', { 
              'has-plant': plot.plant_id && !plot.is_harvested,
              'ready': plot.plant_id && !plot.is_harvested && new Date(plot.ready_at) <= new Date(),
              'empty': !plot.plant_id || plot.is_harvested
            }]"
          >
            <div class="plot-number">{{ plot.plot_number }}</div>
            
            <div v-if="plot.plant_id && !plot.is_harvested" class="plant-stage">
              <div class="stage-icon">{{ getStageIcon(plot.growth_stage) }}</div>
              <div class="plant-name">{{ plot.plant_name }}</div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: plot.growth_progress + '%' }"></div>
              </div>
              <div class="progress-text">{{ plot.growth_progress }}%</div>
              
              <div v-if="new Date(plot.ready_at) <= new Date()" class="action-buttons">
                <button class="btn-harvest" @click="harvest(plot.plot_number)">
                  🌾 收获
                </button>
              </div>
              <div v-else class="action-buttons">
                <button 
                  class="btn-water" 
                  @click="water(plot.plot_number)"
                  :disabled="userWaterCount >= maxWaterPerDay"
                >
                  💧 浇水
                </button>
              </div>
            </div>
            
            <div v-else class="empty-plot">
              <button 
                v-if="selectedPlant" 
                class="btn-plant"
                @click="plant(plot.plot_number)"
              >
                🌱 种植 {{ selectedPlant.name }}
              </button>
              <div v-else class="select-prompt">先选择种子</div>
            </div>
          </div>
        </div>

        <!-- 收获记录 -->
        <div class="records-section card">
          <h3 class="section-title">最近记录</h3>
          <div class="record-list">
            <div v-for="record in records" :key="record.id" class="record-item">
              <span class="record-time">{{ formatDate(record.created_at) }}</span>
              <span class="record-action">{{ getActionText(record) }}</span>
            </div>
            <div v-if="records.length === 0" class="empty-text">暂无记录</div>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'
import PageLayout from '../components/PageLayout.vue'

const userStore = useUserStore()
const loading = ref(false)
const garden = ref(null)
const plots = ref([])
const plants = ref([])
const records = ref([])
const selectedPlant = ref(null)
const userWaterCount = ref(0)
const maxWaterPerDay = ref(5)

function getStageIcon(stage) {
  const icons = ['🌱', '🌿', '🪴', '🌳', '🌾']
  return icons[stage] || '🌱'
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

function getActionText(record) {
  const actionMap = {
    plant: '🌱 种植了',
    water: '💧 浇水',
    harvest: '🌾 收获了'
  }
  const action = actionMap[record.action_type] || record.action_type
  return `${action} ${record.plant_name || ''} ${record.plot_number ? `(#${record.plot_number})` : ''} ${record.contribution_earned ? `(+${record.contribution_earned}贡献)` : ''}`
}

async function loadGarden() {
  try {
    const res = await api.get('/garden/my-garden')
    if (res.success) {
      garden.value = res.data.garden
      plots.value = res.data.plots
      userWaterCount.value = res.data.userWaterCount
      maxWaterPerDay.value = res.data.maxWaterPerDay
    }
  } catch (e) {
    console.error('Load garden failed:', e)
  }
}

async function loadPlants() {
  try {
    const res = await api.get('/garden/plants')
    if (res.success) {
      plants.value = res.data
      if (plants.value.length > 0) {
        selectedPlant.value = plants.value[0]
      }
    }
  } catch (e) {
    console.error('Load plants failed:', e)
  }
}

async function loadRecords() {
  try {
    const res = await api.get('/garden/records')
    if (res.success) {
      records.value = res.data
    }
  } catch (e) {
    console.error('Load records failed:', e)
  }
}

async function plant(plotNumber) {
  if (!selectedPlant.value) {
    alert('请先选择种子')
    return
  }
  
  try {
    const res = await api.post('/garden/plant', {
      plotNumber,
      plantId: selectedPlant.value.id
    })
    if (res.success) {
      alert('✅ ' + res.message)
      await loadGarden()
    } else {
      alert('❌ ' + res.message)
    }
  } catch (e) {
    alert('种植失败：' + (e.response?.data?.message || '未知错误'))
  }
}

async function water(plotNumber) {
  try {
    const res = await api.post('/garden/water', { plotNumber })
    if (res.success) {
      alert('✅ ' + res.message)
      await loadGarden()
      userWaterCount.value++
    } else {
      alert('❌ ' + res.message)
    }
  } catch (e) {
    alert('浇水失败：' + (e.response?.data?.message || '未知错误'))
  }
}

async function harvest(plotNumber) {
  try {
    const res = await api.post('/garden/harvest', { plotNumber })
    if (res.success) {
      alert('✅ ' + res.message)
      await loadGarden()
    } else {
      alert('❌ ' + res.message)
    }
  } catch (e) {
    alert('收获失败：' + (e.response?.data?.message || '未知错误'))
  }
}

onMounted(() => {
  loadGarden()
  loadPlants()
  loadRecords()
})
</script>

<style scoped>
.garden-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e4a3a 0%, #1a1f2e 100%);
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  color: #6ee7b7;
  font-size: 32px;
  margin: 0 0 10px 0;
  text-shadow: 0 0 20px rgba(110, 231, 183, 0.3);
}

.page-desc {
  color: #9ca3af;
  font-size: 14px;
  margin: 0;
}

.garden-container {
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-title {
  color: #6ee7b7;
  font-size: 18px;
  margin: 0 0 15px 0;
  border-left: 3px solid #10b981;
  padding-left: 10px;
}

.garden-info {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.info-row {
  text-align: center;
}

.info-row .label {
  color: #9ca3af;
  font-size: 13px;
  display: block;
  margin-bottom: 5px;
}

.info-row .value {
  color: #6ee7b7;
  font-size: 20px;
  font-weight: bold;
}

.plant-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.plant-item {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.plant-item:hover {
  border-color: #10b981;
  transform: translateY(-2px);
}

.plant-item.selected {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.plant-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.plant-name {
  color: #e5e7eb;
  font-size: 14px;
  margin-bottom: 5px;
}

.plant-info {
  display: flex;
  justify-content: center;
  gap: 10px;
  font-size: 12px;
  color: #9ca3af;
}

.plots-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.plot-card {
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
  min-height: 200px;
  position: relative;
}

.plot-card.empty {
  border-color: rgba(255, 255, 255, 0.1);
}

.plot-card.has-plant {
  border-color: rgba(16, 185, 129, 0.5);
}

.plot-card.ready {
  border-color: rgba(251, 191, 36, 0.8);
  background: rgba(251, 191, 36, 0.1);
}

.plot-number {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #6b7280;
  font-size: 12px;
}

.plant-stage {
  text-align: center;
  padding-top: 20px;
}

.stage-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin: 10px 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #34d399);
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-text {
  color: #9ca3af;
  font-size: 12px;
  margin-bottom: 10px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

.btn-plant, .btn-water, .btn-harvest {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-plant {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.btn-plant:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-water {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.btn-water:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-water:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-harvest {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
}

.btn-harvest:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.empty-plot {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding-top: 40px;
}

.select-prompt {
  color: #6b7280;
  font-size: 13px;
}

.record-list {
  max-height: 200px;
  overflow-y: auto;
}

.record-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.record-time {
  color: #6b7280;
  font-size: 12px;
}

.record-action {
  color: #e5e7eb;
  font-size: 13px;
}

.empty-text {
  color: #6b7280;
  text-align: center;
  padding: 20px;
}

.loading {
  text-align: center;
  color: #9ca3af;
  padding: 60px 20px;
}

@media (max-width: 1200px) {
  .plots-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 900px) {
  .garden-info {
    grid-template-columns: repeat(2, 1fr);
  }
  .plots-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .plots-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
