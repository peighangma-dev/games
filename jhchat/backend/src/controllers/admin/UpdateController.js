const db = require('../../config/db');
const { logger } = require('../../utils/logger');

/**
 * 系统更新管理控制器
 * 提供版本更新记录、推送管理等功能
 */
class UpdateController {
  /**
   * 获取更新列表
   */
  static async getUpdates(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        type,
        priority,
        startDate,
        endDate
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClauses = ['1=1'];
      const params = [];

      if (status) {
        whereClauses.push('status = ?');
        params.push(status);
      }
      if (type) {
        whereClauses.push('type = ?');
        params.push(type);
      }
      if (priority) {
        whereClauses.push('priority = ?');
        params.push(priority);
      }
      if (startDate) {
        whereClauses.push('release_date >= ?');
        params.push(startDate);
      }
      if (endDate) {
        whereClauses.push('release_date <= ?');
        params.push(endDate);
      }

      const where = whereClauses.join(' AND ');

      const [updates] = await db.execute(
        `SELECT * FROM system_updates 
         WHERE ${where} 
         ORDER BY version_code DESC 
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM system_updates WHERE ${where}`,
        params
      );

      res.json({
        success: true,
        data: {
          updates,
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult[0].total / parseInt(limit))
        }
      });
    } catch (err) {
      logger.error('获取更新列表失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '获取更新列表失败',
        code: 'GET_UPDATES_ERROR'
      });
    }
  }

  /**
   * 获取更新详情
   */
  static async getUpdateDetail(req, res) {
    try {
      const { id } = req.params;

      const [updates] = await db.execute(
        'SELECT * FROM system_updates WHERE id = ?',
        [id]
      );

      if (updates.length === 0) {
        return res.status(404).json({
          success: false,
          message: '更新记录不存在',
          code: 'UPDATE_NOT_FOUND'
        });
      }

      const update = updates[0];

      // 获取推送记录
      const [pushLogs] = await db.execute(
        'SELECT * FROM update_push_logs WHERE update_id = ? ORDER BY created_at DESC',
        [id]
      );

      res.json({
        success: true,
        data: {
          ...update,
          pushLogs
        }
      });
    } catch (err) {
      logger.error('获取更新详情失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '获取更新详情失败',
        code: 'GET_UPDATE_DETAIL_ERROR'
      });
    }
  }

  /**
   * 获取最新版本号
   */
  static async getLatestVersion(req, res) {
    try {
      const [updates] = await db.execute(
        `SELECT * FROM system_updates 
         WHERE status = 'released' 
         ORDER BY version_code DESC 
         LIMIT 1`
      );

      if (updates.length === 0) {
        return res.json({
          success: true,
          data: null,
          message: '暂无更新'
        });
      }

      res.json({
        success: true,
        data: updates[0]
      });
    } catch (err) {
      logger.error('获取最新版本失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '获取最新版本失败',
        code: 'GET_LATEST_VERSION_ERROR'
      });
    }
  }

  /**
   * 检查更新（生产端使用）
   */
  static async checkUpdate(req, res) {
    try {
      const { currentVersion } = req.query;

      if (!currentVersion) {
        return res.status(400).json({
          success: false,
          message: '缺少 currentVersion 参数',
          code: 'MISSING_VERSION'
        });
      }

      // 解析当前版本号
      const versionMatch = currentVersion.match(/v(\d+)\.(\d+)\.(\d+)/);
      if (!versionMatch) {
        return res.status(400).json({
          success: false,
          message: '版本号格式错误，应为 v1.0.0 格式',
          code: 'INVALID_VERSION_FORMAT'
        });
      }

      const currentVersionCode = parseInt(versionMatch[1]) * 10000 +
                                  parseInt(versionMatch[2]) * 100 +
                                  parseInt(versionMatch[3]);

      // 查询更新的版本
      const [updates] = await db.execute(
        `SELECT * FROM system_updates 
         WHERE status = 'released' AND version_code > ?
         ORDER BY version_code ASC`,
        [currentVersionCode]
      );

      res.json({
        success: true,
        data: {
          hasUpdate: updates.length > 0,
          currentVersion,
          updates: updates.map(u => ({
            id: u.id,
            version: u.version,
            versionCode: u.version_code,
            title: u.title,
            type: u.type,
            priority: u.priority,
            forceUpdate: u.force_update,
            releaseDate: u.release_date,
            breakingChanges: u.breaking_changes
          }))
        }
      });
    } catch (err) {
      logger.error('检查更新失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '检查更新失败',
        code: 'CHECK_UPDATE_ERROR'
      });
    }
  }

  /**
   * 创建更新记录
   */
  static async createUpdate(req, res) {
    try {
      const {
        version,
        title,
        description,
        changes,
        type = 'patch',
        priority = 'normal',
        force_update = 0,
        release_date,
        release_note,
        breaking_changes = 0,
        affected_modules,
        rollback_version
      } = req.body;

      // 验证版本号格式
      const versionMatch = version.match(/^v(\d+)\.(\d+)\.(\d+)$/);
      if (!versionMatch) {
        return res.status(400).json({
          success: false,
          message: '版本号格式错误，应为 v1.0.0 格式',
          code: 'INVALID_VERSION_FORMAT'
        });
      }

      // 计算版本号数字
      const versionCode = parseInt(versionMatch[1]) * 10000 +
                          parseInt(versionMatch[2]) * 100 +
                          parseInt(versionMatch[3]);

      // 检查版本号是否已存在
      const [exists] = await db.execute(
        'SELECT id FROM system_updates WHERE version = ?',
        [version]
      );

      if (exists.length > 0) {
        return res.status(409).json({
          success: false,
          message: '版本号已存在',
          code: 'VERSION_EXISTS'
        });
      }

      // 解析 JSON 字段
      let changesJson = null;
      if (typeof changes === 'string') {
        try {
          changesJson = JSON.parse(changes);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'changes 必须是有效的 JSON 数组',
            code: 'INVALID_CHANGES_JSON'
          });
        }
      } else if (Array.isArray(changes)) {
        changesJson = changes;
      }

      let affectedModulesJson = null;
      if (affected_modules) {
        if (typeof affected_modules === 'string') {
          try {
            affectedModulesJson = JSON.parse(affected_modules);
          } catch (e) {
            return res.status(400).json({
              success: false,
              message: 'affected_modules 必须是有效的 JSON 数组',
              code: 'INVALID_MODULES_JSON'
            });
          }
        } else if (Array.isArray(affected_modules)) {
          affectedModulesJson = affected_modules;
        }
      }

      const [result] = await db.execute(
        `INSERT INTO system_updates 
         (version, version_code, title, description, changes, type, priority, 
          force_update, status, release_date, release_note, breaking_changes, 
          affected_modules, rollback_version, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          version,
          versionCode,
          title,
          description || null,
          changesJson ? JSON.stringify(changesJson) : null,
          type,
          priority,
          force_update ? 1 : 0,
          'draft',
          release_date || null,
          release_note || null,
          breaking_changes ? 1 : 0,
          affectedModulesJson ? JSON.stringify(affectedModulesJson) : null,
          rollback_version || null,
          req.user?.username || 'admin'
        ]
      );

      logger.info('创建更新记录', {
        operator: req.user?.username,
        version,
        title
      });

      res.status(201).json({
        success: true,
        data: {
          id: result.insertId,
          version,
          title
        },
        message: '更新记录创建成功'
      });
    } catch (err) {
      logger.error('创建更新记录失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '创建更新记录失败',
        code: 'CREATE_UPDATE_ERROR'
      });
    }
  }

  /**
   * 更新更新记录
   */
  static async updateUpdate(req, res) {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        changes,
        type,
        priority,
        force_update,
        release_date,
        release_note,
        breaking_changes,
        affected_modules,
        rollback_version,
        status
      } = req.body;

      // 检查记录是否存在
      const [exists] = await db.execute(
        'SELECT id FROM system_updates WHERE id = ?',
        [id]
      );

      if (exists.length === 0) {
        return res.status(404).json({
          success: false,
          message: '更新记录不存在',
          code: 'UPDATE_NOT_FOUND'
        });
      }

      const fields = [];
      const params = [];

      if (title !== undefined) {
        fields.push('title = ?');
        params.push(title);
      }
      if (description !== undefined) {
        fields.push('description = ?');
        params.push(description);
      }
      if (changes !== undefined) {
        const changesJson = Array.isArray(changes) ? JSON.stringify(changes) : changes;
        fields.push('changes = ?');
        params.push(changesJson);
      }
      if (type !== undefined) {
        fields.push('type = ?');
        params.push(type);
      }
      if (priority !== undefined) {
        fields.push('priority = ?');
        params.push(priority);
      }
      if (force_update !== undefined) {
        fields.push('force_update = ?');
        params.push(force_update ? 1 : 0);
      }
      if (status !== undefined) {
        fields.push('status = ?');
        params.push(status);
      }
      if (release_date !== undefined) {
        fields.push('release_date = ?');
        params.push(release_date);
      }
      if (release_note !== undefined) {
        fields.push('release_note = ?');
        params.push(release_note);
      }
      if (breaking_changes !== undefined) {
        fields.push('breaking_changes = ?');
        params.push(breaking_changes ? 1 : 0);
      }
      if (affected_modules !== undefined) {
        const modulesJson = Array.isArray(affected_modules) ? JSON.stringify(affected_modules) : affected_modules;
        fields.push('affected_modules = ?');
        params.push(modulesJson);
      }
      if (rollback_version !== undefined) {
        fields.push('rollback_version = ?');
        params.push(rollback_version);
      }

      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有需要更新的字段',
          code: 'NO_FIELDS_TO_UPDATE'
        });
      }

      params.push(id);
      await db.execute(
        `UPDATE system_updates SET ${fields.join(', ')} WHERE id = ?`,
        params
      );

      logger.info('更新更新记录', {
        operator: req.user?.username,
        updateId: id
      });

      res.json({
        success: true,
        message: '更新记录已更新'
      });
    } catch (err) {
      logger.error('更新更新记录失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '更新更新记录失败',
        code: 'UPDATE_RECORD_ERROR'
      });
    }
  }

  /**
   * 删除更新记录
   */
  static async deleteUpdate(req, res) {
    try {
      const { id } = req.params;

      // 检查记录是否存在
      const [exists] = await db.execute(
        'SELECT id FROM system_updates WHERE id = ?',
        [id]
      );

      if (exists.length === 0) {
        return res.status(404).json({
          success: false,
          message: '更新记录不存在',
          code: 'UPDATE_NOT_FOUND'
        });
      }

      await db.execute('DELETE FROM system_updates WHERE id = ?', [id]);

      logger.info('删除更新记录', {
        operator: req.user?.username,
        updateId: id
      });

      res.json({
        success: true,
        message: '更新记录已删除'
      });
    } catch (err) {
      logger.error('删除更新记录失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '删除更新记录失败',
        code: 'DELETE_UPDATE_ERROR'
      });
    }
  }

  /**
   * 发布更新
   */
  static async releaseUpdate(req, res) {
    try {
      const { id } = req.params;
      const { release_date = new Date().toISOString() } = req.body;

      // 检查记录是否存在
      const [updates] = await db.execute(
        'SELECT * FROM system_updates WHERE id = ?',
        [id]
      );

      if (updates.length === 0) {
        return res.status(404).json({
          success: false,
          message: '更新记录不存在',
          code: 'UPDATE_NOT_FOUND'
        });
      }

      const update = updates[0];
      if (update.status === 'released') {
        return res.status(400).json({
          success: false,
          message: '该更新已发布',
          code: 'ALREADY_RELEASED'
        });
      }

      await db.execute(
        'UPDATE system_updates SET status = ?, release_date = ? WHERE id = ?',
        ['released', release_date, id]
      );

      logger.info('发布更新', {
        operator: req.user?.username,
        updateId: id,
        version: update.version
      });

      res.json({
        success: true,
        message: `版本 ${update.version} 已发布`
      });
    } catch (err) {
      logger.error('发布更新失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '发布更新失败',
        code: 'RELEASE_UPDATE_ERROR'
      });
    }
  }

  /**
   * 推送更新到生产环境
   */
  static async pushUpdate(req, res) {
    try {
      const { id } = req.params;
      const {
        environment = 'production',
        server_url,
        metadata
      } = req.body;

      // 检查更新记录
      const [updates] = await db.execute(
        'SELECT * FROM system_updates WHERE id = ?',
        [id]
      );

      if (updates.length === 0) {
        return res.status(404).json({
          success: false,
          message: '更新记录不存在',
          code: 'UPDATE_NOT_FOUND'
        });
      }

      const update = updates[0];
      if (update.status !== 'released') {
        return res.status(400).json({
          success: false,
          message: '只能推送已发布的更新',
          code: 'NOT_RELEASED'
        });
      }

      // 创建推送记录
      const [result] = await db.execute(
        `INSERT INTO update_push_logs 
         (update_id, version, environment, server_url, push_status, push_time, metadata)
         VALUES (?, ?, ?, ?, 'pending', NOW(), ?)`,
        [id, update.version, environment, server_url || null, metadata ? JSON.stringify(metadata) : null]
      );

      logger.info('推送更新', {
        operator: req.user?.username,
        updateId: id,
        version: update.version,
        environment
      });

      res.json({
        success: true,
        data: {
          pushId: result.insertId,
          version: update.version,
          environment
        },
        message: '更新推送任务已创建'
      });
    } catch (err) {
      logger.error('推送更新失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '推送更新失败',
        code: 'PUSH_UPDATE_ERROR'
      });
    }
  }

  /**
   * 获取推送记录列表
   */
  static async getPushLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        update_id,
        environment,
        push_status
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClauses = ['1=1'];
      const params = [];

      if (update_id) {
        whereClauses.push('update_id = ?');
        params.push(update_id);
      }
      if (environment) {
        whereClauses.push('environment = ?');
        params.push(environment);
      }
      if (push_status) {
        whereClauses.push('push_status = ?');
        params.push(push_status);
      }

      const where = whereClauses.join(' AND ');

      const [logs] = await db.execute(
        `SELECT l.*, u.title, u.version 
         FROM update_push_logs l
         LEFT JOIN system_updates u ON l.update_id = u.id
         WHERE ${where}
         ORDER BY l.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM update_push_logs l WHERE ${where}`,
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
      logger.error('获取推送记录失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '获取推送记录失败',
        code: 'GET_PUSH_LOGS_ERROR'
      });
    }
  }

  /**
   * 更新推送状态
   */
  static async updatePushStatus(req, res) {
    try {
      const { id } = req.params;
      const {
        push_status,
        push_time,
        acknowledge_time,
        acknowledge_by,
        rollback_status,
        rollback_time,
        error_message
      } = req.body;

      const fields = [];
      const params = [];

      if (push_status !== undefined) {
        fields.push('push_status = ?');
        params.push(push_status);
      }
      if (push_time !== undefined) {
        fields.push('push_time = ?');
        params.push(push_time);
      }
      if (acknowledge_time !== undefined) {
        fields.push('acknowledge_time = ?');
        params.push(acknowledge_time);
      }
      if (acknowledge_by !== undefined) {
        fields.push('acknowledge_by = ?');
        params.push(acknowledge_by);
      }
      if (rollback_status !== undefined) {
        fields.push('rollback_status = ?');
        params.push(rollback_status);
      }
      if (rollback_time !== undefined) {
        fields.push('rollback_time = ?');
        params.push(rollback_time);
      }
      if (error_message !== undefined) {
        fields.push('error_message = ?');
        params.push(error_message);
      }

      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有需要更新的字段',
          code: 'NO_FIELDS_TO_UPDATE'
        });
      }

      params.push(id);
      await db.execute(
        `UPDATE update_push_logs SET ${fields.join(', ')} WHERE id = ?`,
        params
      );

      res.json({
        success: true,
        message: '推送状态已更新'
      });
    } catch (err) {
      logger.error('更新推送状态失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '更新推送状态失败',
        code: 'UPDATE_PUSH_STATUS_ERROR'
      });
    }
  }
}

module.exports = UpdateController;
