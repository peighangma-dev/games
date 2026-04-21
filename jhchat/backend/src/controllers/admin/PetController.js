/**
 * 宠物管理控制器
 */
const db = require('../../config/db');

class PetController {
  static async getPets(req, res) {
    try {
      const [pets] = await db.execute('SELECT * FROM card_templates WHERE card_type = "pet" ORDER BY id DESC');
      res.json({ success: true, data: pets });
    } catch (err) {
      console.error('获取宠物列表失败:', err);
      res.status(500).json({ success: false, message: '获取宠物列表失败' });
    }
  }

  static async getPetDetail(req, res) {
    try {
      const { id } = req.params;
      const [pets] = await db.execute('SELECT * FROM card_templates WHERE id = ?', [id]);
      if (pets.length === 0) {
        return res.status(404).json({ success: false, message: '宠物不存在' });
      }
      res.json({ success: true, data: pets[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: '获取宠物详情失败' });
    }
  }

  static async createPet(req, res) {
    try {
      const { name, type, rarity, skill, description, price } = req.body;
      await db.execute(
        `INSERT INTO card_templates (card_name, card_type, rarity, skill, description, price)
         VALUES (?, "pet", ?, ?, ?, ?)`,
        [name, rarity, skill, description, price]
      );
      res.json({ success: true, message: '宠物创建成功' });
    } catch (err) {
      res.status(500).json({ success: false, message: '创建宠物失败' });
    }
  }

  static async updatePet(req, res) {
    try {
      const { id } = req.params;
      const { name, rarity, skill, description, price } = req.body;
      await db.execute(
        `UPDATE card_templates SET card_name=?, rarity=?, skill=?, description=?, price=? WHERE id=?`,
        [name, rarity, skill, description, price, id]
      );
      res.json({ success: true, message: '宠物更新成功' });
    } catch (err) {
      res.status(500).json({ success: false, message: '更新宠物失败' });
    }
  }

  static async deletePet(req, res) {
    try {
      const { id } = req.params;
      await db.execute('DELETE FROM card_templates WHERE id = ?', [id]);
      res.json({ success: true, message: '宠物删除成功' });
    } catch (err) {
      res.status(500).json({ success: false, message: '删除宠物失败' });
    }
  }
}

module.exports = PetController;
