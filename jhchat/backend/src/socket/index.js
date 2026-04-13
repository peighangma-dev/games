const db = require('../config/db');

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
  const lineNo = await getNextLineNo(roomId);
  const [result] = await db.execute(
    `INSERT INTO chat_messages (room_id, line_no, is_action, is_private, sender, receiver, sender_color, msg_color, action_word, content)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [roomId, lineNo, msg.is_action ? 1 : 0, msg.is_private ? 1 : 0, msg.sender, msg.receiver || '所有人',
     msg.sender_color || '660099', msg.msg_color || '660099', msg.action_word || '', msg.content]
  );

  const [rows] = await db.execute('SELECT * FROM chat_messages WHERE id = ?', [result.insertId]);
  const chatMsg = rows[0];

  if (msg.is_private) {
    const senderSocket = await findUserSocket(io, msg.sender);
    const receiverSocket = await findUserSocket(io, msg.receiver);
    if (senderSocket) io.to(senderSocket).emit('chat:say', chatMsg);
    if (receiverSocket) io.to(receiverSocket).emit('chat:say', chatMsg);
  } else {
    io.to(`room_${roomId}`).emit('chat:say', chatMsg);
  }

  return chatMsg;
}

async function findUserSocket(io, username) {
  const sockets = await io.fetchSockets();
  for (const socket of sockets) {
    if (socket.data.username === username) return socket.id;
  }
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
          `INSERT INTO online_users (user_id, username, room_id, avatar, gender, sect, socket_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, username, roomId, socket.data.avatar || '', socket.data.gender, socket.data.sect || '无', socket.id]
        );

        socket.join(`room_${roomId}`);

        const [online] = await db.execute(
          'SELECT user_id, username, gender, sect, avatar FROM online_users WHERE room_id = ? ORDER BY username',
          [roomId]
        );
        io.to(`room_${roomId}`).emit('room:onlineUpdate', { roomId, users: online });

        await sendSystemMessage(io, roomId, `<b>${username}</b> 来到了笑傲江湖`);

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
          return `<img src="/assets/emoticons/${id}.gif" alt="表情${id}">`;
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
        console.error('chat:action错误:', err);
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
          'SELECT user_id, username, gender, sect, avatar FROM online_users WHERE room_id = ? ORDER BY username',
          [newRoomId]
        );
        io.to(`room_${newRoomId}`).emit('room:onlineUpdate', { roomId: newRoomId, users: newOnline });

        await sendSystemMessage(io, newRoomId, `<b>${username}</b> 来到了房间`);

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
            'SELECT user_id, username, gender, sect, avatar FROM online_users WHERE room_id = ? ORDER BY username',
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
