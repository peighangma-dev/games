<template>
  <div class="quests-management">
    <h3 class="section-title">📜 任务管理</h3>
    
    <div class="card">
      <!-- 创建任务 -->
      <div class="action-bar">
        <h4 class="subsection-title">创建新任务</h4>
        <button @click="showCreateDialog" class="btn btn-primary">
          <span style="font-size: 16px">➕</span> 创建任务
        </button>
      </div>

      <!-- 任务列表 -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 60px;">ID</th>
              <th>任务名称</th>
              <th style="width: 120px;">类型</th>
              <th>任务描述</th>
              <th style="width: 100px;">难度</th>
              <th style="width: 100px;">银两奖励</th>
              <th style="width: 100px;">经验奖励</th>
              <th style="width: 80px;">目标</th>
              <th style="width: 80px;">状态</th>
              <th style="width: 180px;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="quest in quests" :key="quest.id">
              <td>{{ quest.id }}</td>
              <td><strong>{{ quest.name }}</strong></td>
              <td>
                <span :class="['type-badge', 'type-'+quest.type]">
                  {{ getTypeName(quest.type) }}
                </span>
              </td>
              <td>{{ quest.description }}</td>
              <td>
                <span :class="['difficulty-badge', 'diff-'+quest.difficulty]">
                  {{ getDifficultyName(quest.difficulty) }}
                </span>
              </td>
              <td class="price">{{ quest.reward_silver }} 银</td>
              <td>{{ quest.reward_exp }} EXP</td>
              <td style="text-align: center;">{{ quest.objective_count }}</td>
              <td style="text-align: center;">
                <button 
                  @click="toggleQuestStatus(quest)" 
                  :class="['status-btn', quest.is_active ? 'status-active' : 'status-inactive']"
                  :title="quest.is_active ? '点击停用' : '点击启用'"
                  style="width: 100%; padding: 6px 0; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
                >
                  {{ quest.is_active ? '✅' : '❌' }}
                </button>
              </td>
              <td>
                <button @click="showEditDialog(quest)" class="btn btn-sm btn-warning" title="编辑">✏️</button>
                <button @click="deleteQuest(quest)" class="btn btn-sm btn-danger" title="删除">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="quests.length === 0" class="empty-text">暂无任务数据</div>
    </div>

    <!-- 创建/编辑对话框 -->
    <div v-if="dialogVisible" class="modal-overlay" @click.self="dialogVisible = false">
      <div class="modal" style="min-width: 600px;">
        <h3>{{ isEdit ? '编辑任务' : '创建任务' }}</h3>
        <div class="modal-body">
          <div class="form-row">
            <label style="min-width: 100px;">任务名称:</label>
            <input v-model="form.name" type="text" placeholder="例如：拜师学艺" class="form-input" style="flex: 1;" />
          </div>
          <div class="form-row">
            <label style="min-width: 100px;">任务类型:</label>
            <div style="display: flex; gap: 16px;">
              <label style="color: #fff; cursor: pointer;">
                <input type="radio" v-model="form.type" value="main" /> <span style="color: #3498db">主线任务</span>
              </label>
              <label style="color: #fff; cursor: pointer;">
                <input type="radio" v-model="form.type" value="side" /> <span style="color: #9b59b6">支线任务</span>
              </label>
              <label style="color: #fff; cursor: pointer;">
                <input type="radio" v-model="form.type" value="daily" /> <span style="color: #27ae60">每日任务</span>
              </label>
              <label style="color: #fff; cursor: pointer;">
                <input type="radio" v-model="form.type" value="hidden" /> <span style="color: #e74c3c">隐藏任务</span>
              </label>
            </div>
          </div>
          <div class="form-row">
            <label style="min-width: 100px;">任务难度:</label>
            <select v-model="form.difficulty" class="form-select" style="flex: 1;">
              <option value="easy">简单</option>
              <option value="medium">普通</option>
              <option value="hard">困难</option>
              <option value="extreme">极难</option>
            </select>
          </div>
          <div class="form-row">
            <label style="min-width: 100px;">任务描述:</label>
            <textarea v-model="form.description" rows="3" placeholder="描述任务内容" class="form-input" style="flex: 1; resize: vertical;" />
          </div>
          <div class="form-row">
            <label style="min-width: 100px;">前置任务:</label>
            <input v-model="form.prerequisite" type="text" placeholder="前置任务 ID（可选）" class="form-input" style="flex: 1;" />
          </div>
          <div class="form-row">
            <label style="min-width: 100px;">目标类型:</label>
            <select v-model="form.objective_type" class="form-select" style="flex: 1;">
              <option value="kill">⚔️ 战斗</option>
              <option value="collect">📦 收集</option>
              <option value="talk">💬 对话</option>
              <option value="explore">🗺️ 探索</option>
              <option value="craft">🔨 制作</option>
              <option value="train">🧘 修炼</option>
            </select>
          </div>
          <div class="form-row">
            <label style="min-width: 100px;">目标数量:</label>
            <input v-model.number="form.objective_count" type="number" min="1" class="form-input-small" />
            <span style="color: #aaa; font-size: 13px; margin-left: 8px;">次</span>
          </div>
          <div class="form-row">
            <label style="min-width: 100px;">银两奖励:</label>
            <input v-model.number="form.reward_silver" type="number" min="0" :step="100" class="form-input-small" />
            <span style="color: #aaa; font-size: 13px; margin-left: 8px;">银两</span>
          </div>
          <div class="form-row">
            <label style="min-width: 100px;">经验奖励:</label>
            <input v-model.number="form.reward_exp" type="number" min="0" :step="100" class="form-input-small" />
            <span style="color: #aaa; font-size: 13px; margin-left: 8px;">经验</span>
          </div>
          <div class="form-row">
            <label style="min-width: 100px;">物品奖励:</label>
            <input v-model="form.reward_items" type="text" placeholder="JSON 格式：[{item_id: 1, quantity: 10}]" class="form-input" style="flex: 1;" />
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
import { ref, reactive, onMounted } from 'vue'
import api from '../../utils/api'

const loading = ref(false)
const submitting = ref(false)
const quests = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)

const form = reactive({
  id: null,
  name: '',
  type: 'side',
  difficulty: 'easy',
  description: '',
  prerequisite: '',
  objective_type: 'talk',
  objective_count: 1,
  reward_silver: 500,
  reward_exp: 100,
  reward_items: ''
})

const getTypeName = (type) => {
  const names = {
    'main': '主线任务',
    'daily': '每日任务',
    'side': '支线任务',
    'hidden': '隐藏任务'
  }
  return names[type] || type
}

const getDifficultyName = (difficulty) => {
  const names = {
    'easy': '简单',
    'medium': '普通',
    'hard': '困难',
    'extreme': '极难'
  }
  return names[difficulty] || difficulty
}

const loadQuests = async () => {
  loading.value = true
  try {
    const res = await api.get('/admin/quests')
    if (res.success) {
      quests.value = res.data || []
    }
  } catch (error) {
    alert('加载任务列表失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const showCreateDialog = () => {
  Object.assign(form, {
    id: null,
    name: '',
    type: 'side',
    difficulty: 'easy',
    description: '',
    prerequisite: '',
    objective_type: 'talk',
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
  if (!form.name) {
    alert('请输入任务名称')
    return
  }
  if (!form.description) {
    alert('请输入任务描述')
    return
  }
  
  submitting.value = true
  try {
    if (isEdit.value) {
      await api.put(`/admin/quests/${form.id}`, form)
      alert('任务已更新')
    } else {
      await api.post('/admin/quests', form)
      alert('任务已创建')
    }
    
    dialogVisible.value = false
    loadQuests()
  } catch (error) {
    alert('操作失败：' + (error.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

const toggleQuestStatus = async (row) => {
  try {
    await api.put(`/admin/quests/${row.id}`, { is_active: row.is_active })
    alert('状态已更新')
  } catch (error) {
    row.is_active = !row.is_active
    alert('更新失败：' + (error.message || '未知错误'))
  }
}

const deleteQuest = async (row) => {
  if (!confirm(`确定要删除任务"${row.name}"吗？`)) return
  
  try {
    await api.delete(`/admin/quests/${row.id}`)
    alert('删除成功')
    loadQuests()
  } catch (error) {
    alert('删除失败：' + (error.message || '未知错误'))
  }
}

onMounted(() => {
  loadQuests()
})
</script>

<style scoped>
.quests-management { padding: 20px; }
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 16px; border-left: 3px solid #f39c12; padding-left: 10px; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.action-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.subsection-title { color: #f39c12; font-size: 14px; margin: 0; }
.form-input { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; }
.form-select { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; }
.form-input-small { width: 100px; padding: 8px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; text-align: center; }
.btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #555; color: #fff; transition: all 0.3s; font-size: 13px; }
.btn:hover { opacity: 0.8; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: #f39c12; }
.btn-warning { background: #e67e22; }
.btn-success { background: #27ae60; }
.btn-info { background: #2980b9; }
.btn-danger { background: #e74c3c; }
.btn-sm { padding: 4px 8px; font-size: 12px; }
.table-container { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
.data-table th { color: #f39c12; font-weight: 600; font-size: 14px; white-space: nowrap; background: rgba(243, 156, 18, 0.1); }
.data-table td { font-size: 13px; }
.data-table tr:hover { background: rgba(255,255,255,0.02); }
.type-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
.type-main { background: #3498db; color: #fff; }
.type-daily { background: #27ae60; color: #fff; }
.type-side { background: #9b59b6; color: #fff; }
.type-hidden { background: #e74c3c; color: #fff; }
.diff-easy { background: #27ae60; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
.diff-medium { background: #3498db; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
.diff-hard { background: #e67e22; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
.diff-extreme { background: #e74c3c; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
.price { color: #f39c12; font-weight: bold; }
.status-btn { transition: all 0.3s; }
.status-active { background: rgba(39, 174, 96, 0.3); border: 1px solid #27ae60; }
.status-inactive { background: rgba(231, 76, 60, 0.3); border: 1px solid #e74c3c; }
.empty-text { text-align: center; color: #888; padding: 40px 20px; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #1a202c; border-radius: 8px; padding: 24px; min-width: 600px; max-width: 700px; max-height: 80vh; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); }
.modal h3 { color: #f39c12; margin-bottom: 16px; font-size: 18px; }
.modal-body { margin-bottom: 20px; }
.modal-body .form-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }
.modal-body label { color: #aaa; font-size: 14px; min-width: 100px; }
.modal-footer { display: flex; gap: 12px; justify-content: flex-end; }
.modal-body textarea.form-input { min-height: 80px; resize: vertical; }
</style>
