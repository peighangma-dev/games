const db = require('../config/db');

exports.getRooms = async (req, res) => {
  try {
    const [rooms] = await db.execute('SELECT * FROM chat_rooms ORDER BY sort_order');
    for (const room of rooms) {
      const [cnt] = await db.execute('SELECT COUNT(*) as cnt FROM online_users WHERE room_id = ?', [room.id]);
      room.online_count = cnt[0].cnt;
    }
    res.json({ success: true, data: rooms });
  } catch (err) { res.status(500).json({ success: false, message: '查询失败' }); }
};

exports.joinRoom = async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const [rooms] = await db.execute('SELECT * FROM chat_rooms WHERE id = ?', [roomId]);
    if (rooms.length === 0) return res.status(404).json({ success: false, message: '房间不存在' });
    const room = rooms[0];
    if (room.min_grade > 0 && req.user.grade < room.min_grade && req.user.faction !== '六扇门') {
      return res.status(403).json({ success: false, message: '等级不足' });
    }
    if (room.max_grade > 0 && req.user.grade > room.max_grade && req.user.faction !== '六扇门') {
      return res.status(403).json({ success: false, message: '等级过高' });
    }
    await db.execute('UPDATE online_users SET room_id = ? WHERE user_id = ?', [roomId, req.user.id]);
    await db.execute('UPDATE users SET room_id = ? WHERE id = ?', [roomId, req.user.id]);
    res.json({ success: true, data: { roomId, roomName: room.name } });
  } catch (err) { res.status(500).json({ success: false, message: '切换失败' }); }
};

exports.getMessages = async (req, res) => {
  try {
    const roomId = req.params.id;
    const after = parseInt(req.query.after) || 0;
    const [msgs] = await db.execute(
      'SELECT * FROM chat_messages WHERE room_id = ? AND line_no > ? ORDER BY line_no ASC LIMIT 50',
      [roomId, after]
    );
    res.json({ success: true, data: msgs });
  } catch (err) { res.status(500).json({ success: false, message: '查询失败' }); }
};

exports.getRoomOnline = async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT o.user_id, o.username, o.gender, o.sect, o.avatar, u.grade FROM online_users o LEFT JOIN users u ON o.user_id = u.id WHERE o.room_id = ? ORDER BY o.username',
      [req.params.id]
    );
    res.json({ success: true, data: users });
  } catch (err) { res.status(500).json({ success: false, message: '查询失败' }); }
};

exports.getActions = async (req, res) => {
  try {
    const [actions] = await db.execute("SELECT * FROM chat_actions WHERE action_type = '1'");
    res.json({ success: true, data: actions });
  } catch (err) { res.status(500).json({ success: false, message: '查询失败' }); }
};

exports.getCommands = async (req, res) => {
  const allCommands = [
    { cmd: '/千金', name: '千里传音', minGrade: 1, minWugong: 30, file: '1' },
    { cmd: '/点穴', name: '点穴', minGrade: 1, faction: '六扇门', file: '2' },
    { cmd: '/逮捕', name: '逮捕', minGrade: 6, faction: '六扇门', file: '3' },
    { cmd: '/坐牢', name: '坐牢', minGrade: 8, faction: '六扇门', file: '4' },
    { cmd: '/警告', name: '警告', minGrade: 1, faction: '六扇门', file: '5' },
    { cmd: '/下毒', name: '下毒', minGrade: 2, file: '6' },
    { cmd: '/驱逐', name: '驱逐', minGrade: 1, needLeader: true, file: '7' },
    { cmd: '/偷钱', name: '偷钱', minGrade: 2, file: '8' },
    { cmd: '/吸星大法', name: '吸星大法', minGrade: 1, file: '9' },
    { cmd: '/投掷', name: '投掷暗器', minGrade: 2, file: '10' },
    { cmd: '/攻击', name: '攻击/比武', minGrade: 2, file: '11' },
    { cmd: '/传内力', name: '传内力', minGrade: 1, file: '12' },
    { cmd: '/赠送', name: '赠送物品', minGrade: 2, file: '13' },
    { cmd: '/给钱', name: '给钱', minGrade: 2, file: '14' },
    { cmd: '/罚款', name: '罚款', minGrade: 10, file: '25' },
    { cmd: '/加入', name: '加入门派', minGrade: 2, file: '16' },
    { cmd: '/离开', name: '离开门派', minGrade: 2, file: '17' },
    { cmd: '/查ip', name: '查IP', minGrade: 7, faction: '六扇门', file: '18' },
    { cmd: '/篡位', name: '篡位', minGrade: 1, needDeputy: true, file: '19' },
    { cmd: '/册封', name: '册封', minGrade: 1, needLeader: true, file: '20' },
    { cmd: '/跟踪私毒', name: '跟踪私毒', minGrade: 10, file: '21' },
    { cmd: '/取消跟踪', name: '取消跟踪', minGrade: 10, file: '22' },
    { cmd: '/卡片', name: '使用卡片', minGrade: 1, file: '23' },
    { cmd: '/公告', name: '公告', minGrade: 1, faction: '六扇门', file: '24' },
    { cmd: '/禁言', name: '禁言', minGrade: 1, faction: '六扇门', file: '26' },
    { cmd: '/解禁', name: '解禁', minGrade: 1, faction: '六扇门', file: '27' },
    { cmd: '/禁打', name: '禁打', minGrade: 1, faction: '六扇门', file: '28' },
    { cmd: '/开打', name: '开打', minGrade: 1, faction: '六扇门', file: '29' },
    { cmd: '/打坐', name: '打坐练功', minGrade: 1, file: '30' },
    { cmd: '/踢人', name: '踢人', minGrade: 9, faction: '六扇门', file: '31' },
    { cmd: '/心跳', name: '心跳特效', minGrade: 1, minWugong: 30, file: '32' },
    { cmd: '/怒吼', name: '怒吼特效', minGrade: 1, minWugong: 30, file: '33' },
    { cmd: '/心动', name: '心动特效', minGrade: 1, minWugong: 30, file: '34' },
    { cmd: '/拜师', name: '拜师', minGrade: 1, file: '35' },
    { cmd: '/收徒', name: '收徒', minGrade: 1, file: '36' },
    { cmd: '/站长令', name: '站长令', minGrade: 10, file: '37' },
    { cmd: '/放大', name: '放大文字', minGrade: 10, file: '38' },
    { cmd: '/帮派令', name: '帮派令', minGrade: 1, needLeader: true, file: '39' }
  ];

  const available = allCommands.filter(c => {
    if (c.minGrade > req.user.grade) return false;
    if (c.faction && req.user.faction !== c.faction && req.user.grade < 10) return false;
    return true;
  });

  res.json({ success: true, data: available });
};
