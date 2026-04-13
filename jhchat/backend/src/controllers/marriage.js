const db = require('../config/db');

exports.proposals = async (req, res) => {
  try {
    const [proposals] = await db.execute(
      `SELECT m.id, m.proposer, m.target, m.message, m.proposed_at
       FROM marriages m WHERE m.is_expired = 0 AND (m.proposer = ? OR m.target = ?)
       ORDER BY m.proposed_at DESC`,
      [req.user.username, req.user.username]
    );
    res.json({ success: true, data: proposals });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询求婚列表失败' });
  }
};

exports.propose = async (req, res) => {
  try {
    const { target, message } = req.body;
    if (!target) return res.status(400).json({ success: false, message: '请指定征婚对象' });
    const [self] = await db.execute('SELECT spouse, gender FROM users WHERE id = ?', [req.user.id]);
    if (self[0].spouse !== '无') return res.status(400).json({ success: false, message: '您已有配偶' });
    const [targets] = await db.execute('SELECT id, spouse, gender FROM users WHERE username = ?', [target]);
    if (targets.length === 0) return res.status(404).json({ success: false, message: '对方不存在' });
    if (targets[0].gender === self[0].gender) return res.status(400).json({ success: false, message: '同性不能结婚' });
    if (targets[0].spouse !== '无') return res.status(400).json({ success: false, message: '对方已有配偶' });
    const [existing] = await db.execute(
      'SELECT id FROM marriages WHERE is_expired = 0 AND proposer = ? AND target = ?',
      [req.user.username, target]
    );
    if (existing.length > 0) return res.status(400).json({ success: false, message: '您已向对方求过婚' });
    await db.execute(
      'INSERT INTO marriages (proposer, target, message) VALUES (?, ?, ?)',
      [req.user.username, target, message || null]
    );
    res.json({ success: true, message: '征婚登记成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '征婚登记失败' });
  }
};

exports.accept = async (req, res) => {
  try {
    const { proposalId } = req.body;
    const [proposals] = await db.execute(
      'SELECT id, proposer, target FROM marriages WHERE id = ? AND is_expired = 0',
      [proposalId]
    );
    if (proposals.length === 0) return res.status(404).json({ success: false, message: '求婚记录不存在' });
    const proposal = proposals[0];
    if (proposal.target !== req.user.username) return res.status(403).json({ success: false, message: '只能接受发给自己的求婚' });
    await db.execute('UPDATE users SET spouse = ? WHERE username = ?', [proposal.target, proposal.proposer]);
    await db.execute('UPDATE users SET spouse = ? WHERE username = ?', [proposal.proposer, proposal.target]);
    await db.execute('UPDATE marriages SET is_expired = 1 WHERE id = ?', [proposal.id]);
    await db.execute('UPDATE marriages SET is_expired = 1 WHERE is_expired = 0 AND (proposer = ? OR target = ?) AND id != ?',
      [proposal.proposer, proposal.target, proposal.id]);
    res.json({ success: true, message: '结婚成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '同意结婚失败' });
  }
};

exports.divorce = async (req, res) => {
  try {
    const [users] = await db.execute('SELECT spouse FROM users WHERE id = ?', [req.user.id]);
    if (users[0].spouse === '无') return res.status(400).json({ success: false, message: '您没有配偶' });
    const spouseName = users[0].spouse;
    await db.execute('UPDATE users SET spouse = ? WHERE id = ?', ['无', req.user.id]);
    await db.execute('UPDATE users SET spouse = ? WHERE username = ?', ['无', spouseName]);
    res.json({ success: true, message: '离婚成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '离婚失败' });
  }
};

exports.getInn = async (req, res) => {
  try {
    const [records] = await db.execute(
      'SELECT id, registrant, partner, message, registered_at FROM inn_records ORDER BY registered_at DESC LIMIT 50'
    );
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询客栈记录失败' });
  }
};

exports.postInn = async (req, res) => {
  try {
    const [users] = await db.execute('SELECT spouse, gender FROM users WHERE id = ?', [req.user.id]);
    if (users[0].spouse === '无') return res.status(400).json({ success: false, message: '需要配偶才能入住' });
    const { message } = req.body;
    await db.execute(
      'INSERT INTO inn_records (registrant, partner, message) VALUES (?, ?, ?)',
      [req.user.username, users[0].spouse, message || null]
    );
    res.json({ success: true, message: '入住客栈成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '入住客栈失败' });
  }
};
