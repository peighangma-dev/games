<template>
  <div class="pets-page">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><Star /></el-icon>
        宠物管理
      </h1>
    </div>

    <el-card>
      <el-table :data="pets" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="宠物名称" width="200" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="rarity" label="稀有度" width="100">
          <template #default="{ row }">
            <el-tag :type="row.rarity === 'legendary' ? 'danger' : row.rarity === 'epic' ? 'warning' : 'info'">
              {{ rarityText(row.rarity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="skill" label="技能" width="200" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editPet(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deletePet(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Star } from '@element-plus/icons-vue'
import api from '../../utils/api'

const loading = ref(false)
const pets = ref([])

const rarityText = (rarity) => {
  const map = { legendary: '传说', epic: '史诗', rare: '稀有', common: '普通' }
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
    ElMessage.error('加载宠物列表失败')
  } finally {
    loading.value = false
  }
}

const editPet = (row) => {
  ElMessage.info('编辑功能开发中')
}

const deletePet = async (row) => {
  try {
    await api.delete(`/admin/pets/${row.id}`)
    ElMessage.success('删除成功')
    loadPets()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadPets()
})
</script>

<style scoped>
.pets-page {
  padding: 0;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  color: #fff;
  margin: 0;
}

.page-title .el-icon {
  font-size: 28px;
  color: #409EFF;
}

:deep(.el-card) {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

:deep(.el-card__header) {
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #fff;
}

:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-header-bg-color: rgba(255, 255, 255, 0.05);
  --el-table-text-color: #e0e0e0;
  --el-table-header-text-color: #a0a0a0;
  --el-table-border-color: rgba(255, 255, 255, 0.05);
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.05);
}
</style>
