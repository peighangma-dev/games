const db = require('../../config/db');
const { logger } = require('../../utils/logger');

/**
 * 物品管理控制器
 */
class ItemController {
  /**
   * 获取所有物品
   */
  static async getItems(req, res) {
    try {
      const [items] = await db.execute(`
        SELECT * FROM items
        ORDER BY id DESC
      `);

      res.json({
        success: true,
        data: items
      });
    } catch (err) {
      logger.error('获取物品列表失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '获取物品列表失败',
        code: 'ITEMS_ERROR'
      });
    }
  }

  /**
   * 获取物品详情
   */
  static async getItemDetail(req, res) {
    try {
      const { id } = req.params;
      const [items] = await db.execute('SELECT * FROM items WHERE id = ?', [id]);

      if (items.length === 0) {
        return res.status(404).json({
          success: false,
          message: '物品不存在',
          code: 'NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: items[0]
      });
    } catch (err) {
      logger.error('获取物品详情失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '获取物品详情失败',
        code: 'ITEM_DETAIL_ERROR'
      });
    }
  }

  /**
   * 添加物品
   */
  static async createItem(req, res) {
    try {
      const { name, type, attack, defense, quantity, neili_bonus, tili_bonus } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: '物品名称不能为空',
          code: 'INVALID_NAME'
        });
      }

      const result = await db.execute(
        `INSERT INTO items (name, type, attack, defense, quantity, neili_bonus, tili_bonus) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, type || null, attack || 0, defense || 0, quantity || 1, neili_bonus || 0, tili_bonus || 0]
      );

      logger.info('管理员创建物品', {
        operator: req.user.username,
        itemName: name
      });

      res.json({
        success: true,
        message: '物品已添加',
        data: { id: result[0].insertId }
      });
    } catch (err) {
      logger.error('添加物品失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '添加物品失败',
        code: 'CREATE_ITEM_ERROR'
      });
    }
  }

  /**
   * 更新物品
   */
  static async updateItem(req, res) {
    try {
      const { id } = req.params;
      const { name, type, attack, defense, quantity, neili_bonus, tili_bonus, user_id } = req.body;

      await db.execute(
        `UPDATE items 
         SET name = ?, type = ?, attack = ?, defense = ?, quantity = ?, 
             neili_bonus = ?, tili_bonus = ?, user_id = ?
         WHERE id = ?`,
        [name, type, attack, defense, quantity, neili_bonus, tili_bonus, user_id, id]
      );

      logger.info('管理员更新物品', {
        operator: req.user.username,
        itemId: id
      });

      res.json({
        success: true,
        message: '物品已更新'
      });
    } catch (err) {
      logger.error('更新物品失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '更新物品失败',
        code: 'UPDATE_ITEM_ERROR'
      });
    }
  }

  /**
   * 删除物品
   */
  static async deleteItem(req, res) {
    try {
      const { id } = req.params;

      await db.execute('DELETE FROM items WHERE id = ?', [id]);

      logger.info('管理员删除物品', {
        operator: req.user.username,
        itemId: id
      });

      res.json({
        success: true,
        message: '物品已删除'
      });
    } catch (err) {
      logger.error('删除物品失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '删除物品失败',
        code: 'DELETE_ITEM_ERROR'
      });
    }
  }
}

module.exports = ItemController;
