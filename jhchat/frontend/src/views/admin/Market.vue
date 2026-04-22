<template>
  <div class="market-management">
    <h3 class="section-title">🏪 市场管理</h3>
    
    <div class="card">
      <!-- 市场列表 -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 60px;">ID</th>
              <th style="width: 150px;">卖家</th>
              <th>物品</th>
              <th style="width: 100px;">数量</th>
              <th style="width: 120px;">价格</th>
              <th style="width: 100px;">状态</th>
              <th style="width: 150px;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in listings" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.seller }}</td>
              <td><strong>{{ item.item_name }}</strong></td>
              <td>{{ item.quantity }}</td>
              <td class="price">{{ item.selling_price }} 两</td>
              <td>
                <span :class="['status-badge', item.is_active ? 'status-active' : 'status-inactive']">
                  {{ item.is_active ? '在售' : '已下架' }}
                </span>
              </td>
              <td>
                <button 
                  @click="cancelListing(item)" 
                  class="btn btn-sm btn-danger" 
                  :disabled="!item.is_active"
                  title="下架"
                >
                  ⬇️ 下架
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="listings.length === 0" class="empty-text">暂无市场挂单</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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
    alert('加载市场列表失败')
  } finally {
    loading.value = false
  }
}

const cancelListing = async (row) => {
  try {
    await api.delete(`/admin/market/listings/${row.id}`)
    alert('已下架')
    loadMarketListings()
  } catch (error) {
    alert('下架失败')
  }
}

onMounted(() => {
  loadMarketListings()
})
</script>

<style scoped>
.market-management { padding: 20px; }
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 16px; border-left: 3px solid #f39c12; padding-left: 10px; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.table-container { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
.data-table th { color: #f39c12; font-weight: 600; font-size: 14px; white-space: nowrap; background: rgba(243, 156, 18, 0.1); }
.data-table td { font-size: 13px; }
.data-table tr:hover { background: rgba(255,255,255,0.02); }
.status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
.status-active { background: #27ae60; color: #fff; }
.status-inactive { background: #7f8c8d; color: #fff; }
.price { color: #f39c12; font-weight: bold; }
.btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #555; color: #fff; transition: all 0.3s; font-size: 13px; }
.btn:hover:not(:disabled) { opacity: 0.8; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-danger { background: #e74c3c; }
.btn-sm { padding: 4px 8px; font-size: 12px; }
.empty-text { text-align: center; color: #888; padding: 40px 20px; }
</style>
