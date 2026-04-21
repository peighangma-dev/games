const db = require('../../config/db');
const { logger } = require('../../utils/logger');

/**
 * 经济调控控制器
 */
class EconomyController {
  /**
   * 获取经济统计
   */
  static async getStats(req, res) {
    try {
      // 货币总量
      const [money] = await db.execute(`
        SELECT 
          SUM(silver) as totalSilver,
          AVG(silver) as avgSilver,
          SUM(deposit) as totalDeposit
        FROM users 
        WHERE status != 'dead'
      `);

      // 统计用户数
      const [userCount] = await db.execute(`
        SELECT COUNT(*) as count FROM users WHERE status != 'dead'
      `);

      // 尝试查询经济交易日志（如果表存在）
      let incomeToday = [{ total: 0 }];
      let spendingToday = [{ total: 0 }];
      let incomeSources = [];
      let spendingCategories = [];

      try {
        // 日收入统计
        [incomeToday] = await db.execute(`
          SELECT 
            SUM(amount) as total
          FROM economy_transaction_logs 
          WHERE type = 'income' AND DATE(created_at) = CURDATE()
        `);

        // 日支出统计
        [spendingToday] = await db.execute(`
          SELECT 
            SUM(amount) as total
          FROM economy_transaction_logs 
          WHERE type = 'spending' AND DATE(created_at) = CURDATE()
        `);

        // 收入来源
        [incomeSources] = await db.execute(`
          SELECT source, SUM(amount) as amount
          FROM economy_transaction_logs 
          WHERE type = 'income' AND DATE(created_at) = CURDATE()
          GROUP BY source
        `);

        // 支出去向
        [spendingCategories] = await db.execute(`
          SELECT category, SUM(amount) as amount
          FROM economy_transaction_logs 
          WHERE type = 'spending' AND DATE(created_at) = CURDATE()
          GROUP BY category
        `);
      } catch (err) {
        // 表不存在时忽略错误，使用默认值
        logger.warn('economy_transaction_logs 表不存在，使用默认值', { error: err.message });
      }

      res.json({
        success: true,
        data: {
          money: {
            totalSilver: money[0].totalSilver || 0,
            totalDeposit: money[0].totalDeposit || 0,
            circulation: (money[0].totalSilver || 0) - (money[0].totalDeposit || 0),
            avgPerUser: Math.floor(money[0].avgSilver || 0)
          },
          income: {
            daily: incomeToday[0].total || 0,
            sources: incomeSources.reduce((acc, row) => {
              acc[row.source || 'unknown'] = row.amount || 0;
              return acc;
            }, {})
          },
          spending: {
            daily: spendingToday[0].total || 0,
            categories: spendingCategories.reduce((acc, row) => {
              acc[row.category || 'unknown'] = row.amount || 0;
              return acc;
            }, {}),
            userCount: userCount[0].count || 0
          }
        }
      });
    } catch (err) {
      logger.error('获取经济统计失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '获取经济统计失败：' + err.message,
        code: 'ECONOMY_STATS_ERROR'
      });
    }
  }

  /**
   * 富豪榜
   */
  static async getRichList(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      const [users] = await db.execute(`
        SELECT 
          id, username, faction, silver, deposit,
          (silver + COALESCE(deposit, 0)) as totalWealth
        FROM users
        WHERE status != 'dead'
        ORDER BY totalWealth DESC
        LIMIT ?
      `, [limit]);

      res.json({
        success: true,
        data: {
          list: users,
          total: users.length
        }
      });
    } catch (err) {
      logger.error('获取富豪榜失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '获取富豪榜失败：' + err.message,
        code: 'RICH_LIST_ERROR'
      });
    }
  }

  /**
   * 发放银两
   */
  static async grantSilver(req, res) {
    try {
      const { targetType, targetId, amount, reason, notify = true } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: '发放金额必须大于 0',
          code: 'INVALID_AMOUNT'
        });
      }

      let userIds = [];
      
      if (targetType === 'user') {
        userIds = [targetId];
      } else if (targetType === 'all') {
        const [users] = await db.execute("SELECT id FROM users WHERE status != 'dead'");
        userIds = users.map(u => u.id);
      } else if (targetType === 'vip') {
        const [users] = await db.execute("SELECT id FROM users WHERE is_vip = 1 AND status != 'dead'");
        userIds = users.map(u => u.id);
      } else if (targetType === 'sect') {
        const [users] = await db.execute("SELECT id FROM users WHERE sect = ? AND status != 'dead'", [targetId]);
        userIds = users.map(u => u.id);
      }

      let totalGranted = 0;

      for (const userId of userIds) {
        // 获取用户原余额
        const [users] = await db.execute('SELECT silver FROM users WHERE id = ?', [userId]);
        if (users.length === 0) continue;

        const balanceBefore = users[0].silver;
        
        // 发放银两
        await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [amount, userId]);
        
        // 记录日志
        await db.execute(`
          INSERT INTO economy_transaction_logs 
          (user_id, type, amount, balance_before, balance_after, operator_id, reason, created_at)
          VALUES (?, 'income', ?, ?, ?, ?, ?, NOW())
        `, [userId, amount, balanceBefore, balanceBefore + amount, req.user.id, reason]);

        totalGranted += amount;
      }

      // 发送通知
      if (notify && userIds.length <= 100) {
        const [userNames] = await db.execute(
          'SELECT username FROM users WHERE id IN (?)',
          [userIds]
        );
        
        for (const user of userNames) {
          await db.execute(
            `INSERT INTO messages (receiver, sender, title, content, sent_at) 
             VALUES (?, '系统', '银两发放通知', ?, NOW())`,
            [user.username, `管理员"${req.user.username}"向您发放了${amount}银两，原因：${reason}`]
          );
        }
      }

      logger.info('管理员发放银两', {
        operator: req.user.username,
        targetType,
        targetId,
        amount,
        totalGranted,
        reason
      });

      res.json({
        success: true,
        message: `成功发放${totalGranted}银两给${userIds.length}名用户`
      });
    } catch (err) {
      logger.error('发放银两失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '发放银两失败',
        code: 'GRANT_ERROR'
      });
    }
  }

  /**
   * 扣除银两
   */
  static async revokeSilver(req, res) {
    try {
      const { targetType, targetId, amount, reason, notify = true } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: '扣除金额必须大于 0',
          code: 'INVALID_AMOUNT'
        });
      }

      let userIds = [];
      
      if (targetType === 'user') {
        userIds = [targetId];
      } else {
        return res.status(400).json({
          success: false,
          message: '扣除操作只支持单个用户',
          code: 'INVALID_TARGET'
        });
      }

      let totalRevoked = 0;

      for (const userId of userIds) {
        // 获取用户原余额
        const [users] = await db.execute('SELECT silver FROM users WHERE id = ?', [userId]);
        if (users.length === 0) continue;

        const balanceBefore = users[0].silver;
        
        // 检查余额是否足够
        if (balanceBefore < amount) {
          logger.warn('用户银两不足', { userId, balanceBefore, amount });
          continue;
        }
        
        // 扣除银两
        await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [amount, userId]);
        
        // 记录日志
        await db.execute(`
          INSERT INTO economy_transaction_logs 
          (user_id, type, amount, balance_before, balance_after, operator_id, reason, created_at)
          VALUES (?, 'spending', ?, ?, ?, ?, ?, NOW())
        `, [userId, amount, balanceBefore, balanceBefore - amount, req.user.id, reason]);

        totalRevoked += amount;

        // 发送通知
        if (notify) {
          const [user] = await db.execute('SELECT username FROM users WHERE id = ?', [userId]);
          if (user) {
            await db.execute(
              `INSERT INTO messages (receiver, sender, title, content, sent_at) 
               VALUES (?, '系统', '银两扣除通知', ?, NOW())`,
              [user[0].username, `管理员"${req.user.username}"扣除了您${amount}银两，原因：${reason}`]
            );
          }
        }
      }

      logger.info('管理员扣除银两', {
        operator: req.user.username,
        targetType,
        targetId,
        amount,
        totalRevoked,
        reason
      });

      res.json({
        success: true,
        message: `成功扣除${totalRevoked}银两`
      });
    } catch (err) {
      logger.error('扣除银两失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '扣除银两失败',
        code: 'REVOKE_ERROR'
      });
    }
  }

  /**
   * 获取经济配置
   */
  static async getConfig(req, res) {
    try {
      const [configs] = await db.execute(`
        SELECT name, value FROM system_config 
        WHERE name LIKE 'economy_%'
      `);

      const config = configs.reduce((acc, row) => {
        acc[row.name.replace('economy_', '')] = parseFloat(row.value);
        return acc;
      }, {});

      res.json({
        success: true,
        data: config
      });
    } catch (err) {
      logger.error('获取经济配置失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '获取经济配置失败',
        code: 'CONFIG_ERROR'
      });
    }
  }

  /**
   * 更新经济配置
   */
  static async updateConfig(req, res) {
    try {
      const config = req.body;
      const validKeys = ['shopTaxRate', 'marketTaxRate', 'maxDailyIncome', 'minWage'];

      for (const [key, value] of Object.entries(config)) {
        if (validKeys.includes(key)) {
          await db.execute(`
            INSERT INTO system_config (name, value, description, updated_at)
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE value = ?
          `, [`economy_${key}`, String(value), `${key}配置`, String(value)]);
        }
      }

      logger.info('管理员更新经济配置', {
        operator: req.user.username,
        changes: config
      });

      res.json({
        success: true,
        message: '经济配置已更新'
      });
    } catch (err) {
      logger.error('更新经济配置失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '更新经济配置失败',
        code: 'UPDATE_CONFIG_ERROR'
      });
    }
  }
}

module.exports = EconomyController;
