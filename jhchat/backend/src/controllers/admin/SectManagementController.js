/**
 * 门派管理控制器 - 增强版
 * 处理所有后台管理相关的门派管理功能
 */
const db = require('../../config/db');

class SectManagementController {
  /**
   * 获取所有门派列表（带详细信息）
   */
  static async getSects(req, res) {
    try {
      const [sects] = await db.execute(`
        SELECT s.*, 
               (SELECT COUNT(*) FROM users u WHERE u.sect = s.name AND u.status != 'dead') as actual_member_count,
               (SELECT SUM(silver) FROM users WHERE sect = s.name) as total_silver
        FROM sects s 
        ORDER BY s.member_count DESC, s.created_at DESC
      `);
      
      res.json({ success: true, data: sects });
    } catch (err) {
      console.error('获取门派列表失败:', err);
      res.status(500).json({ success: false, message: '获取门派列表失败' });
    }
  }

  /**
   * 获取门派详细信息
   */
  static async getSectDetail(req, res) {
    try {
      const { id } = req.params;
      
      const [sects] = await db.execute('SELECT * FROM sects WHERE id = ?', [id]);
      if (sects.length === 0) {
        return res.status(404).json({ success: false, message: '门派不存在' });
      }
      
      const sect = sects[0];
      
      // 获取门派成员统计
      const [memberStats] = await db.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN gender = 'male' THEN 1 ELSE 0 END) as male_count,
          SUM(CASE WHEN gender = 'female' THEN 1 ELSE 0 END) as female_count,
          AVG(grade) as avg_grade,
          SUM(silver) as total_silver,
          SUM(total_exp) as total_exp
        FROM users 
        WHERE sect = ? AND status != 'dead'
      `, [sect.name]);
      
      // 获取职位列表
      const [positions] = await db.execute(`
        SELECT * FROM sect_positions WHERE sect_id = ? ORDER BY position_rank DESC
      `, [id]);
      
      // 获取最近申请
      const [recentApplications] = await db.execute(`
        SELECT username, message, status, created_at 
        FROM sect_applications 
        WHERE sect_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
      `, [id]);
      
      res.json({
        success: true,
        data: {
          ...sect,
          memberStats: memberStats[0] || {},
          positions,
          recentApplications
        }
      });
    } catch (err) {
      console.error('获取门派详情失败:', err);
      res.status(500).json({ success: false, message: '获取门派详情失败' });
    }
  }

  /**
   * 创建新门派
   */
  static async createSect(req, res) {
    try {
      const { name, leader, slogan, description, rules, fit_gender } = req.body;
      
      // 检查是否已存在
      const [existing] = await db.execute('SELECT id FROM sects WHERE name = ?', [name]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: '门派名称已存在' });
      }
      
      // 插入新门派
      await db.execute(`
        INSERT INTO sects (name, leader, slogan, description, rules, fit_gender, member_count, fund)
        VALUES (?, ?, ?, ?, ?, ?, 0, 0)
      `, [name, leader || null, slogan || null, description || null, rules || null, fit_gender || 'both']);
      
      // 创建默认职位
      const [result] = await db.execute('SELECT LAST_INSERT_ID() as id');
      const sectId = result[0].id;
      
      await db.execute(`
        INSERT INTO sect_positions (sect_id, position_name, position_rank, description, min_grade, min_contribution, salary_amount)
        VALUES 
        (?, '掌门', 100, '一派之主，统御全派', 10, 10000, 5000),
        (?, '长老', 80, '门派长老，协助掌门管理', 8, 5000, 2000),
        (?, '护法', 60, '门派护法，维护门派秩序', 6, 2000, 1000),
        (?, '核心弟子', 40, '门派核心成员', 4, 500, 300),
        (?, '普通弟子', 20, '门派正式成员', 2, 100, 100),
        (?, '入门弟子', 10, '刚入门的弟子', 1, 0, 50)
      `, [sectId, sectId, sectId, sectId, sectId, sectId]);
      
      // 记录日志
      await db.execute(
        "INSERT INTO sect_logs (sect_id, sect_name, username, action, details) VALUES (?, ?, ?, 'create', ?)",
        [sectId, name, req.user.username, JSON.stringify({ leader, fit_gender })]
      );
      
      res.json({ success: true, message: `门派"${name}"创建成功` });
    } catch (err) {
      console.error('创建门派失败:', err);
      res.status(500).json({ success: false, message: '创建门派失败' });
    }
  }

  /**
   * 更新门派信息
   */
  static async updateSect(req, res) {
    try {
      const { id } = req.params;
      const { name, leader, slogan, description, rules, fit_gender, exp, fund } = req.body;
      
      const [sects] = await db.execute('SELECT * FROM sects WHERE id = ?', [id]);
      if (sects.length === 0) {
        return res.status(404).json({ success: false, message: '门派不存在' });
      }
      
      const oldSect = sects[0];
      const fields = [];
      const values = [];
      
      if (leader !== undefined) { fields.push('leader = ?'); values.push(leader); }
      if (slogan !== undefined) { fields.push('slogan = ?'); values.push(slogan); }
      if (description !== undefined) { fields.push('description = ?'); values.push(description); }
      if (rules !== undefined) { fields.push('rules = ?'); values.push(rules); }
      if (fit_gender !== undefined) { fields.push('fit_gender = ?'); values.push(fit_gender); }
      
      if (fields.length === 0) {
        return res.status(400).json({ success: false, message: '没有要更新的字段' });
      }
      
      values.push(id);
      await db.execute(`UPDATE sects SET ${fields.join(', ')} WHERE id = ?`, values);
      
      // 如果更新了门派名称，需要同步更新 users 表
      if (name && name !== oldSect.name) {
        await db.execute('UPDATE users SET sect = ? WHERE sect = ?', [name, oldSect.name]);
      }
      
      // 记录日志
      await db.execute(
        "INSERT INTO sect_logs (sect_name, username, action, details) VALUES (?, ?, 'update', ?)",
        [name || oldSect.name, req.user.username, JSON.stringify({ old: oldSect, new: req.body })]
      );
      
      res.json({ success: true, message: '门派信息更新成功' });
    } catch (err) {
      console.error('更新门派失败:', err);
      res.status(500).json({ success: false, message: '更新门派失败' });
    }
  }

  /**
   * 删除门派
   */
  static async deleteSect(req, res) {
    try {
      const { id } = req.params;
      
      const [sects] = await db.execute('SELECT name FROM sects WHERE id = ?', [id]);
      if (sects.length === 0) {
        return res.status(404).json({ success: false, message: '门派不存在' });
      }
      
      const sectName = sects[0].name;
      
      // 六扇门不可以删除
      if (sectName === '六扇门') {
        return res.status(403).json({ success: false, message: '六扇门是朝廷机构，不可删除' });
      }
      
      // 删除或转移成员
      await db.execute("UPDATE users SET sect = '无', sect_title = '无', join_sect_at = NULL WHERE sect = ?", [sectName]);
      
      // 删除相关数据
      await db.execute('DELETE FROM sect_positions WHERE sect_id = ?', [id]);
      await db.execute('DELETE FROM sect_applications WHERE sect_id = ?', [id]);
      await db.execute('DELETE FROM sect_logs WHERE sect_id = ?', [id]);
      await db.execute('DELETE FROM sect_fund_logs WHERE sect_id = ?', [id]);
      
      // 删除门派
      await db.execute('DELETE FROM sects WHERE id = ?', [id]);
      
      // 记录日志
      await db.execute(
        "INSERT INTO sect_logs (sect_name, username, action) VALUES (?, ?, 'delete')",
        [sectName, req.user.username]
      );
      
      res.json({ success: true, message: `门派"${sectName}"已删除` });
    } catch (err) {
      console.error('删除门派失败:', err);
      res.status(500).json({ success: false, message: '删除门派失败' });
    }
  }

  /**
   * 获取门派成员列表
   */
  static async getSectMembers(req, res) {
    try {
      const { sectId } = req.params;
      const { page = 1, limit = 50, search = '' } = req.query;
      const offset = (page - 1) * limit;
      
      const [sects] = await db.execute('SELECT name FROM sects WHERE id = ?', [sectId]);
      if (sects.length === 0) {
        return res.status(404).json({ success: false, message: '门派不存在' });
      }
      
      const sectName = sects[0].name;
      const searchCondition = search ? 'AND (username LIKE ? OR sect_title LIKE ?)' : '';
      const params = search ? [`%${search}%`, `%${search}%`] : [];
      
      const [members] = await db.execute(`
        SELECT id, username, gender, sect_title, sect_position, grade, total_exp, silver, 
               sect_contribution, status, last_login_at, registered_at
        FROM users 
        WHERE sect = ? ${searchCondition} AND status != 'dead'
        ORDER BY grade DESC, sect_position DESC, total_exp DESC
        LIMIT ? OFFSET ?
      `, [sectName, ...params, parseInt(limit), offset]);
      
      const [total] = await db.execute(`
        SELECT COUNT(*) as count FROM users WHERE sect = ? ${searchCondition}`,
        [sectName, ...params]
      );
      
      res.json({
        success: true,
        data: {
          members,
          pagination: {
            total: total[0].count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total[0].count / limit)
          }
        }
      });
    } catch (err) {
      console.error('获取门派成员失败:', err);
      res.status(500).json({ success: false, message: '获取门派成员失败' });
    }
  }

  /**
   * 获取门派职位列表
   */
  static async getSectPositions(req, res) {
    try {
      const { sectId } = req.params;
      
      const [positions] = await db.execute(`
        SELECT * FROM sect_positions 
        WHERE sect_id = ? 
        ORDER BY position_rank DESC
      `, [sectId]);
      
      res.json({ success: true, data: positions });
    } catch (err) {
      console.error('获取门派职位失败:', err);
      res.status(500).json({ success: false, message: '获取门派职位失败' });
    }
  }

  /**
   * 创建/更新门派职位
   */
  static async saveSectPosition(req, res) {
    try {
      const { sectId } = req.params;
      const { id, position_name, position_rank, description, min_grade, min_contribution, salary_amount, permissions } = req.body;
      
      if (id) {
        // 更新现有职位
        await db.execute(`
          UPDATE sect_positions 
          SET position_name = ?, position_rank = ?, description = ?, 
              min_grade = ?, min_contribution = ?, salary_amount = ?, permissions = ?
          WHERE id = ? AND sect_id = ?
        `, [position_name, position_rank, description, min_grade, min_contribution, salary_amount, JSON.stringify(permissions), id, sectId]);
      } else {
        // 创建新职位
        await db.execute(`
          INSERT INTO sect_positions (sect_id, position_name, position_rank, description, min_grade, min_contribution, salary_amount, permissions)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [sectId, position_name, position_rank, description, min_grade, min_contribution, salary_amount, JSON.stringify(permissions)]);
      }
      
      res.json({ success: true, message: '职位保存成功' });
    } catch (err) {
      console.error('保存门派职位失败:', err);
      res.status(500).json({ success: false, message: '保存门派职位失败' });
    }
  }

  /**
   * 删除门派职位
   */
  static async deleteSectPosition(req, res) {
    try {
      const { sectId, positionId } = req.params;
      
      await db.execute('DELETE FROM sect_positions WHERE id = ? AND sect_id = ?', [positionId, sectId]);
      
      res.json({ success: true, message: '职位删除成功' });
    } catch (err) {
      console.error('删除门派职位失败:', err);
      res.status(500).json({ success: false, message: '删除门派职位失败' });
    }
  }

  /**
   * 获取入派申请列表
   */
  static async getSectApplications(req, res) {
    try {
      const { sectId } = req.params;
      const { status = 'pending', page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;
      
      const [applications] = await db.execute(`
        SELECT a.*, u.avatar, u.grade, u.total_exp, u.gender
        FROM sect_applications a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.sect_id = ? ${status !== 'all' ? 'AND a.status = ?' : ''}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `, [sectId, status !== 'all' ? status : '', parseInt(limit), offset]);
      
      const [total] = await db.execute(`
        SELECT COUNT(*) as count 
        FROM sect_applications 
        WHERE sect_id = ? ${status !== 'all' ? 'AND status = ?' : ''}
      `, [sectId, status !== 'all' ? status : '']);
      
      res.json({
        success: true,
        data: {
          applications,
          pagination: {
            total: status !== 'all' ? total[0].count : total[0].count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total[0].count / limit)
          }
        }
      });
    } catch (err) {
      console.error('获取入派申请失败:', err);
      res.status(500).json({ success: false, message: '获取入派申请失败' });
    }
  }

  /**
   * 审批入派申请
   */
  static async reviewApplication(req, res) {
    try {
      const { sectId, appId } = req.params;
      const { action, reply } = req.body; // action: 'approve' or 'reject'
      
      const [apps] = await db.execute('SELECT * FROM sect_applications WHERE id = ? AND sect_id = ?', [appId, sectId]);
      if (apps.length === 0) {
        return res.status(404).json({ success: false, message: '申请不存在' });
      }
      
      const app = apps[0];
      
      if (app.status !== 'pending') {
        return res.status(400).json({ success: false, message: '申请已处理过' });
      }
      
      if (action === 'approve') {
        // 批准申请
        await db.execute(
          "UPDATE users SET sect = ?, sect_title = '入门弟子', sect_position = '入门弟子', join_sect_at = NOW() WHERE username = ?",
          [app.sect_name, app.username]
        );
        
        // 更新门派人数
        await db.execute('UPDATE sects SET member_count = member_count + 1 WHERE id = ?', [sectId]);
        
        // 记录日志
        await db.execute(
          "INSERT INTO sect_logs (sect_id, sect_name, username, action, target_username) VALUES (?, ?, ?, 'join', ?)",
          [sectId, app.sect_name, req.user.username, app.username]
        );
      }
      
      // 更新申请状态
      await db.execute(`
        UPDATE sect_applications 
        SET status = ?, handler_id = ?, handler_username = ?, reply = ?, handled_at = NOW()
        WHERE id = ?
      `, [action === 'approve' ? 'approved' : 'rejected', req.user.id, req.user.username, reply || null, appId]);
      
      res.json({ 
        success: true, 
        message: action === 'approve' ? '申请已批准' : '申请已拒绝'
      });
    } catch (err) {
      console.error('审批入派申请失败:', err);
      res.status(500).json({ success: false, message: '审批入派申请失败' });
    }
  }

  /**
   * 同步门派人数
   */
  static async syncSectMembers(req, res) {
    try {
      const [sects] = await db.execute('SELECT id, name FROM sects');
      
      let updated = 0;
      for (const sect of sects) {
        const [result] = await db.execute(`
          SELECT COUNT(*) as count FROM users WHERE sect = ? AND status != 'dead'
        `, [sect.name]);
        
        await db.execute('UPDATE sects SET member_count = ? WHERE id = ?', [result[0].count, sect.id]);
        updated++;
      }
      
      res.json({ success: true, message: `已同步 ${updated} 个门派的人数` });
    } catch (err) {
      console.error('同步门派人数失败:', err);
      res.status(500).json({ success: false, message: '同步门派人数失败' });
    }
  }

  /**
   * 获取门派统计信息
   */
  static async getSectStats(req, res) {
    try {
      const [stats] = await db.execute(`
        SELECT 
          (SELECT COUNT(*) FROM sects) as total_sects,
          (SELECT SUM(member_count) FROM sects) as total_members,
          (SELECT SUM(fund) FROM sects) as total_fund
      `);
      
      // 检查 sect_applications 表是否存在
      try {
        const [apps] = await db.execute("SELECT COUNT(*) as count FROM sect_applications WHERE status = 'pending'");
        stats[0].pending_applications = apps[0].count;
      } catch (err) {
        // 表不存在时默认为 0
        stats[0].pending_applications = 0;
      }
      
      res.json({ success: true, data: stats[0] });
    } catch (err) {
      console.error('获取门派统计失败:', err);
      res.status(500).json({ success: false, message: '获取门派统计失败' });
    }
  }
}

module.exports = SectManagementController;
