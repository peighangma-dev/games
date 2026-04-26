const db = require('../config/db');

// 新增：综合排行榜（前端需要 totalScore 字段）
exports.getComprehensiveRanking = async (req, res) => {
  try {
    const [rankings] = await db.execute(
      `SELECT id, username, sect, grade, 
              (total_exp + silver + deposit + wugong + neili) as totalScore
       FROM users
       WHERE status != 'dead'
       ORDER BY totalScore DESC
       LIMIT 50`
    );
    res.json({ success: true, data: rankings });
  } catch (err) {
    console.error('Get comprehensive ranking error:', err);
    res.status(500).json({ success: false, message: '查询综合排行榜失败' });
  }
};

// 获取财富排行榜
exports.getWealthRanking = async (req, res) => {
  try {
    const [rankings] = await db.execute(
      `SELECT id, username, sect, silver, deposit, (silver + deposit) as value
       FROM users
       WHERE status != 'dead'
       ORDER BY (silver + deposit) DESC
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
      `SELECT id, username, sect, wugong, attack, defense, (wugong + attack + defense) as value
       FROM users
       WHERE status != 'dead'
       ORDER BY (wugong + attack + defense) DESC
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
      `SELECT id, username, sect, neili
       FROM users
       WHERE status != 'dead'
       ORDER BY neili DESC
       LIMIT 50`
    );
    
    res.json({
      success: true,
      data: rankings.map(r => ({ ...r, value: r.neili }))
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
      `SELECT id, username, sect, grade, total_exp
       FROM users
       WHERE status != 'dead'
       ORDER BY grade DESC, total_exp DESC
       LIMIT 50`
    );
    
    res.json({
      success: true,
      data: rankings.map(r => ({ ...r, value: r.grade }))
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
      `SELECT id, username, total_count, total_weight, rare_count, shenpin_count, total_value
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

// 新增：炼丹排行榜
exports.getAlchemyRanking = async (req, res) => {
  try {
    const [rankings] = await db.execute(
      `SELECT id, username, sect, (SELECT COUNT(*) FROM alchemy_records WHERE user_id = u.id) as craftCount
       FROM users u
       WHERE status != 'dead'
       ORDER BY craftCount DESC
       LIMIT 50`
    );
    res.json({ success: true, data: rankings });
  } catch (err) {
    console.error('Get alchemy ranking error:', err);
    res.status(500).json({ success: false, message: '查询炼丹排行榜失败' });
  }
};

// 新增：挖矿排行榜
exports.getMiningRanking = async (req, res) => {
  try {
    const [rankings] = await db.execute(
      `SELECT id, username, sect, 
              COALESCE((SELECT COUNT(*) FROM mining_records WHERE user_id = u.id), 0) as mineCount,
              COALESCE((SELECT COUNT(*) FROM mining_records WHERE user_id = u.id AND rarity = 'legendary'), 0) as legendaryCount
       FROM users u
       WHERE status != 'dead'
       ORDER BY mineCount DESC
       LIMIT 50`
    );
    res.json({ success: true, data: rankings });
  } catch (err) {
    console.error('Get mining ranking error:', err);
    res.status(500).json({ success: false, message: '查询挖矿排行榜失败' });
  }
};

// 新增：狩猎排行榜
exports.getHuntingRanking = async (req, res) => {
  try {
    const [rankings] = await db.execute(
      `SELECT id, username, sect,
              COALESCE((SELECT COUNT(*) FROM hunting_records WHERE user_id = u.id), 0) as huntCount,
              COALESCE((SELECT COUNT(*) FROM hunting_records WHERE user_id = u.id AND rarity = 'legendary'), 0) as legendaryCount
       FROM users u
       WHERE status != 'dead'
       ORDER BY huntCount DESC
       LIMIT 50`
    );
    res.json({ success: true, data: rankings });
  } catch (err) {
    console.error('Get hunting ranking error:', err);
    res.status(500).json({ success: false, message: '查询狩猎排行榜失败' });
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
