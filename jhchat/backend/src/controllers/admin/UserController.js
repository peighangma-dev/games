const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const { logger } = require('../../utils/logger');
const { isIpBanned, containsBadWord } = require('../../utils/helpers');

/**
 * 用户管理控制器
 * 提供用户查询、编辑、封禁、踢出等功能
 */
class UserController {
  /**
   * 获取用户列表（支持高级搜索）
   */
  static async getUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        grade,
        sect,
        vip,
        registerIp,
        lastLoginIp,
        startDate,
        endDate,
        orderBy = 'id',
        order = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClauses = ['1=1'];
      const params = [];

      // 构建查询条件
      if (search) {
        whereClauses.push('username LIKE ?');
        params.push(`%${search}%`);
      }
      if (status) {
        whereClauses.push('status = ?');
        params.push(status);
      }
      if (grade) {
        const [min, max] = grade.split('-');
        if (max) {
          whereClauses.push('grade BETWEEN ? AND ?');
          params.push(parseInt(min), parseInt(max));
        } else {
          whereClauses.push('grade = ?');
          params.push(parseInt(grade));
        }
      }
      if (sect) {
        whereClauses.push('sect = ?');
        params.push(sect);
      }
      if (vip !== undefined) {
        whereClauses.push('is_vip = ?');
        params.push(vip === 'true' ? 1 : 0);
      }
      if (registerIp) {
        whereClauses.push('register_ip = ?');
        params.push(registerIp);
      }
      if (lastLoginIp) {
        whereClauses.push('last_login_ip = ?');
        params.push(lastLoginIp);
      }
      if (startDate) {
        whereClauses.push('registered_at >= ?');
        params.push(startDate);
      }
      if (endDate) {
        whereClauses.push('registered_at <= ?');
        params.push(endDate);
      }

      const where = whereClauses.join(' AND ');
      
      // 验证排序字段
      const allowedOrders = ['id', 'username', 'grade', 'silver', 'registered_at', 'last_login_at'];
      const orderField = allowedOrders.includes(orderBy) ? orderBy : 'id';
      const orderDir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const [users] = await db.execute(
        `SELECT id, username, gender, status, grade, sect, faction, silver, 
                deposit, is_vip, vip_expires_at, registered_at, last_login_at,
                last_login_ip, register_ip, neili, wugong, tili, attack_power
         FROM users 
         WHERE ${where} 
         ORDER BY ${orderField} ${orderDir} 
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM users WHERE ${where}`,
        params
      );

      res.json({
        success: true,
        data: {
          users,
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult[0].total / parseInt(limit))
        }
      });
    } catch (err) {
      logger.error('查询用户列表失败', { error: err.message });
      res.status(500).json({ 
        success: false, 
        message: '查询用户列表失败',
        code: 'USER_LIST_ERROR'
      });
    }
  }

  /**
   * 获取用户详情
   */
  static async getUserDetail(req, res) {
    try {
      const { id } = req.params;
      
      const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
      if (users.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: '用户不存在',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = users[0];
      
      // 获取用户统计数据
      const [chatCount] = await db.execute(
        'SELECT COUNT(*) as count FROM chat_messages WHERE sender = ?',
        [user.username]
      );
      
      const [tradeCount] = await db.execute(
        'SELECT COUNT(*) as count FROM trade_logs WHERE user_id = ?',
        [id]
      );

      // 获取用户装备
      const [equipment] = await db.execute(
        'SELECT * FROM items WHERE owner = ? AND is_equipped = 1',
        [user.username]
      );

      // 获取最近登录记录
      const [loginLogs] = await db.execute(
        `SELECT ip_address, login_status, created_at 
         FROM user_ip_logs 
         WHERE user_id = ? AND ip_type = 'login'
         ORDER BY created_at DESC 
         LIMIT 10`,
        [id]
      );

      res.json({
        success: true,
        data: {
          basic: user,
          stats: {
            chatMessages: chatCount[0].count,
            trades: tradeCount[0].count || 0,
            loginCount: user.login_count
          },
          equipment,
          recentLogins: loginLogs
        }
      });
    } catch (err) {
      logger.error('查询用户详情失败', { error: err.message });
      res.status(500).json({ 
        success: false, 
        message: '查询用户详情失败',
        code: 'USER_DETAIL_ERROR'
      });
    }
  }

  /**
   * 更新用户信息
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const {
        grade,
        sect,
        faction,
        sect_title,
        silver,
        neili,
        wugong,
        tili,
        attack_power,
        status,
        is_vip,
        vip_days
      } = req.body;

      // 检查用户是否存在
      const [users] = await db.execute('SELECT id, grade FROM users WHERE id = ?', [id]);
      if (users.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: '用户不存在',
          code: 'USER_NOT_FOUND'
        });
      }

      // 权限检查：不能修改等级高于自己的用户
      if (users[0].grade >= req.user.grade) {
        return res.status(403).json({
          success: false,
          message: '不能修改等级高于或等于自己的用户',
          code: 'GRADE_INSUFFICIENT'
        });
      }

      const fields = [];
      const params = [];

      if (grade !== undefined) {
        if (grade >= req.user.grade) {
          return res.status(403).json({
            success: false,
            message: '不能设置高于或等于自身等级的等级',
            code: 'GRADE_INVALID'
          });
        }
        fields.push('grade = ?');
        params.push(grade);
      }
      if (sect !== undefined) {
        fields.push('sect = ?');
        params.push(sect);
      }
      if (faction !== undefined) {
        fields.push('faction = ?');
        params.push(faction);
      }
      if (sect_title !== undefined) {
        fields.push('sect_title = ?');
        params.push(sect_title);
      }
      if (silver !== undefined) {
        fields.push('silver = ?');
        params.push(silver);
      }
      if (neili !== undefined) {
        fields.push('neili = ?');
        params.push(neili);
      }
      if (wugong !== undefined) {
        fields.push('wugong = ?');
        params.push(wugong);
      }
      if (tili !== undefined) {
        fields.push('tili = ?');
        params.push(tili);
      }
      if (attack_power !== undefined) {
        fields.push('attack_power = ?');
        params.push(attack_power);
      }
      if (status !== undefined) {
        fields.push('status = ?');
        params.push(status);
      }
      if (is_vip !== undefined) {
        fields.push('is_vip = ?');
        params.push(is_vip);
        if (is_vip && vip_days) {
          fields.push('vip_expires_at = DATE_ADD(NOW(), INTERVAL ? DAY)');
          params.push(vip_days);
        } else if (!is_vip) {
          fields.push('vip_expires_at = NULL');
        }
      }

      if (fields.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: '没有需要更新的字段',
          code: 'NO_FIELDS_TO_UPDATE'
        });
      }

      params.push(id);
      await db.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);

      logger.info('管理员修改用户信息', {
        operator: req.user.username,
        targetUserId: id,
        changes: req.body
      });

      res.json({
        success: true,
        message: '用户信息已更新'
      });
    } catch (err) {
      logger.error('更新用户信息失败', { error: err.message });
      res.status(500).json({ 
        success: false, 
        message: '更新用户信息失败',
        code: 'USER_UPDATE_ERROR'
      });
    }
  }

  /**
   * 封禁用户
   */
  static async banUser(req, res) {
    try {
      const { id } = req.params;
      const { reason, duration = 0, notify = true } = req.body;

      // 检查用户是否存在
      const [users] = await db.execute('SELECT id, username, grade, status FROM users WHERE id = ?', [id]);
      if (users.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: '用户不存在',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = users[0];

      // 权限检查
      if (user.grade >= req.user.grade) {
        return res.status(403).json({
          success: false,
          message: '不能封禁等级高于或等于自己的用户',
          code: 'GRADE_INSUFFICIENT'
        });
      }

      // 如果已经是封禁状态，先解封
      const newStatus = 'banned';
      
      await db.execute(
        'UPDATE users SET status = ?, last_kick_at = NOW() WHERE id = ?',
        [newStatus, id]
      );

      // 从在线用户中移除
      await db.execute('DELETE FROM online_users WHERE user_id = ?', [id]);

      // 记录操作日志
      await db.execute(
        `INSERT INTO user_ban_logs 
        (user_id, username, banned_by, reason, duration, banned_at, expires_at)
        VALUES (?, ?, ?, ?, ?, NOW(), IF(? > 0, DATE_ADD(NOW(), INTERVAL ? DAY), NULL))`,
        [id, user.username, req.user.username, reason, duration, duration, duration]
      );

      // 发送站内通知
      if (notify) {
        await db.execute(
          `INSERT INTO messages (receiver, sender, title, content, sent_at)
           VALUES (?, '系统', '账号封禁通知', ?, NOW())`,
          [user.username, `您的账号因"${reason}"已被封禁${duration > 0 ? duration + '天' : '永久'}。`]
        );
      }

      logger.info('管理员封禁用户', {
        operator: req.user.username,
        targetUserId: id,
        targetUsername: user.username,
        reason,
        duration
      });

      res.json({
        success: true,
        message: `用户 ${user.username} 已被${duration > 0 ? '封禁' + duration + '天' : '永久封禁'}`
      });
    } catch (err) {
      logger.error('封禁用户失败', { error: err.message });
      res.status(500).json({ 
        success: false, 
        message: '封禁用户失败',
        code: 'USER_BAN_ERROR'
      });
    }
  }

  /**
   * 解封用户
   */
  static async unbanUser(req, res) {
    try {
      const { id } = req.params;
      const { notify = true } = req.body;

      const [users] = await db.execute('SELECT id, username, status FROM users WHERE id = ?', [id]);
      if (users.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: '用户不存在',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = users[0];
      if (user.status !== 'banned') {
        return res.status(400).json({
          success: false,
          message: '该用户未被封禁',
          code: 'USER_NOT_BANNED'
        });
      }

      await db.execute(
        'UPDATE users SET status = ? WHERE id = ?',
        ['normal', id]
      );

      if (notify) {
        await db.execute(
          `INSERT INTO messages (receiver, sender, title, content, sent_at)
           VALUES (?, '系统', '账号解封通知', '您的账号已被解封，可以正常登录了。', NOW())`,
          [user.username]
        );
      }

      logger.info('管理员解封用户', {
        operator: req.user.username,
        targetUserId: id,
        targetUsername: user.username
      });

      res.json({
        success: true,
        message: `用户 ${user.username} 已解封`
      });
    } catch (err) {
      logger.error('解封用户失败', { error: err.message });
      res.status(500).json({ 
        success: false, 
        message: '解封用户失败',
        code: 'USER_UNBAN_ERROR'
      });
    }
  }

  /**
   * 踢出用户
   */
  static async kickUser(req, res) {
    try {
      const { id } = req.params;
      const { reason, cooldown = 30, notify = true } = req.body;

      const [users] = await db.execute('SELECT id, username, grade FROM users WHERE id = ?', [id]);
      if (users.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: '用户不存在',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = users[0];

      // 权限检查
      if (user.grade >= req.user.grade) {
        return res.status(403).json({
          success: false,
          message: '不能踢出等级高于或等于自己的用户',
          code: 'GRADE_INSUFFICIENT'
        });
      }

      // 检查用户是否在线
      const [online] = await db.execute('SELECT id FROM online_users WHERE user_id = ?', [id]);
      if (online.length === 0) {
        return res.status(400).json({
          success: false,
          message: '该用户不在线',
          code: 'USER_NOT_ONLINE'
        });
      }

      // 从在线用户中移除
      await db.execute('DELETE FROM online_users WHERE user_id = ?', [id]);

      // 设置禁止登录冷却时间
      await db.execute(
        'UPDATE users SET last_kick_at = NOW() WHERE id = ?',
        [id]
      );

      // 记录踢出日志
      await db.execute(
        `INSERT INTO user_kick_logs 
        (user_id, username, kicked_by, reason, cooldown, kicked_at)
        VALUES (?, ?, ?, ?, ?, NOW())`,
        [id, user.username, req.user.username, reason, cooldown]
      );

      // 通知用户
      if (notify) {
        await db.execute(
          `INSERT INTO messages (receiver, sender, title, content, sent_at)
           VALUES (?, '系统', '被踢出通知', 
           CONCAT('您被管理员 "', ?, '" 踢出聊天室，原因：', ?, '。', 
                  IF(? > 0, CONCAT('请等待 ', ?, ' 分钟后再登录。'), '')), 
           NOW())`,
          [user.username, req.user.username, reason, cooldown, cooldown]
        );
      }

      // 通过 WebSocket 通知用户下线
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${id}`).emit('kick', {
          reason,
          cooldown,
          operator: req.user.username
        });
      }

      logger.info('管理员踢出用户', {
        operator: req.user.username,
        targetUserId: id,
        targetUsername: user.username,
        reason,
        cooldown
      });

      res.json({
        success: true,
        message: `用户 ${user.username} 已被踢出，${cooldown > 0 ? cooldown + '分钟内禁止登录' : '可以重新登录'}`
      });
    } catch (err) {
      logger.error('踢出用户失败', { error: err.message });
      res.status(500).json({ 
        success: false, 
        message: '踢出用户失败',
        code: 'USER_KICK_ERROR'
      });
    }
  }

  /**
   * 重置用户密码
   */
  static async resetPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword, notify = true, forceChange = false } = req.body;

      // 验证新密码
      if (!newPassword || newPassword.length < 3) {
        return res.status(400).json({
          success: false,
          message: '密码长度不能少于 3 位',
          code: 'PASSWORD_TOO_SHORT'
        });
      }

      const [users] = await db.execute('SELECT id, username, grade FROM users WHERE id = ?', [id]);
      if (users.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: '用户不存在',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = users[0];

      // 权限检查
      if (user.grade >= req.user.grade) {
        return res.status(403).json({
          success: false,
          message: '不能重置等级高于或等于自己的用户密码',
          code: 'GRADE_INSUFFICIENT'
        });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.execute(
        'UPDATE users SET password = ?, force_password_change = ? WHERE id = ?',
        [hashedPassword, forceChange ? 1 : 0, id]
      );

      // 发送通知
      if (notify) {
        await db.execute(
          `INSERT INTO messages (receiver, sender, title, content, sent_at)
           VALUES (?, '系统', '密码重置通知', 
           CONCAT('管理员已将您的密码重置。', 
                  IF(?, '首次登录时请修改密码。', '')), 
           NOW())`,
          [user.username, forceChange ? 1 : 0]
        );
      }

      logger.info('管理员重置用户密码', {
        operator: req.user.username,
        targetUserId: id,
        targetUsername: user.username
      });

      res.json({
        success: true,
        message: `用户 ${user.username} 密码已重置${forceChange ? '，强制下次登录修改' : ''}`
      });
    } catch (err) {
      logger.error('重置密码失败', { error: err.message });
      res.status(500).json({ 
        success: false, 
        message: '重置密码失败',
        code: 'PASSWORD_RESET_ERROR'
      });
    }
  }

  /**
   * 获取用户背包
   */
  static async getUserInventory(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const [users] = await db.execute('SELECT id, username FROM users WHERE id = ?', [id]);
      if (users.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: '用户不存在',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = users[0];

      const [items] = await db.execute(
        'SELECT * FROM items WHERE owner = ? ORDER BY is_equipped DESC, id DESC LIMIT ? OFFSET ?',
        [user.username, parseInt(limit), offset]
      );

      const [countResult] = await db.execute(
        'SELECT COUNT(*) as total FROM items WHERE owner = ?',
        [user.username]
      );

      res.json({
        success: true,
        data: {
          items,
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (err) {
      logger.error('查询用户背包失败', { error: err.message });
      res.status(500).json({ 
        success: false, 
        message: '查询用户背包失败',
        code: 'INVENTORY_ERROR'
      });
    }
  }

  /**
   * 删除用户（软删除）
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const [users] = await db.execute('SELECT id, username, grade, status FROM users WHERE id = ?', [id]);
      if (users.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: '用户不存在',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = users[0];

      // 权限检查
      if (user.grade >= req.user.grade) {
        return res.status(403).json({
          success: false,
          message: '不能删除等级高于或等于自己的用户',
          code: 'GRADE_INSUFFICIENT'
        });
      }

      // 软删除：设置状态为 dead
      await db.execute(
        "UPDATE users SET status = 'dead', username = CONCAT(username, '_deleted_', id, '_', UNIX_TIMESTAMP()) WHERE id = ?",
        [id]
      );

      // 从在线用户中移除
      await db.execute('DELETE FROM online_users WHERE user_id = ?', [id]);

      logger.info('管理员删除用户', {
        operator: req.user.username,
        targetUserId: id,
        targetUsername: user.username
      });

      res.json({
        success: true,
        message: `用户 ${user.username} 已删除`
      });
    } catch (err) {
      logger.error('删除用户失败', { error: err.message });
      res.status(500).json({ 
        success: false, 
        message: '删除用户失败',
        code: 'USER_DELETE_ERROR'
      });
    }
  }

  /**
   * 获取用户时间线
   */
  static async getUserTimeline(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const [users] = await db.execute('SELECT id, username FROM users WHERE id = ?', [id]);
      if (users.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: '用户不存在',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = users[0];
      const events = [];

      // 最近登录
      const [logins] = await db.execute(
        `SELECT 'login' as type, ip_address as ip, created_at as time, '登录成功' as details 
         FROM user_ip_logs WHERE user_id = ? AND ip_type = 'login' AND login_status = 'success'
         ORDER BY created_at DESC LIMIT 5`,
        [id]
      );
      events.push(...logins);

      // 最近消息
      const [messages] = await db.execute(
        `SELECT 'message' as type, NULL as ip, created_at as time, CONCAT('发送消息：', LEFT(content, 50)) as details
         FROM chat_messages WHERE sender = ?
         ORDER BY created_at DESC LIMIT 5`,
        [user.username]
      );
      events.push(...messages);

      // 交易记录
      const [trades] = await db.execute(
        `SELECT 'trade' as type, NULL as ip, created_at as time, CONCAT('交易：', details) as details
         FROM trade_logs WHERE user_id = ?
         ORDER BY created_at DESC LIMIT 5`,
        [id]
      );
      events.push(...trades || []);

      // 按时间排序
      events.sort((a, b) => new Date(b.time) - new Date(a.time));

      res.json({
        success: true,
        data: {
          events: events.slice(offset, offset + parseInt(limit)),
          total: events.length,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (err) {
      logger.error('查询用户时间线失败', { error: err.message });
      res.status(500).json({ 
        success: false, 
        message: '查询用户时间线失败',
        code: 'TIMELINE_ERROR'
      });
    }
  }

  /**
   * 获取管理员列表
   */
  static async getManagers(req, res) {
    try {
      const [users] = await db.execute(
        `SELECT id, username, email, grade, gender, silver, exp, created_at, last_login_at
         FROM users 
         WHERE grade >= 6 
         ORDER BY grade DESC, created_at ASC`
      );
      
      const gradeNames = {
        6: '护法',
        7: '护法',
        8: '长老',
        9: '长老',
        10: '掌门'
      };
      
      const managers = users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        grade: u.grade,
        gradeName: gradeNames[u.grade] || '管理员',
        gender: u.gender,
        silver: u.silver,
        exp: u.exp,
        createdAt: u.created_at,
        lastLoginAt: u.last_login_at
      }));
      
      res.json({
        success: true,
        data: managers
      });
    } catch (err) {
      logger.error('查询管理员列表失败', { error: err.message });
      res.status(500).json({ 
        success: false, 
        message: '查询管理员列表失败' 
      });
    }
  }
}

module.exports = UserController;
