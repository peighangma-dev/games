<template>
  <div class="secret-skills-page">
    <div class="page-header">
        <h1 class="page-title">
          <el-icon><Document /></el-icon>
          武功秘籍
        </h1>
      <div class="page-actions">
        <el-button @click="toggleView" :icon="viewMode === 'table' ? 'Grid' : 'List'">
          {{ viewMode === 'table' ? '卡片视图' : '列表视图' }}
        </el-button>
        <el-button 
          v-if="selectedSkills.length > 0" 
          type="danger" 
          @click="batchDelete"
          :icon="Delete"
        >
          批量删除 ({{ selectedSkills.length }})
        </el-button>
        <el-button type="primary" @click="showCreateDialog" :icon="Plus">
          创建秘籍
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card class="stat-card stat-total">
          <div class="stat-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">秘籍总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-grade-a">
          <div class="stat-icon">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.gradeA }}</div>
            <div class="stat-label">甲级秘籍</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-grade-b">
          <div class="stat-icon">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.gradeB }}</div>
            <div class="stat-label">乙级秘籍</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-grade-c">
          <div class="stat-icon">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.gradeC }}</div>
            <div class="stat-label">丙级秘籍</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和筛选 -->
    <el-card class="filter-card mb-4">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="秘籍名称">
          <el-input v-model="filterForm.name" placeholder="搜索秘籍名称" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="秘籍等级">
          <el-select v-model="filterForm.grade" placeholder="全部等级" clearable style="width: 120px">
            <el-option label="甲级" value="甲" />
            <el-option label="乙级" value="乙" />
            <el-option label="丙级" value="丙" />
          </el-select>
        </el-form-item>
        <el-form-item label="门派">
          <el-select v-model="filterForm.sect" placeholder="全部门派" clearable style="width: 120px">
            <el-option label="逍遥派" value="逍遥派" />
            <el-option label="少林派" value="少林派" />
            <el-option label="武当派" value="武当派" />
            <el-option label="峨眉派" value="峨眉派" />
            <el-option label="华山派" value="华山派" />
            <el-option label="古墓派" value="古墓派" />
            <el-option label="丐帮" value="丐帮" />
            <el-option label="明教" value="明教" />
            <el-option label="通用" value="通用" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filterForm.type" placeholder="全部类型" clearable style="width: 120px">
            <el-option label="内功" value="内功" />
            <el-option label="外功" value="外功" />
            <el-option label="轻功" value="轻功" />
            <el-option label="剑法" value="剑法" />
            <el-option label="刀法" value="刀法" />
            <el-option label="拳法" value="拳法" />
            <el-option label="指法" value="指法" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadSkills" :icon="Search">
            搜索
          </el-button>
          <el-button @click="resetFilter" :icon="Refresh">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 批量操作提示 -->
    <el-alert
      v-if="selectedSkills.length > 0"
      title=""
      type="info"
      :closable="true"
      class="mb-4"
      show-icon
    >
      <template #default>
        已选择 <strong>{{ selectedSkills.length }}</strong> 个秘籍
        <el-button type="danger" size="small" @click="batchDelete" style="margin-left: 12px">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </template>
    </el-alert>

    <!-- 秘籍列表 -->
    <el-card>
      <el-table 
        v-if="viewMode === 'table'"
        :data="skills" 
        v-loading="loading"
        style="width: 100%"
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="秘籍名称" width="200">
          <template #default="{ row }">
            <span class="skill-name">
              <el-icon :size="16"><Document /></el-icon>
              {{ row.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="等级" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="row.grade === '甲' ? 'danger' : row.grade === '乙' ? 'warning' : 'info'"
              effect="dark"
              size="large"
            >
              {{ row.grade }}级
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sect" label="门派" width="120">
          <template #default="{ row }">
            <span class="sect-tag">{{ row.sect }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="getTypeColor(row.type)" effect="plain">
              <el-icon :size="14"><Trophy /></el-icon>
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="effect" label="效果" min-width="200" show-overflow-tooltip />
        <el-table-column prop="require_level" label="修炼等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.require_level }} 级</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="120" align="right">
          <template #default="{ row }">
            <span class="price-text">
              <el-icon><Coin /></el-icon>
              {{ row.price }} 银
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="showEditDialog(row)" :icon="Edit">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="deleteSkill(row)" :icon="Delete">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 卡片视图 -->
      <div v-else class="card-view">
        <el-empty v-if="skills.length === 0" description="暂无秘籍数据" />
        <div v-else class="cards-grid">
          <el-card 
            v-for="skill in skills" 
            :key="skill.id" 
            class="skill-card"
            shadow="hover"
          >
            <div class="card-header">
              <span class="card-title">{{ skill.name }}</span>
              <el-tag 
                :type="skill.grade === '甲' ? 'danger' : skill.grade === '乙' ? 'warning' : 'info'"
                effect="dark"
                size="small"
              >
                {{ skill.grade }}级
              </el-tag>
            </div>
            <div class="card-body">
              <div class="card-row">
                <span class="card-label"><el-icon><User /></el-icon> 门派</span>
                <span class="card-value">{{ skill.sect }}</span>
              </div>
              <div class="card-row">
                <span class="card-label"><el-icon><Trophy /></el-icon> 类型</span>
                <el-tag size="small" :type="getTypeColor(skill.type)">{{ skill.type }}</el-tag>
              </div>
              <div class="card-row">
                <span class="card-label"><el-icon><Reading /></el-icon> 修炼等级</span>
                <span class="card-value">{{ skill.require_level }} 级</span>
              </div>
              <div class="card-row">
                <span class="card-label"><el-icon><Coin /></el-icon> 价格</span>
                <span class="card-value price-text">{{ skill.price }} 银</span>
              </div>
              <div class="card-effect">
                <span class="card-label"><el-icon><Notebook /></el-icon> 效果</span>
                <p class="effect-text">{{ skill.effect }}</p>
              </div>
            </div>
            <div class="card-footer">
              <el-button size="small" @click="showEditDialog(skill)" :icon="Edit">
                编辑
              </el-button>
              <el-button size="small" type="danger" @click="deleteSkill(skill)" :icon="Delete">
                删除
              </el-button>
            </div>
          </el-card>
        </div>
      </div>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadSkills"
          @current-change="loadSkills"
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑秘籍' : '创建秘籍'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="秘籍名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：北冥神功" />
        </el-form-item>
        <el-form-item label="秘籍等级" prop="grade">
          <el-radio-group v-model="form.grade">
            <el-radio value="甲">甲级</el-radio>
            <el-radio value="乙">乙级</el-radio>
            <el-radio value="丙">丙级</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="门派" prop="sect">
          <el-select v-model="form.sect" placeholder="选择门派">
            <el-option label="逍遥派" value="逍遥派" />
            <el-option label="少林派" value="少林派" />
            <el-option label="武当派" value="武当派" />
            <el-option label="峨眉派" value="峨眉派" />
            <el-option label="华山派" value="华山派" />
            <el-option label="古墓派" value="古墓派" />
            <el-option label="丐帮" value="丐帮" />
            <el-option label="明教" value="明教" />
            <el-option label="通用" value="通用" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio value="内功">内功</el-radio>
            <el-radio value="外功">外功</el-radio>
            <el-radio value="轻功">轻功</el-radio>
            <el-radio value="剑法">剑法</el-radio>
            <el-radio value="刀法">刀法</el-radio>
            <el-radio value="拳法">拳法</el-radio>
            <el-radio value="指法">指法</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="效果" prop="effect">
          <el-input v-model="form.effect" type="textarea" :rows="3" placeholder="描述武功效果" />
        </el-form-item>
        <el-form-item label="修炼等级" prop="require_level">
          <el-input-number v-model="form.require_level" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :min="0" :step="100" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Document, Plus, Search, Refresh, Delete, Edit, Star, Trophy, Reading, Notebook, Coin, User, Grid, List 
} from '@element-plus/icons-vue'
import api from '../../utils/api'

const loading = ref(false)
const submitting = ref(false)
const skills = ref([])
const stats = ref({ total: 0, gradeA: 0, gradeB: 0, gradeC: 0 })
const viewMode = ref('table') // 'table' or 'card'
const selectedSkills = ref([])

const filterForm = reactive({
  name: '',
  grade: '',
  sect: '',
  type: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  name: '',
  grade: '丙',
  sect: '通用',
  type: '内功',
  effect: '',
  require_level: 1,
  price: 1000
})

const rules = {
  name: [{ required: true, message: '请输入秘籍名称', trigger: 'blur' }],
  grade: [{ required: true, message: '请选择秘籍等级', trigger: 'change' }],
  sect: [{ required: true, message: '请选择门派', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  effect: [{ required: true, message: '请输入效果', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }]
}

const loadSkills = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.pageSize,
      ...filterForm
    }
    const res = await api.get('/admin/secret-skills', { params })
    if (res.success) {
      skills.value = res.data || []
      pagination.total = res.pagination?.total || skills.value.length
    }
  } catch (error) {
    ElMessage.error('加载秘籍列表失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await api.get('/admin/secret-skills/stats')
    if (res.success) {
      stats.value = res.data || { total: 0, gradeA: 0, gradeB: 0, gradeC: 0 }
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const showCreateDialog = () => {
  Object.assign(form, {
    id: null,
    name: '',
    grade: '丙',
    sect: '通用',
    type: '内功',
    effect: '',
    require_level: 1,
    price: 1000
  })
  isEdit.value = false
  dialogVisible.value = true
}

const showEditDialog = (row) => {
  Object.assign(form, {
    id: row.id,
    name: row.name,
    grade: row.grade,
    sect: row.sect,
    type: row.type,
    effect: row.effect,
    require_level: row.require_level || 1,
    price: row.price
  })
  isEdit.value = true
  dialogVisible.value = true
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      await api.put(`/admin/secret-skills/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await api.post('/admin/secret-skills', form)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadSkills()
    loadStats()
  } catch (error) {
    if (error.message !== 'cancel') {
      ElMessage.error('操作失败：' + error.message)
    }
  } finally {
    submitting.value = false
  }
}

const deleteSkill = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除秘籍"${row.name}"吗？`, '提示', {
      type: 'warning'
    })
    
    await api.delete(`/admin/secret-skills/${row.id}`)
    ElMessage.success('删除成功')
    loadSkills()
    loadStats()
  } catch (error) {
    if (error.message !== 'cancel') {
      ElMessage.error('删除失败：' + error.message)
    }
  }
}

const resetFilter = () => {
  Object.assign(filterForm, {
    name: '',
    grade: '',
    sect: '',
    type: ''
  })
  pagination.page = 1
  loadSkills()
}

const toggleView = () => {
  viewMode.value = viewMode.value === 'table' ? 'card' : 'table'
}

const handleSelectionChange = (selection) => {
  selectedSkills.value = selection
}

const getTypeColor = (type) => {
  const colors = {
    '内功': 'primary',
    '外功': 'success',
    '轻功': 'warning',
    '剑法': 'danger',
    '刀法': 'info',
    '拳法': '',
    '指法': ''
  }
  return colors[type] || ''
}

const batchDelete = async () => {
  if (selectedSkills.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedSkills.value.length} 个秘籍吗？此操作不可恢复！`,
      '高危操作',
      {
        type: 'error',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    )
    
    const deletePromises = selectedSkills.value.map(skill => 
      api.delete(`/admin/secret-skills/${skill.id}`)
    )
    
    await Promise.all(deletePromises)
    ElMessage.success(`成功删除 ${selectedSkills.value.length} 个秘籍`)
    selectedSkills.value = []
    loadSkills()
    loadStats()
  } catch (error) {
    if (error.message !== 'cancel') {
      ElMessage.error('批量删除失败：' + error.message)
    }
  }
}

onMounted(() => {
  loadSkills()
  loadStats()
})
</script>

<style scoped>
.secret-skills-page {
  padding: 0;
}

.mb-4 {
  margin-bottom: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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

/* 统计卡片样式 */
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-total .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.stat-grade-a .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.stat-grade-b .stat-icon {
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  color: #fff;
}

.stat-grade-c .stat-icon {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  color: #fff;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
  line-height: 1;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 14px;
  color: #a0a0a0;
}

.filter-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
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

.price-text {
  color: #ffd700;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
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

/* 卡片视图样式 */
.card-view {
  padding: 10px 0;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.skill-card {
  transition: all 0.3s ease;
  cursor: pointer;
}

.skill-card:hover {
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-body {
  padding: 16px 0;
}

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  gap: 12px;
}

.card-label {
  color: #a0a0a0;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-value {
  color: #e0e0e0;
  font-size: 14px;
  font-weight: 500;
}

.card-effect {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.effect-text {
  color: #b0b0b0;
  font-size: 13px;
  line-height: 1.6;
  margin: 8px 0 0 0;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 表格增强样式 */
.skill-name {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409EFF;
  font-weight: 500;
}

.sect-tag {
  color: #e0e0e0;
  font-weight: 500;
}
</style>
