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
      `SELECT id, username, gender, sect_title, grade, total_exp, last_login_at
       FROM users WHERE sect = ? ORDER BY grade DESC, total_exp DESC`,
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

exports.abdicate = async (req, res) => {
  try {
    const { newLeader } = req.body;
    
    if (!newLeader) {
      return res.status(400).json({ success: false, message: '请指定新掌门' });
    }
    
    // 获取当前用户门派信息
    const [sects] = await db.execute('SELECT id, leader FROM sects WHERE leader = ?', [req.user.username]);
    if (sects.length === 0) {
      return res.status(404).json({ success: false, message: '您不是任何门派的掌门' });
    }
    
    // 检查新掌门候选人
    const [candidates] = await db.execute('SELECT id, username, sect FROM users WHERE username = ?', [newLeader]);
    if (candidates.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    const candidate = candidates[0];
    if (candidate.sect !== sects[0].leader) {
      return res.status(400).json({ success: false, message: '候选人不是本门派成员' });
    }
    
    // 禅让掌门
    const sectName = sects[0].leader;
    await db.execute('UPDATE sects SET leader = ? WHERE leader = ?', [newLeader, req.user.username]);
    
    // 更新原掌门和新掌门的头衔
    await db.execute("UPDATE users SET sect_title = '长老' WHERE username = ?", [req.user.username]);
    await db.execute("UPDATE users SET sect_title = '掌门' WHERE username = ?", [newLeader]);
    
    res.json({ 
      success: true, 
      message: `您已将掌门之位禅让给${newLeader}`,
      data: { new_leader: newLeader }
    });
  } catch (err) {
    console.error('禅让掌门错误:', err);
    res.status(500).json({ success: false, message: '禅让掌门失败' });
  }
};

// 招收弟子
exports.recruit = async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, message: '请指定招收对象' });
    }
    
    // 获取当前用户门派信息
    const [sects] = await db.execute(
      'SELECT s.id, s.name, s.leader, s.fit_gender FROM sects s WHERE s.name = (SELECT sect FROM users WHERE username = ?)',
      [req.user.username]
    );
    
    if (sects.length === 0) {
      return res.status(404).json({ success: false, message: '您还没有加入门派' });
    }
    
    const sect = sects[0];
    const userRole = req.user.username === sect.leader ? '掌门' : '长老';
    
    // 检查权限（只有掌门和长老可以招收弟子）
    const [userRoles] = await db.execute('SELECT sect_title FROM users WHERE username = ?', [req.user.username]);
    const canRecruit = userRoles[0].sect_title === '掌门' || userRoles[0].sect_title === '长老';
    
    if (!canRecruit) {
      return res.status(403).json({ success: false, message: '只有掌门或长老可以招收弟子' });
    }
    
    // 检查招收对象
    const [targets] = await db.execute('SELECT id, username, sect, sect_title, gender FROM users WHERE username = ?', [username]);
    if (targets.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    const target = targets[0];
    
    if (target.sect !== '无') {
      return res.status(400).json({ success: false, message: '对方已有门派' });
    }
    
    // 检查性别限制
    if (sect.fit_gender !== 'both' && target.gender !== sect.fit_gender) {
      return res.status(400).json({ success: false, message: `本门派只招收${sect.fit_gender === 'male' ? '男性' : '女性'}` });
    }
    
    // 招收弟子
    await db.execute(
      "UPDATE users SET sect = ?, sect_title = '普通弟子', join_sect_at = NOW() WHERE username = ?",
      [sect.name, username]
    );
    
    // 增加门派人数
    await db.execute('UPDATE sects SET member_count = member_count + 1 WHERE name = ?', [sect.name]);
    
    res.json({ 
      success: true, 
      message: `恭喜招收${username}为本门派${userRole === '掌门' ? '' : '长老'}弟子`,
      data: { new_member: username }
    });
  } catch (err) {
    console.error('招收弟子错误:', err);
    res.status(500).json({ success: false, message: '招收弟子失败' });
  }
};

// 开除弟子
exports.expel = async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, message: '请指定开除对象' });
    }
    
    // 获取当前用户门派信息
    const [sects] = await db.execute(
      'SELECT s.id, s.name, s.leader FROM sects s WHERE s.name = (SELECT sect FROM users WHERE username = ?)',
      [req.user.username]
    );
    
    if (sects.length === 0) {
      return res.status(404).json({ success: false, message: '您还没有加入门派' });
    }
    
    const sect = sects[0];
    
    // 检查权限（只有掌门可以开除弟子）
    if (req.user.username !== sect.leader) {
      return res.status(403).json({ success: false, message: '只有掌门可以开除弟子' });
    }
    
    // 检查开除对象
    const [targets] = await db.execute('SELECT id, username, sect, sect_title FROM users WHERE username = ?', [username]);
    if (targets.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    const target = targets[0];
    
    if (target.sect !== sect.name) {
      return res.status(400).json({ success: false, message: '对方不是本门派成员' });
    }
    
    if (target.username === sect.leader) {
      return res.status(400).json({ success: false, message: '不能开除掌门' });
    }
    
    // 开除弟子
    await db.execute(
      "UPDATE users SET sect = '无', sect_title = '无', join_sect_at = NULL WHERE username = ?",
      [username]
    );
    
    // 减少门派人数
    await db.execute('UPDATE sects SET member_count = member_count - 1 WHERE name = ?', [sect.name]);
    
    res.json({ 
      success: true, 
      message: `已将${username}逐出师门`,
      data: { expelled: username }
    });
  } catch (err) {
    console.error('开除弟子错误:', err);
    res.status(500).json({ success: false, message: '开除弟子失败' });
  }
};

// 门派俸禄
exports.sectInfo = async (req, res) => {
  try {
    const userData = req.user;
    const userSect = userData.sect || '无';
    
    if (userSect === '无' || !userSect) {
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
      return res.json({ 
        success: true, 
        data: { 
          hasSect: false,
          message: '门派不存在'
        } 
      });
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
      // 已领取，返回成功但不发放俸禄
      return res.json({
        success: true,
        message: '今日俸禄已领取',
        data: { alreadyClaimed: true }
      });
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
      `SELECT id, username, gender, sect_title, grade, total_exp, last_login_at, avatar
       FROM users 
       WHERE sect = ? 
       ORDER BY grade DESC, total_exp DESC 
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

// 获取个人贡献值
exports.getContribution = async (req, res) => {
  try {
    const [contributions] = await db.execute(
      'SELECT * FROM sect_contributions WHERE user_id = ? AND sect_name = ? ORDER BY created_at DESC LIMIT 30',
      [req.user.id, req.user.sect]
    );
    
    const [total] = await db.execute(
      'SELECT SUM(contribution) as total FROM sect_contributions WHERE user_id = ? AND sect_name = ?',
      [req.user.id, req.user.sect]
    );
    
    res.json({
      success: true,
      data: {
        total: total[0].total || 0,
        records: contributions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询贡献失败' });
  }
};

// 门派修炼
exports.practice = async (req, res) => {
  try {
    const { type } = req.body;
    
    if (!req.user.sect || req.user.sect === '无') {
      return res.status(400).json({ success: false, message: '您还没有加入任何门派' });
    }
    
    // 检查是否已修炼
    const now = new Date();
    const lastPractice = req.user.last_practice_at;
    if (lastPractice) {
      const last = new Date(lastPractice);
      if (now.toDateString() === last.toDateString()) {
        return res.status(400).json({ success: false, message: '今日已修炼，明日再来' });
      }
    }
    
    // 从数据库获取最新体力值（防止并发请求导致体力为负）
    const [users] = await db.execute('SELECT tili FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0 || users[0].tili < 20) {
      return res.status(400).json({ success: false, message: '体力不足 20 点' });
    }
    
    let expGain = 0;
    let practiceType = '';
    
    switch (type) {
      case 'basic':
        expGain = Math.floor(Math.random() * 50) + 50;
        practiceType = '基础修炼';
        break;
      case 'advanced':
        expGain = Math.floor(Math.random() * 100) + 100;
        practiceType = '高级修炼';
        break;
      case 'intensive':
        expGain = Math.floor(Math.random() * 200) + 200;
        practiceType = '闭关修炼';
        break;
      default:
        return res.status(400).json({ success: false, message: '无效的修炼类型' });
    }
    
    // 原子性更新：使用 WHERE 条件确保体力不会扣成负数
    const [result] = await db.execute(
      'UPDATE users SET total_exp = total_exp + ?, monthly_exp = monthly_exp + ?, exp = exp + ?, tili = tili - 20, last_practice_at = NOW(), practice_count_today = practice_count_today + 1 WHERE id = ? AND tili >= 20',
      [expGain, expGain, expGain, req.user.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(400).json({ success: false, message: '体力不足 20 点' });
    }
    
    // 记录贡献
    const contribution = Math.floor(expGain / 10);
    await db.execute(
      `INSERT INTO sect_contributions (sect_name, user_id, username, contribution, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.sect, req.user.id, req.user.username, contribution, practiceType]
    );
    
    res.json({
      success: true,
      message: `修炼成功！获得 ${expGain} 点经验，${contribution} 点贡献`,
      data: { expGain, contribution }
    });
  } catch (err) {
    console.error('门派修炼错误:', err);
    res.status(500).json({ success: false, message: '修炼失败' });
  }
};

// 获取可学技能列表
exports.getSkills = async (req, res) => {
  try {
    if (!req.user.sect || req.user.sect === '无') {
      return res.status(400).json({ success: false, message: '您还没有加入任何门派' });
    }
    
    // 查询该门派的所有技能
    const [skills] = await db.execute(
      `SELECT ss.*, sp.position_name as required_position
       FROM secret_skills ss
       LEFT JOIN sect_positions sp ON ss.id = sp.id
       WHERE ss.sect = ? OR ss.sect = '通用'
       ORDER BY ss.level ASC, ss.price DESC`,
      [req.user.sect]
    );
    
    // 查询用户已学技能
    const [learned] = await db.execute(
      'SELECT skill_id FROM user_skills WHERE user_id = ?',
      [req.user.id]
    );
    
    const learnedIds = new Set(learned.map(s => s.skill_id));
    
    res.json({
      success: true,
      data: skills.map(skill => ({
        ...skill,
        expense: skill.price,
        level_name: skill.grade,
        learned: learnedIds.has(skill.id)
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询技能失败' });
  }
};

// 学习技能
exports.learnSkill = async (req, res) => {
  try {
    const { skillId } = req.body;
    
    if (!skillId) {
      return res.status(400).json({ success: false, message: '请指定技能 ID' });
    }
    
    // 查询技能
    const [skills] = await db.execute(
      'SELECT * FROM secret_skills WHERE id = ? AND (sect = ? OR sect = "通用")',
      [skillId, req.user.sect]
    );
    
    if (skills.length === 0) {
      return res.status(404).json({ success: false, message: '技能不存在' });
    }
    
    const skill = skills[0];
    
    // 检查是否已学习
    const [learned] = await db.execute(
      'SELECT * FROM user_skills WHERE user_id = ? AND skill_id = ?',
      [req.user.id, skillId]
    );
    
    if (learned.length > 0) {
      return res.status(400).json({ success: false, message: '已经学习过该技能' });
    }
    
    // 检查银两
    if (req.user.silver < skill.expense) {
      return res.status(400).json({ success: false, message: '银两不足' });
    }
    
    // 学习技能
    await db.execute(
      'INSERT INTO user_skills (user_id, skill_id, learned_at) VALUES (?, ?, NOW())',
      [req.user.id, skillId]
    );
    
    // 扣除银两
    await db.execute(
      'UPDATE users SET silver = silver - ? WHERE id = ?',
      [skill.expense, req.user.id]
    );
    
    // 记录门派贡献
    const contribution = Math.floor(skill.expense / 100);
    await db.execute(
      `INSERT INTO sect_contributions (sect_name, user_id, username, contribution, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.sect, req.user.id, req.user.username, contribution, `学习技能 ${skill.name}`]
    );
    
    res.json({
      success: true,
      message: `成功学习技能 ${skill.name}！`,
      data: { skill: skill.name }
    });
  } catch (err) {
    console.error('学习技能错误:', err);
    res.status(500).json({ success: false, message: '学习技能失败' });
  }
};

// 获取门派任务列表
exports.getTasks = async (req, res) => {
  try {
    if (!req.user.sect || req.user.sect === '无') {
      return res.status(400).json({ success: false, message: '您还没有加入任何门派' });
    }
    
    const { type } = req.query; // daily, side, all
    
    let query = `
      SELECT q.id, q.name as title, q.description, q.type as quest_type, 
             q.difficulty, q.reward_exp, q.reward_silver, q.reward_neili,
             q.max_progress, q.objective_type, q.objective_target,
             COALESCE(p.progress, 0) as progress,
             COALESCE(p.status, 'active') as status,
             p.completed_at
      FROM quests q
      LEFT JOIN user_quest_progress p ON q.id = p.quest_id AND p.user_id = ?
      WHERE q.type IN ('daily', 'side')
    `;
    
    const params = [req.user.id];
    
    if (type && type !== 'all') {
      query += ' AND q.type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY q.type ASC, q.difficulty ASC, q.reward_exp DESC';
    
    const [tasks] = await db.execute(query, params);
    
    res.json({
      success: true,
      data: tasks.map(task => ({
        ...task,
        completed: task.status === 'claimed',
        progress: task.progress || 0,
        isCompleted: task.progress >= task.max_progress
      }))
    });
  } catch (err) {
    console.error('查询任务错误:', err);
    res.status(500).json({ success: false, message: '查询任务失败' });
  }
};

// 完成门派任务
exports.completeTask = async (req, res) => {
  try {
    const { questId } = req.body;
    
    if (!questId) {
      return res.status(400).json({ success: false, message: '请指定任务 ID' });
    }
    
    // 查询任务
    const [tasks] = await db.execute(
      'SELECT id, name as title, reward_exp, reward_silver, reward_neili, max_progress FROM quests WHERE id = ?',
      [questId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }
    
    const task = tasks[0];
    
    // 查询进度
    const [progresses] = await db.execute(
      'SELECT * FROM user_quest_progress WHERE user_id = ? AND quest_id = ?',
      [req.user.id, questId]
    );
    
    const progress = progresses.length > 0 ? progresses[0] : null;
    
    // 检查是否已领取奖励
    if (progress && progress.status === 'claimed') {
      return res.status(400).json({ success: false, message: '任务奖励已领取' });
    }
    
    // 检查进度是否完成
    const currentProgress = progress ? progress.progress : 0;
    if (currentProgress < task.max_progress) {
      return res.status(400).json({ 
        success: false, 
        message: `任务未完成！当前进度：${currentProgress}/${task.max_progress}` 
      });
    }
    
    // 更新任务状态为已完成（未领取）
    if (progress) {
      await db.execute(
        "UPDATE user_quest_progress SET status = 'completed', completed_at = NOW() WHERE user_id = ? AND quest_id = ?",
        [req.user.id, questId]
      );
    } else {
      await db.execute(
        `INSERT INTO user_quest_progress (user_id, username, quest_id, progress, max_progress, status, completed_at) 
         VALUES (?, ?, ?, ?, ?, 'completed', NOW())
         ON DUPLICATE KEY UPDATE status = 'completed', completed_at = NOW()`,
        [req.user.id, req.user.username, questId, task.max_progress, task.max_progress]
      );
    }
    
    // 发放奖励
    await db.execute(
      'UPDATE users SET total_exp = total_exp + ?, monthly_exp = monthly_exp + ?, silver = silver + ?, neili = neili + ? WHERE id = ?',
      [task.reward_exp || 0, task.reward_exp || 0, task.reward_silver || 0, task.reward_neili || 0, req.user.id]
    );
    
    // 更新成就
    const isDaily = task.max_progress > 1 || (await db.execute('SELECT type FROM quests WHERE id = ?', [questId]))[0][0]?.type === 'daily';
    await updateQuestAchievement(req.user.id, req.user.username, isDaily);
    
    res.json({
      success: true,
      message: `任务完成！获得 ${task.reward_exp || 0} 经验，${task.reward_silver || 0} 银两`,
      data: {
        exp: task.reward_exp || 0,
        silver: task.reward_silver || 0,
        neili: task.reward_neili || 0
      }
    });
  } catch (err) {
    console.error('完成任务错误:', err);
    res.status(500).json({ success: false, message: '完成任务失败' });
  }
};

// 提交任务进度
exports.submitProgress = async (req, res) => {
  try {
    const { questId } = req.params;
    const { count = 1 } = req.body;
    
    if (!questId) {
      return res.status(400).json({ success: false, message: '请指定任务 ID' });
    }
    
    // 查询任务
    const [tasks] = await db.execute(
      'SELECT id, max_progress, type FROM quests WHERE id = ?',
      [questId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }
    
    const task = tasks[0];
    
    // 查询当前进度
    const [progresses] = await db.execute(
      'SELECT * FROM user_quest_progress WHERE user_id = ? AND quest_id = ?',
      [req.user.id, questId]
    );
    
    const currentProgress = progresses.length > 0 ? progresses[0].progress : 0;
    
    // 检查是否已完成
    if (currentProgress >= task.max_progress) {
      return res.status(400).json({ success: false, message: '任务已完成' });
    }
    
    // 更新进度
    const newProgress = Math.min(currentProgress + count, task.max_progress);
    
    if (progresses.length > 0) {
      await db.execute(
        'UPDATE user_quest_progress SET progress = ?, status = "active" WHERE user_id = ? AND quest_id = ?',
        [newProgress, req.user.id, questId]
      );
    } else {
      await db.execute(
        `INSERT INTO user_quest_progress (user_id, username, quest_id, progress, max_progress, status) 
         VALUES (?, ?, ?, ?, ?, 'active')`,
        [req.user.id, req.user.username, questId, newProgress, task.max_progress]
      );
    }
    
    const isComplete = newProgress >= task.max_progress;
    
    res.json({
      success: true,
      message: isComplete ? '任务完成！' : `进度更新：${newProgress}/${task.max_progress}`,
      data: {
        progress: newProgress,
        max: task.max_progress,
        completed: isComplete
      }
    });
  } catch (err) {
    console.error('提交进度错误:', err);
    res.status(500).json({ success: false, message: '提交进度失败' });
  }
};

// 获取成就统计
exports.getAchievements = async (req, res) => {
  try {
    const [achievements] = await db.execute(
      'SELECT * FROM quest_achievements WHERE user_id = ?',
      [req.user.id]
    );
    
    if (achievements.length === 0) {
      // 初始化成就记录
      await db.execute(
        'INSERT INTO quest_achievements (user_id, username) VALUES (?, ?)',
        [req.user.id, req.user.username]
      );
      return res.json({ 
        success: true, 
        data: { 
          total_completed: 0, 
          daily_streak: 0, 
          best_streak: 0 
        } 
      });
    }
    
    const ach = achievements[0];
    res.json({
      success: true,
      data: {
        total_completed: ach.total_completed,
        daily_streak: ach.daily_streak,
        best_streak: ach.best_streak,
        last_daily_completed: ach.last_daily_completed
      }
    });
  } catch (err) {
    console.error('查询成就错误:', err);
    res.status(500).json({ success: false, message: '查询成就失败' });
  }
};

// 更新成就（辅助函数）
async function updateQuestAchievement(userId, username, isDaily) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [achievements] = await db.execute(
      'SELECT * FROM quest_achievements WHERE user_id = ?',
      [userId]
    );
    
    if (achievements.length === 0) {
      await db.execute(
        'INSERT INTO quest_achievements (user_id, username, total_completed, daily_streak, last_daily_completed) VALUES (?, ?, 1, ?, ?)',
        [userId, username, isDaily ? 1 : 0, isDaily ? today : null]
      );
      return;
    }
    
    const ach = achievements[0];
    let newStreak = ach.daily_streak;
    let bestStreak = ach.best_streak;
    let lastDate = ach.last_daily_completed;
    
    if (isDaily) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastDate === today) {
        // 今天已经更新过
      } else if (lastDate === yesterdayStr) {
        // 连续完成
        newStreak += 1;
        bestStreak = Math.max(bestStreak, newStreak);
      } else if (lastDate !== today) {
        // 中断后重新开始
        newStreak = 1;
      }
    }
    
    await db.execute(
      `UPDATE quest_achievements 
       SET total_completed = total_completed + 1,
           daily_streak = ?,
           best_streak = ?,
           last_daily_completed = ?,
           updated_at = NOW()
       WHERE user_id = ?`,
       [isDaily ? newStreak : ach.daily_streak, isDaily ? bestStreak : ach.best_streak, isDaily ? today : lastDate, userId]
    );
  } catch (err) {
    console.error('更新成就错误:', err);
  }
}
