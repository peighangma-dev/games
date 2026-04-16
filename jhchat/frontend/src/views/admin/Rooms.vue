<template>
  <div class="room-management">
    <h3 class="section-title">聊天房间管理</h3>
    
    <div class="card">
      <!-- 添加房间 -->
      <div class="action-bar">
        <h4 class="subsection-title">添加房间</h4>
        <div class="form-row">
          <input v-model="addForm.name" type="text" placeholder="房间名称" class="form-input" />
          <div class="form-group-inline">
            <label>最低等级:</label>
            <input v-model.number="addForm.min_grade" type="number" min="0" max="10" class="form-input-small" />
          </div>
          <div class="form-group-inline">
            <label>最高等级:</label>
            <input v-model.number="addForm.max_grade" type="number" min="0" max="10" class="form-input-small" />
          </div>
          <label class="checkbox-label">
            <input v-model="addForm.fight_enabled" type="checkbox" /> 允许 PK
          </label>
          <div class="form-group-inline">
            <label>排序:</label>
            <input v-model.number="addForm.sort_order" type="number" class="form-input-small" />
          </div>
          <button @click="addRoom" class="btn btn-primary">添加房间</button>
        </div>
      </div>

      <!-- 房间列表 -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>排序</th>
              <th>房间名称</th>
              <th>等级限制</th>
              <th>PK 开关</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="room in rooms" :key="room.id">
              <td>{{ room.sort_order }}</td>
              <td><strong>{{ room.name }}</strong></td>
              <td>
                <span v-if="room.min_grade === 0 && room.max_grade === 10">不限</span>
                <span v-else>
                  {{ room.min_grade === 0 ? '无限制' : room.min_grade + '级+' }}
                  {{ room.max_grade < 10 ? '(最高' + room.max_grade + '级)' : '' }}
                </span>
              </td>
              <td>
                <span :class="['status-dot', room.fight_enabled ? 'enabled' : 'disabled']"></span>
                {{ room.fight_enabled ? '开启' : '关闭' }}
              </td>
              <td>
                <button @click="editRoom(room)" class="btn btn-sm btn-info">编辑</button>
                <button @click="deleteRoom(room.id)" class="btn btn-sm btn-danger">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="rooms.length === 0" class="empty-text">暂无房间</div>
    </div>

    <!-- 编辑对话框 -->
    <div v-if="editingRoom" class="modal-overlay" @click="editingRoom = null">
      <div class="modal" @click.stop>
        <h4>编辑房间：{{ editingRoom.name }}</h4>
        <div class="form-group">
          <label>房间名称:</label>
          <input v-model="editForm.name" type="text" class="form-input" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>最低等级 (0=不限):</label>
            <input v-model.number="editForm.min_grade" type="number" min="0" max="10" class="form-input" />
          </div>
          <div class="form-group">
            <label>最高等级 (0=不限):</label>
            <input v-model.number="editForm.max_grade" type="number" min="0" max="10" class="form-input" />
          </div>
        </div>
        <div class="form-group">
          <label>
            <input v-model="editForm.fight_enabled" type="checkbox" /> 允许 PK 比武
          </label>
        </div>
        <div class="form-group">
          <label>排序号:</label>
          <input v-model.number="editForm.sort_order" type="number" class="form-input" />
        </div>
        <div class="modal-actions">
          <button @click="saveRoomEdit" class="btn btn-primary">保存</button>
          <button @click="editingRoom = null" class="btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../utils/api'

const rooms = ref([])
const editingRoom = ref(null)
const editForm = ref({})

const addForm = ref({
  name: '',
  min_grade: 0,
  max_grade: 10,
  fight_enabled: true,
  sort_order: 0
})

async function loadRooms() {
  try {
    const res = await api.get('/admin/rooms')
    if (res.success) {
      rooms.value = res.data || []
    }
  } catch (e) {
    alert('加载房间失败：' + (e.message || '未知错误'))
  }
}

async function addRoom() {
  if (!addForm.value.name) {
    alert('请输入房间名称')
    return
  }
  try {
    const res = await api.post('/admin/rooms', addForm.value)
    if (res.success) {
      alert('房间已添加')
      addForm.value.name = ''
      loadRooms()
    }
  } catch (e) {
    alert('添加失败：' + (e.message || '未知错误'))
  }
}

function editRoom(room) {
  editingRoom.value = room
  editForm.value = { ...room }
}

async function saveRoomEdit() {
  try {
    const res = await api.put(`/admin/rooms/${editingRoom.value.id}`, editForm.value)
    if (res.success) {
      alert('房间已更新')
      editingRoom.value = null
      loadRooms()
    }
  } catch (e) {
    alert('更新失败：' + (e.message || '未知错误'))
  }
}

async function deleteRoom(id) {
  if (!confirm('确定要删除该房间吗？')) return
  try {
    const res = await api.delete(`/admin/rooms/${id}`)
    if (res.success) {
      alert('房间已删除')
      loadRooms()
    }
  } catch (e) {
    alert('删除失败：' + (e.message || '未知错误'))
  }
}

onMounted(() => loadRooms())
</script>

<style scoped>
.room-management { padding: 20px; }
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 16px; border-left: 3px solid #4B87C3; padding-left: 10px; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.subsection-title { color: #7eb8da; font-size: 14px; margin-bottom: 12px; }
.action-bar { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.form-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.form-group-inline { display: flex; align-items: center; gap: 8px; }
.form-input { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; }
.form-input-small { width: 80px; padding: 8px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; text-align: center; }
.checkbox-label { display: flex; align-items: center; gap: 6px; color: #aaa; font-size: 14px; cursor: pointer; }
.btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #555; color: #fff; transition: all 0.3s; }
.btn:hover { opacity: 0.8; }
.btn-primary { background: #4B87C3; }
.btn-info { background: #3498db; }
.btn-danger { background: #e74c3c; }
.btn-sm { padding: 4px 8px; font-size: 12px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
.data-table th { color: #7eb8da; font-weight: 600; font-size: 14px; }
.data-table td { font-size: 13px; }
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
.status-dot.enabled { background: #2ecc71; }
.status-dot.disabled { background: #95a5a6; }
.empty-text { text-align: center; color: #888; padding: 20px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; color: #aaa; margin-bottom: 6px; font-size: 14px; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #1e2a3a; padding: 24px; border-radius: 8px; min-width: 500px; max-width: 90%; }
.modal h4 { color: #7eb8da; margin-bottom: 16px; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
</style>
