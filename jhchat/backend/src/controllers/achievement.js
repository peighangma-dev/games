const db = require('../config/db');

// 获取所有成就定义
exports.getAchievements = async (req, res) => {
  try {
    const [achievements] = await db.execute(
      'SELECT * FROM achievements ORDER BY category, points DESC'
    );
    res.json({ success: true, data: achievements });
  } catch (err) {
    console.error('Get achievements error:', err);
    res.status(500).json({ success: false, message: '查询成就列表失败' });
  }
};

// 获取我的成就
exports.getMyAchievements = async (req, res) => {
  try {
    const username = req.user.username;
    const userId = req.user.id;
    
    // 获取用户进度
    let [progress] = await db.execute(
      'SELECT * FROM achievement_progress WHERE user_id = ?',
      [userId]
    );
    
    if (progress.length === 0) {
      // 初始化进度
      await db.execute(
        'INSERT INTO achievement_progress (user_id, username) VALUES (?, ?)',
        [userId, username]
      );
      progress = [{ user_id: userId, alchemy_count: 0, fishing_count: 0, mining_count: 0, hunting_count: 0 }];
    }
    
    // 获取用户已完成的成就
    const [userAchievements] = await db.execute(
      `SELECT ua.achievement_id, ua.achieved_at, ua.progress, ua.is_completed, ua.claimed,
              a.name, a.description, a.icon, a.category, a.requirement_type, a.requirement_value, a.points
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = ?
       ORDER BY a.category, ua.is_completed DESC, ua.achieved_at DESC`,
      [userId]
    );
    
    // 按分类统计
    const stats = {
      alchemy: { total: 0, completed: 0, points: 0 },
      fishing: { total: 0, completed: 0, points: 0 },
      mining: { total: 0, completed: 0, points: 0 },
      hunting: { total: 0, completed: 0, points: 0 },
      combat: { total: 0, completed: 0, points: 0 },
      social: { total: 0, completed: 0, points: 0 }
    };
    
    const [allAchievements] = await db.execute(
      'SELECT category, points FROM achievements'
    );
    
    allAchievements.forEach(ach => {
      if (stats[ach.category]) {
        stats[ach.category].total++;
        stats.totalPoints = (stats.totalPoints || 0) + ach.points;
      }
    });
    
    userAchievements.forEach(ua => {
      if (stats[ua.category]) {
        stats[ua.category].points += ua.is_completed ? ua.points : 0;
        if (ua.is_completed) stats[ua.category].completed++;
      }
    });
    
    res.json({
      success: true,
      data: {
        progress: progress[0],
        achievements: userAchievements,
        stats: stats
      }
    });
  } catch (err) {
    console.error('Get my achievements error:', err);
    res.status(500).json({ success: false, message: '查询我的成就失败' });
  }
};

// 领取成就奖励
exports.claimReward = async (req, res) => {
  try {
    const { achievementId } = req.body;
    const userId = req.user.id;
    const username = req.user.username;
    
    // 检查成就是否存在且已完成
    const [achievements] = await db.execute(
      'SELECT * FROM achievements WHERE id = ?',
      [achievementId]
    );
    
    if (achievements.length === 0) {
      return res.status(404).json({ success: false, message: '成就不存在' });
    }
    
    const achievement = achievements[0];
    
    // 检查用户是否完成该成就
    const [userAchievements] = await db.execute(
      'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ? AND is_completed = 1',
      [userId, achievementId]
    );
    
    if (userAchievements.length === 0) {
      return res.status(400).json({ success: false, message: '成就未完成或不存在' });
    }
    
    const userAchievement = userAchievements[0];
    
    if (userAchievement.claimed) {
      return res.status(400).json({ success: false, message: '奖励已领取' });
    }
    
    // 发放奖励
    let message = `领取成就【${achievement.name}】奖励！`;
    
    if (achievement.reward_silver > 0) {
      await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [achievement.reward_silver, userId]);
      message += ` 银子 +${achievement.reward_silver}`;
    }
    
    if (achievement.reward_exp > 0) {
      await db.execute('UPDATE users SET exp = exp + ? WHERE id = ?', [achievement.reward_exp, userId]);
      message += ` 经验 +${achievement.reward_exp}`;
    }
    
    if (achievement.reward_item) {
      await db.execute(
        `INSERT INTO alchemy_items (name, owner, quantity, potency) VALUES (?, ?, 1, 0)
         ON DUPLICATE KEY UPDATE quantity = quantity + 1`,
        [achievement.reward_item, username]
      );
      message += ` 物品 ${achievement.reward_item}`;
    }
    
    // 标记为已领取
    await db.execute(
      'UPDATE user_achievements SET claimed = 1 WHERE id = ?',
      [userAchievement.id]
    );
    
    res.json({
      success: true,
      message: message,
      data: {
        silver: achievement.reward_silver,
        exp: achievement.reward_exp,
        item: achievement.reward_item
      }
    });
  } catch (err) {
    console.error('Claim reward error:', err);
    res.status(500).json({ success: false, message: '领取奖励失败' });
  }
};

// 更新成就进度（供其他模块调用）
exports.updateProgress = async (username, type, value = 1) => {
  try {
    const [users] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (users.length === 0) return;
    
    const userId = users[0].id;
    
    // 更新进度表
    let field = '';
    switch (type) {
      case 'alchemy': field = 'alchemy_count'; break;
      case 'fishing': field = 'fishing_count'; break;
      case 'mining': field = 'mining_count'; break;
      case 'hunting': field = 'hunting_count'; break;
      case 'legendary': field = 'legendary_count'; break;
      default: return;
    }
    
    await db.execute(
      `INSERT INTO achievement_progress (user_id, username, ${field}) 
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE ${field} = ${field} + ?`,
      [userId, username, value, value]
    );
    
    // 检查并更新成就
    await checkAndUnlockAchievements(userId, username);
  } catch (err) {
    console.error('Update achievement progress error:', err);
  }
};

// 检查并解锁成就
async function checkAndUnlockAchievements(userId, username) {
  try {
    // 获取用户进度
    const [progressRecords] = await db.execute(
      'SELECT * FROM achievement_progress WHERE user_id = ?',
      [userId]
    );
    
    if (progressRecords.length === 0) return;
    
    const progress = progressRecords[0];
    
    // 获取用户信息
    const [users] = await db.execute(
      'SELECT silver, neili, grade FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) return;
    const user = users[0];
    
    // 获取所有成就
    const [achievements] = await db.execute('SELECT * FROM achievements');
    
    for (const achievement of achievements) {
      // 检查是否已完成
      const [existing] = await db.execute(
        'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
        [userId, achievement.id]
      );
      
      if (existing.length > 0 && existing[0].is_completed) continue;
      
      // 检查进度
      let currentProgress = 0;
      
      switch (achievement.category) {
        case 'alchemy':
          currentProgress = progress.alchemy_count;
          break;
        case 'fishing':
          currentProgress = progress.fishing_count;
          if (achievement.requirement_type === 'rare') {
            currentProgress = progress.legendary_count;
          }
          break;
        case 'mining':
          currentProgress = progress.mining_count;
          if (achievement.requirement_type === 'rare') {
            currentProgress = progress.legendary_count;
          }
          break;
        case 'hunting':
          currentProgress = progress.hunting_count;
          if (achievement.requirement_type === 'rare') {
            currentProgress = progress.legendary_count;
          }
          break;
        case 'combat':
          if (achievement.requirement_type === 'level') {
            currentProgress = user.silver;
          }
          break;
        case 'social':
          if (achievement.requirement_type === 'level') {
            if (achievement.name.includes('等级')) {
              currentProgress = user.grade;
            } else if (achievement.name.includes('内力')) {
              currentProgress = user.neili;
            }
          }
          break;
      }
      
      // 如果进度达到要求
      if (currentProgress >= achievement.requirement_value) {
        if (existing.length > 0) {
          // 更新现有记录
          await db.execute(
            'UPDATE user_achievements SET progress = ?, is_completed = 1, achieved_at = NOW() WHERE id = ?',
            [currentProgress, existing[0].id]
          );
        } else {
          // 创建新记录
          await db.execute(
            `INSERT INTO user_achievements (user_id, username, achievement_id, progress, is_completed, achieved_at)
             VALUES (?, ?, ?, ?, 1, NOW())`,
            [userId, username, achievement.id, currentProgress]
          );
        }
      } else if (existing.length === 0) {
        // 创建进度记录
        await db.execute(
          `INSERT INTO user_achievements (user_id, username, achievement_id, progress, is_completed)
           VALUES (?, ?, ?, ?, 0)`,
          [userId, username, achievement.id, currentProgress]
        );
      } else {
        // 更新进度
        await db.execute(
          'UPDATE user_achievements SET progress = ? WHERE id = ?',
          [currentProgress, existing[0].id]
        );
      }
    }
  } catch (err) {
    console.error('Check achievements error:', err);
  }
}

// 导出供其他模块使用
module.exports.updateProgress = exports.updateProgress;
