const db = require('../config/db');
const achievement = require('./achievement');
const quest = require('./quest');

// 狩猎配置
const HUNTING_CONFIG = {
  workCooldownMinutes: 30, // 打工冷却时间（分钟）
  huntCooldownMinutes: 120, // 打猎冷却时间（分钟）
  workRewardSilver: 50, // 打工奖励银子
  workRewardFood: 100, // 打工奖励干粮
  huntRewardSilver: 100000, // 打猎奖励银子（10 万两）
  huntFoodCost: 200 // 打猎消耗干粮
};

// 打工职业
const WORK_JOBS = [
  { name: '酒楼小二', exp: 100, silver: 50 },
  { name: '码头苦力', exp: 150, silver: 80 },
  { name: '铁匠学徒', exp: 200, silver: 100 },
  { name: '药铺伙计', exp: 180, silver: 90 },
  { name: '镖局趟子手', exp: 250, silver: 120 }
];

// 打猎物品概率
const HUNT_RARITY = {
  legendary: { min: 0, max: 3, chance: 3 },
  epic: { min: 3, max: 10, chance: 7 },
  rare: { min: 10, max: 30, chance: 20 },
  uncommon: { min: 30, max: 60, chance: 30 },
  common: { min: 60, max: 100, chance: 40 }
};

// 开始打工
exports.startWork = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    
    // 检查是否有进行中的打工
    const [states] = await db.execute(
      'SELECT * FROM hunting_states WHERE user_id = ? AND is_active = 1 AND type = "work"',
      [userId]
    );
    
    if (states.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '您已经在打工中，请先完成当前打工！' 
      });
    }
    
    // 检查冷却时间
    const [lastRecords] = await db.execute(
      'SELECT * FROM hunting_records WHERE user_id = ? AND type = "work" ORDER BY completed_at DESC LIMIT 1',
      [userId]
    );
    
    if (lastRecords.length > 0) {
      const lastTime = new Date(lastRecords[0].completed_at);
      const now = new Date();
      const diffMinutes = (now - lastTime) / 1000 / 60;
      
      if (diffMinutes < HUNTING_CONFIG.workCooldownMinutes) {
        const remainMinutes = Math.ceil(HUNTING_CONFIG.workCooldownMinutes - diffMinutes);
        return res.status(400).json({ 
          success: false, 
          message: `打工需要冷却${HUNTING_CONFIG.workCooldownMinutes}分钟，请${remainMinutes}分钟后再试！` 
        });
      }
    }
    
    // 随机选择职业
    const job = WORK_JOBS[Math.floor(Math.random() * WORK_JOBS.length)];
    
    // 创建打工状态
    await db.execute(
      `INSERT INTO hunting_states (user_id, username, type, job_name, is_active, started_at, last_completed_at, cooldown_minutes) 
       VALUES (?, ?, 'work', ?, 1, NOW(), NOW(), ?)`,
      [userId, username, job.name, HUNTING_CONFIG.workCooldownMinutes]
    );
    
    res.json({
      success: true,
      message: `开始打工：${job.name}，预计获得${job.exp}点经验，${job.silver}两银子`,
      job: job,
      duration: 3000 // 打工时间 3 秒
    });
  } catch (err) {
    console.error('Start work error:', err);
    res.status(500).json({ success: false, message: '开始打工失败' });
  }
};

// 完成打工
exports.finishWork = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    
    // 检查是否有进行中的打工
    const [states] = await db.execute(
      'SELECT * FROM hunting_states WHERE user_id = ? AND is_active = 1 AND type = "work"',
      [userId]
    );
    
    if (states.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '您没有在打工，请先开始打工！' 
      });
    }
    
    const state = states[0];
    
    // 更新状态为 non-active
    await db.execute(
      'UPDATE hunting_states SET is_active = 0 WHERE user_id = ? AND type = "work"',
      [userId]
    );
    
    // 计算奖励
    const job = WORK_JOBS.find(j => j.name === state.job_name) || WORK_JOBS[0];
    
    // 更新用户属性
    await db.execute(
      'UPDATE users SET silver = silver + ?, neili = neili + ?, tili = tili + ?, exp = exp + ? WHERE id = ?',
      [job.silver, 50, 50, job.exp, userId]
    );
    
    // 记录
    await db.execute(
      `INSERT INTO hunting_records (user_id, username, type, job_name, reward_silver, reward_exp, is_success) 
       VALUES (?, ?, 'work', ?, ?, ?, 1)`,
      [userId, username, state.job_name, job.silver, job.exp]
    );
    
    res.json({
      success: true,
      message: `打工完成！获得${job.silver}两银子，${job.exp}点经验，内力 +50，体力 +50`,
      reward: {
        silver: job.silver,
        exp: job.exp,
        neili: 50,
        tili: 50
      }
    });
  } catch (err) {
    console.error('Finish work error:', err);
    res.status(500).json({ success: false, message: '完成打工失败' });
  }
};

// 开始打猎
exports.startHunt = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    
    // 检查是否有进行中的打猎
    const [states] = await db.execute(
      'SELECT * FROM hunting_states WHERE user_id = ? AND is_active = 1 AND type = "hunt"',
      [userId]
    );
    
    if (states.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '您已经在打猎中，请先完成当前打猎！' 
      });
    }
    
    // 检查冷却时间
    const [lastRecords] = await db.execute(
      'SELECT * FROM hunting_records WHERE user_id = ? AND type = "hunt" ORDER BY completed_at DESC LIMIT 1',
      [userId]
    );
    
    if (lastRecords.length > 0) {
      const lastTime = new Date(lastRecords[0].completed_at);
      const now = new Date();
      const diffMinutes = (now - lastTime) / 1000 / 60;
      
      if (diffMinutes < HUNTING_CONFIG.huntCooldownMinutes) {
        const remainMinutes = Math.ceil(HUNTING_CONFIG.huntCooldownMinutes - diffMinutes);
        return res.status(400).json({ 
          success: false, 
          message: `打猎需要冷却${HUNTING_CONFIG.huntCooldownMinutes}分钟，请${remainMinutes}分钟后再试！` 
        });
      }
    }
    
    // 检查干粮
    const [users] = await db.execute('SELECT tili FROM users WHERE id = ?', [userId]);
    if (users[0].tili < HUNTING_CONFIG.huntFoodCost) {
      return res.status(400).json({ 
        success: false, 
        message: `打猎需要${HUNTING_CONFIG.huntFoodCost}点体力，您的体力不足！` 
      });
    }
    
    // 创建打猎状态
    await db.execute(
      `INSERT INTO hunting_states (user_id, username, type, is_active, started_at, last_completed_at, cooldown_minutes) 
       VALUES (?, ?, 'hunt', 1, NOW(), NOW(), ?)`,
      [userId, username, HUNTING_CONFIG.huntCooldownMinutes]
    );
    
    res.json({
      success: true,
      message: '开始打猎！请耐心等待...',
      duration: 5000 // 打猎时间 5 秒
    });
  } catch (err) {
    console.error('Start hunt error:', err);
    res.status(500).json({ success: false, message: '开始打猎失败' });
  }
};

// 完成打猎
exports.finishHunt = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    
    // 检查是否有进行中的打猎
    const [states] = await db.execute(
      'SELECT * FROM hunting_states WHERE user_id = ? AND is_active = 1 AND type = "hunt"',
      [userId]
    );
    
    if (states.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '您没有在打猎，请先开始打猎！' 
      });
    }
    
    // 扣减体力
    await db.execute(
      'UPDATE users SET tili = tili - ? WHERE id = ?',
      [HUNTING_CONFIG.huntFoodCost, userId]
    );
    
    // 更新状态
    await db.execute(
      'UPDATE hunting_states SET is_active = 0 WHERE user_id = ? AND type = "hunt"',
      [userId]
    );
    
    // 随机确定稀有度
    const rand = Math.random() * 100;
    let rarity = 'common';
    
    if (rand < HUNT_RARITY.legendary.max) rarity = 'legendary';
    else if (rand < HUNT_RARITY.epic.max) rarity = 'epic';
    else if (rand < HUNT_RARITY.rare.max) rarity = 'rare';
    else if (rand < HUNT_RARITY.uncommon.max) rarity = 'uncommon';
    
    // 根据稀有度获取物品
    const [items] = await db.execute(
      'SELECT * FROM hunting_items WHERE rarities = ? ORDER BY RAND() LIMIT 1',
      [rarity]
    );
    
    if (items.length === 0) {
      // fallback
      items.push({
        item_name: '空手而归',
        item_type: '无',
        effect_neili: 0,
        effect_tili: 0,
        silver_value: 0,
        rarities: 'common',
        image_file: ''
      });
    }
    
    const item = items[0];
    const isSuccess = item.item_name !== '空手而归';
    
    // 记录打猎结果
    await db.execute(
      `INSERT INTO hunting_records (user_id, username, type, item_name, item_type, reward_silver, reward_exp, is_success, rarities) 
       VALUES (?, ?, 'hunt', ?, ?, ?, ?, ?, ?)`,
      [userId, username, item.item_name, item.item_type, item.silver_value, item.effect_neili || 0, isSuccess ? 1 : 0, rarity]
    );
    
    // 更新成就进度
    await achievement.updateProgress(username, 'hunting', 1);
    if (item.rarities === 'legendary') {
      await achievement.updateProgress(username, 'legendary', 1);
    }
    
    // 更新任务进度（狩猎类任务）
    if (isSuccess && item.item_type === '药材') {
      await quest.updateQuestProgress(username, 'gather', item.item_name, 1);
    } else if (isSuccess && (item.item_name === '兽肉' || item.item_name === '皮')) {
      await quest.updateQuestProgress(username, 'gather', item.item_name, 1);
    }
    
    let message = '';
    let rewardSilver = 0;
    
    if (isSuccess) {
      // 添加物品到药材仓库
      if (item.item_type === '药材') {
        await db.execute(
          `INSERT INTO alchemy_items (name, owner, quantity, potency) 
           VALUES (?, ?, 1, 0)
           ON DUPLICATE KEY UPDATE quantity = quantity + 1`,
          [item.item_name, username]
        );
        message = `恭喜！您成功捕获了【${item.item_name}】！已放入药材仓库。`;
        rewardSilver = item.silver_value;
      } else if (item.item_type === '食材') {
        await db.execute(
          `INSERT INTO items (name, owner, type, quantity, price) 
           VALUES (?, ?, 'food', 1, ?)`,
          [item.item_name, username, item.silver_value]
        );
        message = `恭喜！您成功捕获了【${item.item_name}】！可以卖得${item.silver_value}两银子。`;
        rewardSilver = item.silver_value;
      }
      
      // 发放银子奖励
      if (rewardSilver > 0) {
        await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [rewardSilver, userId]);
      }
      
      // 增加属性
      if (item.effect_neili || item.effect_tili) {
        await db.execute(
          'UPDATE users SET neili = neili + ?, tili = tili + ? WHERE id = ?',
          [item.effect_neili || 0, item.effect_tili || 0, userId]
        );
        if (item.effect_neili) message += ` 内力 +${item.effect_neili}`;
        if (item.effect_tili) message += `，体力 +${item.effect_tili}`;
      }
      
      message += ' 打猎成功，经验 +200！';
    } else {
      message = '这次打猎一无所获，但您获得了宝贵的经验。经验 +50';
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
        silver_reward: rewardSilver,
        isSuccess: isSuccess
      }
    });
  } catch (err) {
    console.error('Finish hunt error:', err);
    res.status(500).json({ success: false, message: '完成打猎失败' });
  }
};

// 获取狩猎记录
exports.getHuntingRecords = async (req, res) => {
  try {
    const username = req.user.username;
    const [records] = await db.execute(
      'SELECT * FROM hunting_records WHERE username = ? ORDER BY completed_at DESC LIMIT 20',
      [username]
    );
    
    res.json({
      success: true,
      data: records
    });
  } catch (err) {
    console.error('Get hunting records error:', err);
    res.status(500).json({ success: false, message: '查询狩猎记录失败' });
  }
};

// 获取狩猎状态
exports.getHuntingStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    
    // 检查工作状态
    const [workStates] = await db.execute(
      'SELECT * FROM hunting_states WHERE user_id = ? AND is_active = 1 AND type = "work"',
      [userId]
    );
    
    // 检查打猎状态
    const [huntStates] = await db.execute(
      'SELECT * FROM hunting_states WHERE user_id = ? AND is_active = 1 AND type = "hunt"',
      [userId]
    );
    
    let workCooldown = 0;
    let huntCooldown = 0;
    
    if (workStates.length === 0) {
      // 检查工作冷却
      const [lastWork] = await db.execute(
        'SELECT * FROM hunting_records WHERE user_id = ? AND type = "work" ORDER BY completed_at DESC LIMIT 1',
        [userId]
      );
      if (lastWork.length > 0) {
        const lastTime = new Date(lastWork[0].completed_at);
        const now = new Date();
        const diffMinutes = (now - lastTime) / 1000 / 60;
        if (diffMinutes < HUNTING_CONFIG.workCooldownMinutes) {
          workCooldown = Math.ceil(HUNTING_CONFIG.workCooldownMinutes - diffMinutes);
        }
      }
    }
    
    if (huntStates.length === 0) {
      // 检查打猎冷却
      const [lastHunt] = await db.execute(
        'SELECT * FROM hunting_records WHERE user_id = ? AND type = "hunt" ORDER BY completed_at DESC LIMIT 1',
        [userId]
      );
      if (lastHunt.length > 0) {
        const lastTime = new Date(lastHunt[0].completed_at);
        const now = new Date();
        const diffMinutes = (now - lastTime) / 1000 / 60;
        if (diffMinutes < HUNTING_CONFIG.huntCooldownMinutes) {
          huntCooldown = Math.ceil(HUNTING_CONFIG.huntCooldownMinutes - diffMinutes);
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        isWorking: workStates.length > 0,
        isHunting: huntStates.length > 0,
        workCooldown: workCooldown,
        huntCooldown: huntCooldown
      }
    });
  } catch (err) {
    console.error('Get hunting status error:', err);
    res.status(500).json({ success: false, message: '查询狩猎状态失败' });
  }
};
