<template>
  <div class="ip-management">
    <h3 class="section-title">IP 管理</h3>
    
    <div class="card">
      <!-- IP 临时封锁 -->
      <div class="section-block" v-if="currentUser.grade >= 8">
        <h4 class="subsection-title">IP 临时封锁</h4>
        <div class="form-row">
          <input v-model="tempIp" type="text" placeholder="IP 地址" class="form-input" />
          <select v-model.number="tempHours" class="form-select">
            <option :value="1">1 小时</option>
            <option :value="6">6 小时</option>
            <option :value="12">12 小时</option>
            <option :value="24">24 小时</option>
            <option :value="72">3 天</option>
          </select>
          <button @click="createTempLock" class="btn btn-warning">临时封锁</button>
        </div>
        
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>IP 地址</th>
                <th>封锁时间</th>
                <th>操作者</th>
                <th>到期时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="lock in tempLocks" :key="lock.id">
                <td><code>{{ lock.ip }}</code></td>
                <td>{{ formatDate(lock.locked_at) }}</td>
                <td>{{ lock.locked_by }}</td>
                <td>{{ formatDate(lock.expires_at) }}</td>
                <td>
                  <button @click="deleteTempLock(lock.id)" class="btn btn-sm btn-danger">解封</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="tempLocks.length === 0" class="empty-text">暂无临时封锁</div>
      </div>

      <!-- IP 永久封锁 -->
      <div class="section-block" v-if="currentUser.grade >= 10">
        <h4 class="subsection-title">IP 永久封锁</h4>
        <div class="form-row">
          <input v-model="permIp" type="text" placeholder="IP 地址或通配符 (如 10.%)" class="form-input" />
          <button @click="createPermBan" class="btn btn-danger">永久封锁</button>
        </div>
        
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>IP 通配符</th>
                <th>添加时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ban in permBans" :key="ban.id">
                <td><code>{{ ban.ip_pattern || ban.ip || '-' }}</code></td>
                <td>{{ formatDate(ban.created_at || ban.locked_at) }}</td>
                <td>
                  <button @click="deletePermBan(ban.id)" class="btn btn-sm btn-danger">解封</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="permBans.length === 0" class="empty-text">暂无永久封锁</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../utils/api'

const tempLocks = ref([])
const permBans = ref([])
const tempIp = ref('')
const tempHours = ref(24)
const permIp = ref('')
const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

async function loadIps() {
  try {
    if (currentUser.grade >= 8) {
      const res = await api.get('/admin/ip-locks')
      if (res.success) {
        tempLocks.value = res.data?.locks || []
      }
    }
    if (currentUser.grade >= 10) {
      const res = await api.get('/admin/ip-bans')
      if (res.success) {
        // ip-bans 返回的也是 locks 字段，但字段名是 ip_pattern 和 created_at
        permBans.value = res.data?.bans || res.data?.locks || []
      }
    }
  } catch (e) {
    console.error('加载 IP 列表失败:', e)
    alert('加载失败：' + (e.message || '未知错误'))
  }
}

async function createTempLock() {
  if (!tempIp.value) {
    alert('请输入 IP 地址')
    return
  }
  try {
    // 计算过期时间（当前时间 + 小时数）
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + parseInt(tempHours.value || 24))
    
    // 转换为 MySQL 兼容的日期格式：YYYY-MM-DD HH:MM:SS
    const mysqlDate = expiresAt.toISOString().slice(0, 19).replace('T', ' ')
    
    const res = await api.post('/admin/ip-locks', { 
      ip: tempIp.value, 
      expires_at: mysqlDate
    })
    if (res.success) {
      alert('IP 已临时封锁')
      tempIp.value = ''
      loadIps()
    }
  } catch (e) {
    alert('封锁失败：' + (e.message || '未知错误'))
  }
}

async function deleteTempLock(id) {
  if (!confirm('确定要解封该 IP 吗？')) return
  try {
    const res = await api.delete(`/admin/ip-locks/${id}`)
    if (res.success) {
      alert('IP 已解封')
      loadIps()
    }
  } catch (e) {
    alert('解封失败：' + (e.message || '未知错误'))
  }
}

async function createPermBan() {
  if (!permIp.value) {
    alert('请输入 IP 地址或通配符')
    return
  }
  try {
    const res = await api.post('/admin/ip-bans', { ip_pattern: permIp.value })
    if (res.success) {
      alert('IP 已永久封锁')
      permIp.value = ''
      loadIps()
    }
  } catch (e) {
    alert('封锁失败：' + (e.message || '未知错误'))
  }
}

async function deletePermBan(id) {
  if (!confirm('确定要解封该 IP 吗？')) return
  try {
    const res = await api.delete(`/admin/ip-bans/${id}`)
    if (res.success) {
      alert('IP 已解封')
      loadIps()
    }
  } catch (e) {
    alert('解封失败：' + (e.message || '未知错误'))
  }
}

onMounted(() => loadIps())
</script>

<style scoped>
.ip-management { padding: 20px; }
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 16px; border-left: 3px solid #4B87C3; padding-left: 10px; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.section-block { margin-bottom: 30px; padding-bottom: 30px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.section-block:last-child { border-bottom: none; }
.subsection-title { color: #7eb8da; font-size: 14px; margin-bottom: 12px; }
.form-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; align-items: center; }
.form-input { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; min-width: 200px; }
.form-select { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; }
.btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #555; color: #fff; transition: all 0.3s; }
.btn:hover { opacity: 0.8; }
.btn-warning { background: #f39c12; }
.btn-danger { background: #e74c3c; }
.btn-sm { padding: 4px 8px; font-size: 12px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
.data-table th { color: #7eb8da; font-weight: 600; font-size: 14px; }
.data-table td { font-size: 13px; }
.data-table code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; font-family: monospace; color: #f39c12; }
.empty-text { text-align: center; color: #888; padding: 20px; }
</style>
