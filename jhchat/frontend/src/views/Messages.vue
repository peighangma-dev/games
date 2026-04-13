<template>
  <div class="messages-page">
    <div class="nav-bar">
      <router-link to="/main">首页</router-link>
      <router-link to="/chat">聊天</router-link>
      <span class="nav-spacer"></span>
      <router-link to="/profile">{{ userStore.username }}</router-link>
    </div>

    <div class="page-container">
      <div class="title-bar">
        <h1>飞鸽传书</h1>
      </div>

      <div class="msg-tabs">
        <span :class="['msg-tab', { active: tab === 'inbox' }]" @click="switchTab('inbox')">
          收件箱 <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
        </span>
        <span :class="['msg-tab', { active: tab === 'sent' }]" @click="switchTab('sent')">发件箱</span>
        <span class="nav-spacer"></span>
        <button class="btn btn-primary btn-sm" @click="showCompose = true">写信</button>
      </div>

      <div class="msg-list">
        <div v-for="msg in currentList" :key="msg.id" :class="['msg-row card', { 'msg-unread': !msg.is_read && tab === 'inbox' }]" @click="viewMessage(msg)">
          <div class="msg-from">
            <span class="msg-label">{{ tab === 'inbox' ? '来自' : '发给' }}</span>
            <span class="msg-name">{{ tab === 'inbox' ? msg.sender : msg.receiver }}</span>
          </div>
          <div class="msg-subject">{{ msg.subject || '(无主题)' }}</div>
          <div class="msg-time">{{ formatTime(msg.created_at) }}</div>
          <button class="btn btn-sm btn-danger" @click.stop="deleteMsg(msg.id)">删除</button>
        </div>
        <div v-if="currentList.length === 0" class="empty-text">暂无邮件</div>
      </div>

      <div v-if="showCompose" class="modal-overlay" @click.self="showCompose = false">
        <div class="modal-card card">
          <h3>写信</h3>
          <div class="form-group">
            <label>收件人</label>
            <input v-model="compose.receiver" type="text" placeholder="用户名" />
          </div>
          <div class="form-group">
            <label>主题</label>
            <input v-model="compose.subject" type="text" placeholder="邮件主题" />
          </div>
          <div class="form-group">
            <label>内容</label>
            <textarea v-model="compose.content" rows="5" placeholder="邮件内容"></textarea>
          </div>
          <div v-if="composeError" class="error-msg">{{ composeError }}</div>
          <div class="modal-actions">
            <button class="btn btn-primary" @click="sendMessage">发送</button>
            <button class="btn" @click="showCompose = false">取消</button>
          </div>
        </div>
      </div>

      <div v-if="showDetail" class="modal-overlay" @click.self="showDetail = false">
        <div class="modal-card card">
          <h3>{{ detailMsg?.subject || '(无主题)' }}</h3>
          <div class="detail-meta">
            <span>来自: {{ detailMsg?.sender }}</span>
            <span>时间: {{ formatTime(detailMsg?.created_at) }}</span>
          </div>
          <div class="detail-body">{{ detailMsg?.content }}</div>
          <div class="modal-actions">
            <button class="btn" @click="showDetail = false">关闭</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const userStore = useUserStore()

const tab = ref('inbox')
const inbox = ref([])
const sent = ref([])
const unreadCount = ref(0)
const showCompose = ref(false)
const showDetail = ref(false)
const detailMsg = ref(null)
const composeError = ref('')

const compose = reactive({
  receiver: '',
  subject: '',
  content: ''
})

const currentList = computed(() => tab.value === 'inbox' ? inbox.value : sent.value)

function formatTime(t) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN')
}

function switchTab(t) {
  tab.value = t
}

async function loadInbox() {
  try {
    const res = await api.get('/messages/inbox')
    if (res.success) inbox.value = res.data || []
  } catch (e) {}
}

async function loadSent() {
  try {
    const res = await api.get('/messages/sent')
    if (res.success) sent.value = res.data || []
  } catch (e) {}
}

async function loadUnread() {
  try {
    const res = await api.get('/messages/unread-count')
    if (res.success) unreadCount.value = res.data?.count || 0
  } catch (e) {}
}

async function viewMessage(msg) {
  if (tab.value === 'inbox' && !msg.is_read) {
    try {
      await api.get(`/messages/${msg.id}`)
      msg.is_read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (e) {}
  }
  detailMsg.value = msg
  showDetail.value = true
}

async function deleteMsg(id) {
  if (!confirm('确定删除此邮件？')) return
  try {
    await api.delete(`/messages/${id}`)
    if (tab.value === 'inbox') {
      inbox.value = inbox.value.filter(m => m.id !== id)
    } else {
      sent.value = sent.value.filter(m => m.id !== id)
    }
  } catch (e) {}
}

async function sendMessage() {
  if (!compose.receiver.trim()) {
    composeError.value = '请输入收件人'
    return
  }
  if (!compose.content.trim()) {
    composeError.value = '请输入内容'
    return
  }
  try {
    const res = await api.post('/messages', {
      receiver: compose.receiver,
      subject: compose.subject,
      content: compose.content
    })
    if (res.success) {
      showCompose.value = false
      compose.receiver = ''
      compose.subject = ''
      compose.content = ''
      composeError.value = ''
      loadSent()
    } else {
      composeError.value = res.message || '发送失败'
    }
  } catch (err) {
    composeError.value = err.message || '发送失败'
  }
}

onMounted(() => {
  loadInbox()
  loadSent()
  loadUnread()
})
</script>

<style scoped>
.msg-tabs {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.msg-tab {
  padding: 10px 20px;
  cursor: pointer;
  color: #888;
  font-size: 14px;
  transition: all 0.2s;
}

.msg-tab.active {
  color: #7eb8da;
  border-bottom: 2px solid #4B87C3;
}

.msg-tab:hover {
  color: #ccc;
}

.badge {
  display: inline-block;
  background: #e74c3c;
  color: #fff;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 8px;
  margin-left: 4px;
}

.msg-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.msg-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.15s;
}

.msg-row:hover {
  border-color: #4B87C3;
}

.msg-unread {
  border-left: 3px solid #4B87C3;
}

.msg-from {
  min-width: 100px;
}

.msg-label {
  color: #888;
  font-size: 11px;
  display: block;
}

.msg-name {
  color: #7eb8da;
  font-size: 14px;
}

.msg-subject {
  flex: 1;
  color: #ccc;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.msg-time {
  color: #666;
  font-size: 12px;
  white-space: nowrap;
}

.empty-text {
  text-align: center;
  color: #666;
  padding: 30px;
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
  width: 500px;
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

.detail-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  color: #888;
  font-size: 13px;
}

.detail-body {
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 4px;
  color: #ccc;
  line-height: 1.6;
  min-height: 80px;
  white-space: pre-wrap;
}

.nav-spacer {
  flex: 1;
}
</style>
