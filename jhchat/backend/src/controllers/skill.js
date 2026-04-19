const db = require('../config/db');

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
    // practiceType: 1=内功，2=外功，3=轻功
    const practiceType = parseInt(req.params.id);
    
    let neiliCost = 15;
    let expGain = Math.floor(Math.random() * 50) + 10;
    
    // 外功消耗少一点
    if (practiceType === 2) {
      neiliCost = 10;
    }
    
    const [users] = await db.execute(
      'SELECT id, neili, tili, wugong, all_value FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    const user = users[0];
    
    if (user.neili < neiliCost) {
      return res.status(400).json({ 
        success: false, 
        message: `内力不足！需要${neiliCost}点内力，当前只有${user.neili}点` 
      });
    }
    
    if (user.tili < 5) {
      return res.status(400).json({ 
        success: false, 
        message: '体力不足！需要 5 点体力，请在物品店购买人参或休息恢复' 
      });
    }
    
    // 扣除内力和体力
    await db.execute(
      'UPDATE users SET neili = neili - ?, tili = GREATEST(0, tili - 5), all_value = all_value + ? WHERE id = ?',
      [neiliCost, expGain, user.id]
    );
    
    // 根据不同练习类型增加对应属性
    let attributeName = '经验';
    if (practiceType === 1) {
      // 内功：增加内力上限
      await db.execute('UPDATE users SET max_neili = max_neili + 1 WHERE id = ?', [req.user.id]);
      attributeName = '内力修为';
    } else if (practiceType === 2) {
      // 外功：增加武功
      await db.execute('UPDATE users SET wugong = wugong + 1 WHERE id = ?', [req.user.id]);
      attributeName = '武功招式';
    } else if (practiceType === 3) {
      // 轻功：增加轻功
      await db.execute('UPDATE users SET speed = speed + 1 WHERE id = ?', [req.user.id]);
      attributeName = '轻功身法';
    }
    
    const practiceNames = {
      1: '内功',
      2: '外功',
      3: '轻功'
    };
    
    res.json({
      success: true,
      message: `修炼${practiceNames[practiceType] || '武功'}成功！${attributeName} +${expGain}`,
      data: {
        practiceType: practiceType,
        expGain: expGain,
        neiliCost: neiliCost
      }
    });
  } catch (err) {
    console.error('练功错误:', err);
    res.status(500).json({ success: false, message: '练功失败' });
  }
};

exports.secret = async (req, res) => {
  try {
    const [skills] = await db.execute(
      'SELECT id, name, speed_bonus, neili_bonus, price, level FROM secret_skills ORDER BY level, price'
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
