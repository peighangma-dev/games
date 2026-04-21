const db = require('../../config/db');

/**
 * 商店物品管理控制器
 */
class ShopItemController {
  /**
   * 获取商店物品列表
   */
  static async getShopItems(req, res) {
    try {
      const { page = 1, limit = 50, name, type, is_enabled } = req.query;
      const offset = (page - 1) * limit;
      const whereClauses = ['1=1'];
      const params = [];

      if (name) {
        whereClauses.push('name LIKE ?');
        params.push(`%${name}%`);
      }
      if (type) {
        whereClauses.push('type = ?');
        params.push(type);
      }
      if (is_enabled !== undefined) {
        whereClauses.push('is_enabled = ?');
        params.push(parseInt(is_enabled));
      }

      const where = whereClauses.join(' AND ');

      const [items] = await db.execute(
        `SELECT * FROM shop_items 
         WHERE ${where} 
         ORDER BY sort_no, id 
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM shop_items WHERE ${where}`,
        params
      );

      res.json({
        success: true,
        data: {
          items,
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult[0].total / parseInt(limit))
        }
      });
    } catch (err) {
      console.error('获取商店物品失败:', err.message);
      res.status(500).json({
        success: false,
        message: '获取商店物品失败',
        code: 'SHOP_ITEMS_ERROR'
      });
    }
  }

  /**
   * 获取商店物品详情
   */
  static async getShopItemDetail(req, res) {
    try {
      const [items] = await db.execute(
        `SELECT * FROM shop_items WHERE id = ?`,
        [req.params.id]
      );

      if (items.length === 0) {
        return res.status(404).json({
          success: false,
          message: '物品不存在'
        });
      }

      res.json({
        success: true,
        data: items[0]
      });
    } catch (err) {
      console.error('获取物品详情失败:', err.message);
      res.status(500).json({
        success: false,
        message: '获取物品详情失败',
        code: 'SHOP_ITEM_DETAIL_ERROR'
      });
    }
  }

  /**
   * 创建商店物品
   */
  static async createShopItem(req, res) {
    try {
      const {
        name,
        type,
        attack,
        defense,
        neili_bonus,
        tili_bonus,
        price,
        image_file,
        description,
        is_enabled,
        sort_no,
        stock_quantity
      } = req.body;

      if (!name || !price) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段：name, price',
          code: 'MISSING_FIELDS'
        });
      }

      await db.execute(
        `INSERT INTO shop_items 
         (name, type, attack, defense, neili_bonus, tili_bonus, price, 
          image_file, description, is_enabled, sort_no, stock_quantity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          type || 'other',
          attack || 0,
          defense || 0,
          neili_bonus || 0,
          tili_bonus || 0,
          price,
          image_file || '',
          description || '',
          is_enabled !== undefined ? is_enabled : 1,
          sort_no || 0,
          stock_quantity !== undefined ? stock_quantity : 999
        ]
      );

      const [result] = await db.execute('SELECT LAST_INSERT_ID() as id');

      res.json({
        success: true,
        message: '物品创建成功',
        data: { id: result[0].id }
      });
    } catch (err) {
      console.error('创建物品失败:', err.message);
      res.status(500).json({
        success: false,
        message: '创建物品失败',
        code: 'CREATE_ERROR'
      });
    }
  }

  /**
   * 更新商店物品
   */
  static async updateShopItem(req, res) {
    try {
      const {
        name,
        type,
        attack,
        defense,
        neili_bonus,
        tili_bonus,
        price,
        image_file,
        description,
        is_enabled,
        sort_no,
        stock_quantity
      } = req.body;

      const fields = [];
      const values = [];

      if (name !== undefined) { fields.push('name = ?'); values.push(name); }
      if (type !== undefined) { fields.push('type = ?'); values.push(type); }
      if (attack !== undefined) { fields.push('attack = ?'); values.push(attack); }
      if (defense !== undefined) { fields.push('defense = ?'); values.push(defense); }
      if (neili_bonus !== undefined) { fields.push('neili_bonus = ?'); values.push(neili_bonus); }
      if (tili_bonus !== undefined) { fields.push('tili_bonus = ?'); values.push(tili_bonus); }
      if (price !== undefined) { fields.push('price = ?'); values.push(price); }
      if (image_file !== undefined) { fields.push('image_file = ?'); values.push(image_file); }
      if (description !== undefined) { fields.push('description = ?'); values.push(description); }
      if (is_enabled !== undefined) { fields.push('is_enabled = ?'); values.push(is_enabled); }
      if (sort_no !== undefined) { fields.push('sort_no = ?'); values.push(sort_no); }
      if (stock_quantity !== undefined) { fields.push('stock_quantity = ?'); values.push(stock_quantity); }

      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有要更新的字段',
          code: 'NO_FIELDS'
        });
      }

      values.push(req.params.id);

      await db.execute(
        `UPDATE shop_items SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      res.json({
        success: true,
        message: '物品更新成功'
      });
    } catch (err) {
      console.error('更新物品失败:', err.message);
      res.status(500).json({
        success: false,
        message: '更新物品失败',
        code: 'UPDATE_ERROR'
      });
    }
  }

  /**
   * 删除商店物品
   */
  static async deleteShopItem(req, res) {
    try {
      const [items] = await db.execute(
        `SELECT * FROM shop_items WHERE id = ?`,
        [req.params.id]
      );

      if (items.length === 0) {
        return res.status(404).json({
          success: false,
          message: '物品不存在'
        });
      }

      await db.execute('DELETE FROM shop_items WHERE id = ?', [req.params.id]);

      res.json({
        success: true,
        message: '删除成功'
      });
    } catch (err) {
      console.error('删除物品失败:', err.message);
      res.status(500).json({
        success: false,
        message: '删除物品失败',
        code: 'DELETE_ERROR'
      });
    }
  }

  /**
   * 补货
   */
  static async restockShopItem(req, res) {
    try {
      const { quantity } = req.body;

      if (!quantity || quantity < 0) {
        return res.status(400).json({
          success: false,
          message: '补货数量必须大于等于 0',
          code: 'INVALID_QUANTITY'
        });
      }

      const [items] = await db.execute(
        `SELECT * FROM shop_items WHERE id = ?`,
        [req.params.id]
      );

      if (items.length === 0) {
        return res.status(404).json({
          success: false,
          message: '物品不存在'
        });
      }

      await db.execute(
        'UPDATE shop_items SET stock_quantity = stock_quantity + ? WHERE id = ?',
        [quantity, req.params.id]
      );

      res.json({
        success: true,
        message: `补货成功，当前库存：${items[0].stock_quantity + quantity}`
      });
    } catch (err) {
      console.error('补货失败:', err.message);
      res.status(500).json({
        success: false,
        message: '补货失败',
        code: 'RESTOCK_ERROR'
      });
    }
  }
}

module.exports = ShopItemController;
