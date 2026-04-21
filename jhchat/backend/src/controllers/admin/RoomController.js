const db = require('../../config/db');

/**
 * 聊天房间管理控制器
 */
class RoomController {
  /**
   * 获取所有房间
   */
  static async getRooms(req, res) {
    try {
      const [rooms] = await db.execute(
        `SELECT * FROM chat_rooms ORDER BY sort_order, id`
      );
      
      res.json({
        success: true,
        data: rooms
      });
    } catch (err) {
      console.error('Get rooms error:', err.message);
      res.status(500).json({ 
        success: false, 
        message: '获取房间列表失败' 
      });
    }
  }

  /**
   * 创建房间
   */
  static async createRoom(req, res) {
    try {
      const { name, min_grade, max_grade, fight_enabled, sort_order } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          message: '房间名称不能为空'
        });
      }
      
      await db.execute(
        `INSERT INTO chat_rooms (name, min_grade, max_grade, fight_enabled, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [
          name,
          min_grade || 0,
          max_grade || 10,
          fight_enabled !== false ? 1 : 0,
          sort_order || 0
        ]
      );
      
      const [result] = await db.execute(
        `SELECT LAST_INSERT_ID() as id`
      );
      
      res.json({
        success: true,
        message: '房间创建成功',
        data: { id: result[0].id }
      });
    } catch (err) {
      console.error('Create room error:', err.message);
      res.status(500).json({ 
        success: false, 
        message: '创建房间失败' 
      });
    }
  }

  /**
   * 更新房间
   */
  static async updateRoom(req, res) {
    try {
      const { name, min_grade, max_grade, fight_enabled, sort_order } = req.body;
      
      const fields = [];
      const values = [];
      
      if (name !== undefined) { fields.push('name = ?'); values.push(name); }
      if (min_grade !== undefined) { fields.push('min_grade = ?'); values.push(min_grade); }
      if (max_grade !== undefined) { fields.push('max_grade = ?'); values.push(max_grade); }
      if (fight_enabled !== undefined) { fields.push('fight_enabled = ?'); values.push(fight_enabled ? 1 : 0); }
      if (sort_order !== undefined) { fields.push('sort_order = ?'); values.push(sort_order); }
      
      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有要更新的字段'
        });
      }
      
      values.push(req.params.id);
      
      const [result] = await db.execute(
        `UPDATE chat_rooms SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '房间不存在'
        });
      }
      
      res.json({
        success: true,
        message: '房间更新成功'
      });
    } catch (err) {
      console.error('Update room error:', err.message);
      res.status(500).json({ 
        success: false, 
        message: '更新房间失败' 
      });
    }
  }

  /**
   * 删除房间
   */
  static async deleteRoom(req, res) {
    try {
      const [rooms] = await db.execute(
        `SELECT name FROM chat_rooms WHERE id = ?`,
        [req.params.id]
      );
      
      if (rooms.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: '房间不存在' 
        });
      }
      
      await db.execute(
        `DELETE FROM chat_rooms WHERE id = ?`,
        [req.params.id]
      );
      
      res.json({
        success: true,
        message: '房间删除成功'
      });
    } catch (err) {
      console.error('Delete room error:', err.message);
      res.status(500).json({ 
        success: false, 
        message: '删除房间失败' 
      });
    }
  }
}

module.exports = RoomController;
