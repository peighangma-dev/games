<template>
  <div class="sects-page">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><Flag /></el-icon>
        门派管理
      </h1>
    </div>

    <el-row :gutter="20">
      <el-col v-for="sect in sects" :key="sect.id" :span="8">
        <el-card class="sect-card">
          <template #header>
            <div class="sect-header">
              <span class="sect-name">{{ sect.name }}</span>
              <el-tag>{{ sect.fit_gender === 'male' ? '男' : sect.fit_gender === 'female' ? '女' : '不限' }}</el-tag>
            </div>
          </template>
          <div class="sect-info">
            <p><strong>掌门：</strong>{{ sect.leader || '暂无' }}</p>
            <p><strong>人数：</strong>{{ sect.member_count || 0 }} 人</p>
            <p><strong>简介：</strong>{{ sect.description || '-' }}</p>
          </div>
          <div class="sect-actions">
            <el-button size="small" @click="editSect(sect)">编辑</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible" title="编辑门派" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="掌门" prop="leader">
          <el-input v-model="form.leader" placeholder="请输入掌门名称" />
        </el-form-item>
        <el-form-item label="门规" prop="rules">
          <el-input v-model="form.rules" placeholder="请输入门规" />
        </el-form-item>
        <el-form-item label="简介" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="性别限制" prop="fit_gender">
          <el-radio-group v-model="form.fit_gender">
            <el-radio value="male">仅收男弟子</el-radio>
            <el-radio value="female">仅收女弟子</el-radio>
            <el-radio value="both">不限</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Flag } from '@element-plus/icons-vue'
import api from '../../utils/api'

const loading = ref(false)
const sects = ref([])
const dialogVisible = ref(false)
const editingSect = ref(null)
const formRef = ref(null)

const form = reactive({
  id: null,
  leader: '',
  description: '',
  rules: '',
  fit_gender: 'both'
})

const rules = {
  leader: [{ required: true, message: '请输入掌门名称', trigger: 'blur' }]
}

const loadSects = async () => {
  loading.value = true
  try {
    const res = await api.get('/admin/sects')
    if (res.success) {
      sects.value = res.data || []
    }
  } catch (error) {
    ElMessage.error('加载门派列表失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const editSect = (row) => {
  editingSect.value = row
  Object.assign(form, {
    id: row.id,
    leader: row.leader || '',
    description: row.description || '',
    rules: row.rules || '',
    fit_gender: row.fit_gender || 'both'
  })
  dialogVisible.value = true
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    await api.put(`/admin/sects/${form.id}`, form)
    ElMessage.success('更新成功')
    dialogVisible.value = false
    loadSects()
  } catch (error) {
    if (error.message !== 'cancel') {
      ElMessage.error('更新失败：' + (error.message || '未知错误'))
    }
  }
}

onMounted(() => {
  loadSects()
})
</script>

<style scoped>
.sects-page {
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

.sect-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.sect-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sect-name {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.sect-info {
  color: #a0a0a0;
  line-height: 2;
}

.sect-info strong {
  color: #e0e0e0;
}

.sect-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
}

:deep(.el-card__header) {
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
