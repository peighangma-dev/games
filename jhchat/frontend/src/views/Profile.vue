<template>
  <div class="profile-page">
    <div class="nav-bar">
      <router-link to="/main">首页</router-link>
      <router-link to="/chat">聊天</router-link>
      <span class="nav-spacer"></span>
      <span class="nav-user">{{ userStore.username }}</span>
    </div>

    <div class="page-container">
      <div class="title-bar">
        <h1>侠客状态</h1>
      </div>

      <div v-if="profile" class="profile-content">
        <div class="profile-card card">
          <div class="avatar-section">
            <div class="avatar-box">
              <img v-if="profile.avatar" :src="profile.avatar" alt="头像" class="avatar-img" />
              <div v-else class="avatar-placeholder">无头像</div>
            </div>
            <div class="avatar-actions">
              <label class="btn btn-sm btn-upload">
                上传头像
                <input type="file" accept=".gif,.jpg,.jpeg,.png" @change="uploadAvatar" hidden />
              </label>
            </div>
          </div>

          <div class="attrs-grid">
            <div class="attr-item">
              <span class="attr-label">侠名</span>
              <span class="attr-value name-value">{{ profile.username }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">性别</span>
              <span class="attr-value">{{ profile.gender === 'male' ? '男' : '女' }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">等级</span>
              <span class="attr-value grade-value">{{ profile.grade }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">门派</span>
              <span class="attr-value">{{ profile.sect || '无' }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">门派职位</span>
              <span class="attr-value">{{ profile.sect_title || '无' }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">攻击</span>
              <span class="attr-value combat">{{ profile.attack || 0 }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">防御</span>
              <span class="attr-value combat">{{ profile.defense || 0 }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">武功</span>
              <span class="attr-value combat">{{ profile.wugong || 0 }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">内力</span>
              <span class="attr-value">{{ profile.neili || 0 }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">体力</span>
              <span class="attr-value">{{ profile.tili || 0 }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">魅力</span>
              <span class="attr-value">{{ profile.charm || 0 }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">银两</span>
              <span class="attr-value silver-value">{{ profile.silver || 0 }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">配偶</span>
              <span class="attr-value">{{ profile.spouse || '无' }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">师父</span>
              <span class="attr-value">{{ profile.master || '无' }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">状态</span>
              <span :class="['attr-value', 'status-' + (profile.status || 'alive')]">{{ statusText(profile.status) }}</span>
            </div>
          </div>
        </div>

        <div class="profile-actions card">
          <h3 class="section-title">操作</h3>
          <div class="action-buttons">
            <button class="btn btn-primary" @click="showChangePwd = true">修改密码</button>
            <button v-if="profile.status !== 'dead'" class="btn btn-danger" @click="handleSuicide">自杀</button>
            <button v-if="profile.status === 'dead'" class="btn btn-primary" @click="handleRevive">复生</button>
          </div>
        </div>
      </div>

      <div v-else class="loading">加载中...</div>

      <div v-if="showChangePwd" class="modal-overlay" @click.self="showChangePwd = false">
        <div class="modal-card card">
          <h3>修改密码</h3>
          <div class="form-group">
            <label>旧密码</label>
            <input v-model="pwdForm.oldPassword" type="password" />
          </div>
          <div class="form-group">
            <label>新密码</label>
            <input v-model="pwdForm.newPassword" type="password" />
          </div>
          <div class="form-group">
            <label>确认新密码</label>
            <input v-model="pwdForm.confirmPassword" type="password" />
          </div>
          <div v-if="pwdError" class="error-msg">{{ pwdError }}</div>
          <div class="modal-actions">
            <button class="btn btn-primary" @click="changePassword">确认</button>
            <button class="btn" @click="showChangePwd = false">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const userStore = useUserStore()
const profile = ref(null)
const showChangePwd = ref(false)
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdError = ref('')

function statusText(status) {
  const map = { alive: '正常', dead: '已故', jailed: '入狱' }
  return map[status] || '正常'
}

async function loadProfile() {
  try {
    const res = await api.get('/users/me')
    if (res.success) profile.value = res.data
  } catch (e) {}
}

async function uploadAvatar(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const formData = new FormData()
  formData.append('avatar', file)
  try {
    const res = await api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.success) {
      await loadProfile()
    }
  } catch (err) {}
}

async function changePassword() {
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    pwdError.value = '两次密码不一致'
    return
  }
  if (pwdForm.newPassword.length < 6) {
    pwdError.value = '新密码至少6个字符'
    return
  }
  try {
    const res = await api.put('/auth/password', {
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    })
    if (res.success) {
      showChangePwd.value = false
      pwdForm.oldPassword = ''
      pwdForm.newPassword = ''
      pwdForm.confirmPassword = ''
      pwdError.value = ''
    } else {
      pwdError.value = res.message || '修改失败'
    }
  } catch (err) {
    pwdError.value = err.message || '修改失败'
  }
}

async function handleSuicide() {
  if (!confirm('确定要自杀吗？死后将无法操作，需要复生。')) return
  try {
    const res = await api.post('/auth/suicide')
    if (res.success) await loadProfile()
  } catch (e) {}
}

async function handleRevive() {
  try {
    const res = await api.post('/auth/revive')
    if (res.success) await loadProfile()
  } catch (e) {}
}

onMounted(() => {
  loadProfile()
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

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.avatar-box {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(75, 135, 195, 0.4);
  margin-bottom: 10px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  color: #666;
  font-size: 13px;
}

.btn-upload {
  cursor: pointer;
}

.attrs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.attr-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.attr-label {
  color: #888;
  font-size: 12px;
}

.attr-value {
  color: #eee;
  font-size: 15px;
}

.name-value {
  color: #7eb8da;
  font-size: 18px;
  font-weight: bold;
}

.grade-value {
  color: #f0c040;
  font-weight: bold;
}

.combat {
  color: #e8a0bf;
}

.silver-value {
  color: #f0c040;
}

.status-alive {
  color: #4a7c59;
}

.status-dead {
  color: #e74c3c;
}

.status-jailed {
  color: #e67e22;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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
  width: 400px;
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

.loading {
  text-align: center;
  color: #666;
  padding: 40px;
}

.nav-spacer {
  flex: 1;
}

.nav-user {
  color: #7eb8da;
  padding: 10px 12px;
}

@media (max-width: 600px) {
  .attrs-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
