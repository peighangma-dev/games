<template>
  <div class="random-events-page">
    <div class="page-header">
      <h2>随机事件管理</h2>
      <button class="btn btn-primary" @click="openCreateModal">+ 新增事件</button>
    </div>

    <div class="events-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>事件名称</th>
            <th>类型</th>
            <th>效果类型</th>
            <th>概率</th>
            <th>冷却 (分钟)</th>
            <th>全局</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="event in events" :key="event.id">
            <td>{{ event.id }}</td>
            <td>{{ event.event_name }}</td>
            <td>
              <span :class="['type-tag', event.event_type]">
                {{ getEventTypeName(event.event_type) }}
              </span>
            </td>
            <td>{{ getEffectTypeName(event.effect_type) }}</td>
            <td>{{ event.probability }}</td>
            <td>{{ event.cooldown_minutes }}</td>
            <td>{{ event.is_global ? '是' : '否' }}</td>
            <td>
              <span :class="['status-badge', event.is_enabled ? 'enabled' : 'disabled']">
                {{ event.is_enabled ? '启用' : '禁用' }}
              </span>
            </td>
            <td class="action-buttons">
              <button class="btn btn-sm btn-info" @click="openEditModal(event)">编辑</button>
              <button class="btn btn-sm" :class="event.is_enabled ? 'btn-warning' : 'btn-success'" @click="toggleEvent(event)">
                {{ event.is_enabled ? '禁用' : '启用' }}
              </button>
              <button class="btn btn-sm btn-danger" @click="deleteEvent(event)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 创建/编辑弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑事件' : '新增事件' }}</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveEvent">
            <div class="form-row">
              <div class="form-group">
                <label>事件名称 *</label>
                <input v-model="formData.event_name" type="text" required class="form-input" placeholder="如：狂风大作" />
              </div>
              <div class="form-group">
                <label>事件类型 *</label>
                <select v-model="formData.event_type" class="form-input" required>
                  <option value="weather">天气类</option>
                  <option value="fortune">福气类</option>
                  <option value="disaster">灾祸类</option>
                  <option value="blessing">祝福类</option>
                  <option value="mystery">神秘类</option>
                  <option value="robbery">抢劫类</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>消息模板 *</label>
              <textarea v-model="formData.message_template" rows="3" required class="form-input" 
                placeholder="支持占位符：{username} {amount} {attribute}"></textarea>
              <small class="form-hint">可用占位符：{username} 用户名，{amount} 数值，{attribute} 属性名称</small>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>效果类型</label>
                <select v-model="formData.effect_type" class="form-input">
                  <option value="none">无效果</option>
                  <option value="silver">银子</option>
                  <option value="neili">内力</option>
                  <option value="tili">体力</option>
                  <option value="wugong">武功</option>
                  <option value="all">全属性</option>
                </select>
              </div>
              <div class="form-group">
                <label>最小值</label>
                <input v-model.number="formData.effect_value_min" type="number" class="form-input" placeholder="0" />
              </div>
              <div class="form-group">
                <label>最大值</label>
                <input v-model.number="formData.effect_value_max" type="number" class="form-input" placeholder="0" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>触发概率</label>
                <input v-model.number="formData.probability" type="number" class="form-input" placeholder="100" />
                <small class="form-hint">相对权重，越大越容易触发</small>
              </div>
              <div class="form-group">
                <label>冷却时间 (分钟)</label>
                <input v-model.number="formData.cooldown_minutes" type="number" class="form-input" placeholder="30" />
              </div>
              <div class="form-group">
                <label>最低等级</label>
                <input v-model.number="formData.min_grade" type="number" class="form-input" placeholder="1" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group checkbox-group">
                <label>
                  <input v-model="formData.is_enabled" type="checkbox" />
                  启用
                </label>
              </div>
              <div class="form-group checkbox-group">
                <label>
                  <input v-model="formData.is_global" type="checkbox" />
                  全服事件（影响所有在线用户）
                </label>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">取消</button>
          <button type="button" class="btn btn-primary" @click="saveEvent">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../utils/api'

const events = ref([])
const showModal = ref(false)
const isEdit = ref(false)

const formData = ref({
  event_name: '',
  event_type: 'mystery',
  message_template: '',
  effect_type: 'none',
  effect_value_min: 0,
  effect_value_max: 0,
  probability: 100,
  cooldown_minutes: 30,
  is_enabled: true,
  is_global: false,
  min_grade: 1
})

const eventTypeNames = {
  weather: '天气',
  fortune: '福气',
  disaster: '灾祸',
  blessing: '祝福',
  mystery: '神秘',
  robbery: '抢劫'
}

const effectTypeNames = {
  none: '无',
  silver: '银子',
  neili: '内力',
  tili: '体力',
  wugong: '武功',
  all: '全属性'
}

function getEventTypeName(type) {
  return eventTypeNames[type] || type
}

function getEffectTypeName(type) {
  return effectTypeNames[type] || type
}

async function loadEvents() {
  try {
    const res = await api.get('/random-events')
    if (res.success) {
      events.value = res.data || []
    }
  } catch (err) {
    console.error('Load events failed:', err)
    alert('加载事件列表失败')
  }
}

function openCreateModal() {
  isEdit.value = false
  formData.value = {
    event_name: '',
    event_type: 'mystery',
    message_template: '',
    effect_type: 'none',
    effect_value_min: 0,
    effect_value_max: 0,
    probability: 100,
    cooldown_minutes: 30,
    is_enabled: true,
    is_global: false,
    min_grade: 1
  }
  showModal.value = true
}

function openEditModal(event) {
  isEdit.value = true
  formData.value = {
    id: event.id,
    event_name: event.event_name,
    event_type: event.event_type,
    message_template: event.message_template,
    effect_type: event.effect_type,
    effect_value_min: event.effect_value_min,
    effect_value_max: event.effect_value_max,
    probability: event.probability,
    cooldown_minutes: event.cooldown_minutes,
    is_enabled: !!event.is_enabled,
    is_global: !!event.is_global,
    min_grade: event.min_grade
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveEvent() {
  try {
    const payload = { ...formData.value }
    let res
    
    if (isEdit.value) {
      res = await api.put(`/random-events/${payload.id}`, payload)
    } else {
      res = await api.post('/random-events', payload)
    }
    
    if (res.success) {
      alert(isEdit.value ? '更新成功' : '创建成功')
      closeModal()
      loadEvents()
    } else {
      alert(res.message || '操作失败')
    }
  } catch (err) {
    console.error('Save event failed:', err)
    alert('操作失败')
  }
}

async function toggleEvent(event) {
  try {
    const res = await api.post(`/random-events/${event.id}/toggle`)
    if (res.success) {
      event.is_enabled = res.data?.is_enabled ? 1 : 0
      alert(res.message)
    }
  } catch (err) {
    console.error('Toggle event failed:', err)
    alert('操作失败')
  }
}

async function deleteEvent(event) {
  if (!confirm(`确定要删除事件 "${event.event_name}" 吗？`)) return
  
  try {
    const res = await api.delete(`/random-events/${event.id}`)
    if (res.success) {
      alert('删除成功')
      loadEvents()
    } else {
      alert(res.message || '删除失败')
    }
  } catch (err) {
    console.error('Delete event failed:', err)
    alert('删除失败')
  }
}

onMounted(() => {
  loadEvents()
})
</script>

<style scoped>
.random-events-page {
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  min-height: 100%;
  border-radius: 8px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #7eb8da;
  font-size: 20px;
}

.events-table {
  background: rgba(30, 40, 50, 0.8);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(75, 135, 195, 0.2);
}

.events-table table {
  width: 100%;
  border-collapse: collapse;
}

.events-table th,
.events-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.events-table th {
  background: rgba(75, 135, 195, 0.15);
  font-weight: 600;
  color: #7eb8da;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.events-table td {
  font-size: 14px;
  color: #e0e0e0;
}

.events-table tr:hover {
  background: rgba(75, 135, 195, 0.1);
}

.type-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.type-tag.weather { background: rgba(25, 118, 210, 0.3); color: #64b5f6; border: 1px solid rgba(25, 118, 210, 0.5); }
.type-tag.fortune { background: rgba(245, 124, 0, 0.3); color: #ffb74d; border: 1px solid rgba(245, 124, 0, 0.5); }
.type-tag.disaster { background: rgba(211, 47, 47, 0.3); color: #e57373; border: 1px solid rgba(211, 47, 47, 0.5); }
.type-tag.blessing { background: rgba(56, 142, 60, 0.3); color: #81c784; border: 1px solid rgba(56, 142, 60, 0.5); }
.type-tag.mystery { background: rgba(123, 31, 162, 0.3); color: #ba68c8; border: 1px solid rgba(123, 31, 162, 0.5); }
.type-tag.robbery { background: rgba(255, 160, 0, 0.3); color: #ffd54f; border: 1px solid rgba(255, 160, 0, 0.5); }

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.enabled {
  background: rgba(76, 175, 80, 0.3);
  color: #81c784;
  border: 1px solid rgba(76, 175, 80, 0.5);
}

.status-badge.disabled {
  background: rgba(244, 67, 54, 0.3);
  color: #e57373;
  border: 1px solid rgba(244, 67, 54, 0.5);
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: linear-gradient(135deg, rgba(30, 40, 50, 0.98) 0%, rgba(20, 30, 40, 0.98) 100%);
  border-radius: 12px;
  width: 90%;
  max-width: 750px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(75, 135, 195, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(75, 135, 195, 0.1);
}

.modal-header h3 {
  margin: 0;
  color: #7eb8da;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #7eb8da;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  color: #fff;
  transform: rotate(90deg);
}

.modal-body {
  padding: 24px 20px;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  flex: 1;
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #7eb8da;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(75, 135, 195, 0.3);
  border-radius: 6px;
  font-size: 14px;
  background: rgba(20, 30, 40, 0.8);
  color: #e0e0e0;
  transition: all 0.2s;
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.form-input:focus {
  outline: none;
  border-color: #4B87C3;
  background: rgba(20, 30, 40, 0.95);
  box-shadow: 0 0 0 3px rgba(75, 135, 195, 0.15);
}

textarea.form-input {
  resize: vertical;
  min-height: 90px;
  font-family: inherit;
}

.form-hint {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal;
  cursor: pointer;
  color: #e0e0e0;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(75, 135, 195, 0.1);
  transition: all 0.2s;
}

.checkbox-group label:hover {
  background: rgba(75, 135, 195, 0.2);
}

.checkbox-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.2);
}

.btn {
  padding: 10px 18px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-primary {
  background: linear-gradient(135deg, #4B87C3 0%, #3a7ab5 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(75, 135, 195, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #3a7ab5 0%, #2d6aa0 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(75, 135, 195, 0.4);
}

.btn-secondary {
  background: rgba(80, 80, 80, 0.8);
  color: #e0e0e0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(100, 100, 100, 0.8);
  transform: translateY(-1px);
}

.btn-info {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

.btn-info:hover {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  transform: translateY(-1px);
}

.btn-success {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.btn-success:hover {
  background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
  transform: translateY(-1px);
}

.btn-warning {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

.btn-warning:hover {
  background: linear-gradient(135deg, #f57c00 0%, #e65100 100%);
  transform: translateY(-1px);
}

.btn-danger {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

.btn-danger:hover {
  background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
  transform: translateY(-1px);
}

.btn-sm {
  padding: 6px 10px;
  font-size: 12px;
}

/* 滚动条样式 */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: rgba(75, 135, 195, 0.5);
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 135, 195, 0.7);
}

/* 响应式 */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .action-buttons {
    flex-wrap: wrap;
  }
  
  .events-table {
    overflow-x: auto;
  }
  
  .events-table table {
    min-width: 800px;
  }
}
</style>
