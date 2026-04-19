<template>
  <PageLayout>
    <div class="marriage-page">
      <div class="page-container">
        <div class="title-bar">
        <h1>月老祠</h1>
      </div>

      <div class="card" v-if="userStore.profile">
        <h3 class="section-title">婚姻状态</h3>
        <div class="marriage-status">
          <span v-if="userStore.profile.spouse && userStore.profile.spouse !== '无'" class="married">
            已婚 - 配偶: {{ userStore.profile.spouse }}
          </span>
          <span v-else class="single">未婚</span>
        </div>
        <div class="marriage-actions">
          <button v-if="!userStore.profile.spouse || userStore.profile.spouse === '无'" class="btn btn-primary" @click="showPropose = true">求婚</button>
          <button v-if="userStore.profile.spouse && userStore.profile.spouse !== '无'" class="btn btn-danger" @click="handleDivorce">离婚</button>
        </div>
      </div>

      <div class="card">
        <h3 class="section-title">求婚列表</h3>
        <div class="proposal-list">
          <div v-for="p in proposals" :key="p.id" class="proposal-item">
            <span class="proposal-from">{{ p.from_username || p.proposer }}</span>
            <span class="proposal-msg">{{ p.message || '' }}</span>
            <div class="proposal-actions">
              <button class="btn btn-sm btn-primary" @click="acceptProposal(p)">接受</button>
              <button class="btn btn-sm" @click="rejectProposal(p)">拒绝</button>
            </div>
          </div>
          <div v-if="proposals.length === 0" class="empty-text">暂无求婚</div>
        </div>
      </div>

      <div class="card">
        <h3 class="section-title">征婚启事</h3>
        <div class="inn-list">
          <div v-for="item in innList" :key="item.id" class="inn-item">
            <span class="inn-name">{{ item.username }}</span>
            <span class="inn-msg">{{ item.message || item.content }}</span>
          </div>
          <div v-if="innList.length === 0" class="empty-text">暂无征婚</div>
        </div>
        <div class="inn-post">
          <input v-model="innMessage" type="text" placeholder="征婚宣言" class="inn-input" />
          <button class="btn btn-sm btn-primary" @click="postInn">发布征婚</button>
        </div>
      </div>

      <div v-if="showPropose" class="modal-overlay" @click.self="showPropose = false">
        <div class="modal-card card">
          <h3>求婚</h3>
          <div class="form-group">
            <label>对方侠名</label>
            <input v-model="proposeTarget" type="text" placeholder="输入用户名" />
          </div>
          <div class="form-group">
            <label>求婚词</label>
            <textarea v-model="proposeMessage" rows="3" placeholder="说点什么"></textarea>
          </div>
          <div v-if="proposeError" class="error-msg">{{ proposeError }}</div>
          <div class="modal-actions">
            <button class="btn btn-primary" @click="handlePropose">求婚</button>
            <button class="btn" @click="showPropose = false">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'
import PageLayout from '../components/PageLayout.vue'

const userStore = useUserStore()

const proposals = ref([])
const innList = ref([])
const showPropose = ref(false)
const proposeTarget = ref('')
const proposeMessage = ref('')
const proposeError = ref('')
const innMessage = ref('')

async function loadProposals() {
  try {
    const res = await api.get('/marriage/proposals')
    if (res.success) proposals.value = res.data || []
  } catch (e) {}
}

async function loadInn() {
  try {
    const res = await api.get('/marriage/inn')
    if (res.success) innList.value = res.data || []
  } catch (e) {}
}

async function handlePropose() {
  if (!proposeTarget.value.trim()) {
    proposeError.value = '请输入对方侠名'
    return
  }
  try {
    const res = await api.post('/marriage/propose', {
      target: proposeTarget.value,
      message: proposeMessage.value
    })
    if (res.success) {
      showPropose.value = false
      proposeTarget.value = ''
      proposeMessage.value = ''
      proposeError.value = ''
      loadProposals()
    } else {
      proposeError.value = res.message || '求婚失败'
    }
  } catch (err) {
    proposeError.value = err.message || '求婚失败'
  }
}

async function acceptProposal(p) {
  try {
    const res = await api.post('/marriage/accept', {
      proposer: p.from_username || p.proposer
    })
    if (res.success) {
      await userStore.fetchProfile()
      loadProposals()
    } else {
      alert(res.message || '接受失败')
    }
  } catch (err) {
    alert(err.message || '接受失败')
  }
}

async function rejectProposal(p) {
  loadProposals()
}

async function handleDivorce() {
  if (!confirm('确定要离婚吗？')) return
  try {
    const res = await api.post('/marriage/divorce')
    if (res.success) {
      await userStore.fetchProfile()
    } else {
      alert(res.message || '离婚失败')
    }
  } catch (err) {
    alert(err.message || '离婚失败')
  }
}

async function postInn() {
  if (!innMessage.value.trim()) return
  try {
    const res = await api.post('/marriage/inn', { message: innMessage.value })
    if (res.success) {
      innMessage.value = ''
      loadInn()
    }
  } catch (e) {}
}

onMounted(() => {
  userStore.fetchProfile()
  loadProposals()
  loadInn()
})
</script>

<style scoped>
.section-title {
  color: #7eb8da;
  font-size: 16px;
  margin-bottom: 12px;
  border-left: 3px solid #4B87C3;
  padding-left: 10px;
}

.marriage-status {
  margin-bottom: 12px;
  font-size: 16px;
}

.married {
  color: #e8a0bf;
}

.single {
  color: #888;
}

.marriage-actions {
  display: flex;
  gap: 10px;
}

.proposal-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.proposal-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.proposal-from {
  color: #e8a0bf;
  font-weight: bold;
  min-width: 80px;
}

.proposal-msg {
  flex: 1;
  color: #aaa;
  font-size: 13px;
}

.proposal-actions {
  display: flex;
  gap: 6px;
}

.inn-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.inn-item {
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  display: flex;
  gap: 10px;
}

.inn-name {
  color: #e8a0bf;
  font-weight: bold;
  min-width: 80px;
}

.inn-msg {
  color: #ccc;
  font-size: 13px;
}

.inn-post {
  display: flex;
  gap: 8px;
}

.inn-input {
  flex: 1;
}

.empty-text {
  text-align: center;
  color: #666;
  padding: 16px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-card {
  width: 420px;
  max-width: 90vw;
}

.modal-card h3 {
  color: #7eb8da;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  color: #aaa;
  font-size: 13px;
}

.error-msg {
  color: #e74c3c;
  font-size: 13px;
  margin-bottom: 10px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
</style>
