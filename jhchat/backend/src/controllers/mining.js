const db = require('../config/db');
const achievement = require('./achievement');
const quest = require('./quest');

// 挖矿配置
const MINING_CONFIG = {
  cooldownMinutes: 60, // 挖矿冷却时间（分钟）
  minTime: 5000, // 最少挖矿时间（毫秒）
  maxTime: 10000 // 最多挖矿时间（毫秒）
};

// 挖矿物品概率配置（累计概率）
const MINING_RARITY = {
  legendary: { min: 0, max: 3, chance: 3 },    // 0-3%
  epic: { min: 3, max: 10, chance: 7 },        // 3-10%
  rare: { min: 10, max: 25, chance: 15 },      // 10-25%
  uncommon: { min: 25, max: 45, chance: 20 },  // 25-45%
  common: { min: 45, max: 100, chance: 55 }    // 45-100%
};

// 开始挖矿
exports.startMining = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    
    // 检查是否有进行中的挖矿
    const [states] = await db.execute(
      'SELECT * FROM mining_states WHERE user_id = ? AND is_active = 1',
      [userId]
    );
    
    if (states.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '您已经在挖矿中，请先完成当前挖矿！' 
      });
    }
    
    // 检查冷却时间
    const [lastRecords] = await db.execute(
      'SELECT * FROM mining_records WHERE user_id = ? ORDER BY mined_at DESC LIMIT 1',
      [userId]
    );
    
    if (lastRecords.length > 0) {
      const lastTime = new Date(lastRecords[0].mined_at);
      const now = new Date();
      const diffMinutes = (now - lastTime) / 1000 / 60;
      
      if (diffMinutes < MINING_CONFIG.cooldownMinutes) {
        const remainMinutes = Math.ceil(MINING_CONFIG.cooldownMinutes - diffMinutes);
        return res.status(400).json({ 
          success: false, 
          message: `挖矿需要冷却${MINING_CONFIG.cooldownMinutes}分钟，请${remainMinutes}分钟后再试！` 
        });
      }
    }
    
    // 检查银两（挖矿需要工具，消耗 20 两）
    const [users] = await db.execute('SELECT silver FROM users WHERE id = ?', [userId]);
    if (users[0].silver < 20) {
      return res.status(400).json({ 
        success: false, 
        message: '挖矿需要 20 两银子购买工具，您的银两不足！' 
      });
    }
    
    // 扣除工具费用
    await db.execute('UPDATE users SET silver = silver - 20 WHERE id = ?', [userId]);
    
    // 创建挖矿状态
    await db.execute(
      `INSERT INTO mining_states (user_id, username, is_active, started_at, last_mined_at, cooldown_minutes) 
       VALUES (?, ?, 1, NOW(), NOW(), ?)`,
      [userId, username, MINING_CONFIG.cooldownMinutes]
    );
    
    res.json({
      success: true,
      message: '挖矿开始！请耐心等待挖掘完成...',
      minTime: MINING_CONFIG.minTime,
      maxTime: MINING_CONFIG.maxTime
    });
  } catch (err) {
    console.error('Start mining error:', err);
    res.status(500).json({ success: false, message: '开始挖矿失败' });
  }
};

// 完成挖矿
exports.finishMining = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    
    // 检查是否有进行中的挖矿
    const [states] = await db.execute(
      'SELECT * FROM mining_states WHERE user_id = ? AND is_active = 1',
      [userId]
    );
    
    if (states.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '您没有在挖矿，请先开始挖矿！' 
      });
    }
    
    // 更新挖矿状态为 inactive
    await db.execute(
      'UPDATE mining_states SET is_active = 0 WHERE user_id = ? AND is_active = 1',
      [userId]
    );
    
    // 随机确定稀有度
    const rand = Math.random() * 100;
    let rarity = 'common';
    
    if (rand < MINING_RARITY.legendary.max) rarity = 'legendary';
    else if (rand < MINING_RARITY.epic.max) rarity = 'epic';
    else if (rand < MINING_RARITY.rare.max) rarity = 'rare';
    else if (rand < MINING_RARITY.uncommon.max) rarity = 'uncommon';
    
    // 根据稀有度获取物品
    const [items] = await db.execute(
      'SELECT * FROM mining_items WHERE rarities = ? ORDER BY RAND() LIMIT 1',
      [rarity]
    );
    
    if (items.length === 0) {
      items.push({
        item_name: '石头',
        item_type: '材料',
        effect_neili: 0,
        effect_tili: 0,
        silver_value: 10,
        rarities: 'common',
        image_file: 'ore_common.gif'
      });
    }
    
    const item = items[0];
    
    // 记录挖矿结果
    await db.execute(
      `INSERT INTO mining_records (user_id, username, item_name, item_type, effect_value, silver_reward, rarities) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, username, item.item_name, item.item_type, item.effect_neili || item.silver_value, item.silver_value, item.rarities]
    );
    
    // 更新成就进度
    await achievement.updateProgress(username, 'mining', 1);
    if (item.rarities === 'legendary') {
      await achievement.updateProgress(username, 'legendary', 1);
    }
    
    // 更新任务进度（挖矿类任务）
    await quest.updateQuestProgress(username, 'gather', item.item_name, 1);
    
    // 添加物品到药材库存
    await db.execute(
      `INSERT INTO alchemy_items (name, owner, quantity, potency) 
       VALUES (?, ?, 1, 0)
       ON DUPLICATE KEY UPDATE quantity = quantity + 1`,
      [item.item_name, username]
    );
    
    let message = `恭喜！您挖到了【${item.item_name}】！`;
    
    if (item.item_type === '药材') {
      message += `已放入药材仓库，可用于炼丹！`;
    } else {
      message += `可以卖得${item.silver_value}两银子！`;
      await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [item.silver_value, userId]);
    }
    
    res.json({
      success: true,
      message: message,
      data: {
        item_name: item.item_name,
        item_type: item.item_type,
        rarities: item.rarities,
        image: item.image_file,
        effect_neili: item.effect_neili,
        effect_tili: item.effect_tili,
        silver_reward: item.silver_value
      }
    });
  } catch (err) {
    console.error('Finish mining error:', err);
    res.status(500).json({ success: false, message: '完成挖矿失败' });
  }
};

// 获取挖矿记录
exports.getMiningRecords = async (req, res) => {
  try {
    const username = req.user.username;
    const [records] = await db.execute(
      'SELECT * FROM mining_records WHERE username = ? ORDER BY mined_at DESC LIMIT 20',
      [username]
    );
    
    res.json({
      success: true,
      data: records
    });
  } catch (err) {
    console.error('Get mining records error:', err);
    res.status(500).json({ success: false, message: '查询挖矿记录失败' });
  }
};

// 获取挖矿状态
exports.getMiningStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    
    // 检查是否有进行中的挖矿
    const [states] = await db.execute(
      'SELECT * FROM mining_states WHERE user_id = ? AND is_active = 1',
      [userId]
    );
    
    if (states.length > 0) {
      return res.json({
        success: true,
        data: {
          isMining: true,
          minTime: MINING_CONFIG.minTime,
          maxTime: MINING_CONFIG.maxTime
        }
      });
    }
    
    // 检查冷却时间
    const [lastRecords] = await db.execute(
      'SELECT * FROM mining_records WHERE user_id = ? ORDER BY mined_at DESC LIMIT 1',
      [userId]
    );
    
    let cooldownRemaining = 0;
    if (lastRecords.length > 0) {
      const lastTime = new Date(lastRecords[0].mined_at);
      const now = new Date();
      const diffMinutes = (now - lastTime) / 1000 / 60;
      
      if (diffMinutes < MINING_CONFIG.cooldownMinutes) {
        cooldownRemaining = Math.ceil(MINING_CONFIG.cooldownMinutes - diffMinutes);
      }
    }
    
    res.json({
      success: true,
      data: {
        isMining: false,
        cooldownRemaining: cooldownRemaining
      }
    });
  } catch (err) {
    console.error('Get mining status error:', err);
    res.status(500).json({ success: false, message: '查询挖矿状态失败' });
  }
};
