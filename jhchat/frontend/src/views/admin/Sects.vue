<template>
  <div class="sects-page">
    <div class="page-header">
      <h3 class="section-title">⚔️ 门派管理</h3>
      <button @click="showCreateDialog = true" class="btn btn-primary">+ 创建门派</button>
    </div>

    <!-- 统计信息 -->
    <div class="stats-bar" v-if="sectStats.total_sects">
      <span class="stat-item">门派总数：<strong>{{ sectStats.total_sects }}</strong></span>
      <span class="stat-item">总成员数：<strong>{{ sectStats.total_members || 0 }}</strong></span>
      <span class="stat-item">待审批申请：<strong>{{ sectStats.pending_applications || 0 }}</strong></span>
    </div>

    <!-- 门派列表 -->
    <div class="sects-grid">
      <div v-for="sect in sects" :key="sect.id" class="sect-card">
        <div class="sect-header">
          <div class="sect-title-row">
            <span class="sect-name">{{ sect.name }}</span>
          </div>
          <span :class="['gender-tag', sect.fit_gender]">
            {{ genderText(sect.fit_gender) }}
          </span>
        </div>
        
        <div class="sect-info">
          <p><strong>掌门：</strong>{{ sect.leader || '暂无' }}</p>
          <p><strong>人数：</strong>{{ sect.actual_member_count || sect.member_count || 0 }} 人</p>
          <p v-if="sect.slogan"><strong>口号：</strong>{{ sect.slogan }}</p>
          <p v-if="sect.description"><strong>简介：</strong>{{ sect.description }}</p>
        </div>

        <div class="sect-stats" v-if="sect.memberStats">
          <div class="mini-stat">
            <span class="label">男:</span>
            <span class="value">{{ sect.memberStats.male_count || 0 }}</span>
          </div>
          <div class="mini-stat">
            <span class="label">女:</span>
            <span class="value">{{ sect.memberStats.female_count || 0 }}</span>
          </div>
          <div class="mini-stat">
            <span class="label">均级:</span>
            <span class="value">{{ sect.memberStats.avg_grade?.toFixed(1) || '0.0' }}</span>
          </div>
        </div>

        <div class="sect-actions">
          <button @click="viewMembers(sect)" class="btn btn-sm btn-info">成员</button>
          <button @click="viewApplications(sect)" class="btn btn-sm btn-warning">审批</button>
          <button @click="editSect(sect)" class="btn btn-sm btn-primary">编辑</button>
          <button @click="deleteSect(sect)" class="btn btn-sm btn-danger">删除</button>
        </div>
      </div>
    </div>

    <div v-if="sects.length === 0" class="empty-text">暂无门派数据</div>

    <!-- 创建/编辑对话框 -->
    <div v-if="dialogVisible" class="modal-overlay" @click="dialogVisible = false">
      <div class="modal" @click.stop>
        <h4>{{ isEditMode ? '编辑门派' : '创建新门派' }}</h4>
        
        <div class="form-group">
          <label>门派名称:</label>
          <input 
            v-model="form.name" 
            type="text" 
            class="form-input" 
            placeholder="请输入门派名称"
            :disabled="isEditMode"
          />
        </div>
        
        <div class="form-group">
          <label>掌门:</label>
          <input v-model="form.leader" type="text" class="form-input" placeholder="请输入掌门名称" />
        </div>
        
        <div class="form-group">
          <label>口号:</label>
          <input v-model="form.slogan" type="text" class="form-input" placeholder="请输入门派口号" />
        </div>
        
        <div class="form-group">
          <label>门规:</label>
          <input v-model="form.rules" type="text" class="form-input" placeholder="请输入门规" />
        </div>
        
        <div class="form-group">
          <label>简介:</label>
          <textarea v-model="form.description" rows="3" class="form-input" placeholder="请输入门派简介"></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group half">
            <label>性别限制:</label>
            <select v-model="form.fit_gender" class="form-input">
              <option value="both">不限</option>
              <option value="male">仅收男弟子</option>
              <option value="female">仅收女弟子</option>
            </select>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="dialogVisible = false" class="btn">取消</button>
          <button @click="submitForm" class="btn btn-primary">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../utils/api'

const router = useRouter()

const loading = ref(false)
const sects = ref([])
const dialogVisible = ref(false)
const showCreateDialog = ref(false)
const editingSect = ref(null)
const sectStats = ref({})

const form = reactive({
  id: null,
  name: '',
  leader: '',
  slogan: '',
  description: '',
  rules: '',
  fit_gender: 'both'
})

const isEditMode = computed(() => !!form.id)

const genderText = (gender) => {
  const map = {
    male: '男',
    female: '女',
    both: '不限'
  }
  return map[gender] || '不限'
}

const loadSects = async () => {
  loading.value = true
  try {
    const res = await api.get('/admin/sects')
    if (res.success) {
      sects.value = res.data || []
    }
    
    // 加载统计信息
    const statsRes = await api.get('/admin/sects/stats')
    if (statsRes.success) {
      sectStats.value = statsRes.data || {}
    }
  } catch (error) {
    alert('加载门派列表失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.id = null
  form.name = ''
  form.leader = ''
  form.slogan = ''
  form.description = ''
  form.rules = ''
  form.fit_gender = 'both'
  editingSect.value = null
}

const showCreate = () => {
  resetForm()
  dialogVisible.value = true
  showCreateDialog.value = false
}

const editSect = (row) => {
  editingSect.value = row
  form.id = row.id
  form.name = row.name
  form.leader = row.leader || ''
  form.slogan = row.slogan || ''
  form.description = row.description || ''
  form.rules = row.rules || ''
  form.fit_gender = row.fit_gender || 'both'
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!form.name) {
    alert('请输入门派名称')
    return
  }

  try {
    let res
    if (form.id) {
      res = await api.put(`/admin/sects/${form.id}`, form)
    } else {
      res = await api.post('/admin/sects', form)
    }
    
    if (res.success) {
      alert(res.message || (form.id ? '门派信息已更新' : '门派创建成功'))
      dialogVisible.value = false
      loadSects()
      resetForm()
    }
  } catch (error) {
    alert((form.id ? '更新' : '创建') + '失败：' + (error.message || '未知错误'))
  }
}

const deleteSect = async (row) => {
  if (!confirm(`确定要删除门派"${row.name}"吗？这将删除所有相关数据且不可恢复！`)) {
    return
  }

  try {
    const res = await api.delete(`/admin/sects/${row.id}`)
    if (res.success) {
      alert(res.message || '门派已删除')
      loadSects()
    }
  } catch (error) {
    alert('删除失败：' + (error.message || '未知错误'))
  }
}

const viewMembers = (row) => {
  router.push(`/admin/sects/${row.id}/members`)
}

const viewApplications = (row) => {
  router.push(`/admin/sects/${row.id}/applications`)
}

onMounted(() => {
  loadSects()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  flex-wrap: wrap;
}

.stat-item {
  color: #ccc;
  font-size: 14px;
}

.stat-item strong {
  color: #4B87C3;
  margin-left: 4px;
  font-size: 16px;
}

.sects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.sect-card {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.sect-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  background: rgba(0, 0, 0, 0.35);
}

.sect-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sect-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sect-name {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.gender-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: rgba(75, 135, 195, 0.3);
  color: #7eb8da;
}

.gender-tag.male {
  background: rgba(64, 158, 255, 0.3);
  color: #409eff;
}

.gender-tag.female {
  background: rgba(246, 194, 172, 0.3);
  color: #f6c2ac;
}

.sect-info {
  margin-bottom: 16px;
}

.sect-info p {
  margin: 6px 0;
  font-size: 13px;
  color: #ccc;
  line-height: 1.4;
}

.sect-info strong {
  color: #7eb8da;
}

.sect-stats {
  display: flex;
  gap: 12px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  margin-bottom: 12px;
}

.mini-stat {
  flex: 1;
  text-align: center;
}

.mini-stat .label {
  display: block;
  font-size: 11px;
  color: #666;
  margin-bottom: 2px;
}

.mini-stat .value {
  display: block;
  font-size: 14px;
  font-weight: bold;
  color: #7eb8da;
}

.sect-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-warning {
  background: #ffc107;
  color: #000;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-info {
  background: #17a2b8;
  color: #fff;
}

.btn-info:hover {
  background: #138496;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 24px;
  width: 100%;
  max-width: 550px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-height: 90vh;
  overflow-y: auto;
}

.modal h4 {
  color: #7eb8da;
  margin-bottom: 20px;
  font-size: 18px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  color: #ccc;
  font-size: 13px;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #4B87C3;
}

textarea.form-input {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-group.half {
  flex: 1;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}

.btn-sm {
  padding: 5px 12px;
  font-size: 13px;
}

.empty-text {
  text-align: center;
  color: #888;
  padding: 60px 20px;
}
</style>
