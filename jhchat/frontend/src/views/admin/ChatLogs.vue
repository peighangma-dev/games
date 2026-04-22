<template>
  <div class="chat-logs-management">
    <h3 class="section-title">💬 聊天记录</h3>
    
    <div class="card">
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-row">
          <input v-model="filterForm.username" type="text" placeholder="用户名" class="form-input" style="width: 150px;" />
          <select v-model="filterForm.room" class="form-select" style="width: 120px;">
            <option value="">全部房间</option>
            <option value="逍遥派">逍遥派</option>
            <option value="少林派">少林派</option>
            <option value="武当派">武当派</option>
            <option value="其他">其他</option>
          </select>
          <select v-model="filterForm.type" class="form-select" style="width: 120px;">
            <option value="">全部类型</option>
            <option value="normal">普通消息</option>
            <option value="system">系统消息</option>
            <option value="private">私聊</option>
          </select>
          <input v-model="filterForm.startDate" type="text" placeholder="开始时间" class="form-input" style="width: 160px;" @focus="(e) => e.target.showPicker && e.target.showPicker()" />
          <input v-model="filterForm.endDate" type="text" placeholder="结束时间" class="form-input" style="width: 160px;" @focus="(e) => e.target.showPicker && e.target.showPicker()" />
          <button @click="loadLogs" class="btn btn-primary">
            <span style="font-size: 14px">🔍</span> 搜索
          </button>
          <button @click="resetFilter" class="btn">
            <span style="font-size: 14px">🔄</span> 重置
          </button>
        </div>
      </div>

      <!-- 日志列表 -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 60px;">ID</th>
              <th>用户名</th>
              <th style="width: 120px;">房间</th>
              <th style="width: 100px;">类型</th>
              <th>消息内容</th>
              <th style="width: 180px;">发送时间</th>
              <th style="width: 120px;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td>{{ log.id }}</td>
              <td><strong>{{ log.username }}</strong></td>
              <td>{{ log.room }}</td>
              <td>
                <span :class="['type-badge', 'type-'+log.type]">
                  {{ getMessageTypeText(log.type) }}
                </span>
              </td>
              <td class="message-content">{{ log.content }}</td>
              <td style="color: #a0a0a0;">{{ log.created_at }}</td>
              <td>
                <button @click="deleteMessage(log)" class="btn btn-sm btn-danger" title="删除">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="logs.length === 0" class="empty-text">暂无聊天记录</div>

      <!-- 分页 -->
      <div class="pagination-bar">
        <button 
          @click="pagination.page = 1" 
          :disabled="pagination.page === 1"
          class="btn btn-sm"
        >
          ⏮️ 首页
        </button>
        <button 
          @click="pagination.page--" 
          :disabled="pagination.page === 1"
          class="btn btn-sm"
        >
          ◀️ 上一页
        </button>
        <span style="color: #aaa; font-size: 13px; margin: 0 12px">
          第 {{ pagination.page }} 页 / 共 {{ Math.ceil(pagination.total / pagination.pageSize) }} 页
          <span style="margin-left: 12px">每页：
            <select v-model.number="pagination.pageSize" @change="loadLogs" class="form-select" style="width: 70px; display: inline-block; padding: 4px 8px;">
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
              <option :value="200">200</option>
            </select>
          </span>
        </span>
        <button 
          @click="pagination.page++" 
          :disabled="pagination.page >= Math.ceil(pagination.total / pagination.pageSize)"
          class="btn btn-sm"
        >
          下一页 ▶️
        </button>
        <button 
          @click="pagination.page = Math.ceil(pagination.total / pagination.pageSize)" 
          :disabled="pagination.page >= Math.ceil(pagination.total / pagination.pageSize)"
          class="btn btn-sm"
        >
          末页 ⏭️
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../utils/api'

const loading = ref(false)
const logs = ref([])

const filterForm = reactive({
  username: '',
  room: '',
  type: '',
  startDate: '',
  endDate: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0
})

const getMessageTypeText = (type) => {
  const map = { normal: '普通', system: '系统', private: '私聊' }
  return map[type] || type
}

const loadLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      username: filterForm.username,
      room: filterForm.room,
      type: filterForm.type,
      start_date: filterForm.startDate,
      end_date: filterForm.endDate
    }
    const res = await api.get('/admin/chat-logs', { params })
    if (res.success || res.data?.success) {
      const data = res.data?.data || res.data || {}
      logs.value = data.logs || []
      pagination.total = data.total || 0
    }
  } catch (error) {
    alert('加载聊天记录失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  Object.assign(filterForm, {
    username: '',
    room: '',
    type: '',
    startDate: '',
    endDate: ''
  })
  pagination.page = 1
  loadLogs()
}

const deleteMessage = async (row) => {
  if (!confirm(`确定要删除这条消息吗？`)) return
  try {
    await api.delete(`/admin/chat-logs/${row.id}`)
    alert('删除成功')
    loadLogs()
  } catch (error) {
    alert('删除失败')
  }
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.chat-logs-management { padding: 20px; }
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 16px; border-left: 3px solid #f39c12; padding-left: 10px; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.filter-bar { background: rgba(255,255,255,0.02); border-radius: 6px; padding: 12px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.05); }
.filter-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.form-input { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; }
.form-select { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; }
.btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #555; color: #fff; transition: all 0.3s; font-size: 13px; }
.btn:hover:not(:disabled) { opacity: 0.8; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: #f39c12; }
.btn-danger { background: #e74c3c; }
.btn-sm { padding: 4px 8px; font-size: 12px; }
.table-container { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
.data-table th { color: #f39c12; font-weight: 600; font-size: 14px; white-space: nowrap; background: rgba(243, 156, 18, 0.1); }
.data-table td { font-size: 13px; }
.data-table tr:hover { background: rgba(255,255,255,0.02); }
.type-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
.type-normal { background: #3498db; color: #fff; }
.type-system { background: #f39c12; color: #fff; }
.type-private { background: #e74c3c; color: #fff; }
.message-content { color: #e0e0e0; word-break: break-word; }
.empty-text { text-align: center; color: #888; padding: 40px 20px; }
.pagination-bar { display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); }
</style>
