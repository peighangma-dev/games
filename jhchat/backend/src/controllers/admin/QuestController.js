/**
 * 任务管理控制器
 */
const db = require('../../config/db');

class QuestController {
  static async getQuests(req, res) {
    try {
      const [quests] = await db.execute('SELECT * FROM user_quests ORDER BY id DESC');
      res.json({ success: true, data: quests });
    } catch (err) {
      console.error('获取任务列表失败:', err);
      res.status(500).json({ success: false, message: '获取任务列表失败' });
    }
  }

  static async getQuestDetail(req, res) {
    try {
      const { id } = req.params;
      const [quests] = await db.execute('SELECT * FROM user_quests WHERE id = ?', [id]);
      if (quests.length === 0) {
        return res.status(404).json({ success: false, message: '任务不存在' });
      }
      res.json({ success: true, data: quests[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: '获取任务详情失败' });
    }
  }

  static async createQuest(req, res) {
    try {
      const { name, type, description, prerequisite, objective_type, objective_count, reward_silver, reward_exp, reward_items } = req.body;
      await db.execute(
        `INSERT INTO user_quests (name, type, description, prerequisite, objective_type, objective_count, reward_silver, reward_exp, reward_items, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [name, type, description, prerequisite, objective_type, objective_count, reward_silver, reward_exp, reward_items]
      );
      res.json({ success: true, message: '任务创建成功' });
    } catch (err) {
      res.status(500).json({ success: false, message: '创建任务失败' });
    }
  }

  static async updateQuest(req, res) {
    try {
      const { id } = req.params;
      const { name, type, description, objective_type, objective_count, reward_silver, reward_exp, active } = req.body;
      await db.execute(
        `UPDATE user_quests SET name=?, type=?, description=?, objective_type=?, objective_count=?, reward_silver=?, reward_exp=?, active=? WHERE id=?`,
        [name, type, description, objective_type, objective_count, reward_silver, reward_exp, active ? 1 : 0, id]
      );
      res.json({ success: true, message: '任务更新成功' });
    } catch (err) {
      res.status(500).json({ success: false, message: '更新任务失败' });
    }
  }

  static async deleteQuest(req, res) {
    try {
      const { id } = req.params;
      await db.execute('DELETE FROM user_quests WHERE id = ?', [id]);
      res.json({ success: true, message: '任务删除成功' });
    } catch (err) {
      res.status(500).json({ success: false, message: '删除任务失败' });
    }
  }
}

module.exports = QuestController;
