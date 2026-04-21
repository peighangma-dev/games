const db = require('../../config/db');

/**
 * 藏经阁管理控制器
 */
class SecretSkillController {
  /**
   * 获取所有武功秘籍
   */
  static async getSecretSkills(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      
      const [skills] = await db.execute(
        `SELECT * FROM secret_skills ORDER BY level, price LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      
      const [total] = await db.execute(
        `SELECT COUNT(*) as count FROM secret_skills`
      );
      
      res.json({
        success: true,
        data: skills,
        pagination: {
          page,
          limit,
          total: total[0].count,
          totalPages: Math.ceil(total[0].count / limit)
        }
      });
    } catch (err) {
      console.error('Get secret skills error:', err.message);
      res.status(500).json({ 
        success: false, 
        message: '获取武功秘籍失败' 
      });
    }
  }

  /**
   * 获取武功秘籍详情
   */
  static async getSecretSkillDetail(req, res) {
    try {
      const [skills] = await db.execute(
        `SELECT * FROM secret_skills WHERE id = ?`,
        [req.params.id]
      );
      
      if (skills.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: '武功秘籍不存在' 
        });
      }
      
      // 统计学习人数
      const [learners] = await db.execute(
        `SELECT COUNT(*) as count FROM learned_skills WHERE skill_name = ?`,
        [skills[0].name]
      );
      
      res.json({
        success: true,
        data: {
          ...skills[0],
          learners: learners[0].count
        }
      });
    } catch (err) {
      console.error('Get secret skill detail error:', err.message);
      res.status(500).json({ 
        success: false, 
        message: '获取武功详情失败' 
      });
    }
  }

  /**
   * 创建武功秘籍
   */
  static async createSecretSkill(req, res) {
    try {
      const { name, grade, sect, type, effect, require_level, price, speed_bonus, neili_bonus, level, description, rarity } = req.body;
      
      if (!name || !price) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段：name, price'
        });
      }
      
      await db.execute(
        `INSERT INTO secret_skills 
         (name, grade, sect, type, effect, require_level, price, speed_bonus, neili_bonus, level, description, rarity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          grade || '丙',
          sect || '通用',
          type || '内功',
          effect || '',
          require_level || 1,
          price,
          speed_bonus || 0,
          neili_bonus || 0,
          level || 1,
          description || effect || '',
          rarity || 'common'
        ]
      );
      
      const [result] = await db.execute(
        `SELECT LAST_INSERT_ID() as id`
      );
      
      res.json({
        success: true,
        message: '武功秘籍创建成功',
        data: { id: result[0].id }
      });
    } catch (err) {
      console.error('Create secret skill error:', err.message);
      res.status(500).json({ 
        success: false, 
        message: '创建武功秘籍失败' 
      });
    }
  }

  /**
   * 更新武功秘籍
   */
  static async updateSecretSkill(req, res) {
    try {
      const { name, grade, sect, type, effect, require_level, price, speed_bonus, neili_bonus, level, description, rarity } = req.body;
      
      const fields = [];
      const values = [];
      
      if (name !== undefined) { fields.push('name = ?'); values.push(name); }
      if (grade !== undefined) { fields.push('grade = ?'); values.push(grade); }
      if (sect !== undefined) { fields.push('sect = ?'); values.push(sect); }
      if (type !== undefined) { fields.push('type = ?'); values.push(type); }
      if (effect !== undefined) { fields.push('effect = ?'); values.push(effect); }
      if (require_level !== undefined) { fields.push('require_level = ?'); values.push(require_level); }
      if (price !== undefined) { fields.push('price = ?'); values.push(price); }
      if (speed_bonus !== undefined) { fields.push('speed_bonus = ?'); values.push(speed_bonus); }
      if (neili_bonus !== undefined) { fields.push('neili_bonus = ?'); values.push(neili_bonus); }
      if (level !== undefined) { fields.push('level = ?'); values.push(level); }
      if (description !== undefined) { fields.push('description = ?'); values.push(description); }
      if (rarity !== undefined) { fields.push('rarity = ?'); values.push(rarity); }
      
      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有要更新的字段'
        });
      }
      
      values.push(req.params.id);
      
      await db.execute(
        `UPDATE secret_skills SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      res.json({
        success: true,
        message: '武功秘籍更新成功'
      });
    } catch (err) {
      console.error('Update secret skill error:', err.message);
      res.status(500).json({ 
        success: false, 
        message: '更新武功秘籍失败' 
      });
    }
  }

  /**
   * 删除武功秘籍
   */
  static async deleteSecretSkill(req, res) {
    try {
      const [skills] = await db.execute(
        `SELECT name FROM secret_skills WHERE id = ?`,
        [req.params.id]
      );
      
      if (skills.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: '武功秘籍不存在' 
        });
      }
      
      const skillName = skills[0].name;
      
      // 检查是否有用户学习
      const [learners] = await db.execute(
        `SELECT COUNT(*) as count FROM learned_skills WHERE skill_name = ?`,
        [skillName]
      );
      
      if (learners[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: `有 ${learners[0].count} 名用户已学习此武功，无法删除`
        });
      }
      
      await db.execute(
        `DELETE FROM secret_skills WHERE id = ?`,
        [req.params.id]
      );
      
      res.json({
        success: true,
        message: '武功秘籍删除成功'
      });
    } catch (err) {
      console.error('Delete secret skill error:', err.message);
      res.status(500).json({ 
        success: false, 
        message: '删除武功秘籍失败' 
      });
    }
  }

  /**
   * 获取藏经阁统计
   */
  static async getSecretSkillsStats(req, res) {
    try {
      const [total] = await db.execute(
        `SELECT COUNT(*) as count FROM secret_skills`
      );
      
      // 按稀有度统计
      const [rarityStats] = await db.execute(
        `SELECT rarity, COUNT(*) as count FROM secret_skills GROUP BY rarity`
      );
      
      const [levelStats] = await db.execute(
        `SELECT level, COUNT(*) as count FROM secret_skills GROUP BY level ORDER BY level`
      );
      
      // 尝试查询 learned_skills 表（可能不存在）
      let totalLearners = [{ count: 0 }];
      let totalLearned = [{ count: 0 }];
      
      try {
        [totalLearners] = await db.execute(
          `SELECT COUNT(DISTINCT owner) as count FROM learned_skills`
        );
        
        [totalLearned] = await db.execute(
          `SELECT COUNT(*) as count FROM learned_skills`
        );
      } catch (err) {
        console.log('learned_skills 表不存在，使用默认值');
      }
      
      res.json({
        success: true,
        data: {
          totalSkills: total[0].count,
          total: total[0].count,
          rarityStats: rarityStats.reduce((acc, row) => {
            acc[row.rarity] = row.count;
            return acc;
          }, {}),
          levelDistribution: levelStats,
          totalLearners: totalLearners[0].count,
          totalLearned: totalLearned[0].count
        }
      });
    } catch (err) {
      console.error('Get secret skills stats error:', err.message);
      res.status(500).json({ 
        success: false, 
        message: '获取统计失败' 
      });
    }
  }
}

module.exports = SecretSkillController;
