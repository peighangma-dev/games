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
          <span :class="['chat-tab', { active: chatTab === 'private' }]" @click="chatTab = 'private'">私聊</span>
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
              <span class="msg-sender" :style="{ color: '#' + msg.sender_color }" @click="selectReceiver(msg.sender)">{{ msg.sender }}</span>
              <span class="msg-arrow" v-if="msg.is_private">悄悄对</span>
              <span class="msg-receiver" v-if="msg.is_private && msg.receiver" @click="selectReceiver(msg.receiver)">{{ msg.receiver }}</span>
              <span class="msg-arrow" v-if="msg.is_private">说：</span>
              <span class="msg-arrow" v-else>说：</span>
              <span class="msg-content" :style="{ color: '#' + msg.msg_color }" v-html="msg.content"></span>
            </template>
          </div>
          <div v-if="filteredMessages.length === 0" class="empty-msg">暂无消息</div>
        </div>
      </div>

      <div class="chat-sidebar">
        <div class="sidebar-section">
          <h4>在线用户 ({{ roomOnlineUsers.length }})</h4>
          <div class="user-list">
            <div
              v-for="u in roomOnlineUsers"
              :key="u.user_id || u.username"
              :class="['user-item', { 'user-selected': receiver === u.username }]"
              @click="selectReceiver(u.username)"
            >
              <span :class="['gender-icon', u.gender]">{{ u.gender === 'female' ? '♀' : '♂' }}</span>
              <span class="user-name">{{ u.username }}</span>
              <span class="user-sect" v-if="u.sect && u.sect !== '无'">{{ u.sect }}</span>
            </div>
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
            <option value="">/ 斜杠命令</option>
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
          type="text"
          placeholder="输入消息..."
          class="msg-input"
          @keydown.enter="sendMessage"
        />
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
    list = list.filter(m => !m.is_private)
  } else {
    list = list.filter(m => m.is_private || m.sender === '系统')
  }
  if (filterMode.value === 1) {
    list = list.filter(m => !m.is_private)
  } else if (filterMode.value === 2) {
    list = list.filter(m => m.is_private || m.sender === '系统')
  }
  return list
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

function selectReceiver(username) {
  receiver.value = username
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
    if (res.success) commands.value = res.data || []
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

  if (showSlashMenu.value && slashCommand.value) {
    socket.emit('chat:command', {
      command: slashCommand.value,
      target: cmdTarget.value,
      args: {}
    })
    slashCommand.value = ''
    cmdTarget.value = ''
    inputText.value = ''
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
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-tab {
  padding: 8px 20px;
  cursor: pointer;
  font-size: 14px;
  color: #888;
  transition: all 0.2s;
}

.chat-tab.active {
  color: #7eb8da;
  border-bottom: 2px solid #4B87C3;
}

.chat-tab:hover {
  color: #ccc;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.2);
}

.msg-item {
  padding: 3px 0;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-all;
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
  background: rgba(75, 135, 195, 0.05);
  padding: 2px 6px;
  border-radius: 3px;
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
  color: #7eb8da;
  font-size: 14px;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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

.input-row-main {
  display: flex;
  gap: 8px;
}

.msg-input {
  flex: 1;
  padding: 8px 12px !important;
  font-size: 14px !important;
}

.send-btn {
  padding: 8px 20px;
}

@media (max-width: 768px) {
  .chat-sidebar {
    width: 160px;
  }
  .color-swatches {
    max-width: 280px;
  }
}

@media (max-width: 600px) {
  .chat-sidebar {
    display: none;
  }
  .input-row-1, .input-row-2 {
    flex-wrap: wrap;
  }
}
</style>
