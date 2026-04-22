<template>
  <div class="ip-logs-management">
    <h3 class="section-title">🔐 登录日志</h3>
    
    <div class="card">
      <!-- 搜索和筛选 -->
      <div class="filter-bar">
        <div class="filter-row">
          <input v-model="userId" type="text" placeholder="用户 ID" class="form-input" style="width: 120px;" @keyup.enter="loadIpLogs" />
          <select v-model="ipType" class="form-select" style="width: 120px;" @change="loadIpLogs">
            <option value="">全部类型</option>
            <option value="register">📝 注册</option>
            <option value="login">🔑 登录</option>
            <option value="logout">🚪 登出</option>
          </select>
          <button @click="loadIpLogs" class="btn btn-primary">
            <span style="font-size: 14px">🔍</span> 查询
          </button>
          <button @click="resetFilter" class="btn">
            <span style="font-size: 14px">🔄</span> 重置
          </button>
        </div>
      </div>

      <!-- IP 日志列表 -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 60px;">ID</th>
              <th>用户</th>
              <th style="width: 140px;">IP 地址</th>
              <th style="width: 100px;">类型</th>
              <th style="width: 80px;">状态</th>
              <th>地理位置</th>
              <th>浏览器信息</th>
              <th style="width: 180px;">时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in ipLogs" :key="log.id">
              <td>{{ log.id }}</td>
              <td><strong>{{ log.username || `User ${log.user_id}` }}</strong></td>
              <td><span class="ip-address">{{ log.ip_address }}</span></td>
              <td>
                <span :class="['type-badge', 'type-'+log.ip_type]">
                  {{ getTypeName(log.ip_type) }}
                </span>
              </td>
              <td>
                <span :class="['status-badge', log.login_status === 'success' ? 'status-success' : 'status-failed']">
                  {{ log.login_status === 'success' ? '✅' : '❌' }}
                </span>
              </td>
              <td>{{ formatLocation(log) }}</td>
              <td class="user-agent">{{ log.user_agent || '-' }}</td>
              <td style="color: #a0a0a0;">{{ formatDateTime(log.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="ipLogs.length === 0" class="empty-text">暂无数据</div>

      <!-- 分页 -->
      <div class="pagination-bar" v-if="total > limit">
        <button @click="page = 1" :disabled="page <= 1" class="btn btn-sm">⏮️</button>
        <button @click="changePage(page - 1)" :disabled="page <= 1" class="btn btn-sm">◀️ 上一页</button>
        <span style="color: #aaa; font-size: 13px; margin: 0 12px">
          第 {{ page }} 页 / 共 {{ Math.ceil(total / limit) }} 页
        </span>
        <button @click="changePage(page + 1)" :disabled="page * limit >= total" class="btn btn-sm">下一页 ▶️</button>
        <button @click="page = Math.ceil(total / limit)" :disabled="page * limit >= total" class="btn btn-sm">⏭️</button>
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

const getTypeName = (type) => {
  const map = { register: '注册', login: '登录', logout: '登出' }
  return map[type] || type
}

async function loadIpLogs() {
  try {
    const params = { page: page.value, limit: limit.value }
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

function resetFilter() {
  userId.value = ''
  ipType.value = ''
  page.value = 1
  loadIpLogs()
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
.ip-logs-management { padding: 20px; }
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 16px; border-left: 3px solid #f39c12; padding-left: 10px; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.filter-bar { background: rgba(255,255,255,0.02); border-radius: 6px; padding: 12px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.05); }
.filter-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.form-input { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; }
.form-select { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; }
.btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #555; color: #fff; transition: all 0.3s; font-size: 13px; }
.btn:hover:not(:disabled) { opacity: 0.8; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: #f39c12; }
.btn-sm { padding: 4px 8px; font-size: 12px; }
.table-container { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
.data-table th { color: #f39c12; font-weight: 600; font-size: 14px; white-space: nowrap; background: rgba(243, 156, 18, 0.1); }
.data-table td { font-size: 13px; }
.data-table tr:hover { background: rgba(255,255,255,0.02); }
.ip-address { font-family: 'Courier New', monospace; color: #4ade80; font-weight: bold; }
.type-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
.type-register { background: #3498db; color: #fff; }
.type-login { background: #27ae60; color: #fff; }
.type-logout { background: #7f8c8d; color: #fff; }
.status-badge { padding: 4px 6px; border-radius: 4px; font-size: 12px; }
.status-success { background: rgba(39, 174, 96, 0.3); }
.status-failed { background: rgba(231, 76, 60, 0.3); }
.user-agent { color: #888; font-size: 11px; font-family: 'Courier New', monospace; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty-text { text-align: center; color: #888; padding: 40px 20px; }
.pagination-bar { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); }
</style>
