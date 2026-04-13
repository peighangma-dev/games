<template>
  <div>
    <h3 class="section-title">公告管理</h3>
    <div class="card">
      <div class="form-group">
        <label>公告内容</label>
        <textarea v-model="content" rows="4"></textarea>
      </div>
      <button class="btn btn-primary" @click="publish">发布公告</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../../utils/api'

const content = ref('')

async function publish() {
  if (!content.value.trim()) return
  try {
    const res = await api.post('/commands/bulletin', { args: { message: content.value } })
    if (res.success) {
      content.value = ''
      alert('公告已发布')
    } else {
      alert(res.message || '发布失败')
    }
  } catch (e) {
    alert('发布失败')
  }
}
</script>

<style scoped>
.section-title { color: #7eb8da; font-size: 16px; margin-bottom: 12px; border-left: 3px solid #4B87C3; padding-left: 10px; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; margin-bottom: 4px; color: #aaa; font-size: 13px; }
</style>
