const db = require('../config/db');
const { logger } = require('../utils/logger');

/**
 * 生产端更新确认控制器
 * 用于生产端服务器确认更新安装状态
 */
class UpdateAcknowledgeController {
  /**
   * 确认更新安装
   */
  static async acknowledge(req, res) {
    try {
      const { version, status, serverName, error_message } = req.body;

      if (!version) {
        return res.status(400).json({
          success: false,
          message: '缺少 version 参数',
          code: 'MISSING_VERSION'
        });
      }

      // 获取更新记录
      const [updates] = await db.execute(
        'SELECT id FROM system_updates WHERE version = ?',
        [version]
      );

      if (updates.length === 0) {
        return res.status(404).json({
          success: false,
          message: '更新记录不存在',
          code: 'UPDATE_NOT_FOUND'
        });
      }

      const updateId = updates[0].id;

      // 创建或更新推送记录
      const [existingLogs] = await db.execute(
        `SELECT * FROM update_push_logs 
         WHERE update_id = ? AND server_url = ? 
         ORDER BY created_at DESC LIMIT 1`,
        [updateId, serverName || null]
      );

      if (existingLogs.length > 0) {
        // 更新现有记录
        await db.execute(
          `UPDATE update_push_logs 
           SET push_status = ?, 
               push_time = NOW(),
               acknowledge_time = NOW(),
               acknowledge_by = ?,
               error_message = ?
           WHERE id = ?`,
          [status === 'success' ? 'success' : 'failed', serverName || 'unknown', error_message || null, existingLogs[0].id]
        );

        logger.info('更新生产端状态 (已存在)', {
          version,
          server: serverName,
          status,
          push_log_id: existingLogs[0].id
        });
      } else {
        // 创建新记录
        const [result] = await db.execute(
          `INSERT INTO update_push_logs 
           (update_id, version, environment, server_url, push_status, push_time, acknowledge_time, acknowledge_by, error_message)
           VALUES (?, ?, 'production', ?, ?, NOW(), NOW(), ?, ?)`,
          [updateId, version, serverName || 'unknown', status === 'success' ? 'success' : 'failed', serverName || 'unknown', error_message || null]
        );

        logger.info('更新生产端状态 (新建)', {
          version,
          server: serverName,
          status,
          push_log_id: result.insertId
        });
      }

      res.json({
        success: true,
        message: '更新状态已确认'
      });
    } catch (err) {
      logger.error('确认更新状态失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '确认更新状态失败',
        code: 'ACKNOWLEDGE_ERROR',
        error: err.message
      });
    }
  }

  /**
   * 获取更新确认历史
   */
  static async getAcknowledgeHistory(req, res) {
    try {
      const { version, limit = 20 } = req.query;

      const whereClauses = ['1=1'];
      const params = [];

      if (version) {
        whereClauses.push('version = ?');
        params.push(version);
      }

      const where = whereClauses.join(' AND ');

      const [logs] = await db.execute(
        `SELECT * FROM update_push_logs 
         WHERE ${where}
         ORDER BY created_at DESC 
         LIMIT ?`,
        [...params, parseInt(limit)]
      );

      res.json({
        success: true,
        data: {
          logs,
          total: logs.length
        }
      });
    } catch (err) {
      logger.error('获取确认历史失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '获取确认历史失败',
        code: 'GET_HISTORY_ERROR'
      });
    }
  }
}

module.exports = UpdateAcknowledgeController;
