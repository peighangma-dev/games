const db = require('../../config/db');
const { logger } = require('../../utils/logger');

/**
 * 仪表盘控制器
 * 提供服务器状态、统计数据、实时监控等功能
 */
class DashboardController {
  /**
   * 获取仪表盘总览数据
   */
  static async getOverview(req, res) {
    try {
      const [onlineCount] = await db.execute('SELECT COUNT(*) as count FROM online_users');
      const [totalUsers] = await db.execute('SELECT COUNT(*) as count FROM users WHERE status != ?', ['dead']);
      const [todayUsers] = await db.execute('SELECT COUNT(*) as count FROM users WHERE DATE(registered_at) = CURDATE()');
      const [monthUsers] = await db.execute('SELECT COUNT(*) as count FROM users WHERE YEAR(registered_at) = YEAR(NOW()) AND MONTH(registered_at) = MONTH(NOW())');
      
      const [chatToday] = await db.execute('SELECT COUNT(*) as count FROM chat_messages WHERE DATE(created_at) = CURDATE()');
      const [chatTotal] = await db.execute('SELECT COUNT(*) as count FROM chat_messages');
      
      const [economy] = await db.execute('SELECT SUM(silver) as total, AVG(silver) as avg FROM users WHERE status != ?', ['dead']);
      const [deposit] = await db.execute('SELECT SUM(deposit) as total FROM users WHERE status != ?', ['dead']);

      res.json({
        success: true,
        data: {
          server: {
            status: 'online',
            uptime: process.uptime(),
            version: process.env.npm_package_version || '2.0.0',
            environment: process.env.NODE_ENV || 'production',
            startTime: new Date(Date.now() - process.uptime() * 1000).toISOString()
          },
          users: {
            online: onlineCount[0].count || 0,
            total: totalUsers[0].count || 0,
            newToday: todayUsers[0].count || 0,
            newThisMonth: monthUsers[0].count || 0
          },
          chat: {
            messagesToday: chatToday[0].count || 0,
            messagesTotal: chatTotal[0].count || 0
          },
          economy: {
            totalSilver: economy[0].total || 0,
            avgSilver: Math.floor(economy[0].avg || 0),
            totalDeposit: deposit[0].total || 0
          },
          roomCount: 0
        }
      });
    } catch (err) {
      logger.error('获取仪表盘数据失败', { error: err.message });
      res.status(500).json({ 
        success: false, 
        message: '获取仪表盘数据失败',
        code: 'DASHBOARD_ERROR'
      });
    }
  }

  /**
   * 获取实时数据
   */
  static async getRealtime(req, res) {
    try {
      const [onlineByRoom] = await db.execute(
        'SELECT r.name, COUNT(o.user_id) as count FROM online_users o LEFT JOIN chat_rooms r ON o.room_id = r.id GROUP BY o.room_id ORDER BY count DESC'
      );
      
      const [chatRecent] = await db.execute(
        'SELECT COUNT(*) as count FROM chat_messages WHERE created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)'
      );

      res.json({
        success: true,
        data: {
          onlineUsers: parseInt(req.query.online || '0'),
          messagesPerMinute: Math.floor(chatRecent[0].count / 5),
          byRoom: onlineByRoom,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      logger.error('获取实时数据失败', { error: err.message });
      res.status(500).json({ 
        success: false, 
        message: '获取实时数据失败',
        code: 'REALTIME_ERROR'
      });
    }
  }

  /**
   * 获取图表数据
   */
  static async getChartData(req, res) {
    try {
      const { type = 'register', period = '7d' } = req.query;
      let days = 7;
      
      if (period === '30d') days = 30;
      if (period === '90d') days = 90;

      let query = '';
      if (type === 'register') {
        query = `
          SELECT DATE(registered_at) as date, COUNT(*) as count 
          FROM users 
          WHERE registered_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          GROUP BY DATE(registered_at)
          ORDER BY date ASC
        `;
      } else if (type === 'chat') {
        query = `
          SELECT DATE(created_at) as date, COUNT(*) as count 
          FROM chat_messages 
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `;
      } else if (type === 'login') {
        query = `
          SELECT DATE(last_login_at) as date, COUNT(*) as count 
          FROM users 
          WHERE last_login_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          GROUP BY DATE(last_login_at)
          ORDER BY date ASC
        `;
      }

      const [results] = await db.execute(query, [days]);

      // 获取类型标签
      const typeLabels = {
        'register': '新增用户',
        'chat': '聊天消息',
        'login': '活跃用户'
      };

      res.json({
        success: true,
        data: {
          type,
          period,
          labels: results.map(r => r.date),
          datasets: [{
            label: typeLabels[type] || type,
            data: results.map(r => r.count)
          }]
        }
      });
    } catch (err) {
      logger.error('获取图表数据失败', { error: err.message });
      res.status(500).json({ 
        success: false, 
        message: '获取图表数据失败',
        code: 'CHART_ERROR'
      });
    }
  }

  /**
   * 获取服务器详细信息
   */
  static async getServerInfo(req, res) {
    try {
      // 检测数据库连接
      let dbStatus = 'disconnected';
      try {
        const [result] = await db.execute('SELECT 1 as test');
        if (result && result.length > 0 && result[0].test === 1) {
          dbStatus = 'connected';
        }
      } catch (dbErr) {
        logger.error('数据库连接检测失败', { error: dbErr.message });
        dbStatus = 'disconnected';
      }

      // 检测 Redis 连接（如果配置了）
      let redisStatus = 'not_configured';
      if (process.env.REDIS_HOST) {
        redisStatus = 'connected'; // TODO: 实际检测 Redis 连接
      }

      res.json({
        success: true,
        data: {
          http: {
            status: 'online',
            port: parseInt(process.env.PORT || '3001')
          },
          database: {
            status: dbStatus,
            host: process.env.DB_HOST || 'localhost',
            name: process.env.DB_NAME || 'jhchat'
          },
          redis: {
            status: redisStatus,
            host: process.env.REDIS_HOST || '未配置'
          },
          uptime: process.uptime(),
          memory: {
            heap_used: process.memoryUsage().heap_used,
            heap_total: process.memoryUsage().heap_total,
            rss: process.memoryUsage().rss
          },
          nodeVersion: process.version,
          platform: process.platform,
          pid: process.pid
        }
      });
    } catch (err) {
      logger.error('获取服务器信息失败', { error: err.message });
      res.status(500).json({ 
        success: false, 
        message: '获取服务器信息失败',
        code: 'SERVER_INFO_ERROR'
      });
    }
  }

  /**
   * 获取系统资源使用情况
   */
  static async getResourceUsage(req, res) {
    try {
      const usage = {
        cpu: process.cpuUsage(),
        memory: process.memoryUsage(),
        uptime: process.uptime()
      };

      res.json({
        success: true,
        data: usage
      });
    } catch (err) {
      logger.error('获取资源使用情况失败', { error: err.message });
      res.status(500).json({ 
        success: false, 
        message: '获取资源使用情况失败',
        code: 'RESOURCE_ERROR'
      });
    }
  }
}

module.exports = DashboardController;
