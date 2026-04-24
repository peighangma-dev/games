<template>
  <div class="updates-page">
    <div class="page-header">
      <h3 class="section-title">📦 系统更新管理</h3>
      <button @click="showCreateModal = true" class="btn btn-primary">
        ➕ 创建更新
      </button>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <label>状态:</label>
        <select v-model="filters.status" @change="loadUpdates">
          <option value="">全部</option>
          <option value="draft">草稿</option>
          <option value="released">已发布</option>
          <option value="archived">已归档</option>
        </select>
      </div>
      <div class="filter-group">
        <label>类型:</label>
        <select v-model="filters.type" @change="loadUpdates">
          <option value="">全部</option>
          <option value="major">Major</option>
          <option value="minor">Minor</option>
          <option value="patch">Patch</option>
          <option value="hotfix">Hotfix</option>
        </select>
      </div>
      <div class="filter-group">
        <label>优先级:</label>
        <select v-model="filters.priority" @change="loadUpdates">
          <option value="">全部</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>
      <button @click="loadUpdates" class="btn">🔄 刷新</button>
    </div>

    <div class="updates-table">
      <table class="data-table">
        <thead>
          <tr>
            <th>版本号</th>
            <th>标题</th>
            <th>类型</th>
            <th>优先级</th>
            <th>状态</th>
            <th>发布日期</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="update in updates" :key="update.id">
            <td>
              <span class="version-tag" :class="getTypeClass(update.type)">
                {{ update.version }}
              </span>
            </td>
            <td>{{ update.title }}</td>
            <td>
              <span :class="['badge', 'badge-' + getTypeBadgeClass(update.type)]">
                {{ update.type }}
              </span>
            </td>
            <td>
              <span :class="['badge', 'badge-' + getPriorityBadgeClass(update.priority)]">
                {{ update.priority }}
              </span>
            </td>
            <td>
              <span :class="['badge', 'badge-' + getStatusBadgeClass(update.status)]">
                {{ getStatusText(update.status) }}
              </span>
            </td>
            <td>{{ formatDate(update.release_date) }}</td>
            <td>
              <div class="action-buttons">
                <button @click="viewDetail(update)" class="btn-sm" title="详情">👁️</button>
                <button @click="editUpdate(update)" class="btn-sm" title="编辑">✏️</button>
                <button 
                  v-if="update.status === 'draft'" 
                  @click="releaseUpdate(update)" 
                  class="btn-sm btn-success" 
                  title="发布">🚀</button>
                <button 
                  v-if="update.status === 'released'" 
                  @click="pushUpdate(update)" 
                  class="btn-sm btn-primary" 
                  title="推送">📤</button>
                <button @click="deleteUpdate(update)" class="btn-sm btn-danger" title="删除">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="updates.length === 0" class="empty-text">暂无更新记录</div>
    </div>

    <div class="pagination" v-if="pagination.totalPages > 1">
      <button 
        :disabled="pagination.page <= 1" 
        @click="changePage(pagination.page - 1)">上一页</button>
      <span>第 {{ pagination.page }} / {{ pagination.totalPages }} 页</span>
      <button 
        :disabled="pagination.page >= pagination.totalPages" 
        @click="changePage(pagination.page + 1)">下一页</button>
    </div>

    <!-- 创建/编辑 更新弹窗 -->
    <div v-if="showCreateModal || editingUpdate" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>{{ editingUpdate ? '编辑更新' : '创建更新' }}</h4>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>版本号 *</label>
              <input 
                v-model="formData.version" 
                type="text" 
                placeholder="v1.0.0" 
                pattern="v\d+\.\d+\.\d+"
                required
                :disabled="!!editingUpdate"
              />
              <small>格式：v1.0.0</small>
            </div>
            <div class="form-group">
              <label>标题 *</label>
              <input v-model="formData.title" type="text" placeholder="更新标题" required />
            </div>
          </div>

          <div class="form-group">
            <label>描述</label>
            <textarea v-model="formData.description" rows="3" placeholder="更新描述"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>类型</label>
              <select v-model="formData.type">
                <option value="major">Major (重大版本)</option>
                <option value="minor">Minor (功能版本)</option>
                <option value="patch" selected>Patch (补丁版本)</option>
                <option value="hotfix">Hotfix (紧急修复)</option>
              </select>
            </div>
            <div class="form-group">
              <label>优先级</label>
              <select v-model="formData.priority">
                <option value="low">Low</option>
                <option value="normal" selected>Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>更新内容 (每行一个)</label>
            <textarea 
              v-model="formData.changesText" 
              rows="6" 
              placeholder="&#10;新增用户管理模块&#10;修复登录 bug&#10;优化性能"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" v-model="formData.force_update" />
                强制更新
              </label>
            </div>
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" v-model="formData.breaking_changes" />
                破坏性变更
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>受影响模块 (逗号分隔)</label>
            <input v-model="formData.affected_modules_text" type="text" placeholder="admin,backend,frontend" />
          </div>

          <div class="form-group">
            <label>发布说明</label>
            <textarea v-model="formData.release_note" rows="3" placeholder="发布说明..."></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeModal" class="btn">取消</button>
          <button @click="saveUpdate" class="btn btn-primary">保存</button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div v-if="selectedUpdate" class="modal-overlay" @click="selectedUpdate = null">
      <div class="modal-content modal-large" @click.stop>
        <div class="modal-header">
          <h4>更新详情 - {{ selectedUpdate.version }}</h4>
          <button @click="selectedUpdate = null" class="close-btn">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="detail-section">
            <h5>基本信息</h5>
            <div class="info-grid">
              <div><strong>标题:</strong> {{ selectedUpdate.title }}</div>
              <div><strong>类型:</strong> {{ selectedUpdate.type }}</div>
              <div><strong>优先级:</strong> {{ selectedUpdate.priority }}</div>
              <div><strong>状态:</strong> {{ getStatusText(selectedUpdate.status) }}</div>
              <div><strong>发布日期:</strong> {{ formatDate(selectedUpdate.release_date) }}</div>
              <div><strong>强制更新:</strong> {{ selectedUpdate.force_update ? '是' : '否' }}</div>
            </div>
          </div>

          <div class="detail-section">
            <h5>更新描述</h5>
            <p>{{ selectedUpdate.description || '无' }}</p>
          </div>

          <div class="detail-section" v-if="selectedUpdate.changes">
            <h5>更新内容</h5>
            <ul>
              <li v-for="(change, index) in parseJson(selectedUpdate.changes)" :key="index">
                {{ change }}
              </li>
            </ul>
          </div>

          <div class="detail-section" v-if="selectedUpdate.pushLogs && selectedUpdate.pushLogs.length > 0">
            <h5>推送记录</h5>
            <table class="mini-table">
              <thead>
                <tr>
                  <th>环境</th>
                  <th>服务器</th>
                  <th>状态</th>
                  <th>推送时间</th>
                  <th>确认时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in selectedUpdate.pushLogs" :key="log.id">
                  <td>{{ log.environment }}</td>
                  <td>{{ log.server_url || '-' }}</td>
                  <td>
                    <span :class="['badge', 'badge-' + getPushStatusBadgeClass(log.push_status)]">
                      {{ log.push_status }}
                    </span>
                  </td>
                  <td>{{ formatDate(log.push_time) }}</td>
                  <td>{{ formatDate(log.acknowledge_time) || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="selectedUpdate = null" class="btn">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../utils/api'

const updates = ref([])
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
})

const filters = reactive({
  status: '',
  type: '',
  priority: ''
})

const showCreateModal = ref(false)
const editingUpdate = ref(null)
const selectedUpdate = ref(null)

const formData = reactive({
  version: '',
  title: '',
  description: '',
  type: 'patch',
  priority: 'normal',
  changesText: '',
  force_update: false,
  breaking_changes: false,
  affected_modules_text: '',
  release_note: ''
})

const loadUpdates = async () => {
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    }
    
    const res = await api.get('/admin/updates', params)
    if (res.data.success) {
      updates.value = res.data.data.updates
      pagination.total = res.data.data.total
      pagination.totalPages = res.data.data.totalPages
    }
  } catch (error) {
    console.error('加载更新列表失败:', error)
    alert('加载更新列表失败：' + error.message)
  }
}

const changePage = (page) => {
  pagination.page = page
  loadUpdates()
}

const viewDetail = async (update) => {
  try {
    const res = await api.get(`/admin/updates/${update.id}`)
    if (res.data.success) {
      selectedUpdate.value = res.data.data
    }
  } catch (error) {
    console.error('加载更新详情失败:', error)
    alert('加载更新详情失败：' + error.message)
  }
}

const editUpdate = (update) => {
  editingUpdate.value = update
  formData.version = update.version
  formData.title = update.title
  formData.description = update.description || ''
  formData.type = update.type
  formData.priority = update.priority
  formData.force_update = !!update.force_update
  formData.breaking_changes = !!update.breaking_changes
  formData.release_note = update.release_note || ''
  
  const changes = parseJson(update.changes)
  formData.changesText = Array.isArray(changes) ? changes.join('\n') : ''
  
  const modules = parseJson(update.affected_modules)
  formData.affected_modules_text = Array.isArray(modules) ? modules.join(',') : ''
  
  showCreateModal.value = true
}

const releaseUpdate = async (update) => {
  if (!confirm(`确定要发布 ${update.version} 吗？`)) return
  
  try {
    const res = await api.post(`/admin/updates/${update.id}/release`)
    if (res.data.success) {
      alert(res.data.message)
      loadUpdates()
    }
  } catch (error) {
    console.error('发布更新失败:', error)
    alert('日发布更新失败：' + error.message)
  }
}

const pushUpdate = (update) => {
  const environment = prompt('推送环境 (production/staging/development):', 'production')
  if (!environment) return
  
  const serverUrl = prompt('服务器 URL (可选):', '')
  
  api.post(`/admin/updates/${update.id}/push`, {
    environment,
    server_url: serverUrl || null
  }).then(res => {
    if (res.data.success) {
      alert(res.data.message)
      viewDetail(update)
    }
  }).catch(error => {
    console.error('推送更新失败:', error)
    alert('推送更新失败：' + error.message)
  })
}

const deleteUpdate = async (update) => {
  if (!confirm(`确定要删除 ${update.version} 吗？`)) return
  
  try {
    const res = await api.delete(`/admin/updates/${update.id}`)
    if (res.data.success) {
      alert(res.data.message)
      loadUpdates()
    }
  } catch (error) {
    console.error('删除更新失败:', error)
    alert('删除更新失败：' + error.message)
  }
}

const saveUpdate = async () => {
  if (!formData.version || !formData.title) {
    alert('版本号和标题必填')
    return
  }
  
  // 验证版本号格式
  if (!/^v\d+\.\d+\.\d+$/.test(formData.version)) {
    alert('版本号格式错误，应为 v1.0.0 格式')
    return
  }
  
  const changes = formData.changesText
    .split('\n')
    .filter(line => line.trim())
  
  const affectedModules = formData.affected_modules_text
    .split(',')
    .map(m => m.trim())
    .filter(m => m)
  
  try {
    if (editingUpdate.value) {
      const res = await api.put(`/admin/updates/${editingUpdate.value.id}`, {
        title: formData.title,
        description: formData.description,
        changes,
        type: formData.type,
        priority: formData.priority,
        force_update: formData.force_update,
        breaking_changes: formData.breaking_changes,
        affected_modules: affectedModules,
        release_note: formData.release_note
      })
      if (res.data.success) {
        alert('更新记录已更新')
        closeModal()
        loadUpdates()
      }
    } else {
      const res = await api.post('/admin/updates', {
        version: formData.version,
        title: formData.title,
        description: formData.description,
        changes,
        type: formData.type,
        priority: formData.priority,
        force_update: formData.force_update,
        breaking_changes: formData.breaking_changes,
        affected_modules: affectedModules,
        release_note: formData.release_note
      })
      if (res.data.success) {
        alert(res.data.message)
        closeModal()
        loadUpdates()
      }
    }
  } catch (error) {
    console.error('保存更新失败:', error)
    alert('保存更新失败：' + (error.response?.data?.message || error.message))
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingUpdate.value = null
  resetFormData()
}

const resetFormData = () => {
  formData.version = ''
  formData.title = ''
  formData.description = ''
  formData.type = 'patch'
  formData.priority = 'normal'
  formData.changesText = ''
  formData.force_update = false
  formData.breaking_changes = false
  formData.affected_modules_text = ''
  formData.release_note = ''
}

const parseJson = (str) => {
  if (!str) return []
  try {
    return typeof str === 'string' ? JSON.parse(str) : str
  } catch {
    return []
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const getTypeClass = (type) => {
  return `version-${type}`
}

const getTypeBadgeClass = (type) => {
  const classes = {
    major: 'major',
    minor: 'minor',
    patch: 'patch',
    hotfix: 'hotfix'
  }
  return classes[type] || 'normal'
}

const getPriorityBadgeClass = (priority) => {
  const classes = {
    critical: 'danger',
    high: 'warning',
    normal: 'info',
    low: 'default'
  }
  return classes[priority] || 'default'
}

const getStatusBadgeClass = (status) => {
  const classes = {
    draft: 'default',
    released: 'success',
    archived: 'info'
  }
  return classes[status] || 'default'
}

const getStatusText = (status) => {
  const texts = {
    draft: '草稿',
    released: '已发布',
    archived: '已归档'
  }
  return texts[status] || status
}

const getPushStatusBadgeClass = (status) => {
  const classes = {
    pending: 'default',
    success: 'success',
    failed: 'danger',
    partial: 'warning'
  }
  return classes[status] || 'default'
}

onMounted(() => {
  loadUpdates()
})
</script>

<style scoped>
.updates-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  color: #7eb8da;
  font-size: 18px;
  border-left: 3px solid #4B87C3;
  padding-left: 10px;
}

.filter-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  color: #a0a0a0;
  font-size: 14px;
}

.filter-group select {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
}

.updates-table {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 15px;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
  padding: 12px;
  text-align: left;
  font-weight: 600;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #ccc;
}

.version-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
  font-weight: bold;
}

.version-major { background: rgba(231, 76, 60, 0.2); color: #e74c3c; }
.version-minor { background: rgba(52, 152, 219, 0.2); color: #3498db; }
.version-patch { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }
.version-hotfix { background: rgba(243, 156, 18, 0.2); color: #f39c12; }

.badge {
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
}

.badge-major { background: rgba(231, 76, 60, 0.2); color: #e74c3c; }
.badge-minor { background: rgba(52, 152, 219, 0.2); color: #3498db; }
.badge-patch { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }
.badge-hotfix { background: rgba(243, 156, 18, 0.2); color: #f39c12; }

.badge-danger { background: rgba(231, 76, 60, 0.2); color: #e74c3c; }
.badge-warning { background: rgba(243, 156, 18, 0.2); color: #f39c12; }
.badge-info { background: rgba(52, 152, 219, 0.2); color: #3498db; }
.badge-success { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }
.badge-default { background: rgba(255, 255, 255, 0.1); color: #ccc; }

.action-buttons {
  display: flex;
  gap: 5px;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn-sm.btn-success { background: rgba(46, 204, 113, 0.8); }
.btn-sm.btn-primary { background: rgba(75, 135, 195, 0.8); }
.btn-sm.btn-danger { background: rgba(231, 76, 60, 0.8); }

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding: 15px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(20, 20, 30, 0.98);
  border-radius: 8px;
  padding: 20px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
}

.modal-body {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  color: #a0a0a0;
  margin-bottom: 5px;
  font-size: 14px;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group small {
  color: #666;
  font-size: 12px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  width: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h5 {
  color: #7eb8da;
  margin-bottom: 10px;
  font-size: 15px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.mini-table th {
  background: rgba(255, 255, 255, 0.05);
  padding: 8px;
  text-align: left;
  color: #a0a0a0;
}

.mini-table td {
  padding: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.empty-text {
  text-align: center;
  color: #888;
  padding: 40px;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
