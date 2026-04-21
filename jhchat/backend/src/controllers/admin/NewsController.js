const db = require('../../config/db');

/**
 * 公告管理控制器
 */
class NewsController {
  /**
   * 获取公告列表
   */
  static async getNews(req, res) {
    try {
      const [news] = await db.execute(`
        SELECT * FROM news
        ORDER BY created_at DESC
      `);
      res.json({ success: true, data: news });
    } catch (err) {
      console.error('获取公告列表失败:', err.message);
      res.status(500).json({ 
        success: false, 
        message: '获取公告列表失败',
        error: err.message
      });
    }
  }

  /**
   * 创建公告
   */
  static async createNews(req, res) {
    try {
      const { topic, content } = req.body;
      
      if (!topic || !content) {
        return res.status(400).json({
          success: false,
          message: '标题和内容不能为空'
        });
      }
      
      await db.execute(
        `INSERT INTO news (topic, content, author, created_at)
         VALUES (?, ?, '系统管理员', NOW())`,
        [topic, content]
      );
      
      res.json({
        success: true,
        message: '公告创建成功'
      });
    } catch (err) {
      console.error('创建公告失败:', err.message);
      res.status(500).json({ 
        success: false, 
        message: '创建公告失败',
        error: err.message
      });
    }
  }

  /**
   * 更新公告
   */
  static async updateNews(req, res) {
    try {
      const { id } = req.params;
      const { topic, content } = req.body;
      
      const fields = [];
      const values = [];
      
      if (topic !== undefined) { fields.push('topic = ?'); values.push(topic); }
      if (content !== undefined) { fields.push('content = ?'); values.push(content); }
      
      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有要更新的字段'
        });
      }
      
      values.push(id);
      
      await db.execute(
        `UPDATE news SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      res.json({
        success: true,
        message: '公告更新成功'
      });
    } catch (err) {
      console.error('更新公告失败:', err.message);
      res.status(500).json({ 
        success: false, 
        message: '更新公告失败',
        error: err.message
      });
    }
  }

  /**
   * 获取公告详情
   */
  static async getNewsDetail(req, res) {
    try {
      const { id } = req.params;
      const [news] = await db.execute('SELECT * FROM news WHERE id = ?', [id]);
      
      if (news.length === 0) {
        return res.status(404).json({
          success: false,
          message: '公告不存在'
        });
      }
      
      res.json({ success: true, data: news[0] });
    } catch (err) {
      console.error('获取公告详情失败:', err.message);
      res.status(500).json({ 
        success: false, 
        message: '获取公告详情失败',
        error: err.message
      });
    }
  }

  /**
   * 删除公告
   */
  static async deleteNews(req, res) {
    try {
      const { id } = req.params;
      await db.execute('DELETE FROM news WHERE id = ?', [id]);
      res.json({
        success: true,
        message: '公告删除成功'
      });
    } catch (err) {
      console.error('删除公告失败:', err.message);
      res.status(500).json({ 
        success: false, 
        message: '删除公告失败',
        error: err.message
      });
    }
  }
}

module.exports = NewsController;
