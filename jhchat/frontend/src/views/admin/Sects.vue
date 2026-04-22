<template>
  <div class="sects-page">
    <h3 class="section-title">⚔️ 门派管理</h3>

    <div class="sects-grid">
      <div v-for="sect in sects" :key="sect.id" class="sect-card">
        <div class="sect-header">
          <span class="sect-name">{{ sect.name }}</span>
          <span :class="['gender-tag', sect.fit_gender]">
            {{ sect.fit_gender === 'male' ? '男' : sect.fit_gender === 'female' ? '女' : '不限' }}
          </span>
        </div>
        <div class="sect-info">
          <p><strong>掌门：</strong>{{ sect.leader || '暂无' }}</p>
          <p><strong>人数：</strong>{{ sect.member_count || 0 }} 人</p>
          <p><strong>简介：</strong>{{ sect.description || '-' }}</p>
        </div>
        <div class="sect-actions">
          <button @click="editSect(sect)" class="btn btn-sm btn-info">编辑</button>
        </div>
      </div>
    </div>

    <div v-if="sects.length === 0" class="empty-text">暂无门派数据</div>

    <!-- 编辑对话框 -->
    <div v-if="dialogVisible" class="modal-overlay" @click="dialogVisible = false">
      <div class="modal" @click.stop>
        <h4>编辑门派：{{ form.name }}</h4>
        <div class="form-group">
          <label>掌门:</label>
          <input v-model="form.leader" type="text" class="form-input" placeholder="请输入掌门名称" />
        </div>
        <div class="form-group">
          <label>门规:</label>
          <input v-model="form.rules" type="text" class="form-input" placeholder="请输入门规" />
        </div>
        <div class="form-group">
          <label>简介:</label>
          <textarea v-model="form.description" rows="3" class="form-input"></textarea>
        </div>
        <div class="form-group">
          <label>性别限制:</label>
          <div class="radio-group">
            <label class="radio-label">
              <input v-model="form.fit_gender" type="radio" value="male" /> 仅收男弟子
            </label>
            <label class="radio-label">
              <input v-model="form.fit_gender" type="radio" value="female" /> 仅收女弟子
            </label>
            <label class="radio-label">
              <input v-model="form.fit_gender" type="radio" value="both" /> 不限
            </label>
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
import { ref, reactive, onMounted } from 'vue'
import api from '../../utils/api'

const loading = ref(false)
const sects = ref([])
const dialogVisible = ref(false)
const editingSect = ref(null)

const form = reactive({
  id: null,
  name: '',
  leader: '',
  description: '',
  rules: '',
  fit_gender: 'both'
})

const loadSects = async () => {
  loading.value = true
  try {
    const res = await api.get('/admin/sects')
    if (res.success) {
      sects.value = res.data || []
    }
  } catch (error) {
    alert('加载门派列表失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const editSect = (row) => {
  editingSect.value = row
  Object.assign(form, {
    id: row.id,
    name: row.name,
    leader: row.leader || '',
    description: row.description || '',
    rules: row.rules || '',
    fit_gender: row.fit_gender || 'both'
  })
  dialogVisible.value = true
}

const submitForm = async () => {
  try {
    const res = await api.put(`/admin/sects/${form.id}`, form)
    if (res.success) {
      alert('门派信息已更新')
      dialogVisible.value = false
      loadSects()
    }
  } catch (error) {
    alert('更新失败：' + (error.message || '未知错误'))
  }
}

onMounted(() => {
  loadSects()
})
</script>

<style scoped>
.section-title {
  color: #7eb8da;
  font-size: 18px;
  margin-bottom: 20px;
  border-left: 3px solid #4B87C3;
  padding-left: 10px;
}

.sects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.sect-card {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 16px;
  transition: transform 0.2s;
}

.sect-card:hover {
  transform: translateY(-2px);
  background: rgba(0, 0, 0, 0.35);
}

.sect-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sect-name {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.gender-tag {
  padding: 2px 8px;
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
}

.sect-info strong {
  color: #7eb8da;
}

.sect-actions {
  display: flex;
  justify-content: flex-end;
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
  max-width: 500px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal h4 {
  color: #7eb8da;
  margin-bottom: 16px;
  font-size: 16px;
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

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ccc;
  font-size: 13px;
  cursor: pointer;
}

.radio-label input[type="radio"] {
  accent-color: #4B87C3;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn-primary {
  background: #4B87C3;
}

.btn-primary:hover {
  background: #3a75b0;
}

.btn-info {
  background: #17a2b8;
  color: #fff;
}

.btn-info:hover {
  background: #138496;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 13px;
}

.empty-text {
  text-align: center;
  color: #888;
  padding: 40px;
}
</style>
