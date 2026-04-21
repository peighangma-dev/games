<template>
  <div class="news-management">
    <div class="page-header">
      <h3 class="section-title">📰 公告管理</h3>
      <button class="btn btn-primary" @click="showAddModal = true">
        ➕ 新增公告
      </button>
    </div>

    <!-- 公告列表 -->
    <div class="card">
      <div class="table-header">
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="🔍 搜索公告..." 
            class="search-input"
          />
        </div>
        <div class="filter-box">
          <select v-model="filterType" class="filter-select">
            <option value="">全部类型</option>
            <option value="system">系统公告</option>
            <option value="activity">活动公告</option>
            <option value="maintenance">维护通知</option>
          </select>
        </div>
      </div>

      <div class="news-table">
        <table>
          <thead>
            <tr>
              <th width="60">ID</th>
              <th width="300">标题</th>
              <th width="100">作者</th>
              <th width="120">类型</th>
              <th width="150">发布时间</th>
              <th width="80">浏览</th>
              <th width="180">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredNews" :key="item.id" :class="{ 'row-highlight': item.is_top }">
              <td>{{ item.id }}</td>
              <td>
                <div class="title-cell">
                  <span v-if="item.is_top" class="top-badge">置顶</span>
                  <span class="title-text">{{ item.topic }}</span>
                </div>
              </td>
              <td>{{ item.author || '-' }}</td>
              <td>
                <span :class="['type-tag', getTypeClass(item)]">
                  {{ getTypeName(item) }}
                </span>
              </td>
              <td>{{ formatDate(item.created_at) }}</td>
              <td>{{ item.view_count || 0 }}</td>
              <td>
                <div class="action-buttons">
                  <button @click="viewDetail(item)" class="btn-sm btn-view" title="查看详情">
                    👁️
                  </button>
                  <button @click="editNews(item)" class="btn-sm btn-edit" title="编辑">
                    ✏️
                  </button>
                  <button @click="toggleTop(item)" :class="['btn-sm', item.is_top ? 'btn-untop' : 'btn-top']" :title="item.is_top ? '取消置顶' : '置顶'">
                    {{ item.is_top ? '🔝' : '⬆️' }}
                  </button>
                  <button @click="confirmDelete(item)" class="btn-sm btn-delete" title="删除">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredNews.length === 0">
              <td colspan="7" class="empty-cell">
                <div class="empty-state">
                  <span class="empty-icon">📭</span>
                  <p>暂无公告</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="totalPages > 1">
        <button @click="currentPage = 1" :disabled="currentPage === 1" class="page-btn">
          ⏮️
        </button>
        <button @click="currentPage--" :disabled="currentPage === 1" class="page-btn">
          ◀️
        </button>
        <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
        <button @click="currentPage++" :disabled="currentPage === totalPages" class="page-btn">
          ▶️
        </button>
        <button @click="currentPage = totalPages" :disabled="currentPage === totalPages" class="page-btn">
          ⏭️
        </button>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-dialog">
        <div class="modal-header">
          <h4>{{ showEditModal ? '✏️ 编辑公告' : '➕ 新增公告' }}</h4>
          <button @click="closeModal" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>公告标题 *</label>
            <input v-model="formData.topic" type="text" placeholder="请输入标题" class="form-input" />
          </div>
          <div class="form-group">
            <label>公告类型</label>
            <select v-model="formData.type" class="form-input">
              <option value="system">系统公告</option>
              <option value="activity">活动公告</option>
              <option value="maintenance">维护通知</option>
              <option value="news">江湖新闻</option>
            </select>
          </div>
          <div class="form-group">
            <label>置顶</label>
            <label class="checkbox-label">
              <input v-model="formData.is_top" type="checkbox" />
              <span>将此公告置顶显示</span>
            </label>
          </div>
          <div class="form-group">
            <label>公告内容 *</label>
            <textarea v-model="formData.content" rows="8" placeholder="请输入公告内容，支持换行" class="form-input"></textarea>
            <div class="form-tip">提示：可以使用换行符分隔段落，让内容更清晰</div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">取消</button>
          <button @click="showEditModal ? updateNews() : createNews()" class="btn btn-primary" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-dialog modal-large">
        <div class="modal-header">
          <h4>📰 公告详情</h4>
          <button @click="closeDetail" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-header">
            <h3 class="detail-title">{{ currentItem?.topic }}</h3>
            <div class="detail-meta">
              <span class="meta-item">作者：{{ currentItem?.author || '系统' }}</span>
              <span class="meta-item">发布时间：{{ formatDate(currentItem?.created_at) }}</span>
              <span class="meta-item">浏览：{{ currentItem?.view_count || 0 }} 次</span>
            </div>
          </div>
          <div class="detail-content">
            <pre>{{ currentItem?.content }}</pre>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeDetail" class="btn btn-secondary">关闭</button>
          <button @click="closeDetail; editNews(currentItem)" class="btn btn-primary">编辑</button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDelete">
      <div class="modal-dialog modal-small">
        <div class="modal-header modal-warning">
          <h4>⚠️ 删除确认</h4>
          <button @click="closeDelete" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <p class="delete-warning">
            确定要删除公告 <strong>"{{ deleteItem?.topic }}"</strong> 吗？
          </p>
          <p class="delete-tip">此操作不可恢复，请谨慎操作</p>
        </div>
        <div class="modal-footer">
          <button @click="closeDelete" class="btn btn-secondary">取消</button>
          <button @click="deleteNews" class="btn btn-danger">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../utils/api'

const newsList = ref([])
const searchQuery = ref('')
const filterType = ref('')
const currentPage = ref(1)
const pageSize = 15

// 弹窗控制
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const showDeleteModal = ref(false)
const saving = ref(false)
const currentItem = ref(null)
const deleteItem = ref(null)

// 表单数据
const formData = ref({
  topic: '',
  content: '',
  type: 'system',
  is_top: false
})

// 加载公告列表
async function loadNews() {
  try {
    const res = await api.get('/admin/news')
    if (res.success) {
      newsList.value = res.data || []
    }
  } catch (e) {
    console.error('加载公告失败:', e)
  }
}

// 按条件过滤
const filteredNews = computed(() => {
  let list = newsList.value
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(item => 
      item.topic?.toLowerCase().includes(query) ||
      item.content?.toLowerCase().includes(query) ||
      item.author?.toLowerCase().includes(query)
    )
  }
  
  // 类型过滤（根据 content 内容简单判断）
  if (filterType.value) {
    list = list.filter(item => {
      const content = (item.topic + ' ' + item.content).toLowerCase()
      if (filterType.value === 'system') return content.includes('系统') || content.includes('公告')
      if (filterType.value === 'activity') return content.includes('活动') || content.includes('福利')
      if (filterType.value === 'maintenance') return content.includes('维护') || content.includes('停机')
      return true
    })
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return list.slice(start, end)
})

const totalPages = computed(() => Math.ceil(newsList.value.length / pageSize))

// 类型标签样式
function getTypeClass(item) {
  const text = (item.topic + ' ' + item.content).toLowerCase()
  if (text.includes('维护') || text.includes('停机')) return 'type-maintenance'
  if (text.includes('活动') || text.includes('福利')) return 'type-activity'
  return 'type-system'
}

function getTypeName(item) {
  const text = (item.topic + ' ' + item.content).toLowerCase()
  if (text.includes('维护') || text.includes('停机')) return '维护通知'
  if (text.includes('活动') || text.includes('福利')) return '活动公告'
  return '系统公告'
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = (now - date) / 1000 // 秒
  
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 查看详情
function viewDetail(item) {
  currentItem.value = item
  showDetailModal.value = true
}

function closeDetail() {
  showDetailModal.value = false
  currentItem.value = null
}

// 编辑
function editNews(item) {
  formData.value = {
    topic: item.topic || '',
    content: item.content || '',
    type: 'system',
    is_top: item.is_top || false
  }
  currentItem.value = item
  showEditModal.value = true
}

// 更新公告
async function updateNews() {
  if (!formData.value.topic.trim() || !formData.value.content.trim()) {
    alert('请填写标题和内容')
    return
  }
  
  saving.value = true
  try {
    const res = await api.put(`/admin/news/${currentItem.value.id}`, {
      topic: formData.value.topic,
      content: formData.value.content
    })
    
    if (res.success) {
      alert('公告已更新')
      closeModal()
      loadNews()
    } else {
      alert(res.message || '更新失败')
    }
  } catch (e) {
    console.error('更新失败:', e)
    alert('更新失败')
  } finally {
    saving.value = false
  }
}

// 新增
function createNews() {
  if (!formData.value.topic.trim() || !formData.value.content.trim()) {
    alert('请填写标题和内容')
    return
  }
  
  saving.value = true
  api.post('/admin/news', formData.value)
    .then(res => {
      if (res.success) {
        alert('公告已发布')
        closeModal()
        loadNews()
      } else {
        alert(res.message || '发布失败')
      }
    })
    .catch(() => alert('发布失败'))
    .finally(() => saving.value = false)
}

// 删除确认
function confirmDelete(item) {
  deleteItem.value = item
  showDeleteModal.value = true
}

function closeDelete() {
  showDeleteModal.value = false
  deleteItem.value = null
}

// 删除
async function deleteNews() {
  try {
    const res = await api.delete(`/admin/news/${deleteItem.value.id}`)
    if (res.success) {
      alert('公告已删除')
      closeDelete()
      loadNews()
    } else {
      alert(res.message || '删除失败')
    }
  } catch (e) {
    console.error('删除失败:', e)
    alert('删除失败')
  }
}

// 置顶/取消置顶
async function toggleTop(item) {
  try {
    const newTop = item.is_top ? 0 : 1
    const res = await api.put(`/admin/news/${item.id}`, {
      topic: item.topic,
      content: item.content,
      is_top: newTop
    })
    
    if (res.success) {
      item.is_top = newTop
      alert(newTop ? '已置顶' : '已取消置顶')
      loadNews()
    }
  } catch (e) {
    console.error('操作失败:', e)
    alert('操作失败')
  }
}

// 关闭弹窗
function closeModal() {
  showAddModal.value = false
  showEditModal.value = false
  currentItem.value = null
  formData.value = { topic: '', content: '', type: 'system', is_top: false }
}

onMounted(() => {
  loadNews()
})
</script>

<style scoped>
.news-management {
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
  margin: 0;
  border-left: 4px solid #4B87C3;
  padding-left: 12px;
}

/* 表格头部 */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 8px 14px;
  background: rgba(15, 15, 30, 0.6);
  border: 1px solid rgba(75, 135, 195, 0.3);
  border-radius: 8px;
  color: #eee;
  font-size: 14px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #4B87C3;
  box-shadow: 0 0 10px rgba(75, 135, 195, 0.3);
}

.filter-select {
  padding: 8px 14px;
  background: rgba(15, 15, 30, 0.6);
  border: 1px solid rgba(75, 135, 195, 0.3);
  border-radius: 8px;
  color: #eee;
  font-size: 14px;
  cursor: pointer;
}

/* 表格样式 */
.news-table {
  overflow-x: auto;
}

.news-table table {
  width: 100%;
  border-collapse: collapse;
}

.news-table th {
  background: rgba(75, 135, 195, 0.1);
  color: #7eb8da;
  font-weight: 600;
  font-size: 13px;
  padding: 12px 10px;
  border-bottom: 2px solid rgba(75, 135, 195, 0.3);
  text-align: left;
}

.news-table td {
  padding: 12px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #ccc;
  font-size: 13px;
}

.news-table tbody tr {
  transition: all 0.2s;
}

.news-table tbody tr:hover {
  background: rgba(75, 135, 195, 0.08);
}

.row-highlight {
  background: rgba(230, 180, 60, 0.05) !important;
}

.title-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  color: #eee;
}

.top-badge {
  display: inline-block;
  padding: 2px 8px;
  background: linear-gradient(135deg, #e6b43c, #f0c840);
  color: #1a1a2e;
  font-size: 11px;
  font-weight: bold;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(230, 180, 60, 0.4);
}

.type-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.type-system {
  background: rgba(75, 135, 195, 0.2);
  color: #7eb8da;
  border: 1px solid rgba(75, 135, 195, 0.3);
}

.type-activity {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
}

.type-maintenance {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
  border: 1px solid rgba(243, 156, 18, 0.3);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 6px;
  justify-content: flex-start;
}

.btn-sm {
  padding: 5px 10px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(75, 135, 195, 0.15);
  color: #7eb8da;
}

.btn-sm:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
}

.btn-view:hover {
  background: rgba(52, 152, 219, 0.3);
  color: #3498db;
}

.btn-edit:hover {
  background: rgba(52, 201, 134, 0.3);
  color: #2ecc71;
}

.btn-top:hover {
  background: rgba(241, 196, 15, 0.3);
  color: #f1c40f;
}

.btn-untop:hover {
  background: rgba(149, 165, 166, 0.3);
  color: #95a5a6;
}

.btn-delete:hover {
  background: rgba(231, 76, 60, 0.3);
  color: #e74c3c;
}

/* 空状态 */
.empty-cell {
  text-align: center;
  padding: 60px 20px !important;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-state p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.page-btn {
  padding: 6px 12px;
  background: rgba(75, 135, 195, 0.15);
  border: 1px solid rgba(75, 135, 195, 0.3);
  border-radius: 6px;
  color: #7eb8da;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: rgba(75, 135, 195, 0.3);
  transform: translateY(-1px);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  color: #888;
  font-size: 13px;
}

/* 弹窗样式 */
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
  z-index: 9999;
  padding: 20px;
}

.modal-dialog {
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.98), rgba(30, 30, 50, 0.98));
  border: 1px solid rgba(75, 135, 195, 0.3);
  border-radius: 12px;
  width: 100%;
  max-width: 550px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: modalSlideIn 0.3s ease-out;
}

.modal-large {
  max-width: 700px;
}

.modal-small {
  max-width: 400px;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-header h4 {
  margin: 0;
  color: #7eb8da;
  font-size: 16px;
}

.modal-warning h4 {
  color: #f39c12;
}

.modal-close {
  background: transparent;
  border: none;
  color: #888;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.modal-body {
  padding: 24px 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #aaa;
  font-size: 13px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(15, 15, 30, 0.6);
  border: 1px solid rgba(75, 135, 195, 0.3);
  border-radius: 8px;
  color: #eee;
  font-size: 14px;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #4B87C3;
  box-shadow: 0 0 10px rgba(75, 135, 195, 0.3);
}

textarea.form-input {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  line-height: 1.6;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ccc;
  font-size: 13px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.form-tip {
  margin-top: 6px;
  color: #666;
  font-size: 12px;
  font-style: italic;
}

/* 详情样式 */
.detail-header {
  margin-bottom: 20px;
}

.detail-title {
  color: #eee;
  font-size: 18px;
  margin: 0 0 12px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.detail-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  color: #888;
  font-size: 13px;
}

.detail-content {
  background: rgba(15, 15, 30, 0.5);
  border: 1px solid rgba(75, 135, 195, 0.2);
  border-radius: 8px;
  padding: 16px;
}

.detail-content pre {
  white-space: pre-wrap;
  word-break: break-word;
  color: #ccc;
  font-size: 14px;
  line-height: 1.7;
  margin: 0;
  font-family: inherit;
}

/* 删除警告 */
.delete-warning {
  color: #ccc;
  font-size: 14px;
  margin-bottom: 8px;
}

.delete-warning strong {
  color: #eee;
}

.delete-tip {
  color: #f39c12;
  font-size: 12px;
  margin: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .table-header {
    flex-direction: column;
  }
  
  .search-box {
    min-width: 100%;
  }
  
  .news-table {
    overflow-x: auto;
  }
  
  .action-buttons {
    justify-content: flex-start;
  }
  
  .modal-dialog {
    margin: 10px;
    max-width: calc(100vw - 20px);
  }
}
</style>
