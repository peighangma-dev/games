const db = require('../config/db');

function drawCard() {
  const suits = ['H', 'D', 'C', 'S']; // Hearts, Diamonds, Clubs, Spades
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const suit = suits[Math.floor(Math.random() * suits.length)];
  const value = values[Math.floor(Math.random() * values.length)];
  return suit + value; // 返回如 "H10", "SA", "D3" 等格式
}

function calcPoints(cardStr) {
  if (!cardStr) return 0;
  const cards = cardStr.split(',').filter(Boolean);
  let points = 0;
  let aces = 0;
  for (const c of cards) {
    // 提取点数部分（去掉花色）
    const value = c.substring(1);
    if (value === 'A') { points += 11; aces++; }
    else if (['J', 'Q', 'K'].includes(value)) points += 10;
    else points += parseInt(value) || 0;
  }
  while (points > 21 && aces > 0) { points -= 10; aces--; }
  return points;
}

exports.getBlackjack = async (req, res) => {
  try {
    const [games] = await db.execute('SELECT * FROM blackjack_games WHERE username = ?', [req.user.username]);
    if (games.length === 0) return res.json({ success: true, data: null });
    const g = games[0];
    res.json({
      success: true,
      data: {
        dealerCards: g.dealer_cards,
        dealerPoints: g.dealer_points,
        playerCards: g.player_cards,
        playerPoints: g.player_points,
        bet: g.bet,
        wins: g.wins
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询21点状态失败' });
  }
};

exports.blackjackBet = async (req, res) => {
  try {
    const { bet } = req.body;
    if (!bet || bet <= 0) return res.status(400).json({ success: false, message: '下注金额无效' });
    const [users] = await db.execute('SELECT id, silver, total_exp FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < bet) return res.status(400).json({ success: false, message: '银两不足' });
    
    // 获取用户连胜记录
    const [streakData] = await db.execute(
      'SELECT blackjack_streak FROM game_statistics WHERE user_id = ?',
      [req.user.id]
    );
    const currentStreak = streakData.length > 0 ? streakData[0].blackjack_streak : 0;
    
    const p1 = drawCard(), p2 = drawCard(), d1 = drawCard();
    const playerCards = `${p1},${p2}`;
    const dealerCards = d1;
    const playerPoints = calcPoints(playerCards);
    const dealerPoints = calcPoints(dealerCards);
    
    // 检查是否有幸运 Buff
    const [bonuses] = await db.execute(
      "SELECT SUM(bonus_value) as total FROM game_bonuses WHERE user_id = ? AND bonus_type = 'charm' AND expires_at > NOW()",
      [req.user.id]
    );
    const luckBonus = bonuses[0]?.total || 0;
    const luckMultiplier = 1 + Math.min(luckBonus / 1000, 0.3); // 最高 30% 加成
    
    await db.execute(
      `INSERT INTO blackjack_games (username, dealer_cards, dealer_points, player_cards, player_points, bet, wins, streak)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)
       ON DUPLICATE KEY UPDATE dealer_cards=?, dealer_points=?, player_cards=?, player_points=?, bet=?, wins=0, streak=?`,
      [req.user.username, dealerCards, dealerPoints, playerCards, playerPoints, bet, currentStreak,
       dealerCards, dealerPoints, playerCards, playerPoints, bet, currentStreak]
    );
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [bet, req.user.id]);
    
    // 天生 21 点（Blackjack）
    if (playerPoints === 21) {
      const baseWin = Math.floor(bet * 2.5);
      const winAmount = Math.floor(baseWin * luckMultiplier);
      const bonusExp = Math.floor(bet / 10);
      await db.execute('UPDATE users SET silver = silver + ?, total_exp = total_exp + ? WHERE id = ?', [winAmount, bonusExp, req.user.id]);
      await db.execute('DELETE FROM blackjack_games WHERE username = ?', [req.user.username]);
      
      // 更新连胜
      await db.execute(
        `INSERT INTO game_statistics (user_id, total_games, total_wins, blackjack_streak, best_blackjack_streak)
         VALUES (?, 1, 1, 1, 1)
         ON DUPLICATE KEY UPDATE 
         total_games = total_games + 1,
         total_wins = total_wins + 1,
         blackjack_streak = blackjack_streak + 1,
         best_blackjack_streak = GREATEST(best_blackjack_streak, blackjack_streak + 1)`,
        [req.user.id]
      );
      
      return res.json({ 
        success: true, 
        data: { 
          playerCards, 
          dealerCards, 
          playerPoints: 21, 
          result: 'blackjack', 
          winAmount,
          bonusExp,
          streak: currentStreak + 1
        } 
      });
    }
    
    res.json({ 
      success: true, 
      data: { 
        playerCards, 
        dealerCards, 
        playerPoints, 
        dealerPoints, 
        bet,
        streak: currentStreak,
        luckBonus: Math.round((luckMultiplier - 1) * 100)
      } 
    });
  } catch (err) {
    console.error('21 点下注错误:', err);
    res.status(500).json({ success: false, message: '下注失败' });
  }
};

exports.blackjackHit = async (req, res) => {
  try {
    const [games] = await db.execute('SELECT * FROM blackjack_games WHERE username = ?', [req.user.username]);
    if (games.length === 0) return res.status(400).json({ success: false, message: '没有进行中的游戏' });
    const g = games[0];
    const newCard = drawCard();
    const playerCards = `${g.player_cards},${newCard}`;
    const playerPoints = calcPoints(playerCards);
    if (playerPoints > 21) {
      await db.execute('DELETE FROM blackjack_games WHERE username = ?', [req.user.username]);
      return res.json({ success: true, data: { playerCards, playerPoints, result: 'bust', loss: g.bet } });
    }
    await db.execute(
      'UPDATE blackjack_games SET player_cards = ?, player_points = ? WHERE username = ?',
      [playerCards, playerPoints, req.user.username]
    );
    res.json({ success: true, data: { playerCards, playerPoints, bet: g.bet } });
  } catch (err) {
    res.status(500).json({ success: false, message: '要牌失败' });
  }
};

exports.blackjackStand = async (req, res) => {
  try {
    const [games] = await db.execute('SELECT * FROM blackjack_games WHERE username = ?', [req.user.username]);
    if (games.length === 0) return res.status(400).json({ success: false, message: '没有进行中的游戏' });
    const g = games[0];
    let dealerCards = g.dealer_cards;
    let dealerPoints = calcPoints(dealerCards);
    
    // 庄家要牌逻辑
    while (dealerPoints < 17) {
      const c = drawCard();
      dealerCards = `${dealerCards},${c}`;
      dealerPoints = calcPoints(dealerCards);
    }
    
    const playerPoints = calcPoints(g.player_cards);
    let result, winAmount = 0;
    
    // 获取幸运 Buff
    const [bonuses] = await db.execute(
      "SELECT SUM(bonus_value) as total FROM game_bonuses WHERE user_id = ? AND bonus_type = 'charm' AND expires_at > NOW()",
      [req.user.id]
    );
    const luckBonus = bonuses[0]?.total || 0;
    const luckMultiplier = 1 + Math.min(luckBonus / 1000, 0.3);
    
    if (dealerPoints > 21) {
      result = 'win'; 
      winAmount = g.bet * 2;
    } else if (playerPoints > dealerPoints) {
      result = 'win'; 
      winAmount = g.bet * 2;
    } else if (playerPoints === dealerPoints) {
      result = 'push'; 
      winAmount = g.bet;
    } else {
      result = 'lose'; 
      winAmount = 0;
    }
    
    let streak = g.streak || 0;
    let bonusExp = 0;
    
    if (result === 'win') {
      const baseWin = Math.floor(winAmount * luckMultiplier);
      winAmount = baseWin;
      
      // 连胜奖励
      streak += 1;
      if (streak >= 3) {
        bonusExp = streak * 20; // 连胜奖励经验
      }
      
      await db.execute('UPDATE users SET silver = silver + ?, total_exp = total_exp + ? WHERE id = ?', [winAmount, bonusExp, req.user.id]);
      
      // 如果连胜达到 5 场，给一个临时 Buff
      if (streak % 5 === 0) {
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 分钟
        await db.execute(
          `INSERT INTO game_bonuses (user_id, bonus_type, bonus_value, source, reason, expires_at)
           VALUES (?, 'luck', ?, 'blackjack', '连胜奖励', ?)`,
          [req.user.id, streak, expiresAt]
        );
      }
    } else if (result === 'lose') {
      streak = 0; // 输了重置连胜
    }
    
    // 更新统计
    await db.execute(
      `INSERT INTO game_statistics (user_id, total_games, total_wins, blackjack_streak, best_blackjack_streak)
       VALUES (?, 1, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       total_games = total_games + 1,
       total_wins = total_wins + ?,
       blackjack_streak = ?,
       best_blackjack_streak = GREATEST(best_blackjack_streak, ?)`,
      [req.user.id, result === 'win' ? 1 : 0, streak, result === 'win' ? streak : 0,
       result === 'win' ? 1 : 0, result === 'win' ? streak : 0, result === 'win' ? streak : 0]
    );
    
    await db.execute('DELETE FROM blackjack_games WHERE username = ?', [req.user.username]);
    
    res.json({ 
      success: true, 
      data: { 
        playerCards: g.player_cards, 
        dealerCards, 
        playerPoints, 
        dealerPoints, 
        result, 
        winAmount,
        streak,
        bonusExp
      } 
    });
  } catch (err) {
    console.error('21 点停牌错误:', err);
    res.status(500).json({ success: false, message: '停牌失败' });
  }
};

// 骰子游戏 - 添加多种玩法
exports.dice = async (req, res) => {
  try {
    const { bet, type = 'big' } = req.body; // type: big/small/specific/leopard
    
    if (!bet || bet <= 0) {
      return res.status(400).json({ success: false, message: '下注金额无效' });
    }
    
    const [users] = await db.execute('SELECT silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < bet) {
      return res.status(400).json({ success: false, message: '银两不足' });
    }
    
    // 生成 3 个骰子
    const dice = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];
    
    const total = dice.reduce((a, b) => a + b, 0);
    const isBig = total >= 11 && total <= 17;
    const isSmall = total >= 3 && total <= 10;
    const isLeopard = dice[0] === dice[1] && dice[0] === dice[2]; // 豹子
    const isStraight = JSON.stringify(dice.sort()) === JSON.stringify([1,2,3]) || 
                       JSON.stringify(dice.sort()) === JSON.stringify([4,5,6]); // 顺子
    
    let win = false;
    let multiplier = 1;
    
    // 判断输赢和赔率
    switch (type) {
      case 'big':
        win = isBig && !isLeopard;
        multiplier = 1;
        break;
      case 'small':
        win = isSmall && !isLeopard;
        multiplier = 1;
        break;
      case 'specific': // 猜点数
        const { number } = req.body;
        const count = dice.filter(d => d === parseInt(number)).length;
        if (count > 0) {
          win = true;
          multiplier = count * 1.5; // 每个骰子 1.5 倍
        }
        break;
      case 'leopard': // 压豹子
        win = isLeopard;
        multiplier = 8; // 豹子 8 倍
        break;
      case 'straight': // 压顺子
        win = isStraight;
        multiplier = 3; // 顺子 3 倍
        break;
    }
    
    const winAmount = win ? Math.floor(bet * multiplier) : 0;
    
    if (win) {
      await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [winAmount, req.user.id]);
    }
    
    // 更新统计
    try {
      await db.execute(
        `INSERT INTO game_statistics (user_id, total_games, total_wins, total_losses, total_profit, last_played_at)
         VALUES (?, 1, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE 
         total_games = total_games + 1,
         total_wins = total_wins + ?,
         total_losses = total_losses + ?,
         total_profit = total_profit + ?,
         last_played_at = NOW()`,
        [req.user.id, win ? 1 : 0, win ? 0 : 1, win ? (winAmount - bet) : -bet, 
         win ? 1 : 0, win ? 0 : 1, win ? (winAmount - bet) : -bet]
      );
    } catch (e) {
      console.log('统计更新失败，可能表不存在');
    }
    
    // 如果赢了，给一个小的 Buff（幸运效果，5 分钟）
    if (winAmount > bet * 2) {
      const expiresAt = new Date(Date.now() + 5 * 60000);
      await db.execute(
        `INSERT INTO game_bonuses (user_id, bonus_type, bonus_value, source, reason, expires_at)
         VALUES (?, 'charm', ?, 'dice', '幸运骰子', ?)`,
        [req.user.id, Math.floor(winAmount / 100), expiresAt]
      );
    }
    
    res.json({
      success: true,
      data: {
        dice,
        total,
        win,
        winAmount,
        multiplier,
        bet,
        type,
        details: {
          isBig,
          isSmall,
          isLeopard,
          isStraight
        }
      }
    });
  } catch (err) {
    console.error('骰子游戏错误:', err);
    res.status(500).json({ success: false, message: '游戏失败' });
  }
};

exports.highLow = async (req, res) => {
  try {
    const { bet, guess, consecutive = false } = req.body;
    if (!bet || bet <= 0) return res.status(400).json({ success: false, message: '下注无效' });
    if (!['high', 'low'].includes(guess)) return res.status(400).json({ success: false, message: '请选择高或低' });
    
    const [users] = await db.execute('SELECT id, silver, total_exp FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < bet) return res.status(400).json({ success: false, message: '银两不足' });
    
    // 获取用户当前连胜记录
    const [streakData] = await db.execute(
      'SELECT current_streak FROM game_statistics WHERE user_id = ?',
      [req.user.id]
    );
    const currentStreak = streakData.length > 0 ? streakData[0].current_streak : 0;
    
    // 生成随机数 (1-100)
    const num = Math.floor(Math.random() * 100) + 1;
    const isHigh = num > 50;
    const won = (guess === 'high' && isHigh) || (guess === 'low' && !isHigh);
    
    let multiplier = 1;
    let bonusExp = 0;
    
    if (won) {
      // 连击奖励
      if (currentStreak > 0) {
        multiplier = 1 + (Math.min(currentStreak, 10) * 0.1); // 每连胜 +10%, 最多 +100%
        bonusExp = currentStreak * 50; // 连胜奖励经验
      }
      
      const winAmount = Math.floor(bet * multiplier);
      await db.execute('UPDATE users SET silver = silver + ?, total_exp = total_exp + ? WHERE id = ?', 
        [winAmount, bonusExp, req.user.id]);
      
      // 更新连胜记录
      await db.execute(
        `INSERT INTO game_statistics (user_id, total_games, total_wins, current_streak, best_streak, last_played_at)
         VALUES (?, 1, 1, 1, 1, NOW())
         ON DUPLICATE KEY UPDATE 
         total_games = total_games + 1,
         total_wins = total_wins + 1,
         current_streak = current_streak + 1,
         best_streak = GREATEST(best_streak, current_streak + 1),
         last_played_at = NOW()`,
        [req.user.id]
      );
      
      // 如果连胜达到 5 场，给一个临时 Buff
      if ((currentStreak + 1) % 5 === 0) {
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 分钟
        await db.execute(
          `INSERT INTO game_bonuses (user_id, bonus_type, bonus_value, source, reason, expires_at)
           VALUES (?, 'exp', ?, 'highlow', '连胜奖励', ?)`,
          [req.user.id, currentStreak + 1, expiresAt]
        );
      }
      
      res.json({
        success: true,
        data: {
          number: num,
          result: isHigh ? 'high' : 'low',
          won: true,
          baseAmount: bet,
          multiplier: multiplier.toFixed(2),
          winAmount: Math.floor(bet * multiplier),
          bonusExp,
          streak: currentStreak + 1
        }
      });
    } else {
      // 输了，扣除银两并重置连胜
      await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [bet, req.user.id]);
      await db.execute(
        'UPDATE game_statistics SET current_streak = 0 WHERE user_id = ?',
        [req.user.id]
      );
      
      res.json({
        success: true,
        data: {
          number: num,
          result: isHigh ? 'high' : 'low',
          won: false,
          loss: bet,
          streak: 0
        }
      });
    }
  } catch (err) {
    console.error('猜大小错误:', err);
    res.status(500).json({ success: false, message: '猜大小失败' });
  }
};

exports.rps = async (req, res) => {
  try {
    const { bet, choice } = req.body;
    if (!bet || bet <= 0) return res.status(400).json({ success: false, message: '下注无效' });
    if (!['rock', 'paper', 'scissors'].includes(choice)) return res.status(400).json({ success: false, message: '请选择石头剪刀布' });
    const [users] = await db.execute('SELECT id, silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < bet) return res.status(400).json({ success: false, message: '银两不足' });
    const options = ['rock', 'paper', 'scissors'];
    const cpu = options[Math.floor(Math.random() * 3)];
    let won = false;
    if ((choice === 'rock' && cpu === 'scissors') || (choice === 'scissors' && cpu === 'paper') || (choice === 'paper' && cpu === 'rock')) won = true;
    const draw = choice === cpu;
    if (won) {
      await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [bet, req.user.id]);
    } else if (!draw) {
      await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [bet, req.user.id]);
    }
    res.json({ success: true, data: { player: choice, cpu, result: won ? 'win' : (draw ? 'draw' : 'lose'), amount: won ? bet : (draw ? 0 : -bet) } });
  } catch (err) {
    res.status(500).json({ success: false, message: '猜拳失败' });
  }
};

exports.fishStart = async (req, res) => {
  try {
    const [existing] = await db.execute(
      'SELECT id FROM fishing_states WHERE username = ? AND is_active = 1', [req.user.username]
    );
    if (existing.length > 0) return res.status(400).json({ success: false, message: '已经在钓鱼中' });
    await db.execute(
      'INSERT INTO fishing_states (username, is_active) VALUES (?, 1)',
      [req.user.username]
    );
    res.json({ success: true, message: '开始钓鱼' });
  } catch (err) {
    res.status(500).json({ success: false, message: '开始钓鱼失败' });
  }
};

exports.fishReel = async (req, res) => {
  try {
    const [fish] = await db.execute(
      'SELECT id, started_at FROM fishing_states WHERE username = ? AND is_active = 1', [req.user.username]
    );
    if (fish.length === 0) return res.status(400).json({ success: false, message: '没有在钓鱼' });
    
    const elapsed = (Date.now() - new Date(fish[0].started_at).getTime()) / 1000;
    await db.execute('UPDATE fishing_states SET is_active = 0 WHERE id = ?', [fish[0].id]);
    await db.execute('DELETE FROM fishing_states WHERE id = ?', [fish[0].id]);
    
    // 获取用户钓鱼统计
    const [stats] = await db.execute(
      'SELECT total_games FROM game_statistics WHERE user_id = ?',
      [req.user.id]
    );
    const totalFishes = stats.length > 0 ? stats[0].total_games : 0;
    
    // 鱼竿等级（基于钓鱼次数）
    const rodLevel = Math.floor(totalFishes / 50) + 1; // 每 50 次升一级
    const luckBonus = Math.min(rodLevel * 0.05, 0.25); // 每级 +5% 幸运，最高 +25%
    
    const catches = [
      { name: '草鞋板', value: 10, weight: 30, rarity: 'common', exp: 5 },
      { name: '小鲫鱼', value: 50, weight: 25, rarity: 'common', exp: 10 },
      { name: '鲤鱼', value: 100, weight: 15, rarity: 'rare', exp: 20 },
      { name: '大草鱼', value: 200, weight: 10, rarity: 'rare', exp: 40 },
      { name: '金龙鱼', value: 500, weight: 5, rarity: 'epic', exp: 100 },
      { name: '锦鲤', value: 1000, weight: 1, rarity: 'legendary', exp: 300 },
      { name: '什么也没钓到', value: 0, weight: 14, rarity: 'common', exp: 1 }
    ];
    
    // 特殊事件：宝箱
    const treasureChance = 0.05 + luckBonus; // 5% + 幸运加成
    // 特殊事件：远古鱼怪（需要鱼竿等级 5+）
    const bossChance = rodLevel >= 5 ? 0.02 : 0;
    
    let catchItem;
    if (elapsed < 2) {
      // 过早收竿：必空
      catchItem = catches[6];
    } else {
      const rand = Math.random();
      
      // 检查特殊事件
      if (rand < bossChance) {
        catchItem = { 
          name: '远古鱼怪', 
          value: 5000, 
          weight: 0, 
          rarity: 'boss',
          exp: 1000,
          item: '鱼怪鳞片' // 特殊物品
        };
      } else if (rand < bossChance + treasureChance) {
        catchItem = { 
          name: '神秘宝箱', 
          value: Math.floor(Math.random() * 500) + 200, 
          weight: 0, 
          rarity: 'treasure',
          exp: 50
        };
      } else {
        // 正常钓鱼，应用幸运加成
        const adjustedCatches = catches.map(c => ({
          ...c,
          adjustedWeight: c.weight * (c.rarity !== 'common' ? (1 + luckBonus) : 1)
        }));
        
        const totalWeight = adjustedCatches.reduce((sum, item) => sum + item.adjustedWeight, 0);
        let selectionRand = Math.random() * totalWeight;
        
        // 时间>10 秒提升稀有鱼类概率
        if (elapsed > 10) {
          selectionRand *= 0.8;
        }
        
        for (const item of adjustedCatches) {
          if (selectionRand < item.adjustedWeight) {
            catchItem = item;
            break;
          }
          selectionRand -= item.adjustedWeight;
        }
      }
    }
    
    let totalValue = catchItem.value;
    let totalExp = catchItem.exp || 0;
    
    // 给奖励
    if (catchItem.value > 0) {
      await db.execute('UPDATE users SET silver = silver + ?, total_exp = total_exp + ? WHERE id = ?', 
        [totalValue, totalExp, req.user.id]);
    }
    
    // 更新钓鱼统计
    await db.execute(
      `INSERT INTO game_statistics (user_id, total_games, total_wins, last_played_at)
       VALUES (?, 1, 0, NOW())
       ON DUPLICATE KEY UPDATE 
       total_games = total_games + 1,
       last_played_at = NOW()`,
      [req.user.id]
    );
    
    // 钓到稀有鱼时有特殊提示和 Buff
    let buffApplied = false;
    if (['epic', 'legendary', 'boss'].includes(catchItem.rarity)) {
      const expiresAt = new Date(Date.now() + 15 * 60000); // 15 分钟
      await db.execute(
        `INSERT INTO game_bonuses (user_id, bonus_type, bonus_value, source, reason, expires_at)
         VALUES (?, 'charm', ?, 'fishing', '传奇渔夫', ?)`,
        [req.user.id, catchItem.rarity === 'boss' ? 50 : 20, expiresAt]
      );
      buffApplied = true;
    }
    
    res.json({ 
      success: true, 
      data: { 
        catch: catchItem.name, 
        value: totalValue,
        exp: totalExp,
        rarity: catchItem.rarity,
        elapsed: Math.floor(elapsed),
        rodLevel,
        buffApplied,
        specialItem: catchItem.item || null
      } 
    });
  } catch (err) {
    console.error('钓鱼错误:', err);
    res.status(500).json({ success: false, message: '收竿失败' });
  }
};

exports.hunt = async (req, res) => {
  try {
    // 先查询最新体力
    const [users] = await db.execute('SELECT id, tili, silver, total_exp FROM users WHERE id = ?', [req.user.id]);
    if (users[0].tili < 10) return res.status(400).json({ success: false, message: '体力不足' });
    
    // 原子性扣体力：确保不会扣成负数
    const [updateResult] = await db.execute('UPDATE users SET tili = tili - 10 WHERE id = ? AND tili >= 10', [req.user.id]);
    if (updateResult.affectedRows === 0) {
      return res.status(400).json({ success: false, message: '体力不足' });
    }
    
    // 扩展猎物列表
    const animals = [
      { name: '野兔', value: 50, exp: 10, weight: 30, rarity: 'common' },
      { name: '野鸡', value: 80, exp: 15, weight: 25, rarity: 'common' },
      { name: '松鼠', value: 30, exp: 5, weight: 20, rarity: 'common' },
      { name: '野猪', value: 200, exp: 30, weight: 15, rarity: 'uncommon' },
      { name: '鹿', value: 300, exp: 50, weight: 8, rarity: 'rare' },
      { name: '老虎', value: 500, exp: 80, weight: 4, rarity: 'epic' },
      { name: '熊猫', value: 1000, exp: 200, weight: 1, rarity: 'legendary' },
      { name: '什么也没打到', value: 0, exp: 0, weight: 17, rarity: 'common' }
    ];
    
    // 特殊事件：神秘猎人（1% 概率）
    const hunterEvent = Math.random() < 0.01;
    // 特殊事件：神兽踪迹（猎户等级 10+ 且 0.5% 概率）
    const beastEvent = hunterLevel >= 10 && Math.random() < 0.005;
    
    let huntResult;
    const rand = Math.random();
    
    if (beastEvent) {
      huntResult = { 
        name: '麒麟踪迹', 
        value: 3000, 
        exp: 500, 
        rarity: 'mythical',
        item: '麒麟角' // 特殊物品
      };
    } else if (hunterEvent) {
      huntResult = { 
        name: '神秘猎人指点', 
        value: 800, 
        exp: 100, 
        rarity: 'special',
        buff: true // 给 Buff
      };
    } else {
      // 应用幸运加成调整权重
      const adjustedAnimals = animals.map(a => ({
        ...a,
        adjustedWeight: a.weight * (a.rarity !== 'common' ? luckMultiplier : 1)
      }));
      
      const totalWeight = adjustedAnimals.reduce((sum, item) => sum + item.adjustedWeight, 0);
      let selectionRand = Math.random() * totalWeight;
      
      for (const animal of adjustedAnimals) {
        if (selectionRand < animal.adjustedWeight) {
          huntResult = animal;
          break;
        }
        selectionRand -= animal.adjustedWeight;
      }
    }
    
    let totalValue = huntResult.value || 0;
    let totalExp = huntResult.exp || 0;
    let specialItem = null;
    let buffApplied = false;
    let multiplierApplied = false;
    
    // 如果连续失败 3 次，给一个小的安慰奖（连胜保护）
    const [streakData] = await db.execute(
      'SELECT current_streak FROM game_statistics WHERE user_id = ?',
      [req.user.id]
    );
    const currentStreak = streakData.length > 0 ? streakData[0].current_streak : 0;
    
    if (huntResult.value > 0) {
      // 应用幸运倍率
      if (luckMultiplier > 1) {
        totalValue = Math.floor(totalValue * luckMultiplier);
        multiplierApplied = true;
      }
      
      await db.execute('UPDATE users SET silver = silver + ?, total_exp = total_exp + ? WHERE id = ?', 
        [totalValue, totalExp, req.user.id]);
      
      // 连胜记录
      const newStreak = currentStreak + 1;
      await db.execute(
        `INSERT INTO game_statistics (user_id, total_games, total_wins, current_streak, best_streak)
         VALUES (?, 1, 1, ?, ?)
         ON DUPLICATE KEY UPDATE 
         total_games = total_games + 1,
         total_wins = total_wins + 1,
         current_streak = current_streak + 1,
         best_streak = GREATEST(best_streak, current_streak + 1)`,
        [req.user.id, newStreak, newStreak]
      );
      
      // 连胜达到 5 场给 Buff
      if (newStreak % 5 === 0) {
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 分钟
        await db.execute(
          `INSERT INTO game_bonuses (user_id, bonus_type, bonus_value, source, reason, expires_at)
           VALUES (?, 'attack', ?, 'hunting', '狩猎连胜', ?)`,
          [req.user.id, Math.min(newStreak, 20), expiresAt]
        );
      }
    } else {
      // 失败了，重置连胜
      await db.execute(
        `INSERT INTO game_statistics (user_id, total_games, current_streak)
         VALUES (?, 1, 0)
         ON DUPLICATE KEY UPDATE 
         total_games = total_games + 1,
         current_streak = 0`,
        [req.user.id]
      );
    }
    
    // 特殊物品或 Buff
    if (huntResult.item) {
      specialItem = huntResult.item;
      // 这里可以添加到仓库系统的逻辑
    }
    
    if (huntResult.buff) {
      buffApplied = true;
      const expiresAt = new Date(Date.now() + 15 * 60000); // 15 分钟
      await db.execute(
        `INSERT INTO game_bonuses (user_id, bonus_type, bonus_value, source, reason, expires_at)
         VALUES (?, 'exp', ?, 'hunting', '神秘猎人指点', ?)`,
        [req.user.id, 20, expiresAt]
      );
    }
    
    // 神话级猎物有特殊奖励
    if (huntResult.rarity === 'mythical') {
      const expiresAt = new Date(Date.now() + 60 * 60000); // 1 小时
      await db.execute(
        `INSERT INTO game_bonuses (user_id, bonus_type, bonus_value, source, reason, expires_at)
         VALUES (?, 'charm', ?, 'hunting', '神兽踪迹', ?)`,
        [req.user.id, 100, expiresAt]
      );
      buffApplied = true;
    }
    
    res.json({ 
      success: true, 
      data: { 
        hunt: huntResult.name, 
        value: totalValue,
        exp: totalExp,
        rarity: huntResult.rarity,
        hunterLevel,
        specialItem,
        buffApplied,
        multiplierApplied,
        streak: huntResult.value > 0 ? currentStreak + 1 : 0
      } 
    });
  } catch (err) {
    console.error('打猎错误:', err);
    res.status(500).json({ success: false, message: '打猎失败' });
  }
};

exports.getOthello = async (req, res) => {
  try {
    const [config] = await db.execute("SELECT value FROM system_config WHERE name = 'othello_board'");
    const board = config.length > 0 ? JSON.parse(config[0].value) : Array(8).fill(null).map(() => Array(8).fill(0));
    res.json({ success: true, data: { board } });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询比山论剑失败' });
  }
};

exports.othelloMove = async (req, res) => {
  try {
    const { row, col } = req.body;
    if (row < 0 || row > 7 || col < 0 || col > 7) return res.status(400).json({ success: false, message: '坐标无效' });
    const [config] = await db.execute("SELECT value FROM system_config WHERE name = 'othello_board'");
    const board = config.length > 0 ? JSON.parse(config[0].value) : Array(8).fill(null).map(() => Array(8).fill(0));
    if (board[row][col] !== 0) return res.status(400).json({ success: false, message: '该位置已被占据' });
    board[row][col] = 1;
    await db.execute(
      "INSERT INTO system_config (name, value) VALUES ('othello_board', ?) ON DUPLICATE KEY UPDATE value = ?",
      [JSON.stringify(board), JSON.stringify(board)]
    );
    res.json({ success: true, data: { board } });
  } catch (err) {
    res.status(500).json({ success: false, message: '落子失败' });
  }
};

exports.exam = async (req, res) => {
  try {
    const [poems] = await db.execute('SELECT id, question, answer FROM tang_poems ORDER BY RAND() LIMIT 1');
    if (poems.length === 0) return res.json({ success: true, data: { question: '暂无题目' } });
    const poem = poems[0];
    const { answer } = req.body;
    if (!answer) return res.json({ success: true, data: { question: poem.question, poemId: poem.id } });
    if (answer === poem.answer) {
      const reward = 100 + Math.floor(Math.random() * 200);
      await db.execute('UPDATE users SET silver = silver + ?, total_exp = total_exp + ? WHERE id = ?', [reward, 10, req.user.id]);
      return res.json({ success: true, data: { correct: true, reward } });
    }
    res.json({ success: true, data: { correct: false, correctAnswer: poem.answer } });
  } catch (err) {
    res.status(500).json({ success: false, message: '答题失败' });
  }
};
