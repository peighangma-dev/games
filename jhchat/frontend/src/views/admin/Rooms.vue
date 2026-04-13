<template>
  <div>
    <h3 class="section-title">房间管理</h3>
    <div class="card">
      <div v-for="r in rooms" :key="r.id" class="room-row">
        <span class="room-id">#{{ r.id }}</span>
        <span class="room-name">{{ r.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../utils/api'

const rooms = ref([])

async function loadRooms() {
  try {
    const res = await api.get('/chat/rooms')
    if (res.success) rooms.value = res.data || []
  } catch (e) {}
}

onMounted(() => loadRooms())
</script>

<style scoped>
.section-title { color: #7eb8da; font-size: 16px; margin-bottom: 12px; border-left: 3px solid #4B87C3; padding-left: 10px; }
.room-row { display: flex; gap: 12px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.room-id { color: #888; font-size: 13px; }
.room-name { color: #7eb8da; }
</style>
