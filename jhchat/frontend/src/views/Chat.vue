<template>
  <div class="chat-page">
    <div class="nav-bar">
      <button class="menu-toggle" @click="toggleDrawer" aria-label="菜单">
        <span class="hamburger"></span>
      </button>
      <router-link to="/main" class="nav-logo">
        <span class="logo-icon">⚔️</span>
        <span class="logo-text">笑傲江湖</span>
      </router-link>
      
      <!-- 桌面端导航 -->
      <div class="nav-links desktop-only">
        <router-link to="/main" class="nav-btn">首页</router-link>
        <router-link to="/chat" class="nav-btn active">聊天</router-link>
        <router-link to="/messages" class="nav-btn">邮件</router-link>
        <router-link to="/sect" class="nav-btn">门派</router-link>
        <router-link to="/marriage" class="nav-btn">婚姻</router-link>
        <router-link to="/skills" class="nav-btn">武功</router-link>
        <div class="nav-dropdown">
          <button class="nav-btn dropdown-toggle">
            游乐 <span class="dropdown-arrow">▼</span>
          </button>
          <div class="dropdown-menu">
            <router-link to="/items" class="dropdown-item">🎒 物品</router-link>
            <router-link to="/shop" class="dropdown-item">🏪 商店</router-link>
            <router-link to="/market" class="dropdown-item">💰 商城</router-link>
            <router-link to="/games" class="dropdown-item">🎲 游戏</router-link>
            <router-link to="/pets" class="dropdown-item">🐾 宠物</router-link>
            <router-link to="/alchemy" class="dropdown-item">🧪 配药</router-link>
            <router-link to="/fishing" class="dropdown-item">🎣 钓鱼</router-link>
            <router-link to="/fortune" class="dropdown-item">🔮 求签</router-link>
          </div>
        </div>
        <router-link to="/rankings" class="nav-btn">排行</router-link>
        <router-link to="/wishes" class="nav-btn">许愿</router-link>
        <!-- 后台管理入口（管理员可见） -->
        <router-link v-if="userStore.grade >= 6" to="/admin" class="nav-btn nav-admin">⚙️ 后台</router-link>
      </div>
      
      <span class="nav-spacer"></span>
      <span class="nav-user-info desktop-only">
        <span class="user-silver">💰 {{ userStore.silver }}两</span>
      </span>
      <router-link to="/profile" class="nav-btn nav-profile desktop-only">{{ userStore.username }}</router-link>
      <!-- 背景音乐控制 -->
      <div class="nav-music-control">
        <button @click="toggleMusic" class="nav-btn nav-music" :class="{ playing: isMusicPlaying }" :title="isMusicPlaying ? '暂停音乐' : '播放音乐'">
          🎵 {{ isMusicPlaying ? currentMusicName : '音乐' }}
        </button>
        <select v-model="currentMusicId" @change="changeMusic" class="music-select" v-if="isMusicPlaying">
          <option v-for="music in musicList" :key="music.id" :value="music.id">{{ music.name }}</option>
        </select>
      </div>
      <button @click="handleLogout" class="nav-btn nav-logout desktop-only">退出</button>
    </div>
    
    <!-- 移动端抽屉菜单 -->
    <div v-if="isDrawerOpen" class="drawer-overlay" @click="closeDrawer"></div>
    <div :class="['drawer-menu', { open: isDrawerOpen }]">
      <div class="drawer-header">
        <span class="drawer-title">笑傲江湖</span>
        <button class="drawer-close" @click="closeDrawer" aria-label="关闭菜单">✕</button>
      </div>
      <div class="drawer-user-info">
        <div class="drawer-avatar">{{ userStore.username?.charAt(0).toUpperCase() }}</div>
        <div class="drawer-user-details">
          <div class="drawer-username">{{ userStore.username }}</div>
          <div class="drawer-silver">💰 {{ userStore.silver }}两</div>
        </div>
      </div>
      <nav class="drawer-nav">
        <router-link to="/main" class="drawer-item" @click="closeDrawer">
          <span class="drawer-icon">🏠</span>
          <span class="drawer-label">首页</span>
        </router-link>
        <router-link to="/chat" class="drawer-item" @click="closeDrawer">
          <span class="drawer-icon">💬</span>
          <span class="drawer-label">聊天</span>
        </router-link>
        <router-link to="/messages" class="drawer-item" @click="closeDrawer">
          <span class="drawer-icon">✉️</span>
          <span class="drawer-label">邮件</span>
        </router-link>
        <router-link to="/sect" class="drawer-item" @click="closeDrawer">
          <span class="drawer-icon">⚔️</span>
          <span class="drawer-label">门派</span>
        </router-link>
        <router-link to="/marriage" class="drawer-item" @click="closeDrawer">
          <span class="drawer-icon">❤️</span>
          <span class="drawer-label">婚姻</span>
        </router-link>
        <router-link to="/skills" class="drawer-item" @click="closeDrawer">
          <span class="drawer-icon">📜</span>
          <span class="drawer-label">武功</span>
        </router-link>
        <div class="drawer-group">
          <div class="drawer-group-title">🎮 游乐</div>
          <router-link to="/items" class="drawer-item drawer-subitem" @click="closeDrawer">🎒 物品</router-link>
          <router-link to="/shop" class="drawer-item drawer-subitem" @click="closeDrawer">🏪 商店</router-link>
          <router-link to="/market" class="drawer-item drawer-subitem" @click="closeDrawer">💰 商城</router-link>
          <router-link to="/games" class="drawer-item drawer-subitem" @click="closeDrawer">🎲 游戏</router-link>
          <router-link to="/pets" class="drawer-item drawer-subitem" @click="closeDrawer">🐾 宠物</router-link>
          <router-link to="/alchemy" class="drawer-item drawer-subitem" @click="closeDrawer">🧪 配药</router-link>
          <router-link to="/fishing" class="drawer-item drawer-subitem" @click="closeDrawer">🎣 钓鱼</router-link>
          <router-link to="/fortune" class="drawer-item drawer-subitem" @click="closeDrawer">🔮 求签</router-link>
        </div>
        <router-link to="/rankings" class="drawer-item" @click="closeDrawer">
          <span class="drawer-icon">🏆</span>
          <span class="drawer-label">排行</span>
        </router-link>
        <router-link to="/wishes" class="drawer-item" @click="closeDrawer">
          <span class="drawer-icon">🌟</span>
          <span class="drawer-label">许愿</span>
        </router-link>
        <router-link v-if="userStore.grade >= 6" to="/admin" class="drawer-item drawer-admin" @click="closeDrawer">
          <span class="drawer-icon">⚙️</span>
          <span class="drawer-label">后台管理</span>
        </router-link>
        <button @click="handleLogout" class="drawer-item drawer-logout">
          <span class="drawer-icon">🚪</span>
          <span class="drawer-label">退出登录</span>
        </button>
      </nav>
    </div>
    
    <!-- 隐藏的音乐播放器 -->
    <!-- 注意：MIDI 文件需要浏览器支持或外部播放器 -->
    <audio ref="musicPlayer" :src="currentMusicUrl" loop @play="onMusicPlay" @pause="onMusicPause" @error="onMusicError"></audio>
    
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
        
        <!-- 房间切换控制栏 -->
        <div class="room-control-bar">
          <div class="room-selector">
            <span class="room-label">🏠 房间:</span>
            <select v-model="currentRoomId" @change="changeRoom" class="room-select" title="切换聊天房间">
              <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
            </select>
            <span class="room-user-count" v-if="roomOnlineUsers.length > 0" title="当前房间在线人数">
              👥 {{ roomOnlineUsers.length }}人
            </span>
          </div>
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
              <span class="msg-sender" :style="{ color: '#' + msg.sender_color }" @click="selectReceiver(msg.sender)" @dblclick="quickPrivateChat(msg.sender)">
                <span v-if="msg.sender_sect && msg.sender_sect !== '无'" class="msg-sect">[{{ msg.sender_sect }}]</span>
                <span class="msg-sender-name">{{ msg.sender }}</span>
              </span>
              <span class="msg-arrow" v-if="msg.is_private">悄悄对</span>
              <span class="msg-receiver" v-if="msg.is_private && msg.receiver" @click="selectReceiver(msg.receiver)" @dblclick="quickPrivateChat(msg.receiver)">
                <span v-if="msg.receiver_sect && msg.receiver_sect !== '无'" class="msg-sect">[{{ msg.receiver_sect }}]</span>
                <span class="msg-receiver-name">{{ msg.receiver }}</span>
              </span>
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
              :title="`${u.sect || '无门派'} | Lv.${u.grade || 1}`"
            >
              <span :class="['gender-icon', u.gender]" :title="u.gender === 'female' ? '女' : '男'">
                {{ u.gender === 'female' ? '♀' : '♂' }}
              </span>
              <span class="user-grade">Lv.{{ u.grade || 1 }}</span>
              <span class="user-name">
                <span v-if="u.sect && u.sect !== '无'" class="user-sect-tag">[{{ u.sect }}]</span>
                {{ u.username }}
              </span>
            </div>
          </div>
          <div v-if="filteredOnlineUsers.length === 0" class="empty-user-list">
            暂无在线用户
          </div>
        </div>
      </div>
    </div>

    <!-- 输入控制区 - 优化版 -->
    <div class="chat-input-area">
      <!-- 工具栏 -->
      <div class="toolbar-row">
          <div class="toolbar-group">
            <button class="toolbar-btn" @click="togglePanel('colors')" :class="{ active: activePanel === 'colors' }" title="颜色选择">
              🎨 颜色
            </button>
            <button class="toolbar-btn" @click="togglePanel('emoticons')" :class="{ active: activePanel === 'emoticons' }" title="表情选择">
              😊 表情
            </button>
            <button class="toolbar-btn" @click="togglePanel('actions')" :class="{ active: activePanel === 'actions' }" title="动作选择">
              🎭 动作
            </button>
            <button class="toolbar-btn" @click="togglePanel('commands')" :class="{ active: activePanel === 'commands' }" title="游戏命令">
              ⚡ 命令
            </button>
          </div>
          <div class="toolbar-group">
            <label class="toggle-checkbox">
              <input type="checkbox" v-model="isPrivate" />
              <span class="toggle-label">💌 私聊</span>
            </label>
            <select v-model="filterMode" class="filter-select-small">
              <option :value="0">全部</option>
              <option :value="1">公聊</option>
              <option :value="2">私聊</option>
            </select>
          </div>
        </div>
        
        <!-- 折叠面板区域 -->
        <div class="panel-container">
          <!-- 颜色选择面板 -->
          <div v-show="activePanel === 'colors'" class="panel panel-colors">
            <div class="color-picker-group">
              <label>字色：</label>
              <div class="color-swatches">
                <span
                  v-for="c in colorOptions"
                  :key="'sender-'+c"
                  :class="['color-swatch', { active: senderColor === c }]"
                  :style="{ background: '#' + c }"
                  @click="senderColor = c"
                  :title="c"
                ></span>
              </div>
            </div>
            <div class="color-picker-group">
              <label>言色：</label>
              <div class="color-swatches">
                <span
                  v-for="c in colorOptions"
                  :key="'msg-'+c"
                  :class="['color-swatch', { active: msgColor === c }]"
                  :style="{ background: '#' + c }"
                  @click="msgColor = c"
                  :title="c"
                ></span>
              </div>
            </div>
          </div>
          
          <!-- 表情选择面板 -->
          <div v-show="activePanel === 'emoticons'" class="panel panel-emoticons">
            <div class="emoticon-tabs">
              <button 
                v-for="tab in emoticonTabs" 
                :key="tab.key"
                :class="['emoticon-tab', { active: currentEmoticonTab === tab.key }]"
                @click="currentEmoticonTab = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
            <div class="emoticon-grid">
              <button
                v-for="i in currentEmoticonRange"
                :key="i"
                :class="['emoticon-btn', { active: selectedEmoticon === i }]"
                @click="insertEmoticon(i)"
                :title="`表情${i}`"
              >
                <img :src="`/assets/emoticons/${i}.gif`" :alt="`表情${i}`" loading="lazy" />
              </button>
            </div>
          </div>
          
          <!-- 动作选择面板 -->
          <div v-show="activePanel === 'actions'" class="panel panel-actions">
            <div class="action-buttons">
              <button
                v-for="action in actions"
                :key="action"
                :class="['action-btn', { active: actionWord === action }]"
                @click="actionWord = action"
              >
                {{ action }}
              </button>
            </div>
          </div>
          
          <!-- 命令面板 -->
          <div v-show="activePanel === 'commands'" class="panel panel-commands">
            <div class="command-input-row">
              <select v-model="slashCommand" class="cmd-select-large" @change="onSlashCommand">
                <option value="">—— 选择命令 ——</option>
                <optgroup v-for="(group, groupName) in groupedCommands" :key="groupName" :label="groupName">
                  <option v-for="cmd in group" :key="cmd.cmd" :value="cmd.cmd">
                    {{ cmd.cmd }} - {{ cmd.name }}
                  </option>
                </optgroup>
              </select>
              <input 
                v-model="cmdTarget" 
                type="text" 
                placeholder="目标/参数" 
                class="cmd-target-input"
              />
            </div>
            <div class="command-tips">
              <span class="tip-icon">💡</span>
              <span>选择命令后输入目标，再次点击执行</span>
            </div>
          </div>
        </div>
        
        <!-- 主输入行 -->
        <div class="input-row-main">
          <div class="input-with-receiver">
            <input v-model="receiver" type="text" placeholder="对话对象 (留空为公聊)" class="receiver-input-main" />
            <input
              v-model="inputText"
              @input="onInputTextChanged"
              type="text"
              placeholder="输入消息... (Enter 发送)"
              class="msg-input"
              @keydown.enter="sendMessage"
            />
          </div>
          <span class="char-count">{{ charCount }}/500</span>
          <button class="btn btn-primary send-btn" @click="sendMessage">
            📤 发送
          </button>
          <button class="btn btn-action" @click="sendAction" :disabled="!actionWord">
            🎬 动作
          </button>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { connectSocket, getSocket, disconnectSocket } from '../utils/socket'
import api from '../utils/api'

const router = useRouter()
const userStore = useUserStore()
const isDrawerOpen = ref(false)

function toggleDrawer() {
  isDrawerOpen.value = !isDrawerOpen.value
  document.body.style.overflow = isDrawerOpen.value ? 'hidden' : ''
}

function closeDrawer() {
  isDrawerOpen.value = false
  document.body.style.overflow = ''
}

async function handleLogout() {
  await userStore.logout()
  router.push('/login')
}

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

// 表情分类配置 (共 320 个表情，分 8 页)
const emoticonTabs = [
  { key: 'basic', label: '常用', range: { start: 1, end: 40 } },
  { key: 'emotion', label: '表情', range: { start: 41, end: 80 } },
  { key: 'action', label: '动作', range: { start: 81, end: 120 } },
  { key: 'cute', label: '可爱', range: { start: 121, end: 160 } },
  { key: 'funny', label: '搞笑', range: { start: 161, end: 200 } },
  { key: 'classic', label: '经典', range: { start: 201, end: 240 } },
  { key: 'special', label: '特效', range: { start: 241, end: 280 } },
  { key: 'more', label: '更多', range: { start: 281, end: 320 } }
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
const actions = ref([])

// 新增：面板控制
const activePanel = ref('')
const currentEmoticonTab = ref('basic')

// 背景音乐配置
const musicList = [
  { id: 'default_bgm', name: '🎵 默认背景音乐' },
  { id: 39, name: '笑傲江湖' },
  { id: 1, name: '爱的奉献' },
  { id: 2, name: '爱之初体验' },
  { id: 3, name: '把悲伤留给自己' },
  { id: 4, name: '博基上校进行曲' },
  { id: 5, name: '不要分离' },
  { id: 6, name: '不知不觉想起你' },
  { id: 7, name: '不装饰你的梦' },
  { id: 8, name: '长江之歌' },
  { id: 9, name: '迟来的爱' },
  { id: 10, name: '春节' },
  { id: 11, name: '春节序曲' },
  { id: 12, name: '单身情歌' },
  { id: 13, name: '独钓一江秋' },
  { id: 14, name: '对你太在乎' },
  { id: 15, name: '飞船即将坠毁' },
  { id: 16, name: '奉献' },
  { id: 17, name: '敢去承担爱' },
  { id: 18, name: '给你一份惊喜' },
  { id: 19, name: '国歌' },
  { id: 20, name: '好日子' },
  { id: 21, name: '洪湖水 2' },
  { id: 22, name: '呼吸我' },
  { id: 23, name: '加尔各答的天使' },
  { id: 24, name: '将自己给你' },
  { id: 25, name: '今宵多珍重' },
  { id: 26, name: '京腔京韵' },
  { id: 27, name: '九月九的酒' },
  { id: 28, name: '辣妹子' },
  { id: 29, name: '流浪歌手的情人' },
  { id: 30, name: '路边的野花不要采' },
  { id: 31, name: '没有恋爱的日子' },
  { id: 32, name: '没有雨的夜里' },
  { id: 33, name: '每一句说话' },
  { id: 34, name: '梦回故园' },
  { id: 35, name: '梦驼铃' },
  { id: 36, name: '秘密情人' },
  { id: 37, name: '呢喃' },
  { id: 38, name: '你怎么舍得我难过' },
  { id: 40, name: '千千阙歌' },
  { id: 41, name: '如果可以再见你' },
  { id: 42, name: '山丹丹' },
  { id: 43, name: '伤了三个心' },
  { id: 44, name: '伤心太平洋' },
  { id: 45, name: '死不了' },
  { id: 46, name: '天涯' },
  { id: 47, name: '天意' },
  { id: 48, name: '同桌的你' },
  { id: 49, name: '童年' },
  { id: 50, name: '弯弯的月亮' }
]
const currentMusicId = ref('default_bgm')  // 默认显示"音乐"，不自动播放
const isMusicPlaying = ref(false)
const musicPlayer = ref(null)

function getEmoticonCount() {
  const tab = emoticonTabs.find(t => t.key === currentEmoticonTab.value)
  return tab ? tab.range.end - tab.range.start + 1 : 40
}

// 背景音乐控制方法
const currentMusicName = computed(() => {
  const music = musicList.find(m => m.id === currentMusicId.value)
  return music ? music.name : '音乐'
})

const currentMusicUrl = computed(() => {
  return `/assets/music/${currentMusicId.value}.mp3`
})

function toggleMusic() {
  if (!musicPlayer.value) return
  if (isMusicPlaying.value) {
    musicPlayer.value.pause()
  } else {
    musicPlayer.value.play().catch(err => {
      console.warn('音乐播放失败:', err)
      alert('🎵 请点击页面任意位置后再试（浏览器自动播放策略限制）')
    })
  }
}

function changeMusic() {
  if (!musicPlayer.value || !isMusicPlaying.value) return
  musicPlayer.value.pause()
  nextTick(() => {
    musicPlayer.value.play()
  })
}

function onMusicPlay() {
  isMusicPlaying.value = true
}

function onMusicPause() {
  isMusicPlaying.value = false
}

function onMusicError(e) {
  console.warn('音乐播放失败:', e)
  isMusicPlaying.value = false
  // MIDI 文件在某些浏览器可能无法播放
  console.log('提示：MIDI 文件格式，部分浏览器可能需要插件才能播放')
}

const currentEmoticonRange = computed(() => {
  const tab = emoticonTabs.find(t => t.key === currentEmoticonTab.value)
  if (!tab) return []
  return Array.from({ length: tab.range.end - tab.range.start + 1 }, (_, i) => tab.range.start + i)
})

// 命令分组 (基于原 ASP 版本和现有功能)
const groupedCommands = computed(() => {
  const cmdList = commands.value.map(cmd => {
    const cmdStr = typeof cmd === 'string' ? cmd : cmd.cmd
    // 查找完整命令信息
    if (typeof cmd === 'object' && cmd.cmd) {
      return cmd
    }
    return { cmd: cmdStr, name: getCommandName(cmdStr) }
  })
  
  // 按功能分类
  const groups = {
    '社交互动': [],
    '门派管理': [],
    '游戏功能': [],
    '管理员': []
  }
  
  cmdList.forEach(cmd => {
    const cmdName = cmd.cmd?.replace('/', '') || cmd
    if (['加入', '离开', '拜师', '收徒', '册封', '篡位', '帮派令'].some(c => cmdName.includes(c))) {
      groups['门派管理'].push(cmd)
    } else if (['罚款', '驱逐', '踢人', '禁言', '解禁', '禁打', '开打', '查 ip', '站长令'].some(c => cmdName.includes(c))) {
      groups['管理员'].push(cmd)
    } else if (['千里', '点穴', '逮捕', '坐牢', '警告', '下毒', '吸星', '投掷', '攻击', '传内力', '赠送', '给钱', '跟踪', '取消跟踪', '卡片', '公告'].some(c => cmdName.includes(c))) {
      groups['游戏功能'].push(cmd)
    } else {
      groups['社交互动'].push(cmd)
    }
  })
  
  // 移除空组
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) delete groups[key]
  })
  
  return groups
})

function getCommandName(cmd) {
  // 根据命令推断名称
  const names = {
    '千里': '千里传音',
    '点穴': '点穴定身',
    '逮捕': '逮捕犯人',
    '坐牢': '判坐牢',
    '警告': '警告用户',
    '下毒': '暗中下毒',
    '驱逐': '驱逐出门派',
    '偷钱': '偷窃银两',
    '吸星大法': '吸星大法',
    '投掷': '投掷暗器',
    '攻击': '攻击/比武',
    '传内力': '传送内力',
    '赠送': '赠送物品',
    '给钱': '给予银两',
    '罚款': '处以罚款',
    '加入': '加入门派',
    '离开': '离开门派',
    '查 ip': '查看 IP',
    '篡位': '篡位夺权',
    '册封': '册封弟子',
    '跟踪私毒': '跟踪私聊',
    '取消跟踪': '取消跟踪',
    '卡片': '使用卡片',
    '公告': '发布公告',
    '禁言': '禁言处理',
    '解禁': '解除禁言',
    '禁打': '禁止打架',
    '开打': '允许打架',
    '打坐': '打坐练功',
    '踢人': '踢出房间',
    '心跳': '心跳特效',
    '怒吼': '怒吼特效',
    '心动': '心动特效',
    '拜师': '拜师学艺',
    '收徒': '招收徒弟',
    '站长令': '站长命令',
    '放大': '放大文字',
    '帮派令': '帮派命令'
  }
  const key = cmd.replace('/', '')
  return names[key] || key
}

function togglePanel(panelName) {
  activePanel.value = activePanel.value === panelName ? '' : panelName
}

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
  let list = roomOnlineUsers.value
  
  if (userSearchQuery.value) {
    const query = userSearchQuery.value.toLowerCase()
    list = list.filter(u => 
      u.username?.toLowerCase().includes(query) ||
      u.sect?.toLowerCase().includes(query)
    )
  }
  
  // 确保每个用户都有 grade 和 sect 字段
  return list.map(u => ({
    ...u,
    grade: u.grade || 1,
    sect: u.sect || '无',
    gender: u.gender || 'male'
  }))
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
      // 去重并排序
      const uniqueActions = [...new Set(res.data.map(a => a.name || a))]
      actions.value = uniqueActions.sort()
    }
  } catch (e) {
    console.error('Load actions error:', e)
  }
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
  
  // 尝试自动播放默认背景音乐
  if (musicPlayer.value) {
    try {
      musicPlayer.value.volume = 0.7
      const playPromise = musicPlayer.value.play()
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('聊天室背景音乐自动播放成功')
        }).catch(err => {
          console.log('浏览器阻止自动播放，需要用户交互:', err)
          // 用户首次点击后自动播放
          const enableAutoPlay = () => {
            musicPlayer.value.play().then(() => {
              console.log('用户交互后开始播放背景音乐')
            }).catch(() => {})
            document.removeEventListener('click', enableAutoPlay)
            document.removeEventListener('keydown', enableAutoPlay)
          }
          document.addEventListener('click', enableAutoPlay, { once: true })
          document.addEventListener('keydown', enableAutoPlay, { once: true })
        })
      }
    } catch (err) {
      console.log('自动播放失败:', err)
    }
  }
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
}

.nav-profile {
  background: rgba(126, 184, 218, 0.1);
}

.nav-admin {
  background: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: #ffc107;
}

.nav-admin:hover {
  background: rgba(255, 193, 7, 0.25);
  border-color: rgba(255, 193, 7, 0.5);
}

.nav-logout {
  border: none;
  background: transparent;
}

.nav-logout:hover {
  background: rgba(255, 100, 100, 0.1);
}

/* 背景音乐控制 */
.nav-music-control {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 8px;
}

.nav-music {
  background: rgba(126, 184, 218, 0.15);
  border: 1px solid rgba(126, 184, 218, 0.3);
  color: #7eb8da;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  transition: all 0.3s;
  white-space: nowrap;
}

.nav-music:hover {
  background: rgba(126, 184, 218, 0.25);
  border-color: rgba(126, 184, 218, 0.5);
  transform: translateY(-1px);
}

.nav-music.playing {
  background: rgba(106, 172, 122, 0.3);
  border-color: rgba(106, 172, 122, 0.6);
  color: #6aac7a;
  animation: musicPulse 2s ease-in-out infinite;
}

@keyframes musicPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(106, 172, 122, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(106, 172, 122, 0);
  }
}

.music-select {
  background: rgba(10, 10, 20, 0.9);
  border: 1px solid rgba(126, 184, 218, 0.3);
  color: #ccc;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  max-width: 120px;
  cursor: pointer;
  transition: all 0.2s;
}

.music-select:hover {
  border-color: rgba(126, 184, 218, 0.6);
}

.music-select:focus {
  outline: none;
  border-color: #7eb8da;
  box-shadow: 0 0 8px rgba(126, 184, 218, 0.3);
}

.nav-dropdown {
  position: relative;
}

.dropdown-toggle {
  position: relative;
}

.dropdown-arrow {
  font-size: 10px;
  margin-left: 4px;
  opacity: 0.7;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: #1a3a5c;
  border: 1px solid rgba(126, 184, 218, 0.3);
  border-radius: 8px;
  padding: 8px 0;
  min-width: 160px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.2s;
}

.nav-dropdown:hover .dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  text-decoration: none;
  color: #c0d8e8;
  transition: all 0.2s;
}

.dropdown-item:hover {
  background: rgba(126, 184, 218, 0.15);
  color: #fff;
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

/* 房间切换控制栏 */
.room-control-bar {
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(20, 20, 35, 0.9), rgba(30, 30, 50, 0.95));
  border-bottom: 1px solid rgba(75, 135, 195, 0.3);
  display: flex;
  align-items: center;
}

.room-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.room-label {
  color: #7eb8da;
  font-size: 13px;
  font-weight: 500;
}

.room-select {
  appearance: none;
  background: linear-gradient(135deg, rgba(15, 15, 30, 0.8), rgba(20, 20, 40, 0.9));
  border: 1px solid rgba(90, 139, 196, 0.4);
  border-radius: 6px;
  color: #ddd;
  font-size: 13px;
  padding: 6px 28px 6px 12px;
  cursor: pointer;
  transition: all 0.2s;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237eb8da' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  min-width: 140px;
}

.room-select:hover {
  border-color: rgba(90, 139, 196, 0.7);
  background-color: rgba(25, 25, 50, 0.9);
}

.room-select:focus {
  outline: none;
  border-color: #5a8bc4;
  box-shadow: 0 0 0 2px rgba(90, 139, 196, 0.2);
}

.room-user-count {
  font-size: 12px;
  color: #888;
  padding: 2px 6px;
  background: rgba(136, 136, 136, 0.1);
  border-radius: 4px;
  white-space: nowrap;
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.15s;
}

.msg-sender:hover {
  text-decoration: none;
  background: rgba(255, 255, 255, 0.05);
}

.msg-sect {
  font-size: 11px;
  font-weight: 500;
  color: #8ab8d6;
  background: rgba(138, 184, 214, 0.12);
  padding: 1px 5px;
  border-radius: 6px;
  border: 1px solid rgba(138, 184, 214, 0.2);
}

.msg-sender-name {
  font-size: 13px;
}

.msg-receiver {
  color: #e8a0bf;
  cursor: pointer;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.15s;
}

.msg-receiver:hover {
  text-decoration: none;
  background: rgba(255, 255, 255, 0.05);
}

.msg-receiver-name {
  font-size: 13px;
}

.msg-arrow {
  color: #666;
  font-size: 12px;
  padding: 0 2px;
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
  border-bottom: 1px solid rgba(138, 184, 214, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-list-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.user-list-header h4 {
  border: none;
  padding: 0;
  margin-bottom: 0;
  color: #8ab8d6;
}

.user-search-input {
  width: 100%;
  padding: 6px 10px !important;
  font-size: 12px !important;
  border-radius: 6px;
  background: rgba(15, 15, 30, 0.6);
  border: 1px solid rgba(138, 184, 214, 0.2) !important;
  color: #eee;
  transition: all 0.2s;
}

.user-search-input:focus {
  border-color: #8ab8d6 !important;
  box-shadow: 0 0 8px rgba(138, 184, 214, 0.3);
  background: rgba(15, 15, 30, 0.8);
}

.user-search-input::placeholder {
  color: #666;
}

.empty-user-list {
  text-align: center;
  color: #555;
  font-size: 13px;
  padding: 20px 0;
}

.user-list {
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 280px);
  padding: 4px;
}

.user-item {
  display: grid;
  grid-template-columns: 20px 42px 1fr auto;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  margin-bottom: 2px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.user-item:hover {
  background: rgba(74, 124, 89, 0.15);
  border-color: rgba(74, 124, 89, 0.3);
  transform: translateX(2px);
}

.user-selected {
  background: rgba(74, 124, 89, 0.25);
  border-color: rgba(74, 124, 89, 0.5);
}

.gender-icon {
  font-size: 15px;
  font-weight: bold;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.gender-icon.male {
  color: #4B87C3;
  text-shadow: 0 0 4px rgba(75, 135, 195, 0.4);
}

.gender-icon.female {
  color: #e8a0bf;
  text-shadow: 0 0 4px rgba(232, 160, 191, 0.4);
}

.user-grade {
  font-size: 11px;
  color: #ffd700;
  font-weight: 600;
  background: rgba(255, 215, 0, 0.1);
  padding: 2px 4px;
  border-radius: 4px;
  text-align: center;
  flex-shrink: 0;
}

.user-name {
  color: #eee;
  font-weight: 500;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-sect-tag {
  font-size: 10px;
  color: #8ab8d6;
  background: rgba(138, 184, 214, 0.15);
  padding: 1px 5px;
  border-radius: 6px;
  white-space: nowrap;
  font-weight: normal;
}

.user-sect {
  font-size: 11px;
  color: #8ab8d6;
  background: rgba(138, 184, 214, 0.1);
  padding: 2px 6px;
  border-radius: 8px;
  white-space: nowrap;
  flex-shrink: 0;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-sect-empty {
  font-size: 11px;
  color: #666;
  background: rgba(102, 102, 102, 0.1);
  padding: 2px 6px;
  border-radius: 8px;
  white-space: nowrap;
  flex-shrink: 0;
}

.scrollbar-wrapper {
  overflow-y: auto;
}

.scrollbar-wrapper::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-wrapper::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.scrollbar-wrapper::-webkit-scrollbar-thumb {
  background: rgba(75, 135, 195, 0.3);
  border-radius: 3px;
}

.scrollbar-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 135, 195, 0.5);
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
  padding: 10px 14px;
}

/* 工具栏 */
.toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

.toolbar-group {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.toolbar-btn {
  padding: 6px 12px;
  background: rgba(75, 135, 195, 0.15);
  border: 1px solid rgba(75, 135, 195, 0.3);
  border-radius: 6px;
  color: #7eb8da;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.toolbar-btn:hover {
  background: rgba(75, 135, 195, 0.25);
  transform: translateY(-1px);
}

.toolbar-btn.active {
  background: rgba(75, 135, 195, 0.35);
  border-color: #4B87C3;
  box-shadow: 0 0 8px rgba(75, 135, 195, 0.4);
}

.toggle-checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #aaa;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.toggle-checkbox input {
  width: auto;
  cursor: pointer;
}

.toggle-label {
  color: #ccc;
}

.filter-select-small {
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(15, 15, 30, 0.8), rgba(20, 20, 40, 0.9));
  border: 1px solid rgba(90, 139, 196, 0.4);
  border-radius: 6px;
  color: #ddd;
  font-size: 13px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237eb8da' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 32px;
  transition: all 0.2s;
  min-width: 80px;
}

.filter-select-small:hover {
  border-color: rgba(90, 139, 196, 0.6);
}

.filter-select-small:focus {
  border-color: #5a8bc4;
  outline: none;
  box-shadow: 0 0 10px rgba(90, 139, 196, 0.4);
}

.filter-select-small option {
  background: rgba(10, 10, 25, 0.98);
  color: #ddd;
  padding: 8px 12px;
}

/* 面板容器 */
.panel-container {
  margin-bottom: 12px;
}

.panel {
  background: rgba(15, 15, 30, 0.5);
  border: 1px solid rgba(75, 135, 195, 0.2);
  border-radius: 8px;
  padding: 12px;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 颜色面板 */
.panel-colors {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-colors .color-picker-group {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.panel-colors .color-picker-group label {
  color: #888;
  font-size: 13px;
  padding-top: 2px;
  min-width: 40px;
}

.panel-colors .color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.panel-colors .color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.15s;
}

.panel-colors .color-swatch:hover {
  transform: scale(1.25);
  border-color: rgba(255, 255, 255, 0.4);
}

.panel-colors .color-swatch.active {
  border-color: #fff;
  transform: scale(1.25);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
}

/* 表情面板 */
.panel-emoticons {
  padding: 10px;
}

.emoticon-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.emoticon-tab {
  padding: 5px 12px;
  background: rgba(15, 15, 30, 0.6);
  border: 1px solid rgba(75, 135, 195, 0.2);
  border-radius: 5px;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.emoticon-tab:hover {
  background: rgba(75, 135, 195, 0.2);
  color: #7eb8da;
}

.emoticon-tab.active {
  background: rgba(75, 135, 195, 0.3);
  border-color: #4B87C3;
  color: #fff;
}

.emoticon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 280px;
  overflow-y: auto;
}

.emoticon-grid::-webkit-scrollbar {
  width: 8px;
}

.emoticon-grid::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.emoticon-grid::-webkit-scrollbar-thumb {
  background: rgba(75, 135, 195, 0.4);
  border-radius: 4px;
}

.emoticon-btn {
  width: 42px;
  height: 42px;
  padding: 0;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.emoticon-btn:hover {
  background: rgba(75, 135, 195, 0.25);
  border-color: rgba(75, 135, 195, 0.5);
  transform: scale(1.1);
}

.emoticon-btn.active {
  background: rgba(75, 135, 195, 0.35);
  border-color: #4B87C3;
  box-shadow: 0 0 10px rgba(75, 135, 195, 0.5);
}

.emoticon-btn img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

/* 动作面板 */
.panel-actions {
  padding: 10px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-btn {
  padding: 8px 16px;
  background: rgba(75, 135, 195, 0.15);
  border: 1px solid rgba(75, 135, 195, 0.25);
  border-radius: 6px;
  color: #aaa;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(75, 135, 195, 0.25);
  color: #7eb8da;
  transform: translateY(-1px);
}

.action-btn.active {
  background: rgba(75, 135, 195, 0.35);
  border-color: #4B87C3;
  color: #fff;
  box-shadow: 0 0 8px rgba(75, 135, 195, 0.4);
}

/* 命令面板 */
.panel-commands {
  padding: 12px;
}

.command-input-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.cmd-select-large {
  flex: 1;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(15, 15, 30, 0.8), rgba(20, 20, 40, 0.9));
  border: 1px solid rgba(75, 135, 195, 0.4);
  border-radius: 8px;
  color: #ddd;
  font-size: 14px;
  cursor: pointer;
  min-width: 180px;
  max-width: 400px;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%237eb8da' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;
  transition: all 0.2s;
}

.cmd-select-large:hover {
  border-color: rgba(75, 135, 195, 0.6);
  background-color: rgba(20, 20, 40, 0.9);
}

.cmd-select-large:focus {
  border-color: #4B87C3;
  outline: none;
  box-shadow: 0 0 12px rgba(75, 135, 195, 0.4);
}

.cmd-select-large option {
  background: rgba(10, 10, 25, 0.98);
  color: #ddd;
  padding: 10px 14px;
}

.cmd-target-input {
  flex: 1;
  max-width: 160px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(15, 15, 30, 0.8), rgba(20, 20, 40, 0.9));
  border: 1px solid rgba(75, 135, 195, 0.4);
  border-radius: 8px;
  color: #ddd;
  font-size: 14px;
  transition: all 0.2s;
}

.cmd-target-input:focus {
  border-color: #4B87C3;
  outline: none;
  box-shadow: 0 0 12px rgba(75, 135, 195, 0.4);
}

.command-tips {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.tip-icon {
  font-size: 14px;
}

/* 主输入行 */
.input-row-main {
  display: flex;
  gap: 10px;
  align-items: center;
}

.input-with-receiver {
  flex: 1;
  display: flex;
  gap: 8px;
}

.receiver-input-main {
  width: 140px;
  min-width: 140px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(15, 15, 30, 0.8), rgba(20, 20, 40, 0.9));
  border: 1px solid rgba(75, 135, 195, 0.4);
  border-radius: 8px;
  color: #ddd;
  font-size: 14px;
  transition: all 0.2s;
}

.receiver-input-main::placeholder {
  color: #666;
}

.receiver-input-main:focus {
  border-color: #4B87C3;
  outline: none;
  box-shadow: 0 0 12px rgba(75, 135, 195, 0.4);
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

.btn-action {
  padding: 10px 20px;
  font-size: 14px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(106, 172, 122, 0.3);
  transition: all 0.2s;
}

.btn-action:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(106, 172, 122, 0.4);
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .toolbar-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar-group {
    justify-content: space-between;
  }
  
  .receiver-input-main {
    width: 120px;
  }
  
  .emoticon-btn {
    width: 38px;
    height: 38px;
  }
  
  .emoticon-btn img {
    width: 28px;
    height: 28px;
  }
}

@media (max-width: 768px) {
  .chat-input-area {
    padding: 10px 12px;
  }
  
  .toolbar-btn {
    padding: 8px 12px;
    font-size: 12px;
    flex: 1;
    text-align: center;
  }
  
  .toolbar-group {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .toggle-checkbox {
    padding: 8px 12px;
    background: rgba(75, 135, 195, 0.15);
    border: 1px solid rgba(75, 135, 195, 0.3);
    border-radius: 6px;
  }
  
  .filter-select-small {
    flex: 1;
  }
  
  .input-row-main {
    flex-wrap: nowrap;
    gap: 8px;
  }
  
  .input-with-receiver {
    order: 1;
    width: auto;
    flex: 1;
    display: flex;
    gap: 6px;
  }
  
  .receiver-input-main {
    width: 80px;
    min-width: 80px;
    padding: 8px 10px !important;
    font-size: 13px !important;
  }
  
  .msg-input {
    flex: 1;
    padding: 8px 12px !important;
    font-size: 14px !important;
  }
  
  .char-count {
    order: 2;
    min-width: 40px;
    font-size: 11px;
  }
  
  .send-btn {
    order: 3;
    padding: 8px 14px;
    min-width: 60px;
    font-size: 13px;
  }
  
  .btn-action {
    order: 4;
    padding: 8px 14px;
    font-size: 13px;
    min-width: 60px;
  }
  
  /* 命令面板优化 */
  .cmd-select-large {
    font-size: 13px;
    padding: 8px 12px;
  }
  
  .cmd-target-input {
    flex: 1;
    max-width: none;
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .emoticon-grid {
    max-height: 200px;
  }
  
  .emoticon-btn {
    width: 34px;
    height: 34px;
  }
  
  .emoticon-btn img {
    width: 24px;
    height: 24px;
  }
}

@media (max-width: 480px) {
  .chat-input-area {
    padding: 8px 10px;
  }
  
  .toolbar-btn {
    padding: 6px 10px;
    font-size: 11px;
  }
  
  .receiver-input-main {
    width: 70px;
    min-width: 70px;
  }
  
  .msg-input {
    font-size: 13px;
  }
  
  .send-btn,
  .btn-action {
    padding: 8px 12px;
    font-size: 12px;
    min-width: 50px;
  }
  
  .cmd-select-large {
    font-size: 12px;
    padding: 8px 10px;
  }
  
  .emoticon-btn {
    width: 30px;
    height: 30px;
  }
  
  .emoticon-btn img {
    width: 22px;
    height: 22px;
  }
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

/* 移动端汉堡菜单按钮 */
.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.menu-toggle:hover {
  background: rgba(126, 184, 218, 0.15);
}

.hamburger {
  display: block;
  width: 22px;
  height: 2px;
  background: #fff;
  position: relative;
  transition: background 0.2s;
}

.hamburger::before,
.hamburger::after {
  content: '';
  position: absolute;
  width: 22px;
  height: 2px;
  background: #fff;
  left: 0;
  transition: transform 0.3s;
}

.hamburger::before {
  top: -7px;
}

.hamburger::after {
  top: 7px;
}

.menu-toggle.active .hamburger {
  background: transparent;
}

.menu-toggle.active .hamburger::before {
  transform: rotate(45deg);
  top: 0;
}

.menu-toggle.active .hamburger::after {
  transform: rotate(-45deg);
  top: 0;
}

/* 桌面端导航容器 */
.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 移动端抽屉菜单 */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1999;
  opacity: 0;
  animation: fadeIn 0.3s forwards;
}

.drawer-menu {
  position: fixed;
  top: 0;
  left: -280px;
  width: 280px;
  height: 100vh;
  background: linear-gradient(135deg, #1a3a5c 0%, #0f1a26 100%);
  z-index: 2000;
  box-shadow: 2px 0 24px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease;
  overflow-y: auto;
  overflow-x: hidden;
}

.drawer-menu.open {
  transform: translateX(280px);
}

@keyframes fadeIn {
  to { opacity: 1; }
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(126, 184, 218, 0.2);
  background: rgba(0, 0, 0, 0.2);
}

.drawer-title {
  font-size: 18px;
  font-weight: bold;
  color: #7eb8da;
}

.drawer-close {
  width: 32px;
  height: 32px;
  background: rgba(126, 184, 218, 0.15);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drawer-close:hover {
  background: rgba(126, 184, 218, 0.3);
}

.drawer-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid rgba(126, 184, 218, 0.1);
}

.drawer-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7eb8da, #4a7c9d);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

.drawer-user-details {
  flex: 1;
}

.drawer-username {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
}

.drawer-silver {
  font-size: 13px;
  color: #ffd700;
}

.drawer-nav {
  padding: 12px 0;
}

.drawer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  color: #c0d8e8;
  text-decoration: none;
  transition: all 0.2s;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  font-size: 15px;
}

.drawer-item:hover {
  background: rgba(126, 184, 218, 0.15);
  color: #fff;
}

.drawer-item.router-link-active {
  background: rgba(126, 184, 218, 0.25);
  color: #7eb8da;
  border-left: 3px solid #7eb8da;
}

.drawer-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.drawer-label {
  flex: 1;
}

.drawer-group {
  margin: 8px 0;
}

.drawer-group-title {
  padding: 10px 20px;
  font-size: 13px;
  color: #7eb8da;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.drawer-subitem {
  padding-left: 56px;
  font-size: 14px;
}

.drawer-admin {
  margin-top: 12px;
  border-top: 1px solid rgba(126, 184, 218, 0.15);
  background: rgba(255, 193, 7, 0.08);
}

.drawer-admin:hover {
  background: rgba(255, 193, 7, 0.15);
}

.drawer-logout {
  margin-top: 8px;
  border-top: 1px solid rgba(231, 76, 60, 0.2);
  color: #ff6b6b;
}

.drawer-logout:hover {
  background: rgba(231, 76, 60, 0.15);
  color: #ff5252;
}

/* 响应式工具类 */
.desktop-only {
  display: flex;
}

@media (max-width: 992px) {
  .menu-toggle {
    display: flex;
  }
  
  .desktop-only {
    display: none !important;
  }
  
  .nav-links {
    display: none;
  }
  
  .nav-user-info {
    display: none;
  }
}

@media (max-width: 768px) {
  .nav-bar {
    padding: 0 12px;
  }
  
  .nav-logo {
    font-size: 15px;
  }
  
  .logo-icon {
    font-size: 18px;
  }
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
