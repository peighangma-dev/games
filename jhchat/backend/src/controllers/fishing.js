const db = require('../config/db');
const achievement = require('./achievement');
const quest = require('./quest');
const ranking = require('./ranking');

// 钓鱼配置
const FISHING_CONFIG = {
  cooldownMinutes: 30, // 钓鱼冷却时间（分钟）
  minTime: 3000, // 最少钓鱼时间（毫秒）
  maxTime: 8000  // 最多钓鱼时间（毫秒）
};

// 钓鱼基础概率配置（未考虑运势）
const FISH_BASE_RARITY = {
  legendary: { threshold: 5 },    // 0-5%
  epic: { threshold: 15 },        // 5-15%
  rare: { threshold: 30 },        // 15-30%
  uncommon: { threshold: 50 },    // 30-50%
  common: { threshold: 70 },      // 50-70%
  trash: { threshold: 100 }       // 70-100% (30% 基础概率)
};

/**
 * 获取用户今日运势值（0-100）
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
 */
function getAdjustedRarity(fortuneValue) {
  const fortune_bonus = (fortuneValue - 50) * 0.35;  // 范围：-17.5 到 +17.5
  
  const adjusted = {
    legendary: { threshold: Math.max(1, FISH_BASE_RARITY.legendary.threshold - fortune_bonus) },
    epic: { threshold: Math.max(FISH_BASE_RARITY.legendary.threshold + 1, FISH_BASE_RARITY.epic.threshold - fortune_bonus * 0.8) },
    rare: { threshold: Math.max(FISH_BASE_RARITY.epic.threshold + 1, FISH_BASE_RARITY.rare.threshold - fortune_bonus * 0.6) },
    uncommon: { threshold: Math.max(FISH_BASE_RARITY.rare.threshold + 1, FISH_BASE_RARITY.uncommon.threshold - fortune_bonus * 0.4) },
    common: { threshold: Math.max(FISH_BASE_RARITY.uncommon.threshold + 1, FISH_BASE_RARITY.common.threshold - fortune_bonus * 0.3) },
    trash: { threshold: 100 }
  };
  
  return adjusted;
}

// 开始钓鱼
exports.startFishing = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    
    // 检查是否有进行中的钓鱼
    const [states] = await db.execute(
      'SELECT * FROM fishing_states WHERE user_id = ? AND is_active = 1',
      [userId]
    );
    
    if (states.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '您已经在钓鱼中，请先完成当前钓鱼！' 
      });
    }
    
    // 检查冷却时间
    const [lastRecords] = await db.execute(
      'SELECT * FROM fishing_records WHERE user_id = ? ORDER BY fished_at DESC LIMIT 1',
      [userId]
    );
    
    if (lastRecords.length > 0) {
      const lastTime = new Date(lastRecords[0].fished_at);
      const now = new Date();
      const diffMinutes = (now - lastTime) / 1000 / 60;
      
      if (diffMinutes < FISHING_CONFIG.cooldownMinutes) {
        const remainMinutes = Math.ceil(FISHING_CONFIG.cooldownMinutes - diffMinutes);
        return res.status(400).json({ 
          success: false, 
          message: `钓鱼需要冷却${FISHING_CONFIG.cooldownMinutes}分钟，请${remainMinutes}分钟后再试！` 
        });
      }
    }
    
    // 检查银两（钓鱼需要鱼饵，消耗 10 两）
    const [users] = await db.execute('SELECT silver FROM users WHERE id = ?', [userId]);
    if (users[0].silver < 10) {
      return res.status(400).json({ 
        success: false, 
        message: '钓鱼需要 10 两银子购买鱼饵，您的银两不足！' 
      });
    }
    
    // 扣除鱼饵费用
    await db.execute('UPDATE users SET silver = silver - 10 WHERE id = ?', [userId]);
    
    // 创建钓鱼状态
    await db.execute(
      `INSERT INTO fishing_states (user_id, username, is_active, started_at, last_fished_at, cooldown_minutes) 
       VALUES (?, ?, 1, NOW(), NOW(), ?)`,
      [userId, username, FISHING_CONFIG.cooldownMinutes]
    );
    
    res.json({
      success: true,
      message: '钓鱼开始！请耐心等待鱼儿上钩...',
      minTime: FISHING_CONFIG.minTime,
      maxTime: FISHING_CONFIG.maxTime
    });
  } catch (err) {
    console.error('Start fishing error:', err);
    res.status(500).json({ success: false, message: '开始钓鱼失败' });
  }
};

// 完成钓鱼
exports.finishFishing = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    
    // 检查是否有进行中的钓鱼
    const [states] = await db.execute(
      'SELECT * FROM fishing_states WHERE user_id = ? AND is_active = 1',
      [userId]
    );
    
    if (states.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '您没有在进行钓鱼，请先开始钓鱼！' 
      });
    }
    
    // 更新钓鱼状态为 inactive
    await db.execute(
      'UPDATE fishing_states SET is_active = 0 WHERE user_id = ? AND is_active = 1',
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
      'SELECT * FROM fishing_items WHERE rarities = ? ORDER BY RAND() LIMIT 1',
      [rarity]
    );
    
    if (items.length === 0) {
      //  fallback，返回普通鲫鱼
      items.push({
        item_name: '鲫鱼',
        item_type: '食材',
        effect_neili: 0,
        effect_tili: 0,
        silver_value: 100,
        rarities: 'common',
        image_file: 'fish_common.gif'
      });
    }
    
    const item = items[0];
    
    // 记录钓鱼结果
    await db.execute(
      `INSERT INTO fishing_records (user_id, username, item_name, item_type, effect_value, silver_reward, rarities) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, username, item.item_name, item.item_type, item.effect_neili || item.silver_value, item.silver_value, item.rarities]
    );
    
    // 更新成就进度
    await achievement.updateProgress(username, 'fishing', 1);
    if (item.rarities === 'legendary') {
      await achievement.updateProgress(username, 'legendary', 1);
    }
    
    // 更新钓鱼排行榜
    await ranking.updateFishingRecord(username, item.item_name, 0, item.silver_value, item.rarities);
    
    // 更新任务进度（钓鱼类任务）
    if (item.item_type === '药材') {
      await quest.updateQuestProgress(username, 'gather', item.item_name, 1);
    }
    
    // 根据物品类型添加效果
    let message = '';
    
    // 垃圾物品不计入物品库，只记录
    if (item.item_type === '杂物') {
      message = `唉！您钓到了【${item.item_name}】，这是一无用的废物，已丢回水中。`;
    } else {
      // 更新成就进度
      await achievement.updateProgress(username, 'fishing', 1);
      if (item.rarities === 'legendary') {
        await achievement.updateProgress(username, 'legendary', 1);
      }
      
      // 更新钓鱼排行榜
      await ranking.updateFishingRecord(username, item.item_name, 0, item.silver_value, item.rarities);
      
      // 更新任务进度（钓鱼类任务）
      if (item.item_type === '药材') {
        await quest.updateQuestProgress(username, 'gather', item.item_name, 1);
      }
      
      if (item.item_type === '药品') {
        await db.execute(
          'UPDATE users SET neili = neili + ?, tili = tili + ? WHERE id = ?',
          [item.effect_neili, item.effect_tili, userId]
        );
        message = `恭喜！您钓到了【${item.item_name}】！食用后内力 +${item.effect_neili}，体力 +${item.effect_tili}！`;
        
        // 添加到物品栏
        await db.execute(
          `INSERT INTO items (name, owner, type, neili_bonus, tili_bonus, quantity, is_equipped) 
           VALUES (?, ?, 'medicine', ?, ?, 1, 0)`,
          [item.item_name, username, item.effect_neili, item.effect_tili]
        );
      } else if (item.item_type === '食材') {
        message = `恭喜！您钓到了【${item.item_name}】！可以卖得${item.silver_value}两银子！`;
        await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [item.silver_value, userId]);
      } else if (item.item_type === '暗器') {
        message = `恭喜！您钓到了【${item.item_name}】！获得了强力暗器！`;
        await db.execute(
          `INSERT INTO items (name, owner, type, attack, tili_bonus, quantity, is_equipped) 
           VALUES (?, ?, 'weapon', ?, ?, 1, 0)`,
          [item.item_name, username, Math.abs(item.effect_neili), Math.abs(item.effect_tili)]
        );
      } else {
        message = `恭喜！您钓到了【${item.item_name}】！可以卖得${item.silver_value}两银子！`;
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
    console.error('Finish fishing error:', err);
    res.status(500).json({ success: false, message: '完成钓鱼失败' });
  }
};

// 获取钓鱼记录
exports.getFishingRecords = async (req, res) => {
  try {
    const username = req.user.username;
    const [records] = await db.execute(
      'SELECT * FROM fishing_records WHERE username = ? ORDER BY fished_at DESC LIMIT 20',
      [username]
    );
    
    res.json({
      success: true,
      data: records
    });
  } catch (err) {
    console.error('Get fishing records error:', err);
    res.status(500).json({ success: false, message: '查询钓鱼记录失败' });
  }
};

// 获取钓鱼状态
exports.getFishingStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    
    // 检查是否有进行中的钓鱼
    const [states] = await db.execute(
      'SELECT * FROM fishing_states WHERE user_id = ? AND is_active = 1',
      [userId]
    );
    
    if (states.length > 0) {
      return res.json({
        success: true,
        data: {
          isFishing: true,
          minTime: FISHING_CONFIG.minTime,
          maxTime: FISHING_CONFIG.maxTime
        }
      });
    }
    
    // 检查冷却时间
    const [lastRecords] = await db.execute(
      'SELECT * FROM fishing_records WHERE user_id = ? ORDER BY fished_at DESC LIMIT 1',
      [userId]
    );
    
    let cooldownRemaining = 0;
    if (lastRecords.length > 0) {
      const lastTime = new Date(lastRecords[0].fished_at);
      const now = new Date();
      const diffMinutes = (now - lastTime) / 1000 / 60;
      
      if (diffMinutes < FISHING_CONFIG.cooldownMinutes) {
        cooldownRemaining = Math.ceil(FISHING_CONFIG.cooldownMinutes - diffMinutes);
      }
    }
    
    res.json({
      success: true,
      data: {
        isFishing: false,
        cooldownRemaining: cooldownRemaining
      }
    });
  } catch (err) {
    console.error('Get fishing status error:', err);
    res.status(500).json({ success: false, message: '查询钓鱼状态失败' });
  }
};
