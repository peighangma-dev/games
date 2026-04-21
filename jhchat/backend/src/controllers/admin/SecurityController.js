/**
 * 安全监控控制器
 */
const db = require('../../config/db');

class SecurityController {
  static async getSuspiciousUsers(req, res) {
    try {
      // 检测可疑行为：频繁操作、异常数据等
      const [suspicious] = await db.execute(`
        SELECT u.id as user_id, u.username, u.silver, u.wugong,
               COUNT(DISTINCT o.id) as operation_count,
               MAX(o.created_at) as last_detected
        FROM users u
        LEFT JOIN operation_logs o ON u.username = o.username
        WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY u.id
        HAVING operation_count > 100
        ORDER BY operation_count DESC
        LIMIT 100
      `);
      
      const users = suspicious.map(user => ({
        ...user,
        behavior: '频繁操作',
        count: user.operation_count,
        first_detected: user.last_detected,
        logs: []
      }));

      res.json({ 
        success: true, 
        data: {
          users,
          today_warnings: 0,
          today_bans: 0
        }
      });
    } catch (err) {
      console.error('获取可疑用户失败:', err);
      res.status(500).json({ success: false, message: '获取可疑用户失败' });
    }
  }

  static async warnUser(req, res) {
    try {
      const { userId } = req.params;
      const [users] = await db.execute('SELECT username FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      await db.execute(
        'INSERT INTO operation_logs (username, action, details) VALUES (?, ?, ?)',
        [users[0].username, 'warning', '系统自动警告：检测到可疑行为']
      );

      res.json({ success: true, message: '已警告用户' });
    } catch (err) {
      res.status(500).json({ success: false, message: '警告用户失败' });
    }
  }

  static async banUser(req, res) {
    try {
      const { userId } = req.params;
      await db.execute("UPDATE users SET status = 'jailed', jailed_at = NOW() WHERE id = ?", [userId]);
      res.json({ success: true, message: '已封禁用户' });
    } catch (err) {
      res.status(500).json({ success: false, message: '封禁用户失败' });
    }
  }

  static async clearAllCheats(req, res) {
    try {
      await db.execute("UPDATE users SET status = 'jailed', jailed_at = NOW() WHERE wugong > 10000 AND grade < 5");
      res.json({ success: true, message: '已清理所有作弊者' });
    } catch (err) {
      res.status(500).json({ success: false, message: '清理失败' });
    }
  }
}

module.exports = SecurityController;
