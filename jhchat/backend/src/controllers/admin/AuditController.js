const db = require('../../config/db');
const { logger } = require('../../utils/logger');

/**
 * 审计日志控制器
 */
class AuditController {
  /**
   * 获取操作日志
   */
  static async getActionLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        operator,
        actionType,
        startDate,
        endDate,
        status
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClauses = ['1=1'];
      const params = [];

      if (operator) {
        whereClauses.push('username = ?');
        params.push(operator);
      }
      if (actionType) {
        whereClauses.push('action_type = ?');
        params.push(actionType);
      }
      if (startDate) {
        whereClauses.push('created_at >= ?');
        params.push(startDate);
      }
      if (endDate) {
        whereClauses.push('created_at <= ?');
        params.push(endDate);
      }
      if (status) {
        whereClauses.push('response_status = ?');
        params.push(status);
      }

      const where = whereClauses.join(' AND ');

      const [logs] = await db.execute(
        `SELECT * FROM admin_action_logs 
         WHERE ${where} 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM admin_action_logs WHERE ${where}`,
        params
      );

      res.json({
        success: true,
        data: {
          logs,
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult[0].total / parseInt(limit))
        }
      });
    } catch (err) {
      logger.error('查询操作日志失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '查询操作日志失败',
        code: 'ACTION_LOGS_ERROR'
      });
    }
  }

  /**
   * 获取登录日志
   */
  static async getLoginLogs(req, res) {
    try {
      const { page = 1, limit = 50, username, ip, status, startDate, endDate } = req.query;
      const offset = (page - 1) * limit;
      const whereClauses = ['1=1'];
      const params = [];

      if (username) {
        whereClauses.push('l.username = ?');
        params.push(username);
      }
      if (ip) {
        whereClauses.push('l.ip_address LIKE ?');
        params.push(`%${ip}%`);
      }
      if (status) {
        whereClauses.push('l.login_status = ?');
        params.push(status);
      }
      if (startDate) {
        whereClauses.push('l.created_at >= ?');
        params.push(startDate);
      }
      if (endDate) {
        whereClauses.push('l.created_at <= ?');
        params.push(endDate + ' 23:59:59');
      }

      const where = whereClauses.join(' AND ');

      const [logs] = await db.execute(
        `SELECT l.*, u.username 
         FROM user_ip_logs l
         LEFT JOIN users u ON l.user_id = u.id
         WHERE ${where} AND l.ip_type = 'login'
         ORDER BY l.created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM user_ip_logs l WHERE ${where}`,
        params
      );

      res.json({
        success: true,
        data: {
          logs,
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (err) {
      logger.error('查询登录日志失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '查询登录日志失败',
        code: 'LOGIN_LOGS_ERROR'
      });
    }
  }

  /**
   * 获取错误日志
   */
  static async getErrorLogs(req, res) {
    try {
      const { page = 1, limit = 50, level = 'error', service } = req.query;
      const offset = (page - 1) * limit;

      // 这里可以接入实际的日志系统
      // 暂时返回模拟数据
      res.json({
        success: true,
        data: {
          logs: [],
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (err) {
      logger.error('查询错误日志失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '查询错误日志失败',
        code: 'ERROR_LOGS_ERROR'
      });
    }
  }

  /**
   * 获取统计数据
   */
  static async getStats(req, res) {
    try {
      // 总操作数
      const [totalActions] = await db.execute('SELECT COUNT(*) as count FROM admin_action_logs');
      
      // 按类型统计
      const [byType] = await db.execute(`
        SELECT action_type, COUNT(*) as count 
        FROM admin_action_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY action_type 
        ORDER BY count DESC
      `);

      // 按操作员统计
      const [byOperator] = await db.execute(`
        SELECT username, COUNT(*) as count 
        FROM admin_action_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY username 
        ORDER BY count DESC
        LIMIT 10
      `);

      // 成功率
      const [successRate] = await db.execute(`
        SELECT 
          SUM(CASE WHEN response_status = 'success' THEN 1 ELSE 0 END) as success,
          COUNT(*) as total
        FROM admin_action_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);

      res.json({
        success: true,
        data: {
          totalActions: totalActions[0].count,
          byType,
          byOperator,
          successRate: successRate[0].total > 0 
            ? (successRate[0].success / successRate[0].total * 100).toFixed(2)
            : 0
        }
      });
    } catch (err) {
      logger.error('查询审计统计失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '查询审计统计失败',
        code: 'AUDIT_STATS_ERROR'
      });
    }
  }

  /**
   * 导出日志
   */
  static async exportLogs(req, res) {
    try {
      const { type, startDate, endDate, format = 'csv' } = req.body;

      let query = '';
      if (type === 'actions') {
        query = `
          SELECT * FROM admin_action_logs
          WHERE created_at BETWEEN ? AND ?
          ORDER BY created_at DESC
        `;
      } else if (type === 'logins') {
        query = `
          SELECT * FROM user_ip_logs
          WHERE created_at BETWEEN ? AND ? AND ip_type = 'login'
          ORDER BY created_at DESC
        `;
      }

      const [logs] = await db.execute(query, [startDate, endDate]);

      if (format === 'csv') {
        const csv = this.convertToCSV(logs);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_logs_${startDate}_${endDate}.csv`);
        return res.send(csv);
      } else {
        res.json({
          success: true,
          data: logs
        });
      }
    } catch (err) {
      logger.error('导出日志失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '导出日志失败',
        code: 'EXPORT_ERROR'
      });
    }
  }

  /**
   * 转换为 CSV 格式
   */
  static convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'object' ? JSON.stringify(val) : val
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  }

  /**
   * 获取聊天记录
   */
  static async getChatLogs(req, res) {
    try {
      const { 
        page = 1, 
        page_size = 50, 
        username, 
        room, 
        sender,
        receiver,
        type,
        start_date,
        end_date 
      } = req.query;
      
      const offset = (page - 1) * page_size;
      const whereClauses = ['1=1'];
      const params = [];

      if (username || sender) {
        whereClauses.push('sender = ?');
        params.push(username || sender);
      }
      if (receiver) {
        whereClauses.push('receiver = ?');
        params.push(receiver);
      }
      if (room || room === '0') {
        whereClauses.push('room_id = ?');
        params.push(parseInt(room));
      }
      if (type) {
        whereClauses.push('type = ?');
        params.push(type);
      }
      if (start_date) {
        whereClauses.push('created_at >= ?');
        params.push(start_date);
      }
      if (end_date) {
        whereClauses.push('created_at <= ?');
        params.push(end_date + ' 23:59:59');
      }

      const where = whereClauses.join(' AND ');

      const [logs] = await db.execute(
        `SELECT c.*, u.username as sender_name 
         FROM chat_messages c
         LEFT JOIN users u ON c.sender = u.id
         WHERE ${where} 
         ORDER BY c.created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, parseInt(page_size), offset]
      );

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM chat_messages WHERE ${where}`,
        params
      );

      res.json({
        success: true,
        data: {
          logs,
          total: countResult[0].total,
          page: parseInt(page),
          page_size: parseInt(page_size)
        }
      });
    } catch (err) {
      logger.error('查询聊天记录失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '查询聊天记录失败',
        code: 'CHAT_LOGS_ERROR'
      });
    }
  }

  /**
   * 删除聊天记录
   */
  static async deleteChatLog(req, res) {
    try {
      const { id } = req.params;

      await db.execute('DELETE FROM chat_messages WHERE id = ?', [id]);

      res.json({
        success: true,
        message: '删除成功'
      });
    } catch (err) {
      logger.error('删除聊天记录失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '删除失败',
        code: 'DELETE_CHAT_LOG_ERROR'
      });
    }
  }

  /**
   * 获取可疑用户
   */
  static async getSuspiciousUsers(req, res) {
    try {
      const [users] = await db.execute(`
        SELECT 
          u.id,
          u.username,
          u.faction,
          u.grade,
          COUNT(DISTINCT a.id) as cheat_count,
          MAX(a.created_at) as last_cheat_time
        FROM users u
        LEFT JOIN user_action_logs a ON u.id = a.user_id 
          AND a.action_type IN ('kill', 'rob', 'escape', 'win_lottery')
        WHERE u.status != 'dead'
        GROUP BY u.id
        HAVING cheat_count > 10
        ORDER BY cheat_count DESC
        LIMIT 20
      `);

      res.json({
        success: true,
        data: {
          users,
          total: users.length
        }
      });
    } catch (err) {
      logger.error('获取可疑用户失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '获取可疑用户失败',
        code: 'SUSPICIOUS_USERS_ERROR'
      });
    }
  }

  /**
   * 获取 IP 日志
   */
  static async getUserIpLogs(req, res) {
    try {
      const { page = 1, limit = 50, username, ip, status, startDate, endDate } = req.query;
      const offset = (page - 1) * limit;
      const whereClauses = ['1=1'];
      const params = [];

      if (username) {
        whereClauses.push('username = ?');
        params.push(username);
      }
      if (ip) {
        whereClauses.push('ip_address LIKE ?');
        params.push(`%${ip}%`);
      }
      if (status) {
        whereClauses.push('login_status = ?');
        params.push(status);
      }
      if (startDate) {
        whereClauses.push('created_at >= ?');
        params.push(startDate);
      }
      if (endDate) {
        whereClauses.push('created_at <= ?');
        params.push(endDate);
      }

      const where = whereClauses.join(' AND ');

      const [logs] = await db.execute(
        `SELECT * FROM user_ip_logs 
         WHERE ${where} 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM user_ip_logs WHERE ${where}`,
        params
      );

      res.json({
        success: true,
        data: {
          logs,
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult[0].total / parseInt(limit))
        }
      });
    } catch (err) {
      logger.error('获取 IP 日志失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '获取 IP 日志失败',
        code: 'IP_LOGS_ERROR'
      });
    }
  }

  /**
   * 获取 IP 锁列表
   */
  static async getIpLocks(req, res) {
    try {
      const [locks] = await db.execute(`
        SELECT l.*, u.username as locked_by_username
        FROM ip_locks l
        LEFT JOIN users u ON l.locked_by = u.username
        ORDER BY l.locked_at DESC
      `);

      res.json({
        success: true,
        data: {
          locks,
          total: locks.length
        }
      });
    } catch (err) {
      logger.error('获取 IP 锁列表失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '获取 IP 锁列表失败',
        code: 'IP_LOCKS_ERROR'
      });
    }
  }

  /**
   * 获取操作日志
   */
  static async getLogs(req, res) {
    try {
      const { page = 1, limit = 50, operator, startDate, endDate } = req.query;
      const offset = (page - 1) * limit;
      const whereClauses = ['1=1'];
      const params = [];

      if (operator) {
        whereClauses.push('username = ?');
        params.push(operator);
      }
      if (startDate) {
        whereClauses.push('created_at >= ?');
        params.push(startDate);
      }
      if (endDate) {
        whereClauses.push('created_at <= ?');
        params.push(endDate + ' 23:59:59');
      }

      const where = whereClauses.join(' AND ');

      // 检查表是否存在
      const [tables] = await db.execute('SHOW TABLES LIKE "admin_action_logs"');
      if (tables.length === 0) {
        return res.json({
          success: true,
          data: {
            logs: [],
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: 0,
            message: '操作日志表不存在，请先运行迁移脚本'
          }
        });
      }

      const [logs] = await db.execute(
        `SELECT 
          id,
          username as operator,
          action_type,
          action,
          ip,
          response_status,
          created_at as log_time
         FROM admin_action_logs 
         WHERE ${where} 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM admin_action_logs WHERE ${where}`,
        params
      );

      res.json({
        success: true,
        data: {
          logs,
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult[0].total / parseInt(limit))
        }
      });
    } catch (err) {
      logger.error('获取操作日志失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '获取操作日志失败：' + err.message,
        code: 'LOGS_ERROR'
      });
    }
  }

  /**
   * 清空日志
   */
  static async clearLogs(req, res) {
    try {
      const { keepDays } = req.body;

      if (keepDays && keepDays > 0) {
        // 保留最近 N 天的日志
        await db.execute(
          'DELETE FROM admin_action_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
          [parseInt(keepDays)]
        );
        
        res.json({
          success: true,
          message: `已清除 ${keepDays} 天前的操作日志`
        });
      } else {
        // 清空所有日志（危险操作）
        await db.execute('DELETE FROM admin_action_logs');
        
        res.json({
          success: true,
          message: '已清空所有操作日志'
        });
      }
    } catch (err) {
      logger.error('清空日志失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '清空日志失败',
        code: 'CLEAR_LOGS_ERROR'
      });
    }
  }

  /**
   * 创建 IP 锁
   */
  static async createIpLock(req, res) {
    try {
      const { ip, expires_at } = req.body;

      if (!ip || !expires_at) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段：ip, expires_at',
          code: 'MISSING_FIELDS'
        });
      }

      await db.execute(
        `INSERT INTO ip_locks (ip, locked_by, locked_at, expires_at) VALUES (?, ?, NOW(), ?)`,
        [ip, req.user.username, expires_at]
      );

      res.json({
        success: true,
        message: 'IP 锁定成功'
      });
    } catch (err) {
      logger.error('创建 IP 锁失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '创建 IP 锁失败',
        code: 'CREATE_IP_LOCK_ERROR'
      });
    }
  }

  /**
   * 删除 IP 锁
   */
  static async deleteIpLock(req, res) {
    try {
      const { id } = req.params;
      await db.execute('DELETE FROM ip_locks WHERE id = ?', [id]);

      res.json({
        success: true,
        message: '删除成功'
      });
    } catch (err) {
      logger.error('删除 IP 锁失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '删除失败',
        code: 'DELETE_IP_LOCK_ERROR'
      });
    }
  }
}

module.exports = AuditController;
