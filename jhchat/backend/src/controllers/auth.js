const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { encryptPassword, verifyPassword, isIpBanned, isUsernameBanned, containsBadWord, escapeHtml, getConfig } = require('../utils/helpers');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      grade: user.grade,
      faction: user.faction,
      sect_title: user.sect_title,
      sect: user.sect,
      gender: user.gender
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

exports.register = async (req, res) => {
  try {
    const { username, password, confirmPassword, referrer, securityAnswer, gender, email, captcha } = req.body;

    if (!username || !password || !gender) {
      return res.status(400).json({ success: false, message: '用户名、密码、性别为必填项' });
    }
    if (password.length < 3) {
      return res.status(400).json({ success: false, message: '密码长度不能少于3位' });
    }
    if (username.length > 10) {
      return res.status(400).json({ success: false, message: '用户名长度不能超过10个字符' });
    }
    if (/[<>'"=\s]/.test(username)) {
      return res.status(400).json({ success: false, message: '用户名包含非法字符' });
    }

    const closed = await getConfig('disnewuser');
    if (closed === '1') {
      return res.status(403).json({ success: false, message: '系统暂时禁止新用户注册' });
    }

    if (await isUsernameBanned(username)) {
      return res.status(403).json({ success: false, message: '该用户名被禁止使用' });
    }

    if (await containsBadWord(username)) {
      return res.status(403).json({ success: false, message: '用户名包含敏感词' });
    }

    const ip = req.ip || req.connection.remoteAddress;
    if (await isIpBanned(ip)) {
      return res.status(403).json({ success: false, message: '您的IP已被封禁' });
    }

    const [existing] = await db.execute('SELECT id FROM users WHERE username = ? AND status != ?', [username, 'dead']);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: '该用户名已存在' });
    }

    const hashedPwd = await encryptPassword(password);
    const hashedAnswer = securityAnswer ? await encryptPassword(securityAnswer) : null;

    const [result] = await db.execute(
      `INSERT INTO users (username, password, password_answer, gender, referrer, email, status, tili, attack, defense, attack_power, charm, spouse, is_vip, silver, sect, faction, sect_title, grade, registered_at, register_ip)
       VALUES (?, ?, ?, ?, ?, ?, 'normal', 30, 10, 10, 100, 100, '无', 0, 0, '无', '无', '无', 1, NOW(), ?)`,
      [username, hashedPwd, hashedAnswer, gender, referrer || null, email || null, ip]
    );

    const token = generateToken({ id: result.insertId, username, grade: 1, faction: '无', sect_title: '无', sect: '无', gender });

    res.json({ success: true, message: '注册成功', data: { token, user: { id: result.insertId, username, gender, grade: 1 } } });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ success: false, message: '注册失败' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '请输入用户名和密码' });
    }

    const closedoor = await getConfig('closedoor');
    if (closedoor === '1') {
      return res.status(403).json({ success: false, message: '聊天室暂时关闭' });
    }

    const maxPeople = parseInt(await getConfig('maxpeople')) || 500;
    const [onlineCount] = await db.execute('SELECT COUNT(*) as cnt FROM online_users');
    if (onlineCount[0].cnt >= maxPeople) {
      return res.status(403).json({ success: false, message: '在线人数已满' });
    }

    const ip = req.ip || req.connection.remoteAddress;
    if (await isIpBanned(ip)) {
      return res.status(403).json({ success: false, message: '您的IP已被封禁' });
    }

    const [users] = await db.execute('SELECT * FROM users WHERE username = ? AND status != ?', [username, 'dead']);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const user = users[0];

    if (user.status === 'banned') {
      return res.status(403).json({ success: false, message: '该账号已被封禁' });
    }
    if (user.status === 'jailed') {
      return res.status(403).json({ success: false, message: '该账号正在坐牢' });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    if (user.last_kick_at) {
      const kickDiff = (Date.now() - new Date(user.last_kick_at).getTime()) / 1000;
      if (kickDiff < 300) {
        return res.status(403).json({ success: false, message: `被踢出后需等待${Math.ceil((300 - kickDiff) / 60)}分钟才能登录` });
      }
    }

    await checkLevelUp(user);

    if (user.neili < 0) user.neili = 0;
    if (user.tili < 0) user.tili = 0;
    if (user.wugong < 0) user.wugong = 0;

    await db.execute(
      `UPDATE users SET login_count = login_count + 1, last_login_at = NOW(), last_login_ip = ?, neili = ?, tili = ?, wugong = GREATEST(0, (neili + tili) / 1000) WHERE id = ?`,
      [ip, user.neili, user.tili, user.id]
    );

    const [online] = await db.execute('SELECT id FROM online_users WHERE user_id = ?', [user.id]);
    if (online.length > 0) {
      await db.execute('DELETE FROM online_users WHERE user_id = ?', [user.id]);
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          gender: user.gender,
          grade: user.grade,
          sect: user.sect,
          faction: user.faction,
          sect_title: user.sect_title,
          avatar: user.avatar,
          status: user.status
        }
      }
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ success: false, message: '登录失败' });
  }
};

async function checkLevelUp(user) {
  const levels = ['level1to2', 'level2to3', 'level3to4', 'level4to5'];
  const thresholds = [];
  for (const l of levels) {
    thresholds.push(parseInt(await getConfig(l)) || 0);
  }

  let newGrade = user.grade;
  if (newGrade < 2 && user.all_value >= thresholds[0]) newGrade = 2;
  if (newGrade < 3 && user.all_value >= thresholds[1]) newGrade = 3;
  if (newGrade < 4 && user.all_value >= thresholds[2]) newGrade = 4;
  if (newGrade < 5 && user.all_value >= thresholds[3]) newGrade = 5;

  if (newGrade > user.grade) {
    await db.execute('UPDATE users SET grade = ? WHERE id = ?', [newGrade, user.id]);
    user.grade = newGrade;
  }
}

exports.logout = async (req, res) => {
  try {
    await db.execute('DELETE FROM online_users WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: '已退出' });
  } catch (err) {
    res.status(500).json({ success: false, message: '退出失败' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '请输入旧密码和新密码' });
    }
    if (newPassword.length < 3) {
      return res.status(400).json({ success: false, message: '新密码长度不能少于3位' });
    }

    const [users] = await db.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const valid = await verifyPassword(oldPassword, users[0].password);
    if (!valid) {
      return res.status(401).json({ success: false, message: '旧密码错误' });
    }

    const hashed = await encryptPassword(newPassword);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

    res.json({ success: true, message: '密码修改成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '修改密码失败' });
  }
};

exports.revive = async (req, res) => {
  try {
    const [users] = await db.execute('SELECT status FROM users WHERE id = ?', [req.user.id]);
    if (users[0].status !== 'dead') {
      return res.status(400).json({ success: false, message: '您并未死亡' });
    }
    await db.execute("UPDATE users SET status = 'normal', tili = 30, neili = 0, wugong = 0 WHERE id = ?", [req.user.id]);
    res.json({ success: true, message: '复生成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '复生失败' });
  }
};

exports.suicide = async (req, res) => {
  try {
    await db.execute("UPDATE users SET status = 'dead' WHERE id = ?", [req.user.id]);
    await db.execute('DELETE FROM online_users WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: '已自杀' });
  } catch (err) {
    res.status(500).json({ success: false, message: '操作失败' });
  }
};
