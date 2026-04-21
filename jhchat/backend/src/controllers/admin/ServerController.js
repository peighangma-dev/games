const db = require('../../config/db');
const { logger } = require('../../utils/logger');

/**
 * 全服控制与系统管理控制器
 */
class ServerController {
  /**
   * 全服广播
   */
  static async broadcast(req, res) {
    try {
      const { message, type = 'announcement', priority = 'normal', highlight = true } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          message: '广播内容不能为空',
          code: 'MESSAGE_REQUIRED'
        });
      }

      const io = req.app.get('io');
      if (!io) {
        return res.status(500).json({
          success: false,
          message: 'WebSocket 服务未就绪',
          code: 'WS_NOT_READY'
        });
      }

      // 广播消息
      io.emit('server:broadcast', {
        type,
        priority,
        highlight,
        message,
        operator: req.user.username,
        timestamp: new Date().toISOString()
      });

      // 记录到公告表
      if (type === 'announcement') {
        await db.execute(
          'INSERT INTO news (topic, content, author, created_at) VALUES (?, ?, ?, NOW())',
          ['系统公告', message, req.user.username]
        );
      }

      // 记录聊天消息
      await db.execute(
        'INSERT INTO chat_messages (sender, content, room_id, created_at, is_system) VALUES (?, ?, 0, NOW(), 1)',
        ['系统', `[公告] ${message}`]
      );

      logger.info('管理员发送全服广播', {
        operator: req.user.username,
        message,
        type
      });

      res.json({
        success: true,
        message: '全服广播已发送'
      });
    } catch (err) {
      logger.error('全服广播失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '全服广播失败',
        code: 'BROADCAST_ERROR'
      });
    }
  }

  /**
   * 设置维护模式
   */
  static async setMaintenance(req, res) {
    try {
      const { enabled, message, whitelist = [], kickExisting = false } = req.body;

      // 更新系统配置
      await db.execute(
        `INSERT INTO system_config (name, value, description) 
         VALUES ('maintenance_mode', ?, '维护模式状态') 
         ON DUPLICATE KEY UPDATE value = ?`,
        [enabled ? '1' : '0', enabled ? '1' : '0']
      );

      if (message) {
        await db.execute(
          `INSERT INTO system_config (name, value, description) 
           VALUES ('maintenance_message', ?, '维护模式消息') 
           ON DUPLICATE KEY UPDATE value = ?`,
          [message, message]
        );
      }

      if (whitelist.length > 0) {
        await db.execute(
          `INSERT INTO system_config (name, value, description) 
           VALUES ('maintenance_whitelist', ?, '维护模式白名单') 
           ON DUPLICATE KEY UPDATE value = ?`,
          [whitelist.join(','), whitelist.join(',')]
        );
      }

      // 如果需要踢出所有用户
      if (kickExisting && enabled) {
        await db.execute('DELETE FROM online_users WHERE user_id NOT IN (?)', [whitelist]);
        
        const io = req.app.get('io');
        if (io) {
          io.emit('server:maintenance', {
            message: message || '服务器正在维护',
            restartIn: 1800 // 30 分钟
          });
        }
      }

      logger.info('管理员设置维护模式', {
        operator: req.user.username,
        enabled,
        message
      });

      res.json({
        success: true,
        message: `维护模式已${enabled ? '启用' : '关闭'}`
      });
    } catch (err) {
      logger.error('设置维护模式失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '设置维护模式失败',
        code: 'MAINTENANCE_ERROR'
      });
    }
  }

  /**
   * 获取服务器状态
   */
  static async getStatus(req, res) {
    try {
      const [dbStatus] = await db.execute('SELECT 1');
      
      // 获取维护模式状态
      const [maintenanceConfig] = await db.execute(
        "SELECT value FROM system_config WHERE name = 'maintenance_mode'"
      );
      const isMaintenance = maintenanceConfig.length > 0 && maintenanceConfig[0].value === '1';

      res.json({
        success: true,
        data: {
          http: {
            status: 'online',
            port: parseInt(process.env.PORT || '3001')
          },
          websocket: {
            status: 'online',
            connections: req.app.get('io')?.engine?.clientsCount || 0
          },
          database: {
            status: dbStatus.length > 0 ? 'connected' : 'disconnected'
          },
          maintenance: {
            enabled: isMaintenance
          },
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          nodeVersion: process.version,
          memory: process.memoryUsage()
        }
      });
    } catch (err) {
      logger.error('获取服务器状态失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '获取服务器状态失败',
        code: 'STATUS_ERROR'
      });
    }
  }

  /**
   * 全服踢出（紧急情况）
   */
  static async kickAll(req, res) {
    try {
      const { reason, excludeAdmins = true, banNewLogins = false, duration = 0 } = req.body;

      // 踢出所有在线用户（排除管理员）
      if (excludeAdmins) {
        await db.execute(`
          DELETE FROM online_users 
          WHERE user_id IN (SELECT id FROM users WHERE grade < 6)
        `);
      } else {
        await db.execute('DELETE FROM online_users');
      }

      // 如果需要禁止新登录
      if (banNewLogins) {
        await db.execute(
          `INSERT INTO system_config (name, value, description) 
           VALUES ('login_disabled', '1', '禁止登录') 
           ON DUPLICATE KEY UPDATE value = ?`,
          ['1']
        );

        if (duration > 0) {
          setTimeout(async () => {
            await db.execute(
              "UPDATE system_config SET value = '0' WHERE name = 'login_disabled'"
            );
          }, duration * 60 * 1000);
        }
      }

      // 广播通知
      const io = req.app.get('io');
      if (io) {
        io.emit('server:kicked', {
          reason,
          restartIn: duration * 60,
          operator: req.user.username
        });
      }

      logger.warn('管理员执行全服踢出', {
        operator: req.user.username,
        reason,
        excludeAdmins,
        banNewLogins,
        duration
      });

      res.json({
        success: true,
        message: `全服用户已踢出${banNewLogins ? '，禁止新登录' : ''}`
      });
    } catch (err) {
      logger.error('全服踢出失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '全服踢出失败',
        code: 'KICK_ALL_ERROR'
      });
    }
  }

  /**
   * 限制功能开关
   */
  static async toggleFeature(req, res) {
    try {
      const { feature, enabled, reason, duration } = req.body;

      const validFeatures = ['chat', 'trade', 'pk', 'event', 'mail', 'friend'];
      if (!validFeatures.includes(feature)) {
        return res.status(400).json({
          success: false,
          message: '不支持的功能',
          code: 'INVALID_FEATURE'
        });
      }

      await db.execute(
        `INSERT INTO system_config (name, value, description, updated_at) 
         VALUES (?, ?, ?, NOW()) 
         ON DUPLICATE KEY UPDATE value = ?`,
        [`feature_${feature}`, enabled ? '1' : '0', reason || '', enabled ? '1' : '0']
      );

      // 如果有持续时间，设置定时恢复
      if (duration && !enabled) {
        setTimeout(async () => {
          await db.execute(
            `UPDATE system_config SET value = '1', updated_at = NOW() WHERE name = ?`,
            [`feature_${feature}`]
          );
          
          // 广播恢复通知
          const io = req.app.get('io');
          if (io) {
            io.emit('server:feature', {
              feature,
              enabled: true,
              message: `${this.getFeatureName(feature)}功能已恢复`
            });
          }
        }, duration * 60 * 1000);
      }

      // 广播通知
      const io = req.app.get('io');
      if (io) {
        io.emit('server:feature', {
          feature,
          enabled,
          message: `${this.getFeatureName(feature)}功能已${enabled ? '启用' : '禁用'}${duration ? `，${duration}分钟后恢复` : ''}`,
          reason
        });
      }

      logger.info('管理员调整功能开关', {
        operator: req.user.username,
        feature,
        enabled,
        reason,
        duration
      });

      res.json({
        success: true,
        message: `${this.getFeatureName(feature)}功能已${enabled ? '启用' : '禁用'}`
      });
    } catch (err) {
      logger.error('调整功能开关失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '调整功能开关失败',
        code: 'FEATURE_ERROR'
      });
    }
  }

  /**
   * 获取功能名称
   */
  static getFeatureName(feature) {
    const names = {
      'chat': '聊天',
      'trade': '交易',
      'pk': 'PK',
      'event': '活动',
      'mail': '邮件',
      'friend': '好友'
    };
    return names[feature] || feature;
  }

  /**
   * 清理缓存
   */
  static async clearCache(req, res) {
    try {
      const { type = 'all' } = req.body;
      const { redisClient } = require('../../utils/cache');
      
      let cleared = 0;
      let details = [];
      
      if (type === 'all' || type === 'user') {
        const userKeys = await redisClient.keys('user:*');
        if (userKeys.length > 0) {
          await redisClient.del(userKeys);
          cleared += userKeys.length;
          details.push(`用户缓存：${userKeys.length}个`);
        }
      }
      
      if (type === 'all' || type === 'online') {
        const onlineKeys = await redisClient.keys('online:*');
        if (onlineKeys.length > 0) {
          await redisClient.del(onlineKeys);
          cleared += onlineKeys.length;
          details.push(`在线用户缓存：${onlineKeys.length}个`);
        }
      }
      
      if (type === 'all' || type === 'chat') {
        const chatKeys = await redisClient.keys('chat:*');
        if (chatKeys.length > 0) {
          await redisClient.del(chatKeys);
          cleared += chatKeys.length;
          details.push(`聊天缓存：${chatKeys.length}个`);
        }
      }
      
      if (type === 'all' || type === 'sect') {
        const sectKeys = await redisClient.keys('sect:*');
        if (sectKeys.length > 0) {
          await redisClient.del(sectKeys);
          cleared += sectKeys.length;
          details.push(`门派缓存：${sectKeys.length}个`);
        }
      }
      
      if (type === 'all' || type === 'item') {
        const itemKeys = await redisClient.keys('item:*');
        if (itemKeys.length > 0) {
          await redisClient.del(itemKeys);
          cleared += itemKeys.length;
          details.push(`物品缓存：${itemKeys.length}个`);
        }
      }
      
      if (type === 'all' || type === 'system') {
        const systemKeys = await redisClient.keys('system:*');
        if (systemKeys.length > 0) {
          await redisClient.del(systemKeys);
          cleared += systemKeys.length;
          details.push(`系统缓存：${systemKeys.length}个`);
        }
      }
      
      const { logger } = require('../../utils/logger');
      logger.info('管理员清理缓存', {
        operator: req.user.username,
        type,
        cleared
      });
      
      res.json({
        success: true,
        message: `成功清理 ${cleared} 个缓存键`,
        details
      });
    } catch (err) {
      console.error('清理缓存失败:', err.message);
      res.status(500).json({
        success: false,
        message: '清理缓存失败',
        code: 'CLEAR_CACHE_ERROR',
        error: err.message
      });
    }
  }

  /**
   * 获取缓存统计
   */
  static async getCacheStats(req, res) {
    try {
      const { redisClient } = require('../../utils/cache');
      
      const info = await redisClient.info('stats');
      const memoryInfo = await redisClient.info('memory');
      
      const userKeys = await redisClient.keys('user:*');
      const onlineKeys = await redisClient.keys('online:*');
      const chatKeys = await redisClient.keys('chat:*');
      const sectKeys = await redisClient.keys('sect:*');
      const itemKeys = await redisClient.keys('item:*');
      const systemKeys = await redisClient.keys('system:*');
      const allKeys = await redisClient.keys('*');
      
      const memoryMatch = memoryInfo.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : 'N/A';
      
      const connectedClientsMatch = info.match(/connected_clients:(\d+)/);
      const connectedClients = connectedClientsMatch ? parseInt(connectedClientsMatch[1]) : 0;
      
      res.json({
        success: true,
        data: {
          memory,
          connectedClients,
          totalKeys: allKeys.length,
          breakdown: {
            user: userKeys.length,
            online: onlineKeys.length,
            chat: chatKeys.length,
            sect: sectKeys.length,
            item: itemKeys.length,
            system: systemKeys.length,
            other: allKeys.length - userKeys.length - onlineKeys.length - chatKeys.length - sectKeys.length - itemKeys.length - systemKeys.length
          }
        }
      });
    } catch (err) {
      console.error('获取缓存统计失败:', err.message);
      res.status(500).json({
        success: false,
        message: '获取缓存统计失败',
        code: 'CACHE_STATS_ERROR',
        error: err.message
      });
    }
  }
}

module.exports = ServerController;
