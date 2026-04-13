const db = require('../config/db');

exports.list = async (req, res) => {
  try {
    const [sects] = await db.execute(
      'SELECT id, name, leader, slogan, member_count, fit_gender, created_at FROM sects ORDER BY member_count DESC'
    );
    res.json({ success: true, data: sects });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询门派列表失败' });
  }
};

exports.detail = async (req, res) => {
  try {
    const [sects] = await db.execute(
      'SELECT id, name, leader, slogan, description, rules, member_count, fit_gender, created_at FROM sects WHERE name = ?',
      [req.params.name]
    );
    if (sects.length === 0) return res.status(404).json({ success: false, message: '门派不存在' });
    res.json({ success: true, data: sects[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询门派详情失败' });
  }
};

exports.members = async (req, res) => {
  try {
    const [sects] = await db.execute('SELECT id FROM sects WHERE name = ?', [req.params.name]);
    if (sects.length === 0) return res.status(404).json({ success: false, message: '门派不存在' });
    const [members] = await db.execute(
      `SELECT id, username, gender, sect_title, grade, all_value, last_login_at
       FROM users WHERE sect = ? ORDER BY grade DESC, all_value DESC`,
      [req.params.name]
    );
    res.json({ success: true, data: members });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询门派成员失败' });
  }
};

exports.update = async (req, res) => {
  try {
    const [sects] = await db.execute('SELECT id, leader FROM sects WHERE name = ?', [req.params.name]);
    if (sects.length === 0) return res.status(404).json({ success: false, message: '门派不存在' });
    if (sects[0].leader !== req.user.username && req.user.grade < 6) {
      return res.status(403).json({ success: false, message: '只有掌门或管理员可修改' });
    }
    const { slogan, description, rules } = req.body;
    await db.execute(
      'UPDATE sects SET slogan = ?, description = ?, rules = ? WHERE id = ?',
      [slogan || null, description || null, rules || null, sects[0].id]
    );
    res.json({ success: true, message: '门派信息已更新' });
  } catch (err) {
    res.status(500).json({ success: false, message: '修改门派失败' });
  }
};

exports.salary = async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, sect, salary_time, silver, grade FROM users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) return res.status(404).json({ success: false, message: '用户不存在' });
    const user = users[0];
    if (user.sect === '无') return res.status(400).json({ success: false, message: '您还没有加入门派' });
    const now = new Date();
    if (user.salary_time) {
      const last = new Date(user.salary_time);
      if (last.toDateString() === now.toDateString()) {
        return res.status(400).json({ success: false, message: '今天已经领过薪水了' });
      }
    }
    const amount = (user.grade || 1) * 500;
    await db.execute(
      'UPDATE users SET silver = silver + ?, salary_time = NOW() WHERE id = ?',
      [amount, user.id]
    );
    res.json({ success: true, data: { amount } });
  } catch (err) {
    res.status(500).json({ success: false, message: '领取薪水失败' });
  }
};
