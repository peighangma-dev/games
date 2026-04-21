const db = require('../../config/db');

/**
 * 统计分析控制器
 */
class StatisticsController {
  /**
   * 在线统计
   */
  static async getOnlineStats(req, res) {
    try {
      // 从 Redis 获取在线用户（如果有的话）
      // 这里先从数据库查询在线用户表
      const [onlineUsers] = await db.execute(`
        SELECT id, username, room_id FROM online_users
      `);

      const byRoom = {};
      onlineUsers.forEach(user => {
        const roomId = user.room_id || 'unknown';
        if (!byRoom[roomId]) {
          byRoom[roomId] = { room_id: roomId, count: 0 };
        }
        byRoom[roomId].count++;
      });

      res.json({
        success: true,
        data: {
          total: onlineUsers.length,
          byRoom: Object.values(byRoom)
        }
      });
    } catch (err) {
      console.error('获取在线统计失败:', err.message);
      res.status(500).json({
        success: false,
        message: '获取在线统计失败',
        data: { total: 0, byRoom: [] }
      });
    }
  }

  /**
   * 注册统计
   */
  static async getRegistrationStats(req, res) {
    try {
      // 总注册用户
      const [total] = await db.execute(`
        SELECT COUNT(*) as count FROM users WHERE status != 'deleted'
      `);

      // 今日注册
      const [today] = await db.execute(`
        SELECT COUNT(*) as count FROM users 
        WHERE DATE(created_at) = CURDATE()
      `);

      // 本月注册
      const [thisMonth] = await db.execute(`
        SELECT COUNT(*) as count FROM users 
        WHERE MONTH(created_at) = MONTH(CURDATE()) 
        AND YEAR(created_at) = YEAR(CURDATE())
      `);

      res.json({
        success: true,
        data: {
          total: total[0].count || 0,
          today: today[0].count || 0,
          thisMonth: thisMonth[0].count || 0
        }
      });
    } catch (err) {
      console.error('获取注册统计失败:', err.message);
      res.status(500).json({
        success: false,
        message: '获取注册统计失败',
        data: { total: 0, today: 0, thisMonth: 0 }
      });
    }
  }

  /**
   * 聊天统计
   */
  static async getChatStats(req, res) {
    try {
      // 总消息数
      const [total] = await db.execute(`
        SELECT COUNT(*) as count FROM chat_messages
      `);

      // 今日消息数
      const [today] = await db.execute(`
        SELECT COUNT(*) as count FROM chat_messages 
        WHERE DATE(created_at) = CURDATE()
      `);

      res.json({
        success: true,
        data: {
          total: total[0].count || 0,
          today: today[0].count || 0
        }
      });
    } catch (err) {
      console.error('获取聊天统计失败:', err.message);
      res.status(500).json({
        success: false,
        message: '获取聊天统计失败',
        data: { total: 0, today: 0 }
      });
    }
  }

  /**
   * 经济统计
   */
  static async getEconomyStats(req, res) {
    try {
      const [money] = await db.execute(`
        SELECT 
          SUM(silver) as totalSilver,
          AVG(silver) as avgSilver,
          SUM(deposit) as totalDeposit
        FROM users 
        WHERE status != 'dead'
      `);

      res.json({
        success: true,
        data: {
          totalSilver: money[0].totalSilver || 0,
          avgSilver: Math.floor(money[0].avgSilver || 0),
          totalDeposit: money[0].totalDeposit || 0
        }
      });
    } catch (err) {
      console.error('获取经济统计失败:', err.message);
      res.status(500).json({
        success: false,
        message: '获取经济统计失败',
        data: { totalSilver: 0, avgSilver: 0, totalDeposit: 0 }
      });
    }
  }
}

module.exports = StatisticsController;
