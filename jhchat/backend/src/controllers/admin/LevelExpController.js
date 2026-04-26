const db = require('../../config/db');

/**
 * 用户等级经验系统控制器
 * 提供聊天经验计算、等级配置管理、管理员资格验证等功能
 */
class LevelExpController {
  /**
   * 获取等级配置列表
   */
  static async getLevelConfigs(req, res) {
    try {
      const [configs] = await db.execute(
        'SELECT * FROM user_level_config ORDER BY level'
      );
      res.json({ success: true, data: configs });
    } catch (err) {
      console.error('获取等级配置失败:', err);
      res.status(500).json({ success: false, message: '获取等级配置失败' });
    }
  }

  /**
   * 更新等级配置（仅限掌门）
   */
  static async updateLevelConfig(req, res) {
    try {
      const { level, required_exp, max_daily_chat_exp, chat_exp_per_minute, can_be_admin, min_register_days, min_total_exp } = req.body;
      
      if (!level || level < 1 || level > 10) {
        return res.status(400).json({ success: false, message: '等级必须在 1-10 之间' });
      }

      await db.execute(
        `UPDATE user_level_config SET 
          required_exp = ?, 
          max_daily_chat_exp = ?, 
          chat_exp_per_minute = ?,
          can_be_admin = ?,
          min_register_days = ?,
          min_total_exp = ?
        WHERE level = ?`,
        [required_exp, max_daily_chat_exp, chat_exp_per_minute, can_be_admin ? 1 : 0, min_register_days, min_total_exp, level]
      );

      res.json({ success: true, message: '等级配置已更新' });
    } catch (err) {
      console.error('更新等级配置失败:', err);
      res.status(500).json({ success: false, message: '更新等级配置失败' });
    }
  }

  /**
   * 计算聊天经验奖励
   */
  static async calculateChatExp(req, res) {
    try {
      const { userId, minutes } = req.body;
      
      if (!userId || !minutes || minutes <= 0) {
        return res.status(400).json({ success: false, message: '参数错误' });
      }

      // 获取用户信息
      const [users] = await db.execute(
        `SELECT u.id, u.grade, u.chat_minutes_today, u.total_exp, 
                lc.max_daily_chat_exp, lc.chat_exp_per_minute
         FROM users u
         LEFT JOIN user_level_config lc ON u.grade = lc.level
         WHERE u.id = ?`,
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      const user = users[0];
      
      // 计算今日已获得聊天经验
      const todayExp = Math.min(user.chat_minutes_today * user.chat_exp_per_minute, user.max_daily_chat_exp);
      
      // 计算本次可获得的经验
      const potentialExp = minutes * user.chat_exp_per_minute;
      const remainingDailyLimit = user.max_daily_chat_exp - todayExp;
      const actualExp = Math.min(potentialExp, Math.max(0, remainingDailyLimit));
      
      // 是否达到日限制
      const isDailyLimit = actualExp < potentialExp;

      res.json({
        success: true,
        data: {
          expGain: actualExp,
          isDailyLimit,
          remainingDailyLimit: Math.max(0, remainingDailyLimit - actualExp),
          newTotalExp: user.total_exp + actualExp
        }
      });
    } catch (err) {
      console.error('计算聊天经验失败:', err);
      res.status(500).json({ success: false, message: '计算聊天经验失败' });
    }
  }

  /**
   * 验证管理员资格
   */
  static async verifyAdminQualification(req, res) {
    try {
      const { userId, targetGrade } = req.query;
      
      if (!userId || !targetGrade) {
        return res.status(400).json({ success: false, message: '参数错误' });
      }

      const targetGradeNum = parseInt(targetGrade);
      
      if (targetGradeNum < 6 || targetGradeNum > 10) {
        return res.status(400).json({ success: false, message: '管理员等级必须在 6-10 之间' });
      }

      // 获取用户信息
      const [users] = await db.execute(
        `SELECT u.id, u.username, u.grade, u.total_exp, u.chat_minutes_total,
                DATE_DIFF(NOW(), u.registered_at) as register_days,
                lc.can_be_admin, lc.min_register_days, lc.min_total_exp, lc.required_exp
         FROM users u
         LEFT JOIN user_level_config lc ON u.grade = lc.level
         WHERE u.id = ?`,
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      const user = users[0];
      const requirements = [];
      const passed = [];
      const failed = [];

      // 检查当前等级
      requirements.push({
        name: '当前等级',
        passed: user.grade >= targetGradeNum,
        current: user.grade,
        required: targetGradeNum
      });

      // 获取目标等级的配置
      const [targetConfigs] = await db.execute(
        'SELECT * FROM user_level_config WHERE level = ?',
        [targetGradeNum]
      );

      if (targetConfigs.length > 0) {
        const config = targetConfigs[0];
        
        // 检查管理员权限
        requirements.push({
          name: '管理员权限',
          passed: config.can_be_admin === 1,
          current: config.can_be_admin === 1 ? '有' : '无',
          required: '有'
        });

        // 检查注册天数
        requirements.push({
          name: '注册天数',
          passed: user.register_days >= config.min_register_days,
          current: user.register_days,
          required: config.min_register_days
        });

        // 检查总经验
        requirements.push({
          name: '总经验',
          passed: user.total_exp >= config.min_total_exp,
          current: user.total_exp,
          required: config.min_total_exp
        });

        // 检查升级经验
        requirements.push({
          name: '升级经验',
          passed: user.total_exp >= config.required_exp,
          current: user.total_exp,
          required: config.required_exp
        });
      }

      // 统计通过情况
      requirements.forEach(req => {
        if (req.passed) {
          passed.push(req.name);
        } else {
          failed.push(req);
        }
      });

      res.json({
        success: true, 
        data: {
          qualified: failed.length === 0,
          username: user.username,
          currentGrade: user.grade,
          targetGrade: targetGradeNum,
          requirements,
          passed: passed.length,
          total: requirements.length,
          failedRequirements: failed
        }
      });
    } catch (err) {
      console.error('验证管理员资格失败:', err);
      res.status(500).json({ success: false, message: '验证管理员资格失败' });
    }
  }

  /**
   * 获取用户的经验统计
   */
  static async getUserExpStats(req, res) {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ success: false, message: '参数错误' });
      }

      const [stats] = await db.execute(
        `SELECT 
          u.id,
          u.username,
          u.grade,
          u.total_exp,
          u.monthly_exp,
          u.chat_minutes_today,
          u.chat_minutes_total,
          lc.chat_exp_per_minute,
          lc.max_daily_chat_exp,
          (u.chat_minutes_today * lc.chat_exp_per_minute) as today_exp,
          GREATEST(0, lc.max_daily_chat_exp - (u.chat_minutes_today * lc.chat_exp_per_minute)) as remaining_daily_exp,
          (SELECT COALESCE(SUM(exp_gain), 0) FROM chat_exp_logs WHERE user_id = u.id AND DATE(created_at) = CURDATE()) as logged_today_exp
        FROM users u
        LEFT JOIN user_level_config lc ON u.grade = lc.level
        WHERE u.id = ?`,
        [userId]
      );

      if (stats.length === 0) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      res.json({ success: true, data: stats[0] });
    } catch (err) {
      console.error('获取经验统计失败:', err);
      res.status(500).json({ success: false, message: '获取经验统计失败' });
    }
  }

  /**
   * 获取聊天经验日志
   */
  static async getChatExpLogs(req, res) {
    try {
      const { page = 1, limit = 50, userId, startDate, endDate } = req.query;
      const offset = (page - 1) * limit;
      
      const whereClauses = ['1=1'];
      const params = [];

      if (userId) {
        whereClauses.push('user_id = ?');
        params.push(userId);
      }

      if (startDate) {
        whereClauses.push('DATE(created_at) >= ?');
        params.push(startDate);
      }

      if (endDate) {
        whereClauses.push('DATE(created_at) <= ?');
        params.push(endDate);
      }

      const where = whereClauses.join(' AND ');

      const [logs] = await db.execute(
        `SELECT * FROM chat_exp_logs 
         WHERE ${where} 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM chat_exp_logs WHERE ${where}`,
        params
      );

      res.json({
        success: true,
        data: {
          list: logs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult[0].total,
            totalPages: Math.ceil(countResult[0].total / parseInt(limit))
          }
        }
      });
    } catch (err) {
      console.error('获取经验日志失败:', err);
      res.status(500).json({ success: false, message: '获取经验日志失败' });
    }
  }

  /**
   * 提交管理员申请
   */
  static async submitAdminApplication(req, res) {
    try {
      const { userId, username, applied_grade, reason } = req.body;
      
      const [users] = await db.execute(
        `SELECT u.*, lc.can_be_admin, lc.min_register_days, lc.min_total_exp 
         FROM users u
         LEFT JOIN user_level_config lc ON u.grade = lc.level
         WHERE u.id = ?`,
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      const user = users[0];
      const requiredGrade = 6;
      
      // 检查基础条件
      if (user.grade < requiredGrade) {
        return res.status(403).json({ 
          success: false, 
          message: `申请失败：需要等级${requiredGrade}级以上，当前等级${user.grade}级`,
          code: 'GRADE_INSUFFICIENT' 
        });
      }

      // 检查是否需要申请（如果已经是管理员）
      if (user.can_be_admin === 1) {
        return res.status(400).json({ 
          success: false, 
          message: '您当前等级已具备管理员权限，请联系掌门为您分配六扇门职位',
          code: 'ALREADY_ADMIN' 
        });
      }

      // 插入申请记录
      await db.execute(
        `INSERT INTO admin_applications (user_id, username, current_grade, applied_grade, reason, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [userId, username, user.grade, applied_grade, reason]
      );

      res.json({ success: true, message: '申请已提交，请等待审核' });
    } catch (err) {
      console.error('提交管理员申请失败:', err);
      res.status(500).json({ success: false, message: '提交管理员申请失败' });
    }
  }

  /**
   * 审核管理员申请
   */
  static async reviewAdminApplication(req, res) {
    try {
      const { applicationId, status, review_comment, reviewer } = req.body;
      
      if (!applicationId || !status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: '参数错误' });
      }

      // 更新申请状态
      await db.execute(
        `UPDATE admin_applications 
         SET status = ?, review_comment = ?, reviewer = ?, updated_at = NOW()
         WHERE id = ?`,
        [status, review_comment, reviewer, applicationId]
      );

      // 如果批准，更新用户权限
      if (status === 'approved') {
        const [apps] = await db.execute(
          'SELECT user_id, applied_grade FROM admin_applications WHERE id = ?',
          [applicationId]
        );

        if (apps.length > 0) {
          await db.execute(
            'UPDATE users SET grade = ?, can_be_admin = 1 WHERE id = ?',
            [apps[0].applied_grade, apps[0].user_id]
          );
        }
      }

      res.json({ success: true, message: `申请已${status === 'approved' ? '批准' : '拒绝'}` });
    } catch (err) {
      console.error('审核管理员申请失败:', err);
      res.status(500).json({ success: false, message: '审核管理员申请失败' });
    }
  }
}

module.exports = LevelExpController;
