const db = require('../config/db');

exports.getSheep = async (req, res) => {
  try {
    const [sheep] = await db.execute('SELECT * FROM sheep_pets WHERE owner = ?', [req.user.username]);
    if (sheep.length === 0) return res.json({ success: true, data: null });
    res.json({ success: true, data: sheep[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询宠物羊失败' });
  }
};

exports.buySheep = async (req, res) => {
  try {
    const [existing] = await db.execute('SELECT id FROM sheep_pets WHERE owner = ?', [req.user.username]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: '您已有宠物羊' });
    const price = 5000;
    const [users] = await db.execute('SELECT id, silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < price) return res.status(400).json({ success: false, message: '银两不足' });
    const [rules] = await db.execute('SELECT * FROM pet_init_rules LIMIT 1');
    const r = rules.length > 0 ? rules[0] : { init_clean: 50, init_happy: 50, init_health: 80, init_milk: 0, init_life: 100, init_hunger: 0 };
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [price, req.user.id]);
    await db.execute(
      `INSERT INTO sheep_pets (name, owner, happiness, health, life, milk, hunger, workload, cleanliness)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [req.body.name || '小羊', req.user.username, r.init_happy, r.init_health, r.init_life, r.init_milk, r.init_hunger, r.init_clean]
    );
    res.json({ success: true, message: '购买宠物羊成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '购买宠物羊失败' });
  }
};

exports.feedSheep = async (req, res) => {
  try {
    const [sheep] = await db.execute('SELECT id FROM sheep_pets WHERE owner = ?', [req.user.username]);
    if (sheep.length === 0) return res.status(404).json({ success: false, message: '没有宠物羊' });
    const feedCost = 100;
    const [users] = await db.execute('SELECT id, silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < feedCost) return res.status(400).json({ success: false, message: '银两不足' });
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [feedCost, req.user.id]);
    await db.execute(
      'UPDATE sheep_pets SET hunger = LEAST(hunger + 20, 100), happiness = LEAST(happiness + 5, 100), last_fed_at = NOW(), fed_days = fed_days + 1 WHERE id = ?',
      [sheep[0].id]
    );
    res.json({ success: true, message: '喂养成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '喂养失败' });
  }
};

exports.sellSheep = async (req, res) => {
  try {
    const [sheep] = await db.execute('SELECT id, life, health FROM sheep_pets WHERE owner = ?', [req.user.username]);
    if (sheep.length === 0) return res.status(404).json({ success: false, message: '没有宠物羊' });
    const value = Math.floor(sheep[0].life * sheep[0].health / 10);
    await db.execute('DELETE FROM sheep_pets WHERE id = ?', [sheep[0].id]);
    await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [value, req.user.id]);
    res.json({ success: true, data: { value } });
  } catch (err) {
    res.status(500).json({ success: false, message: '卖羊失败' });
  }
};

exports.sellMilk = async (req, res) => {
  try {
    const [sheep] = await db.execute('SELECT id, milk FROM sheep_pets WHERE owner = ?', [req.user.username]);
    if (sheep.length === 0) return res.status(404).json({ success: false, message: '没有宠物羊' });
    if (sheep[0].milk <= 0) return res.status(400).json({ success: false, message: '没有牛奶可卖' });
    const value = sheep[0].milk * 20;
    await db.execute('UPDATE sheep_pets SET milk = 0 WHERE id = ?', [sheep[0].id]);
    await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [value, req.user.id]);
    res.json({ success: true, data: { value, milkSold: sheep[0].milk } });
  } catch (err) {
    res.status(500).json({ success: false, message: '卖牛奶失败' });
  }
};

exports.cleanSheep = async (req, res) => {
  try {
    const [sheep] = await db.execute('SELECT id FROM sheep_pets WHERE owner = ?', [req.user.username]);
    if (sheep.length === 0) return res.status(404).json({ success: false, message: '没有宠物羊' });
    await db.execute('UPDATE sheep_pets SET cleanliness = LEAST(cleanliness + 30, 100), happiness = LEAST(happiness + 10, 100) WHERE id = ?', [sheep[0].id]);
    res.json({ success: true, message: '清洁完成' });
  } catch (err) {
    res.status(500).json({ success: false, message: '清洁失败' });
  }
};

exports.breedSheep = async (req, res) => {
  try {
    const [sheep] = await db.execute('SELECT id, health, happiness FROM sheep_pets WHERE owner = ?', [req.user.username]);
    if (sheep.length === 0) return res.status(404).json({ success: false, message: '没有宠物羊' });
    if (sheep[0].health < 50 || sheep[0].happiness < 50) return res.status(400).json({ success: false, message: '羊状态不佳，无法配种' });
    const cost = 2000;
    const [users] = await db.execute('SELECT id, silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < cost) return res.status(400).json({ success: false, message: '银两不足' });
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [cost, req.user.id]);
    const milkGain = Math.floor(Math.random() * 30) + 10;
    await db.execute('UPDATE sheep_pets SET milk = milk + ?, health = GREATEST(health - 10, 0) WHERE id = ?', [milkGain, sheep[0].id]);
    res.json({ success: true, data: { milkGain } });
  } catch (err) {
    res.status(500).json({ success: false, message: '配种失败' });
  }
};

exports.sunSheep = async (req, res) => {
  try {
    const [sheep] = await db.execute('SELECT id FROM sheep_pets WHERE owner = ?', [req.user.username]);
    if (sheep.length === 0) return res.status(404).json({ success: false, message: '没有宠物羊' });
    await db.execute('UPDATE sheep_pets SET health = LEAST(health + 15, 100), happiness = LEAST(happiness + 20, 100) WHERE id = ?', [sheep[0].id]);
    res.json({ success: true, message: '晒太阳完成' });
  } catch (err) {
    res.status(500).json({ success: false, message: '晒太阳失败' });
  }
};

exports.getStar = async (req, res) => {
  try {
    const [pets] = await db.execute('SELECT * FROM star_pets WHERE owner = ?', [req.user.username]);
    if (pets.length === 0) return res.json({ success: true, data: null });
    res.json({ success: true, data: pets[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询星河宠物失败' });
  }
};

exports.adoptStar = async (req, res) => {
  try {
    const [existing] = await db.execute('SELECT id FROM star_pets WHERE owner = ?', [req.user.username]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: '您已有星河宠物' });
    const price = 10000;
    const [users] = await db.execute('SELECT id, silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < price) return res.status(400).json({ success: false, message: '银两不足' });
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [price, req.user.id]);
    await db.execute(
      `INSERT INTO star_pets (name, owner, hp, mp, attack, defense, max_hp, max_mp, max_attack, max_defense, level, exp, special_skill, status)
       VALUES (?, ?, 500, 100, 10, 10, 500, 100, 100, 100, 1, 0, '无', '正常')`,
      [req.body.name || '星河', req.user.username]
    );
    res.json({ success: true, message: '领养星河宠物成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '领养失败' });
  }
};

exports.fightStar = async (req, res) => {
  try {
    const [pets] = await db.execute('SELECT id, hp, attack, defense, level, exp, max_hp FROM star_pets WHERE owner = ?', [req.user.username]);
    if (pets.length === 0) return res.status(404).json({ success: false, message: '没有星河宠物' });
    const pet = pets[0];
    if (pet.hp <= 0) return res.status(400).json({ success: false, message: '宠物已阵亡，请先恢复' });
    const enemyAtk = 5 + pet.level * 3;
    const enemyDef = 3 + pet.level * 2;
    const dmgToEnemy = Math.max(pet.attack - enemyDef, 1);
    const dmgToPet = Math.max(enemyAtk - pet.defense, 1);
    const petWon = Math.random() > 0.3;
    let expGain, hpLoss;
    if (petWon) {
      expGain = 20 + pet.level * 5;
      hpLoss = Math.floor(dmgToPet * 0.5);
    } else {
      expGain = 5;
      hpLoss = dmgToPet * 2;
    }
    await db.execute(
      'UPDATE star_pets SET hp = GREATEST(hp - ?, 0), exp = exp + ? WHERE id = ?',
      [hpLoss, expGain, pet.id]
    );
    const levelUpExp = pet.level * 100;
    if (pet.exp + expGain >= levelUpExp) {
      await db.execute(
        'UPDATE star_pets SET level = level + 1, exp = exp - ?, max_hp = max_hp + 20, max_attack = max_attack + 5, max_defense = max_defense + 5 WHERE id = ?',
        [levelUpExp, pet.id]
      );
    }
    res.json({ success: true, data: { won: petWon, expGain, hpLoss } });
  } catch (err) {
    res.status(500).json({ success: false, message: '战斗失败' });
  }
};

exports.adventureStar = async (req, res) => {
  try {
    const [pets] = await db.execute('SELECT id, hp, level, exp, max_hp FROM star_pets WHERE owner = ?', [req.user.username]);
    if (pets.length === 0) return res.status(404).json({ success: false, message: '没有星河宠物' });
    const pet = pets[0];
    if (pet.hp <= 0) return res.status(400).json({ success: false, message: '宠物已阵亡' });
    const outcomes = [
      { event: '发现宝箱', silverGain: 200 + pet.level * 50, expGain: 30, hpLoss: 0 },
      { event: '遇到野怪', silverGain: 0, expGain: 50, hpLoss: 30 + pet.level * 5 },
      { event: '找到仙草', silverGain: 0, expGain: 10, hpLoss: -50 },
      { event: '迷路了', silverGain: 0, expGain: 5, hpLoss: 10 }
    ];
    const result = outcomes[Math.floor(Math.random() * outcomes.length)];
    await db.execute(
      'UPDATE star_pets SET hp = LEAST(GREATEST(hp - ?, 0), max_hp), exp = exp + ? WHERE id = ?',
      [result.hpLoss, result.expGain, pet.id]
    );
    if (result.silverGain > 0) {
      await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [result.silverGain, req.user.id]);
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: '冒险失败' });
  }
};

exports.healStar = async (req, res) => {
  try {
    const [pets] = await db.execute('SELECT id, hp, max_hp FROM star_pets WHERE owner = ?', [req.user.username]);
    if (pets.length === 0) return res.status(404).json({ success: false, message: '没有星河宠物' });
    
    const healCost = 500;
    const [users] = await db.execute('SELECT id, silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < healCost) {
      return res.status(400).json({ success: false, message: '银两不足，需要 500 两' });
    }
    
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [healCost, req.user.id]);
    await db.execute(
      'UPDATE star_pets SET hp = max_hp WHERE id = ?',
      [pets[0].id]
    );
    
    res.json({ success: true, message: '治疗成功！宠物已完全恢复' });
  } catch (err) {
    res.status(500).json({ success: false, message: '治疗失败' });
  }
};

exports.trainMini = async (req, res) => {
  try {
    const [pets] = await db.execute('SELECT id, attack, defense, level, exp FROM mini_pets WHERE owner = ?', [req.user.username]);
    if (pets.length === 0) return res.status(404).json({ success: false, message: '没有小宠' });
    
    const trainCost = 200;
    const [users] = await db.execute('SELECT id, silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < trainCost) {
      return res.status(400).json({ success: false, message: '银两不足，需要 200 两' });
    }
    
    const atkGain = Math.floor(Math.random() * 3) + 1;
    const defGain = Math.floor(Math.random() * 2) + 1;
    const expGain = 10;
    
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [trainCost, req.user.id]);
    await db.execute(
      'UPDATE mini_pets SET attack = attack + ?, defense = defense + ?, exp = exp + ? WHERE id = ?',
      [atkGain, defGain, expGain, pets[0].id]
    );
    
    res.json({ 
      success: true, 
      message: `训练成功！攻击 +${atkGain}，防御 +${defGain}，经验 +${expGain}`,
      data: { atkGain, defGain, expGain }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '训练失败' });
  }
};

exports.adoptMini = async (req, res) => {
  try {
    const [existing] = await db.execute('SELECT id FROM mini_pets WHERE owner = ?', [req.user.username]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: '您已有小宠' });
    const price = 3000;
    const [users] = await db.execute('SELECT id, silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < price) return res.status(400).json({ success: false, message: '银两不足' });
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [price, req.user.id]);
    await db.execute(
      `INSERT INTO mini_pets (name, owner, attack, defense, level, exp, special_skill)
       VALUES (?, ?, 5, 5, 1, 0, NULL)`,
      [req.body.name || '小宠', req.user.username]
    );
    res.json({ success: true, message: '领养小宠成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '领养失败' });
  }
};

exports.getMini = async (req, res) => {
  try {
    const [pets] = await db.execute('SELECT * FROM mini_pets WHERE owner = ?', [req.user.username]);
    if (pets.length === 0) return res.json({ success: true, data: null });
    res.json({ success: true, data: pets[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询小宠失败' });
  }
};

// 导出新增的功能
module.exports.healStar = exports.healStar;
module.exports.trainMini = exports.trainMini;
module.exports.getMini = exports.getMini;
