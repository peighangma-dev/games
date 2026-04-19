const db = require('../config/db');

// 获取财富排行榜
exports.getWealthRanking = async (req, res) => {
  try {
    const [rankings] = await db.execute(
      `SELECT username, silver + deposit as total_wealth, silver, deposit, grade
       FROM users
       ORDER BY total_wealth DESC
       LIMIT 50`
    );
    
    res.json({
      success: true,
      data: rankings
    });
  } catch (err) {
    console.error('Get wealth ranking error:', err);
    res.status(500).json({ success: false, message: '查询财富排行榜失败' });
  }
};

// 获取武力排行榜
exports.getPowerRanking = async (req, res) => {
  try {
    const [rankings] = await db.execute(
      `SELECT username, wugong, attack, defense, grade
       FROM users
       ORDER BY wugong DESC, attack DESC
       LIMIT 50`
    );
    
    res.json({
      success: true,
      data: rankings
    });
  } catch (err) {
    console.error('Get power ranking error:', err);
    res.status(500).json({ success: false, message: '查询武力排行榜失败' });
  }
};

// 获取内力排行榜
exports.getNeiliRanking = async (req, res) => {
  try {
    const [rankings] = await db.execute(
      `SELECT username, neili, grade
       FROM users
       ORDER BY neili DESC
       LIMIT 50`
    );
    
    res.json({
      success: true,
      data: rankings
    });
  } catch (err) {
    console.error('Get neili ranking error:', err);
    res.status(500).json({ success: false, message: '查询内力排行榜失败' });
  }
};

// 获取等级排行榜
exports.getLevelRanking = async (req, res) => {
  try {
    const [rankings] = await db.execute(
      `SELECT username, grade, all_value
       FROM users
       ORDER BY grade DESC, all_value DESC
       LIMIT 50`
    );
    
    res.json({
      success: true,
      data: rankings
    });
  } catch (err) {
    console.error('Get level ranking error:', err);
    res.status(500).json({ success: false, message: '查询等级排行榜失败' });
  }
};

// 获取钓鱼排行榜
exports.getFishingRanking = async (req, res) => {
  try {
    const [rankings] = await db.execute(
      `SELECT username, total_count, total_weight, rare_count, shenpin_count, total_value
       FROM fishing_ranking
       ORDER BY total_value DESC
       LIMIT 50`
    );
    
    res.json({
      success: true,
      data: rankings
    });
  } catch (err) {
    console.error('Get fishing ranking error:', err);
    res.status(500).json({ success: false, message: '查询排行榜失败' });
  }
};

// 更新钓鱼记录（供钓鱼控制器调用）
exports.updateFishingRecord = async (username, item, weight, value, rarity) => {
  try {
    const [users] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (users.length === 0) return;
    
    const userId = users[0].id;
    
    // 更新或创建排行榜记录
    const isRare = rarity === 'rare' || rarity === 'epic' || rarity === 'legendary';
    const isShenpin = rarity === 'legendary';
    
    await db.execute(
      `INSERT INTO fishing_ranking (user_id, username, total_count, total_weight, rare_count, shenpin_count, total_value)
       VALUES (?, ?, 1, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         total_count = total_count + 1,
         total_weight = total_weight + ?,
         rare_count = rare_count + ?,
         shenpin_count = shenpin_count + ?,
         total_value = total_value + ?`,
      [userId, weight, isRare ? 1 : 0, isShenpin ? 1 : 0, value, weight, isRare ? 1 : 0, isShenpin ? 1 : 0, value]
    );
  } catch (err) {
    console.error('Update fishing record error:', err);
  }
};
