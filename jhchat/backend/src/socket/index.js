const db = require('../config/db');
const { getRandomWelcomeMessage } = require('../utils/welcomeMessages');

let lastLineNo = {};

async function getNextLineNo(roomId) {
  if (!lastLineNo[roomId]) {
    const [result] = await db.execute(
      'SELECT MAX(line_no) as maxNo FROM chat_messages WHERE room_id = ?', [roomId]
    );
    lastLineNo[roomId] = (result[0].maxNo || 0) + 1;
  } else {
    lastLineNo[roomId]++;
  }
  return lastLineNo[roomId];
}

async function broadcastMessage(io, roomId, msg) {
  // 私聊：禁止对自己发送（在插入数据库之前检查）
  if (msg.is_private && msg.sender === msg.receiver) {
    const senderSocket = await findUserSocket(io, msg.sender);
    if (senderSocket) {
      io.to(senderSocket).emit('chat:system', {
        content: '不能对自己发送私聊消息',
        type: 'private_message_self_error'
      });
    }
    return { success: false, message: '不能对自己发送私聊消息' };
  }

  const lineNo = await getNextLineNo(roomId);
  const [result] = await db.execute(
    `INSERT INTO chat_messages (room_id, line_no, is_action, is_private, sender, receiver, sender_color, msg_color, action_word, content)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [roomId, lineNo, msg.is_action ? 1 : 0, msg.is_private ? 1 : 0, msg.sender, msg.receiver || '所有人',
     msg.sender_color || '660099', msg.msg_color || '660099', msg.action_word || '', msg.content]
  );

  const [rows] = await db.execute('SELECT * FROM chat_messages WHERE id = ?', [result.insertId]);
  const chatMsg = rows[0];

  // 添加发送者和接收者的门派信息
  const [senderRows] = await db.execute('SELECT sect FROM users WHERE username = ?', [msg.sender]);
  if (senderRows && senderRows[0]) {
    chatMsg.sender_sect = senderRows[0].sect;
  }

  if (msg.receiver && msg.receiver !== '所有人') {
    const [receiverRows] = await db.execute('SELECT sect FROM users WHERE username = ?', [msg.receiver]);
    if (receiverRows && receiverRows[0]) {
      chatMsg.receiver_sect = receiverRows[0].sect;
    }
  }

  console.log(`[消息] 发送消息 - 私聊:${msg.is_private}, 发送者:${msg.sender}, 接收者:${msg.receiver}`);

  if (msg.is_private) {
    // 私聊：发送给发送者和接收者，不论是否在同一个房间
    const senderSocket = await findUserSocket(io, msg.sender);
    const receiverSocket = await findUserSocket(io, msg.receiver);
    
    console.log(`[私聊] Sender socket: ${senderSocket}, Receiver socket: ${receiverSocket}`);
    
    if (senderSocket) {
      io.to(senderSocket).emit('chat:say', chatMsg);
      console.log(`[私聊] 已发送给发送者 ${msg.sender}`);
    }
    if (receiverSocket) {
      io.to(receiverSocket).emit('chat:say', chatMsg);
      console.log(`[私聊] 已发送给接收者 ${msg.receiver}`);
    }
    
    // 如果接收者不在线，发送给发送者一个提示
    if (!receiverSocket && msg.receiver !== '所有人') {
      if (senderSocket) {
        io.to(senderSocket).emit('chat:system', {
          content: `<b>${msg.receiver}</b> 不在线，消息已发送但对方无法收到`,
          type: 'private_message_offline'
        });
        console.log(`[私聊] 接收者 ${msg.receiver} 不在线，已通知发送者`);
      }
    }
  } else {
    // 公聊：发送给房间内所有人
    console.log(`[公聊] 发送给房间 ${roomId} 的所有人`);
    io.to(`room_${roomId}`).emit('chat:say', chatMsg);
  }

  return chatMsg;
}

async function findUserSocket(io, username) {
  const sockets = await io.fetchSockets();
  for (const socket of sockets) {
    if (socket.data.username === username) {
      console.log(`[Socket] 找到用户 "${username}" 的 socket:`, socket.id);
      return socket.id;
    }
  }
  console.log(`[Socket] 未找到用户 "${username}" 的 socket`);
  return null;
}

async function sendSystemMessage(io, roomId, content) {
  return broadcastMessage(io, roomId, {
    is_action: 0,
    is_private: false,
    sender: '系统',
    receiver: '所有人',
    sender_color: 'FF0000',
    msg_color: '660099',
    action_word: '',
    content
  });
}

module.exports = function(io) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('未认证'));
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data = decoded;
      next();
    } catch (err) {
      next(new Error('令牌无效'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.id;
    const username = socket.data.username;

    socket.on('chat:join', async (data) => {
      try {
        const roomId = data?.roomId || 1;

        const [existing] = await db.execute('SELECT id FROM online_users WHERE user_id = ?', [userId]);
        if (existing.length > 0) {
          await db.execute('DELETE FROM online_users WHERE user_id = ?', [userId]);
        }

        await db.execute(
          `INSERT INTO online_users (user_id, username, room_id, avatar, gender, sect, grade, socket_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, username, roomId, socket.data.avatar || '', socket.data.gender, socket.data.sect || '无', socket.data.grade || 1, socket.id]
        );

        socket.join(`room_${roomId}`);

        const [online] = await db.execute(
          'SELECT o.user_id, o.username, o.gender, o.sect, o.avatar, u.grade FROM online_users o LEFT JOIN users u ON o.user_id = u.id WHERE o.room_id = ? ORDER BY o.username',
          [roomId]
        );
        io.to(`room_${roomId}`).emit('room:onlineUpdate', { roomId, users: online });

        const welcomeMsg = getRandomWelcomeMessage();
        await sendSystemMessage(io, roomId, `<b>${username}</b> ${welcomeMsg}`);

        socket.emit('chat:joinSuccess', { roomId });
      } catch (err) {
        console.error('chat:join错误:', err);
        socket.emit('error', { message: '加入聊天室失败' });
      }
    });

    socket.on('chat:message', async (data) => {
      try {
        const [onlineUser] = await db.execute(
          'SELECT room_id FROM online_users WHERE user_id = ?', [userId]
        );
        if (onlineUser.length === 0) return;
        const roomId = onlineUser[0].room_id;

        const [muteCheck] = await db.execute(
          'SELECT id FROM mute_list WHERE username = ? AND (expires_at IS NULL OR expires_at > NOW())',
          [username]
        );
        if (muteCheck.length > 0) {
          socket.emit('chat:system', { content: '你已被禁言' });
          return;
        }

        await db.execute(
          'UPDATE online_users SET last_active_at = NOW() WHERE user_id = ?', [userId]
        );

        let content = data.content || '';
        if (!content.trim()) return;

        content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');

        content = content.replace(/\[tu\](\d+)\[\/tu\]/g, (match, id) => {
          return `<img src="/assets/chat-images/${id}.gif" alt="表情${id}">`;
        });

        await broadcastMessage(io, roomId, {
          is_action: false,
          is_private: data.isPrivate || false,
          sender: username,
          receiver: data.receiver || '所有人',
          sender_color: data.senderColor || '660099',
          msg_color: data.msgColor || '660099',
          action_word: data.actionWord || '',
          content
        });

        if (data.isPrivate) {
          await db.execute(
            'UPDATE users SET all_value = all_value + 1, month_value = month_value + 1 WHERE id = ?',
            [userId]
          );
        }
      } catch (err) {
        console.error('chat:message错误:', err);
      }
    });

    socket.on('chat:action', async (data) => {
      try {
        const [onlineUser] = await db.execute(
          'SELECT room_id FROM online_users WHERE user_id = ?', [userId]
        );
        if (onlineUser.length === 0) return;
        const roomId = onlineUser[0].room_id;

        // 检查是否对自己发送动作
        if (data.receiver && data.receiver !== '所有人' && data.receiver === username) {
          socket.emit('chat:system', {
            content: '不能对自己执行动作',
            type: 'action_self_error'
          });
          return;
        }

        const [actions] = await db.execute(
          'SELECT template FROM chat_actions WHERE name = ?', [data.actionName]
        );
        if (actions.length === 0) return;

        let content = actions[0].template
          .replace(/##/g, `<b>${username}</b>`)
          .replace(/%%/g, `<b>${data.receiver || '所有人'}</b>`);

        await broadcastMessage(io, roomId, {
          is_action: true,
          is_private: false,
          sender: username,
          receiver: data.receiver || '所有人',
          sender_color: '660099',
          msg_color: '660099',
          action_word: '',
          content
        });
      } catch (err) {
        console.error('chat:action 错误:', err);
      }
    });

    socket.on('chat:command', async (data) => {
      try {
        const { command, target, args } = data;
        const commandHandler = require('./commands');
        const result = await commandHandler.handle(command, target, args, {
          userId, username, grade: socket.data.grade,
          faction: socket.data.faction, sect: socket.data.sect,
          sect_title: socket.data.sect_title, io, socket
        });
        socket.emit('chat:commandResult', result);
      } catch (err) {
        console.error('chat:command错误:', err);
        socket.emit('chat:commandResult', { success: false, message: err.message });
      }
    });

    socket.on('room:change', async (data) => {
      try {
        const newRoomId = data.roomId;
        const [onlineUser] = await db.execute(
          'SELECT room_id FROM online_users WHERE user_id = ?', [userId]
        );
        const oldRoomId = onlineUser.length > 0 ? onlineUser[0].room_id : 1;

        if (oldRoomId === newRoomId) return;

        socket.leave(`room_${oldRoomId}`);
        await sendSystemMessage(io, oldRoomId, `<b>${username}</b> 离开了房间`);

        await db.execute('UPDATE online_users SET room_id = ? WHERE user_id = ?', [newRoomId, userId]);
        await db.execute('UPDATE users SET room_id = ? WHERE id = ?', [newRoomId, userId]);
        socket.join(`room_${newRoomId}`);

        const [oldOnline] = await db.execute(
          'SELECT user_id, username, gender, sect, avatar FROM online_users WHERE room_id = ? ORDER BY username',
          [oldRoomId]
        );
        io.to(`room_${oldRoomId}`).emit('room:onlineUpdate', { roomId: oldRoomId, users: oldOnline });

        const [newOnline] = await db.execute(
          'SELECT o.user_id, o.username, o.gender, o.sect, o.avatar, u.grade FROM online_users o LEFT JOIN users u ON o.user_id = u.id WHERE o.room_id = ? ORDER BY o.username',
          [newRoomId]
        );
        io.to(`room_${newRoomId}`).emit('room:onlineUpdate', { roomId: newRoomId, users: newOnline });

        const welcomeMsg = getRandomWelcomeMessage();
        await sendSystemMessage(io, newRoomId, `<b>${username}</b> ${welcomeMsg}`);

        socket.emit('chat:joinSuccess', { roomId: newRoomId });
      } catch (err) {
        console.error('room:change错误:', err);
      }
    });

    socket.on('disconnect', async () => {
      try {
        const [onlineUser] = await db.execute(
          'SELECT room_id FROM online_users WHERE user_id = ?', [userId]
        );
        if (onlineUser.length > 0) {
          const roomId = onlineUser[0].room_id;
          await db.execute('DELETE FROM online_users WHERE user_id = ?', [userId]);
          await sendSystemMessage(io, roomId, `<b>${username}</b> 离开了笑傲江湖`);

          const [online] = await db.execute(
            'SELECT o.user_id, o.username, o.gender, o.sect, o.avatar, u.grade FROM online_users o LEFT JOIN users u ON o.user_id = u.id WHERE o.room_id = ? ORDER BY o.username',
            [roomId]
          );
          io.to(`room_${roomId}`).emit('room:onlineUpdate', { roomId, users: online });
        }
      } catch (err) {
        console.error('disconnect错误:', err);
      }
    });
  });
};

module.exports.broadcastMessage = broadcastMessage;
module.exports.sendSystemMessage = sendSystemMessage;

// 随机事件定时器 - 每 2-5 分钟随机触发一次
const randomEventCtrl = require('../controllers/randomEvent');

function scheduleNextRandomEvent(io) {
  const delay = Math.floor(Math.random() * 180000) + 120000; // 2-5 分钟随机
  
  setTimeout(async () => {
    try {
      // 获取所有房间的在线用户
      const [rooms] = await db.execute('SELECT DISTINCT room_id FROM online_users');
      
      for (const room of rooms) {
        const roomId = room.room_id;
        const [onlineUsers] = await db.execute(
          'SELECT user_id, username, grade FROM online_users WHERE room_id = ?',
          [roomId]
        );
        
        if (onlineUsers.length === 0) continue;
        
        // 触发随机事件
        const result = await randomEventCtrl.triggerRandomEvent(io, onlineUsers);
        
        if (result && result.message) {
          // 在聊天室广播随机事件消息
          await sendSystemMessage(io, roomId, `🎲 ${result.message}`);
          
          // 通知所有客户端更新用户状态
          io.to(`room_${roomId}`).emit('room:onlineUpdate', { roomId, users: onlineUsers });
        }
      }
      
      // 调度下一次随机事件
      scheduleNextRandomEvent(io);
    } catch (err) {
      console.error('随机事件调度错误:', err);
      // 即使出错也继续调度
      scheduleNextRandomEvent(io);
    }
  }, delay);
  
  console.log(`下次随机事件将在 ${Math.round(delay/60000)} 分钟后触发`);
}

// 启动随机事件定时器
function startRandomEventScheduler(io) {
  console.log('启动随机事件定时器...');
  scheduleNextRandomEvent(io);
}

module.exports.startRandomEventScheduler = startRandomEventScheduler;
