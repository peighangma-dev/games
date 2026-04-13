const db = require('../config/db');

exports.list = async (req, res) => {
  try {
    const [items] = await db.execute(
      `SELECT id, name, type, attack, defense, quantity, is_equipped, neili_bonus, tili_bonus
       FROM items WHERE owner = ? ORDER BY id`, [req.user.username]
    );
    res.json({ success: true, data: items });
  } catch (err) {
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
      `SELECT id, seller, item_name, item_type, power, stamina, quantity, selling_price, listed_at
       FROM market_listings WHERE is_active = 1 ORDER BY listed_at DESC`
    );
    res.json({ success: true, data: listings });
  } catch (err) {
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
    const jobs = [
      { id: 1, name: '砍柴', reward: 100, stamina_cost: 5 },
      { id: 2, name: '挑水', reward: 80, stamina_cost: 3 },
      { id: 3, name: '种地', reward: 120, stamina_cost: 8 },
      { id: 4, name: '砍柴（高级）', reward: 200, stamina_cost: 10 },
      { id: 5, name: '采矿', reward: 300, stamina_cost: 15 }
    ];
    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询打工列表失败' });
  }
};

exports.work = async (req, res) => {
  try {
    const jobMap = {
      1: { name: '砍柴', reward: 100, cost: 5 },
      2: { name: '挑水', reward: 80, cost: 3 },
      3: { name: '种地', reward: 120, cost: 8 },
      4: { name: '砍柴（高级）', reward: 200, cost: 10 },
      5: { name: '采矿', reward: 300, cost: 15 }
    };
    const job = jobMap[req.params.id];
    if (!job) return res.status(404).json({ success: false, message: '工作不存在' });
    const [users] = await db.execute('SELECT id, tili FROM users WHERE id = ?', [req.user.id]);
    if (users[0].tili < job.cost) return res.status(400).json({ success: false, message: '体力不足' });
    await db.execute(
      'UPDATE users SET silver = silver + ?, tili = tili - ?, all_value = all_value + ? WHERE id = ?',
      [job.reward, job.cost, Math.floor(job.reward / 10), req.user.id]
    );
    res.json({ success: true, data: { jobName: job.name, reward: job.reward } });
  } catch (err) {
    res.status(500).json({ success: false, message: '打工失败' });
  }
};
