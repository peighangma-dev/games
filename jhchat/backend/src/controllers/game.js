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
    const [users] = await db.execute('SELECT id, silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < bet) return res.status(400).json({ success: false, message: '银两不足' });
    const p1 = drawCard(), p2 = drawCard(), d1 = drawCard();
    const playerCards = `${p1},${p2}`;
    const dealerCards = d1;
    const playerPoints = calcPoints(playerCards);
    const dealerPoints = calcPoints(dealerCards);
    await db.execute(
      `INSERT INTO blackjack_games (username, dealer_cards, dealer_points, player_cards, player_points, bet, wins)
       VALUES (?, ?, ?, ?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE dealer_cards=?, dealer_points=?, player_cards=?, player_points=?, bet=?, wins=0`,
      [req.user.username, dealerCards, dealerPoints, playerCards, playerPoints, bet,
       dealerCards, dealerPoints, playerCards, playerPoints, bet]
    );
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [bet, req.user.id]);
    if (playerPoints === 21) {
      const winAmount = Math.floor(bet * 2.5);
      await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [winAmount, req.user.id]);
      await db.execute('DELETE FROM blackjack_games WHERE username = ?', [req.user.username]);
      return res.json({ success: true, data: { playerCards, dealerCards, playerPoints: 21, result: 'blackjack', winAmount } });
    }
    res.json({ success: true, data: { playerCards, dealerCards, playerPoints, dealerPoints, bet } });
  } catch (err) {
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
    while (dealerPoints < 17) {
      const c = drawCard();
      dealerCards = `${dealerCards},${c}`;
      dealerPoints = calcPoints(dealerCards);
    }
    const playerPoints = calcPoints(g.player_cards);
    let result, winAmount = 0;
    if (dealerPoints > 21) {
      result = 'win'; winAmount = g.bet * 2;
    } else if (playerPoints > dealerPoints) {
      result = 'win'; winAmount = g.bet * 2;
    } else if (playerPoints === dealerPoints) {
      result = 'push'; winAmount = g.bet;
    } else {
      result = 'lose'; winAmount = 0;
    }
    if (winAmount > 0) await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [winAmount, req.user.id]);
    await db.execute('DELETE FROM blackjack_games WHERE username = ?', [req.user.username]);
    res.json({ success: true, data: { playerCards: g.player_cards, dealerCards, playerPoints, dealerPoints, result, winAmount } });
  } catch (err) {
    res.status(500).json({ success: false, message: '停牌失败' });
  }
};

exports.dice = async (req, res) => {
  try {
    const { bet, guess } = req.body;
    if (!bet || bet <= 0) return res.status(400).json({ success: false, message: '下注无效' });
    if (!['big', 'small', 'baozi'].includes(guess)) return res.status(400).json({ success: false, message: '请选择大、小或豹子' });
    
    const [users] = await db.execute('SELECT id, silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < bet) return res.status(400).json({ success: false, message: '银两不足' });
    
    // 3 个骰子
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const d3 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2 + d3;
    
    // 判断豹子（3 同）
    const isBaozi = d1 === d2 && d2 === d3;
    
    // 大小判断（3-10 为小，11-18 为大）
    const isBig = total >= 11;
    
    let won = false;
    let winAmount = 0;
    
    if (guess === 'baozi') {
      // 押豹子
      if (isBaozi) {
        won = true;
        winAmount = bet * 30; // 豹子 1:30 赔率
      }
    } else {
      // 押大小
      if (isBaozi) {
        // 围骰通杀大小注
        won = false;
        winAmount = -bet;
      } else if (guess === 'big' && isBig) {
        won = true;
        winAmount = bet;
      } else if (guess === 'small' && !isBig) {
        won = true;
        winAmount = bet;
      } else {
        won = false;
        winAmount = -bet;
      }
    }
    
    if (winAmount > 0) {
      await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [winAmount, req.user.id]);
    } else if (winAmount < 0) {
      await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [Math.abs(winAmount), req.user.id]);
    }
    
    res.json({ 
      success: true, 
      data: { 
        d1, d2, d3, 
        total, 
        isBaozi,
        result: isBig ? 'big' : 'small', 
        won, 
        amount: winAmount 
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '掷骰子失败' });
  }
};

exports.highLow = async (req, res) => {
  try {
    const { bet, guess } = req.body;
    if (!bet || bet <= 0) return res.status(400).json({ success: false, message: '下注无效' });
    if (!['high', 'low'].includes(guess)) return res.status(400).json({ success: false, message: '请选择高或低' });
    const [users] = await db.execute('SELECT id, silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < bet) return res.status(400).json({ success: false, message: '银两不足' });
    const num = Math.floor(Math.random() * 100) + 1;
    const isHigh = num > 50;
    const won = (guess === 'high' && isHigh) || (guess === 'low' && !isHigh);
    if (won) {
      await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [bet, req.user.id]);
    } else {
      await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [bet, req.user.id]);
    }
    res.json({ success: true, data: { number: num, result: isHigh ? 'high' : 'low', won, amount: won ? bet : -bet } });
  } catch (err) {
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
    
    const catches = [
      { name: '草鞋板', value: 10, weight: 30, rarity: 'common' },
      { name: '小鲫鱼', value: 50, weight: 25, rarity: 'common' },
      { name: '鲤鱼', value: 100, weight: 15, rarity: 'rare' },
      { name: '大草鱼', value: 200, weight: 10, rarity: 'rare' },
      { name: '金龙鱼', value: 500, weight: 5, rarity: 'epic' },
      { name: '锦鲤', value: 1000, weight: 1, rarity: 'legendary' },
      { name: '什么也没钓到', value: 0, weight: 14, rarity: 'common' }
    ];
    
    // 时间影响概率
    let catchItem;
    if (elapsed < 3) {
      // 过早收竿：必空
      catchItem = catches[6];
    } else {
      // 权重随机
      const totalWeight = catches.reduce((sum, item) => sum + item.weight, 0);
      let rand = Math.random() * totalWeight;
      
      // 时间>12 秒提升稀有鱼类概率
      if (elapsed > 12) {
        rand *= 0.7; // 偏向稀有
      }
      
      for (const item of catches) {
        if (rand < item.weight) {
          catchItem = item;
          break;
        }
        rand -= item.weight;
      }
    }
    
    if (catchItem.value > 0) {
      await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [catchItem.value, req.user.id]);
    }
    
    res.json({ 
      success: true, 
      data: { 
        catch: catchItem.name, 
        value: catchItem.value,
        rarity: catchItem.rarity,
        elapsed: Math.floor(elapsed)
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '收竿失败' });
  }
};

exports.hunt = async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, tili, silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].tili < 10) return res.status(400).json({ success: false, message: '体力不足' });
    await db.execute('UPDATE users SET tili = tili - 10 WHERE id = ?', [req.user.id]);
    const animals = [
      { name: '野兔', value: 50, exp: 10 },
      { name: '野鸡', value: 80, exp: 15 },
      { name: '野猪', value: 200, exp: 30 },
      { name: '老虎', value: 500, exp: 80 },
      { name: '什么也没打到', value: 0, exp: 0 }
    ];
    const weights = [30, 25, 20, 5, 20];
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let rand = Math.floor(Math.random() * totalWeight);
    let huntResult = animals[4];
    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i];
      if (rand <= 0) { huntResult = animals[i]; break; }
    }
    if (huntResult.value > 0) {
      await db.execute('UPDATE users SET silver = silver + ?, all_value = all_value + ? WHERE id = ?', [huntResult.value, huntResult.exp, req.user.id]);
    }
    res.json({ success: true, data: { hunt: huntResult.name, value: huntResult.value, exp: huntResult.exp } });
  } catch (err) {
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
      await db.execute('UPDATE users SET silver = silver + ?, all_value = all_value + ? WHERE id = ?', [reward, 10, req.user.id]);
      return res.json({ success: true, data: { correct: true, reward } });
    }
    res.json({ success: true, data: { correct: false, correctAnswer: poem.answer } });
  } catch (err) {
    res.status(500).json({ success: false, message: '答题失败' });
  }
};
