const db = require('../../config/db');

/**
 * 系统配置管理控制器
 */
class ConfigController {
  /**
   * 获取所有系统配置
   */
  static async getConfigs(req, res) {
    try {
      const [configs] = await db.execute(
        'SELECT name, value, description FROM system_config ORDER BY name'
      );

      res.json({
        success: true,
        data: configs,
        total: configs.length
      });
    } catch (err) {
      console.error('获取系统配置失败:', err.message);
      res.status(500).json({
        success: false,
        message: '获取系统配置失败',
        code: 'GET_CONFIG_ERROR'
      });
    }
  }

  /**
   * 更新系统配置
   */
  static async updateConfig(req, res) {
    try {
      const { name } = req.params;
      const { value } = req.body;

      if (value === undefined) {
        return res.status(400).json({
          success: false,
          message: '缺少 value 参数',
          code: 'MISSING_VALUE'
        });
      }

      // 检查配置是否存在
      const [configs] = await db.execute(
        'SELECT * FROM system_config WHERE name = ?',
        [name]
      );

      if (configs.length === 0) {
        return res.status(404).json({
          success: false,
          message: '配置项不存在',
          code: 'CONFIG_NOT_FOUND'
        });
      }

      // 更新配置
      await db.execute(
        'UPDATE system_config SET value = ?, updated_at = NOW() WHERE name = ?',
        [value, name]
      );

      const { logger } = require('../../utils/logger');
      logger.info('管理员更新系统配置', {
        operator: req.user.username,
        name,
        value,
        oldValue: configs[0].value
      });

      res.json({
        success: true,
        message: '配置已更新',
        data: { name, value }
      });
    } catch (err) {
      console.error('更新系统配置失败:', err.message);
      res.status(500).json({
        success: false,
        message: '更新系统配置失败',
        code: 'UPDATE_CONFIG_ERROR'
      });
    }
  }

  /**
   * 批量更新配置
   */
  static async batchUpdateConfigs(req, res) {
    try {
      const { configs } = req.body;

      if (!Array.isArray(configs)) {
        return res.status(400).json({
          success: false,
          message: 'configs 必须是数组',
          code: 'INVALID_FORMAT'
        });
      }

      const updatePromises = configs.map(item => {
        if (!item.name || item.value === undefined) {
          throw new Error(`配置项 ${item.name} 缺少必填字段`);
        }

        return db.execute(
          'UPDATE system_config SET value = ?, updated_at = NOW() WHERE name = ?',
          [item.value, item.name]
        );
      });

      await Promise.all(updatePromises);

      const { logger } = require('../../utils/logger');
      logger.info('管理员批量更新系统配置', {
        operator: req.user.username,
        count: configs.length
      });

      res.json({
        success: true,
        message: `成功更新 ${configs.length} 个配置项`
      });
    } catch (err) {
      console.error('批量更新配置失败:', err.message);
      res.status(500).json({
        success: false,
        message: '批量更新配置失败',
        code: 'BATCH_UPDATE_ERROR'
      });
    }
  }

  /**
   * 获取配置分组
   */
  static async getGroupedConfigs(req, res) {
    try {
      const [configs] = await db.execute(
        'SELECT name, value, description FROM system_config ORDER BY name'
      );

      // 按功能分组
      const groups = {
        '聊天室配置': [],
        '等级经验配置': [],
        '系统限制': [],
        '开关控制': [],
        '用户管理': [],
        '投票配置': [],
        '外观配置': [],
        '其他配置': []
      };

      configs.forEach(config => {
        const name = config.name.toLowerCase();
        let section = '其他配置';

        if (name.includes('chat') || name.includes('room')) {
          section = '聊天室配置';
        } else if (name.includes('level') || name.includes('exp')) {
          section = '等级经验配置';
        } else if (name.includes('max') || name.includes('timeout')) {
          section = '系统限制';
        } else if (name.includes('dis') || name.includes('closed') || name.includes('allow')) {
          section = '开关控制';
        } else if (name.includes('user') || name.includes('admin')) {
          section = '用户管理';
        } else if (name.includes('poll')) {
          section = '投票配置';
        } else if (name.includes('bg') || name.includes('color') || name.includes('image')) {
          section = '外观配置';
        }

        groups[section].push(config);
      });

      // 过滤空分组
      const filteredGroups = {};
      Object.entries(groups).forEach(([key, value]) => {
        if (value.length > 0) {
          filteredGroups[key] = value;
        }
      });

      res.json({
        success: true,
        data: filteredGroups
      });
    } catch (err) {
      console.error('获取分组配置失败:', err.message);
      res.status(500).json({
        success: false,
        message: '获取分组配置失败',
        code: 'GROUPED_CONFIG_ERROR'
      });
    }
  }
}

module.exports = ConfigController;
