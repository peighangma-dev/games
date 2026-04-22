<template>
  <div class="logs-view">
    <h3 class="section-title">📝 操作日志</h3>
    
    <div class="card">
      <div class="filter-bar">
        <div class="filter-item">
          <label>操作者:</label>
          <input v-model="operator" type="text" placeholder="操作者用户名" class="form-input" @keyup.enter="loadLogs" />
        </div>
        <div class="filter-item">
          <label>开始时间:</label>
          <input v-model="startDate" type="date" class="form-input" />
        </div>
        <div class="filter-item">
          <label>结束时间:</label>
          <input v-model="endDate" type="date" class="form-input" />
        </div>
        <div class="filter-item">
          <button @click="loadLogs" class="btn btn-primary">🔍 查询</button>
        </div>
        <div class="filter-item">
          <button @click="clearLogs" class="btn btn-danger">🗑️ 清除所有日志</button>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>时间</th>
              <th>操作者</th>
              <th>IP 地址</th>
              <th>操作内容</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td>{{ log.id }}</td>
              <td>{{ formatDate(log.log_time) }}</td>
              <td>{{ log.operator }}</td>
              <td><code>{{ log.ip || '-' }}</code></td>
              <td>{{ log.action }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="logs.length === 0" class="empty-text">暂无日志</div>

      <!-- 分页 -->
      <div class="pagination" v-if="total > limit">
        <button @click="changePage(1)" :disabled="page <= 1" class="btn btn-sm">⏮️</button>
        <button @click="changePage(page - 1)" :disabled="page <= 1" class="btn btn-sm">◀️</button>
        <span class="page-info">第 {{ page }} 页 / 共 {{ totalPages }} 页</span>
        <button @click="changePage(page + 1)" :disabled="page * limit >= total" class="btn btn-sm">▶️</button>
        <button @click="changePage(totalPages)" :disabled="page * limit >= total" class="btn btn-sm">⏭️</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../utils/api'

const logs = ref([])
const operator = ref('')
const startDate = ref('')
const endDate = ref('')
const page = ref(1)
const limit = ref(50)
const total = ref(0)

const totalPages = computed(() => Math.ceil(total.value / limit.value))

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

async function loadLogs() {
  try {
    const params = { 
      page: page.value, 
      limit: limit.value, 
      operator: operator.value,
      startDate: startDate.value,
      endDate: endDate.value
    }
    const res = await api.get('/admin/logs', { params })
    if (res.success || res.data?.success) {
      const data = res.data?.data || res.data || {}
      logs.value = data.logs || []
      total.value = data.total || 0
    }
  } catch (e) {
    alert('加载日志失败：' + (e.message || '未知错误'))
  }
}

function changePage(newPage) {
  if (newPage < 1 || newPage > totalPages.value) return
  page.value = newPage
  loadLogs()
}

async function clearLogs() {
  if (!confirm('确定要清除所有日志吗？此操作不可恢复！')) return
  try {
    const res = await api.delete('/admin/logs')
    if (res.success || res.data?.success) {
      alert('日志已清除')
      loadLogs()
    }
  } catch (e) {
    alert('清除失败：' + (e.message || '未知错误'))
  }
}

onMounted(() => loadLogs())
</script>

<style scoped>
.logs-view { padding: 20px; }
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 20px; border-left: 3px solid #4B87C3; padding-left: 10px; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.filter-bar { display: flex; gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); flex-wrap: wrap; }
.filter-item { display: flex; align-items: center; gap: 8px; }
.filter-item label { color: #ccc; font-size: 13px; white-space: nowrap; }
.form-input { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; font-size: 14px; }
.form-input:focus { outline: none; border-color: #4B87C3; }
.btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: rgba(255,255,255,0.1); color: #fff; transition: all 0.3s; font-size: 14px; }
.btn:hover:not(:disabled) { opacity: 0.8; transform: translateY(-1px); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: #4B87C3; }
.btn-primary:hover:not(:disabled) { background: #3a75b0; }
.btn-danger { background: #e74c3c; }
.btn-danger:hover:not(:disabled) { background: #c0392b; }
.btn-sm { padding: 6px 12px; font-size: 13px; }
.table-container { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
.data-table th { color: #f39c12; font-weight: 600; font-size: 14px; white-space: nowrap; background: rgba(243, 156, 18, 0.1); }
.data-table td { font-size: 13px; color: #ccc; }
.data-table tr:hover { background: rgba(255,255,255,0.02); }
.data-table code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; font-family: monospace; color: #f39c12; }
.empty-text { text-align: center; color: #888; padding: 40px; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); }
.page-info { color: #aaa; font-size: 13px; }
</style>
