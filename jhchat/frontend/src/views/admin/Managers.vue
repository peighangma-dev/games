<template>
  <div class="manager-management">
    <h3 class="section-title">管理员管理</h3>
    
    <div class="card">
      <!-- 添加管理员 -->
      <div class="action-bar">
        <h4 class="subsection-title">添加管理员</h4>
        <div class="form-row">
          <input v-model="addForm.username" type="text" placeholder="用户名" class="form-input" />
          <select v-model.number="addForm.grade" class="form-select">
            <option :value="6">等级 6 (普通管理员)</option>
            <option :value="7">等级 7 (中级管理员)</option>
            <option :value="8">等级 8 (高级管理员)</option>
            <option :value="9">等级 9 (超级管理员)</option>
          </select>
          <select v-model="addForm.faction" class="form-select" title="门派归属">
            <option value="六扇门">六扇门</option>
            <option value="无">无</option>
          </select>
          <button @click="addManager" class="btn btn-primary">添加</button>
        </div>
      </div>

      <!-- 管理员列表 -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>等级</th>
              <th>门派</th>
              <th>身份</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mgr in managers" :key="mgr.id">
              <td>{{ mgr.id }}</td>
              <td>{{ mgr.username }}</td>
              <td>
                <span :class="['grade-badge', 'grade-' + mgr.grade]">{{ mgr.grade }}</span>
              </td>
              <td>{{ mgr.faction === '六扇门' ? '六扇门' : '无' }}</td>
              <td>{{ mgr.grade >= 6 ? '管理员' : '无' }}</td>
              <td>
                <button @click="editManager(mgr)" class="btn btn-sm btn-info" :disabled="mgr.grade >= currentUser.grade">调整</button>
                <button @click="removeManager(mgr.id)" class="btn btn-sm btn-danger" :disabled="mgr.grade >= currentUser.grade">开除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="managers.length === 0" class="empty-text">暂无管理员</div>
    </div>

    <!-- 编辑对话框 -->
    <div v-if="editingManager" class="modal-overlay" @click="editingManager = null">
      <div class="modal" @click.stop>
        <h4>调整管理员：{{ editingManager.username }}</h4>
        <div class="form-group">
          <label>等级:</label>
          <select v-model.number="editForm.grade" class="form-input">
            <option :value="6">等级 6 (普通管理员)</option>
            <option :value="7">等级 7 (中级管理员)</option>
            <option :value="8">等级 8 (高级管理员)</option>
            <option :value="9">等级 9 (超级管理员)</option>
          </select>
        </div>
        <div class="form-group">
          <label>门派:</label>
          <select v-model="editForm.faction" class="form-input">
            <option value="六扇门">六扇门</option>
            <option value="无">无</option>
          </select>
        </div>
        <div class="modal-actions">
          <button @click="saveManagerEdit" class="btn btn-primary">保存</button>
          <button @click="editingManager = null" class="btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../utils/api'

const managers = ref([])
const editingManager = ref(null)
const editForm = ref({})
const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

const addForm = ref({
  username: '',
  grade: 6,
  faction: '六扇门'
})

async function loadManagers() {
  try {
    const res = await api.get('/admin/managers')
    if (res.success) {
      managers.value = res.data || []
    }
  } catch (e) {
    alert('加载管理员失败：' + (e.message || '未知错误'))
  }
}

async function addManager() {
  if (!addForm.value.username) {
    alert('请输入用户名')
    return
  }
  try {
    const res = await api.post('/admin/managers', addForm.value)
    if (res.success) {
      alert('管理员已添加')
      addForm.value.username = ''
      loadManagers()
    }
  } catch (e) {
    alert('添加失败：' + (e.response?.data?.message || e.message || '未知错误'))
  }
}

function editManager(mgr) {
  editingManager.value = mgr
  editForm.value = {
    grade: mgr.grade,
    faction: mgr.faction
  }
}

async function saveManagerEdit() {
  try {
    const res = await api.put(`/admin/managers/${editingManager.value.id}`, editForm.value)
    if (res.success) {
      alert('管理员已更新')
      editingManager.value = null
      loadManagers()
    }
  } catch (e) {
    alert('更新失败：' + (e.message || '未知错误'))
  }
}

async function removeManager(id) {
  if (!confirm('确定要开除该管理员吗？')) return
  try {
    const res = await api.delete(`/admin/managers/${id}`)
    if (res.success) {
      alert('管理员已开除')
      loadManagers()
    }
  } catch (e) {
    alert('开除失败：' + (e.message || '未知错误'))
  }
}

onMounted(() => loadManagers())
</script>

<style scoped>
.manager-management { padding: 20px; }
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 16px; border-left: 3px solid #4B87C3; padding-left: 10px; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.subsection-title { color: #7eb8da; font-size: 14px; margin-bottom: 12px; }
.action-bar { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.form-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.form-input, .form-select { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; }
.form-input { flex: 1; min-width: 150px; }
.form-select { min-width: 180px; }
.btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #555; color: #fff; transition: all 0.3s; }
.btn:hover:not(:disabled) { opacity: 0.8; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: #4B87C3; }
.btn-info { background: #3498db; }
.btn-danger { background: #e74c3c; }
.btn-sm { padding: 4px 8px; font-size: 12px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
.data-table th { color: #7eb8da; font-weight: 600; font-size: 14px; }
.data-table td { font-size: 13px; }
.grade-badge { background: #f0c040; color: #000; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: bold; }
.empty-text { text-align: center; color: #888; padding: 20px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; color: #aaa; margin-bottom: 6px; font-size: 14px; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #1e2a3a; padding: 24px; border-radius: 8px; min-width: 400px; max-width: 90%; }
.modal h4 { color: #7eb8da; margin-bottom: 16px; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
</style>
