<template>
  <div class="logs-view">
    <h3 class="section-title">操作日志</h3>
    
    <div class="card">
      <div class="action-bar">
        <input v-model="operator" type="text" placeholder="操作者用户名" class="form-input" @keyup.enter="loadLogs" />
        <button @click="loadLogs" class="btn btn-primary">查询</button>
        <button @click="clearLogs" class="btn btn-danger">清除所有日志</button>
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

const logs = ref([])
const operator = ref('')
const page = ref(1)
const limit = ref(50)
const total = ref(0)

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

async function loadLogs() {
  try {
    const res = await api.get('/admin/logs', {
      params: { page: page.value, limit: limit.value, operator: operator.value }
    })
    if (res.success) {
      logs.value = res.data || []
      total.value = logs.value.length
    }
  } catch (e) {
    alert('加载日志失败：' + (e.message || '未知错误'))
  }
}

function changePage(newPage) {
  page.value = newPage
  loadLogs()
}

async function clearLogs() {
  if (!confirm('确定要清除所有日志吗？此操作不可恢复！')) return
  try {
    const res = await api.delete('/admin/logs')
    if (res.success) {
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
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 16px; border-left: 3px solid #4B87C3; padding-left: 10px; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.action-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.form-input { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; flex: 1; }
.btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #555; color: #fff; transition: all 0.3s; }
.btn:hover { opacity: 0.8; }
.btn-primary { background: #4B87C3; }
.btn-danger { background: #e74c3c; }
.table-container { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
.data-table th { color: #7eb8da; font-weight: 600; font-size: 14px; white-space: nowrap; }
.data-table td { font-size: 13px; }
.data-table code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; font-family: monospace; color: #f39c12; }
.empty-text { text-align: center; color: #888; padding: 20px; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 16px; }
.page-info { color: #aaa; }
</style>
