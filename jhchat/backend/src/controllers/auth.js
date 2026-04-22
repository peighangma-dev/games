const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { hashPassword, verifyPassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { getConfig, incrementStat } = require('../config/configManager');
const { logger } = require('../utils/logger');
const { isIpBanned, isUsernameBanned, containsBadWord } = require('../utils/helpers');
const Redis = require('ioredis');

let onlineUserClient;

function getOnlineUserClient() {
  if (!onlineUserClient) {
    onlineUserClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      maxRetriesPerRequest: 1,
      retryDelayOnFail: 100,
      reconnectOnError: (err) => {
        return err.message.includes('READONLY') || err.message.includes('ECONNREFUSED') || false;
      }
    });
  }
  return onlineUserClient;
}

/**
 * 简单的 IP 地理位置解析
 * 使用 IP-API 的免费 API
 */
async function getLocationFromIp(ip) {
  // 内网 IP 直接返回
  if (['127.0.0.1', '::1', 'localhost'].includes(ip) || 
      ip.startsWith('192.168.') || 
      ip.startsWith('10.') || 
      ip.startsWith('172.')) {
    return { country: '内网', region: '', city: '' };
  }

  // 优先从缓存读取
  try {
    const [cached] = await db.execute(
      'SELECT country, region, city FROM user_ip_logs WHERE ip_address = ? AND country IS NOT NULL ORDER BY created_at DESC LIMIT 1',
      [ip]
    );
    if (cached.length > 0 && cached[0].country) {
      return {
        country: cached[0].country,
        region: cached[0].region || '',
        city: cached[0].city || ''
      };
    }
  } catch (e) {
    logger.debug('查询 IP 地理位置缓存失败', { ip, error: e.message });
  }

  // 使用 IP-API 免费 API（生产环境建议使用离线 IP 库）
  try {
    const axios = require('axios');
    const response = await axios.get(`http://ip-api.com/json/${ip}?lang=zh-CN`, {
      timeout: 2000
    });
    if (response.data && response.data.status === 'success') {
      return {
        country: response.data.country || '',
        region: response.data.regionName || '',
        city: response.data.city || ''
      };
    }
  } catch (e) {
    logger.debug('获取 IP 地理位置失败', { ip, error: e.message });
  }

  return { country: '', region: '', city: '' };
}

/**
 * 记录登录日志
 */
async function recordLoginLog(userId, username, ip, status, reason = null) {
  try {
    // 获取地理位置
    const location = await getLocationFromIp(ip);
    
    if (userId) {
      // 用户存在，记录完整日志
      await db.execute(
        `INSERT INTO user_ip_logs (
          user_id, username, ip_address, ip_type, user_agent, 
          login_status, reason, country, region, city, created_at
        ) VALUES (?, ?, ?, 'login', ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          username,
          ip,
          '',
          status,
          reason,
          location.country,
          location.region,
          location.city
        ]
      );
    } else {
      // 用户不存在，只记录 IP 和用户名
      await db.execute(
        `INSERT INTO user_ip_logs (
          username, ip_address, ip_type, user_agent, 
          login_status, reason, created_at
        ) VALUES (?, ?, 'login', ?, ?, ?, NOW())`,
        [
          username || '未知',
          ip,
          '',
          status,
          reason
        ]
      );
    }
  } catch (err) {
    logger.error('记录登录日志失败', { userId, username, ip, error: err.message });
  }
}

exports.register = async (req, res) => {
  try {
    const { username, password, confirmPassword, referrer, securityAnswer, gender, email, captcha } = req.body;

    if (!username || !password || !gender) {
      return res.status(400).json({ success: false, message: '用户名、密码、性别为必填项' });
    }
    if (password.length < 3) {
      return res.status(400).json({ success: false, message: '密码长度不能少于 3 位' });
    }
    
    // 验证用户名必须是纯中文
    const chineseUsername = username.trim();
    if (!/^[一 - 龟]+$/.test(chineseUsername)) {
      return res.status(400).json({ success: false, message: '用户名必须是纯中文，不允许使用拼音、数字或符号' });
    }
    if (chineseUsername.length < 2 || chineseUsername.length > 10) {
      return res.status(400).json({ success: false, message: '用户名长度必须为 2-10 个汉字' });
    }
    
    if (/[<>'"=\s]/.test(chineseUsername)) {
      return res.status(400).json({ success: false, message: '用户名包含非法字符' });
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

    if (await isUsernameBanned(chineseUsername)) {
      return res.status(403).json({ success: false, message: '该用户名被禁止使用' });
    }

    if (await containsBadWord(chineseUsername)) {
      return res.status(403).json({ success: false, message: '用户名包含敏感词' });
    }

    const ip = req.ip || req.connection.remoteAddress;
    if (await isIpBanned(ip)) {
      return res.status(403).json({ success: false, message: '您的 IP 已被封禁' });
    }

    const [existing] = await db.execute('SELECT id FROM users WHERE username = ? AND status != ?', [chineseUsername, 'dead']);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: '该用户名已存在' });
    }

    const hashedPwd = await encryptPassword(password);
    const hashedAnswer = securityAnswer ? await encryptPassword(securityAnswer) : null;

    const [result] = await db.execute(
      `INSERT INTO users (username, password, password_answer, gender, referrer, email, status, tili, attack, defense, attack_power, charm, spouse, is_vip, silver, sect, faction, sect_title, grade, registered_at, register_ip)
       VALUES (?, ?, ?, ?, ?, ?, 'normal', 30, 10, 10, 100, 100, '无', 0, 0, '无', '无', '无', 1, NOW(), ?)`,
      [chineseUsername, hashedPwd, hashedAnswer, gender, referrer || null, email || null, ip]
    );

    // 记录注册 IP 日志
    await db.execute(
      `INSERT INTO user_ip_logs (user_id, ip_address, ip_type, user_agent, login_status) VALUES (?, ?, 'register', ?, 'success')`,
      [result.insertId, ip, req.headers['user-agent'] || null]
    );

    const token = generateToken({ id: result.insertId, username: chineseUsername, grade: 1, faction: '无', sect_title: '无', sect: '无', gender });

    res.json({ success: true, message: '注册成功', data: { token, user: { id: result.insertId, username: chineseUsername, gender, grade: 1 } } });
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
      // 登录失败：用户不存在
      await recordLoginLog(null, username, ip, 'failed', '用户不存在');
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const user = users[0];

    if (user.status === 'banned') {
      await recordLoginLog(user.id, user.username, ip, 'failed', '账号已被封禁');
      return res.status(403).json({ success: false, message: '该账号已被封禁' });
    }
    if (user.status === 'jailed') {
      await recordLoginLog(user.id, user.username, ip, 'failed', '账号正在坐牢');
      return res.status(403).json({ success: false, message: '该账号正在坐牢' });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      await recordLoginLog(user.id, user.username, ip, 'failed', '密码错误');
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    if (user.last_kick_at) {
      const kickDiff = (Date.now() - new Date(user.last_kick_at).getTime()) / 1000;
      if (kickDiff < 300) {
        return res.status(403).json({ success: false, message: `被踢出后需等待${Math.ceil((300 - kickDiff) / 60)}分钟才能登录` });
      }
    }

    await checkLevelUp(user);

    // 恢复内力和体力（但不超过上限）
    const maxNeili = user.max_neili || 500;
    const maxTili = 100;
    if (user.neili < 0) user.neili = 0;
    if (user.tili < 0) user.tili = 0;
    // 离线时自动恢复部分内力和体力（10%）
    if (user.last_login_at) {
      const offlineMinutes = (Date.now() - new Date(user.last_login_at).getTime()) / 60000;
      if (offlineMinutes > 0) {
        const neiliRecover = Math.min(maxNeili - user.neili, Math.floor(offlineMinutes * 0.5));
        const tiliRecover = Math.min(maxTili - user.tili, Math.floor(offlineMinutes * 0.1));
        user.neili += neiliRecover;
        user.tili += tiliRecover;
      }
    }

    await db.execute(
      `UPDATE users SET login_count = login_count + 1, last_login_at = NOW(), last_login_ip = ?, neili = ?, tili = ?, wugong = GREATEST(0, wugong) WHERE id = ?`,
      [ip, Math.min(user.neili, maxNeili), Math.min(user.tili, maxTili), user.id]
    );

    // 记录登录 IP 日志（成功）
    await recordLoginLog(user.id, user.username, ip, 'success', null);

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
    logger.error('登录错误', { error: err.message });
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
