<template>
  <div class="server-settings">
    <h3>🌐 服务器地址配置</h3>

    <!-- 当前连接状态 -->
    <div class="connection-status-panel" :class="connectionStatus.class">
      <div class="status-icon">{{ connectionStatus.icon }}</div>
      <div class="status-info">
        <div class="status-title">{{ connectionStatus.title }}</div>
        <div class="status-detail">{{ connectionStatus.detail }}</div>
      </div>
      <button @click="testConnection" class="btn btn-sm" :disabled="testing">
        {{ testing ? '测试中...' : '刷新' }}
      </button>
    </div>

    <!-- 服务器地址输入 -->
    <div class="settings-section">
      <h4>📍 服务器地址</h4>
      <div class="form-group">
        <label>后端服务器 URL</label>
        <div class="input-with-btn">
          <input 
            v-model="serverUrl" 
            type="url" 
            class="form-input" 
            placeholder="http://192.168.1.100:3001 或 https://jhchat.example.com"
            @keyup.enter="testConnection"
          />
          <button @click="testConnection" class="btn btn-sm btn-primary" :disabled="testing">
            {{ testing ? '测试...' : '测试' }}
          </button>
        </div>
        <p class="form-hint">请输入完整的 URL，包含协议（http:// 或 https://）</p>
      </div>

      <!-- 快捷预设 -->
      <div class="form-group">
        <label>快捷选择</label>
        <div class="preset-grid">
          <button 
            v-for="(preset, index) in presets" 
            :key="index"
            @click="selectPreset(preset)"
            :class="['preset-btn', preset.enabled ? 'enabled' : 'disabled']"
            :title="preset.description"
          >
            <span class="preset-name">{{ preset.name }}</span>
            <span class="preset-url">{{ preset.url }}</span>
          </button>
        </div>
      </div>

      <!-- 预设管理 -->
      <div class="form-group">
        <div class="action-row">
          <label>管理预设</label>
          <div class="action-btns">
            <button @click="showAddPreset = true" class="btn btn-sm">➕ 添加</button>
            <button @click="showImportExport = true" class="btn btn-sm">📥 导入/导出</button>
            <button @click="resetPresets" class="btn btn-sm btn-danger">🔄 重置</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 服务器信息 -->
    <div class="settings-section" v-if="serverInfo">
      <h4>ℹ️ 服务器信息</h4>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">应用名称</span>
          <span class="value">{{ serverInfo.app_name }}</span>
        </div>
        <div class="info-item">
          <span class="label">版本</span>
          <span class="value">{{ serverInfo.version }}</span>
        </div>
        <div class="info-item">
          <span class="label">环境</span>
          <span class="value">{{ serverInfo.environment || '生产' }}</span>
        </div>
        <div class="info-item">
          <span class="label">数据库</span>
          <span class="value">{{ serverInfo.database || 'MySQL' }}</span>
        </div>
        <div class="info-item">
          <span class="label">响应时间</span>
          <span class="value">{{ responseTime }}ms</span>
        </div>
        <div class="info-item">
          <span class="label">最后同步</span>
          <span class="value">{{ lastSyncTime }}</span>
        </div>
      </div>
    </div>

    <!-- 添加预设对话框 -->
    <div v-if="showAddPreset" class="modal-overlay" @click="showAddPreset = false">
      <div class="modal" @click.stop>
        <h4>添加服务器预设</h4>
        <div class="form-group">
          <label>名称</label>
          <input v-model="newPreset.name" type="text" class="form-input" placeholder="例如：公司服务器" />
        </div>
        <div class="form-group">
          <label>地址</label>
          <input v-model="newPreset.url" type="url" class="form-input" placeholder="https://example.com" />
        </div>
        <div class="form-group">
          <label>描述</label>
          <input v-model="newPreset.description" type="text" class="form-input" placeholder="可选描述信息" />
        </div>
        <div class="modal-actions">
          <button @click="showAddPreset = false" class="btn">取消</button>
          <button @click="addPreset" class="btn btn-primary">添加</button>
        </div>
      </div>
    </div>

    <!-- 导入/导出对话框 -->
    <div v-if="showImportExport" class="modal-overlay" @click="showImportExport = false">
      <div class="modal" @click.stop>
        <h4>导入/导出配置</h4>
        <div class="import-export-tabs">
          <button 
            :class="['tab-btn', ieTab === 'export' ? 'active' : '']"
            @click="ieTab = 'export'"
          >
            导出
          </button>
          <button 
            :class="['tab-btn', ieTab === 'import' ? 'active' : '']"
            @click="ieTab = 'import'"
          >
            导入
          </button>
        </div>

        <div v-if="ieTab === 'export'" class="tab-content">
          <p class="hint">复制以下配置保存或分享给他人：</p>
          <textarea v-model="exportText" rows="8" class="form-input code-input" readonly></textarea>
          <button @click="copyExport" class="btn btn-primary full-width">📋 复制配置</button>
        </div>

        <div v-if="ieTab === 'import'" class="tab-content">
          <p class="hint">粘贴配置字符串：</p>
          <textarea v-model="importText" rows="8" class="form-input code-input" placeholder="粘贴 JSON 配置..."></textarea>
          <button @click="importConfig" class="btn btn-primary full-width">📥 导入配置</button>
        </div>

        <div class="modal-actions">
          <button @click="showImportExport = false" class="btn">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../utils/api'

const serverUrl = ref('')
const testing = ref(false)
const responseTime = ref(0)
const lastSyncTime = ref('')
const serverInfo = ref(null)
const showAddPreset = ref(false)
const showImportExport = ref(false)
const ieTab = ref('export')
const exportText = ref('')
const importText = ref('')

const newPreset = reactive({
  name: '',
  url: '',
  description: ''
})

const presets = ref([
  { name: '本地开发', url: 'http://localhost:3001', description: '本地开发环境', enabled: true },
  { name: '局域网', url: 'http://192.168.1.100:3001', description: '公司/家庭局域网', enabled: true },
  { name: '公网地址', url: 'https://jhchat.example.com', description: '公网服务器', enabled: false }
])

const connectionStatus = computed(() => {
  if (!serverUrl.value) {
    return { class: 'unknown', icon: '❓', title: '未配置', detail: '请选择或输入服务器地址' }
  }
  if (testing.value) {
    return { class: 'testing', icon: '⏳', title: '测试中', detail: '正在连接服务器...' }
  }
  if (serverInfo.value) {
    return { class: 'success', icon: '✅', title: '已连接', detail: serverUrl.value }
  }
  return { class: 'error', icon: '❌', title: '连接失败', detail: '无法连接到服务器' }
})

// 测试连接
const testConnection = async () => {
  if (!serverUrl.value) {
    alert('请输入服务器地址')
    return
  }

  testing.value = true
  const startTime = Date.now()

  try {
    // 尝试访问 API
    const response = await fetch(`${serverUrl.value.replace(/\/$/, '')}/api/ping`, {
      method: 'GET',
      timeout: 5000
    })

    responseTime.value = Date.now() - startTime

    if (response.ok) {
      try {
        const data = await response.json()
        serverInfo.value = {
          app_name: data.app_name || '江湖聊天室',
          version: data.version || '未知',
          environment: data.environment || '生产',
          database: data.database || 'MySQL'
        }
      } catch (e) {
        serverInfo.value = { version: '未知' }
      }

      // 保存配置
      saveServerUrl()
      alert(`连接成功！\n响应时间：${responseTime.value}ms`)
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    console.error('连接失败:', error)
    serverInfo.value = null
    alert(`连接失败：${error.message}\n请检查：\n1. 服务器地址是否正确\n2. 服务器是否已启动\n3. 网络连接是否正常`)
  } finally {
    testing.value = false
    lastSyncTime.value = new Date().toLocaleString('zh-CN')
  }
}

// 保存服务器地址
const saveServerUrl = () => {
  localStorage.setItem('server_url', serverUrl.value)
  // 保存到 Electron 配置
  if (window.electron) {
    window.electron.saveConfig({ serverUrl: serverUrl.value })
  }
}

// 选择预设
const selectPreset = (preset) => {
  serverUrl.value = preset.url
  testConnection()
}

// 添加预设
const addPreset = () => {
  if (!newPreset.name || !newPreset.url) {
    alert('请填写名称和地址')
    return
  }
  presets.value.push({ ...newPreset, enabled: true })
  savePresets()
  showAddPreset.value = false
  Object.assign(newPreset, { name: '', url: '', description: '' })
}

// 保存预设
const savePresets = () => {
  localStorage.setItem('server_presets', JSON.stringify(presets.value))
}

// 重置预设
const resetPresets = () => {
  if (confirm('确定要重置为默认预设吗？')) {
    presets.value = [
      { name: '本地开发', url: 'http://localhost:3001', description: '本地开发环境', enabled: true },
      { name: '局域网', url: 'http://192.168.1.100:3001', description: '公司/家庭局域网', enabled: true },
      { name: '公网地址', url: 'https://jhchat.example.com', description: '公网服务器', enabled: false }
    ]
    savePresets()
  }
}

// 导出配置
const generateExport = () => {
  const config = {
    serverUrl: serverUrl.value,
    presets: presets.value
  }
  exportText.value = JSON.stringify(config, null, 2)
}

// 复制导出
const copyExport = () => {
  navigator.clipboard.writeText(exportText.value).then(() => {
    alert('配置已复制到剪贴板')
  }).catch(() => {
    alert('复制失败，请手动复制')
  })
}

// 导入配置
const importConfig = () => {
  try {
    const config = JSON.parse(importText.value)
    if (config.serverUrl) {
      serverUrl.value = config.serverUrl
      saveServerUrl()
    }
    if (config.presets && Array.isArray(config.presets)) {
      presets.value = config.presets
      savePresets()
    }
    alert('配置导入成功！')
    showImportExport.value = false
    testConnection()
  } catch (error) {
    alert('导入失败：配置格式错误')
  }
}

// 加载配置
const loadConfig = () => {
  // 加载服务器地址
  const savedUrl = localStorage.getItem('server_url')
  if (savedUrl) {
    serverUrl.value = savedUrl
  } else if (window.electron) {
    // Electron 模式
    window.electron.getConfig().then(config => {
      if (config && config.serverUrl) {
        serverUrl.value = config.serverUrl
      }
    })
  }

  // 加载预设
  const savedPresets = localStorage.getItem('server_presets')
  if (savedPresets) {
    try {
      presets.value = JSON.parse(savedPresets)
    } catch (e) {
      console.error('加载预设失败:', e)
    }
  }
}

onMounted(() => {
  loadConfig()
  generateExport()
})
</script>

<style scoped>
.server-settings {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h3 {
  color: #7eb8da;
  font-size: 22px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(75, 135, 195, 0.3);
}

h4 {
  color: #fff;
  font-size: 16px;
  margin-bottom: 16px;
}

/* 连接状态面板 */
.connection-status-panel {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.connection-status-panel.success {
  background: rgba(76, 175, 80, 0.15);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.connection-status-panel.error {
  background: rgba(244, 67, 54, 0.15);
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.connection-status-panel.testing {
  background: rgba(255, 152, 0, 0.15);
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.connection-status-panel.unknown {
  background: rgba(158, 158, 158, 0.15);
  border: 1px solid rgba(158, 158, 158, 0.3);
}

.status-icon {
  font-size: 32px;
}

.status-info {
  flex: 1;
}

.status-title {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
}

.status-detail {
  font-size: 13px;
  color: #888;
}

/* 设置区块 */
.settings-section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
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
}

.form-input:focus {
  outline: none;
  border-color: #4B87C3;
}

.code-input {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  resize: vertical;
}

.input-with-btn {
  display: flex;
  gap: 8px;
}

.input-with-btn .form-input {
  flex: 1;
}

.form-hint {
  color: #888;
  font-size: 12px;
  margin-top: 6px;
}

/* 预设网格 */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.preset-btn {
  padding: 12px;
  border-radius: 6px;
  border: 2px solid;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  background: transparent;
}

.preset-btn.enabled {
  border-color: #4B87C3;
  background: rgba(75, 135, 195, 0.1);
}

.preset-btn.disabled {
  border-color: #555;
  background: rgba(100, 100, 100, 0.1);
  opacity: 0.6;
}

.preset-btn:hover {
  transform: translateY(-2px);
}

.preset-name {
  display: block;
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
}

.preset-url {
  display: block;
  font-size: 11px;
  color: #888;
  font-family: monospace;
}

/* 操作行 */
.action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-btns {
  display: flex;
  gap: 8px;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.info-item {
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.info-item .label {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
}

.info-item .value {
  display: block;
  font-size: 14px;
  color: #fff;
  font-weight: bold;
}

/* 模态框 */
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

.modal {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 24px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal h4 {
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.full-width {
  width: 100%;
}

/* 导入导出标签页 */
.import-export-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
  cursor: pointer;
  font-size: 14px;
}

.tab-btn.active {
  background: #4B87C3;
  color: #fff;
}

.tab-content {
  margin-bottom: 16px;
}

.tab-content .hint {
  color: #888;
  font-size: 13px;
  margin-bottom: 8px;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .server-settings {
    padding: 16px;
  }

  .preset-grid {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr 1fr;
  }

  .action-row {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .action-btns {
    width: 100%;
  }

  .action-btns button {
    flex: 1;
  }
}
</style>
