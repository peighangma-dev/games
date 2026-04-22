<template>
  <div class="pets-management">
    <h3 class="section-title">🐾 宠物管理</h3>
    
    <div class="card">
      <!-- 宠物列表 -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 60px;">ID</th>
              <th>宠物名称</th>
              <th style="width: 120px;">类型</th>
              <th style="width: 100px;">稀有度</th>
              <th>技能</th>
              <th style="width: 150px;">属性加成</th>
              <th style="width: 180px;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pet in pets" :key="pet.id">
              <td>{{ pet.id }}</td>
              <td><strong>{{ pet.name }}</strong></td>
              <td>{{ pet.type }}</td>
              <td>
                <span :class="['rarity-badge', 'rarity-'+pet.rarity]">
                  {{ getRarityName(pet.rarity) }}
                </span>
              </td>
              <td>{{ pet.skill }}</td>
              <td>
                <span v-if="pet.bonus_stat" class="bonus-text">
                  {{ pet.bonus_stat }}: +{{ pet.bonus_value || 0 }}
                </span>
                <span v-else style="color: #888;">-</span>
              </td>
              <td>
                <button @click="editPet(pet)" class="btn btn-sm btn-warning" title="编辑">✏️</button>
                <button @click="deletePet(pet)" class="btn btn-sm btn-danger" title="删除">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pets.length === 0" class="empty-text">暂无宠物数据</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../utils/api'

const loading = ref(false)
const pets = ref([])

const getRarityName = (rarity) => {
  const map = { 
    legendary: '传说 🟥', 
    epic: '史诗 🟧', 
    rare: '稀有 🟦', 
    common: '普通 ⬜' 
  }
  return map[rarity] || rarity
}

const loadPets = async () => {
  loading.value = true
  try {
    const res = await api.get('/admin/pets')
    if (res.data.success) {
      pets.value = res.data.data || []
    }
  } catch (error) {
    alert('加载宠物列表失败')
  } finally {
    loading.value = false
  }
}

const editPet = (row) => {
  alert('编辑功能开发中')
}

const deletePet = async (row) => {
  if (!confirm(`确定要删除宠物"${row.name}"吗？`)) return
  try {
    await api.delete(`/admin/pets/${row.id}`)
    alert('删除成功')
    loadPets()
  } catch (error) {
    alert('删除失败')
  }
}

onMounted(() => {
  loadPets()
})
</script>

<style scoped>
.pets-management { padding: 20px; }
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 16px; border-left: 3px solid #f39c12; padding-left: 10px; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.table-container { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
.data-table th { color: #f39c12; font-weight: 600; font-size: 14px; white-space: nowrap; background: rgba(243, 156, 18, 0.1); }
.data-table td { font-size: 13px; }
.data-table tr:hover { background: rgba(255,255,255,0.02); }
.rarity-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
.rarity-legendary { background: #e74c3c; color: #fff; }
.rarity-epic { background: #e67e22; color: #fff; }
.rarity-rare { background: #3498db; color: #fff; }
.rarity-common { background: #7f8c8d; color: #fff; }
.bonus-text { color: #27ae60; font-weight: 500; }
.btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #555; color: #fff; transition: all 0.3s; font-size: 13px; }
.btn:hover { opacity: 0.8; }
.btn-primary { background: #f39c12; }
.btn-warning { background: #e67e22; }
.btn-success { background: #27ae60; }
.btn-info { background: #2980b9; }
.btn-danger { background: #e74c3c; }
.btn-sm { padding: 4px 8px; font-size: 12px; }
.empty-text { text-align: center; color: #888; padding: 40px 20px; }
</style>
