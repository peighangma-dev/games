<template>
  <div class="economy-page">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><Coin /></el-icon>
        经济监控
      </h1>
    </div>

    <!-- 经济指标 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-statistic title="流通银两总额" :value="economy.totalSilver" :precision="0">
          <template #suffix>
            <span style="font-size: 14px; color: #ffd700;"> 两</span>
          </template>
        </el-statistic>
      </el-col>
      <el-col :span="6">
        <el-statistic title="人均银两" :value="economy.avgSilver" :precision="0">
          <template #suffix>
            <span style="font-size: 14px; color: #ffd700;"> 两</span>
          </template>
        </el-statistic>
      </el-col>
      <el-col :span="6">
        <el-statistic title="银行存款总额" :value="economy.totalDeposit" :precision="0">
          <template #suffix>
            <span style="font-size: 14px; color: #ffd700;"> 两</span>
          </template>
        </el-statistic>
      </el-col>
      <el-col :span="6">
        <el-statistic title="市场交易额（今日）" :value="economy.marketToday" :precision="0">
          <template #suffix>
            <span style="font-size: 14px; color: #ffd700;"> 两</span>
          </template>
        </el-statistic>
      </el-col>
    </el-row>

    <!-- 通货膨胀率 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>经济健康度</span>
          </template>
          <div class="health-indicator">
            <el-progress 
              :percentage="economy.healthScore" 
              :status="economy.healthScore >= 80 ? 'success' : 'warning'"
              :format="percentage => percentage >= 80 ? '健康' : '需要调整'"
            />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>通货膨胀率</span>
          </template>
          <div class="inflation-rate">
            <span class="rate-value">{{ economy.inflationRate }}%</span>
            <span class="rate-trend positive">
              <el-icon><Top /></el-icon>
              较上月 +0.5%
            </span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 财富排行榜 -->
    <el-card>
      <template #header>
        <span>富豪排行榜 TOP 10</span>
      </template>
      <el-table :data="richList" style="width: 100%">
        <el-table-column type="index" label="排名" width="80" />
        <el-table-column prop="username" label="用户名" width="200" />
        <el-table-column prop="silver" label="银两" align="right">
          <template #default="{ row }">
            <span class="price-text">{{ row.silver.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="deposit" label="存款" align="right">
          <template #default="{ row }">
            <span class="price-text">{{ row.deposit?.toLocaleString() || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total" label="总资产" align="right">
          <template #default="{ row }">
            <span class="price-text">{{ (row.silver + (row.deposit || 0)).toLocaleString() }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Coin, Top } from '@element-plus/icons-vue'
import api from '../../utils/api'

const economy = reactive({
  totalSilver: 0,
  avgSilver: 0,
  totalDeposit: 0,
  marketToday: 0,
  healthScore: 85,
  inflationRate: 2.3
})

const richList = ref([])

const loadEconomyData = async () => {
  try {
    const res = await api.get('/admin/economy/stats')
    if (res.success) {
      const data = res.data
      economy.totalSilver = Number(data.money?.totalSilver) || 0
      economy.avgSilver = Number(data.money?.avgPerUser) || 0
      economy.totalDeposit = Number(data.money?.totalDeposit) || 0
      economy.marketToday = Number(data.spending?.daily) || 0
    }
  } catch (error) {
    console.error('加载经济数据失败:', error)
  }
}

const loadRichList = async () => {
  try {
    const res = await api.get('/admin/economy/rich-list?limit=10')
    if (res.success) {
      richList.value = res.data?.list || []
    }
  } catch (error) {
    console.error('加载富豪榜失败:', error)
  }
}

onMounted(() => {
  loadEconomyData()
  loadRichList()
})
</script>

<style scoped>
.economy-page {
  padding: 0;
}

.mb-4 {
  margin-bottom: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  color: #fff;
  margin: 0;
}

.page-title .el-icon {
  font-size: 28px;
  color: #ffd700;
}

.health-indicator,
.inflation-rate {
  padding: 20px;
}

.rate-value {
  font-size: 36px;
  font-weight: bold;
  color: #fff;
}

.rate-trend {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  color: #f56c6c;
}

.rate-trend.positive {
  color: #67c23a;
}

.price-text {
  color: #ffd700;
  font-weight: 500;
}

:deep(.el-statistic__title) {
  color: #a0a0a0;
}

:deep(.el-statistic__content) {
  color: #fff;
  font-size: 28px;
  font-weight: bold;
}

:deep(.el-card) {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

:deep(.el-card__header) {
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #fff;
}

:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-header-bg-color: rgba(255, 255, 255, 0.05);
  --el-table-text-color: #e0e0e0;
  --el-table-header-text-color: #a0a0a0;
  --el-table-border-color: rgba(255, 255, 255, 0.05);
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.05);
}
</style>
