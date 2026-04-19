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

exports.create = async (req, res) => {
  try {
    const { name, slogan, description, rules, fit_gender } = req.body;
    
    // 检查是否已有六扇门
    if (name === '六扇门') {
      return res.status(403).json({ success: false, message: '六扇门是朝廷机构，不可创建' });
    }
    
    // 检查门派名称是否已存在
    const [existing] = await db.execute('SELECT id FROM sects WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: '门派名称已存在' });
    }
    
    // 检查创建者是否已有门派
    const [userRows] = await db.execute('SELECT sect FROM users WHERE id = ?', [req.user.id]);
    if (userRows[0].sect !== '无') {
      return res.status(400).json({ success: false, message: '您已有门派，需先离开才能创建' });
    }
    
    // 检查等级（需要等级 5 以上）
    if (req.user.grade < 5) {
      return res.status(400).json({ success: false, message: '需要等级 5 以上才能创建门派' });
    }
    
    // 扣除创建费用（100 万两）
    const createCost = 1000000;
    if (req.user.silver < createCost) {
      return res.status(400).json({ success: false, message: `创建门派需要${createCost/10000}万两银子` });
    }
    
    // 创建门派
    await db.execute(
      `INSERT INTO sects (name, leader, slogan, description, rules, fit_gender, member_count)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [name, req.user.username, slogan || '', description || '', rules || '', fit_gender || 'both']
    );
    
    // 更新用户信息
    await db.execute(
      "UPDATE users SET sect = ?, sect_title = '掌门', silver = silver - ?, join_sect_at = NOW() WHERE id = ?",
      [name, createCost, req.user.id]
    );
    
    res.json({ 
      success: true, 
      message: `门派"${name}"创建成功！您已成为掌门`,
      data: { sect_name: name, title: '掌门' }
    });
  } catch (err) {
    console.error('创建门派错误:', err);
    res.status(500).json({ success: false, message: '创建门派失败' });
  }
};

exports.dissolve = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: '请指定门派名称' });
    }
    
    // 六扇门不可解散
    if (name === '六扇门') {
      return res.status(403).json({ success: false, message: '六扇门是朝廷机构，不可解散' });
    }
    
    // 检查门派是否存在
    const [sects] = await db.execute('SELECT id FROM sects WHERE name = ?', [name]);
    if (sects.length === 0) {
      return res.status(404).json({ success: false, message: '门派不存在' });
    }
    
    // 将门派成员全部除名
    await db.execute(
      "UPDATE users SET sect = '无', sect_title = '无', join_sect_at = NULL WHERE sect = ?",
      [name]
    );
    
    // 删除门派
    await db.execute('DELETE FROM sects WHERE name = ?', [name]);
    
    res.json({ success: true, message: `门派"${name}"已解散` });
  } catch (err) {
    console.error('解散门派错误:', err);
    res.status(500).json({ success: false, message: '解散门派失败' });
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

// 获取门派信息（包括俸禄、武功等）
exports.sectInfo = async (req, res) => {
  try {
    const userData = req.user;
    const userSect = userData.sect;
    
    if (userSect === '无') {
      return res.json({ 
        success: true, 
        data: { 
          hasSect: false,
          message: '您还没有加入任何门派'
        } 
      });
    }
    
    // 获取门派信息
    const [sects] = await db.execute('SELECT * FROM sects WHERE name = ?', [userSect]);
    if (sects.length === 0) {
      return res.json({ success: true, data: { hasSect: false } });
    }
    
    const sect = sects[0];
    
    // 计算可领取俸禄
    const salaryAmount = userData.grade * 500;
    const canSalary = !userData.salary_time || new Date(userData.salary_time).toDateString() !== new Date().toDateString();
    
    res.json({
      success: true,
      data: {
        hasSect: true,
        sect: {
          name: sect.name,
          leader: sect.leader,
          slogan: sect.slogan,
          title: userData.sect_title || '弟子',
          memberCount: sect.member_count
        },
        salary: {
          amount: salaryAmount,
          canClaim: canSalary
        },
        isLeader: sect.leader === userData.username
      }
    });
  } catch (err) {
    console.error('Get sect info error:', err);
    res.status(500).json({ success: false, message: '获取门派信息失败' });
  }
};

// 每日签到领取俸禄
exports.checkIn = async (req, res) => {
  try {
    const userData = req.user;
    
    if (userData.sect === '无') {
      return res.status(400).json({ success: false, message: '您还没有加入任何门派' });
    }
    
    // 检查是否已签到
    const [users] = await db.execute('SELECT salary_time FROM users WHERE id = ?', [req.user.id]);
    const lastSalary = users[0].salary_time;
    
    if (lastSalary && new Date(lastSalary).toDateString() === new Date().toDateString()) {
      return res.status(400).json({ success: false, message: '今日俸禄已领取' });
    }
    
    // 计算俸禄（等级 * 500 两）
    const amount = userData.grade * 500;
    
    // 发放俸禄
    await db.execute(
      'UPDATE users SET silver = silver + ?, salary_time = NOW() WHERE id = ?',
      [amount, req.user.id]
    );
    
    // 记录门派贡献
    await db.execute(
      `INSERT INTO sect_contributions (sect_name, user_id, username, contribution, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [userData.sect, req.user.id, req.user.username, 1, '每日签到']
    );
    
    res.json({
      success: true,
      message: `领取俸禄 ${amount} 两`,
      data: { amount }
    });
  } catch (err) {
    console.error('Check in error:', err);
    res.status(500).json({ success: false, message: '领取俸禄失败' });
  }
};

// 门派成员列表（带分页）
exports.sectMembersWithPage = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const [sects] = await db.execute('SELECT id FROM sects WHERE name = ?', [req.params.name]);
    if (sects.length === 0) {
      return res.status(404).json({ success: false, message: '门派不存在' });
    }
    
    const [members] = await db.execute(
      `SELECT id, username, gender, sect_title, grade, all_value, last_login_at, avatar
       FROM users 
       WHERE sect = ? 
       ORDER BY grade DESC, all_value DESC 
       LIMIT ? OFFSET ?`,
      [req.params.name, parseInt(limit), offset]
    );
    
    const [total] = await db.execute(
      'SELECT COUNT(*) as count FROM users WHERE sect = ?',
      [req.params.name]
    );
    
    res.json({
      success: true,
      data: {
        members,
        pagination: {
          total: total[0].count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total[0].count / limit)
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询门派成员失败' });
  }
};
