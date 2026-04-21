<template>
  <div class="quests-page">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><Collection /></el-icon>
        任务管理
      </h1>
      <div class="page-actions">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          创建任务
        </el-button>
      </div>
    </div>

    <!-- 任务列表 -->
    <el-card>
      <el-table :data="quests" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="任务名称" width="200" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.type === 'daily' ? 'success' : 'primary'">
              {{ row.type === 'daily' ? '每日任务' : '主线任务' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="任务描述" min-width="250" show-overflow-tooltip />
        <el-table-column prop="reward_silver" label="银两奖励" width="100" align="right">
          <template #default="{ row }">
            <span class="price-text">{{ row.reward_silver }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reward_exp" label="经验奖励" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.active"
              @change="toggleQuestStatus(row)"
              active-color="#67c23a"
              inactive-color="#f56c6c"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="showEditDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteQuest(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑任务' : '创建任务'" width="700px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：拜师学艺" />
        </el-form-item>
        <el-form-item label="任务类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio value="main">主线任务</el-radio>
            <el-radio value="daily">每日任务</el-radio>
            <el-radio value="branch">支线任务</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="前置任务" prop="prerequisite">
          <el-input v-model="form.prerequisite" placeholder="前置任务 ID（可选）" />
        </el-form-item>
        <el-form-item label="目标类型" prop="objective_type">
          <el-select v-model="form.objective_type">
            <el-option label="聊天" value="chat" />
            <el-option label="战斗" value="combat" />
            <el-option label="收集" value="collect" />
            <el-option label="探索" value="explore" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标数量" prop="objective_count">
          <el-input-number v-model="form.objective_count" :min="1" />
        </el-form-item>
        <el-form-item label="银两奖励" prop="reward_silver">
          <el-input-number v-model="form.reward_silver" :min="0" :step="100" />
        </el-form-item>
        <el-form-item label="经验奖励" prop="reward_exp">
          <el-input-number v-model="form.reward_exp" :min="0" :step="100" />
        </el-form-item>
        <el-form-item label="物品奖励" prop="reward_items">
          <el-input v-model="form.reward_items" placeholder="JSON 格式：[{item_id: 1, quantity: 10}]" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Collection, Plus } from '@element-plus/icons-vue'
import api from '../../utils/api'

const loading = ref(false)
const submitting = ref(false)
const quests = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  name: '',
  type: 'daily',
  description: '',
  prerequisite: '',
  objective_type: 'chat',
  objective_count: 1,
  reward_silver: 500,
  reward_exp: 100,
  reward_items: ''
})

const rules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
  description: [{ required: true, message: '请输入任务描述', trigger: 'blur' }]
}

const loadQuests = async () => {
  loading.value = true
  try {
    const res = await api.get('/admin/quests')
    if (res.success) {
      quests.value = res.data || []
    }
  } catch (error) {
    ElMessage.error('加载任务列表失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const showCreateDialog = () => {
  Object.assign(form, {
    id: null,
    name: '',
    type: 'daily',
    description: '',
    prerequisite: '',
    objective_type: 'chat',
    objective_count: 1,
    reward_silver: 500,
    reward_exp: 100,
    reward_items: ''
  })
  isEdit.value = false
  dialogVisible.value = true
}

const showEditDialog = (row) => {
  Object.assign(form, row)
  isEdit.value = true
  dialogVisible.value = true
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      await api.put(`/admin/quests/${form.id}`, form)
    } else {
      await api.post('/admin/quests', form)
    }
    
    dialogVisible.value = false
    loadQuests()
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
  } catch (error) {
    if (error.message !== 'cancel') {
      ElMessage.error('操作失败：' + error.message)
    }
  } finally {
    submitting.value = false
  }
}

const toggleQuestStatus = async (row) => {
  try {
    await api.put(`/admin/quests/${row.id}`, { active: row.active })
    ElMessage.success('状态已更新')
  } catch (error) {
    row.active = !row.active
    ElMessage.error('更新失败：' + error.message)
  }
}

const deleteQuest = async (row) => {
  try {
    await api.delete(`/admin/quests/${row.id}`)
    ElMessage.success('删除成功')
    loadQuests()
  } catch (error) {
    ElMessage.error('删除失败：' + error.message)
  }
}

onMounted(() => {
  loadQuests()
})
</script>

<style scoped>
.quests-page {
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

.price-text {
  color: #ffd700;
  font-weight: 500;
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

:deep(.el-dialog) {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-dialog__title) {
  color: #fff;
}

:deep(.el-form-item__label) {
  color: #e0e0e0;
}
</style>
