<template>
  <div class="security-management">
    <h3 class="section-title">⚠️ 反作弊监控</h3>
    
    <div class="card">
      <!-- 顶部操作栏 -->
      <div class="action-bar">
        <div class="auto-ban-toggle">
          <label style="color: #fff; font-size: 14px; margin-right: 12px;">
            <input type="checkbox" v-model="autoBan" style="margin-right: 6px;" />
            自动封禁
          </label>
          <span class="auto-ban-status" :class="{ active: autoBan }">
            {{ autoBan ? '开启' : '关闭' }}
          </span>
        </div>
        <button @click="clearAllCheats" class="btn btn-danger">
          <span style="font-size: 14px">🗑️</span> 清理所有作弊者
        </button>
      </div>

      <!-- 监控指标 -->
      <div class="stats-row">
        <div class="stat-item stat-warning">
          <span class="stat-label">⚠️ 可疑用户</span>
          <span class="stat-value">{{ stats.suspiciousUsers }}</span>
        </div>
        <div class="stat-item stat-info">
          <span class="stat-label">📋 今日警告</span>
          <span class="stat-value">{{ stats.todayWarnings }}</span>
        </div>
        <div class="stat-item stat-danger">
          <span class="stat-label">🚫 今日封禁</span>
          <span class="stat-value">{{ stats.todayBans }}</span>
        </div>
        <div class="stat-item stat-success">
          <span class="stat-label">👁️ 监控中</span>
          <span class="stat-value">{{ stats.monitoring }}</span>
        </div>
      </div>

      <!-- 可疑行为列表 -->
      <div class="subsection">
        <h4 class="subsection-title">📊 可疑行为监控</h4>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>可疑行为</th>
                <th style="width: 100px;">次数</th>
                <th style="width: 180px;">最后检测</th>
                <th style="width: 250px;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in suspiciousUsers" :key="user.user_id">
                <td><strong>{{ user.username }}</strong></td>
                <td>{{ user.behavior }}</td>
                <td>
                  <span :class="['count-badge', user.count > 10 ? 'count-high' : 'count-medium']">
                    {{ user.count }}
                  </span>
                </td>
                <td>{{ user.last_detected }}</td>
                <td>
                  <button @click="viewDetails(user)" class="btn btn-sm btn-info" title="查看详情">👁️</button>
                  <button @click="warnUser(user)" class="btn btn-sm btn-warning" title="警告">⚠️</button>
                  <button @click="banUser(user)" class="btn btn-sm btn-danger" title="封禁">🚫</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="suspiciousUsers.length === 0" class="empty-text">暂无可疑用户</div>
      </div>
    </div>

    <!-- 查看详情对话框 -->
    <div v-if="dialogVisible" class="modal-overlay" @click.self="dialogVisible = false">
      <div class="modal" style="min-width: 700px;">
        <h3>📋 可疑行为详情</h3>
        <div class="modal-body" v-if="selectedUser">
          <div class="detail-grid">
            <div class="detail-row">
              <span class="detail-label">用户:</span>
              <span class="detail-value">{{ selectedUser.username }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">用户 ID:</span>
              <span class="detail-value">{{ selectedUser.user_id }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">可疑行为:</span>
              <span class="detail-value">{{ selectedUser.behavior }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">检测次数:</span>
              <span class="detail-value count-high">{{ selectedUser.count }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">首次检测:</span>
              <span class="detail-value">{{ selectedUser.first_detected }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">最后检测:</span>
              <span class="detail-value">{{ selectedUser.last_detected }}</span>
            </div>
          </div>
          
          <div class="logs-section">
            <h4 class="logs-title">📜 行为日志</h4>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width: 180px;">时间</th>
                    <th>行为</th>
                    <th>详情</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(log, index) in selectedUser.logs" :key="index">
                    <td>{{ log.time }}</td>
                    <td>{{ log.action }}</td>
                    <td>{{ log.details }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="!selectedUser.logs || selectedUser.logs.length === 0" class="empty-text">暂无日志记录</div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="dialogVisible = false" class="btn">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../utils/api'

const loading = ref(false)
const autoBan = ref(false)
const dialogVisible = ref(false)
const selectedUser = ref(null)

const stats = reactive({
  suspiciousUsers: 0,
  todayWarnings: 0,
  todayBans: 0,
  monitoring: 0
})

const suspiciousUsers = ref([])

const loadSecurityData = async () => {
  loading.value = true
  try {
    const res = await api.get('/admin/security/suspicious')
    if (res.success) {
      suspiciousUsers.value = res.data?.users || []
      stats.suspiciousUsers = suspiciousUsers.value.length
      stats.todayWarnings = res.data?.today_warnings || 0
      stats.todayBans = res.data?.today_bans || 0
    }
  } catch (error) {
    console.error('加载安全数据失败:', error)
  } finally {
    loading.value = false
  }
}

const viewDetails = (row) => {
  selectedUser.value = row
  dialogVisible.value = true
}

const warnUser = async (row) => {
  try {
    await api.post(`/admin/security/warn/${row.user_id}`)
    alert(`已警告用户 ${row.username}`)
    loadSecurityData()
  } catch (error) {
    alert('警告失败')
  }
}

const banUser = async (row) => {
  try {
    await api.post(`/admin/security/ban/${row.user_id}`)
    alert(`已封禁用户 ${row.username}`)
    loadSecurityData()
  } catch (error) {
    alert('封禁失败')
  }
}

const clearAllCheats = async () => {
  if (!confirm('确定要清理所有作弊者吗？')) return
  try {
    await api.post('/admin/security/clear-all')
    alert('已清理所有作弊者')
    loadSecurityData()
  } catch (error) {
    alert('清理失败')
  }
}

onMounted(() => {
  loadSecurityData()
})
</script>

<style scoped>
.security-management { padding: 20px; }
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 16px; border-left: 3px solid #f39c12; padding-left: 10px; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.action-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.auto-ban-toggle { display: flex; align-items: center; }
.auto-ban-status { padding: 4px 12px; border-radius: 4px; font-size: 12px; background: rgba(231, 76, 60, 0.3); color: #e74c3c; }
.auto-ban-status.active { background: rgba(39, 174, 96, 0.3); color: #27ae60; }
.stats-row { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.stat-item { flex: 1; min-width: 180px; background: rgba(255,255,255,0.05); border-radius: 6px; padding: 16px; border: 1px solid rgba(255,255,255,0.1); }
.stat-item.stat-warning { border-color: rgba(230, 126, 34, 0.5); background: rgba(230, 126, 34, 0.1); }
.stat-item.stat-info { border-color: rgba(52, 152, 219, 0.5); background: rgba(52, 152, 219, 0.1); }
.stat-item.stat-danger { border-color: rgba(231, 76, 60, 0.5); background: rgba(231, 76, 60, 0.1); }
.stat-item.stat-success { border-color: rgba(39, 174, 96, 0.5); background: rgba(39, 174, 96, 0.1); }
.stat-label { color: #a0a0a0; font-size: 13px; display: block; margin-bottom: 8px; }
.stat-value { color: #fff; font-size: 28px; font-weight: bold; }
.subsection { margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.subsection-title { color: #f39c12; font-size: 16px; margin-bottom: 16px; }
.table-container { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
.data-table th { color: #f39c12; font-weight: 600; font-size: 14px; white-space: nowrap; background: rgba(243, 156, 18, 0.1); }
.data-table td { font-size: 13px; }
.data-table tr:hover { background: rgba(255,255,255,0.02); }
.count-badge { padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.count-high { background: #e74c3c; color: #fff; }
.count-medium { background: #f39c12; color: #fff; }
.btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #555; color: #fff; transition: all 0.3s; font-size: 13px; }
.btn:hover:not(:disabled) { opacity: 0.8; }
.btn-primary { background: #f39c12; }
.btn-warning { background: #e67e22; }
.btn-success { background: #27ae60; }
.btn-info { background: #2980b9; }
.btn-danger { background: #e74c3c; }
.btn-sm { padding: 4px 8px; font-size: 12px; }
.empty-text { text-align: center; color: #888; padding: 40px 20px; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #1a202c; border-radius: 8px; padding: 24px; min-width: 700px; max-width: 800px; max-height: 80vh; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); }
.modal h3 { color: #f39c12; margin-bottom: 16px; font-size: 18px; }
.modal-body { margin-bottom: 20px; }
.detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
.detail-row { display: flex; justify-content: space-between; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 4px; }
.detail-label { color: #a0a0a0; font-size: 14px; }
.detail-value { color: #fff; font-size: 14px; font-weight: 500; }
.logs-section { margin-top: 20px; }
.logs-title { color: #f39c12; font-size: 14px; margin-bottom: 12px; }
.modal-footer { display: flex; gap: 12px; justify-content: flex-end; }
</style>
