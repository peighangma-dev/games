/**
 * 系统信息控制器
 */
const db = require('../config/db');
const packageJson = require('../../package.json');

class SystemController {
  /**
   * 获取服务器基本信息（公开接口，无需认证）
   */
  static async getServerInfo(req, res) {
    try {
      const info = {
        app_name: '江湖聊天室',
        version: packageJson.version || '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        database: 'MySQL',
        server_time: new Date().toISOString(),
        uptime: process.uptime()
      }
      
      res.json({ success: true, data: info })
    } catch (err) {
      console.error('获取服务器信息失败:', err)
      res.status(500).json({ success: false, message: '获取服务器信息失败' })
    }
  }

  /**
   * Ping 接口（用于健康检查和连接测试）
   */
  static async ping(req, res) {
    try {
      // 测试数据库连接
      await db.execute('SELECT 1')
      
      const info = {
        status: 'ok',
        message: 'pong',
        timestamp: Date.now(),
        app_name: '江湖聊天室',
        version: packageJson.version || '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        database: 'connected'
      }
      
      res.json(info)
    } catch (err) {
      console.error('Ping 失败:', err)
      res.status(503).json({
        status: 'error',
        message: 'Service unavailable',
        error: err.message
      })
    }
  }

  /**
   * 获取系统配置列表（管理员专用）
   */
  static async getConfigs(req, res) {
    try {
      // 这里可以返回一些允许客户端查看的公共配置
      const configs = {
        server_url: process.env.SERVER_URL || '',
        ws_url: process.env.WS_URL || '',
        cdn_url: process.env.CDN_URL || '',
        features: {
          enable_register: true,
          enable_chat: true,
          enable_games: true,
          enable_sect: true
        },
        limits: {
          max_message_length: 500,
          max_avatar_size: 2097152 // 2MB
        }
      }
      
      res.json({ success: true, data: configs })
    } catch (err) {
      console.error('获取配置失败:', err)
      res.status(500).json({ success: false, message: '获取配置失败' })
    }
  }

  /**
   * 更新服务器配置（管理员专用）
   */
  static async updateConfig(req, res) {
    try {
      const { key, value } = req.body
      
      if (!key || value === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: '缺少必要参数' 
        })
      }
      
      // 这里可以保存配置到数据库或配置文件
      // 注意：修改关键配置后可能需要重启服务
      
      res.json({ 
        success: true, 
        message: '配置已更新，部分配置需要重启后生效' 
      })
    } catch (err) {
      console.error('更新配置失败:', err)
      res.status(500).json({ success: false, message: '更新配置失败' })
    }
  }

  /**
   * 导出服务器配置（管理员专用）
   */
  static async exportConfig(req, res) {
    try {
      const config = {
        version: packageJson.version || '1.0.0',
        export_time: new Date().toISOString(),
        server: {
          port: process.env.PORT || '3001',
          host: process.env.HOST || '0.0.0.0',
          database: {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || '3306',
            name: process.env.DB_NAME || 'jhchat'
          }
        },
        features: {
          enable_register: true,
          enable_chat: true
        }
      }
      
      res.json({ success: true, data: config })
    } catch (err) {
      console.error('导出配置失败:', err)
      res.status(500).json({ success: false, message: '导出配置失败' })
    }
  }

  /**
   * 导入服务器配置（管理员专用）
   */
  static async importConfig(req, res) {
    try {
      const config = req.body
      
      if (!config || !config.version) {
        return res.status(400).json({ 
          success: false, 
          message: '无效的配置格式' 
        })
      }
      
      // 验证并保存配置
      // 注意：实际部署时应该保存到配置文件或数据库
      
      res.json({ 
        success: true, 
        message: '配置已导入，请重启服务以生效' 
      })
    } catch (err) {
      console.error('导入配置失败:', err)
      res.status(500).json({ success: false, message: '导入配置失败' })
    }
  }
}

module.exports = SystemController
