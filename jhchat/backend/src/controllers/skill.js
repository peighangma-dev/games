const db = require('../config/db');

/**
 * 修炼配置
 */
const PRACTICE_CONFIG = {
  // 基础冷却时间（秒）
  baseCooldown: 60,
  // 每日最大修炼次数
  maxDailyPractices: 50,
  // 修炼基础耗时（秒）
  baseTimeCost: 10,
  // 修为等级经验需求基数
  cultivationBaseExp: 1000,
  // 修为等级经验成长系数
  cultivationExpGrowth: 1.5
};

/**
 * 计算修炼获得的经验值
 */
function calculateExpGain(practiceType, userLevel, cultivationLevel) {
  // 基础经验：10-60 随机
  let baseExp = Math.floor(Math.random() * 51) + 10;
  
  // 类型系数：外功性价比最高
  const typeMultiplier = practiceType === 2 ? 1.2 : 1.0;
  
  // 等级加成：用户等级越高，获得经验越多
  const levelBonus = 1 + (userLevel - 1) * 0.05;
  
  // 修为等级加成
  const cultivationBonus = 1 + (cultivationLevel - 1) * 0.1;
  
  // 最终经验 = 基础经验 * 类型系数 * 等级加成 * 修为加成
  const finalExp = Math.floor(baseExp * typeMultiplier * levelBonus * cultivationBonus);
  
  return Math.min(finalExp, 500); // 单次上限 500 经验
}

/**
 * 计算修炼所需时间
 */
function calculateTimeCost(practiceType, cultivationLevel) {
  // 基础时间：10 秒
  let baseTime = PRACTICE_CONFIG.baseTimeCost;
  
  // 类型差异：内功耗时最长，轻功最短
  if (practiceType === 1) {
    baseTime += 5; // 内功 +5 秒
  } else if (practiceType === 3) {
    baseTime -= 3; // 轻功 -3 秒
  }
  
  // 修为等级减少耗时（最高减少 50%）
  const reduction = Math.min(0.5, (cultivationLevel - 1) * 0.03);
  baseTime = Math.floor(baseTime * (1 - reduction));
  
  return Math.max(baseTime, 3); // 最低 3 秒
}

/**
 * 计算修为进度
 */
function calculateCultivationProgress(cultivationLevel) {
  // 升级所需进度 = 基数 * (成长系数 ^ (等级 -1))
  return Math.floor(
    PRACTICE_CONFIG.cultivationBaseExp * 
    Math.pow(PRACTICE_CONFIG.cultivationExpGrowth, cultivationLevel - 1)
  );
}

exports.list = async (req, res) => {
  try {
    const [skills] = await db.execute(
      'SELECT id, name, sect, neili_cost, is_timed FROM martial_arts ORDER BY id'
    );
    res.json({ success: true, data: skills });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询武功列表失败' });
  }
};

exports.practice = async (req, res) => {
  try {
    const practiceType = parseInt(req.params.id);
    
    if (![1, 2, 3].includes(practiceType)) {
      return res.status(400).json({
        success: false,
        message: '无效的修炼类型',
        code: 'INVALID_PRACTICE_TYPE'
      });
    }
    
    // 获取用户信息
    const [users] = await db.execute(
      `SELECT id, username, neili, tili, wugong, all_value, grade, 
              last_practice_at, practice_count_today, practice_exp_total
       FROM users 
       WHERE id = ?`,
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const user = users[0];
    const now = new Date();
    
    // 1. 检查冷却时间
    if (user.last_practice_at) {
      const lastPractice = new Date(user.last_practice_at);
      const cooldownMs = (now - lastPractice) / 1000; // 转换为秒
      
      if (cooldownMs < PRACTICE_CONFIG.baseCooldown) {
        const remainingTime = Math.ceil(PRACTICE_CONFIG.baseCooldown - cooldownMs);
        return res.status(400).json({
          success: false,
          message: `修炼未成，需调息${remainingTime}秒后方可继续`,
          code: 'COOLDOWN_NOT_FINISHED',
          data: {
            cooldownRemaining: remainingTime,
            lastPracticeAt: lastPractice.toISOString()
          }
        });
      }
    }
    
    // 2. 检查每日修炼次数
    const todayStr = now.toISOString().split('T')[0];
    const lastPracticeDate = user.last_practice_at ? 
      new Date(user.last_practice_at).toISOString().split('T')[0] : null;
    
    let practiceCountToday = lastPracticeDate === todayStr ? user.practice_count_today : 0;
    
    if (practiceCountToday >= PRACTICE_CONFIG.maxDailyPractices) {
      return res.status(400).json({
        success: false,
        message: `今日修炼次数已达上限（${PRACTICE_CONFIG.maxDailyPractices}次），请明日再来`,
        code: 'DAILY_LIMIT_REACHED'
      });
    }
    
    // 3. 计算修炼消耗和收益
    const neiliCost = practiceType === 2 ? 10 : 15; // 外功消耗少
    const tiliCost = 5;
    
    // 获取修为等级
    const [cultivationRecords] = await db.execute(
      `SELECT level, progress, required_progress, total_practices 
       FROM cultivation_progress 
       WHERE user_id = ? AND practice_type = ?`,
      [user.id, practiceType]
    );
    
    const cultivationLevel = cultivationRecords[0]?.level || 1;
    
    // 计算经验收益和时间消耗
    const expGain = calculateExpGain(practiceType, user.grade, cultivationLevel);
    const timeCost = calculateTimeCost(practiceType, cultivationLevel);
    
    // 4. 检查资源是否足够
    if (user.neili < neiliCost) {
      return res.status(400).json({ 
        success: false, 
        message: `内力不足！需要${neiliCost}点内力，当前只有${user.neili}点`,
        code: 'INSUFFICIENT_NEILI'
      });
    }
    
    if (user.tili < tiliCost) {
      return res.status(400).json({ 
        success: false, 
        message: `体力不足！需要${tiliCost}点体力，请在物品店购买人参或休息恢复`,
        code: 'INSUFFICIENT_TILI'
      });
    }
    
    // 5. 执行修炼：扣除资源，更新统计数据
    await db.execute(
      `UPDATE users 
       SET neili = neili - ?, 
           tili = GREATEST(0, tili - ?), 
           all_value = all_value + ?,
           practice_exp_total = practice_exp_total + ?,
           last_practice_at = NOW(),
           practice_count_today = ?
       WHERE id = ?`,
      [neiliCost, tiliCost, expGain, expGain, practiceCountToday + 1, user.id]
    );
    
    // 6. 增加修为属性
    let attributeBoost = {};
    if (practiceType === 1) {
      // 内功：增加内力上限
      const neiliBoost = Math.floor(cultivationLevel * 0.5) + 1;
      await db.execute('UPDATE users SET max_neili = max_neili + ? WHERE id = ?', [neiliBoost, user.id]);
      attributeBoost = { name: '内力上限', value: neiliBoost };
    } else if (practiceType === 2) {
      // 外功：增加武功
      const wugongBoost = Math.floor(cultivationLevel * 0.3) + 1;
      await db.execute('UPDATE users SET wugong = wugong + ? WHERE id = ?', [wugongBoost, user.id]);
      attributeBoost = { name: '武功', value: wugongBoost };
    } else if (practiceType === 3) {
      // 轻功：增加轻功
      const speedBoost = Math.floor(cultivationLevel * 0.3) + 1;
      await db.execute('UPDATE users SET speed = speed + ? WHERE id = ?', [speedBoost, user.id]);
      attributeBoost = { name: '轻功', value: speedBoost };
    }
    
    // 7. 更新修为进度
    const [currentProgress] = await db.execute(
      `SELECT progress, required_progress, level, total_practices
       FROM cultivation_progress 
       WHERE user_id = ? AND practice_type = ?`,
      [user.id, practiceType]
    );
    
    let levelUp = false;
    let newLevel = cultivationLevel;
    let newProgress = (currentProgress[0]?.progress || 0) + expGain;
    let newRequiredProgress = calculateCultivationProgress(cultivationLevel);
    
    // 检查是否升级
    while (newProgress >= newRequiredProgress) {
      newLevel++;
      newProgress -= newRequiredProgress;
      newRequiredProgress = calculateCultivationProgress(newLevel);
      levelUp = true;
    }
    
    await db.execute(
      `INSERT INTO cultivation_progress 
       (user_id, practice_type, level, progress, required_progress, total_practices, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       level = VALUES(level),
       progress = VALUES(progress),
       required_progress = VALUES(required_progress),
       total_practices = total_practices + 1,
       updated_at = NOW()`,
      [user.id, practiceType, newLevel, newProgress, newRequiredProgress, (currentProgress[0]?.total_practices || 0) + 1]
    );
    
    // 8. 记录修炼日志
    await db.execute(
      `INSERT INTO practice_logs 
       (user_id, username, practice_type, exp_gain, neili_cost, tili_cost, time_cost, cultivation_progress, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [user.id, user.username, practiceType, expGain, neiliCost, tiliCost, timeCost, newProgress]
    );
    
    // 9. 构造响应消息
    const practiceNames = { 1: '内功', 2: '外功', 3: '轻功' };
    const practiceName = practiceNames[practiceType];
    
    let message = `修炼${practiceName}成功！获得${expGain}点经验`;
    
    if (attributeBoost.value > 0) {
      message += `，${attributeBoost.name}+${attributeBoost.value}`;
    }
    
    if (levelUp) {
      message += `\n🎉 恭喜！${practiceName}修为突破至第${newLevel}重天！`;
    }
    
    message += `（修炼耗时${timeCost}秒）`;
    
    res.json({
      success: true,
      message: message,
      data: {
        practiceType: practiceType,
        practiceName: practiceName,
        expGain: expGain,
        neiliCost: neiliCost,
        tiliCost: tiliCost,
        timeCost: timeCost,
        cultivationLevel: newLevel,
        cultivationProgress: newProgress,
        requiredProgress: newRequiredProgress,
        levelUp: levelUp,
        attributeBoost: attributeBoost,
        remainingDailyPractices: PRACTICE_CONFIG.maxDailyPractices - (practiceCountToday + 1)
      }
    });
  } catch (err) {
    console.error('练功错误:', err);
    res.status(500).json({ 
      success: false, 
      message: '练功失败，请稍后重试',
      code: 'PRACTICE_ERROR'
    });
  }
};

/**
 * 获取用户修炼状态
 */
exports.getPracticeStatus = async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT id, last_practice_at, practice_count_today, practice_exp_total
       FROM users 
       WHERE id = ?`,
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const user = users[0];
    const now = new Date();
    let cooldownRemaining = 0;
    
    // 计算冷却剩余时间
    if (user.last_practice_at) {
      const lastPractice = new Date(user.last_practice_at);
      const cooldownMs = (now - lastPractice) / 1000;
      
      if (cooldownMs < PRACTICE_CONFIG.baseCooldown) {
        cooldownRemaining = Math.ceil(PRACTICE_CONFIG.baseCooldown - cooldownMs);
      }
    }
    
    // 检查是否是新的一天，重置计数
    const todayStr = now.toISOString().split('T')[0];
    const lastPracticeDate = user.last_practice_at ? 
      new Date(user.last_practice_at).toISOString().split('T')[0] : null;
    
    const practiceCountToday = lastPracticeDate === todayStr ? user.practice_count_today : 0;
    
    res.json({
      success: true,
      data: {
        lastPracticeAt: user.last_practice_at,
        cooldownRemaining: cooldownRemaining,
        practiceCountToday: practiceCountToday,
        maxDailyPractices: PRACTICE_CONFIG.maxDailyPractices,
        remainingDailyPractices: PRACTICE_CONFIG.maxDailyPractices - practiceCountToday,
        totalPracticeExp: user.practice_exp_total
      }
    });
  } catch (err) {
    console.error('获取修炼状态失败:', err);
    res.status(500).json({ 
      success: false, 
      message: '获取修炼状态失败',
      code: 'GET_STATUS_ERROR'
    });
  }
};

/**
 * 获取修为详情
 */
exports.getCultivationDetail = async (req, res) => {
  try {
    const [progresses] = await db.execute(
      `SELECT cp.*, u.username
       FROM cultivation_progress cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.user_id = ? AND cp.practice_type IN (1, 2, 3)
       ORDER BY cp.practice_type`,
      [req.user.id]
    );
    
    const typeNames = {
      1: '内功',
      2: '外功',
      3: '轻功'
    };
    
    const cultivationData = progresses.map(p => ({
      practiceType: p.practice_type,
      typeName: typeNames[p.practice_type] || '未知',
      level: p.level,
      progress: p.progress,
      requiredProgress: p.required_progress,
      progressPercent: Math.floor((p.progress / p.required_progress) * 100),
      totalPractices: p.total_practices
    }));
    
    res.json({
      success: true,
      data: {
        cultivations: cultivationData
      }
    });
  } catch (err) {
    console.error('获取修为详情失败:', err);
    res.status(500).json({ 
      success: false, 
      message: '获取修为详情失败',
      code: 'GET_CULTIVATION_ERROR'
    });
  }
};

exports.secret = async (req, res) => {
  try {
    const [skills] = await db.execute(
      'SELECT id, name, speed_bonus, neili_bonus, price, level, description, rarity FROM secret_skills ORDER BY level, price'
    );
    res.json({ success: true, data: skills });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询藏经阁失败' });
  }
};

exports.learn = async (req, res) => {
  try {
    const [skills] = await db.execute('SELECT id, name, speed_bonus, neili_bonus, price, level FROM secret_skills WHERE id = ?', [req.params.id]);
    if (skills.length === 0) return res.status(404).json({ success: false, message: '武功不存在' });
    const skill = skills[0];
    const [users] = await db.execute('SELECT id, silver, grade, username FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];
    if (user.grade < skill.level) return res.status(403).json({ success: false, message: '等级不足' });
    if (user.silver < skill.price) return res.status(400).json({ success: false, message: '银两不足' });
    const [existing] = await db.execute(
      'SELECT id FROM learned_skills WHERE skill_name = ? AND owner = ?',
      [skill.name, user.username]
    );
    if (existing.length > 0) return res.status(400).json({ success: false, message: '已经学过此武功' });
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [skill.price, user.id]);
    await db.execute(
      'INSERT INTO learned_skills (skill_name, owner, neili_bonus, speed_bonus, level) VALUES (?, ?, ?, ?, ?)',
      [skill.name, user.username, skill.neili_bonus, skill.speed_bonus, 1]
    );
    res.json({ success: true, message: '修炼成功', data: { skillName: skill.name } });
  } catch (err) {
    res.status(500).json({ success: false, message: '修炼失败' });
  }
};

exports.learned = async (req, res) => {
  try {
    const [skills] = await db.execute(
      'SELECT id, skill_name, neili_bonus, speed_bonus, level, learned_at FROM learned_skills WHERE owner = ? ORDER BY learned_at DESC',
      [req.user.username]
    );
    res.json({ success: true, data: skills });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询已学武功失败' });
  }
};
