const db = require('../config/db');
const achievement = require('./achievement');
const quest = require('./quest');

// 挖矿配置
const MINING_CONFIG = {
  cooldownMinutes: 60, // 挖矿冷却时间（分钟）
  minTime: 5000, // 最少挖矿时间（毫秒）
  maxTime: 10000 // 最多挖矿时间（毫秒）
};

// 挖矿基础概率配置（未考虑运势）
const MINING_BASE_RARITY = {
  legendary: { threshold: 3 },    // 0-3%
  epic: { threshold: 10 },        // 3-10%
  rare: { threshold: 25 },        // 10-25%
  uncommon: { threshold: 45 },    // 25-45%
  common: { threshold: 65 },      // 45-65%
  trash: { threshold: 100 }       // 65-100% (35% 基础概率)
};

/**
 * 获取用户今日运势值（0-100）
 * 运势等级映射：great_luck:90-100, medium_luck:60-75, small_luck:45-59, small_misfortune:25-44, misfortune:0-24
 */
async function getTodayFortune(username) {
  try {
    const [fortunes] = await db.execute(
      'SELECT fortune_type FROM user_fortunes WHERE username = ? AND fortune_date = CURDATE()',
      [username]
    );
    
    if (fortunes.length === 0) {
      return 50; // 默认中等运势
    }
    
    const fortuneType = fortunes[0].fortune_type;
    const fortuneMap = {
      'great_luck': 95,           // 大吉
      'medium_luck': 67.5,        // 中吉
      'small_luck': 52,           // 小吉
      'small_misfortune': 34.5,   // 小凶
      'misfortune': 12            // 大凶
    };
    
    return fortuneMap[fortuneType] || 50;
  } catch (err) {
    console.error('Get fortune error:', err.message);
    return 50;
  }
}

/**
 * 根据运势计算调整后的概率阈值
 * 公式：fortune_bonus = (fortune_value - 50) * 0.35
 * 运势越好，垃圾物品概率越低，好东西概率越高
 * 运势越差，垃圾物品概率越高，好东西概率越低
 */
function getAdjustedRarity(fortuneValue) {
  const fortune_bonus = (fortuneValue - 50) * 0.35;  // 范围：-17.5 到 +17.5
  
  const adjusted = {
    legendary: { threshold: Math.max(1, MINING_BASE_RARITY.legendary.threshold - fortune_bonus) },
    epic: { threshold: Math.max(MINING_BASE_RARITY.legendary.threshold + 1, MINING_BASE_RARITY.epic.threshold - fortune_bonus * 0.8) },
    rare: { threshold: Math.max(MINING_BASE_RARITY.epic.threshold + 1, MINING_BASE_RARITY.rare.threshold - fortune_bonus * 0.6) },
    uncommon: { threshold: Math.max(MINING_BASE_RARITY.rare.threshold + 1, MINING_BASE_RARITY.uncommon.threshold - fortune_bonus * 0.4) },
    common: { threshold: Math.max(MINING_BASE_RARITY.uncommon.threshold + 1, MINING_BASE_RARITY.common.threshold - fortune_bonus * 0.3) },
    trash: { threshold: 100 }
  };
  
  return adjusted;
}

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
    
    // 获取今日运势
    const fortuneValue = await getTodayFortune(username);
    const adjustedRarity = getAdjustedRarity(fortuneValue);
    
    // 随机确定稀有度（基于运势调整后的概率）
    const rand = Math.random() * 100;
    let rarity = 'common';
    
    if (rand < adjustedRarity.legendary.threshold) rarity = 'legendary';
    else if (rand < adjustedRarity.epic.threshold) rarity = 'epic';
    else if (rand < adjustedRarity.rare.threshold) rarity = 'rare';
    else if (rand < adjustedRarity.uncommon.threshold) rarity = 'uncommon';
    else if (rand < adjustedRarity.common.threshold) rarity = 'common';
    else rarity = 'trash'; // 垃圾物品
    
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
    
    let message = '';
    
    // 垃圾物品不计入物品库，只记录
    if (item.item_type === '杂物') {
      message = `唉！您挖到了【${item.item_name}】，这是一无用的废物，已丢到一旁。`;
    } else {
      // 添加物品到药材库存
      await db.execute(
        `INSERT INTO alchemy_items (name, owner, quantity, potency) 
         VALUES (?, ?, 1, 0)
         ON DUPLICATE KEY UPDATE quantity = quantity + 1`,
        [item.item_name, username]
      );
      
      if (item.item_type === '药材') {
        message = `恭喜！您挖到了【${item.item_name}】！已放入药材仓库，可用于炼丹！`;
      } else {
        message = `恭喜！您挖到了【${item.item_name}】！可以卖得${item.silver_value}两银子！`;
        await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [item.silver_value, userId]);
      }
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
