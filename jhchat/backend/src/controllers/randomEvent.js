const db = require('../config/db');

// 获取所有随机事件（后台管理）
exports.getAllEvents = async (req, res) => {
  try {
    const [events] = await db.execute('SELECT * FROM random_events ORDER BY id DESC');
    res.json({
      success: true,
      data: events
    });
  } catch (err) {
    console.error('Get random events error:', err);
    res.status(500).json({ success: false, message: '查询随机事件失败' });
  }
};

// 获取单个随机事件
exports.getEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const [events] = await db.execute('SELECT * FROM random_events WHERE id = ?', [id]);
    
    if (events.length === 0) {
      return res.status(404).json({ success: false, message: '事件不存在' });
    }
    
    res.json({
      success: true,
      data: events[0]
    });
  } catch (err) {
    console.error('Get random event error:', err);
    res.status(500).json({ success: false, message: '查询事件失败' });
  }
};

// 创建随机事件
exports.createEvent = async (req, res) => {
  try {
    const {
      event_name,
      event_type,
      message_template,
      effect_type,
      effect_value_min,
      effect_value_max,
      probability,
      cooldown_minutes,
      is_enabled,
      is_global,
      min_grade
    } = req.body;
    
    if (!event_name || !message_template) {
      return res.status(400).json({ success: false, message: '事件名称和消息模板不能为空' });
    }
    
    await db.execute(
      `INSERT INTO random_events (
        event_name, event_type, message_template, effect_type,
        effect_value_min, effect_value_max, probability, cooldown_minutes,
        is_enabled, is_global, min_grade
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event_name,
        event_type || 'mystery',
        message_template,
        effect_type || 'none',
        effect_value_min || 0,
        effect_value_max || 0,
        probability || 100,
        cooldown_minutes || 30,
        is_enabled ? 1 : 0,
        is_global ? 1 : 0,
        min_grade || 1
      ]
    );
    
    res.json({
      success: true,
      message: '创建成功'
    });
  } catch (err) {
    console.error('Create random event error:', err);
    res.status(500).json({ success: false, message: '创建事件失败' });
  }
};

// 更新随机事件
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      event_name,
      event_type,
      message_template,
      effect_type,
      effect_value_min,
      effect_value_max,
      probability,
      cooldown_minutes,
      is_enabled,
      is_global,
      min_grade
    } = req.body;
    
    const [events] = await db.execute('SELECT * FROM random_events WHERE id = ?', [id]);
    if (events.length === 0) {
      return res.status(404).json({ success: false, message: '事件不存在' });
    }
    
    await db.execute(
      `UPDATE random_events SET
        event_name = ?, event_type = ?, message_template = ?, effect_type = ?,
        effect_value_min = ?, effect_value_max = ?, probability = ?, cooldown_minutes = ?,
        is_enabled = ?, is_global = ?, min_grade = ?
      WHERE id = ?`,
      [
        event_name,
        event_type,
        message_template,
        effect_type,
        effect_value_min,
        effect_value_max,
        probability,
        cooldown_minutes,
        is_enabled ? 1 : 0,
        is_global ? 1 : 0,
        min_grade,
        id
      ]
    );
    
    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (err) {
    console.error('Update random event error:', err);
    res.status(500).json({ success: false, message: '更新事件失败' });
  }
};

// 删除随机事件
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [events] = await db.execute('SELECT * FROM random_events WHERE id = ?', [id]);
    if (events.length === 0) {
      return res.status(404).json({ success: false, message: '事件不存在' });
    }
    
    await db.execute('DELETE FROM random_events WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (err) {
    console.error('Delete random event error:', err);
    res.status(500).json({ success: false, message: '删除事件失败' });
  }
};

// 切换事件启用状态
exports.toggleEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [events] = await db.execute('SELECT is_enabled FROM random_events WHERE id = ?', [id]);
    if (events.length === 0) {
      return res.status(404).json({ success: false, message: '事件不存在' });
    }
    
    const newStatus = events[0].is_enabled ? 0 : 1;
    await db.execute('UPDATE random_events SET is_enabled = ? WHERE id = ?', [newStatus, id]);
    
    res.json({
      success: true,
      message: newStatus ? '已启用' : '已禁用',
      data: { is_enabled: newStatus }
    });
  } catch (err) {
    console.error('Toggle random event error:', err);
    res.status(500).json({ success: false, message: '操作失败' });
  }
};

// 获取启用的事件列表（用于随机触发）
exports.getEnabledEvents = async () => {
  try {
    const [events] = await db.execute(
      'SELECT * FROM random_events WHERE is_enabled = 1 ORDER BY probability DESC'
    );
    return events;
  } catch (err) {
    console.error('Get enabled events error:', err);
    return [];
  }
};

// 检查事件冷却时间
exports.checkCooldown = async (event_type, userId) => {
  try {
    const [logs] = await db.execute(
      `SELECT triggered_at FROM random_event_logs 
       WHERE event_type = ? 
       ORDER BY triggered_at DESC LIMIT 1`,
      [event_type]
    );
    
    if (logs.length === 0) return true;
    
    const [events] = await db.execute(
      'SELECT cooldown_minutes FROM random_events WHERE event_type = ? LIMIT 1',
      [event_type]
    );
    
    if (events.length === 0) return true;
    
    const cooldownMinutes = events[0].cooldown_minutes;
    const lastTriggered = new Date(logs[0].triggered_at);
    const now = new Date();
    const diffMinutes = (now - lastTriggered) / 1000 / 60;
    
    return diffMinutes >= cooldownMinutes;
  } catch (err) {
    console.error('Check cooldown error:', err);
    return true;
  }
};

// 触发随机事件
exports.triggerRandomEvent = async (io, roomOnlineUsers) => {
  try {
    const enabledEvents = await exports.getEnabledEvents();
    if (enabledEvents.length === 0) return null;
    
    // 计算总概率权重
    const totalWeight = enabledEvents.reduce((sum, e) => sum + e.probability, 0);
    let rand = Math.random() * totalWeight;
    
    // 根据概率权重选择事件
    let selectedEvent = null;
    for (const event of enabledEvents) {
      rand -= event.probability;
      if (rand <= 0) {
        selectedEvent = event;
        break;
      }
    }
    
    // 如果没有选中事件，选择第一个
    if (!selectedEvent && enabledEvents.length > 0) {
      selectedEvent = enabledEvents[0];
    }
    
    if (!selectedEvent) return null;
    
    // 检查冷却时间
    const isCooldownOk = await exports.checkCooldown(selectedEvent.event_type, 0);
    if (!isCooldownOk) return null;
    
    // 从在线用户中随机选择一个用户
    let targetUser = null;
    if (roomOnlineUsers && roomOnlineUsers.length > 0) {
      targetUser = roomOnlineUsers[Math.floor(Math.random() * roomOnlineUsers.length)];
    }
    
    // 生成消息
    let message = selectedEvent.message_template;
    const effectValue = selectedEvent.effect_value_min !== selectedEvent.effect_value_max
      ? Math.floor(Math.random() * (selectedEvent.effect_value_max - selectedEvent.effect_value_min + 1)) + selectedEvent.effect_value_min
      : selectedEvent.effect_value_min;
    
    const minGradeOk = selectedEvent.min_grade <= (targetUser?.grade || 1);
    
    // 替换占位符
    message = message.replace(/{username}/g, targetUser?.username || '某人');
    message = message.replace(/{amount}/g, Math.abs(effectValue));
    message = message.replace(/{attribute}/g, getAttributeName(selectedEvent.effect_type));
    
    // 如果是全球事件，影响所有在线用户
    if (selectedEvent.is_global && selectedEvent.effect_type !== 'none' && selectedEvent.effect_type !== 'silver') {
      // 全球事件，给所有在线用户加属性
      const affectedUsers = [];
      for (const user of roomOnlineUsers || []) {
        await applyEffect(user.user_id || user.id, selectedEvent.effect_type, effectValue);
        affectedUsers.push({ user_id: user.user_id || user.id, username: user.username, effect_value: effectValue });
      }
      message = `${message} （全服生效）`;
      
      // 记录日志
      await db.execute(
        `INSERT INTO random_event_logs (event_id, event_name, event_type, message, affected_users) 
         VALUES (?, ?, ?, ?, ?)`,
        [selectedEvent.id, selectedEvent.event_name, selectedEvent.event_type, message, JSON.stringify(affectedUsers)]
      );
    } else {
      // 单体事件，只影响目标用户
      if (targetUser && selectedEvent.effect_type !== 'none') {
        await applyEffect(targetUser.user_id || targetUser.id, selectedEvent.effect_type, effectValue);
        await db.execute(
          `INSERT INTO user_random_events (user_id, username, event_id, effect_type, effect_value) 
           VALUES (?, ?, ?, ?, ?)`,
          [targetUser.user_id || targetUser.id, targetUser.username, selectedEvent.id, selectedEvent.effect_type, effectValue]
        );
      }
      
      // 记录日志
      await db.execute(
        `INSERT INTO random_event_logs (event_id, event_name, event_type, message) 
         VALUES (?, ?, ?, ?)`,
        [selectedEvent.id, selectedEvent.event_name, selectedEvent.event_type, message]
      );
    }
    
    return {
      event: selectedEvent,
      message,
      targetUser
    };
  } catch (err) {
    console.error('Trigger random event error:', err);
    return null;
  }
};

// 获取属性名称
function getAttributeName(effectType) {
  const attrMap = {
    silver: '银子',
    neili: '内力',
    tili: '体力',
    wugong: '武功',
    all: '全属性'
  };
  return attrMap[effectType] || '属性';
}

// 应用效果
async function applyEffect(userId, effectType, value) {
  try {
    if (effectType === 'none' || value === 0) return;
    
    if (effectType === 'silver') {
      await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [value, userId]);
    } else if (effectType === 'neili') {
      await db.execute('UPDATE users SET neili = GREATEST(0, neili + ?) WHERE id = ?', [value, userId]);
    } else if (effectType === 'tili') {
      await db.execute('UPDATE users SET tili = GREATEST(0, tili + ?) WHERE id = ?', [value, userId]);
    } else if (effectType === 'wugong') {
      // wugong 在 users 表中是 grade 字段
      await db.execute('UPDATE users SET grade = grade + ? WHERE id = ? AND grade < 10', [Math.floor(value / 10) || 1, userId]);
    } else if (effectType === 'all') {
      await db.execute(
        'UPDATE users SET neili = neili + ?, tili = GREATEST(0, tili + ?), silver = silver + ? WHERE id = ?',
        [value, value, value, userId]
      );
    }
  } catch (err) {
    console.error('Apply effect error:', err);
  }
}

// 获取随机事件记录
exports.getEventLogs = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const [logs] = await db.execute(
      'SELECT * FROM random_event_logs ORDER BY triggered_at DESC LIMIT ?',
      [parseInt(limit)]
    );
    
    res.json({
      success: true,
      data: logs
    });
  } catch (err) {
    console.error('Get event logs error:', err);
    res.status(500).json({ success: false, message: '查询记录失败' });
  }
};
