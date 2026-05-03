const db = require('../utils/database');

// 获取商店物品列表
exports.getShopItems = async (req, res) => {
  try {
    const [items] = await db.execute(
      'SELECT id, name, type, price, category FROM shop_items WHERE is_available = 1 ORDER BY category, price'
    );
    
    res.json({
      success: true,
      data: items || []
    });
  } catch (err) {
    console.error('获取商店物品错误:', err);
    res.status(500).json({
      success: false,
      message: '获取商店物品失败'
    });
  }
};

// 购买物品
exports.buyFromShop = async (req, res) => {
  try {
    const { itemId, quantity = 1 } = req.body;
    
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: '请指定物品 ID'
      });
    }
    
    // 查询物品信息
    const [items] = await db.execute(
      'SELECT id, name, type, price, category FROM shop_items WHERE id = ? AND is_available = 1',
      [itemId]
    );
    
    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: '物品不存在或已下架'
      });
    }
    
    const item = items[0];
    const totalCost = item.price * quantity;
    
    // 检查银两是否足够
    if (req.user.silver < totalCost) {
      return res.status(400).json({
        success: false,
        message: `银两不足，需要 ${totalCost} 两`
      });
    }
    
    // 扣除银两
    await db.execute(
      'UPDATE users SET silver = silver - ? WHERE id = ?',
      [totalCost, req.user.id]
    );
    
    // 添加物品到用户背包（需要 user_items 表）
    // 临时实现：直接添加到 user_inventory
    await db.execute(`
      INSERT INTO user_items (user_id, item_id, item_name, quantity)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + ?
    `, [req.user.id, item.id, item.name, quantity, quantity]);
    
    res.json({
      success: true,
      message: `购买成功！花费 ${totalCost} 两`,
      data: {
        item: item.name,
        quantity,
        totalCost
      }
    });
  } catch (err) {
    console.error('购买物品错误:', err);
    res.status(500).json({
      success: false,
      message: '购买失败'
    });
  }
};
