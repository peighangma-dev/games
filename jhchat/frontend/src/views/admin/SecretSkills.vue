<template>
  <div class="secret-skills-management">
    <h3 class="section-title">📚 武功秘籍</h3>
    
    <div class="card">
      <!-- 添加秘籍 -->
      <div class="action-bar">
        <h4 class="subsection-title">创建新秘籍</h4>
        <button @click="showCreateDialog" class="btn btn-primary">
          <span style="font-size: 16px">➕</span> 创建秘籍
        </button>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">📄 秘籍总数</span>
          <span class="stat-value">{{ stats.total }}</span>
        </div>
        <div class="stat-item grad-jue">
          <span class="stat-label">👑 绝学秘籍</span>
          <span class="stat-value">{{ stats.gradeJue }}</span>
        </div>
        <div class="stat-item grad-a">
          <span class="stat-label">⭐ 甲级秘籍</span>
          <span class="stat-value">{{ stats.gradeA }}</span>
        </div>
        <div class="stat-item grad-b">
          <span class="stat-label">⭐ 乙级秘籍</span>
          <span class="stat-value">{{ stats.gradeB }}</span>
        </div>
        <div class="stat-item grad-c">
          <span class="stat-label">⭐ 丙级秘籍</span>
          <span class="stat-value">{{ stats.gradeC }}</span>
        </div>
      </div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-row">
          <input v-model="filterForm.name" type="text" placeholder="秘籍名称" class="form-input" style="width: 150px;" />
          <select v-model="filterForm.grade" class="form-select" style="width: 100px;">
            <option value="">全部等级</option>
            <option value="绝">绝学</option>
            <option value="甲">甲级</option>
            <option value="乙">乙级</option>
            <option value="丙">丙级</option>
          </select>
          <select v-model="filterForm.sect" class="form-select" style="width: 120px;">
            <option value="">全部门派</option>
            <option value="六扇门">六扇门</option>
            <option value="少林派">少林派</option>
            <option value="武当派">武当派</option>
            <option value="峨眉派">峨眉派</option>
            <option value="华山派">华山派</option>
            <option value="古墓派">古墓派</option>
            <option value="丐帮">丐帮</option>
            <option value="明教">明教</option>
            <option value="通用">通用</option>
          </select>
          <select v-model="filterForm.type" class="form-select" style="width: 100px;">
            <option value="">全部类型</option>
            <option value="内功">内功</option>
            <option value="外功">外功</option>
            <option value="轻功">轻功</option>
            <option value="剑法">剑法</option>
            <option value="刀法">刀法</option>
            <option value="拳法">拳法</option>
            <option value="指法">指法</option>
          </select>
          <button @click="loadSkills" class="btn btn-primary">
            <span style="font-size: 14px">🔍</span> 搜索
          </button>
          <button @click="resetFilter" class="btn">
            <span style="font-size: 14px">🔄</span> 重置
          </button>
          <div style="flex: 1"></div>
          <div>
            <label style="color: #aaa; font-size: 13px; margin-right: 8px">每页显示:</label>
            <select v-model.number="pagination.pageSize" @change="loadSkills" class="form-select" style="width: 80px; display: inline-block;">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
            <span style="color: #aaa; font-size: 13px; margin: 0 8px">共 {{ pagination.total }} 条</span>
          </div>
        </div>
      </div>

      <!-- 批量操作提示 -->
      <div v-if="selectedIds.length > 0" class="batch-alert">
        <span style="color: #fff">✅ 已选择 <strong>{{ selectedIds.length }}</strong> 个秘籍</span>
        <button @click="batchDelete" class="btn btn-sm btn-danger" style="margin-left: 12px;">
          <span style="font-size: 12px">🗑️</span> 批量删除
        </button>
        <button @click="selectedIds = []" class="btn btn-sm" style="margin-left: 8px;">取消选择</button>
      </div>

      <!-- 秘籍列表 -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 40px;">
                <input 
                  type="checkbox" 
                  :checked="allSelected && selectedIds.length > 0"
                  @change="toggleAllSelection"
                  style="width: 16px; height: 16px; cursor: pointer;"
                />
              </th>
              <th style="width: 60px;">ID</th>
              <th>秘籍名称</th>
              <th style="width: 80px;">等级</th>
              <th style="width: 100px;">门派</th>
              <th style="width: 80px;">类型</th>
              <th>效果</th>
              <th style="width: 80px;">修炼等级</th>
              <th style="width: 100px;">价格</th>
              <th style="width: 180px;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="skill in skills" :key="skill.id">
              <td>
                <input 
                  type="checkbox" 
                  :checked="selectedIds.includes(skill.id)"
                  @change="toggleSelection(skill.id)"
                  style="width: 16px; height: 16px; cursor: pointer;"
                />
              </td>
              <td>{{ skill.id }}</td>
              <td><strong>{{ skill.name }}</strong></td>
              <td>
                <span :class="['grade-badge', 'grade-'+skill.grade]">
                  {{ skill.grade }}级
                </span>
              </td>
              <td>{{ skill.sect }}</td>
              <td>
                <span :class="['type-badge', 'type-'+skill.type]">{{ skill.type }}</span>
              </td>
              <td>{{ skill.effect }}</td>
              <td>{{ skill.require_level }} 级</td>
              <td class="price">{{ skill.price }} 银</td>
              <td>
                <button @click="showEditDialog(skill)" class="btn btn-sm btn-warning" title="编辑">✏️</button>
                <button @click="deleteSkill(skill)" class="btn btn-sm btn-danger" title="删除">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="skills.length === 0" class="empty-text">暂无秘籍数据</div>

      <!-- 分页 -->
      <div class="pagination-bar">
        <button 
          @click="pagination.page = 1" 
          :disabled="pagination.page === 1"
          class="btn btn-sm"
        >
          ⏮️ 首页
        </button>
        <button 
          @click="pagination.page--" 
          :disabled="pagination.page === 1"
          class="btn btn-sm"
        >
          ◀️ 上一页
        </button>
        <span style="color: #aaa; font-size: 13px; margin: 0 12px">
          第 {{ pagination.page }} 页 / 共 {{ Math.ceil(pagination.total / pagination.pageSize) }} 页
        </span>
        <button 
          @click="pagination.page++" 
          :disabled="pagination.page >= Math.ceil(pagination.total / pagination.pageSize)"
          class="btn btn-sm"
        >
          下一页 ▶️
        </button>
        <button 
          @click="pagination.page = Math.ceil(pagination.total / pagination.pageSize)" 
          :disabled="pagination.page >= Math.ceil(pagination.total / pagination.pageSize)"
          class="btn btn-sm"
        >
          末页 ⏭️
        </button>
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <div v-if="dialogVisible" class="modal-overlay" @click.self="dialogVisible = false">
      <div class="modal" style="min-width: 500px;">
        <h3>{{ isEdit ? '编辑秘籍' : '创建秘籍' }}</h3>
        <div class="modal-body">
          <div class="form-row">
            <label style="min-width: 90px;">秘籍名称:</label>
            <input v-model="form.name" type="text" placeholder="例如：北冥神功" class="form-input" style="flex: 1;" />
          </div>
          <div class="form-row">
            <label style="min-width: 90px;">秘籍等级:</label>
            <div style="display: flex; gap: 16px;">
              <label style="color: #fff; cursor: pointer;">
                <input type="radio" v-model="form.grade" value="绝" /> <span style="color: #ffd700">绝学</span>
              </label>
              <label style="color: #fff; cursor: pointer;">
                <input type="radio" v-model="form.grade" value="甲" /> <span style="color: #f5576c">甲级</span>
              </label>
              <label style="color: #fff; cursor: pointer;">
                <input type="radio" v-model="form.grade" value="乙" /> <span style="color: #fda085">乙级</span>
              </label>
              <label style="color: #fff; cursor: pointer;">
                <input type="radio" v-model="form.grade" value="丙" /> <span style="color: #8fd3f4">丙级</span>
              </label>
            </div>
          </div>
          <div class="form-row">
            <label style="min-width: 90px;">门派:</label>
            <select v-model="form.sect" class="form-select" style="flex: 1;">
              <option value="通用">通用</option>
              <option value="六扇门">六扇门</option>
              <option value="少林派">少林派</option>
              <option value="武当派">武当派</option>
              <option value="峨眉派">峨眉派</option>
              <option value="华山派">华山派</option>
              <option value="古墓派">古墓派</option>
              <option value="丐帮">丐帮</option>
              <option value="明教">明教</option>
            </select>
          </div>
          <div class="form-row">
            <label style="min-width: 90px;">类型:</label>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
              <label style="color: #fff; cursor: pointer;">
                <input type="radio" v-model="form.type" value="内功" /> 内功
              </label>
              <label style="color: #fff; cursor: pointer;">
                <input type="radio" v-model="form.type" value="外功" /> 外功
              </label>
              <label style="color: #fff; cursor: pointer;">
                <input type="radio" v-model="form.type" value="轻功" /> 轻功
              </label>
              <label style="color: #fff; cursor: pointer;">
                <input type="radio" v-model="form.type" value="剑法" /> 剑法
              </label>
              <label style="color: #fff; cursor: pointer;">
                <input type="radio" v-model="form.type" value="刀法" /> 刀法
              </label>
              <label style="color: #fff; cursor: pointer;">
                <input type="radio" v-model="form.type" value="拳法" /> 拳法
              </label>
              <label style="color: #fff; cursor: pointer;">
                <input type="radio" v-model="form.type" value="指法" /> 指法
              </label>
            </div>
          </div>
          <div class="form-row">
            <label style="min-width: 90px;">效果:</label>
            <textarea v-model="form.effect" rows="3" placeholder="描述武功效果" class="form-input" style="flex: 1; resize: vertical;" />
          </div>
          <div class="form-row">
            <label style="min-width: 90px;">修炼等级:</label>
            <input v-model.number="form.require_level" type="number" min="1" max="100" class="form-input-small" />
            <span style="color: #aaa; font-size: 13px; margin-left: 8px;">级</span>
          </div>
          <div class="form-row">
            <label style="min-width: 90px;">价格:</label>
            <input v-model.number="form.price" type="number" min="0" :step="100" class="form-input-small" />
            <span style="color: #aaa; font-size: 13px; margin-left: 8px;">银两</span>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="dialogVisible = false" class="btn">取消</button>
          <button @click="submitForm" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? '提交中...' : '确定' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import api from '../../utils/api'

const loading = ref(false)
const submitting = ref(false)
const skills = ref([])
const stats = ref({ total: 0, gradeJue: 0, gradeA: 0, gradeB: 0, gradeC: 0 })
const dialogVisible = ref(false)
const isEdit = ref(false)
const selectedIds = ref([])

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

const allSelected = computed(() => {
  return skills.length > 0 && selectedIds.value.length === skills.length
})

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
    alert('加载秘籍列表失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await api.get('/admin/secret-skills/stats')
    if (res.success) {
      stats.value = res.data || { total: 0, gradeJue: 0, gradeA: 0, gradeB: 0, gradeC: 0 }
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
  if (!form.name) {
    alert('请输入秘籍名称')
    return
  }
  if (!form.effect) {
    alert('请输入效果描述')
    return
  }
  
  submitting.value = true
  try {
    if (isEdit.value) {
      await api.put(`/admin/secret-skills/${form.id}`, form)
      alert('秘籍已更新')
    } else {
      await api.post('/admin/secret-skills', form)
      alert('秘籍已创建')
    }
    
    dialogVisible.value = false
    loadSkills()
    loadStats()
  } catch (error) {
    alert('操作失败：' + (error.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

const deleteSkill = async (row) => {
  if (!confirm(`确定要删除秘籍"${row.name}"吗？`)) return
  
  try {
    await api.delete(`/admin/secret-skills/${row.id}`)
    alert('删除成功')
    loadSkills()
    loadStats()
  } catch (error) {
    alert('删除失败：' + (error.message || '未知错误'))
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

const toggleSelection = (id) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const toggleAllSelection = () => {
  if (allSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = skills.map(s => s.id)
  }
}

const batchDelete = async () => {
  if (selectedIds.value.length === 0) return
  
  if (!confirm(`确定要删除选中的 ${selectedIds.value.length} 个秘籍吗？此操作不可恢复！`)) return
  
  try {
    const deletePromises = selectedIds.value.map(id => 
      api.delete(`/admin/secret-skills/${id}`)
    )
    await Promise.all(deletePromises)
    alert(`成功删除 ${selectedIds.value.length} 个秘籍`)
    selectedIds.value = []
    loadSkills()
    loadStats()
  } catch (error) {
    alert('批量删除失败：' + (error.message || '未知错误'))
  }
}

onMounted(() => {
  loadSkills()
  loadStats()
})
</script>

<style scoped>
.secret-skills-management { padding: 20px; }
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 16px; border-left: 3px solid #f39c12; padding-left: 10px; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.action-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.subsection-title { color: #f39c12; font-size: 14px; margin: 0; }
.stats-row { display: flex; gap: 16px; margin-bottom: 20px; }
.stat-item { flex: 1; background: rgba(255,255,255,0.05); border-radius: 6px; padding: 12px 16px; display: flex; flex-direction: column; gap: 6px; border: 1px solid rgba(255,255,255,0.1); }
.stat-item.grad-jue { background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,193,7,0.15)); border-color: rgba(255,215,0,0.4); }
.stat-item.grad-a { background: linear-gradient(135deg, rgba(245,147,251,0.15), rgba(245,87,108,0.15)); border-color: rgba(245,87,108,0.3); }
.stat-item.grad-b { background: linear-gradient(135deg, rgba(246,211,101,0.15), rgba(253,160,133,0.15)); border-color: rgba(253,160,133,0.3); }
.stat-item.grad-c { background: linear-gradient(135deg, rgba(132,250,176,0.15), rgba(141,211,244,0.15)); border-color: rgba(141,211,244,0.3); }
.stat-label { color: #a0a0a0; font-size: 12px; }
.stat-value { color: #fff; font-size: 24px; font-weight: bold; }
.filter-bar { background: rgba(255,255,255,0.02); border-radius: 6px; padding: 12px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.05); }
.filter-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.form-input { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; }
.form-select { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; }
.form-input-small { width: 80px; padding: 8px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; text-align: center; }
.btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #555; color: #fff; transition: all 0.3s; font-size: 13px; }
.btn:hover { opacity: 0.8; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: #f39c12; }
.btn-warning { background: #e67e22; }
.btn-success { background: #27ae60; }
.btn-info { background: #2980b9; }
.btn-danger { background: #e74c3c; }
.btn-sm { padding: 4px 8px; font-size: 12px; }
.batch-alert { background: rgba(52, 152, 219, 0.2); border: 1px solid rgba(52, 152, 219, 0.5); border-radius: 4px; padding: 10px 16px; margin-bottom: 16px; display: flex; align-items: center; }
.table-container { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
.data-table th { color: #f39c12; font-weight: 600; font-size: 14px; white-space: nowrap; background: rgba(243, 156, 18, 0.1); }
.data-table td { font-size: 13px; }
.data-table tr:hover { background: rgba(255,255,255,0.02); }
.grade-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.grade-甲 { background: #e74c3c; color: #fff; }
.grade-乙 { background: #e67e22; color: #fff; }
.grade-丙 { background: #7f8c8d; color: #fff; }
.type-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
.type-内功 { background: #3498db; color: #fff; }
.type-外功 { background: #27ae60; color: #fff; }
.type-轻功 { background: #f39c12; color: #fff; }
.type-剑法 { background: #e74c3c; color: #fff; }
.type-刀法 { background: #9b59b6; color: #fff; }
.type-拳法 { background: #1abc9c; color: #fff; }
.type-指法 { background: #e91e63; color: #fff; }
.price { color: #f39c12; font-weight: bold; }
.empty-text { text-align: center; color: #888; padding: 40px 20px; }
.pagination-bar { display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #1a202c; border-radius: 8px; padding: 24px; min-width: 500px; max-width: 600px; max-height: 80vh; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); }
.modal h3 { color: #f39c12; margin-bottom: 16px; font-size: 18px; }
.modal-body { margin-bottom: 20px; }
.modal-body .form-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }
.modal-body label { color: #aaa; font-size: 14px; min-width: 90px; }
.modal-footer { display: flex; gap: 12px; justify-content: flex-end; }
.modal-body textarea.form-input { min-height: 80px; resize: vertical; }
</style>
