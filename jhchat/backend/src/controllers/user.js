const db = require('../config/db');

exports.getMe = async (req, res) => {
  try {
    const userId = req.user?.id || 0;
    const [users] = await db.execute(
      `SELECT id, username, gender, avatar, status, neili, wugong, tili, attack, defense, charm, attack_power,
        spouse, is_vip, silver, sect, faction, sect_title, deposit, grade, total_exp, monthly_exp,
        job, master, vip_expires_at, registered_at, last_login_at
       FROM users WHERE id = ?`, [userId]
    );
    if (users.length === 0) return res.status(404).json({ success: false, message: '用户不存在' });
    res.json({ success: true, data: users[0] });
  } catch (err) {
    console.error('getMe error:', err.message);
    res.status(500).json({ success: false, message: '查询失败：' + err.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { email } = req.body;
    await db.execute('UPDATE users SET email = ? WHERE id = ?', [email, req.user.id]);
    res.json({ success: true, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '更新失败' });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: '请选择文件' });
    const avatarPath = `uploads/avatars/${req.file.filename}`;
    await db.execute('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, req.user.id]);
    res.json({ success: true, data: { avatar: avatarPath } });
  } catch (err) {
    console.error('uploadAvatar error:', err.message);
    res.status(500).json({ success: false, message: '上传失败：' + err.message });
  }
};

exports.getOnlineUsers = async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT o.user_id, o.username, o.gender, o.sect, o.avatar, o.room_id, o.joined_at, o.last_active_at
       FROM online_users o ORDER BY o.username`
    );
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询失败' });
  }
};

exports.getMembers = async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT username, vip_expires_at, silver FROM users WHERE is_vip = 1 ORDER BY vip_expires_at DESC`
    );
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询失败' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT id, username, gender, avatar, status, neili, wugong, tili, attack, defense, charm,
        attack_power, spouse, is_vip, silver, sect, faction, sect_title, grade, total_exp, registered_at
       FROM users WHERE username = ?`, [req.params.name]
    );
    if (users.length === 0) return res.status(404).json({ success: false, message: '用户不存在' });
    const user = users[0];
    await db.execute('UPDATE users SET silver = silver - 100000 WHERE id = ?', [req.user.id]);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询失败' });
  }
};
