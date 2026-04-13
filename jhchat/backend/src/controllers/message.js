const db = require('../config/db');

exports.getInbox = async (req, res) => {
  try {
    const [msgs] = await db.execute(
      'SELECT * FROM messages WHERE receiver = ? ORDER BY sent_at DESC', [req.user.username]
    );
    res.json({ success: true, data: msgs });
  } catch (err) { res.status(500).json({ success: false, message: '查询失败' }); }
};

exports.getSent = async (req, res) => {
  try {
    const [msgs] = await db.execute(
      'SELECT * FROM messages WHERE sender = ? ORDER BY sent_at DESC', [req.user.username]
    );
    res.json({ success: true, data: msgs });
  } catch (err) { res.status(500).json({ success: false, message: '查询失败' }); }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const [result] = await db.execute(
      'SELECT COUNT(*) as cnt FROM messages WHERE receiver = ? AND is_read = 0', [req.user.username]
    );
    res.json({ success: true, data: { count: result[0].cnt } });
  } catch (err) { res.status(500).json({ success: false, message: '查询失败' }); }
};

exports.getOne = async (req, res) => {
  try {
    const [msgs] = await db.execute('SELECT * FROM messages WHERE id = ?', [req.params.id]);
    if (msgs.length === 0) return res.status(404).json({ success: false, message: '邮件不存在' });
    const msg = msgs[0];
    if (msg.receiver === req.user.username && !msg.is_read) {
      await db.execute('UPDATE messages SET is_read = 1 WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true, data: msg });
  } catch (err) { res.status(500).json({ success: false, message: '查询失败' }); }
};

exports.send = async (req, res) => {
  try {
    const { receiver, title, content } = req.body;
    if (!receiver || !title) return res.status(400).json({ success: false, message: '收件人和标题必填' });
    const [target] = await db.execute('SELECT id FROM users WHERE username = ?', [receiver]);
    if (target.length === 0) return res.status(404).json({ success: false, message: '收件人不存在' });
    await db.execute(
      'INSERT INTO messages (receiver, sender, title, content) VALUES (?, ?, ?, ?)',
      [receiver, req.user.username, title, content || '']
    );
    res.json({ success: true, message: '发送成功' });
  } catch (err) { res.status(500).json({ success: false, message: '发送失败' }); }
};

exports.deleteOne = async (req, res) => {
  try {
    await db.execute('DELETE FROM messages WHERE id = ? AND (receiver = ? OR sender = ?)',
      [req.params.id, req.user.username, req.user.username]);
    res.json({ success: true, message: '已删除' });
  } catch (err) { res.status(500).json({ success: false, message: '删除失败' }); }
};

exports.clearInbox = async (req, res) => {
  try {
    await db.execute('DELETE FROM messages WHERE receiver = ?', [req.user.username]);
    res.json({ success: true, message: '收件箱已清空' });
  } catch (err) { res.status(500).json({ success: false, message: '操作失败' }); }
};

exports.clearSent = async (req, res) => {
  try {
    await db.execute('DELETE FROM messages WHERE sender = ?', [req.user.username]);
    res.json({ success: true, message: '发件箱已清空' });
  } catch (err) { res.status(500).json({ success: false, message: '操作失败' }); }
};
