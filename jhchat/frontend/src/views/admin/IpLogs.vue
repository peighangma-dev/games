<template>
  <div class="ip-logs-page">
    <h3 class="section-title">🔐 IP 记录管理</h3>
    
    <div class="card">
      <!-- 搜索和筛选 -->
      <div class="filter-bar">
        <div class="filter-row">
          <div class="filter-item">
            <label>用户 ID:</label>
            <input v-model="userId" type="text" placeholder="用户 ID" class="form-input" @keyup.enter="loadIpLogs" />
          </div>
          <div class="filter-item">
            <label>IP 类型:</label>
            <select v-model="ipType" class="form-input" @change="loadIpLogs">
              <option value="">全部</option>
              <option value="register">注册</option>
              <option value="login">登录</option>
              <option value="logout">登出</option>
            </select>
          </div>
          <button @click="loadIpLogs" class="btn btn-primary">查询</button>
        </div>
      </div>

      <!-- IP 日志列表 -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>用户</th>
              <th>IP 地址</th>
              <th>类型</th>
              <th>登录状态</th>
              <th>地理位置</th>
              <th>浏览器信息</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in ipLogs" :key="log.id">
              <td>{{ log.id }}</td>
              <td>{{ log.username || `User ${log.user_id}` }}</td>
              <td>
                <span class="ip-address">{{ log.ip_address }}</span>
              </td>
              <td>
                <span :class="['type-badge', log.ip_type]">
                  {{ ipTypeMap[log.ip_type] || log.ip_type }}
                </span>
              </td>
              <td>
                <span :class="['status-badge', log.login_status]">
                  {{ log.login_status === 'success' ? '成功' : '失败' }}
                </span>
              </td>
              <td>{{ formatLocation(log) }}</td>
              <td class="user-agent">{{ log.user_agent || '-' }}</td>
              <td>{{ formatDateTime(log.created_at) }}</td>
            </tr>
            <tr v-if="ipLogs.length === 0">
              <td colspan="8" class="empty-text">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="total > limit">
        <button @click="changePage(page - 1)" :disabled="page <= 1" class="btn">上一页</button>
        <span class="page-info">第 {{ page }} 页 / 共 {{ Math.ceil(total / limit) }} 页</span>
        <button @click="changePage(page + 1)" :disabled="page * limit >= total" class="btn">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../utils/api'

const ipLogs = ref([])
const userId = ref('')
const ipType = ref('')
const page = ref(1)
const limit = ref(50)
const total = ref(0)

const ipTypeMap = {
  register: '注册',
  login: '登录',
  logout: '登出'
}

async function loadIpLogs() {
  try {
    const params = {
      page: page.value,
      limit: limit.value
    }
    if (userId.value) params.user_id = userId.value
    if (ipType.value) params.ip_type = ipType.value

    const res = await api.get('/admin/ip-logs', { params })
    if (res.success) {
      ipLogs.value = res.data.logs || []
      total.value = res.data.total || 0
    }
  } catch (err) {
    console.error('Load IP logs failed:', err)
  }
}

function formatLocation(log) {
  const parts = [log.country, log.region, log.city].filter(Boolean)
  return parts.join(' ') || '-'
}

function formatDateTime(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleString('zh-CN')
}

function changePage(newPage) {
  if (newPage < 1) return
  page.value = newPage
  loadIpLogs()
}

onMounted(() => {
  loadIpLogs()
})
</script>

<style scoped>
.ip-logs-page {
  padding: 20px;
}

.section-title {
  color: #7eb8da;
  font-size: 20px;
  margin-bottom: 20px;
  border-left: 3px solid #4B87C3;
  padding-left: 10px;
}

.filter-bar {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-item label {
  color: #888;
  font-size: 12px;
}

.form-input {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  min-width: 150px;
}

.form-input:focus {
  outline: none;
  border-color: #4B87C3;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 20px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  background: rgba(75, 135, 195, 0.2);
  color: #7eb8da;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid rgba(75, 135, 195, 0.3);
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #ccc;
}

.data-table tbody tr:hover {
  background: rgba(75, 135, 195, 0.1);
}

.ip-address {
  font-family: 'Courier New', monospace;
  color: #4ade80;
  font-weight: bold;
}

.type-badge, .status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
}

.type-badge.register {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.type-badge.login {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.type-badge.logout {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
}

.status-badge.success {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.status-badge.failed {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.user-agent {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #888;
  font-size: 11px;
  font-family: 'Courier New', monospace;
}

.empty-text {
  text-align: center;
  color: #666;
  padding: 40px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.page-info {
  color: #888;
  font-size: 13px;
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .form-input {
    min-width: 100%;
  }
  
  .data-table {
    font-size: 12px;
  }
  
  .data-table th, .data-table td {
    padding: 8px;
  }
  
  .user-agent {
    max-width: 150px;
  }
}
</style>
