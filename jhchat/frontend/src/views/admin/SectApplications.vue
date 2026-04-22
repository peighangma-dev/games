<template>
  <div class="sect-applications-page">
    <div class="page-header">
      <h3 class="section-title">📋 入派申请审批 - {{ sectName }}</h3>
      <button @click="goBack" class="btn btn-secondary">返回门派列表</button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <select v-model="statusFilter" class="filter-select" @change="loadApplications">
        <option value="pending">待处理</option>
        <option value="all">全部</option>
        <option value="approved">已通过</option>
        <option value="rejected">已拒绝</option>
      </select>
      <span class="stat-text">共 {{ pagination.total }} 条申请</span>
    </div>

    <!-- 申请列表 -->
    <div class="applications-list">
      <div v-for="app in applications" :key="app.id" class="application-card">
        <div class="app-header">
          <div class="app-user">
            <span class="app-avatar">{{ app.avatar || '' }}</span>
            <div class="app-info">
              <div class="app-username">{{ app.username }}</div>
              <div class="app-meta">
                <span>等级：{{ app.grade }}</span>
                <span>经验：{{ app.all_value }}</span>
                <span>性别：{{ app.gender === 'male' ? '男' : '女' }}</span>
              </div>
            </div>
          </div>
          <span :class="['status-badge', app.status]">
            {{ statusText(app.status) }}
          </span>
        </div>

        <div class="app-body">
          <div class="app-message" v-if="app.message">
            <strong>申请留言：</strong>
            <p>{{ app.message }}</p>
          </div>
          
          <div class="app-reply" v-if="app.reply">
            <strong>回复：</strong>
            <p>{{ app.reply }}</p>
          </div>

          <div class="app-time">
            申请时间：{{ formatDate(app.created_at) }}
            <span v-if="app.handled_at">| 处理时间：{{ formatDate(app.handled_at) }}</span>
            <span v-if="app.handler_username">| 处理人：{{ app.handler_username }}</span>
          </div>
        </div>

        <div class="app-actions" v-if="app.status === 'pending'">
          <button @click="showReplyDialog(app, 'approve')" class="btn btn-success">✓ 批准</button>
          <button @click="showReplyDialog(app, 'reject')" class="btn btn-danger">✗ 拒绝</button>
        </div>
      </div>

      <div v-if="applications.length === 0" class="empty-text">
        暂无申请记录
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="pagination.total > pagination.limit">
      <button @click="changePage(pagination.page - 1)" :disabled="pagination.page <= 1" class="btn">上一页</button>
      <span class="page-info">第 {{ pagination.page }} 页 / 共 {{ pagination.pages }} 页</span>
      <button @click="changePage(pagination.page + 1)" :disabled="pagination.page >= pagination.pages" class="btn">下一页</button>
    </div>

    <!-- 回复对话框 -->
    <div v-if="replyDialog.visible" class="modal-overlay" @click="replyDialog.visible = false">
      <div class="modal" @click.stop>
        <h4>{{ replyDialog.action === 'approve' ? '批准申请' : '拒绝申请' }}</h4>
        <p class="modal-hint">申请人：{{ replyDialog.app?.username }}</p>
        
        <div class="form-group">
          <label>回复留言 (可选):</label>
          <textarea 
            v-model="replyDialog.reply" 
            rows="4" 
            class="form-input" 
            placeholder="请输入回复内容..."
          ></textarea>
        </div>
        
        <div class="modal-actions">
          <button @click="replyDialog.visible = false" class="btn">取消</button>
          <button @click="submitReview" :class="['btn', replyDialog.action === 'approve' ? 'btn-success' : 'btn-danger']">
            {{ replyDialog.action === 'approve' ? '批准' : '拒绝' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../../utils/api'

const router = useRouter()
const route = useRoute()

const sectId = computed(() => route.params.sectId)
const sectName = ref('')
const applications = ref([])
const statusFilter = ref('pending')

const replyDialog = reactive({
  visible: false,
  app: null,
  action: 'approve',
  reply: ''
})

const pagination = reactive({
  total: 0,
  page: 1,
  limit: 50,
  pages: 0
})

const loadApplications = async () => {
  try {
    const res = await api.get(`/admin/sects/${sectId.value}/applications`, {
      params: { 
        status: statusFilter.value,
        page: pagination.page,
        limit: pagination.limit
      }
    })
    
    if (res.success) {
      applications.value = res.data.applications || []
      pagination.total = res.data.pagination.total
      pagination.pages = res.data.pagination.pages
      pagination.page = res.data.pagination.page
    }
  } catch (error) {
    alert('加载申请列表失败：' + (error.message || '未知错误'))
  }
}

const showReplyDialog = (app, action) => {
  replyDialog.app = app
  replyDialog.action = action
  replyDialog.reply = ''
  replyDialog.visible = true
}

const submitReview = async () => {
  try {
    const res = await api.post(
      `/admin/sects/${sectId.value}/applications/${replyDialog.app.id}/review`,
      {
        action: replyDialog.action,
        reply: replyDialog.reply
      }
    )
    
    if (res.success) {
      alert(replyDialog.action === 'approve' ? '申请已批准' : '申请已拒绝')
      replyDialog.visible = false
      loadApplications()
    }
  } catch (error) {
    alert('处理失败：' + (error.message || '未知错误'))
  }
}

const statusText = (status) => {
  const map = {
    pending: '待处理',
    approved: '已通过',
    rejected: '已拒绝',
    cancelled: '已取消'
  }
  return map[status] || status
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const changePage = (newPage) => {
  if (newPage < 1 || newPage > pagination.pages) return
  pagination.page = newPage
  loadApplications()
}

const goBack = () => {
  router.push('/admin/sects')
}

onMounted(() => {
  loadApplications()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.filter-select {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 4px;
  font-size: 14px;
}

.filter-select:focus {
  outline: none;
  border-color: #4B87C3;
}

.stat-text {
  color: #ccc;
  font-size: 14px;
}

.applications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.application-card {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.app-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #4B87C3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.app-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-username {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.app-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #888;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.status-badge.pending {
  background: rgba(255, 160, 50, 0.3);
  color: #fa0;
}

.status-badge.approved {
  background: rgba(100, 200, 100, 0.3);
  color: #8f8;
}

.status-badge.rejected {
  background: rgba(200, 50, 50, 0.3);
  color: #f88;
}

.status-badge.cancelled {
  background: rgba(100, 100, 100, 0.5);
  color: #888;
}

.app-body {
  margin-bottom: 12px;
}

.app-message,
.app-reply {
  margin-bottom: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.app-message strong,
.app-reply strong {
  color: #7eb8da;
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
}

.app-message p,
.app-reply p {
  margin: 0;
  color: #ccc;
  font-size: 13px;
  line-height: 1.5;
}

.app-time {
  font-size: 12px;
  color: #666;
}

.app-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-success {
  background: #28a745;
  color: #fff;
}

.btn-success:hover {
  background: #218838;
}

.btn-danger {
  background: #dc3545;
  color: #fff;
}

.btn-danger:hover {
  background: #c82333;
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

.modal {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 24px;
  width: 100%;
  max-width: 500px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal h4 {
  color: #7eb8da;
  margin-bottom: 8px;
  font-size: 16px;
}

.modal-hint {
  color: #888;
  font-size: 13px;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  color: #ccc;
  font-size: 13px;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
}

.form-input:focus {
  outline: none;
  border-color: #4B87C3;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.empty-text {
  text-align: center;
  color: #888;
  padding: 40px;
}
</style>
