const db = require('../config/db');

/**
 * 游戏 Buff 系统控制器
 * 管理游戏产生的属性增益效果
 */
class GameBonusController {
  /**
   * 获取用户当前所有 Buff
   */
  static async getUserBonuses(req, res) {
    try {
      const now = new Date();
      
      // 获取未过期的 Buff
      const [bonuses] = await db.execute(
        `SELECT * FROM game_bonuses 
         WHERE user_id = ? 
         AND (expires_at IS NULL OR expires_at > ?)
         ORDER BY created_at DESC`,
        [req.user.id, now]
      );
      
      // 按类型分组
      const grouped = {};
      bonuses.forEach(b => {
        if (!grouped[b.bonus_type]) {
          grouped[b.bonus_type] = [];
        }
        grouped[b.bonus_type].push(b);
      });
      
      res.json({
        success: true,
        data: {
          bonuses: grouped,
          all: bonuses
        }
      });
    } catch (err) {
      console.error('获取 Buff 失败:', err);
      res.status(500).json({ success: false, message: '获取 Buff 失败' });
    }
  }
  
  /**
   * 添加 Buff
   */
  static async addBonus(req, res) {
    try {
      const { 
        bonus_type, 
        bonus_value = 0, 
        bonus_percent = 0, 
        source, 
        source_id,
        reason,
        duration_minutes = 0 // 0 为永久
      } = req.body;
      
      if (!bonus_type) {
        return res.status(400).json({ success: false, message: '缺少 buff 类型' });
      }
      
      const expiresAt = duration_minutes > 0 
        ? new Date(Date.now() + duration_minutes * 60000)
        : null;
      
      await db.execute(
        `INSERT INTO game_bonuses 
         (user_id, bonus_type, bonus_value, bonus_percent, source, source_id, reason, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, bonus_type, bonus_value, bonus_percent, source || null, source_id || null, reason || null, expiresAt]
      );
      
      res.json({
        success: true,
        message: 'Buff 添加成功',
        data: {
          bonus_type,
          bonus_value,
          bonus_percent,
          expires_at: expiresAt
        }
      });
    } catch (err) {
      console.error('添加 Buff 失败:', err);
      res.status(500).json({ success: false, message: '添加 Buff 失败' });
    }
  }
  
  /**
   * 移除 Buff
   */
  static async removeBonus(req, res) {
    try {
      const { bonus_id } = req.body;
      
      await db.execute(
        'DELETE FROM game_bonuses WHERE id = ? AND user_id = ?',
        [bonus_id, req.user.id]
      );
      
      res.json({ success: true, message: 'Buff 已移除' });
    } catch (err) {
      console.error('移除 Buff 失败:', err);
      res.status(500).json({ success: false, message: '移除 Buff 失败' });
    }
  }
  
  /**
   * 清理过期 Buff
   */
  static async cleanupExpired(req, res) {
    try {
      const now = new Date();
      
      const [result] = await db.execute(
        'DELETE FROM game_bonuses WHERE expires_at IS NOT NULL AND expires_at <= ?',
        [now]
      );
      
      res.json({
        success: true,
        message: `清理了 ${result.affectedRows} 个过期 Buff`
      });
    } catch (err) {
      console.error('清理 Buff 失败:', err);
      res.status(500).json({ success: false, message: '清理 Buff 失败' });
    }
  }
  
  /**
   * 计算用户最终属性（考虑 Buff 加成）
   */
  static async calculateFinalStats(req, res) {
    try {
      const userId = req.params.id || req.user.id;
      
      // 获取用户基础属性
      const [users] = await db.execute(
        'SELECT id, username, total_exp, monthly_exp, silver, tili, level, sect, grade FROM users WHERE id = ?',
        [userId]
      );
      
      if (users.length === 0) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }
      
      const user = users[0];
      const now = new Date();
      
      // 获取有效 Buff
      const [bonuses] = await db.execute(
        `SELECT * FROM game_bonuses 
         WHERE user_id = ? 
         AND (expires_at IS NULL OR expires_at > ?)`,
        [userId, now]
      );
      
      // 计算加成
      const bonusMap = {};
      bonuses.forEach(b => {
        if (!bonusMap[b.bonus_type]) {
          bonusMap[b.bonus_type] = { value: 0, percent: 0 };
        }
        bonusMap[b.bonus_type].value += b.bonus_value;
        bonusMap[b.bonus_type].percent += parseFloat(b.bonus_percent) || 0;
      });
      
      // 计算最终属性
      const stats = {
        // 基础属性
        base: {
          silver: user.silver,
          neili: user.neili,
          tili: user.tili,
          wugong: user.wugong,
          attack: user.attack,
          defense: user.defense,
          speed: user.speed,
          charm: user.charm,
          attack_power: user.attack_power,
          exp: user.exp
        },
        // Buff 加成
        bonuses: bonusMap,
        // 最终属性
        final: {
          silver: user.silver + (bonusMap.silver?.value || 0),
          neili: Math.floor(user.neili * (1 + (bonusMap.neili?.percent || 0) / 100)) + (bonusMap.neili?.value || 0),
          tili: Math.floor(user.tili * (1 + (bonusMap.tili?.percent || 0) / 100)) + (bonusMap.tili?.value || 0),
          wugong: Math.floor(user.wugong * (1 + (bonusMap.wugong?.percent || 0) / 100)) + (bonusMap.wugong?.value || 0),
          attack: Math.floor(user.attack * (1 + (bonusMap.attack?.percent || 0) / 100)) + (bonusMap.attack?.value || 0),
          defense: Math.floor(user.defense * (1 + (bonusMap.defense?.percent || 0) / 100)) + (bonusMap.defense?.value || 0),
          speed: Math.floor(user.speed * (1 + (bonusMap.speed?.percent || 0) / 100)) + (bonusMap.speed?.value || 0),
          charm: Math.floor(user.charm * (1 + (bonusMap.charm?.percent || 0) / 100)) + (bonusMap.charm?.value || 0),
          attack_power: this.calculateAttackPower(user, bonusMap),
          exp: user.exp + (bonusMap.exp?.value || 0)
        }
      };
      
      res.json({
        success: true,
        data: stats
      });
    } catch (err) {
      console.error('计算属性失败:', err);
      res.status(500).json({ success: false, message: '计算属性失败' });
    }
  }
  
  /**
   * 计算攻击力（复杂公式）
   */
  static calculateAttackPower(user, bonusMap) {
    const baseAttack = user.attack + (bonusMap.attack?.value || 0);
    const wugong = user.wugong + (bonusMap.wugong?.value || 0);
    const neili = user.neili + (bonusMap.neili?.value || 0);
    
    // 攻击力 = (基础攻击 + 武功/2) * (1 + 内力/1000)
    let power = (baseAttack + wugong / 2) * (1 + neili / 1000);
    
    // 应用百分比加成
    const percent = bonusMap.attack_power?.percent || 0;
    power = Math.floor(power * (1 + percent / 100));
    
    return Math.round(power * 10) / 10; // 保留一位小数
  }
  
  /**
   * 更新游戏统计
   */
  static async updateStatistics(req, res) {
    try {
      const { 
        game_id, 
        is_win, 
        profit = 0, 
        playtime = 0 
      } = req.body;
      
      const now = new Date();
      
      // 使用 INSERT ... ON DUPLICATE KEY UPDATE
      await db.execute(
        `INSERT INTO game_statistics 
         (user_id, total_games, total_wins, total_losses, total_profit, 
          current_streak, best_streak, favorite_game, last_played_at)
         VALUES (?, 1, ?, ?, ?, 
          IF(?, current_streak + 1, 0), 
          GREATEST(best_streak, IF(?, current_streak + 1, 0)),
          ?, NOW())
         ON DUPLICATE KEY UPDATE
         total_games = total_games + 1,
         total_wins = total_wins + ?,
         total_losses = total_losses + ?,
         total_profit = total_profit + ?,
         current_streak = IF(?, current_streak + 1, 0),
         best_streak = GREATEST(best_streak, IF(?, current_streak + 1, 0)),
         last_played_at = NOW()`,
        [
          req.user.id,
          is_win ? 1 : 0,
          is_win ? 0 : 1,
          profit,
          is_win ? 1 : 0,
          is_win ? 1 : 0,
          game_id,
          is_win ? 1 : 0,
          is_win ? 0 : 1,
          profit,
          is_win ? 1 : 0,
          is_win ? 1 : 0
        ]
      );
      
      res.json({ success: true, message: '统计已更新' });
    } catch (err) {
      console.error('更新统计失败:', err);
      res.status(500).json({ success: false, message: '更新统计失败' });
    }
  }
  
  /**
   * 获取用户游戏统计
   */
  static async getStatistics(req, res) {
    try {
      const [stats] = await db.execute(
        'SELECT * FROM game_statistics WHERE user_id = ?',
        [req.user.id]
      );
      
      if (stats.length === 0) {
        return res.json({
          success: true,
          data: {
            total_games: 0,
            total_wins: 0,
            total_losses: 0,
            win_rate: 0,
            total_profit: 0,
            best_streak: 0,
            current_streak: 0
          }
        });
      }
      
      const s = stats[0];
      const winRate = s.total_games > 0 
        ? ((s.total_wins / s.total_games) * 100).toFixed(2)
        : 0;
      
      res.json({
        success: true,
        data: {
          ...s,
          win_rate: parseFloat(winRate)
        }
      });
    } catch (err) {
      console.error('获取统计失败:', err);
      res.status(500).json({ success: false, message: '获取统计失败' });
    }
  }
}

module.exports = GameBonusController;
