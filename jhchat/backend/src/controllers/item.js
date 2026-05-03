const db = require('../config/db');

exports.list = async (req, res) => {
  try {
    const [items] = await db.execute(
      `SELECT i.* 
       FROM items i 
       WHERE i.owner = ? 
       ORDER BY i.is_equipped DESC, i.id`, 
      [req.user.username]
    );
    const result = items.map(item => ({
      ...item,
      image: `${Math.floor(Math.random() * 129) + 1}.gif`,
      imageType: item.type
    }));
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Query items error:', err);
    res.status(500).json({ success: false, message: '查询物品失败' });
  }
};

exports.use = async (req, res) => {
  try {
    const [items] = await db.execute('SELECT id, name, owner, type, attack, defense, neili_bonus, tili_bonus, quantity FROM items WHERE id = ?', [req.params.id]);
    if (items.length === 0) return res.status(404).json({ success: false, message: '物品不存在' });
    const item = items[0];
    if (item.owner !== req.user.username) return res.status(403).json({ success: false, message: '不是你的物品' });
    if (item.type === 'weapon' || item.type === 'armor') {
      await db.execute('UPDATE items SET is_equipped = 1 WHERE id = ?', [item.id]);
      await db.execute(
        'UPDATE users SET attack = attack + ?, defense = defense + ?, neili = neili + ?, tili = tili + ? WHERE id = ?',
        [item.attack, item.defense, item.neili_bonus, item.tili_bonus, req.user.id]
      );
      res.json({ success: true, message: '装备成功' });
    } else {
      if (item.quantity <= 1) {
        await db.execute('DELETE FROM items WHERE id = ?', [item.id]);
      } else {
        await db.execute('UPDATE items SET quantity = quantity - 1 WHERE id = ?', [item.id]);
      }
      await db.execute(
        'UPDATE users SET tili = tili + ?, neili = neili + ? WHERE id = ?',
        [item.tili_bonus || 0, item.neili_bonus || 0, req.user.id]
      );
      res.json({ success: true, message: '使用成功' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '使用物品失败' });
  }
};

exports.drop = async (req, res) => {
  try {
    const [items] = await db.execute('SELECT id, name, owner, is_equipped FROM items WHERE id = ?', [req.params.id]);
    if (items.length === 0) return res.status(404).json({ success: false, message: '物品不存在' });
    if (items[0].owner !== req.user.username) return res.status(403).json({ success: false, message: '不是你的物品' });
    if (items[0].is_equipped) return res.status(400).json({ success: false, message: '请先卸下装备' });
    await db.execute('DELETE FROM items WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '丢弃成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '丢弃物品失败' });
  }
};

exports.getMarket = async (req, res) => {
  try {
    const [listings] = await db.execute(
      `SELECT m.* 
       FROM market_listings m 
       WHERE m.is_active = 1 
       ORDER BY m.listed_at DESC`
    );
    res.json({ success: true, data: listings });
  } catch (err) {
    console.error('Query market error:', err);
    res.status(500).json({ success: false, message: '查询市场失败' });
  }
};

exports.sellOnMarket = async (req, res) => {
  try {
    const { itemId, price } = req.body;
    const [items] = await db.execute('SELECT id, name, type, owner, attack, defense, quantity FROM items WHERE id = ?', [itemId]);
    if (items.length === 0) return res.status(404).json({ success: false, message: '物品不存在' });
    if (items[0].owner !== req.user.username) return res.status(403).json({ success: false, message: '不是你的物品' });
    const item = items[0];
    await db.execute(
      `INSERT INTO market_listings (seller, item_name, item_type, power, stamina, quantity, original_price, selling_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.username, item.name, item.type, item.attack, item.defense, item.quantity, 0, price]
    );
    await db.execute('DELETE FROM items WHERE id = ?', [itemId]);
    res.json({ success: true, message: '上架成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '上架失败' });
  }
};

exports.buyFromMarket = async (req, res) => {
  try {
    const [listings] = await db.execute('SELECT * FROM market_listings WHERE id = ? AND is_active = 1', [req.params.id]);
    if (listings.length === 0) return res.status(404).json({ success: false, message: '商品不存在或已下架' });
    const listing = listings[0];
    if (listing.seller === req.user.username) return res.status(400).json({ success: false, message: '不能买自己的商品' });
    const [users] = await db.execute('SELECT id, silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < listing.selling_price) return res.status(400).json({ success: false, message: '银两不足' });
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [listing.selling_price, req.user.id]);
    await db.execute('UPDATE users SET silver = silver + ? WHERE username = ?', [listing.selling_price, listing.seller]);
    await db.execute(
      `INSERT INTO items (name, owner, type, attack, defense, quantity) VALUES (?, ?, ?, ?, ?, ?)`,
      [listing.item_name, req.user.username, listing.item_type, listing.power, listing.stamina, listing.quantity]
    );
    await db.execute('UPDATE market_listings SET is_active = 0 WHERE id = ?', [listing.id]);
    res.json({ success: true, message: '购买成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '购买失败' });
  }
};

exports.cancelListing = async (req, res) => {
  try {
    const [listings] = await db.execute('SELECT * FROM market_listings WHERE id = ? AND is_active = 1', [req.params.id]);
    if (listings.length === 0) return res.status(404).json({ success: false, message: '商品不存在或已下架' });
    const listing = listings[0];
    if (listing.seller !== req.user.username) return res.status(403).json({ success: false, message: '不能下架他人的商品' });
    await db.execute('UPDATE market_listings SET is_active = 0 WHERE id = ?', [listing.id]);
    await db.execute(
      `INSERT INTO items (name, owner, type, attack, defense, quantity) VALUES (?, ?, ?, ?, ?, ?)`,
      [listing.item_name, req.user.username, listing.item_type, listing.power, listing.stamina, listing.quantity]
    );
    res.json({ success: true, message: '下架成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '下架失败' });
  }
};

exports.getMyListings = async (req, res) => {
  try {
    const [listings] = await db.execute(
      `SELECT * 
       FROM market_listings 
       WHERE is_active = 1 AND seller = ? 
       ORDER BY listed_at DESC`,
      [req.user.username]
    );
    const result = listings.map(item => ({
      ...item,
      image: `${Math.floor(Math.random() * 129) + 1}.gif`
    }));
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Query my listings error:', err);
    res.status(500).json({ success: false, message: '查询出售列表失败' });
  }
};

exports.getMyCards = async (req, res) => {
  try {
    const [cards] = await db.execute(
      'SELECT uc.*, ct.card_type, ct.price FROM user_cards uc LEFT JOIN card_templates ct ON uc.card_name = ct.name WHERE uc.owner = ? ORDER BY uc.card_name',
      [req.user.username]
    );
    res.json({ success: true, data: cards });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询我的卡片失败' });
  }
};

exports.getCards = async (req, res) => {
  try {
    const [cards] = await db.execute('SELECT id, name, description, price, card_type FROM card_templates ORDER BY price');
    res.json({ success: true, data: cards });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询卡片商店失败' });
  }
};

exports.buyCard = async (req, res) => {
  try {
    const { cardId } = req.body;
    const [cards] = await db.execute('SELECT id, name, description, price, card_type FROM card_templates WHERE id = ?', [cardId]);
    if (cards.length === 0) return res.status(404).json({ success: false, message: '卡片不存在' });
    const card = cards[0];
    const [users] = await db.execute('SELECT id, silver, is_vip FROM users WHERE id = ?', [req.user.id]);
    if (card.card_type === 'vip' && !users[0].is_vip) return res.status(403).json({ success: false, message: '仅会员可购买' });
    if (users[0].silver < card.price) return res.status(400).json({ success: false, message: '银两不足' });
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [card.price, req.user.id]);
    const [existing] = await db.execute(
      'SELECT id, quantity FROM user_cards WHERE card_name = ? AND owner = ?',
      [card.name, req.user.username]
    );
    if (existing.length > 0) {
      await db.execute('UPDATE user_cards SET quantity = quantity + 1 WHERE id = ?', [existing[0].id]);
    } else {
      await db.execute(
        'INSERT INTO user_cards (card_name, owner, description) VALUES (?, ?, ?)',
        [card.name, req.user.username, card.description]
      );
    }
    res.json({ success: true, message: '购买成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '购买卡片失败' });
  }
};

exports.getInsurances = async (req, res) => {
  try {
    const [products] = await db.execute('SELECT id, name, description, duration_days, price FROM insurance_products ORDER BY price');
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询保险失败' });
  }
};

exports.buyInsurance = async (req, res) => {
  try {
    const { insuranceId } = req.body;
    const [products] = await db.execute('SELECT id, name, duration_days, price FROM insurance_products WHERE id = ?', [insuranceId]);
    if (products.length === 0) return res.status(404).json({ success: false, message: '保险产品不存在' });
    const product = products[0];
    const [users] = await db.execute('SELECT id, silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < product.price) return res.status(400).json({ success: false, message: '银两不足' });
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [product.price, req.user.id]);
    await db.execute(
      `INSERT INTO user_insurances (insurance_name, owner, duration_days, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
      [product.name, req.user.username, product.duration_days, product.duration_days]
    );
    res.json({ success: true, message: '购买保险成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '购买保险失败' });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const [jobs] = await db.execute(
      'SELECT * FROM work_jobs WHERE is_enabled = 1 ORDER BY sort_no'
    );
    
    // 查询用户今日打工次数
    const [todayLogs] = await db.execute(
      `SELECT job_id, COUNT(*) as times FROM user_work_logs 
       WHERE user_id = ? AND DATE(worked_at) = CURDATE() 
       GROUP BY job_id`,
      [req.user.id]
    );
    
    const todayMap = {};
    todayLogs.forEach(log => {
      todayMap[log.job_id] = log.times;
    });
    
    // 查询用户上次打工时间
    const [lastWork] = await db.execute(
      `SELECT job_id, worked_at FROM user_work_logs 
       WHERE user_id = ? 
       ORDER BY worked_at DESC`,
      [req.user.id]
    );
    
    const lastWorkMap = {};
    lastWork.forEach(log => {
      if (!lastWorkMap[log.job_id]) {
        lastWorkMap[log.job_id] = log.worked_at;
      }
    });
    
    // 组装数据
    const jobsWithLimits = jobs.map(job => {
      const lastTime = lastWorkMap[job.id];
      let cooldownRemaining = 0;
      
      if (lastTime && job.cooldown_minutes > 0) {
        const lastDate = new Date(lastTime);
        const now = new Date();
        const diffMinutes = (now - lastDate) / 1000 / 60;
        
        if (diffMinutes < job.cooldown_minutes) {
          cooldownRemaining = Math.ceil(job.cooldown_minutes - diffMinutes);
        }
      }
      
      const dailyTimes = todayMap[job.id] || 0;
      const canWork = cooldownRemaining === 0 && (job.max_daily_times === 0 || dailyTimes < job.max_daily_times);
      
      return {
        id: job.id,
        name: job.job_name,
        reward_min: job.reward_min,
        reward_max: job.reward_max,
        stamina_cost: job.stamina_cost,
        cooldown_minutes: job.cooldown_minutes,
        max_daily_times: job.max_daily_times,
        min_grade: job.min_grade,
        today_times: dailyTimes,
        cooldown_remaining: cooldownRemaining,
        can_work: canWork && req.user.grade >= job.min_grade
      };
    });
    
    res.json({ success: true, data: jobsWithLimits });
  } catch (err) {
    console.error('Get jobs error:', err);
    res.status(500).json({ success: false, message: '查询打工列表失败' });
  }
};

exports.work = async (req, res) => {
  try {
    const jobid = parseInt(req.params.id);
    
    // 获取工作配置
    const [jobs] = await db.execute(
      'SELECT * FROM work_jobs WHERE id = ? AND is_enabled = 1',
      [jobid]
    );
    
    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: '工作不存在或已禁用' });
    }
    
    const job = jobs[0];
    
    // 检查等级要求
    if (req.user.grade < job.min_grade) {
      return res.status(400).json({ 
        success: false, 
        message: `等级不足，需要等级${job.min_grade}才能进行此项工作` 
      });
    }
    
    // 检查体力
    const [users] = await db.execute('SELECT id, tili FROM users WHERE id = ?', [req.user.id]);
    if (users[0].tili < job.stamina_cost) {
      return res.status(400).json({ 
        success: false, 
        message: `体力不足，需要${job.stamina_cost}点体力` 
      });
    }
    
    // 检查冷却时间
    const [lastWork] = await db.execute(
      `SELECT worked_at FROM user_work_logs 
       WHERE user_id = ? AND job_id = ? 
       ORDER BY worked_at DESC LIMIT 1`,
      [req.user.id, jobid]
    );
    
    if (lastWork.length > 0 && job.cooldown_minutes > 0) {
      const lastTime = new Date(lastWork[0].worked_at);
      const now = new Date();
      const diffMinutes = (now - lastTime) / 1000 / 60;
      
      if (diffMinutes < job.cooldown_minutes) {
        const remainingMinutes = Math.ceil(job.cooldown_minutes - diffMinutes);
        return res.status(400).json({ 
          success: false, 
          message: `工作正在冷却中，请${remainingMinutes}分钟后再试` 
        });
      }
    }
    
    // 检查每日次数限制
    if (job.max_daily_times > 0) {
      const [todayLogs] = await db.execute(
        `SELECT COUNT(*) as times FROM user_work_logs 
         WHERE user_id = ? AND job_id = ? AND DATE(worked_at) = CURDATE()`,
        [req.user.id, jobid]
      );
      
      if (todayLogs[0].times >= job.max_daily_times) {
        return res.status(400).json({ 
          success: false, 
          message: `今日打工次数已达上限（${job.max_daily_times}次）` 
        });
      }
    }
    
    // 计算随机奖励
    const reward = Math.floor(Math.random() * (job.reward_max - job.reward_min + 1)) + job.reward_min;
    
    // 更新用户状态
    await db.execute(
      'UPDATE users SET silver = silver + ?, tili = tili - ?, total_exp = total_exp + ? WHERE id = ?',
      [reward, job.stamina_cost, Math.floor(reward / 10), req.user.id]
    );
    
    // 记录打工日志
    await db.execute(
      `INSERT INTO user_work_logs (user_id, username, job_id, job_name, reward, stamina_cost) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, req.user.username, jobid, job.job_name, reward, job.stamina_cost]
    );
    
    // 生成打工效果描述
    const effectDescriptions = [
      `你辛勤地${job.job_name}，获得了 ${reward} 两银子！`,
      `经过一番努力，你${job.job_name}赚了 ${reward} 两！`,
      `${job.job_name}圆满结束，收入 ${reward} 两银子！`,
      `你通过${job.job_name}获得了 ${reward} 两报酬！`
    ];
    
    const effectText = effectDescriptions[Math.floor(Math.random() * effectDescriptions.length)];
    
    res.json({ 
      success: true, 
      message: effectText,
      data: { 
        jobName: job.job_name, 
        reward: reward,
        stamina_cost: job.stamina_cost
      } 
    });
  } catch (err) {
    console.error('Work error:', err);
    res.status(500).json({ success: false, message: '打工失败' });
  }
};

exports.getShopItems = async (req, res) => {
  try {
    const [items] = await db.execute(
      `SELECT id, name, type, price, category FROM shop_items 
       WHERE is_enabled = 1 AND stock_quantity > 0
       ORDER BY sort_no, price DESC`
    );
    res.json({ success: true, data: items });
  } catch (err) {
    console.error('Query shop items error:', err);
    res.status(500).json({ success: false, message: '查询商店物品失败' });
  }
};

exports.buyFromShop = async (req, res) => {
  try {
    const { itemName, price } = req.body;
    const [items] = await db.execute(
      `SELECT id, name, type, price, category FROM shop_items 
       WHERE name = ? AND is_enabled = 1 AND stock_quantity > 0
       LIMIT 1`,
      [itemName]
    );
    if (items.length === 0) return res.status(404).json({ success: false, message: '物品已售罄' });
    const item = items[0];
    
    // 后端也同步计算价格
    const calculatedPrice = item.price;
    
    if (Math.abs(calculatedPrice - price) > 1) {
      return res.status(400).json({ success: false, message: '价格验证失败' });
    }
    
    const [users] = await db.execute('SELECT id, silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < price) return res.status(400).json({ success: false, message: '银两不足' });
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [price, req.user.id]);
    await db.execute(
      `UPDATE shop_items SET stock_quantity = stock_quantity - 1 WHERE id = ?`,
      [item.id]
    );
    await db.execute(
      `INSERT INTO items (name, owner, type, attack, defense, neili_bonus, tili_bonus, quantity, is_equipped) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)`,
      [item.name, req.user.username, item.type, item.attack, item.defense, item.neili_bonus, item.tili_bonus]
    );
    res.json({ success: true, message: '购买成功' });
  } catch (err) {
    console.error('Buy from shop error:', err);
    res.status(500).json({ success: false, message: '购买失败' });
  }
};
