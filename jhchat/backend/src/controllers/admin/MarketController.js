/**
 * 市场管理控制器
 */
const db = require('../../config/db');

class MarketController {
  static async getListings(req, res) {
    try {
      const [listings] = await db.execute(`
        SELECT * FROM market_listings
        ORDER BY listed_at DESC
      `);
      res.json({ success: true, data: listings });
    } catch (err) {
      console.error('获取市场列表失败:', err.message);
      console.error('错误堆栈:', err.stack);
      res.status(500).json({ 
        success: false, 
        message: '获取市场列表失败：' + err.message,
        error: err.message
      });
    }
  }

  static async cancelListing(req, res) {
    try {
      const { id } = req.params;
      await db.execute('UPDATE market_listings SET is_active = 0 WHERE id = ?', [id]);
      res.json({ success: true, message: '商品已下架' });
    } catch (err) {
      console.error('下架商品失败:', err);
      res.status(500).json({ success: false, message: '下架商品失败' });
    }
  }
}

module.exports = MarketController;
