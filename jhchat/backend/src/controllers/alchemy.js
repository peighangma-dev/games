const db = require('../config/db');

exports.recipes = async (req, res) => {
  try {
    const [recipes] = await db.execute(
      `SELECT id, name, speed_bonus, neili_bonus, price, level FROM secret_skills WHERE price > 0 ORDER BY level, price`
    );
    res.json({ success: true, data: recipes });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询药方失败' });
  }
};

exports.inventory = async (req, res) => {
  try {
    const [items] = await db.execute(
      'SELECT id, name, quantity, potency FROM alchemy_items WHERE owner = ? AND quantity > 0 ORDER BY name',
      [req.user.username]
    );
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询药材库存失败' });
  }
};

exports.potions = async (req, res) => {
  try {
    const [potions] = await db.execute(
      'SELECT id, name, quantity, potency FROM alchemy_items WHERE owner = ? AND potency > 0 ORDER BY name',
      [req.user.username]
    );
    res.json({ success: true, data: potions });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询药品失败' });
  }
};

exports.craft = async (req, res) => {
  try {
    const [recipes] = await db.execute('SELECT id, name, price FROM secret_skills WHERE id = ?', [req.params.id]);
    if (recipes.length === 0) return res.status(404).json({ success: false, message: '药方不存在' });
    const recipe = recipes[0];
    const [users] = await db.execute('SELECT id, silver FROM users WHERE id = ?', [req.user.id]);
    if (users[0].silver < recipe.price) return res.status(400).json({ success: false, message: '银两不足' });
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [recipe.price, req.user.id]);
    const [existing] = await db.execute(
      'SELECT id, quantity FROM alchemy_items WHERE name = ? AND owner = ?',
      [recipe.name, req.user.username]
    );
    if (existing.length > 0) {
      await db.execute('UPDATE alchemy_items SET quantity = quantity + 1, potency = potency + 10 WHERE id = ?', [existing[0].id]);
    } else {
      await db.execute(
        'INSERT INTO alchemy_items (name, owner, quantity, potency) VALUES (?, ?, 1, 10)',
        [recipe.name, req.user.username]
      );
    }
    res.json({ success: true, message: '炼制成功', data: { potionName: recipe.name } });
  } catch (err) {
    res.status(500).json({ success: false, message: '炼制失败' });
  }
};
