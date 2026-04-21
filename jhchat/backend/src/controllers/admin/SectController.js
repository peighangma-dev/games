/**
 * 门派管理控制器
 */
const db = require('../../config/db');

class SectController {
  static async getSects(req, res) {
    try {
      const [sects] = await db.execute('SELECT * FROM sects ORDER BY id');
      res.json({ success: true, data: sects });
    } catch (err) {
      console.error('获取门派列表失败:', err);
      res.status(500).json({ success: false, message: '获取门派列表失败' });
    }
  }

  static async getSectDetail(req, res) {
    try {
      const { id } = req.params;
      const [sects] = await db.execute('SELECT * FROM sects WHERE id = ?', [id]);
      if (sects.length === 0) {
        return res.status(404).json({ success: false, message: '门派不存在' });
      }
      res.json({ success: true, data: sects[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: '获取门派详情失败' });
    }
  }

  static async updateSect(req, res) {
    try {
      const { id } = req.params;
      const { leader, description, rules, fit_gender } = req.body;
      
      const fields = [];
      const values = [];
      
      if (leader !== undefined) { fields.push('leader = ?'); values.push(leader); }
      if (description !== undefined) { fields.push('description = ?'); values.push(description); }
      if (rules !== undefined) { fields.push('rules = ?'); values.push(rules); }
      if (fit_gender !== undefined) { fields.push('fit_gender = ?'); values.push(fit_gender); }
      
      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有要更新的字段'
        });
      }
      
      values.push(id);
      
      await db.execute(
        `UPDATE sects SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      res.json({ success: true, message: '门派信息更新成功' });
    } catch (err) {
      console.error('更新门派信息失败:', err);
      res.status(500).json({ success: false, message: '更新门派信息失败' });
    }
  }
}

module.exports = SectController;
