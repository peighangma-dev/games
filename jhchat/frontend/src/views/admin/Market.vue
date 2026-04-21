<template>
  <div class="market-page">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><Shop /></el-icon>
        市场管理
      </h1>
    </div>

    <el-card>
      <el-table :data="listings" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="seller" label="卖家" width="150" />
        <el-table-column prop="item_name" label="物品" width="200" />
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column prop="selling_price" label="价格" align="right">
          <template #default="{ row }">
            <span class="price-text">{{ row.selling_price }} 两</span>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">
              {{ row.is_active ? '在售' : '已下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="cancelListing(row)" :disabled="!row.is_active">
              下架
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Shop } from '@element-plus/icons-vue'
import api from '../../utils/api'

const loading = ref(false)
const listings = ref([])

const loadMarketListings = async () => {
  loading.value = true
  try {
    const res = await api.get('/admin/market/listings')
    if (res.success) {
      listings.value = res.data || []
    }
  } catch (error) {
    ElMessage.error('加载市场列表失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const cancelListing = async (row) => {
  try {
    await api.delete(`/admin/market/listings/${row.id}`)
    ElMessage.success('已下架')
    loadMarketListings()
  } catch (error) {
    ElMessage.error('下架失败：' + (error.message || '未知错误'))
  }
}

onMounted(() => {
  loadMarketListings()
})
</script>

<style scoped>
.market-page {
  padding: 0;
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
  color: #409EFF;
}

.price-text {
  color: #ffd700;
  font-weight: 500;
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
