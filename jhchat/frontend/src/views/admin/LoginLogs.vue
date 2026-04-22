<template>
  <div class="login-logs-page">
    <h3 class="section-title">📋 登录日志</h3>

    <div class="card">
      <div class="filter-bar">
        <div class="filter-item">
          <label>用户名:</label>
          <input v-model="filterForm.username" type="text" placeholder="搜索用户名" class="form-input" />
        </div>
        <div class="filter-item">
          <label>IP 地址:</label>
          <input v-model="filterForm.ip" type="text" placeholder="搜索 IP" class="form-input" />
        </div>
        <div class="filter-item">
          <label>状态:</label>
          <select v-model="filterForm.status" class="form-select">
            <option value="">全部状态</option>
            <option value="success">成功</option>
            <option value="failed">失败</option>
          </select>
        </div>
        <div class="filter-item">
          <label>时间范围:</label>
          <div class="date-range">
            <input 
              v-model="filterForm.startDate" 
              type="date" 
              class="form-input" 
              placeholder="开始日期" 
            />
            <span class="separator">至</span>
            <input 
              v-model="filterForm.endDate" 
              type="date" 
              class="form-input" 
              placeholder="结束日期" 
            />
          </div>
        </div>
        <div class="filter-item">
          <button @click="loadLogs" class="btn btn-primary">🔍 搜索</button>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>IP 地址</th>
              <th>地理位置</th>
              <th>状态</th>
              <th>失败原因</th>
              <th>登录时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td>{{ log.id }}</td>
              <td>{{ log.username }}</td>
              <td><span class="ip-tag">{{ log.ip }}</span></td>
              <td>{{ log.location || '-' }}</td>
              <td>
                <span :class="['status-badge', log.status]">
                  {{ log.status === 'success' ? '✓ 成功' : '✗ 失败' }}
                </span>
              </td>
              <td>{{ log.reason || '-' }}</td>
              <td>{{ formatDate(log.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="logs.length === 0" class="empty-text">暂无登录日志</div>

      <div class="pagination" v-if="pagination.total > pagination.pageSize">
        <button @click="changePage(1)" :disabled="pagination.page === 1" class="btn btn-sm">⏮️</button>
        <button @click="changePage(pagination.page - 1)" :disabled="pagination.page === 1" class="btn btn-sm">◀️</button>
        <span class="page-info">第 {{ pagination.page }} 页 / 共 {{ Math.ceil(pagination.total / pagination.pageSize) }} 页</span>
        <button @click="changePage(pagination.page + 1)" :disabled="pagination.page * pagination.pageSize >= pagination.total" class="btn btn-sm">▶️</button>
        <button @click="changePage(Math.ceil(pagination.total / pagination.pageSize))" :disabled="pagination.page * pagination.pageSize >= pagination.total" class="btn btn-sm">⏭️</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../utils/api'

const loading = ref(false)
const logs = ref([])

const filterForm = reactive({
  username: '',
  ip: '',
  status: '',
  startDate: '',
  endDate: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0
})

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const loadLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.pageSize,
      username: filterForm.username,
      ip: filterForm.ip,
      status: filterForm.status,
      startDate: filterForm.startDate,
      endDate: filterForm.endDate
    }
    
    const res = await api.get('/admin/login-logs', { params })
    if (res.success || res.data?.success) {
      const data = res.data?.data || res.data || {}
      logs.value = data.logs || []
      pagination.total = data.total || 0
    }
  } catch (error) {
    alert('加载登录日志失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const changePage = (newPage) => {
  pagination.page = newPage
  loadLogs()
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.section-title {
  color: #7eb8da;
  font-size: 18px;
  margin-bottom: 20px;
  border-left: 3px solid #4B87C3;
  padding-left: 10px;
}

.card {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 16px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  color: #ccc;
  font-size: 13px;
  white-space: nowrap;
}

.form-input {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #4B87C3;
}

.form-select {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.separator {
  color: #888;
  font-size: 12px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn-primary {
  background: #4B87C3;
}

.btn-primary:hover {
  background: #3a75b0;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
  font-weight: 600;
  font-size: 14px;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid rgba(243, 156, 18, 0.3);
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #ccc;
}

.data-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.ip-tag {
  padding: 4px 8px;
  background: rgba(75, 135, 195, 0.2);
  color: #7eb8da;
  border-radius: 4px;
  font-size: 13px;
  font-family: 'Courier New', monospace;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status-badge.success {
  background: rgba(67, 233, 123, 0.2);
  color: #43e97b;
}

.status-badge.failed {
  background: rgba(245, 87, 108, 0.2);
  color: #f5576c;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.page-info {
  color: #ccc;
  font-size: 13px;
}

.empty-text {
  text-align: center;
  color: #888;
  padding: 40px;
}
</style>
