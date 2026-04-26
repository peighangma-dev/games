<script setup>
import { ref, onMounted } from 'vue'
import api from '../../utils/api'

const activeTab = ref('configs')
const loading = ref(false)
const levelConfigs = ref([])
const userStats = ref(null)
const chatLogs = ref([])
const searchUserId = ref('')
const logPagination = ref({ page: 1, total: 0, totalPages: 0 })

// 等级编辑表单
const editingLevel = ref(null)
const editForm = ref({})

// 用户查询表单
const queryForm = ref({
  userId: '',
  startDate: '',
  endDate: ''
})

// 状态映射
const statusMap = {
  pending: '待审核',
  approved: '已批准',
  rejected: '已拒绝'
}

// 加载等级配置
async function loadLevelConfigs() {
  try {
    loading.value = true
    const res = await api.get('/admin/level-configs')
    if (res.success) {
      levelConfigs.value = res.data
    }
  } catch (e) {
    alert('加载等级配置失败：' + (e.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 编辑等级配置
function editConfig(config) {
  editingLevel.value = config.level
  editForm.value = {
    required_exp: config.required_exp,
    max_daily_chat_exp: config.max_daily_chat_exp,
    chat_exp_per_minute: config.chat_exp_per_minute,
    can_be_admin: config.can_be_admin === 1,
    min_register_days: config.min_register_days,
    min_total_exp: config.min_total_exp
  }
}

// 保存等级配置
async function saveConfig() {
  if (!editingLevel.value) return
  
  try {
    const res = await api.put(`/admin/level-configs/${editingLevel.value}`, editForm.value)
    if (res.success) {
      alert('配置已更新')
      editingLevel.value = null
      loadLevelConfigs()
    }
  } catch (e) {
    alert('保存失败：' + (e.message || '未知错误'))
  }
}

// 查询用户经验统计
async function loadUserStats() {
  if (!queryForm.value.userId) {
    alert('请输入用户 ID')
    return
  }
  
  try {
    loading.value = true
    const res = await api.get('/admin/level-exp/user-stats', {
      params: { userId: queryForm.value.userId }
    })
    if (res.success) {
      userStats.value = res.data[0]
    }
  } catch (e) {
    alert('查询失败：' + (e.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 加载聊天经验日志
async function loadChatLogs(page = 1) {
  try {
    loading.value = true
    const params = {
      page,
      limit: 20
    }
    
    if (queryForm.value.userId) params.userId = queryForm.value.userId
    if (queryForm.value.startDate) params.startDate = queryForm.value.startDate
    if (queryForm.value.endDate) params.endDate = queryForm.value.endDate
    
    const res = await api.get('/admin/level-exp/chat-logs', { params })
    if (res.success) {
      chatLogs.value = res.data.list
      logPagination.value = res.data.pagination
    }
  } catch (e) {
    alert('加载日志失败：' + (e.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 验证管理员资格
async function verifyAdminQualification() {
  const userId = prompt('请输入要验证的用户 ID:')
  const targetGrade = prompt('请输入目标管理员等级 (6-10):')
  
  if (!userId || !targetGrade) return
  
  try {
    const res = await api.get('/admin/level-exp/verify-admin', {
      params: { userId, targetGrade }
    })
    
    if (res.success) {
      const data = res.data
      let message = `用户：${data.username}\n当前等级：${data.currentGrade}\n申请等级：${data.targetGrade}\n`
      message += `符合条件：${data.passed}/${data.total}\n\n`
      
      if (data.qualified) {
        message += '✅ 符合管理员资格要求'
      } else {
        message += '❌ 不符合要求，缺少：\n'
        data.failedRequirements.forEach(req => {
          message += `- ${req.name}: 当前${req.current}，需要${req.required}\n`
        })
      }
      
      alert(message)
    }
  } catch (e) {
    alert('验证失败：' + (e.message || '未知错误'))
  }
}

onMounted(() => {
  loadLevelConfigs()
})
</script>

<template>
  <div class="level-exp-management">
    <h3 class="section-title">🎯 等级经验管理</h3>
    
    <div class="tabs">
      <button :class="['tab', { active: activeTab === 'configs' }]" @click="activeTab = 'configs'">等级配置</button>
      <button :class="['tab', { active: activeTab === 'stats' }]" @click="activeTab = 'stats'">经验统计</button>
      <button :class="['tab', { active: activeTab === 'logs' }]" @click="activeTab = 'logs'">聊天日志</button>
    </div>
    
    <div class="card">
      <!-- 等级配置页面 -->
      <div v-if="activeTab === 'configs'" class="config-section">
        <div class="section-header">
          <h4>等级配置表</h4>
          <button @click="verifyAdminQualification" class="btn btn-primary">验证管理员资格</button>
        </div>
        
        <div class="config-table">
          <table class="data-table">
            <thead>
              <tr>
                <th>等级</th>
                <th>升级经验</th>
                <th>每日聊天经验上限</th>
                <th>每分钟经验</th>
                <th>可任管理员</th>
                <th>最少注册天数</th>
                <th>最少总经验</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="config in levelConfigs" :key="config.level">
                <td><span class="level-badge">{{ config.level }}</span></td>
                <td>{{ config.required_exp.toLocaleString() }}</td>
                <td>{{ config.max_daily_chat_exp }}</td>
                <td>{{ config.chat_exp_per_minute }}</td>
                <td>{{ config.can_be_admin ? '✅' : '❌' }}</td>
                <td>{{ config.min_register_days }}天</td>
                <td>{{ config.min_total_exp.toLocaleString() }}</td>
                <td>
                  <button @click="editConfig(config)" class="btn btn-sm btn-info">编辑</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- 经验统计页面 -->
      <div v-if="activeTab === 'stats'" class="stats-section">
        <h4>用户经验统计</h4>
        
        <div class="query-form">
          <input v-model="queryForm.userId" type="number" placeholder="用户 ID" class="form-input" />
          <button @click="loadUserStats" class="btn btn-primary" :disabled="loading">查询</button>
        </div>
        
        <div v-if="userStats" class="stats-detail">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">用户名</div>
              <div class="stat-value">{{ userStats.username }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">等级</div>
              <div class="stat-value grade">{{ userStats.grade }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">总经验</div>
              <div class="stat-value exp">{{ userStats.total_exp.toLocaleString() }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">月度经验</div>
              <div class="stat-value monthly-exp">{{ userStats.monthly_exp.toLocaleString() }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">今日聊天</div>
              <div class="stat-value chat">{{ userStats.chat_minutes_today }}分钟</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">累计聊天</div>
              <div class="stat-value total-chat">{{ userStats.chat_minutes_total }}分钟</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">每分钟经验</div>
              <div class="stat-value rate">{{ userStats.chat_exp_per_minute }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">今日剩余经验</div>
              <div class="stat-value remaining">{{ userStats.remaining_daily_exp }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 聊天日志页面 -->
      <div v-if="activeTab === 'logs'" class="logs-section">
        <h4>聊天经验日志</h4>
        
        <div class="query-form">
          <input v-model="queryForm.userId" type="number" placeholder="用户 ID" class="form-input" />
          <input v-model="queryForm.startDate" type="date" placeholder="开始日期" class="form-input" />
          <input v-model="queryForm.endDate" type="date" placeholder="结束日期" class="form-input" />
          <button @click="loadChatLogs" class="btn btn-primary" :disabled="loading">查询</button>
        </div>
        
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>用户</th>
                <th>获得经验</th>
                <th>聊天分钟</th>
                <th>达到日限制</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in chatLogs" :key="log.id">
                <td>{{ log.id }}</td>
                <td>{{ log.username }}</td>
                <td><span class="exp-gain">+{{ log.exp_gain }}</span></td>
                <td>{{ log.chat_minutes }}</td>
                <td>{{ log.is_daily_limit ? '✅' : '-' }}</td>
                <td>{{ log.created_at }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-if="logPagination.total > 0" class="pagination">
          <button @click="loadChatLogs(logPagination.page - 1)" :disabled="logPagination.page <= 1" class="btn">上一页</button>
          <span class="page-info">第 {{ logPagination.page }} 页 / 共 {{ logPagination.totalPages }} 页</span>
          <button @click="loadChatLogs(logPagination.page + 1)" :disabled="logPagination.page >= logPagination.totalPages" class="btn">下一页</button>
        </div>
      </div>
    </div>
    
    <!-- 编辑对话框 -->
    <div v-if="editingLevel" class="modal-overlay" @click="editingLevel = null">
      <div class="modal" @click.stop>
        <h4>编辑等级配置 - Lv.{{ editingLevel }}</h4>
        
        <div class="form-group">
          <label>升级所需经验:</label>
          <input v-model.number="editForm.required_exp" type="number" class="form-input" />
        </div>
        <div class="form-group">
          <label>每日聊天经验上限:</label>
          <input v-model.number="editForm.max_daily_chat_exp" type="number" class="form-input" />
        </div>
        <div class="form-group">
          <label>每分钟获得经验:</label>
          <input v-model.number="editForm.chat_exp_per_minute" type="number" class="form-input" />
        </div>
        <div class="form-group">
          <label>可担任管理员:</label>
          <label class="checkbox-label">
            <input v-model="editForm.can_be_admin" type="checkbox" />
            <span>允许</span>
          </label>
        </div>
        <div class="form-group">
          <label>最少注册天数:</label>
          <input v-model.number="editForm.min_register_days" type="number" class="form-input" />
        </div>
        <div class="form-group">
          <label>最少总经验:</label>
          <input v-model.number="editForm.min_total_exp" type="number" class="form-input" />
        </div>
        
        <div class="modal-actions">
          <button @click="saveConfig" class="btn btn-primary">保存</button>
          <button @click="editingLevel = null" class="btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.level-exp-management { padding: 20px; }
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 16px; border-left: 3px solid #4B87C3; padding-left: 10px; }
.tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.tab { padding: 8px 16px; background: rgba(0,0,0,0.3); border: 1px solid rgba(75,135,195,0.3); color: #888; cursor: pointer; border-radius: 4px; }
.tab.active { background: #4B87C3; color: #fff; border-color: #4B87C3; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-header h4 { color: #7eb8da; margin: 0; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
.data-table th { color: #7eb8da; font-weight: 600; font-size: 14px; }
.data-table td { font-size: 13px; }
.level-badge { background: #f0c040; color: #000; padding: 4px 10px; border-radius: 12px; font-size: 14px; font-weight: bold; }
.exp-gain { color: #8fc9a0; font-weight: bold; }
.btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #555; color: #fff; transition: all 0.3s; }
.btn:hover { opacity: 0.8; }
.btn-primary { background: #4B87C3; }
.btn-sm { padding: 4px 8px; font-size: 12px; }
.btn-info { background: #3498db; }
.query-form { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.form-input { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-top: 16px; }
.stat-card { background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px; border: 1px solid rgba(75,135,195,0.2); }
.stat-label { color: #888; font-size: 12px; margin-bottom: 8px; }
.stat-value { color: #f0c040; font-size: 24px; font-weight: bold; }
.stat-value.grade { color: #7eb8da; }
.stat-value.exp { color: #8fc9a0; }
.stat-value.monthly-exp { color: #7eb8da; }
.stat-value.chat { color: #f0c040; }
.stat-value.total-chat { color: #ffd700; }
.stat-value.rate { color: #c084fc; }
.stat-value.remaining { color: #60a5fa; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 16px; }
.page-info { color: #888; font-size: 14px; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal { background: linear-gradient(135deg, #1a2a3a, #0f1a26); border: 1px solid rgba(126,184,218,0.3); border-radius: 12px; padding: 20px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; }
.modal h4 { color: #7eb8da; margin-bottom: 20px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; color: #888; margin-bottom: 6px; font-size: 14px; }
.checkbox-label { display: flex; align-items: center; gap: 8px; color: #ddd; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
.table-container { overflow-x: auto; }
</style>
