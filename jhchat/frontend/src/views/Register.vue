<template>
  <div class="register-page">
    <div class="ripple-bg login-bg">
      <div class="ripple-circle r1"></div>
      <div class="ripple-circle r2"></div>
    </div>
    <div class="register-card">
      <div class="register-header">
        <h1>拜师入门</h1>
        <p class="subtitle">注册新侠客</p>
      </div>
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label>侠名</label>
          <input v-model="form.username" type="text" placeholder="请输入用户名" />
          <span v-if="errors.username" class="field-error">{{ errors.username }}</span>
        </div>
        <div class="form-group">
          <label>口令</label>
          <input v-model="form.password" type="password" placeholder="请输入密码" />
          <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
        </div>
        <div class="form-group">
          <label>确认口令</label>
          <input v-model="form.confirmPassword" type="password" placeholder="再次输入密码" />
          <span v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</span>
        </div>
        <div class="form-group">
          <label>性别</label>
          <select v-model="form.gender">
            <option value="">请选择</option>
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
          <span v-if="errors.gender" class="field-error">{{ errors.gender }}</span>
        </div>
        <div class="form-group">
          <label>邮箱</label>
          <input v-model="form.email" type="email" placeholder="选填" />
        </div>
        <div class="form-group">
          <label>介绍人</label>
          <input v-model="form.referrer" type="text" placeholder="选填" />
        </div>
        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        <button type="submit" class="btn btn-primary register-btn" :disabled="loading">
          {{ loading ? '注册中...' : '拜入江湖' }}
        </button>
      </form>
      <div class="register-footer">
        <router-link to="/login">已有账号？前往登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  gender: '',
  email: '',
  referrer: ''
})
const errors = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  gender: ''
})
const loading = ref(false)
const errorMsg = ref('')

function validate() {
  let valid = true
  errors.username = ''
  errors.password = ''
  errors.confirmPassword = ''
  errors.gender = ''

  if (!form.username.trim()) {
    errors.username = '请输入用户名'
    valid = false
  } else if (form.username.length < 2 || form.username.length > 20) {
    errors.username = '用户名需2-20个字符'
    valid = false
  }
  if (!form.password) {
    errors.password = '请输入密码'
    valid = false
  } else if (form.password.length < 6) {
    errors.password = '密码至少6个字符'
    valid = false
  }
  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = '两次密码不一致'
    valid = false
  }
  if (!form.gender) {
    errors.gender = '请选择性别'
    valid = false
  }
  return valid
}

async function handleRegister() {
  if (!validate()) return
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await userStore.register({
      username: form.username,
      password: form.password,
      confirmPassword: form.confirmPassword,
      gender: form.gender,
      email: form.email,
      referrer: form.referrer
    })
    if (res.success) {
      const loginRes = await userStore.login(form.username, form.password)
      if (loginRes.success) {
        router.push('/main')
      } else {
        router.push('/login')
      }
    } else {
      errorMsg.value = res.message || '注册失败'
    }
  } catch (err) {
    errorMsg.value = err.message || '注册失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.ripple-circle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(74, 124, 89, 0.08) 0%, transparent 70%);
  animation: ripple 5s ease-out infinite;
}

.r1 {
  width: 350px;
  height: 350px;
  top: 20%;
  right: 20%;
  animation-delay: 0s;
}

.r2 {
  width: 280px;
  height: 280px;
  bottom: 15%;
  left: 25%;
  animation-delay: 2s;
}

@keyframes ripple {
  0% { transform: scale(0.8); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}

.register-card {
  position: relative;
  z-index: 1;
  background: rgba(26, 26, 46, 0.95);
  border: 1px solid rgba(74, 124, 89, 0.3);
  border-radius: 12px;
  padding: 36px;
  width: 440px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 60px rgba(74, 124, 89, 0.1);
}

.register-header {
  text-align: center;
  margin-bottom: 24px;
}

.register-header h1 {
  font-size: 28px;
  color: #7eb8da;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.6);
  letter-spacing: 6px;
}

.subtitle {
  color: #888;
  margin-top: 6px;
  font-size: 14px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  color: #aaa;
  font-size: 13px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 9px 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: #eee;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4B87C3;
}

.field-error {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 2px;
  display: block;
}

.error-msg {
  color: #e74c3c;
  font-size: 13px;
  margin-bottom: 12px;
  text-align: center;
}

.register-btn {
  width: 100%;
  padding: 11px;
  font-size: 16px;
  letter-spacing: 4px;
  border-radius: 6px;
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-footer {
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
}
</style>
