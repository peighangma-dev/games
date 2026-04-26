const db = require('../config/db');

exports.rankings = async (req, res) => {
  try {
    const { type = 'total_exp' } = req.query;
    const allowedTypes = ['total_exp', 'silver', 'grade', 'wugong', 'neili', 'charm', 'attack_power'];
    const sortField = allowedTypes.includes(type) ? type : 'total_exp';
    const [users] = await db.execute(
      `SELECT id, username, gender, sect, grade, ${sortField} as value, avatar
       FROM users WHERE status != 'dead' ORDER BY ${sortField} DESC LIMIT 50`
    );
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询排行榜失败' });
  }
};

exports.getWishes = async (req, res) => {
  try {
    const [wishes] = await db.execute(
      'SELECT id, name as username, gender, wish_type, content, is_public, created_at FROM wishes ORDER BY created_at DESC LIMIT 50'
    );
    res.json({ success: true, data: wishes });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询许愿墙失败' });
  }
};

exports.postWish = async (req, res) => {
  try {
    const { content, wishType } = req.body;
    if (!content) return res.status(400).json({ success: false, message: '请输入愿望内容' });
    await db.execute(
      'INSERT INTO wishes (name, gender, wish_type, content, ip) VALUES (?, ?, ?, ?, ?)',
      [req.user.username, req.user.gender, wishType || null, content, req.ip]
    );
    res.json({ success: true, message: '许愿成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '许愿失败' });
  }
};

exports.getVotes = async (req, res) => {
  try {
    const [config] = await db.execute('SELECT * FROM poll_config WHERE is_active = 1 LIMIT 1');
    const [candidates] = await db.execute(
      'SELECT id, name, vote_count FROM poll_candidates ORDER BY vote_count DESC'
    );
    const [myVote] = await db.execute(
      'SELECT candidate_id FROM poll_votes WHERE voter = ?', [req.user.username]
    );
    res.json({ success: true, data: { config: config[0] || null, candidates, voted: myVote.length > 0 ? myVote[0].candidate_id : null } });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询投票失败' });
  }
};

exports.postVote = async (req, res) => {
  try {
    const { candidateId } = req.body;
    const [existing] = await db.execute('SELECT id FROM poll_votes WHERE voter = ?', [req.user.username]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: '您已投过票' });
    const [config] = await db.execute('SELECT * FROM poll_config WHERE is_active = 1 LIMIT 1');
    if (config.length === 0) return res.status(400).json({ success: false, message: '投票未开放' });
    const now = new Date();
    if (config[0].end_time && now > new Date(config[0].end_time)) return res.status(400).json({ success: false, message: '投票已结束' });
    const [users] = await db.execute('SELECT total_exp FROM users WHERE id = ?', [req.user.id]);
    if (users[0].total_exp < (config[0].min_exp || 300)) return res.status(403).json({ success: false, message: '经验不足，无法投票' });
    await db.execute('INSERT INTO poll_votes (voter, candidate_id) VALUES (?, ?)', [req.user.username, candidateId]);
    await db.execute('UPDATE poll_candidates SET vote_count = vote_count + 1 WHERE id = ?', [candidateId]);
    res.json({ success: true, message: '投票成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '投票失败' });
  }
};

exports.getNews = async (req, res) => {
  try {
    const [news] = await db.execute(
      'SELECT id, topic, author, created_at, view_count FROM news ORDER BY created_at DESC LIMIT 20'
    );
    res.json({ success: true, data: news });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询新闻失败' });
  }
};

exports.getNewsDetail = async (req, res) => {
  try {
    const [news] = await db.execute('SELECT * FROM news WHERE id = ?', [req.params.id]);
    if (news.length === 0) return res.status(404).json({ success: false, message: '新闻不存在' });
    await db.execute('UPDATE news SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: news[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询新闻详情失败' });
  }
};

// 获取江湖公告（announcements 表）
exports.getAnnouncements = async (req, res) => {
  try {
    const [announcements] = await db.execute('SELECT * FROM announcements ORDER BY updated_at DESC LIMIT 1');
    res.json({ success: true, data: announcements || [] });
  } catch (err) {
    console.error('获取公告失败:', err);
    res.status(500).json({ success: false, message: '获取公告失败' });
  }
};

exports.bath = async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, silver, bath_date FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];
    const today = new Date().toISOString().slice(0, 10);
    if (user.bath_date && user.bath_date.toISOString().slice(0, 10) === today) {
      return res.status(400).json({ success: false, message: '今天已经洗过澡了' });
    }
    const cost = 500;
    if (user.silver < cost) return res.status(400).json({ success: false, message: '银两不足' });
    await db.execute(
      'UPDATE users SET silver = silver - ?, bath_date = CURDATE(), charm = charm + 10, tili = LEAST(tili + 20, 100) WHERE id = ?',
      [cost, req.user.id]
    );
    res.json({ success: true, message: '洗澡成功，魅力+10' });
  } catch (err) {
    res.status(500).json({ success: false, message: '洗澡失败' });
  }
};

exports.getPhotos = async (req, res) => {
  try {
    const [photos] = await db.execute(
      `SELECT id, jh_name, real_name, gender, age, address, bio, is_approved, created_at
       FROM photos WHERE is_approved = 1 ORDER BY created_at DESC LIMIT 50`
    );
    res.json({ success: true, data: photos });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询照片失败' });
  }
};

exports.postPhoto = async (req, res) => {
  try {
    const { realName, age, address, bio } = req.body;
    await db.execute(
      'INSERT INTO photos (jh_name, real_name, gender, age, address, bio) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.username, realName || null, req.user.gender, age || null, address || null, bio || null]
    );
    res.json({ success: true, message: '照片上传成功，等待审核' });
  } catch (err) {
    res.status(500).json({ success: false, message: '上传照片失败' });
  }
};

exports.getBounties = async (req, res) => {
  try {
    const [bounties] = await db.execute(
      'SELECT id, target, is_completed FROM bounties WHERE is_completed = 0'
    );
    res.json({ success: true, data: bounties });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询悬赏失败' });
  }
};

exports.claimBounty = async (req, res) => {
  try {
    const [bounties] = await db.execute('SELECT id, target FROM bounties WHERE id = ? AND is_completed = 0', [req.params.id]);
    if (bounties.length === 0) return res.status(404).json({ success: false, message: '悬赏不存在或已完成' });
    const bounty = bounties[0];
    const [victims] = await db.execute('SELECT id, status, grade FROM users WHERE username = ?', [bounty.target]);
    if (victims.length === 0) return res.status(404).json({ success: false, message: '目标不存在' });
    const [attackers] = await db.execute('SELECT attack_power, grade FROM users WHERE id = ?', [req.user.id]);
    const success = Math.random() < (attackers[0].attack_power / (attackers[0].attack_power + victims[0].grade * 100));
    if (success) {
      await db.execute('UPDATE bounties SET is_completed = 1 WHERE id = ?', [bounty.id]);
      const reward = victims[0].grade * 500;
      await db.execute('UPDATE users SET silver = silver + ?, total_exp = total_exp + ? WHERE id = ?', [reward, 50, req.user.id]);
      return res.json({ success: true, data: { success: true, reward } });
    }
    res.json({ success: true, data: { success: false, message: '猎杀失败' } });
  } catch (err) {
    res.status(500).json({ success: false, message: '认领悬赏失败' });
  }
};

exports.getPrisoners = async (req, res) => {
  try {
    const [prisoners] = await db.execute(
      `SELECT id, username, gender, grade, sect, jailed_at FROM users WHERE status = 'jailed' ORDER BY jailed_at DESC`
    );
    res.json({ success: true, data: prisoners });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询犯人列表失败' });
  }
};

exports.bailPrisoner = async (req, res) => {
  try {
    const [prisoners] = await db.execute('SELECT id, username, grade FROM users WHERE id = ? AND status = ?', [req.params.id, 'jailed']);
    if (prisoners.length === 0) return res.status(404).json({ success: false, message: '犯人不存在或已释放' });
    const bailCost = prisoners[0].grade * 1000;
    const [users] = await db.execute('SELECT id, silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < bailCost) return res.status(400).json({ success: false, message: '银两不足' });
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [bailCost, req.user.id]);
    await db.execute("UPDATE users SET status = 'normal', jailed_at = NULL WHERE id = ?", [prisoners[0].id]);
    res.json({ success: true, message: '保释成功', data: { bailCost } });
  } catch (err) {
    res.status(500).json({ success: false, message: '保释失败' });
  }
};

exports.getCourtesans = async (req, res) => {
  try {
    const [list] = await db.execute('SELECT id, name, beauty FROM courtesans ORDER BY beauty DESC');
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询烟花院失败' });
  }
};

exports.registerCourtesan = async (req, res) => {
  try {
    const [existing] = await db.execute('SELECT id FROM courtesans WHERE name = ?', [req.user.username]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: '您已登记' });
    if (req.user.gender !== 'female') return res.status(403).json({ success: false, message: '仅限女性登记' });
    await db.execute('INSERT INTO courtesans (name, beauty) VALUES (?, ?)', [req.user.username, 50 + Math.floor(Math.random() * 50)]);
    res.json({ success: true, message: '登记成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '登记失败' });
  }
};

exports.visitCourtesan = async (req, res) => {
  try {
    const [list] = await db.execute('SELECT id, name, beauty FROM courtesans WHERE id = ?', [req.params.id]);
    if (list.length === 0) return res.status(404).json({ success: false, message: '不存在' });
    const cost = list[0].beauty * 10;
    const [users] = await db.execute('SELECT id, silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < cost) return res.status(400).json({ success: false, message: '银两不足' });
    await db.execute('UPDATE users SET silver = silver - ?, charm = charm + 5 WHERE id = ?', [cost, req.user.id]);
    res.json({ success: true, message: '消费成功', data: { cost } });
  } catch (err) {
    res.status(500).json({ success: false, message: '消费失败' });
  }
};

exports.lucky = async (req, res) => {
  try {
    const fortunes = [
      '大吉大利，今日运势极佳',
      '中吉，诸事顺利',
      '小吉，小心驶得万年船',
      '末吉，平淡中见真章',
      '凶，今日宜静不宜动',
      '大凶，小心行事'
    ];
    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
    const luckyNumber = Math.floor(Math.random() * 100) + 1;
    const luckyColor = ['红', '黄', '蓝', '绿', '紫', '金'][Math.floor(Math.random() * 6)];
    res.json({ success: true, data: { fortune, luckyNumber, luckyColor } });
  } catch (err) {
    res.status(500).json({ success: false, message: '抽签失败' });
  }
};
