const db = require('../config/db');

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const offset = (page - 1) * limit;
    let where = '1=1';
    const params = [];
    if (search) { where += ' AND username LIKE ?'; params.push(`%${search}%`); }
    if (status) { where += ' AND status = ?'; params.push(status); }
    const [users] = await db.execute(
      `SELECT id, username, gender, status, grade, sect, faction, silver, all_value, registered_at, last_login_at
       FROM users WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [countResult] = await db.execute(`SELECT COUNT(*) as total FROM users WHERE ${where}`, params);
    res.json({ success: true, data: { users, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询用户列表失败' });
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ success: false, message: '用户不存在' });
    res.json({ success: true, data: users[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询用户详情失败' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { grade, sect, faction, sect_title, silver, status, is_vip } = req.body;
    const fields = [];
    const params = [];
    if (grade !== undefined) { fields.push('grade = ?'); params.push(grade); }
    if (sect !== undefined) { fields.push('sect = ?'); params.push(sect); }
    if (faction !== undefined) { fields.push('faction = ?'); params.push(faction); }
    if (sect_title !== undefined) { fields.push('sect_title = ?'); params.push(sect_title); }
    if (silver !== undefined) { fields.push('silver = ?'); params.push(silver); }
    if (status !== undefined) { fields.push('status = ?'); params.push(status); }
    if (is_vip !== undefined) { fields.push('is_vip = ?'); params.push(is_vip); }
    if (fields.length === 0) return res.status(400).json({ success: false, message: '没有需要更新的字段' });
    params.push(req.params.id);
    await db.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: '用户信息已更新' });
  } catch (err) {
    res.status(500).json({ success: false, message: '编辑用户失败' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await db.execute("UPDATE users SET status = 'dead' WHERE id = ?", [req.params.id]);
    await db.execute('DELETE FROM online_users WHERE user_id = ?', [req.params.id]);
    res.json({ success: true, message: '用户已删除' });
  } catch (err) {
    res.status(500).json({ success: false, message: '删除用户失败' });
  }
};

exports.batchDeleteUsers = async (req, res) => {
  try {
    const { days } = req.body;
    if (!days || days < 1) return res.status(400).json({ success: false, message: '请输入有效天数' });
    const [result] = await db.execute(
      "UPDATE users SET status = 'dead' WHERE last_login_at < DATE_SUB(NOW(), INTERVAL ? DAY) AND status != 'dead'",
      [days]
    );
    res.json({ success: true, message: `已清理${result.affectedRows}个用户` });
  } catch (err) {
    res.status(500).json({ success: false, message: '批量删除失败' });
  }
};

exports.getManagers = async (req, res) => {
  try {
    const [managers] = await db.execute(
      `SELECT id, username, grade, faction, sect_title FROM users WHERE grade >= 6 ORDER BY grade DESC`
    );
    res.json({ success: true, data: managers });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询管理员失败' });
  }
};

exports.addManager = async (req, res) => {
  try {
    const { username, grade, faction } = req.body;
    if (!username) return res.status(400).json({ success: false, message: '请输入用户名' });
    const [users] = await db.execute('SELECT id, grade FROM users WHERE username = ?', [username]);
    if (users.length === 0) return res.status(404).json({ success: false, message: '用户不存在' });
    const newGrade = grade || 6;
    if (newGrade >= req.user.grade) return res.status(403).json({ success: false, message: '不能设置高于自身的等级' });
    await db.execute('UPDATE users SET grade = ?, faction = ? WHERE id = ?', [newGrade, faction || '逍遥派', users[0].id]);
    res.json({ success: true, message: '管理员已添加' });
  } catch (err) {
    res.status(500).json({ success: false, message: '添加管理员失败' });
  }
};

exports.updateManager = async (req, res) => {
  try {
    const { grade, faction } = req.body;
    const [users] = await db.execute('SELECT id, grade FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ success: false, message: '用户不存在' });
    if (users[0].grade >= req.user.grade) return res.status(403).json({ success: false, message: '不能修改同级或更高等级' });
    const fields = [];
    const params = [];
    if (grade !== undefined && grade < req.user.grade) { fields.push('grade = ?'); params.push(grade); }
    if (faction !== undefined) { fields.push('faction = ?'); params.push(faction); }
    if (fields.length === 0) return res.status(400).json({ success: false, message: '没有需要更新的字段' });
    params.push(req.params.id);
    await db.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: '管理员已更新' });
  } catch (err) {
    res.status(500).json({ success: false, message: '更新管理员失败' });
  }
};

exports.removeManager = async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, grade FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ success: false, message: '用户不存在' });
    if (users[0].grade >= req.user.grade) return res.status(403).json({ success: false, message: '不能开除同级或更高等级' });
    await db.execute("UPDATE users SET grade = 1, faction = '无', sect_title = '无' WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: '管理员已开除' });
  } catch (err) {
    res.status(500).json({ success: false, message: '开除管理员失败' });
  }
};

exports.getNews = async (req, res) => {
  try {
    const [news] = await db.execute('SELECT * FROM news ORDER BY created_at DESC');
    res.json({ success: true, data: news });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询公告失败' });
  }
};

exports.createNews = async (req, res) => {
  try {
    const { topic, content } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: '请输入公告标题' });
    await db.execute('INSERT INTO news (topic, content, author) VALUES (?, ?, ?)', [topic, content || null, req.user.username]);
    res.json({ success: true, message: '公告已发布' });
  } catch (err) {
    res.status(500).json({ success: false, message: '发布公告失败' });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const { topic, content } = req.body;
    await db.execute('UPDATE news SET topic = ?, content = ? WHERE id = ?', [topic, content, req.params.id]);
    res.json({ success: true, message: '公告已修改' });
  } catch (err) {
    res.status(500).json({ success: false, message: '修改公告失败' });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    await db.execute('DELETE FROM news WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '公告已删除' });
  } catch (err) {
    res.status(500).json({ success: false, message: '删除公告失败' });
  }
};

exports.getConfig = async (req, res) => {
  try {
    const [configs] = await db.execute('SELECT id, name, value, description FROM system_config ORDER BY name');
    res.json({ success: true, data: configs });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询配置失败' });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const { value } = req.body;
    await db.execute('UPDATE system_config SET value = ? WHERE name = ?', [value, req.params.name]);
    res.json({ success: true, message: '配置已更新' });
  } catch (err) {
    res.status(500).json({ success: false, message: '修改配置失败' });
  }
};

exports.getRooms = async (req, res) => {
  try {
    const [rooms] = await db.execute('SELECT * FROM chat_rooms ORDER BY sort_order');
    res.json({ success: true, data: rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询房间失败' });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const { name, min_grade, max_grade, fight_enabled, sort_order } = req.body;
    if (!name) return res.status(400).json({ success: false, message: '请输入房间名称' });
    await db.execute(
      'INSERT INTO chat_rooms (name, min_grade, max_grade, fight_enabled, sort_order) VALUES (?, ?, ?, ?, ?)',
      [name, min_grade || 0, max_grade || 10, fight_enabled !== undefined ? fight_enabled : 1, sort_order || 0]
    );
    res.json({ success: true, message: '房间已创建' });
  } catch (err) {
    res.status(500).json({ success: false, message: '创建房间失败' });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const { name, min_grade, max_grade, fight_enabled, sort_order } = req.body;
    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (min_grade !== undefined) { fields.push('min_grade = ?'); params.push(min_grade); }
    if (max_grade !== undefined) { fields.push('max_grade = ?'); params.push(max_grade); }
    if (fight_enabled !== undefined) { fields.push('fight_enabled = ?'); params.push(fight_enabled); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); params.push(sort_order); }
    if (fields.length === 0) return res.status(400).json({ success: false, message: '没有需要更新的字段' });
    params.push(req.params.id);
    await db.execute(`UPDATE chat_rooms SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: '房间已更新' });
  } catch (err) {
    res.status(500).json({ success: false, message: '修改房间失败' });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    await db.execute('DELETE FROM chat_rooms WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '房间已删除' });
  } catch (err) {
    res.status(500).json({ success: false, message: '删除房间失败' });
  }
};

exports.getIpLocks = async (req, res) => {
  try {
    const [locks] = await db.execute('SELECT * FROM ip_locks ORDER BY locked_at DESC');
    res.json({ success: true, data: locks });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询IP封锁失败' });
  }
};

exports.createIpLock = async (req, res) => {
  try {
    const { ip, hours } = req.body;
    if (!ip) return res.status(400).json({ success: false, message: '请输入IP地址' });
    await db.execute(
      'INSERT INTO ip_locks (ip, locked_by, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))',
      [ip, req.user.username, hours || 24]
    );
    res.json({ success: true, message: 'IP已临时封锁' });
  } catch (err) {
    res.status(500).json({ success: false, message: '封锁IP失败' });
  }
};

exports.deleteIpLock = async (req, res) => {
  try {
    await db.execute('DELETE FROM ip_locks WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'IP已解封' });
  } catch (err) {
    res.status(500).json({ success: false, message: '解封IP失败' });
  }
};

exports.getIpBans = async (req, res) => {
  try {
    const [bans] = await db.execute('SELECT * FROM ip_bans ORDER BY created_at DESC');
    res.json({ success: true, data: bans });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询IP永久封锁失败' });
  }
};

exports.createIpBan = async (req, res) => {
  try {
    const { ip_pattern } = req.body;
    if (!ip_pattern) return res.status(400).json({ success: false, message: '请输入IP或通配符' });
    await db.execute('INSERT INTO ip_bans (ip_pattern) VALUES (?)', [ip_pattern]);
    res.json({ success: true, message: 'IP已永久封锁' });
  } catch (err) {
    res.status(500).json({ success: false, message: '永久封锁IP失败' });
  }
};

exports.deleteIpBan = async (req, res) => {
  try {
    await db.execute('DELETE FROM ip_bans WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'IP已解封' });
  } catch (err) {
    res.status(500).json({ success: false, message: '解封IP失败' });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, operator } = req.query;
    const offset = (page - 1) * limit;
    let where = '1=1';
    const params = [];
    if (operator) { where += ' AND operator = ?'; params.push(operator); }
    const [logs] = await db.execute(
      `SELECT * FROM operation_logs WHERE ${where} ORDER BY log_time DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询日志失败' });
  }
};

exports.clearLogs = async (req, res) => {
  try {
    await db.execute('UPDATE operation_logs SET is_expired = 1 WHERE is_expired = 0');
    res.json({ success: true, message: '日志已清除' });
  } catch (err) {
    res.status(500).json({ success: false, message: '清除日志失败' });
  }
};

exports.getItems = async (req, res) => {
  try {
    const [items] = await db.execute('SELECT * FROM items ORDER BY id DESC LIMIT 100');
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询物品失败' });
  }
};

exports.createItem = async (req, res) => {
  try {
    const { name, owner, type, attack, defense, quantity, neili_bonus, tili_bonus } = req.body;
    if (!name) return res.status(400).json({ success: false, message: '请输入物品名称' });
    await db.execute(
      `INSERT INTO items (name, owner, type, attack, defense, quantity, neili_bonus, tili_bonus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, owner || '无', type || null, attack || 0, defense || 0, quantity || 1, neili_bonus || 0, tili_bonus || 0]
    );
    res.json({ success: true, message: '物品已添加' });
  } catch (err) {
    res.status(500).json({ success: false, message: '添加物品失败' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { name, type, attack, defense, quantity } = req.body;
    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (type !== undefined) { fields.push('type = ?'); params.push(type); }
    if (attack !== undefined) { fields.push('attack = ?'); params.push(attack); }
    if (defense !== undefined) { fields.push('defense = ?'); params.push(defense); }
    if (quantity !== undefined) { fields.push('quantity = ?'); params.push(quantity); }
    if (fields.length === 0) return res.status(400).json({ success: false, message: '没有需要更新的字段' });
    params.push(req.params.id);
    await db.execute(`UPDATE items SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: '物品已修改' });
  } catch (err) {
    res.status(500).json({ success: false, message: '修改物品失败' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    await db.execute('DELETE FROM items WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '物品已删除' });
  } catch (err) {
    res.status(500).json({ success: false, message: '删除物品失败' });
  }
};

exports.getDrugs = async (req, res) => {
  try {
    const [drugs] = await db.execute('SELECT * FROM alchemy_items ORDER BY id DESC LIMIT 100');
    res.json({ success: true, data: drugs });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询药品失败' });
  }
};

exports.createDrug = async (req, res) => {
  try {
    const { name, potency, quantity } = req.body;
    if (!name) return res.status(400).json({ success: false, message: '请输入药品名称' });
    await db.execute(
      'INSERT INTO alchemy_items (name, owner, quantity, potency) VALUES (?, ?, ?, ?)',
      [name, '无', quantity || 1, potency || 0]
    );
    res.json({ success: true, message: '药品已添加' });
  } catch (err) {
    res.status(500).json({ success: false, message: '添加药品失败' });
  }
};

exports.updateDrug = async (req, res) => {
  try {
    const { name, potency, quantity } = req.body;
    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (potency !== undefined) { fields.push('potency = ?'); params.push(potency); }
    if (quantity !== undefined) { fields.push('quantity = ?'); params.push(quantity); }
    if (fields.length === 0) return res.status(400).json({ success: false, message: '没有需要更新的字段' });
    params.push(req.params.id);
    await db.execute(`UPDATE alchemy_items SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: '药品已修改' });
  } catch (err) {
    res.status(500).json({ success: false, message: '修改药品失败' });
  }
};

exports.deleteDrug = async (req, res) => {
  try {
    await db.execute('DELETE FROM alchemy_items WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '药品已删除' });
  } catch (err) {
    res.status(500).json({ success: false, message: '删除药品失败' });
  }
};

exports.getCards = async (req, res) => {
  try {
    const [cards] = await db.execute('SELECT * FROM card_templates ORDER BY id');
    res.json({ success: true, data: cards });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询卡片失败' });
  }
};

exports.createCard = async (req, res) => {
  try {
    const { name, description, price, card_type } = req.body;
    if (!name) return res.status(400).json({ success: false, message: '请输入卡片名称' });
    await db.execute(
      'INSERT INTO card_templates (name, description, price, card_type) VALUES (?, ?, ?, ?)',
      [name, description || null, price || 0, card_type || 'normal']
    );
    res.json({ success: true, message: '卡片已添加' });
  } catch (err) {
    res.status(500).json({ success: false, message: '添加卡片失败' });
  }
};

exports.updateCard = async (req, res) => {
  try {
    const { name, description, price, card_type } = req.body;
    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (price !== undefined) { fields.push('price = ?'); params.push(price); }
    if (card_type !== undefined) { fields.push('card_type = ?'); params.push(card_type); }
    if (fields.length === 0) return res.status(400).json({ success: false, message: '没有需要更新的字段' });
    params.push(req.params.id);
    await db.execute(`UPDATE card_templates SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: '卡片已修改' });
  } catch (err) {
    res.status(500).json({ success: false, message: '修改卡片失败' });
  }
};

exports.deleteCard = async (req, res) => {
  try {
    await db.execute('DELETE FROM card_templates WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '卡片已删除' });
  } catch (err) {
    res.status(500).json({ success: false, message: '删除卡片失败' });
  }
};

exports.getVips = async (req, res) => {
  try {
    const [vips] = await db.execute(
      'SELECT id, username, is_vip, vip_expires_at, silver FROM users WHERE is_vip = 1 ORDER BY vip_expires_at DESC'
    );
    res.json({ success: true, data: vips });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询会员失败' });
  }
};

exports.updateVip = async (req, res) => {
  try {
    const { is_vip, vip_days } = req.body;
    if (is_vip !== undefined) {
      if (is_vip) {
        await db.execute(
          'UPDATE users SET is_vip = 1, vip_expires_at = DATE_ADD(IFNULL(vip_expires_at, NOW()), INTERVAL ? DAY) WHERE id = ?',
          [vip_days || 30, req.params.id]
        );
      } else {
        await db.execute('UPDATE users SET is_vip = 0, vip_expires_at = NULL WHERE id = ?', [req.params.id]);
      }
    }
    res.json({ success: true, message: '会员信息已更新' });
  } catch (err) {
    res.status(500).json({ success: false, message: '编辑会员失败' });
  }
};

exports.statsOnline = async (req, res) => {
  try {
    const [online] = await db.execute('SELECT COUNT(*) as count FROM online_users');
    const [byRoom] = await db.execute('SELECT room_id, COUNT(*) as count FROM online_users GROUP BY room_id ORDER BY count DESC');
    res.json({ success: true, data: { total: online[0].count, byRoom } });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询在线统计失败' });
  }
};

exports.statsRegistration = async (req, res) => {
  try {
    const [total] = await db.execute('SELECT COUNT(*) as count FROM users WHERE status != ?', ['dead']);
    const [today] = await db.execute('SELECT COUNT(*) as count FROM users WHERE DATE(registered_at) = CURDATE()');
    const [thisMonth] = await db.execute('SELECT COUNT(*) as count FROM users WHERE YEAR(registered_at) = YEAR(NOW()) AND MONTH(registered_at) = MONTH(NOW())');
    res.json({ success: true, data: { total: total[0].count, today: today[0].count, thisMonth: thisMonth[0].count } });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询注册统计失败' });
  }
};

exports.statsChat = async (req, res) => {
  try {
    const [today] = await db.execute('SELECT COUNT(*) as count FROM chat_messages WHERE DATE(created_at) = CURDATE()');
    const [total] = await db.execute('SELECT COUNT(*) as count FROM chat_messages');
    res.json({ success: true, data: { today: today[0].count, total: total[0].count } });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询聊天统计失败' });
  }
};

exports.statsEconomy = async (req, res) => {
  try {
    const [silver] = await db.execute('SELECT SUM(silver) as total_silver, AVG(silver) as avg_silver FROM users WHERE status != ?', ['dead']);
    const [deposit] = await db.execute('SELECT SUM(deposit) as total_deposit FROM users WHERE status != ?', ['dead']);
    res.json({ success: true, data: { totalSilver: silver[0].total_silver || 0, avgSilver: Math.floor(silver[0].avg_silver || 0), totalDeposit: deposit[0].total_deposit || 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询经济统计失败' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ success: false, message: '请输入旧密码和新密码' });
    const [users] = await db.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const bcrypt = require('bcryptjs');
    const valid = await bcrypt.compare(oldPassword, users[0].password);
    if (!valid) return res.status(401).json({ success: false, message: '旧密码错误' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ success: true, message: '密码修改成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '修改密码失败' });
  }
};
