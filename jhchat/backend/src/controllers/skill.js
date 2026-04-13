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
    const [skills] = await db.execute('SELECT id, name, sect, neili_cost FROM martial_arts WHERE id = ?', [req.params.id]);
    if (skills.length === 0) return res.status(404).json({ success: false, message: '武功不存在' });
    const skill = skills[0];
    const [users] = await db.execute('SELECT id, sect, neili, tili, wugong, all_value FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];
    if (skill.sect && skill.sect !== '无' && skill.sect !== user.sect) {
      return res.status(403).json({ success: false, message: '这不是本门派武功' });
    }
    if (user.neili < skill.neili_cost) {
      return res.status(400).json({ success: false, message: '内力不足' });
    }
    if (user.tili < 5) {
      return res.status(400).json({ success: false, message: '体力不足' });
    }
    const expGain = Math.floor(Math.random() * 50) + 10;
    await db.execute(
      'UPDATE users SET neili = neili - ?, tili = tili - 5, wugong = wugong + ?, all_value = all_value + ? WHERE id = ?',
      [skill.neili_cost, expGain, expGain, user.id]
    );
    res.json({ success: true, data: { skillName: skill.name, expGain, neiliCost: skill.neili_cost } });
  } catch (err) {
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
    const [users] = await db.execute('SELECT id, silver, grade FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];
    if (user.grade < skill.level) return res.status(403).json({ success: false, message: '等级不足' });
    if (user.silver < skill.price) return res.status(400).json({ success: false, message: '银两不足' });
    const [existing] = await db.execute(
      'SELECT id FROM learned_skills WHERE skill_name = ? AND owner = ?',
      [skill.name, req.user.username]
    );
    if (existing.length > 0) return res.status(400).json({ success: false, message: '已经学过此武功' });
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [skill.price, user.id]);
    await db.execute(
      'INSERT INTO learned_skills (skill_name, owner, neili_bonus, speed_bonus, level) VALUES (?, ?, ?, ?, ?)',
      [skill.name, req.user.username, skill.neili_bonus, skill.speed_bonus, 1]
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
