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

// ==================== 商店物品管理 ====================

// 获取商店物品列表
exports.getShopItems = async (req, res) => {
  try {
    const [items] = await db.execute(
      'SELECT * FROM shop_items ORDER BY sort_no, id'
    );
    res.json({ success: true, data: items });
  } catch (err) {
    console.error('Get shop items error:', err);
    res.status(500).json({ success: false, message: '查询商店物品失败' });
  }
};

// 添加商店物品
exports.createShopItem = async (req, res) => {
  try {
    const { name, type, attack, defense, neili_bonus, tili_bonus, price, image_file, description, stock_quantity, sort_no } = req.body;
    if (!name) return res.status(400).json({ success: false, message: '请输入物品名称' });
    if (!type) return res.status(400).json({ success: false, message: '请选择物品类型' });
    
    await db.execute(
      `INSERT INTO shop_items (name, type, attack, defense, neili_bonus, tili_bonus, price, image_file, description, stock_quantity, sort_no)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, type, attack || 0, defense || 0, neili_bonus || 0, tili_bonus || 0, price || 0, image_file || '', description || '', stock_quantity || 999, sort_no || 0]
    );
    res.json({ success: true, message: '物品已添加到商店' });
  } catch (err) {
    console.error('Create shop item error:', err);
    res.status(500).json({ success: false, message: '添加物品失败' });
  }
};

// 更新商店物品
exports.updateShopItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, attack, defense, neili_bonus, tili_bonus, price, image_file, description, is_enabled, stock_quantity, sort_no } = req.body;
    
    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (type !== undefined) { fields.push('type = ?'); params.push(type); }
    if (attack !== undefined) { fields.push('attack = ?'); params.push(attack); }
    if (defense !== undefined) { fields.push('defense = ?'); params.push(defense); }
    if (neili_bonus !== undefined) { fields.push('neili_bonus = ?'); params.push(neili_bonus); }
    if (tili_bonus !== undefined) { fields.push('tili_bonus = ?'); params.push(tili_bonus); }
    if (price !== undefined) { fields.push('price = ?'); params.push(price); }
    if (image_file !== undefined) { fields.push('image_file = ?'); params.push(image_file); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (is_enabled !== undefined) { fields.push('is_enabled = ?'); params.push(is_enabled); }
    if (stock_quantity !== undefined) { fields.push('stock_quantity = ?'); params.push(stock_quantity); }
    if (sort_no !== undefined) { fields.push('sort_no = ?'); params.push(sort_no); }
    
    if (fields.length === 0) return res.status(400).json({ success: false, message: '没有要更新的字段' });
    
    params.push(id);
    const sql = `UPDATE shop_items SET ${fields.join(', ')} WHERE id = ?`;
    
    await db.execute(sql, params);
    res.json({ success: true, message: '物品信息已更新' });
  } catch (err) {
    console.error('Update shop item error:', err);
    res.status(500).json({ success: false, message: '更新物品失败' });
  }
};

// 删除商店物品
exports.deleteShopItem = async (req, res) => {
  try {
    const [items] = await db.execute('SELECT * FROM shop_items WHERE id = ?', [req.params.id]);
    if (items.length === 0) return res.status(404).json({ success: false, message: '物品不存在' });
    
    const item = items[0];
    if (item.stock_quantity < 999) {
      await db.execute('UPDATE shop_items SET is_enabled = 0 WHERE id = ?', [req.params.id]);
      res.json({ success: true, message: '物品已下架（该物品已有销售记录，无法彻底删除）' });
    } else {
      await db.execute('DELETE FROM shop_items WHERE id = ?', [req.params.id]);
      res.json({ success: true, message: '物品已删除' });
    }
  } catch (err) {
    console.error('Delete shop item error:', err);
    res.status(500).json({ success: false, message: '删除物品失败' });
  }
};

// 补充库存
exports.restockShopItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) return res.status(400).json({ success: false, message: '请输入有效的补货数量' });
    
    await db.execute(
      'UPDATE shop_items SET stock_quantity = stock_quantity + ? WHERE id = ?',
      [quantity, id]
    );
    res.json({ success: true, message: '补货成功' });
  } catch (err) {
    console.error('Restock shop item error:', err);
    res.status(500).json({ success: false, message: '补货失败' });
  }
};

// 随机事件管理
exports.getRandomEvents = async (req, res) => {
  try {
    const { page = 1, limit = 20, eventType, isEnabled } = req.query;
    const offset = (page - 1) * limit;
    let where = '1=1';
    const params = [];
    
    if (eventType) { where += ' AND event_type = ?'; params.push(eventType); }
    if (isEnabled !== undefined) { where += ' AND is_enabled = ?'; params.push(isEnabled === 'true' ? 1 : 0); }
    
    const [events] = await db.execute(
      `SELECT * FROM random_events WHERE ${where} ORDER BY sort_order ASC, id DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    const [countResult] = await db.execute(`SELECT COUNT(*) as total FROM random_events WHERE ${where}`, params);
    
    res.json({ success: true, data: { events, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    console.error('Get random events error:', err);
    res.status(500).json({ success: false, message: '查询随机事件列表失败' });
  }
};

exports.getRandomEventDetail = async (req, res) => {
  try {
    const [events] = await db.execute('SELECT * FROM random_events WHERE id = ?', [req.params.id]);
    if (events.length === 0) return res.status(404).json({ success: false, message: '事件不存在' });
    res.json({ success: true, data: events[0] });
  } catch (err) {
    console.error('Get random event detail error:', err);
    res.status(500).json({ success: false, message: '查询事件详情失败' });
  }
};

exports.createRandomEvent = async (req, res) => {
  try {
    const {
      event_name, event_type, message_template, effect_type, effect_value_min,
      effect_value_max, probability, cooldown_minutes, min_grade, is_enabled, is_global, icon, sort_order
    } = req.body;
    
    if (!event_name || !event_type || !message_template) {
      return res.status(400).json({ success: false, message: '事件名称、类型和消息模板为必填项' });
    }
    
    await db.execute(
      `INSERT INTO random_events (
        event_name, event_type, message_template, effect_type, effect_value_min, effect_value_max,
        probability, cooldown_minutes, min_grade, is_enabled, is_global, icon, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event_name, event_type, message_template, effect_type || 'none',
        effect_value_min || 0, effect_value_max || 0, probability || 100,
        cooldown_minutes || 30, min_grade || 1, is_enabled ? 1 : 0,
        is_global ? 1 : 0, icon || null, sort_order || 0
      ]
    );
    
    res.json({ success: true, message: '随机事件已创建' });
  } catch (err) {
    console.error('Create random event error:', err);
    res.status(500).json({ success: false, message: '创建随机事件失败' });
  }
};

exports.updateRandomEvent = async (req, res) => {
  try {
    const {
      event_name, event_type, message_template, effect_type, effect_value_min,
      effect_value_max, probability, cooldown_minutes, min_grade, is_enabled, is_global, icon, sort_order
    } = req.body;
    
    const fields = [];
    const params = [];
    
    if (event_name !== undefined) { fields.push('event_name = ?'); params.push(event_name); }
    if (event_type !== undefined) { fields.push('event_type = ?'); params.push(event_type); }
    if (message_template !== undefined) { fields.push('message_template = ?'); params.push(message_template); }
    if (effect_type !== undefined) { fields.push('effect_type = ?'); params.push(effect_type); }
    if (effect_value_min !== undefined) { fields.push('effect_value_min = ?'); params.push(effect_value_min); }
    if (effect_value_max !== undefined) { fields.push('effect_value_max = ?'); params.push(effect_value_max); }
    if (probability !== undefined) { fields.push('probability = ?'); params.push(probability); }
    if (cooldown_minutes !== undefined) { fields.push('cooldown_minutes = ?'); params.push(cooldown_minutes); }
    if (min_grade !== undefined) { fields.push('min_grade = ?'); params.push(min_grade); }
    if (is_enabled !== undefined) { fields.push('is_enabled = ?'); params.push(is_enabled ? 1 : 0); }
    if (is_global !== undefined) { fields.push('is_global = ?'); params.push(is_global ? 1 : 0); }
    if (icon !== undefined) { fields.push('icon = ?'); params.push(icon); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); params.push(sort_order); }
    
    if (fields.length === 0) return res.status(400).json({ success: false, message: '没有需要更新的字段' });
    
    params.push(req.params.id);
    await db.execute(`UPDATE random_events SET ${fields.join(', ')} WHERE id = ?`, params);
    
    res.json({ success: true, message: '随机事件已更新' });
  } catch (err) {
    console.error('Update random event error:', err);
    res.status(500).json({ success: false, message: '更新随机事件失败' });
  }
};

exports.deleteRandomEvent = async (req, res) => {
  try {
    await db.execute('DELETE FROM random_events WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '随机事件已删除' });
  } catch (err) {
    console.error('Delete random event error:', err);
    res.status(500).json({ success: false, message: '删除随机事件失败' });
  }
};

exports.toggleRandomEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查询当前状态
    const [events] = await db.execute('SELECT is_enabled FROM random_events WHERE id = ?', [id]);
    if (events.length === 0) return res.status(404).json({ success: false, message: '事件不存在' });
    
    // 切换状态
    const newStatus = events[0].is_enabled ? 0 : 1;
    await db.execute('UPDATE random_events SET is_enabled = ? WHERE id = ?', [newStatus, id]);
    
    res.json({ success: true, message: newStatus ? '事件已启用' : '事件已禁用' });
  } catch (err) {
    console.error('Toggle random event error:', err);
    res.status(500).json({ success: false, message: '切换事件状态失败' });
  }
};

exports.triggerRandomEvent = async (req, res) => {
  try {
    const { event_id, target_user_id } = req.body;
    
    if (!event_id) return res.status(400).json({ success: false, message: '事件 ID 不能为空' });
    
    // 查询事件详情
    const [events] = await db.execute('SELECT * FROM random_events WHERE id = ? AND is_enabled = 1', [event_id]);
    if (events.length === 0) return res.status(404).json({ success: false, message: '事件不存在或未启用' });
    
    const event = events[0];
    
    // 根据效果类型计算效果值
    let effect_value = 0;
    if (event.effect_type !== 'none') {
      // 效果类型不为 none 时都计算效果值
      if (event.effect_type === 'all') {
        // 全属性提升，效果值使用固定值或小范围
        effect_value = Math.floor(Math.random() * (event.effect_value_max - event.effect_value_min + 1)) + event.effect_value_min;
      } else {
        const min = event.effect_value_min;
        const max = event.effect_value_max;
        effect_value = Math.floor(Math.random() * (Math.abs(max - min + 1))) + Math.min(min, max);
      }
    }
    
    const io = req.app.get('io');
    
    // 全服事件处理
    if (event.is_global === 1) {
      // 获取所有在线用户
      const [onlineUsers] = await db.execute(
        'SELECT user_id, id as online_id FROM online_users'
      );
      
      const affectedUsers = [];
      
      // 对每个在线用户应用效果
      if (event.effect_type !== 'none' && onlineUsers.length > 0) {
        for (const user of onlineUsers) {
          const uid = user.user_id;
          
          if (event.effect_type === 'silver') {
            await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [effect_value, uid]);
          } else if (event.effect_type === 'neili') {
            await db.execute('UPDATE users SET neili = GREATEST(0, neili + ?) WHERE id = ?', [effect_value, uid]);
          } else if (event.effect_type === 'tili') {
            await db.execute('UPDATE users SET tili = GREATEST(0, tili + ?) WHERE id = ?', [effect_value, uid]);
          } else if (event.effect_type === 'wugong') {
            await db.execute('UPDATE users SET grade = grade + ? WHERE id = ? AND grade < 10', [Math.floor(effect_value / 10) || 1, uid]);
          } else if (event.effect_type === 'all') {
            await db.execute(
              'UPDATE users SET silver = silver + ?, neili = neili + ?, tili = tili + ? WHERE id = ?',
              [effect_value, effect_value, effect_value, uid]
            );
          }
          
          const [userRows] = await db.execute('SELECT username FROM users WHERE id = ?', [uid]);
          affectedUsers.push({
            user_id: uid,
            username: userRows[0]?.username || 'Unknown'
          });
        }
      }
      
      // 记录日志
      await db.execute(
        'INSERT INTO random_event_logs (event_id, event_name, event_type, message, affected_users) VALUES (?, ?, ?, ?, ?)',
        [event_id, event.event_name, event.event_type, event.message_template, JSON.stringify(affectedUsers)]
      );
      
      // 全服广播
      if (io) {
        io.emit('chat:system', {
          content: `【全服事件】${event.message_template.replace('{amount}', Math.abs(effect_value))}`,
          type: 'global_event'
        });
      }
      
      res.json({ 
        success: true, 
        message: `全服事件 ${event.event_name} 已触发，影响 ${affectedUsers.length} 名在线玩家`, 
        data: { 
          event, 
          effect_type: event.effect_type, 
          effect_value: effect_value,
          affected_users_count: affectedUsers.length,
          is_global: true
        } 
      });
      
    } else {
      // 单体事件处理
      const userId = target_user_id || req.user.id;
      
      if (event.effect_type !== 'none') {
        let effectField = '';
        if (event.effect_type === 'silver') effectField = 'silver';
        else if (event.effect_type === 'neili') effectField = 'neili';
        else if (event.effect_type === 'tili') effectField = 'tili';
        else if (event.effect_type === 'wugong') effectField = 'wugong_level';
        else if (event.effect_type === 'all') {
          await db.execute(
            `UPDATE users SET silver = silver + ?, neili = neili + ?, tili = tili + ? WHERE id = ?`,
            [effect_value, effect_value, effect_value, userId]
          );
        }
        
        if (effectField) {
          await db.execute(
            `UPDATE users SET ${effectField} = ${effectField} + ? WHERE id = ?`,
            [effect_value, userId]
          );
        }
      }
      
      await db.execute(
        'INSERT INTO user_event_logs (user_id, event_id, event_type, event_name, effect_type, effect_value) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, event_id, event.event_type, event.event_name, event.effect_type, effect_value]
      );
      
      res.json({ 
        success: true, 
        message: `触发了 ${event.event_name}`, 
        data: { 
          event, 
          effect_type: event.effect_type, 
          effect_value: effect_value,
          is_global: false
        } 
      });
    }
  } catch (err) {
    console.error('Trigger random event error:', err);
    res.status(500).json({ success: false, message: '触发随机事件失败' });
  }
};

// 获取用户 IP 日志（任务 7）
exports.getUserIpLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, user_id, ip_type } = req.query;
    const offset = (page - 1) * limit;
    let where = '1=1';
    const params = [];
    
    if (user_id) { 
      where += ' AND l.user_id = ?'; 
      params.push(user_id); 
    }
    if (ip_type) { 
      where += ' AND l.ip_type = ?'; 
      params.push(ip_type); 
    }
    
    const [logs] = await db.execute(
      `SELECT l.*, u.username 
       FROM user_ip_logs l 
       LEFT JOIN users u ON l.user_id = u.id 
       WHERE ${where} 
       ORDER BY l.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM user_ip_logs l WHERE ${where}`, 
      params
    );
    
    res.json({ 
      success: true, 
      data: { logs, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) } 
    });
  } catch (err) {
    console.error('Get IP logs error:', err);
    res.status(500).json({ success: false, message: '查询 IP 日志失败' });
  }
};
