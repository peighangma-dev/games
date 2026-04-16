<template>
  <div class="chat-page">
    <div class="chat-header">
      <span class="room-name">{{ currentRoomName }}</span>
      <select v-model="currentRoomId" @change="changeRoom" class="room-select">
        <option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.name }}</option>
      </select>
      <router-link to="/main" class="back-link">返回大厅</router-link>
    </div>

    <div class="chat-body">
      <div class="chat-main" ref="chatMainRef">
        <div class="chat-tabs">
          <span :class="['chat-tab', { active: chatTab === 'public' }]" @click="chatTab = 'public'">公聊</span>
          <span :class="['chat-tab', { active: chatTab === 'private' }]" @click="switchToPrivateTab">
            私聊
            <span v-if="privateUnreadCount > 0" class="unread-badge">{{ privateUnreadCount }}</span>
          </span>
        </div>
        
        <!-- 私聊对象筛选（仅在私聊 tab 显示） -->
        <div v-if="chatTab === 'private'" class="private-filter">
          <select v-model="privateFilterUser" class="private-filter-select" @change="filterPrivateMessages">
            <option value="">所有私聊</option>
            <option v-for="user in privateChatUsers" :key="user" :value="user">{{ user }}</option>
          </select>
        </div>
        <div class="messages-area" ref="messagesRef">
          <div
            v-for="msg in filteredMessages"
            :key="msg.id"
            :class="['msg-item', { 'msg-system': msg.sender === '系统', 'msg-private': msg.is_private, 'msg-action': msg.is_action }]"
          >
            <template v-if="msg.sender === '系统'">
              <span class="system-text" v-html="msg.content"></span>
            </template>
            <template v-else-if="msg.is_action">
              <span class="action-text" v-html="msg.content"></span>
            </template>
            <template v-else>
              <span class="msg-sender" :style="{ color: '#' + msg.sender_color }" @click="selectReceiver(msg.sender)" @dblclick="quickPrivateChat(msg.sender)">{{ msg.sender }}</span>
              <span class="msg-arrow" v-if="msg.is_private">悄悄对</span>
              <span class="msg-receiver" v-if="msg.is_private && msg.receiver" @click="selectReceiver(msg.receiver)" @dblclick="quickPrivateChat(msg.receiver)">{{ msg.receiver }}</span>
              <span class="msg-arrow" v-if="msg.is_private">说：</span>
              <span class="msg-arrow" v-else>说：</span>
              <span class="msg-content" :style="{ color: '#' + msg.msg_color }" v-html="msg.content"></span>
            </template>
            <span class="msg-timestamp">{{ formatMessageTime(msg.created_at) }}</span>
          </div>
          <div v-if="filteredMessages.length === 0" class="empty-msg">暂无消息</div>
        </div>
      </div>

      <div class="chat-sidebar">
        <div class="sidebar-section">
          <div class="user-list-header">
            <h4>在线用户 ({{ filteredOnlineUsers.length }})</h4>
            <input 
              v-model="userSearchQuery" 
              type="text" 
              placeholder="搜索用户..." 
              class="user-search-input"
            />
          </div>
          <div class="user-list">
            <div
              v-for="u in filteredOnlineUsers"
              :key="u.user_id || u.username"
              :class="['user-item', { 'user-selected': receiver === u.username }]"
              @click="selectReceiver(u.username)"
            >
              <span :class="['gender-icon', u.gender]">{{ u.gender === 'female' ? '♀' : '♂' }}</span>
              <span class="user-name">{{ u.username }}</span>
              <span class="user-sect" v-if="u.sect && u.sect !== '无'">{{ u.sect }}</span>
            </div>
          </div>
          <div v-if="filteredOnlineUsers.length === 0" class="empty-user-list">
            暂无在线用户
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input-area">
      <div class="input-row-1">
        <div class="color-picker-group">
          <label>字色</label>
          <div class="color-swatches">
            <span
              v-for="c in colorOptions"
              :key="c"
              :class="['color-swatch', { active: senderColor === c }]"
              :style="{ background: '#' + c }"
              @click="senderColor = c"
            ></span>
          </div>
        </div>
        <div class="color-picker-group">
          <label>言色</label>
          <div class="color-swatches">
            <span
              v-for="c in colorOptions"
              :key="c"
              :class="['color-swatch', { active: msgColor === c }]"
              :style="{ background: '#' + c }"
              @click="msgColor = c"
            ></span>
          </div>
        </div>
      </div>
      <div class="input-row-2">
        <div class="input-field">
          <label>对话</label>
          <input v-model="receiver" type="text" placeholder="所有人" class="receiver-input" />
        </div>
        <div class="input-field">
          <label>动作</label>
          <select v-model="actionWord" class="action-select">
            <option value="">无</option>
            <option v-for="a in actions" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
        <div class="input-field">
          <label>表情</label>
          <div class="emoticon-grid">
            <span
              v-for="i in 16"
              :key="i"
              :class="['emoticon-btn', { active: selectedEmoticon === i }]"
              @click="insertEmoticon(i)"
            >[tu]{{ i }}[/tu]</span>
          </div>
        </div>
      </div>
      <div class="input-row-3">
        <div class="input-field cmd-field" v-if="showSlashMenu">
          <label>命令</label>
          <select v-model="slashCommand" class="cmd-select" @change="onSlashCommand">
            <option value="">选择命令...</option>
            <option v-for="cmd in commands" :key="cmd" :value="cmd">/{{ cmd }}</option>
          </select>
          <input v-model="cmdTarget" type="text" placeholder="目标" class="cmd-input" v-if="slashCommand" />
        </div>
        <label class="checkbox-label">
          <input type="checkbox" v-model="isPrivate" />
          私聊
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="showSlashMenu" />
          命令
        </label>
        <label class="filter-label">
          筛选:
          <select v-model="filterMode" class="filter-select">
            <option :value="0">全部</option>
            <option :value="1">公聊</option>
            <option :value="2">私聊</option>
          </select>
        </label>
      </div>
<div class="input-row-main">
  <input
    v-model="inputText"
    @input="onInputTextChanged"
    type="text"
    placeholder="输入消息..."
    class="msg-input"
    @keydown.enter="sendMessage"
  />
  <span class="char-count">{{ charCount }}/500</span>
  <button class="btn btn-primary send-btn" @click="sendMessage">发送</button>
  <button class="btn btn-sm" @click="sendAction" :disabled="!actionWord">动作</button>
</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useUserStore } from '../stores/user'
import { connectSocket, getSocket, disconnectSocket } from '../utils/socket'
import api from '../utils/api'

const userStore = useUserStore()

const rooms = ref([])
const currentRoomId = ref(1)
const currentRoomName = computed(() => {
  const r = rooms.value.find(r => r.id === currentRoomId.value)
  return r ? r.name : '聊天室'
})

const chatTab = ref('public')
const messages = ref([])
const roomOnlineUsers = ref([])
const messagesRef = ref(null)
const chatMainRef = ref(null)
const userSearchQuery = ref('')
const privateUnreadCount = ref(0)
const privateFilterUser = ref('')

const colorOptions = [
  '660099', 'FF0000', 'FF6600', 'FFCC00', 'FFFF00',
  '99FF00', '00FF00', '00FF99', '00FFFF', '0099FF',
  '0000FF', '6600FF', '9900FF', 'FF00FF', 'FF0099',
  'FFFFFF', 'CCCCCC'
]

const senderColor = ref('660099')
const msgColor = ref('660099')
const receiver = ref('')
const actionWord = ref('')
const selectedEmoticon = ref(0)
const isPrivate = ref(false)
const filterMode = ref(0)
const inputText = ref('')
const charCount = ref(0)
const showSlashMenu = ref(false)
const slashCommand = ref('')
const cmdTarget = ref('')
const commands = ref([])
const actions = ref([
  '拱手', '作揖', '微笑', '大笑', '哭泣', '愤怒', '惊讶',
  '害羞', '亲吻', '拥抱', '挥手', '点头', '摇头', '鞠躬',
  '拍手', '跳舞', '唱歌', '喝酒', '睡觉', '发呆',
  '比武', '切磋', '疗伤', '送礼', '跪拜', '仰望', '叹息', '沉思'
])

const filteredMessages = computed(() => {
  let list = messages.value
  
  if (chatTab.value === 'public') {
    // 公聊 tab：显示所有公聊消息 + 自己参与的私聊消息
    list = list.filter(m => 
      !m.is_private || // 公聊消息
      (m.is_private && (m.sender === userStore.username || m.receiver === userStore.username)) // 自己参与的私聊
    )
  } else {
    // 私聊 tab：只显示与自己相关的私聊消息 + 系统消息
    list = list.filter(m => 
      (m.is_private && (m.sender === userStore.username || m.receiver === userStore.username)) ||
      m.sender === '系统'
    )
    
    // 如果选择了特定私聊对象，进一步筛选
    if (privateFilterUser.value) {
      list = list.filter(m => 
        m.sender === privateFilterUser.value || m.receiver === privateFilterUser.value
      )
    }
  }
  
  // 筛选条件（独立于 tab）
  if (filterMode.value === 1) {
    // 只看公聊
    list = list.filter(m => !m.is_private)
  } else if (filterMode.value === 2) {
    // 只看私聊
    list = list.filter(m => 
      m.is_private && (m.sender === userStore.username || m.receiver === userStore.username)
    )
  }
  
  return list
})

const filteredOnlineUsers = computed(() => {
  if (!userSearchQuery.value) return roomOnlineUsers.value
  const query = userSearchQuery.value.toLowerCase()
  return roomOnlineUsers.value.filter(u => 
    u.username.toLowerCase().includes(query) ||
    (u.sect && u.sect.toLowerCase().includes(query))
  )
})

// 获取所有私聊过的用户列表
const privateChatUsers = computed(() => {
  const users = new Set()
  messages.value.forEach(m => {
    if (m.is_private) {
      if (m.sender === userStore.username && m.receiver !== '所有人') {
        users.add(m.receiver)
      } else if (m.receiver === userStore.username) {
        users.add(m.sender)
      }
    }
  })
  return Array.from(users).filter(u => u !== userStore.username && u !== '所有人')
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

function filterPrivateMessages() {
  scrollToBottom()
}

function formatMessageTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

function onInputTextChanged() {
  charCount.value = Math.min(inputText.value.length, 500)
  inputText.value = inputText.value.slice(0, 500)
}

function selectReceiver(username) {
  receiver.value = username
}

function quickPrivateChat(username) {
  receiver.value = username
  isPrivate.value = true
  inputText.value = ''
  nextTick(() => {
    const input = document.querySelector('.msg-input')
    if (input) input.focus()
  })
}

function switchToPrivateTab() {
  chatTab.value = 'private'
  privateUnreadCount.value = 0
}

function insertEmoticon(id) {
  if (selectedEmoticon.value === id) {
    inputText.value += `[tu]${id}[/tu]`
    selectedEmoticon.value = 0
  } else {
    selectedEmoticon.value = id
    inputText.value += `[tu]${id}[/tu]`
  }
}

async function loadRooms() {
  try {
    const res = await api.get('/chat/rooms')
    if (res.success) rooms.value = res.data || []
  } catch (e) {}
}

async function loadHistory() {
  try {
    const res = await api.get(`/chat/rooms/${currentRoomId.value}/messages`)
    if (res.success) messages.value = res.data || []
    scrollToBottom()
  } catch (e) {}
}

async function loadActions() {
  try {
    const res = await api.get('/chat/actions')
    if (res.success && res.data?.length) {
      actions.value = res.data.map(a => a.name || a)
    }
  } catch (e) {}
}

async function loadCommands() {
  try {
    const res = await api.get('/chat/commands')
    if (res.success) {
      const cmdList = res.data || []
      // 后端返回的是对象数组 { cmd, name, ... }, 提取 cmd 字段
      commands.value = cmdList.map(c => c.cmd?.replace('/', '') || c)
    }
  } catch (e) {}
}

function setupSocket() {
  const token = localStorage.getItem('token')
  if (!token) return
  const socket = connectSocket(token)

  socket.on('chat:say', (msg) => {
    messages.value.push(msg)
    if (messages.value.length > 500) {
      messages.value = messages.value.slice(-300)
    }
    scrollToBottom()
    
    // 收到私聊消息时，如果发送者不是自己且当前不在私聊 tab，增加未读计数
    if (msg.is_private && msg.sender !== userStore.username && msg.sender !== '系统' && chatTab.value !== 'private') {
      privateUnreadCount.value++
    }
  })

  socket.on('chat:system', (msg) => {
    messages.value.push({
      id: Date.now(),
      sender: '系统',
      content: msg.content,
      is_private: 0,
      is_action: 0,
      sender_color: 'FF0000',
      msg_color: '660099'
    })
    scrollToBottom()
  })

  socket.on('chat:joinSuccess', (data) => {
    currentRoomId.value = data.roomId
  })

  socket.on('room:onlineUpdate', (data) => {
    if (data.roomId === currentRoomId.value) {
      roomOnlineUsers.value = data.users || []
    }
  })

  socket.on('chat:commandResult', (result) => {
    messages.value.push({
      id: Date.now(),
      sender: '系统',
      content: result.message || '命令执行完成',
      is_private: 0,
      is_action: 0,
      sender_color: 'FF0000',
      msg_color: '660099'
    })
    scrollToBottom()
  })

  socket.emit('chat:join', { roomId: currentRoomId.value })
}

function sendMessage() {
  const text = inputText.value.trim()
  if (!text) return
  const socket = getSocket()
  if (!socket) return

  // 检查是否是命令输入
  if (text.startsWith('/')) {
    const parts = text.slice(1).split(' ')
    const cmd = parts[0]
    const target = parts.slice(1).join(' ')
    if (commands.value.includes(cmd)) {
      socket.emit('chat:command', {
        command: cmd,
        target: target,
        args: {}
      })
      inputText.value = ''
      charCount.value = 0
      return
    }
  }

  if (showSlashMenu.value && slashCommand.value) {
    socket.emit('chat:command', {
      command: slashCommand.value,
      target: cmdTarget.value,
      args: {}
    })
    slashCommand.value = ''
    cmdTarget.value = ''
    inputText.value = ''
    charCount.value = 0
    return
  }

  socket.emit('chat:message', {
    content: text,
    senderColor: senderColor.value,
    msgColor: msgColor.value,
    isPrivate: isPrivate.value || receiver.value !== '',
    receiver: receiver.value || '所有人',
    actionWord: actionWord.value
  })
  inputText.value = ''
  charCount.value = 0
  selectedEmoticon.value = 0
}

function sendAction() {
  if (!actionWord.value) return
  const socket = getSocket()
  if (!socket) return
  socket.emit('chat:action', {
    actionName: actionWord.value,
    receiver: receiver.value || '所有人'
  })
  actionWord.value = ''
}

function changeRoom() {
  const socket = getSocket()
  if (socket) {
    socket.emit('room:change', { roomId: currentRoomId.value })
  }
  messages.value = []
  loadHistory()
}

function onSlashCommand() {
  if (slashCommand.value) {
    inputText.value = `/${slashCommand.value} `
  }
}

watch(chatTab, () => scrollToBottom())

onMounted(async () => {
  await loadRooms()
  await loadHistory()
  loadActions()
  loadCommands()
  setupSocket()
})

onUnmounted(() => {
  disconnectSocket()
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.5);
  border-bottom: 1px solid rgba(75, 135, 195, 0.3);
}

.room-name {
  color: #7eb8da;
  font-weight: bold;
  font-size: 16px;
}

.room-select {
  width: auto;
  min-width: 120px;
  padding: 4px 8px;
  font-size: 13px;
}

.back-link {
  margin-left: auto;
  font-size: 13px;
  color: #aaa;
}

.back-link:hover {
  color: #7eb8da;
}

.chat-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-tabs {
  display: flex;
  background: rgba(15, 15, 30, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.chat-tab {
  padding: 10px 24px;
  cursor: pointer;
  font-size: 14px;
  color: #888;
  transition: all 0.25s;
  position: relative;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.chat-tab.active {
  color: #8ab8d6;
  background: rgba(90, 139, 196, 0.1);
}

.chat-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #5a8bc4, transparent);
  animation: tabSlideIn 0.3s ease-out;
}

@keyframes tabSlideIn {
  from { width: 0; }
  to { width: 60%; }
}

.chat-tab:hover {
  color: #bbb;
  background: rgba(255, 255, 255, 0.03);
}

.unread-badge {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(231, 76, 60, 0.4);
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  background: rgba(15, 15, 30, 0.4);
  scrollbar-width: thin;
  scrollbar-color: rgba(90, 139, 196, 0.4) rgba(15, 15, 30, 0.2);
}

.messages-area::-webkit-scrollbar {
  width: 6px;
}

.messages-area::-webkit-scrollbar-track {
  background: rgba(15, 15, 30, 0.2);
}

.messages-area::-webkit-scrollbar-thumb {
  background: rgba(90, 139, 196, 0.4);
  border-radius: 3px;
}

.messages-area::-webkit-scrollbar-thumb:hover {
  background: rgba(90, 139, 196, 0.6);
}

.private-filter {
  padding: 8px 16px;
  background: rgba(15, 15, 30, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.msg-item {
  padding: 4px 0;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-all;
  animation: msgSlideIn 0.3s ease-out;
}

@keyframes msgSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.msg-system {
  color: #ff6666;
  font-style: italic;
  text-align: center;
  padding: 4px 0;
}

.msg-system .system-text {
  color: #ff6666;
}

.msg-action {
  color: #99cc99;
  font-style: italic;
}

.msg-action .action-text {
  color: #99cc99;
}

.msg-private {
  background: rgba(90, 139, 196, 0.08);
  padding: 4px 8px;
  border-radius: 5px;
  border-left: 2px solid rgba(90, 139, 196, 0.4);
  margin: 0 -4px;
}

.msg-sender {
  cursor: pointer;
  font-weight: bold;
}

.msg-sender:hover {
  text-decoration: underline;
}

.msg-receiver {
  color: #e8a0bf;
  cursor: pointer;
  font-weight: bold;
}

.msg-receiver:hover {
  text-decoration: underline;
}

.msg-arrow {
  color: #888;
}

.msg-timestamp {
  float: right;
  color: #555;
  font-size: 11px;
  margin-left: 8px;
  opacity: 0.7;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
}

.msg-item:hover .msg-timestamp {
  opacity: 1;
  visibility: visible;
}

.msg-content :deep(img) {
  vertical-align: middle;
  max-height: 22px;
}

.empty-msg {
  text-align: center;
  color: #555;
  margin-top: 40px;
}

.chat-sidebar {
  width: 220px;
  background: rgba(0, 0, 0, 0.3);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  overflow-y: auto;
}

.sidebar-section {
  padding: 10px;
}

.sidebar-section h4 {
  color: #8ab8d6;
  font-size: 14px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.user-list-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.user-list-header h4 {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.user-search-input {
  flex: 1;
  padding: 4px 8px !important;
  font-size: 12px !important;
  border-radius: 4px;
  background: rgba(15, 15, 30, 0.5);
  border: 1px solid rgba(90, 139, 196, 0.2);
  color: #ddd;
}

.user-search-input:focus {
  border-color: #5a8bc4;
  box-shadow: 0 0 6px rgba(90, 139, 196, 0.2);
}

.empty-user-list {
  text-align: center;
  color: #555;
  font-size: 13px;
  padding: 20px 0;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}

.user-item:hover {
  background: rgba(75, 135, 195, 0.15);
}

.user-selected {
  background: rgba(75, 135, 195, 0.25);
}

.gender-icon {
  font-size: 14px;
}

.gender-icon.male {
  color: #4B87C3;
}

.gender-icon.female {
  color: #e8a0bf;
}

.user-name {
  color: #ddd;
}

.user-sect {
  margin-left: auto;
  font-size: 11px;
  color: #888;
}

.chat-input-area {
  background: rgba(0, 0, 0, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  padding: 8px 12px;
}

.input-row-1, .input-row-2, .input-row-3 {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 6px;
}

.color-picker-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-picker-group label {
  color: #888;
  font-size: 12px;
  white-space: nowrap;
}

.color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.15s;
}

.color-swatch:hover {
  transform: scale(1.3);
}

.color-swatch.active {
  border-color: #fff;
  transform: scale(1.3);
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
}

.input-field {
  display: flex;
  align-items: center;
  gap: 6px;
}

.input-field label {
  color: #888;
  font-size: 12px;
  white-space: nowrap;
}

.receiver-input {
  width: 120px !important;
  padding: 4px 8px !important;
  font-size: 13px !important;
}

.action-select {
  width: auto !important;
  min-width: 80px;
  padding: 4px 8px !important;
  font-size: 13px !important;
}

.emoticon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.emoticon-btn {
  padding: 1px 4px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  font-size: 11px;
  color: #aaa;
  cursor: pointer;
  white-space: nowrap;
}

.emoticon-btn:hover {
  background: rgba(75, 135, 195, 0.2);
  color: #7eb8da;
}

.emoticon-btn.active {
  background: rgba(75, 135, 195, 0.3);
  color: #7eb8da;
  border-color: #4B87C3;
}

.cmd-field {
  gap: 4px;
}

.cmd-select {
  width: auto !important;
  min-width: 100px;
  padding: 4px 6px !important;
  font-size: 12px !important;
}

.cmd-input {
  width: 80px !important;
  padding: 4px 6px !important;
  font-size: 12px !important;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #aaa;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.checkbox-label input {
  width: auto;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #aaa;
  font-size: 13px;
  white-space: nowrap;
}

.filter-select {
  width: auto !important;
  padding: 2px 6px !important;
  font-size: 12px !important;
}

.private-filter-select {
  width: 100%;
  padding: 6px 10px !important;
  font-size: 13px !important;
  border-radius: 6px;
  background: rgba(15, 15, 30, 0.6);
  border: 1px solid rgba(90, 139, 196, 0.3);
  color: #ddd;
  cursor: pointer;
  transition: all 0.2s;
}

.private-filter-select:hover {
  border-color: rgba(90, 139, 196, 0.5);
}

.private-filter-select:focus {
  border-color: #5a8bc4;
  box-shadow: 0 0 10px rgba(90, 139, 196, 0.3);
}

.input-row-main {
  display: flex;
  gap: 10px;
  margin-top: 4px;
  align-items: center;
}

.msg-input {
  flex: 1;
  padding: 10px 14px !important;
  font-size: 14px !important;
  border-radius: 8px !important;
  transition: all 0.2s;
}

.char-count {
  color: #666;
  font-size: 12px;
  white-space: nowrap;
  font-weight: 500;
  min-width: 50px;
  text-align: right;
}

.char-count:hover {
  color: #8ab8d6;
}

.msg-input:focus {
  background: rgba(15, 15, 30, 0.8) !important;
  box-shadow: 0 0 12px rgba(90, 139, 196, 0.3);
}

.send-btn {
  padding: 10px 24px;
  font-weight: 600;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(90, 139, 196, 0.3);
  transition: all 0.2s;
  min-width: 80px;
}

.send-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(90, 139, 196, 0.5);
}

.btn-sm {
  padding: 6px 16px;
  font-size: 13px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(106, 172, 122, 0.3);
}

.btn-sm:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(106, 172, 122, 0.4);
}

@media (max-width: 1024px) {
  .chat-sidebar {
    width: 180px;
  }
  .color-swatches {
    max-width: 200px;
  }
}

@media (max-width: 768px) {
  .chat-sidebar {
    width: 150px;
  }
  .color-swatches {
    max-width: 150px;
  }
  .input-row-1 {
    flex-wrap: wrap;
  }
  .color-picker-group {
    margin-bottom: 6px;
  }
}

@media (max-width: 600px) {
  .chat-sidebar {
    display: none;
  }
  .input-row-1, .input-row-2 {
    flex-wrap: wrap;
  }
  .color-swatches {
    max-width: 100%;
  }
  .emoticon-grid {
    max-width: 100%;
  }
}
</style>
