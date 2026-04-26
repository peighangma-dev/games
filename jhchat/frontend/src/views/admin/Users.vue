<template>
  <div class="user-management">
    <h3 class="section-title">用户管理</h3>
    
    <div class="card">
      <!-- 搜索和筛选 -->
      <div class="filter-bar">
        <input v-model="search" type="text" placeholder="搜索用户名..." class="search-input" @keyup.enter="loadUsers" />
        <select v-model="statusFilter" class="filter-select" @change="loadUsers">
          <option value="">全部状态</option>
          <option value="normal">正常</option>
          <option value="jailed">坐牢</option>
          <option value="banned">封禁</option>
          <option value="dead">死亡</option>
          <option value="inn">客栈</option>
          <option value="sleeping">睡觉</option>
          <option value="poisoned">中毒</option>
        </select>
        <button @click="loadUsers" class="btn btn-primary">搜索</button>
        <button @click="showBatchDelete = true" class="btn btn-danger">批量清理</button>
      </div>

      <!-- 用户列表 -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>性别</th>
              <th>等级</th>
              <th>门派</th>
              <th>身份</th>
              <th>银两</th>
              <th>总经验</th>
              <th>月经验</th>
              <th>今日聊天</th>
              <th>状态</th>
              <th>注册时间</th>
              <th>最后登录</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.gender === 'male' ? '男' : '女' }}</td>
              <td><span class="grade-badge">{{ user.grade }}</span></td>
              <td>
                <div v-if="user.sect && user.sect !== '无'" class="sect-info">
                  <div class="sect-name">{{ user.sect }}</div>
                  <div v-if="user.faction && user.faction !== '无'" class="faction-name">{{ user.faction }}</div>
                </div>
                <span v-else-if="user.faction && user.faction !== '无'" class="faction-name">{{ user.faction }}</span>
                <span v-else class="text-muted">无</span>
              </td>
              <td>{{ user.sect_title || '无' }}</td>
              <td>{{ user.silver }}</td>
              <td><span class="exp-value">{{ user.total_exp || 0 }}</span></td>
              <td><span class="exp-value monthly">{{ user.monthly_exp || 0 }}</span></td>
              <td>{{ user.chat_minutes_today || 0 }}分钟</td>
              <td>
                <span :class="['status-tag', user.status]">
                  {{ statusMap[user.status] || user.status }}
                </span>
              </td>
              <td>{{ formatDate(user.registered_at) }}</td>
              <td>{{ formatDate(user.last_login_at) }}</td>
              <td>
                <button @click="editUser(user)" class="btn btn-sm btn-info">编辑</button>
                <button @click="showExpDetail(user)" class="btn btn-sm btn-success">经验详情</button>
                <button @click="showResetPassword(user)" class="btn btn-sm btn-warning">重置密码</button>
                <button @click="deleteUser(user.id)" class="btn btn-sm btn-danger">删除</button>
              </td>
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

    <!-- 编辑用户对话框 -->
    <div v-if="editingUser" class="modal-overlay" @click="editingUser = null">
      <div class="modal" @click.stop>
        <h4>编辑用户：{{ editingUser.username }}</h4>
        <div class="form-group">
          <label>等级 (1-10):</label>
          <input v-model.number="editForm.grade" type="number" min="1" max="10" class="form-input" />
        </div>
        <div class="form-group">
          <label>银两:</label>
          <input v-model.number="editForm.silver" type="number" class="form-input" />
        </div>
        <div class="form-group">
          <label>状态:</label>
          <select v-model="editForm.status" class="form-input">
            <option value="normal">正常</option>
            <option value="jailed">坐牢</option>
            <option value="banned">封禁</option>
            <option value="dead">死亡</option>
          </select>
        </div>
        <div class="form-group">
          <label>门派:</label>
          <input v-model="editForm.sect" type="text" placeholder="如：少林、武当" class="form-input" />
        </div>
        <div class="form-group">
          <label>归属:</label>
          <select v-model="editForm.faction" class="form-input">
            <option value="无">无</option>
            <option value="六扇门">六扇门</option>
            <option value="江湖浪子">江湖浪子</option>
          </select>
        </div>
        <div class="form-group">
          <label>VIP:</label>
          <label><input v-model="editForm.is_vip" type="checkbox" /> 会员</label>
        </div>
        <div class="modal-actions">
          <button @click="saveUserEdit" class="btn btn-primary">保存</button>
          <button @click="editingUser = null" class="btn">取消</button>
        </div>
      </div>
    </div>

    <!-- 批量删除对话框 -->
    <div v-if="showBatchDelete" class="modal-overlay" @click="showBatchDelete = false">
      <div class="modal" @click.stop>
        <h4>批量清理用户</h4>
        <p>将删除 {{ days }} 天未登录的用户</p>
        <div class="form-group">
          <label>天数:</label>
          <input v-model.number="days" type="number" min="1" class="form-input" />
        </div>
        <div class="modal-actions">
          <button @click="confirmBatchDelete" class="btn btn-danger">确认清理</button>
          <button @click="showBatchDelete = false" class="btn">取消</button>
        </div>
      </div>
    </div>

    <!-- 重置密码对话框 -->
    <div v-if="resetPasswordUser" class="modal-overlay" @click="resetPasswordUser = null">
      <div class="modal" @click.stop>
        <h4>重置密码：{{ resetPasswordUser.username }}</h4>
        <div class="form-group">
          <label>新密码:</label>
          <input 
            v-model="passwordForm.newPassword" 
            type="text" 
            placeholder="输入新密码（至少 3 位）"
            class="form-input" 
            autofocus
          />
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="passwordForm.forceChange" />
            强制下次登录修改密码
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="passwordForm.notify" checked />
            发送站内通知
          </label>
        </div>
        <p class="warning-text">⚠️ 此操作将立即修改用户密码，请谨慎操作！</p>
        <div class="modal-actions">
          <button @click="confirmResetPassword" class="btn btn-warning">确认重置</button>
          <button @click="resetPasswordUser = null" class="btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../utils/api'

const users = ref([])
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)

const editingUser = ref(null)
const editForm = ref({})
const showBatchDelete = ref(false)
const days = ref(30)

const resetPasswordUser = ref(null)
const passwordForm = ref({
  newPassword: '',
  forceChange: false,
  notify: true
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

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

async function loadUsers() {
  try {
    const res = await api.get('/admin/users', {
      params: { page: page.value, limit: limit.value, search: search.value, status: statusFilter.value }
    })
    if (res.success) {
      users.value = res.data.users || []
      total.value = res.data.total || 0
    }
  } catch (e) {
    alert('加载用户列表失败: ' + (e.message || '未知错误'))
  }
}

function changePage(newPage) {
  page.value = newPage
  loadUsers()
}

function editUser(user) {
  editingUser.value = user
  editForm.value = {
    grade: user.grade,
    silver: user.silver,
    status: user.status,
    sect: user.sect,
    faction: user.faction,
    is_vip: user.is_vip
  }
}

async function saveUserEdit() {
  try {
    const res = await api.put(`/admin/users/${editingUser.value.id}`, editForm.value)
    if (res.success) {
      alert('用户信息已更新')
      editingUser.value = null
      loadUsers()
    }
  } catch (e) {
    alert('更新失败: ' + (e.message || '未知错误'))
  }
}

async function deleteUser(id) {
  if (!confirm('确定要删除该用户吗？')) return
  try {
    const res = await api.delete(`/admin/users/${id}`)
    if (res.success) {
      alert('用户已删除')
      loadUsers()
    }
  } catch (e) {
    alert('删除失败: ' + (e.message || '未知错误'))
  }
}

async function confirmBatchDelete() {
  try {
    const res = await api.post('/admin/users/batch-delete', { days: days.value })
    if (res.success) {
      alert(res.message)
      showBatchDelete.value = false
      loadUsers()
    }
  } catch (e) {
    alert('批量删除失败：' + (e.message || '未知错误'))
  }
}

function showResetPassword(user) {
  resetPasswordUser.value = user
  passwordForm.value.newPassword = 'admin' + Math.floor(Math.random() * 1000)
  passwordForm.value.notify = true
  passwordForm.value.forceChange = true
}

function showExpDetail(user) {
  alert(`用户：${user.username}\n总经验：${user.total_exp || 0}\n月经验：${user.monthly_exp || 0}\n今日聊天：${user.chat_minutes_today || 0}分钟\n累计聊天：${user.chat_minutes_total || 0}分钟`)
}

onMounted(() => loadUsers())
</script>

<style scoped>
.user-management { padding: 20px; }
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 16px; border-left: 3px solid #4B87C3; padding-left: 10px; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.search-input, .filter-select { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; }
.search-input { flex: 1; min-width: 200px; }
.filter-select { min-width: 120px; }
.btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #555; color: #fff; transition: all 0.3s; }
.btn:hover { opacity: 0.8; }
.btn-primary { background: #4B87C3; }
.btn-danger { background: #e74c3c; }
.btn-info { background: #3498db; }
.btn-sm { padding: 4px 8px; font-size: 12px; }
.table-container { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
.data-table th { color: #7eb8da; font-weight: 600; font-size: 14px; }
.data-table td { font-size: 13px; }
.grade-badge { background: #f0c040; color: #000; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: bold; }
.exp-value { color: #8fc9a0; font-weight: bold; }
.exp-value.monthly { color: #7eb8da; }
.status-tag { padding: 2px 8px; border-radius: 3px; font-size: 12px; background: rgba(143,198,160,0.2); color: #8fc9a0; }
.status-tag.jailed { background: rgba(230,126,34,0.2); color: #e67e22; }
.status-tag.banned { background: rgba(231,76,60,0.2); color: #e74c3c; }
.status-tag.dead { background: rgba(149,165,166,0.2); color: #95a5a6; }
.text-muted { color: #888; }
.sect-info { display: flex; flex-direction: column; gap: 2px; }
.sect-name { font-weight: 600; color: #4B87C3; }
.faction-name { font-size: 11px; color: #aaa; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 16px; }
.page-info { color: #aaa; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #1e2a3a; padding: 24px; border-radius: 8px; min-width: 400px; max-width: 90%; }
.modal h4 { color: #7eb8da; margin-bottom: 16px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; color: #aaa; margin-bottom: 6px; font-size: 14px; }
.form-input { width: 100%; padding: 8px; border: 1px solid #444; background: rgba(0,0,0,0.3); color: #fff; border-radius: 4px; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
.warning-text { color: #e74c3c; font-size: 12px; margin-top: 12px; padding: 8px; background: rgba(231,76,60,0.1); border-radius: 4px; border-left: 2px solid #e74c3c; }
</style>
