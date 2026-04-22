const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, nativeImage, powerSaveBlocker } = require('electron')
const path = require('path')
const fs = require('fs')

// 防止屏幕休眠 ID
let powerSaveId = null

// 窗口实例
let mainWindow = null
let tray = null

// 配置文件路径
const configPath = path.join(app.getPath('userData'), 'config.json')

// 默认配置
const defaultConfig = {
  bossKey: 'Alt+X', // 老板键
  enableSound: true, // 是否启用声音
  enableNotification: true, // 是否启用通知
  alwaysOnTop: false, // 是否置顶
  startMinimized: false, // 启动时最小化
  autoStart: false // 开机自启
}

// 加载配置
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8')
      return { ...defaultConfig, ...JSON.parse(data) }
    }
  } catch (e) {
    console.error('加载配置失败:', e)
  }
  return { ...defaultConfig }
}

// 保存配置
function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    return true
  } catch (e) {
    console.error('保存配置失败:', e)
    return false
  }
}

// 当前配置
let appConfig = null

// 创建主窗口
function createWindow() {
  appConfig = loadConfig()
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: '江湖聊天室',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // 允许加载本地资源
      devTools: true // 生产环境可关闭
    },
    show: !appConfig.startMinimized,
    alwaysOnTop: appConfig.alwaysOnTop,
    frame: true,
    backgroundColor: '#1a1a2e'
  })

  // 加载应用
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`
  mainWindow.loadURL(startUrl)

  // 窗口关闭事件
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 窗口最小化事件
  mainWindow.on('minimize', (event) => {
    if (tray && process.platform === 'win32') {
      // event.preventDefault()
      // mainWindow.hide()
    }
  })

  // 注册全局快捷键
  registerGlobalShortcuts()

  // 创建系统托盘
  createTray()

  // 阻止电脑休眠（如果配置启用）
  if (powerSaveBlocker && !powerSaveBlocker.isStarted(powerSaveId)) {
    powerSaveId = powerSaveBlocker.start('prevent-app-suspension')
  }
}

// 注册全局快捷键
function registerGlobalShortcuts() {
  // 注销所有快捷键
  globalShortcut.unregisterAll()

  if (appConfig.bossKey) {
    try {
      const ret = globalShortcut.register(appConfig.bossKey, () => {
        toggleBossKey()
      })
      if (!ret) {
        console.log('注册老板键失败:', appConfig.bossKey)
      } else {
        console.log('老板键已注册:', appConfig.bossKey)
      }
    } catch (e) {
      console.error('注册快捷键异常:', e)
    }
  }
}

// 老板键功能 - 隐藏/显示窗口
function toggleBossKey() {
  if (!mainWindow) return
  
  if (mainWindow.isVisible()) {
    // 隐藏窗口并最小化到托盘
    mainWindow.hide()
    mainWindow.minimize()
  } else {
    // 显示窗口并恢复
    mainWindow.show()
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.focus()
  }
}

// 创建系统托盘
function createTray() {
  // 使用应用图标
  const iconPath = path.join(__dirname, 'icon.ico')
  const icon = nativeImage.createFromPath(iconPath)
  
  tray = new Tray(icon)
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏',
      click: () => {
        toggleBossKey()
      }
    },
    {
      label: '静音/取消静音',
      click: () => {
        toggleMute()
      }
    },
    { type: 'separator' },
    {
      label: '设置',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.webContents.send('open-settings')
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuiting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('江湖聊天室')
  tray.setContextMenu(contextMenu)
  
  // 双击托盘图标显示/隐藏
  tray.on('double-click', () => {
    toggleBossKey()
  })
}

// 切换静音
function toggleMute() {
  if (mainWindow) {
    const currentValue = appConfig.enableSound
    appConfig.enableSound = !currentValue
    saveConfig(appConfig)
    mainWindow.webContents.send('sound-toggle', { enable: appConfig.enableSound })
  }
}

// IPC 处理
function setupIPC() {
  // 获取配置
  ipcMain.handle('get-config', () => {
    return appConfig
  })

  // 保存配置
  ipcMain.handle('save-config', (event, config) => {
    const success = saveConfig({ ...appConfig, ...config })
    if (success) {
      appConfig = { ...appConfig, ...config }
      // 重新注册快捷键
      registerGlobalShortcuts()
    }
    return success
  })

  // 最小化到托盘
  ipcMain.on('minimize-to-tray', () => {
    if (mainWindow) {
      mainWindow.minimize()
      mainWindow.hide()
    }
  })

  // 关闭窗口（实际隐藏到托盘）
  ipcMain.on('close-to-tray', (event, force) => {
    if (force) {
      app.isQuiting = true
      app.quit()
    } else if (tray) {
      if (mainWindow) {
        mainWindow.hide()
      }
      event.returnValue = false
    }
  })

  // 获取应用信息
  ipcMain.handle('get-app-info', () => {
    return {
      version: app.getVersion(),
      name: app.getName(),
      platform: process.platform,
      arch: process.arch
    }
  })

  // 播放声音控制
  ipcMain.on('play-sound', (event, soundPath) => {
    if (!appConfig.enableSound) return
    // 这里可以集成音频播放
    // 简单起见，让前端处理音频播放
  })
}

// Electron 就绪事件
app.whenReady().then(() => {
  setupIPC()
  createWindow()
})

// 所有窗口关闭事件
app.on('window-all-closed', () => {
  // macOS 通常不关闭
  if (process.platform !== 'darwin') {
    app.isQuiting = true
    app.quit()
  }
})

// 应用激活事件
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 应用退出前
app.on('before-quit', () => {
  if (powerSaveId) {
    powerSaveBlocker.stop(powerSaveId)
  }
  app.isQuiting = true
})

// 第二个实例检查
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.show()
      mainWindow.focus()
    }
  })
}
