<template>
  <div>
    <h3 class="section-title">用户管理</h3>
    <div class="card">
      <div v-for="u in users" :key="u.id" class="user-row">
        <span class="user-name">{{ u.username }}</span>
        <span class="user-grade">等级{{ u.grade }}</span>
        <span class="user-sect">{{ u.sect }}</span>
        <span :class="['user-status', u.status]">{{ u.status }}</span>
      </div>
      <div v-if="users.length === 0" class="empty-text">暂无用户</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../utils/api'

const users = ref([])

async function loadUsers() {
  try {
    const res = await api.get('/users/members')
    if (res.success) users.value = res.data || []
  } catch (e) {}
}

onMounted(() => loadUsers())
</script>

<style scoped>
.section-title { color: #7eb8da; font-size: 16px; margin-bottom: 12px; border-left: 3px solid #4B87C3; padding-left: 10px; }
.user-row { display: flex; gap: 12px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center; }
.user-name { color: #7eb8da; min-width: 80px; }
.user-grade { color: #f0c040; font-size: 13px; }
.user-sect { color: #aaa; font-size: 13px; }
.user-status { font-size: 12px; padding: 1px 6px; border-radius: 3px; background: rgba(74,124,89,0.2); color: #8fc9a0; }
.user-status.dead { background: rgba(231,76,60,0.2); color: #e74c3c; }
.user-status.jailed { background: rgba(230,126,34,0.2); color: #e67e22; }
.empty-text { text-align: center; color: #666; padding: 20px; }
</style>
