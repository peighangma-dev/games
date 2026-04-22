const { contextBridge, ipcRenderer } = require('electron')

// 向渲染进程暴露 Electron API
contextBridge.exposeInMainWorld('electron', {
  // 获取配置
  getConfig: () => ipcRenderer.invoke('get-config'),
  
  // 保存配置
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // 最小化到托盘
  minimizeToTray: () => ipcRenderer.send('minimize-to-tray'),
  
  // 关闭到托盘
  closeToTray: (force) => ipcRenderer.send('close-to-tray', force),
  
  // 获取应用信息
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // 控制声音
  playSound: (soundPath) => ipcRenderer.send('play-sound', soundPath),
  
  // 监听事件
  onSoundToggle: (callback) => {
    ipcRenderer.on('sound-toggle', (event, data) => callback(data))
  },
  
  onOpenSettings: (callback) => {
    ipcRenderer.on('open-settings', () => callback())
  },
  
  // 移除监听
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('sound-toggle')
    ipcRenderer.removeAllListeners('open-settings')
  }
})
