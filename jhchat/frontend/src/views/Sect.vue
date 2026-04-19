<template>
  <PageLayout>
    <div class="sect-page">
      <div class="page-container">
        <div class="title-bar">
          <h1>门派</h1>
          <button v-if="!userSect || userSect === '无'" class="btn btn-primary" @click="showCreateModal = true">创建门派</button>
        </div>

        <div v-if="!selectedSect" class="sect-list">
          <div v-for="s in sects" :key="s.name" class="sect-card card" @click="viewSect(s.name)">
            <div class="sect-name" :class="{ 'liushan-special': s.name === '六扇门' }">
              {{ s.name }}
              <span v-if="s.name === '六扇门'" class="gov-badge">朝廷</span>
            </div>
            <div class="sect-info">
              <span>掌门：{{ s.leader || '无' }}</span>
              <span>成员：{{ s.member_count || 0 }}</span>
            </div>
          </div>
          <div v-if="sects.length === 0" class="empty-text">暂无门派</div>
        </div>

        <div v-else class="sect-detail">
          <button class="btn btn-sm" @click="selectedSect = null">返回列表</button>
          <div class="card" v-if="sectDetail">
            <h2 class="sect-title">
              {{ sectDetail.name }}
              <span v-if="sectDetail.name === '六扇门'" class="gov-badge">朝廷</span>
            </h2>
            
            <div v-if="sectDetail.name === '六扇门'" class="special-notice">
              <strong>📜 朝廷禁令：</strong>六扇门乃朝廷捕快机构，只招收官府人员（等级 10 以上），不可创建，不可解散。
            </div>
            
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">掌门</span>
                <span class="value">{{ sectDetail.leader || '无' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">成员数</span>
                <span class="value">{{ sectDetail.member_count || 0 }}</span>
              </div>
              <div class="detail-item">
                <span class="label">性别限制</span>
                <span class="value">{{ genderText(sectDetail.fit_gender) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">介绍</span>
                <span class="value">{{ sectDetail.description || '暂无' }}</span>
              </div>
            </div>
            
            <div v-if="sectDetail.slogan || sectDetail.rules" class="sect-extra">
              <div v-if="sectDetail.slogan" class="extra-item">
                <span class="label">门派口号</span>
                <span class="value">{{ sectDetail.slogan }}</span>
              </div>
              <div v-if="sectDetail.rules" class="extra-item">
                <span class="label">门规</span>
                <span class="value">{{ sectDetail.rules }}</span>
              </div>
            </div>
            
            <div class="sect-actions">
              <button v-if="userSect !== sectDetail.name && !isLiushan" class="btn btn-primary" @click="joinSect(sectDetail.name)">加入门派</button>
              <button v-if="userSect === sectDetail.name" class="btn btn-danger" @click="leaveSect">离开门派</button>
            </div>
          </div>

          <div class="card">
            <h3 class="section-title">我的门派信息</h3>
            <div v-if="mySectInfo" class="info-grid">
              <div class="info-item">
                <span class="label">所在门派</span>
                <span class="value">{{ mySectInfo.sect.name }}</span>
              </div>
              <div class="info-item">
                <span class="label">门派身份</span>
                <span class="value">{{ mySectInfo.sect.title }}</span>
              </div>
              <div class="info-item">
                <span class="label">掌门</span>
                <span class="value">{{ mySectInfo.sect.leader }}</span>
              </div>
              <div class="info-item">
                <span class="label">门派人数</span>
                <span class="value">{{ mySectInfo.sect.memberCount }}</span>
              </div>
            </div>
            <div v-if="mySectInfo" class="salary-section">
              <div class="salary-info">
                <span>💰 今日俸禄：<strong>{{ mySectInfo.salary.amount }} 两</strong></span>
                <span v-if="mySectInfo.salary.canClaim" class="salary-tip">（可领取）</span>
              </div>
              <button 
                v-if="mySectInfo.salary.canClaim" 
                class="btn btn-success" 
                @click="claimSalary"
              >
                领取俸禄
              </button>
              <button v-else class="btn btn-disabled" disabled>
                已领取
              </button>
            </div>
          </div>

          <div class="card">
            <h3 class="section-title">门派成员</h3>
            <div class="member-list">
              <div v-for="m in sectMembers" :key="m.username" class="member-item">
                <span class="member-name">{{ m.username }}</span>
                <span class="member-title">{{ m.sect_title }}</span>
                <span class="member-grade">等级{{ m.grade }}</span>
              </div>
              <div v-if="sectMembers.length === 0" class="empty-text">暂无成员</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建门派弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal-dialog" @click.stop>
        <h3 class="modal-title">创建门派</h3>
        <div class="form-group">
          <label>门派名称</label>
          <input v-model="createForm.name" type="text" class="form-input" placeholder="输入门派名称" />
        </div>
        <div class="form-group">
          <label>门派口号</label>
          <input v-model="createForm.slogan" type="text" class="form-input" placeholder="可选，一句话概括门派精神" />
        </div>
        <div class="form-group">
          <label>门派介绍</label>
          <textarea v-model="createForm.description" class="form-input" rows="3" placeholder="可选，门派简介"></textarea>
        </div>
        <div class="form-group">
          <label>门规</label>
          <input v-model="createForm.rules" type="text" class="form-input" placeholder="可选，门规戒条" />
        </div>
        <div class="form-group">
          <label>性别限制</label>
          <select v-model="createForm.fit_gender" class="form-input">
            <option value="both">男女不限</option>
            <option value="male">仅收男性</option>
            <option value="female">仅收女性</option>
          </select>
        </div>
        <div class="create-cost-hint">
          💰 创建费用：<strong>100 万两银子</strong>（需等级 5 以上）
        </div>
        <div class="modal-actions">
          <button class="btn" @click="showCreateModal = false">取消</button>
          <button class="btn btn-primary" @click="createSect" :disabled="creating">创建</button>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'
import PageLayout from '../components/PageLayout.vue'

const userStore = useUserStore()

const sects = ref([])
const selectedSect = ref(null)
const sectDetail = ref(null)
const sectMembers = ref([])
const showCreateModal = ref(false)
const creating = ref(false)
const mySectInfo = ref(null)

const createForm = ref({
  name: '',
  slogan: '',
  description: '',
  rules: '',
  fit_gender: 'both'
})

const userSect = computed(() => userStore.profile?.sect || userStore.user?.sect || '无')
const isLiushan = computed(() => selectedSect.value === '六扇门')

function genderText(g) {
  if (g === 'male') return '仅男性'
  if (g === 'female') return '仅女性'
  return '不限'
}

async function loadSects() {
  try {
    const res = await api.get('/sects')
    if (res.success) sects.value = res.data || []
  } catch (e) {}
}

async function loadMySectInfo() {
  try {
    const res = await api.get('/sects/info')
    if (res.success && res.data.hasSect) {
      mySectInfo.value = res.data
    }
  } catch (e) {
    console.error('Load sect info failed:', e)
  }
}

async function claimSalary() {
  try {
    const res = await api.post('/sects/checkin')
    if (res.success) {
      alert(`✅ 领取俸禄 ${res.data.amount} 两`)
      await userStore.fetchProfile()
      loadMySectInfo()
    } else {
      alert('❌ ' + res.message)
    }
  } catch (e) {
    alert('❌ 领取失败：' + (e.message || '未知错误'))
  }
}

async function viewSect(name) {
  selectedSect.value = name
  try {
    const res = await api.get(`/sects/${name}`)
    if (res.success) sectDetail.value = res.data
  } catch (e) {}
  try {
    const res = await api.get(`/sects/${name}/members`)
    if (res.success) sectMembers.value = res.data || []
  } catch (e) {}
}

async function joinSect(name) {
  try {
    const res = await api.post('/commands/join-sect', { target: name })
    if (res.success) {
      await userStore.fetchProfile()
      viewSect(name)
    } else {
      alert(res.message || '加入失败')
    }
  } catch (err) {
    alert(err.message || '加入失败')
  }
}

async function leaveSect() {
  if (!confirm('离开门派需扣除 5 万两和 500 内力，确定离开？')) return
  try {
    const res = await api.post('/commands/leave-sect')
    if (res.success) {
      await userStore.fetchProfile()
      selectedSect.value = null
      loadSects()
    } else {
      alert(res.message || '离开失败')
    }
  } catch (err) {
    alert(err.message || '离开失败')
  }
}

async function createSect() {
  if (!createForm.value.name) {
    alert('请输入门派名称')
    return
  }
  
  if (createForm.value.name === '六扇门') {
    alert('六扇门是朝廷机构，不可创建')
    return
  }
  
  creating.value = true
  try {
    const res = await api.post('/sects/create', createForm.value)
    if (res.success) {
      alert(res.message || '创建成功')
      await userStore.fetchProfile()
      showCreateModal.value = false
      loadSects()
      createForm.value = { name: '', slogan: '', description: '', rules: '', fit_gender: 'both' }
    } else {
      alert(res.message || '创建失败')
    }
  } catch (err) {
    alert(err.message || '创建失败')
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  loadSects()
  loadMySectInfo()
})
</script>

<style scoped>
.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title-bar h1 {
  color: #7eb8da;
  font-size: 24px;
  margin: 0;
}

.section-title {
  color: #7eb8da;
  font-size: 16px;
  margin-bottom: 12px;
  border-left: 3px solid #4B87C3;
  padding-left: 10px;
}

.gov-badge {
  display: inline-block;
  background: linear-gradient(135deg, #c9a040, #f0d060);
  color: #2d1f00;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 3px;
  margin-left: 8px;
  vertical-align: middle;
}

.liushan-special {
  color: #f0d060 !important;
}

.special-notice {
  background: linear-gradient(135deg, rgba(201, 60, 60, 0.15), rgba(180, 40, 40, 0.1));
  border: 1px solid #c93c3c;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
  color: #ff9999;
  font-size: 13px;
}

.special-notice strong {
  color: #ffb3b3;
}

.sect-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.sect-card {
  cursor: pointer;
  transition: all 0.2s;
}

.sect-card:hover {
  border-color: #4B87C3;
  transform: translateY(-2px);
}

.sect-name {
  color: #7eb8da;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.sect-info {
  display: flex;
  gap: 16px;
  color: #aaa;
  font-size: 13px;
}

.sect-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sect-title {
  color: #7eb8da;
  font-size: 22px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.sect-extra {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 12px;
  margin: 12px 0;
}

.extra-item {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.extra-item:last-child {
  margin-bottom: 0;
}

.extra-item .label {
  color: #888;
  font-size: 12px;
  min-width: 70px;
}

.extra-item .value {
  color: #ccc;
  font-size: 13px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  color: #888;
  font-size: 12px;
}

.info-item .value {
  color: #eee;
  font-size: 14px;
  font-weight: bold;
}

.salary-section {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 6px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.salary-info {
  color: #ffc107;
  font-size: 14px;
}

.salary-info strong {
  font-size: 18px;
  margin: 0 6px;
}

.salary-tip {
  color: #2ecc71;
  font-size: 12px;
}

.btn-success {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
}

.btn-disabled {
  background: #555;
  color: #888;
  cursor: not-allowed;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-item .label {
  color: #888;
  font-size: 12px;
}

.detail-item .value {
  color: #eee;
  font-size: 14px;
}

.sect-actions {
  display: flex;
  gap: 10px;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.member-name {
  color: #7eb8da;
  font-size: 14px;
}

.member-title {
  color: #f0c040;
  font-size: 13px;
}

.member-grade {
  color: #888;
  font-size: 12px;
  margin-left: auto;
}

.empty-text {
  text-align: center;
  color: #666;
  padding: 20px;
}

/* 创建门派弹窗 */
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

.modal-dialog {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border: 1px solid #4B87C3;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(75, 135, 195, 0.2);
}

.modal-title {
  color: #7eb8da;
  font-size: 20px;
  margin-bottom: 20px;
  text-align: center;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  color: #aaa;
  font-size: 13px;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #3a4a5a;
  border-radius: 4px;
  color: #eee;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #4B87C3;
}

textarea.form-input {
  resize: vertical;
  min-height: 60px;
}

.create-cost-hint {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 6px;
  padding: 10px 14px;
  margin: 16px 0;
  color: #ffc107;
  font-size: 13px;
  text-align: center;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-dialog {
    width: 95%;
    padding: 20px;
  }
}
</style>
