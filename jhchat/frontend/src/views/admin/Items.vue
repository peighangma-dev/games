<template>
  <div class="items-management">
    <h3 class="section-title">物品管理</h3>
    
    <div class="card">
      <!-- 添加物品 -->
      <div class="action-bar">
        <h4 class="subsection-title">添加物品</h4>
        <div class="form-row">
          <input v-model="addForm.name" type="text" placeholder="物品名称" class="form-input" />
          <select v-model="addForm.type" class="form-select">
            <option value="">选择类型</option>
            <option value="武器">武器</option>
            <option value="防具">防具</option>
            <option value="暗器">暗器</option>
            <option value="药品">药品</option>
            <option value="其他">其他</option>
          </select>
          <div class="form-group-inline">
            <label>攻击:</label>
            <input v-model.number="addForm.attack" type="number" class="form-input-small" />
          </div>
          <div class="form-group-inline">
            <label>防御:</label>
            <input v-model.number="addForm.defense" type="number" class="form-input-small" />
          </div>
          <div class="form-group-inline">
            <label>数量:</label>
            <input v-model.number="addForm.quantity" type="number" class="form-input-small" />
          </div>
          <button @click="addItem" class="btn btn-primary">添加</button>
        </div>
      </div>

      <!-- 物品列表 -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>名称</th>
              <th>类型</th>
              <th>拥有者</th>
              <th>攻击</th>
              <th>防御</th>
              <th>数量</th>
              <th>内力加成</th>
              <th>体力加成</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.id }}</td>
              <td><strong>{{ item.name }}</strong></td>
              <td>{{ item.type || '-' }}</td>
              <td>{{ item.owner || '无' }}</td>
              <td>{{ item.attack }}</td>
              <td>{{ item.defense }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.neili_bonus }}</td>
              <td>{{ item.tili_bonus }}</td>
              <td>
                <button @click="deleteItem(item.id)" class="btn btn-sm btn-danger">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="items.length === 0" class="empty-text">暂无物品</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../utils/api'

const items = ref([])

const addForm = ref({
  name: '',
  type: '',
  attack: 0,
  defense: 0,
  quantity: 1,
  neili_bonus: 0,
  tili_bonus: 0
})

async function loadItems() {
  try {
    const res = await api.get('/admin/items')
    if (res.success) {
      items.value = res.data || []
    }
  } catch (e) {
    alert('加载物品失败：' + (e.message || '未知错误'))
  }
}

async function addItem() {
  if (!addForm.value.name) {
    alert('请输入物品名称')
    return
  }
  try {
    const res = await api.post('/admin/items', addForm.value)
    if (res.success) {
      alert('物品已添加')
      addForm.value.name = ''
      loadItems()
    }
  } catch (e) {
    alert('添加失败：' + (e.message || '未知错误'))
  }
}

async function deleteItem(id) {
  if (!confirm('确定要删除该物品吗？')) return
  try {
    const res = await api.delete(`/admin/items/${id}`)
    if (res.success) {
      alert('物品已删除')
      loadItems()
    }
  } catch (e) {
    alert('删除失败：' + (e.message || '未知错误'))
  }
}

onMounted(() => loadItems())
</script>

<style scoped>
.items-management { padding: 20px; }
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 16px; border-left: 3px solid #4B87C3; padding-left: 10px; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.subsection-title { color: #7eb8da; font-size: 14px; margin-bottom: 12px; }
.action-bar { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.form-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.form-input { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; }
.form-select { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; }
.form-input-small { width: 70px; padding: 8px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; text-align: center; }
.form-group-inline { display: flex; align-items: center; gap: 6px; color: #aaa; font-size: 14px; }
.btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #555; color: #fff; transition: all 0.3s; }
.btn:hover { opacity: 0.8; }
.btn-primary { background: #4B87C3; }
.btn-sm { padding: 4px 8px; font-size: 12px; }
.btn-danger { background: #e74c3c; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
.data-table th { color: #7eb8da; font-weight: 600; font-size: 14px; white-space: nowrap; }
.data-table td { font-size: 13px; }
.empty-text { text-align: center; color: #888; padding: 20px; }
</style>
