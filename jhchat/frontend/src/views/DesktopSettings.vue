<template>
  <div class="desktop-settings">
    <h3>🖥️ 桌面版设置</h3>

    <!-- 快捷键设置 -->
    <div class="settings-section">
      <h4>⌨️ 快捷键设置</h4>
      <div class="form-group">
        <label>老板键（隐藏窗口）</label>
        <div class="shortcut-input">
          <input 
            v-model="shortcuts.bossKey" 
            type="text" 
            class="form-input" 
            placeholder="例如：Alt+X"
            @keydown="preventDefaults($event)"
            @keyup="recordShortcut($event)"
          />
          <button @click="resetShortcut('bossKey')" class="btn btn-sm">重置</button>
        </div>
        <p class="form-hint">按组合键设置老板键，再次按下可隐藏/显示窗口。支持组合键如 Ctrl+Alt+X</p>
      </div>
    </div>

    <!-- 声音控制 -->
    <div class="settings-section">
      <h4>🔊 声音控制</h4>
      <div class="checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="sound.enable" />
          <span>启用背景声音和音效</span>
        </label>
        <button @click="testSound" class="btn btn-sm" :disabled="!sound.enable">试听音效</button>
      </div>
    </div>

    <!-- 窗口行为 -->
    <div class="settings-section">
      <h4>🪟 窗口行为</h4>
      <div class="checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="windowBehaviors.startMinimized" />
          <span>启动时最小化到托盘</span>
        </label>
      </div>
      <div class="checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="windowBehaviors.autoStart" />
          <span>开机自动启动</span>
        </label>
      </div>
      <div class="checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="windowBehaviors.alwaysOnTop" />
          <span>窗口置顶显示</span>
        </label>
      </div>
    </div>

    <!-- 通知设置 -->
    <div class="settings-section">
      <h4>🔔 通知设置</h4>
      <div class="checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="notification.enable" />
          <span>启用桌面通知</span>
        </label>
      </div>
      <div class="checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="notification.showUnread" />
          <span>托盘图标显示未读消息数</span>
        </label>
      </div>
    </div>

    <!-- 应用信息 -->
    <div class="settings-section">
      <h4>ℹ️ 应用信息</h4>
      <div class="info-item">
        <span class="label">应用名称</span>
        <span class="value">{{ appInfo.name }}</span>
      </div>
      <div class="info-item">
        <span class="label">版本</span>
        <span class="value">{{ appInfo.version }}</span>
      </div>
      <div class="info-item">
        <span class="label">平台</span>
        <span class="value">{{ appInfo.platform }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="settings-section">
      <button @click="saveSettings" class="btn btn-primary full-width">保存设置</button>
      <button @click="restoreDefaults" class="btn full-width">恢复默认</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'

const loading = ref(false)
const shortcuts = reactive({
  bossKey: 'Alt+X'
})

const sound = reactive({
  enable: true
})

const windowBehaviors = reactive({
  startMinimized: false,
  autoStart: false,
  alwaysOnTop: false,
  closeToTray: true
})

const notification = reactive({
  enable: true,
  showUnread: true
})

const appInfo = reactive({
  name: '江湖聊天室',
  version: '1.0.0',
  platform: 'Windows'
})

let isRecording = false

// 记录快捷键
const recordShortcut = (event) => {
  event.preventDefault()
  event.stopPropagation()
  
  const keys = []
  
  if (event.ctrlKey) keys.push('Ctrl')
  if (event.altKey) keys.push('Alt')
  if (event.metaKey) keys.push('Meta')
  if (event.shiftKey && event.key !== 'Shift') keys.push('Shift')
  
  const key = event.key
  if (key && !['Control', 'Alt', 'Meta', 'Shift'].includes(key)) {
    keys.push(key.charAt(0).toUpperCase() + key.slice(1))
  }
  
  if (keys.length > 0) {
    shortcuts.bossKey = keys.join('+')
  }
}

const preventDefaults = (event) => {
  event.preventDefault()
  event.stopPropagation()
}

const resetShortcut = (key) => {
  if (key === 'bossKey') {
    shortcuts.bossKey = 'Alt+X'
  }
}

const testSound = () => {
  // 播放测试音效
  const audio = new Audio('/sounds/notification.mp3')
  audio.volume = 0.5
  audio.play().catch(e => console.log('音效播放失败:', e))
}

const saveSettings = async () => {
  if (!window.electron) {
    alert('请在桌面客户端中使用此功能')
    return
  }
  
  loading.value = true
  try {
    const config = {
      bossKey: shortcuts.bossKey,
      enableSound: sound.enable,
      startMinimized: windowBehaviors.startMinimized,
      autoStart: windowBehaviors.autoStart,
      alwaysOnTop: windowBehaviors.alwaysOnTop,
      enableNotification: notification.enable
    }
    
    const success = await window.electron.saveConfig(config)
    if (success) {
      alert('设置已保存！')
    } else {
      alert('保存失败')
    }
  } catch (e) {
    console.error('保存设置失败:', e)
    alert('保存失败：' + e.message)
  } finally {
    loading.value = false
  }
}

const restoreDefaults = () => {
  shortcuts.bossKey = 'Alt+X'
  sound.enable = true
  windowBehaviors.startMinimized = false
  windowBehaviors.autoStart = false
  windowBehaviors.alwaysOnTop = false
  notification.enable = true
  notification.showUnread = true
}

const loadSettings = async () => {
  if (!window.electron) {
    // 浏览器模式，使用本地存储
    const saved = localStorage.getItem('desktopConfig')
    if (saved) {
      const config = JSON.parse(saved)
      Object.assign(shortcuts, config.shortcuts || {})
      Object.assign(sound, config.sound || {})
      Object.assign(windowBehaviors, config.windowBehaviors || {})
      Object.assign(notification, config.notification || {})
    }
    return
  }
  
  try {
    const config = await window.electron.getConfig()
    if (config) {
      if (config.bossKey) shortcuts.bossKey = config.bossKey
      if (config.enableSound !== undefined) sound.enable = config.enableSound
      if (config.startMinimized !== undefined) windowBehaviors.startMinimized = config.startMinimized
      if (config.autoStart !== undefined) windowBehaviors.autoStart = config.autoStart
      if (config.alwaysOnTop !== undefined) windowBehaviors.alwaysOnTop = config.alwaysOnTop
      if (config.enableNotification !== undefined) notification.enable = config.enableNotification
    }
    
    const info = await window.electron.getAppInfo()
    Object.assign(appInfo, info)
  } catch (e) {
    console.error('加载设置失败:', e)
  }
}

// 保存配置到本地存储（浏览器模式）
const saveToLocalStorage = () => {
  const config = {
    shortcuts: { ...shortcuts },
    sound: { ...sound },
    windowBehaviors: { ...windowBehaviors },
    notification: { ...notification }
  }
  localStorage.setItem('desktopConfig', JSON.stringify(config))
}

onMounted(() => {
  loadSettings()
  
  // 监听来自 Electron 的事件
  if (window.electron) {
    window.electron.onSoundToggle((data) => {
      sound.enable = data.enable
      saveToLocalStorage()
    })
    
    window.electron.onOpenSettings(() => {
      // 打开设置页面
    })
  }
})

onUnmounted(() => {
  if (window.electron) {
    window.electron.removeAllListeners()
  }
})
</script>

<style scoped>
.desktop-settings {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
}

h3 {
  color: #7eb8da;
  font-size: 22px;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(75, 135, 195, 0.3);
}

h4 {
  color: #fff;
  font-size: 16px;
  margin-bottom: 16px;
}

.settings-section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  color: #ccc;
  font-size: 14px;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 4px;
  font-size: 16px;
  font-family: monospace;
}

.form-input:focus {
  outline: none;
  border-color: #4B87C3;
}

.shortcut-input {
  display: flex;
  gap: 8px;
}

.shortcut-input .form-input {
  flex: 1;
}

.form-hint {
  color: #888;
  font-size: 12px;
  margin-top: 6px;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ccc;
  font-size: 14px;
  cursor: pointer;
  flex: 1;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #4B87C3;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #888;
  font-size: 14px;
}

.info-item .value {
  color: #fff;
  font-size: 14px;
  font-weight: bold;
}

.full-width {
  width: 100%;
  margin-bottom: 8px;
}

.btn {
  min-height: 44px;
  cursor: pointer;
}

.btn-primary {
  background: #4B87C3;
  color: #fff;
}

.btn-primary:hover {
  background: #3a75b0;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
