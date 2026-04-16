const db = require('../config/db');

// 机缘事件配置
const ENCOUNTER_CONFIG = {
  cooldownHours: 1, // 机缘冷却时间（小时）
  maxDaily: 3       // 每日最多触发次数
};

// 触发机缘事件
exports.triggerEncounter = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    const user = req.user;
    
    // 检查今日触发次数
    const today = new Date().toISOString().slice(0, 10);
    const [todayRecords] = await db.execute(
      'SELECT COUNT(*) as count FROM user_encounters WHERE username = ? AND DATE(occurred_at) = ?',
      [username, today]
    );
    
    if (todayRecords[0].count >= ENCOUNTER_CONFIG.maxDaily) {
      return res.status(400).json({ 
        success: false, 
        message: `今日机缘次数已达上限（${ENCOUNTER_CONFIG.maxDaily}次/天），请明天再来！` 
      });
    }
    
    // 检查冷却时间
    const [lastRecords] = await db.execute(
      'SELECT * FROM user_encounters WHERE user_id = ? ORDER BY occurred_at DESC LIMIT 1',
      [userId]
    );
    
    if (lastRecords.length > 0) {
      const lastTime = new Date(lastRecords[0].occurred_at);
      const now = new Date();
      const diffHours = (now - lastTime) / 1000 / 60 / 60;
      
      if (diffHours < ENCOUNTER_CONFIG.cooldownHours) {
        const remainMinutes = Math.ceil((ENCOUNTER_CONFIG.cooldownHours - diffHours) * 60);
        return res.status(400).json({ 
          success: false, 
          message: `机缘需要冷却${ENCOUNTER_CONFIG.cooldownHours}小时，请${remainMinutes}分钟后再试！` 
        });
      }
    }
    
    // 根据等级过滤可用事件
    const [events] = await db.execute(
      'SELECT * FROM encounter_events WHERE min_grade <= ? ORDER BY RAND()',
      [user.grade]
    );
    
    if (events.length === 0) {
      return res.status(500).json({ success: false, message: '暂无可用事件' });
    }
    
    // 选择第一个随机事件
    const event = events[0];
    
    // 应用事件效果
    let message = event.event_desc;
    
    if (event.effect_type === 'silver') {
      await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [event.effect_value, userId]);
      if (event.effect_value > 0) {
        message += ` 获得${event.effect_value}两银子！`;
      } else {
        message += ` 损失${Math.abs(event.effect_value)}两银子！`;
      }
    } else if (event.effect_type === 'neili') {
      await db.execute('UPDATE users SET neili = neili + ? WHERE id = ?', [event.effect_value, userId]);
      message += ` 内力${event.effect_value > 0 ? '+' : ''}${event.effect_value}！`;
    } else if (event.effect_type === 'tili') {
      await db.execute('UPDATE users SET tili = tili + ? WHERE id = ?', [event.effect_value, userId]);
      message += ` 体力${event.effect_value > 0 ? '+' : ''}${event.effect_value}！`;
    } else if (event.effect_type === 'wugong') {
      await db.execute('UPDATE users SET wugong = wugong + ? WHERE id = ?', [event.effect_value, userId]);
      message += ` 武功${event.effect_value > 0 ? '+' : ''}${event.effect_value}！`;
    }
    
    // 记录机缘事件
    await db.execute(
      `INSERT INTO user_encounters (user_id, username, event_id, event_name, effect_type, effect_value) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, username, event.id, event.event_name, event.effect_type, event.effect_value]
    );
    
    res.json({
      success: true,
      message: message,
      data: {
        event_type: event.event_type,
        event_name: event.event_name,
        effect_type: event.effect_type,
        effect_value: event.effect_value,
        todayCount: todayRecords[0].count + 1
      }
    });
  } catch (err) {
    console.error('Trigger encounter error:', err);
    res.status(500).json({ success: false, message: '触发机缘失败' });
  }
};

// 获取机缘记录
exports.getEncounterRecords = async (req, res) => {
  try {
    const username = req.user.username;
    const [records] = await db.execute(
      'SELECT * FROM user_encounters WHERE username = ? ORDER BY occurred_at DESC LIMIT 20',
      [username]
    );
    
    res.json({
      success: true,
      data: records
    });
  } catch (err) {
    console.error('Get encounter records error:', err);
    res.status(500).json({ success: false, message: '查询机缘记录失败' });
  }
};

// 获取机缘状态
exports.getEncounterStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    const today = new Date().toISOString().slice(0, 10);
    
    // 今日触发次数
    const [todayRecords] = await db.execute(
      'SELECT COUNT(*) as count FROM user_encounters WHERE username = ? AND DATE(occurred_at) = ?',
      [username, today]
    );
    
    // 冷却时间
    const [lastRecords] = await db.execute(
      'SELECT * FROM user_encounters WHERE user_id = ? ORDER BY occurred_at DESC LIMIT 1',
      [userId]
    );
    
    let cooldownRemaining = 0;
    if (lastRecords.length > 0) {
      const lastTime = new Date(lastRecords[0].occurred_at);
      const now = new Date();
      const diffHours = (now - lastTime) / 1000 / 60 / 60;
      
      if (diffHours < ENCOUNTER_CONFIG.cooldownHours) {
        cooldownRemaining = Math.ceil((ENCOUNTER_CONFIG.cooldownHours - diffHours) * 60);
      }
    }
    
    res.json({
      success: true,
      data: {
        todayCount: todayRecords[0].count,
        maxDaily: ENCOUNTER_CONFIG.maxDaily,
        cooldownRemaining: cooldownRemaining,
        canTrigger: todayRecords[0].count < ENCOUNTER_CONFIG.maxDaily && cooldownRemaining === 0
      }
    });
  } catch (err) {
    console.error('Get encounter status error:', err);
    res.status(500).json({ success: false, message: '查询机缘状态失败' });
  }
};
