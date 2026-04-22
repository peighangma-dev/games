<template>
  <div class="sect-members-page">
    <div class="page-header">
      <h3 class="section-title">🎭 门派成员管理 - {{ sectName }}</h3>
      <button @click="goBack" class="btn btn-secondary">返回门派列表</button>
    </div>

    <!-- 统计信息 -->
    <div class="stats-bar" v-if="members.length > 0">
      <span class="stat-item">总人数：<strong>{{ pagination.total }}</strong></span>
      <span class="stat-item">当前页：<strong>{{ pagination.page }}/{{ pagination.pages }}</strong></span>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <input 
        v-model="search" 
        type="text" 
        placeholder="搜索成员用户名或职位..." 
        class="search-input" 
        @keyup.enter="loadMembers" 
      />
      <button @click="loadMembers" class="btn btn-primary">搜索</button>
      <button @click="syncMembers" class="btn btn-info">同步人数</button>
    </div>

    <!-- 成员列表 -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>性别</th>
            <th>门派职位</th>
            <th>头衔</th>
            <th>等级</th>
            <th>贡献值</th>
            <th>银两</th>
            <th>经验值</th>
            <th>状态</th>
            <th>最后登录</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in members" :key="member.id">
            <td>{{ member.id }}</td>
            <td>{{ member.username }}</td>
            <td>{{ member.gender === 'male' ? '男' : '女' }}</td>
            <td>{{ member.sect_position || '-' }}</td>
            <td>{{ member.sect_title || '-' }}</td>
            <td><span class="grade-badge">{{ member.grade }}</span></td>
            <td>{{ member.sect_contribution || 0 }}</td>
            <td>{{ member.silver }}</td>
            <td>{{ member.all_value }}</td>
            <td>
              <span :class="['status-tag', member.status]">
                {{ statusMap[member.status] || member.status }}
              </span>
            </td>
            <td>{{ formatDate(member.last_login_at) }}</td>
            <td>
              <button @click="editMember(member)" class="btn btn-sm btn-info">编辑</button>
              <button @click="expelMember(member)" class="btn btn-sm btn-danger">开除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="pagination.total > pagination.limit">
      <button @click="changePage(pagination.page - 1)" :disabled="pagination.page <= 1" class="btn">上一页</button>
      <span class="page-info">第 {{ pagination.page }} 页 / 共 {{ pagination.pages }} 页</span>
      <button @click="changePage(pagination.page + 1)" :disabled="pagination.page >= pagination.pages" class="btn">下一页</button>
    </div>

    <!-- 编辑成员对话框 -->
    <div v-if="editingMember" class="modal-overlay" @click="editingMember = null">
      <div class="modal" @click.stop>
        <h4>编辑成员：{{ editingMember.username }}</h4>
        <div class="form-group">
          <label>门派职位:</label>
          <select v-model="editForm.sect_position" class="form-input">
            <option value="">-</option>
            <option v-for="pos in positions" :key="pos.id" :value="pos.position_name">
              {{ pos.position_name }} (rank: {{ pos.position_rank }})
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>头衔:</label>
          <input v-model="editForm.sect_title" type="text" class="form-input" placeholder="如：掌门、长老等" />
        </div>
        <div class="form-group">
          <label>贡献值:</label>
          <input v-model.number="editForm.sect_contribution" type="number" class="form-input" />
        </div>
        <div class="modal-actions">
          <button @click="saveMemberEdit" class="btn btn-primary">保存</button>
          <button @click="editingMember = null" class="btn">取消</button>
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
const loading = ref(false)
const members = ref([])
const positions = ref([])
const search = ref('')

const editingMember = ref(null)
const editForm = ref({})

const pagination = reactive({
  total: 0,
  page: 1,
  limit: 50,
  pages: 0
})

const statusMap = {
  normal: '正常',
  jailed: '坐牢',
  banned: '封禁',
  dead: '死亡',
  inn: '客栈',
  sleeping: '睡觉',
  poisoned: '中毒'
}

const loadMembers = async () => {
  loading.value = true
  try {
    const res = await api.get(`/admin/sects/${sectId.value}/members`, {
      params: { page: pagination.page, limit: pagination.limit, search: search.value }
    })
    
    if (res.success) {
      members.value = res.data.members || []
      pagination.total = res.data.pagination.total
      pagination.pages = res.data.pagination.pages
      pagination.page = res.data.pagination.page
    }
  } catch (error) {
    alert('加载成员列表失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const loadPositions = async () => {
  try {
    const res = await api.get(`/admin/sects/${sectId.value}/positions`)
    if (res.success) {
      positions.value = res.data || []
    }
  } catch (error) {
    console.error('加载职位列表失败:', error)
  }
}

const syncMembers = async () => {
  try {
    const res = await api.post(`/admin/sects/${sectId.value}/sync`)
    if (res.success) {
      alert(res.message || '同步成功')
      loadMembers()
    }
  } catch (error) {
    alert('同步失败：' + (error.message || '未知错误'))
  }
}

const editMember = (row) => {
  editingMember.value = row
  editForm.value = {
    id: row.id,
    username: row.username,
    sect_position: row.sect_position || '',
    sect_title: row.sect_title || '',
    sect_contribution: row.sect_contribution || 0
  }
}

const saveMemberEdit = async () => {
  try {
    // 这里需要后端添加更新成员的 API
    // 暂时使用通用接口
    const res = await api.put(`/admin/users/${editForm.value.id}`, {
      sect_position: editForm.value.sect_position,
      sect_title: editForm.value.sect_title,
      sect_contribution: editForm.value.sect_contribution
    })
    
    if (res.success) {
      alert('成员信息已更新')
      editingMember.value = null
      loadMembers()
    }
  } catch (error) {
    alert('更新失败：' + (error.message || '未知错误'))
  }
}

const expelMember = async (member) => {
  if (!confirm(`确定要将 ${member.username} 逐出师门吗？`)) {
    return
  }
  
  try {
    // 这里需要后端添加开除成员的 API
    // 暂时使用前端的 sect API
    const res = await api.post('/api/sect/expel', {
      username: member.username
    })
    
    if (res.success) {
      alert(`已将 ${member.username} 逐出师门`)
      loadMembers()
    }
  } catch (error) {
    alert('开除失败：' + (error.message || '未知错误'))
  }
}

const changePage = (newPage) => {
  if (newPage < 1 || newPage > pagination.pages) return
  pagination.page = newPage
  loadMembers()
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const goBack = () => {
  router.push('/admin/sects')
}

onMounted(() => {
  loadMembers()
  loadPositions()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
}

.stat-item {
  color: #ccc;
  font-size: 14px;
}

.stat-item strong {
  color: #4B87C3;
  margin-left: 4px;
}

.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  max-width: 300px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 4px;
}

.search-input:focus {
  outline: none;
  border-color: #4B87C3;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-info {
  background: #17a2b8;
  color: #fff;
}

.btn-info:hover {
  background: #138496;
}

.table-container {
  overflow-x: auto;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.data-table th {
  background: rgba(0, 0, 0, 0.4);
  color: #7eb8da;
  font-weight: 600;
}

.data-table tbody tr:hover {
  background: rgba(75, 135, 195, 0.1);
}

.grade-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #4B87C3;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
  color: #fff;
}

.status-tag {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  background: rgba(100, 100, 100, 0.5);
  color: #ccc;
}

.status-tag.normal {
  background: rgba(100, 200, 100, 0.3);
  color: #8f8;
}

.status-tag.jailed {
  background: rgba(200, 150, 50, 0.3);
  color: #fa0;
}

.status-tag.banned {
  background: rgba(200, 50, 50, 0.3);
  color: #f88;
}

.status-tag.dead {
  background: rgba(80, 80, 80, 0.5);
  color: #888;
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
  margin-bottom: 16px;
  font-size: 16px;
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
</style>
