<template>
  <div class="shop-management">
    <h3 class="section-title">🏪 商店管理</h3>
    
    <div class="card">
      <!-- 添加物品 -->
      <div class="action-bar">
        <h4 class="subsection-title">添加商店物品</h4>
        <div class="form-row">
          <input v-model="addForm.name" type="text" placeholder="物品名称" class="form-input" />
          <select v-model="addForm.type" class="form-select">
            <option value="">选择类型</option>
            <option value="weapon">⚔️ 兵器</option>
            <option value="armor">🛡️ 防具</option>
            <option value="medicine">💊 药品</option>
            <option value="poison">☠️ 毒药</option>
            <option value="other">📦 其他</option>
          </select>
          <input v-model.number="addForm.price" type="number" placeholder="价格" class="form-input-small" />
          <input v-model.number="addForm.attack" type="number" placeholder="攻击" class="form-input-small" />
          <input v-model.number="addForm.defense" type="number" placeholder="防御" class="form-input-small" />
          <input v-model.number="addForm.neili_bonus" type="number" placeholder="内力" class="form-input-small" />
          <input v-model.number="addForm.tili_bonus" type="number" placeholder="体力" class="form-input-small" />
        </div>
        <div class="form-row" style="margin-top: 10px;">
          <input v-model="addForm.image_file" type="text" placeholder="图片文件名 (如 1.gif)" class="form-input" style="width: 200px;" />
          <input v-model.number="addForm.stock_quantity" type="number" placeholder="库存" class="form-input-small" />
          <input v-model.number="addForm.sort_no" type="number" placeholder="排序" class="form-input-small" />
          <input v-model="addForm.description" type="text" placeholder="描述" class="form-input" style="flex: 1;" />
          <button @click="addItem" class="btn btn-primary">添加</button>
        </div>
      </div>

      <!-- 物品列表 -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>排序</th>
              <th>ID</th>
              <th>名称</th>
              <th>类型</th>
              <th>图片</th>
              <th>攻击</th>
              <th>防御</th>
              <th>内力</th>
              <th>体力</th>
              <th>价格</th>
              <th>库存</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in shopItems" :key="item.id">
              <td>{{ item.sort_no }}</td>
              <td>{{ item.id }}</td>
              <td><strong>{{ item.name }}</strong></td>
              <td><span :class="['type-badge', 'type-'+item.type]">{{ getTypeName(item.type) }}</span></td>
              <td>
                <img v-if="item.image_file" :src="`/assets/items/${item.image_file}`" :alt="item.name" class="item-thumb" />
              </td>
              <td>{{ item.attack > 0 ? '+' : '' }}{{ item.attack }}</td>
              <td>{{ item.defense > 0 ? '+' : '' }}{{ item.defense }}</td>
              <td :class="{ 'bonus-positive': item.neili_bonus > 0, 'bonus-negative': item.neili_bonus < 0 }">
                {{ item.neili_bonus > 0 ? '+' : '' }}{{ item.neili_bonus }}
              </td>
              <td :class="{ 'bonus-positive': item.tili_bonus > 0, 'bonus-negative': item.tili_bonus < 0 }">
                {{ item.tili_bonus > 0 ? '+' : '' }}{{ item.tili_bonus }}
              </td>
              <td class="price">{{ item.price }}</td>
              <td>
                <span :class="{ 'low-stock': item.stock_quantity < 100 }">{{ item.stock_quantity }}</span>
              </td>
              <td>
                <span :class="['status-badge', item.is_enabled ? 'status-enabled' : 'status-disabled']">
                  {{ item.is_enabled ? '在售' : '下架' }}
                </span>
              </td>
              <td>
                <button @click="editItem(item)" class="btn btn-sm btn-warning" title="编辑">✏️</button>
                <button @click="showRestock(item)" class="btn btn-sm btn-success" title="补货">📦</button>
                <button @click="toggleStatus(item)" class="btn btn-sm btn-info" :title="item.is_enabled ? '下架' : '上架'">
                  {{ item.is_enabled ? '⬇️' : '⬆️' }}
                </button>
                <button @click="deleteItem(item.id)" class="btn btn-sm btn-danger" title="删除">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="shopItems.length === 0" class="empty-text">暂无商店物品</div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="editingItem" class="modal-overlay" @click.self="editingItem = null">
      <div class="modal">
        <h3>编辑物品：{{ editingItem.name }}</h3>
        <div class="modal-body">
          <div class="form-row">
            <label>名称:</label>
            <input v-model="editForm.name" type="text" class="form-input" />
          </div>
          <div class="form-row">
            <label>类型:</label>
            <select v-model="editForm.type" class="form-select">
              <option value="weapon">兵器</option>
              <option value="armor">防具</option>
              <option value="medicine">药品</option>
              <option value="poison">毒药</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div class="form-row">
            <label>价格:</label>
            <input v-model.number="editForm.price" type="number" class="form-input-small" />
          </div>
          <div class="form-row">
            <label>攻击:</label>
            <input v-model.number="editForm.attack" type="number" class="form-input-small" />
          </div>
          <div class="form-row">
            <label>防御:</label>
            <input v-model.number="editForm.defense" type="number" class="form-input-small" />
          </div>
          <div class="form-row">
            <label>内力:</label>
            <input v-model.number="editForm.neili_bonus" type="number" class="form-input-small" />
          </div>
          <div class="form-row">
            <label>体力:</label>
            <input v-model.number="editForm.tili_bonus" type="number" class="form-input-small" />
          </div>
          <div class="form-row">
            <label>图片:</label>
            <input v-model="editForm.image_file" type="text" class="form-input" />
          </div>
          <div class="form-row">
            <label>描述:</label>
            <input v-model="editForm.description" type="text" class="form-input" style="width: 100%;" />
          </div>
          <div class="form-row">
            <label>排序:</label>
            <input v-model.number="editForm.sort_no" type="number" class="form-input-small" />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="updateItem" class="btn btn-primary">保存</button>
          <button @click="editingItem = null" class="btn">取消</button>
        </div>
      </div>
    </div>

    <!-- 补货弹窗 -->
    <div v-if="restockingItem" class="modal-overlay" @click.self="restockingItem = null">
      <div class="modal">
        <h3>补货：{{ restockingItem.name }}</h3>
        <div class="modal-body">
          <p>当前库存：<strong>{{ restockingItem.stock_quantity }}</strong></p>
          <div class="form-row">
            <label>补货数量:</label>
            <input v-model.number="restockQuantity" type="number" min="1" class="form-input-small" />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="doRestock" class="btn btn-primary">确认补货</button>
          <button @click="restockingItem = null" class="btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../utils/api'

const shopItems = ref([])
const editingItem = ref(null)
const editForm = ref({})
const restockingItem = ref(null)
const restockQuantity = ref(0)

const addForm = ref({
  name: '',
  type: '',
  attack: 0,
  defense: 0,
  neili_bonus: 0,
  tili_bonus: 0,
  price: 0,
  image_file: '',
  description: '',
  stock_quantity: 999,
  sort_no: 0
})

function getTypeName(type) {
  const names = {
    'weapon': '兵器',
    'armor': '防具',
    'medicine': '药品',
    'poison': '毒药',
    'other': '其他'
  }
  return names[type] || type
}

async function loadShopItems() {
  try {
    const res = await api.get('/admin/shop-items')
    if (res.success) {
      shopItems.value = res.data || []
    }
  } catch (e) {
    alert('加载商店物品失败：' + (e.message || '未知错误'))
  }
}

async function addItem() {
  if (!addForm.value.name) {
    alert('请输入物品名称')
    return
  }
  try {
    const res = await api.post('/admin/shop-items', addForm.value)
    if (res.success) {
      alert('物品已添加到商店')
      addForm.value = { name: '', type: '', attack: 0, defense: 0, neili_bonus: 0, tili_bonus: 0, price: 0, image_file: '', description: '', stock_quantity: 999, sort_no: 0 }
      loadShopItems()
    }
  } catch (e) {
    alert('添加失败：' + (e.message || '未知错误'))
  }
}

function editItem(item) {
  editingItem.value = item
  editForm.value = { ...item }
}

async function updateItem() {
  try {
    const res = await api.put(`/admin/shop-items/${editingItem.value.id}`, editForm.value)
    if (res.success) {
      alert('物品已更新')
      editingItem.value = null
      loadShopItems()
    }
  } catch (e) {
    alert('更新失败：' + (e.message || '未知错误'))
  }
}

async function deleteItem(id) {
  if (!confirm('确定要删除该物品吗？\n注意：已售出过的物品只能下架不能彻底删除。')) return
  try {
    const res = await api.delete(`/admin/shop-items/${id}`)
    if (res.success) {
      alert(res.message || '物品已删除')
      loadShopItems()
    }
  } catch (e) {
    alert('删除失败：' + (e.message || '未知错误'))
  }
}

async function toggleStatus(item) {
  try {
    const res = await api.put(`/admin/shop-items/${item.id}`, { is_enabled: !item.is_enabled })
    if (res.success) {
      alert(item.is_enabled ? '物品已下架' : '物品已上架')
      loadShopItems()
    }
  } catch (e) {
    alert('操作失败：' + (e.message || '未知错误'))
  }
}

function showRestock(item) {
  restockingItem.value = item
  restockQuantity.value = 100
}

async function doRestock() {
  if (!restockQuantity.value || restockQuantity.value < 1) {
    alert('请输入有效的补货数量')
    return
  }
  try {
    const res = await api.post(`/admin/shop-items/${restockingItem.value.id}/restock`, { quantity: restockQuantity.value })
    if (res.success) {
      alert('补货成功')
      restockingItem.value = null
      loadShopItems()
    }
  } catch (e) {
    alert('补货失败：' + (e.message || '未知错误'))
  }
}

onMounted(() => loadShopItems())
</script>

<style scoped>
.shop-management { padding: 20px; }
.section-title { color: #7eb8da; font-size: 18px; margin-bottom: 16px; border-left: 3px solid #f39c12; padding-left: 10px; }
.card { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; }
.subsection-title { color: #f39c12; font-size: 14px; margin-bottom: 12px; }
.action-bar { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.form-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.form-input { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; }
.form-select { padding: 8px 12px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; }
.form-input-small { width: 80px; padding: 8px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; border-radius: 4px; text-align: center; }
.btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #555; color: #fff; transition: all 0.3s; }
.btn:hover { opacity: 0.8; }
.btn-primary { background: #f39c12; }
.btn-warning { background: #e67e22; }
.btn-success { background: #27ae60; }
.btn-info { background: #2980b9; }
.btn-danger { background: #e74c3c; }
.btn-sm { padding: 4px 8px; font-size: 12px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
.data-table th { color: #f39c12; font-weight: 600; font-size: 14px; white-space: nowrap; }
.data-table td { font-size: 13px; }
.type-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
.type-weapon { background: #e74c3c; color: #fff; }
.type-armor { background: #3498db; color: #fff; }
.type-medicine { background: #27ae60; color: #fff; }
.type-poison { background: #8b0000; color: #fff; }
.type-other { background: #7f8c8d; color: #fff; }
.item-thumb { width: 32px; height: 32px; object-fit: contain; }
.price { color: #f39c12; font-weight: bold; }
.bonus-positive { color: #27ae60; }
.bonus-negative { color: #e74c3c; }
.low-stock { color: #e74c3c; font-weight: bold; }
.status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
.status-enabled { background: #27ae60; color: #fff; }
.status-disabled { background: #7f8c8d; color: #fff; }
.empty-text { text-align: center; color: #888; padding: 20px; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #1a202c; border-radius: 8px; padding: 24px; min-width: 400px; max-width: 600px; max-height: 80vh; overflow-y: auto; }
.modal h3 { color: #f39c12; margin-bottom: 16px; }
.modal-body { margin-bottom: 20px; }
.modal-body .form-row { margin-bottom: 12px; }
.modal-body label { color: #aaa; font-size: 14px; min-width: 80px; }
.modal-footer { display: flex; gap: 12px; justify-content: flex-end; }
</style>
