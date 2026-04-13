const db = require('../config/db');

async function getUser(username) {
  const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
  return users.length > 0 ? users[0] : null;
}

async function isOnline(username) {
  const [rows] = await db.execute('SELECT id FROM online_users WHERE username = ?', [username]);
  return rows.length > 0;
}

function checkPermission(ctx, opts) {
  if (opts.minGrade && ctx.grade < opts.minGrade) return `需要等级${opts.minGrade}`;
  if (opts.faction && ctx.faction !== opts.faction && ctx.grade < 10) return `需要${opts.faction}身份`;
  if (opts.sectLeader && ctx.sect_title !== '掌门' && ctx.grade < 10) return '需要掌门身份';
  return null;
}

const handlers = {
  'announce': async (target, args, ctx) => {
    const permErr = checkPermission(ctx, { minWugong: 30 });
    if (permErr) return { success: false, message: permErr };
    const user = await getUser(ctx.username);
    if (user.wugong < 30) return { success: false, message: '武功不足30' };
    return { success: true, message: '千里传音已发出', effect: 'marquee' };
  },

  'acupoint': async (target, args, ctx) => {
    const permErr = checkPermission(ctx, { faction: '逍遥派' });
    if (permErr) return { success: false, message: permErr };
    if (!target) return { success: false, message: '请指定目标' };
    if (!(await isOnline(target))) return { success: false, message: '目标不在线' };
    return { success: true, message: `对${target}使用了点穴`, effect: 'kick', target };
  },

  'arrest': async (target, args, ctx) => {
    const permErr = checkPermission(ctx, { minGrade: 6, faction: '逍遥派' });
    if (permErr) return { success: false, message: permErr };
    if (!target) return { success: false, message: '请指定目标' };
    const t = await getUser(target);
    if (!t) return { success: false, message: '目标不存在' };
    const [cards] = await db.execute("SELECT id FROM user_cards WHERE card_name = '免罪卡' AND owner = ? AND quantity > 0", [target]);
    if (cards.length > 0) {
      await db.execute('UPDATE user_cards SET quantity = quantity - 1 WHERE id = ?', [cards[0].id]);
      return { success: true, message: `${target}使用了免罪卡，逮捕失败` };
    }
    await db.execute("UPDATE users SET status = 'jailed', jailed_at = NOW() WHERE username = ?", [target]);
    return { success: true, message: `${target}已被逮捕`, effect: 'arrest', target };
  },

  'jail': async (target, args, ctx) => {
    const permErr = checkPermission(ctx, { minGrade: 8, faction: '逍遥派' });
    if (permErr) return { success: false, message: permErr };
    if (!target) return { success: false, message: '请指定目标' };
    await db.execute("UPDATE users SET status = 'jailed', jailed_at = NOW() WHERE username = ?", [target]);
    return { success: true, message: `${target}已被关入牢房`, effect: 'jail', target };
  },

  'warn': async (target, args, ctx) => {
    const permErr = checkPermission(ctx, { faction: '逍遥派' });
    if (permErr) return { success: false, message: permErr };
    if (!target) return { success: false, message: '请指定目标' };
    return { success: true, message: `对${target}发出了警告`, effect: 'warn', target };
  },

  'poison': async (target, args, ctx) => {
    if (ctx.grade < 2) return { success: false, message: '需要等级2以上' };
    if (!target) return { success: false, message: '请指定目标' };
    const [poisons] = await db.execute(
      "SELECT id, name, quantity FROM items WHERE owner = ? AND name LIKE '%毒%' AND quantity > 0 LIMIT 1",
      [ctx.username]
    );
    if (poisons.length === 0) return { success: false, message: '你没有毒药' };
    await db.execute('UPDATE items SET quantity = quantity - 1 WHERE id = ?', [poisons[0].id]);
    const t = await getUser(target);
    if (!t) return { success: false, message: '目标不存在' };
    const damage = Math.floor(Math.random() * 500) + 100;
    await db.execute('UPDATE users SET tili = GREATEST(0, tili - ?) WHERE username = ?', [damage, target]);
    return { success: true, message: `对${target}下毒，造成${damage}伤害`, effect: 'poison', target, damage };
  },

  'expel': async (target, args, ctx) => {
    const permErr = checkPermission(ctx, { sectLeader: true });
    if (permErr) return { success: false, message: permErr };
    if (!target) return { success: false, message: '请指定目标' };
    const t = await getUser(target);
    if (!t || t.sect !== ctx.sect) return { success: false, message: '目标不是你的门派成员' };
    await db.execute("UPDATE users SET sect = '无', sect_title = '无', join_sect_at = NULL WHERE username = ?", [target]);
    await db.execute('UPDATE sects SET member_count = GREATEST(0, member_count - 1) WHERE name = ?', [ctx.sect]);
    return { success: true, message: `已将${target}驱逐出${ctx.sect}`, effect: 'expel', target };
  },

  'steal': async (target, args, ctx) => {
    if (ctx.grade < 2) return { success: false, message: '需要等级2以上' };
    if (!target) return { success: false, message: '请指定目标' };
    const t = await getUser(target);
    if (!t || t.silver < 3000) return { success: false, message: '目标银两不足3000' };
    const success = Math.random() > 0.5;
    if (success) {
      const amount = Math.floor(Math.random() * Math.min(t.silver * 0.1, 5000)) + 100;
      await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [amount, ctx.userId]);
      await db.execute('UPDATE users SET silver = GREATEST(0, silver - ?) WHERE username = ?', [amount, target]);
      return { success: true, message: `偷了${target}${amount}两银子`, amount };
    } else {
      return { success: true, message: `偷${target}的钱失败了` };
    }
  },

  'absorb': async (target, args, ctx) => {
    if (!target) return { success: false, message: '请指定目标' };
    const user = await getUser(ctx.username);
    if (user.neili + user.tili <= 1000) return { success: false, message: '内力+体力不足1000' };
    await db.execute('UPDATE users SET silver = silver + 50 WHERE id = ?', [ctx.userId]);
    return { success: true, message: `对${target}使用了吸星大法，获得50两` };
  },

  'throw': async (target, args, ctx) => {
    if (ctx.grade < 2) return { success: false, message: '需要等级2以上' };
    if (!target) return { success: false, message: '请指定目标' };
    const [items] = await db.execute(
      "SELECT id, name, attack FROM items WHERE owner = ? AND type = '暗器' AND quantity > 0 LIMIT 1",
      [ctx.username]
    );
    if (items.length === 0) return { success: false, message: '你没有暗器' };
    const item = items[0];
    await db.execute('UPDATE items SET quantity = quantity - 1 WHERE id = ?', [item.id]);
    return { success: true, message: `对${target}投掷了${item.name}`, effect: 'throw', target, damage: item.attack };
  },

  'attack': async (target, args, ctx) => {
    if (ctx.grade < 2) return { success: false, message: '需要等级2以上' };
    if (!target) return { success: false, message: '请指定目标' };
    const t = await getUser(target);
    if (!t) return { success: false, message: '目标不存在' };
    const attacker = await getUser(ctx.username);
    const kills = Math.floor((attacker.neili * 60000000 + attacker.neili + attacker.wugong * 1000000) * 1);
    const defense = attacker.wugong + (t.neili * 1.4) || 1;
    const damage = Math.floor(kills / Math.max(defense, 1));
    const newTili = t.tili - damage;
    if (newTili <= -1000) {
      await db.execute("UPDATE users SET status = 'dead', tili = 0 WHERE username = ?", [target]);
      await db.execute(
        'INSERT INTO kill_logs (victim, killer, skill) VALUES (?, ?, ?)',
        [target, ctx.username, '比武']
      );
      return { success: true, message: `你击败了${target}！`, effect: 'kill', target, damage };
    }
    await db.execute('UPDATE users SET tili = ? WHERE username = ?', [newTili, target]);
    return { success: true, message: `对${target}造成${damage}伤害`, effect: 'attack', target, damage };
  },

  'transfer-neili': async (target, args, ctx) => {
    if (!target) return { success: false, message: '请指定目标' };
    const t = await getUser(target);
    if (!t || t.sect !== ctx.sect) return { success: false, message: '只能传给同门' };
    const user = await getUser(ctx.username);
    const amount = Math.floor(user.neili / 3);
    if (amount <= 0) return { success: false, message: '内力不足' };
    await db.execute('UPDATE users SET neili = neili - ? WHERE id = ?', [amount, ctx.userId]);
    await db.execute('UPDATE users SET neili = neili + ? WHERE username = ?', [amount, target]);
    return { success: true, message: `向${target}传输了${amount}内力`, amount };
  },

  'gift': async (target, args, ctx) => {
    if (ctx.grade < 2) return { success: false, message: '需要等级2以上' };
    if (!target || !args?.itemName) return { success: false, message: '请指定目标和物品' };
    const [items] = await db.execute(
      'SELECT id, name FROM items WHERE owner = ? AND name = ? AND quantity > 0 AND is_equipped = 0 LIMIT 1',
      [ctx.username, args.itemName]
    );
    if (items.length === 0) return { success: false, message: '没有可赠送的物品' };
    await db.execute('UPDATE items SET owner = ? WHERE id = ?', [target, items[0].id]);
    return { success: true, message: `将${items[0].name}赠送给了${target}` };
  },

  'give-money': async (target, args, ctx) => {
    if (ctx.grade < 2) return { success: false, message: '需要等级2以上' };
    const amount = parseInt(args?.amount);
    if (!target || !amount || amount <= 0) return { success: false, message: '请指定目标和金额' };
    if (amount > 1000000) return { success: false, message: '最多给100万两' };
    const user = await getUser(ctx.username);
    if (user.silver < amount) return { success: false, message: '银两不足' };
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [amount, ctx.userId]);
    await db.execute('UPDATE users SET silver = silver + ? WHERE username = ?', [amount, target]);
    return { success: true, message: `给${target}${amount}两银子`, amount };
  },

  'fine': async (target, args, ctx) => {
    if (ctx.grade < 10) return { success: false, message: '需要站长权限' };
    const amount = parseInt(args?.amount) || 1000;
    if (!target) return { success: false, message: '请指定目标' };
    await db.execute('UPDATE users SET silver = GREATEST(0, silver - ?) WHERE username = ?', [amount, target]);
    return { success: true, message: `对${target}罚款${amount}两`, amount };
  },

  'join-sect': async (target, args, ctx) => {
    if (ctx.grade < 2) return { success: false, message: '需要等级2以上' };
    if (!target) return { success: false, message: '请指定门派' };
    const user = await getUser(ctx.username);
    if (user.sect !== '无') return { success: false, message: '你已有门派' };
    const [sects] = await db.execute('SELECT * FROM sects WHERE name = ?', [target]);
    if (sects.length === 0) return { success: false, message: '门派不存在' };
    const sect = sects[0];
    if (sect.fit_gender === 'male' && user.gender !== 'male') return { success: false, message: '该门派只收男性' };
    if (sect.fit_gender === 'female' && user.gender !== 'female') return { success: false, message: '该门派只收女性' };
    await db.execute("UPDATE users SET sect = ?, sect_title = '弟子', join_sect_at = NOW() WHERE id = ?", [target, ctx.userId]);
    await db.execute('UPDATE sects SET member_count = member_count + 1 WHERE name = ?', [target]);
    return { success: true, message: `成功加入${target}` };
  },

  'leave-sect': async (target, args, ctx) => {
    const user = await getUser(ctx.username);
    if (user.sect === '无') return { success: false, message: '你没有门派' };
    if (user.silver < 50000) return { success: false, message: '离开门派需要5万两' };
    await db.execute("UPDATE users SET sect = '无', sect_title = '无', silver = silver - 50000, neili = GREATEST(0, neili - 500) WHERE id = ?", [ctx.userId]);
    await db.execute('UPDATE sects SET member_count = GREATEST(0, member_count - 1) WHERE name = ?', [user.sect]);
    return { success: true, message: `离开了${user.sect}，扣除5万两和500内力` };
  },

  'check-ip': async (target, args, ctx) => {
    const permErr = checkPermission(ctx, { minGrade: 7, faction: '逍遥派' });
    if (permErr) return { success: false, message: permErr };
    if (!target) return { success: false, message: '请指定目标' };
    const t = await getUser(target);
    if (!t) return { success: false, message: '用户不存在' };
    let ip = t.last_login_ip || '未知';
    if (ctx.grade < 10) {
      const parts = ip.split('.');
      ip = parts[0] + '.' + parts[1] + '.*.*';
    }
    return { success: true, message: `${target}的IP: ${ip}`, ip };
  },

  'usurp': async (target, args, ctx) => {
    const user = await getUser(ctx.username);
    if (user.sect_title !== '副掌门') return { success: false, message: '只有副掌门才能篡位' };
    const [sects] = await db.execute('SELECT leader FROM sects WHERE name = ?', [user.sect]);
    if (sects.length === 0 || !sects[0].leader) return { success: false, message: '无法篡位' };
    await db.execute("UPDATE users SET sect_title = '掌门' WHERE id = ?", [ctx.userId]);
    await db.execute("UPDATE users SET sect_title = '弟子' WHERE username = ?", [sects[0].leader]);
    await db.execute('UPDATE sects SET leader = ? WHERE name = ?', [ctx.username, user.sect]);
    return { success: true, message: `篡位成功，你已成为${user.sect}掌门` };
  },

  'enfeoff': async (target, args, ctx) => {
    const permErr = checkPermission(ctx, { sectLeader: true });
    if (permErr) return { success: false, message: permErr };
    if (!target || !args?.title) return { success: false, message: '请指定目标和封号' };
    const t = await getUser(target);
    if (!t || t.sect !== ctx.sect) return { success: false, message: '目标不是你门派成员' };
    await db.execute('UPDATE users SET sect_title = ? WHERE username = ?', [args.title, target]);
    return { success: true, message: `册封${target}为${args.title}` };
  },

  'mute': async (target, args, ctx) => {
    const permErr = checkPermission(ctx, { faction: '逍遥派' });
    if (permErr) return { success: false, message: permErr };
    if (!target) return { success: false, message: '请指定目标' };
    const duration = parseInt(args?.duration) || 10;
    await db.execute(
      'INSERT INTO mute_list (username, muted_by, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))',
      [target, ctx.username, duration]
    );
    return { success: true, message: `已禁言${target}${duration}分钟`, target, duration };
  },

  'unmute': async (target, args, ctx) => {
    const permErr = checkPermission(ctx, { faction: '逍遥派' });
    if (permErr) return { success: false, message: permErr };
    if (!target) return { success: false, message: '请指定目标' };
    await db.execute('DELETE FROM mute_list WHERE username = ?', [target]);
    return { success: true, message: `已解除${target}的禁言` };
  },

  'ban-fight': async (target, args, ctx) => {
    const permErr = checkPermission(ctx, { faction: '逍遥派' });
    if (permErr) return { success: false, message: permErr };
    if (!target) return { success: false, message: '请指定目标' };
    const [online] = await db.execute('SELECT room_id FROM online_users WHERE username = ?', [target]);
    const roomId = online.length > 0 ? online[0].room_id : 1;
    await db.execute('INSERT INTO fight_bans (username, room_id) VALUES (?, ?)', [target, roomId]);
    return { success: true, message: `已禁止${target}比武` };
  },

  'allow-fight': async (target, args, ctx) => {
    const permErr = checkPermission(ctx, { faction: '逍遥派' });
    if (permErr) return { success: false, message: permErr };
    if (!target) return { success: false, message: '请指定目标' };
    await db.execute('DELETE FROM fight_bans WHERE username = ?', [target]);
    return { success: true, message: `已允许${target}比武` };
  },

  'meditate': async (target, args, ctx) => {
    const user = await getUser(ctx.username);
    if (user.silver < 1000) return { success: false, message: '银两不足1000' };
    const gain = Math.floor(Math.random() * 100) + 50;
    await db.execute('UPDATE users SET silver = silver - 1000, neili = neili + ?, wugong = wugong + ? WHERE id = ?', [gain, Math.floor(gain / 10), ctx.userId]);
    return { success: true, message: `打坐练功，内力+${gain}，武功+${Math.floor(gain / 10)}`, gain };
  },

  'kick': async (target, args, ctx) => {
    const permErr = checkPermission(ctx, { minGrade: 9, faction: '逍遥派' });
    if (permErr) return { success: false, message: permErr };
    if (!target) return { success: false, message: '请指定目标' };
    if (!(await isOnline(target))) return { success: false, message: '目标不在线' };
    return { success: true, message: `已踢出${target}`, effect: 'kick', target };
  },

  'heartbeat': async (target, args, ctx) => {
    const user = await getUser(ctx.username);
    if (user.wugong < 30) return { success: false, message: '武功不足30' };
    return { success: true, message: '心跳特效', effect: 'heartbeat' };
  },

  'roar': async (target, args, ctx) => {
    const user = await getUser(ctx.username);
    if (user.wugong < 30) return { success: false, message: '武功不足30' };
    return { success: true, message: '怒吼特效', effect: 'roar' };
  },

  'heartbeat-skip': async (target, args, ctx) => {
    const user = await getUser(ctx.username);
    if (user.wugong < 30) return { success: false, message: '武功不足30' };
    return { success: true, message: '心动特效', effect: 'heartSkip' };
  },

  'apprentice': async (target, args, ctx) => {
    if (!target) return { success: false, message: '请指定师父' };
    const user = await getUser(ctx.username);
    if (user.master && user.master !== '无') return { success: false, message: '你已有师父' };
    if (user.silver < 500000) return { success: false, message: '拜师需要50万两' };
    const t = await getUser(target);
    if (!t) return { success: false, message: '师父不存在' };
    await db.execute('UPDATE users SET silver = silver - 500000, master = ? WHERE id = ?', [target, ctx.userId]);
    return { success: true, message: `拜${target}为师，花费50万两` };
  },

  'accept-disciple': async (target, args, ctx) => {
    if (!target) return { success: false, message: '请指定徒弟' };
    return { success: true, message: `已收${target}为徒` };
  },

  'admin-order': async (target, args, ctx) => {
    if (ctx.grade < 10) return { success: false, message: '需要站长权限' };
    const msg = args?.message || '站长通令';
    return { success: true, message: `站长令: ${msg}`, effect: 'adminOrder' };
  },

  'enlarge': async (target, args, ctx) => {
    if (ctx.grade < 10) return { success: false, message: '需要站长权限' };
    return { success: true, message: '放大文字', effect: 'enlarge' };
  },

  'faction-order': async (target, args, ctx) => {
    const permErr = checkPermission(ctx, { sectLeader: true });
    if (permErr) return { success: false, message: permErr };
    const msg = args?.message || '帮派令';
    return { success: true, message: `${ctx.sect}帮派令: ${msg}`, effect: 'factionOrder' };
  },

  'use-card': async (target, args, ctx) => {
    if (!args?.cardName) return { success: false, message: '请指定卡片' };
    const [cards] = await db.execute(
      'SELECT id, card_name, quantity FROM user_cards WHERE owner = ? AND card_name = ? AND quantity > 0',
      [ctx.username, args.cardName]
    );
    if (cards.length === 0) return { success: false, message: '你没有该卡片' };

    const cardEffects = {
      '变性卡': async () => {
        const user = await getUser(ctx.username);
        if (user.spouse !== '无') return { success: false, message: '已婚不能变性' };
        const newGender = user.gender === 'male' ? 'female' : 'male';
        await db.execute('UPDATE users SET gender = ? WHERE id = ?', [newGender, ctx.userId]);
        return { success: true, message: `变性成功，现在是${newGender === 'male' ? '男' : '女'}` };
      },
      '踢人卡': async () => {
        if (!target) return { success: false, message: '请指定目标' };
        return { success: true, message: `对${target}使用了踢人卡`, effect: 'kick', target };
      },
      '大牢卡': async () => {
        if (!target) return { success: false, message: '请指定目标' };
        await db.execute("UPDATE users SET status = 'jailed', jailed_at = NOW() WHERE username = ?", [target]);
        return { success: true, message: `${target}被关入大牢3天`, target };
      },
      '财神卡': async () => {
        if (!target) return { success: false, message: '请指定目标' };
        const t = await getUser(target);
        if (!t) return { success: false, message: '目标不存在' };
        const amount = Math.floor(t.silver * 0.2);
        await db.execute('UPDATE users SET silver = GREATEST(0, silver - ?) WHERE username = ?', [amount, target]);
        await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [amount, ctx.userId]);
        return { success: true, message: `从${target}抢了${amount}两`, amount };
      },
      '催眠卡': async () => {
        if (!target) return { success: false, message: '请指定目标' };
        return { success: true, message: `对${target}使用了催眠卡`, effect: 'sleep', target };
      },
      '升级卡': async () => {
        const user = await getUser(ctx.username);
        if (user.grade >= 5) return { success: false, message: '等级已达上限5' };
        await db.execute('UPDATE users SET grade = grade + 1 WHERE id = ?', [ctx.userId]);
        return { success: true, message: '等级+1' };
      },
      '情人卡': async () => {
        if (!target) return { success: false, message: '请指定目标' };
        const user = await getUser(ctx.username);
        const t = await getUser(target);
        if (!t) return { success: false, message: '目标不存在' };
        if (user.gender === t.gender) return { success: false, message: '需要异性' };
        if (user.spouse !== '无' || t.spouse !== '无') return { success: false, message: '双方需未婚' };
        await db.execute('UPDATE users SET spouse = ? WHERE id = ?', [target, ctx.userId]);
        await db.execute('UPDATE users SET spouse = ? WHERE username = ?', [ctx.username, target]);
        return { success: true, message: `与${target}结为夫妻` };
      },
      '强盗花': async () => {
        if (!target) return { success: false, message: '请指定目标' };
        const [items] = await db.execute(
          "SELECT id, name FROM items WHERE owner = ? AND is_equipped = 0 AND quantity > 0 LIMIT 1",
          [target]
        );
        if (items.length === 0) return { success: false, message: '目标没有可偷的物品' };
        await db.execute('UPDATE items SET owner = ? WHERE id = ?', [ctx.username, items[0].id]);
        return { success: true, message: `偷了${target}的${items[0].name}` };
      }
    };

    const cardName = args.cardName;
    if (cardEffects[cardName]) {
      const result = await cardEffects[cardName]();
      if (result.success) {
        await db.execute('UPDATE user_cards SET quantity = quantity - 1 WHERE id = ?', [cards[0].id]);
      }
      return result;
    }
    return { success: false, message: '未知卡片类型' };
  },

  'bulletin': async (target, args, ctx) => {
    const permErr = checkPermission(ctx, { faction: '逍遥派' });
    if (permErr) return { success: false, message: permErr };
    const msg = args?.message || '';
    if (!msg) return { success: false, message: '请输入公告内容' };
    await db.execute('INSERT INTO announcements (content) VALUES (?) ON DUPLICATE KEY UPDATE content = ?', [msg, msg]);
    return { success: true, message: '公告已发布' };
  },

  'track': async (target, args, ctx) => {
    if (ctx.grade < 10) return { success: false, message: '需要站长权限' };
    return { success: true, message: `已开启跟踪${target || '私毒'}` };
  },

  'untrack': async (target, args, ctx) => {
    if (ctx.grade < 10) return { success: false, message: '需要站长权限' };
    return { success: true, message: '已取消跟踪' };
  }
};

exports.handle = async function(command, target, args, ctx) {
  const handler = handlers[command];
  if (!handler) return { success: false, message: `未知命令: ${command}` };
  return handler(target, args || {}, ctx);
};
