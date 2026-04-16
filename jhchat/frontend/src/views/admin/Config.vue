<template>
  <div>
    <h3 class="section-title">系统配置管理</h3>
    <div class="card">
      <div class="config-grid">
        <div class="config-section" v-for="(items, section) in groupedConfigs" :key="section">
          <h4 class="config-section-title">{{ section }}</h4>
          <div v-for="config in items" :key="config.name" class="config-item">
            <div class="config-label">
              <span class="config-name">{{ config.name }}</span>
              <span class="config-desc">{{ config.description }}</span>
            </div>
            <div class="config-input-wrapper">
              <input 
                v-model="config.value" 
                type="text" 
                class="config-input"
                :placeholder="config.description"
              />
              <button @click="saveConfig(config)" class="btn btn-save">保存</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../utils/api'

const configs = ref([])

const groupedConfigs = computed(() => {
  const groups = {}
  configs.value.forEach(config => {
    let section = '其他配置'
    const name = config.name.toLowerCase()
    if (name.includes('chat') || name.includes('room')) section = '聊天室配置'
    else if (name.includes('level') || name.includes('exp')) section = '等级经验配置'
    else if (name.includes('max') || name.includes('timeout')) section = '系统限制'
    else if (name.includes('dis') || name.includes('closed') || name.includes('allow')) section = '开关控制'
    else if (name.includes('user') || name.includes('admin')) section = '用户管理'
    else if (name.includes('poll')) section = '投票配置'
    else if (name.includes('bg') || name.includes('color') || name.includes('image')) section = '外观配置'
    groups[section] = groups[section] || []
    groups[section].push(config)
  })
  return groups
})

async function loadConfigs() {
  try {
    const res = await api.get('/admin/config')
    if (res.success) {
      configs.value = res.data || []
    }
  } catch (e) {
    alert('加载配置失败：' + (e.message || '未知错误'))
  }
}

async function saveConfig(config) {
  try {
    const res = await api.put(`/admin/config/${config.name}`, { value: config.value })
    if (res.success) {
      alert(`${config.name} 已更新`)
    }
  } catch (e) {
    alert('保存失败：' + (e.message || '未知错误'))
  }
}

onMounted(() => loadConfigs())
</script>

<style scoped>
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 16px; border-left: 3px solid #4B87C3; padding-left: 10px; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.config-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
.config-section { background: rgba(255,255,255,0.05); padding: 12px; border-radius: 6px; }
.config-section-title { color: #7eb8da; font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; }
.config-item { margin-bottom: 12px; }
.config-label { display: flex; justify-content: space-between; margin-bottom: 6px; }
.config-name { color: #fff; font-weight: 600; font-size: 13px; }
.config-desc { color: #888; font-size: 11px; margin-left: 8px; }
.config-input-wrapper { display: flex; gap: 8px; }
.config-input { flex: 1; padding: 6px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; font-size: 12px; }
.btn-save { padding: 6px 12px; background: #4B87C3; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; transition: all 0.3s; }
.btn-save:hover { background: #3a75b0; }
</style>
