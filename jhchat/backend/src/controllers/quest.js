const db = require('../config/db');
const achievement = require('./achievement');

// 获取所有任务列表（用于藏经阁关联显示）
exports.list = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [quests] = await db.execute(
      `SELECT * FROM alchemy_quests WHERE is_active = 1 ORDER BY is_daily DESC, requirement_level`
    );
    
    const [userQuests] = await db.execute(
      `SELECT quest_id, status, progress, completed_count 
       FROM user_quests WHERE user_id = ?`,
      [userId]
    );
    
    const questMap = {};
    userQuests.forEach(uq => {
      questMap[uq.quest_id] = uq;
    });
    
    const result = quests.map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      type: q.quest_type || 'general',
      current_progress: questMap[q.id]?.progress || 0,
      target_progress: q.requirement_count || 0,
      reward: q.reward_desc || `${q.exp_reward} 经验`,
      exp_reward: q.exp_reward,
      silver_reward: q.silver_reward || 0,
      item_reward: q.item_reward || null,
      is_daily: q.is_daily === 1
    }));
    
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('List quests error:', err.message);
    res.status(500).json({ success: false, message: '获取任务列表失败' });
  }
};

// 获取用户的任务列表（包括进行中和已完成）
exports.getMyQuests = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    
    // 获取所有可用任务
    const [quests] = await db.execute(
      `SELECT * FROM alchemy_quests WHERE is_active = 1 ORDER BY is_daily DESC, requirement_level`
    );
    
    // 获取用户当前任务进度
    const [userQuests] = await db.execute(
      `SELECT quest_id, status, progress, completed_count, last_completed_date, claimed_at
       FROM user_quests WHERE user_id = ?`,
      [userId]
    );
    
    // 获取用户药材库存
    const [items] = await db.execute(
      `SELECT name, SUM(quantity) as quantity FROM alchemy_items WHERE owner = ? AND quantity > 0 GROUP BY name`,
      [username]
    );
    
    const itemCounts = {};
    items.forEach(item => {
      itemCounts[item.name] = item.quantity;
    });
    
    const questMap = {};
    userQuests.forEach(uq => {
      questMap[uq.quest_id] = uq;
    });
    
    // 合并数据
    const today = new Date().toDateString();
    const result = quests.map(quest => {
      const userQuest = questMap[quest.id];
      let progress = 0;
      let is_completed = false;
      let claimed = false;
      
      if (userQuest) {
        progress = userQuest.progress;
        
        // 检查是否完成
        if (progress >= quest.target_count) {
          is_completed = true;
        }
        
        // 检查是否已领取
        if (userQuest.status === 'claimed') {
          claimed = true;
        }
        
        // 日常任务检查是否可以重置
        if (quest.is_daily && userQuest.last_completed_date) {
          const lastDate = new Date(userQuest.last_completed_date).toDateString();
          if (today !== lastDate) {
            // 新的一天，重置日常任务
            progress = 0;
            is_completed = false;
          } else if (userQuest.status === 'in_progress') {
            // 今天已完成但未领取
            is_completed = progress >= quest.target_count;
          }
        }
      }
      
      // 解析需求
      let require_fish = null;
      let require_ore = null;
      let require_meat = null;
      let require_stone = null;
      let require_alchemy_count = null;
      
      if (quest.quest_type === 'gather') {
        const item = quest.target_item || '';
        if (item.includes('鱼')) require_fish = quest.target_count;
        else if (item.includes('矿石') || item.includes('银矿') || item.includes('金矿')) require_ore = quest.target_count;
        else if (item.includes('肉') || item.includes('皮')) require_meat = quest.target_count;
        else if (item.includes('石') || item.includes('水晶')) require_stone = quest.target_count;
      } else if (quest.quest_type === 'craft') {
        require_alchemy_count = quest.target_count;
      }
      
      return {
        ...quest,
        npc_name: quest.npc_name,
        npc_icon: quest.npc_icon,
        quest_type: quest.quest_type,
        title: quest.title,
        description: quest.description,
        require_fish,
        require_ore,
        require_meat,
        require_stone,
        require_alchemy_count,
        user_fish_count: itemCounts['鲫鱼'] || itemCounts['鲤鱼'] || itemCounts['草鱼'] || 0,
        user_ore_count: itemCounts['矿石'] || itemCounts['银矿'] || itemCounts['金矿'] || 0,
        user_meat_count: itemCounts['兽肉'] || itemCounts['老虎肉'] || 0,
        user_stone_count: itemCounts['奇石'] || itemCounts['水晶'] || 0,
        user_alchemy_count: Object.values(itemCounts).reduce((sum, qty) => sum + qty, 0),
        progress,
        is_completed,
        claimed
      };
    });
    
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Get my quests error:', err);
    res.status(500).json({ success: false, message: '获取任务列表失败' });
  }
};

// 获取可用任务列表
exports.getAvailableQuests = async (req, res) => {
  try {
    const [quests] = await db.execute(
      `SELECT * FROM alchemy_quests WHERE is_active = 1 ORDER BY requirement_level, is_daily DESC`
    );
    
    const username = req.user.username;
    const userId = req.user.id;
    
    // 获取用户当前任务进度
    const [userQuests] = await db.execute(
      `SELECT quest_id, status, progress, completed_count, last_completed_date 
       FROM user_quests WHERE user_id = ?`,
      [userId]
    );
    
    const questMap = {};
    userQuests.forEach(uq => {
      questMap[uq.quest_id] = uq;
    });
    
    // 合并数据
    const result = quests.map(quest => {
      const userQuest = questMap[quest.id];
      let progress = 0;
      let status = 'available';
      let completedCount = 0;
      
      if (userQuest) {
        progress = userQuest.progress;
        status = userQuest.status;
        completedCount = userQuest.completed_count;
        
        // 日常任务检查是否可以重置
        if (quest.is_daily && userQuest.last_completed_date) {
          const today = new Date().toDateString();
          const lastDate = new Date(userQuest.last_completed_date).toDateString();
          if (today !== lastDate) {
            // 新的一天，重置日常任务
            progress = 0;
            status = 'available';
          }
        }
      }
      
      return {
        ...quest,
        userProgress: progress,
        userStatus: status,
        completedCount: completedCount
      };
    });
    
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Get quests error:', err);
    res.status(500).json({ success: false, message: '获取任务列表失败' });
  }
};

// 接受任务
exports.acceptQuest = async (req, res) => {
  try {
    const { questId } = req.body;
    const userId = req.user.id;
    const username = req.user.username;
    
    // 检查任务是否存在
    const [quests] = await db.execute('SELECT * FROM alchemy_quests WHERE id = ?', [questId]);
    if (quests.length === 0) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }
    const quest = quests[0];
    
    // 检查等级要求
    const [users] = await db.execute('SELECT grade FROM users WHERE id = ?', [userId]);
    if (users[0].grade < quest.requirement_level) {
      return res.status(400).json({ success: false, message: `等级不足，需要${quest.requirement_level}级` });
    }
    
    // 检查是否已有该任务
    const [existing] = await db.execute(
      `SELECT * FROM user_quests WHERE user_id = ? AND quest_id = ? AND status = 'in_progress'`,
      [userId, questId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: '任务已接受' });
    }
    
    // 创建任务记录
    await db.execute(
      `INSERT INTO user_quests (user_id, username, quest_id, status, progress) 
       VALUES (?, ?, ?, 'in_progress', 0)
       ON DUPLICATE KEY UPDATE status = 'in_progress', progress = 0`,
      [userId, username, questId]
    );
    
    res.json({
      success: true,
      message: `接受任务：${quest.title}`,
      data: { questId: quest.id, title: quest.title }
    });
  } catch (err) {
    console.error('Accept quest error:', err);
    res.status(500).json({ success: false, message: '接受任务失败' });
  }
};

// 提交任务（检查并完成）
exports.submitQuest = async (req, res) => {
  try {
    const { questId } = req.body;
    const userId = req.user.id;
    const username = req.user.username;
    
    // 获取任务信息
    const [quests] = await db.execute('SELECT * FROM alchemy_quests WHERE id = ?', [questId]);
    if (quests.length === 0) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }
    const quest = quests[0];
    
    // 获取用户任务进度
    const [userQuests] = await db.execute(
      `SELECT * FROM user_quests WHERE user_id = ? AND quest_id = ? AND status IN ('in_progress', 'completed')`,
      [userId, questId]
    );
    
    if (userQuests.length === 0) {
      return res.status(400).json({ success: false, message: '未接受该任务' });
    }
    const userQuest = userQuests[0];
    
    if (userQuest.status === 'completed') {
      return res.status(400).json({ success: false, message: '任务已完成，请领取奖励' });
    }
    
    // 检查任务进度
    let currentProgress = 0;
    
    if (quest.quest_type === 'craft') {
      // 炼丹任务：检查Alchemy_items 表
      const [items] = await db.execute(
        `SELECT COUNT(*) as count FROM alchemy_items WHERE owner = ? AND potency >= 0`,
        [username]
      );
      currentProgress = items[0].count;
    } else if (quest.quest_type === 'gather') {
      // 收集任务：检查药材库存
      const [items] = await db.execute(
        `SELECT SUM(quantity) as count FROM alchemy_items WHERE owner = ? AND name = ?`,
        [username, quest.target_item]
      );
      currentProgress = items[0].count || 0;
    }
    
    // 更新进度
    await db.execute(
      `UPDATE user_quests SET progress = ? WHERE id = ?`,
      [currentProgress, userQuest.id]
    );
    
    // 检查是否完成
    if (currentProgress >= quest.target_count) {
      await db.execute(
        `UPDATE user_quests SET status = 'completed', completed_at = NOW() WHERE id = ?`,
        [userQuest.id]
      );
      
      res.json({
        success: true,
        message: `任务完成！${quest.title}`,
        data: { completed: true, questId: quest.id }
      });
    } else {
      res.json({
        success: true,
        message: `任务进度更新：${currentProgress}/${quest.target_count}`,
        data: { completed: false, progress: currentProgress, target: quest.target_count }
      });
    }
  } catch (err) {
    console.error('Submit quest error:', err);
    res.status(500).json({ success: false, message: '提交任务失败' });
  }
};

// 领取任务奖励
exports.claimQuestReward = async (req, res) => {
  try {
    const { questId } = req.body;
    const userId = req.user.id;
    const username = req.user.username;
    
    // 获取任务信息
    const [quests] = await db.execute('SELECT * FROM alchemy_quests WHERE id = ?', [questId]);
    if (quests.length === 0) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }
    const quest = quests[0];
    
    // 获取用户任务
    const [userQuests] = await db.execute(
      `SELECT * FROM user_quests WHERE user_id = ? AND quest_id = ? AND status = 'completed'`,
      [userId, questId]
    );
    
    if (userQuests.length === 0) {
      return res.status(400).json({ success: false, message: '任务未完成或未接受' });
    }
    const userQuest = userQuests[0];
    
    // 检查日常任务领取限制
    if (quest.is_daily) {
      const today = new Date().toDateString();
      const lastDate = userQuest.last_completed_date ? new Date(userQuest.last_completed_date).toDateString() : null;
      if (lastDate === today) {
        return res.status(400).json({ success: false, message: '今日已领取过该任务奖励' });
      }
    }
    
    // 发放奖励
    let message = `领取任务【${quest.title}】奖励！`;
    
    if (quest.reward_silver > 0) {
      await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [quest.reward_silver, userId]);
      message += ` 银子 +${quest.reward_silver}`;
    }
    
    if (quest.reward_exp > 0) {
      await db.execute('UPDATE users SET exp = exp + ? WHERE id = ?', [quest.reward_exp, userId]);
      message += ` 经验 +${quest.reward_exp}`;
    }
    
    if (quest.reward_item) {
      await db.execute(
        `INSERT INTO alchemy_items (name, owner, quantity, potency) VALUES (?, ?, ?, 0)
         ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
        [quest.reward_item, username, quest.reward_item_count, quest.reward_item_count]
      );
      message += ` 物品 ${quest.reward_item} x${quest.reward_item_count}`;
    }
    
    // 更新任务状态
    if (quest.is_daily) {
      // 日常任务：重置状态，增加完成次数
      await db.execute(
        `UPDATE user_quests 
         SET status = 'in_progress', progress = 0, claimed_at = NOW(), 
             completed_count = completed_count + 1, last_completed_date = CURDATE()
         WHERE id = ?`,
        [userQuest.id]
      );
    } else {
      // 普通任务：标记为已领取
      await db.execute(
        `UPDATE user_quests SET status = 'claimed', claimed_at = NOW() WHERE id = ?`,
        [userQuest.id]
      );
    }
    
    res.json({
      success: true,
      message: message,
      data: {
        silver: quest.reward_silver,
        exp: quest.reward_exp,
        item: quest.reward_item,
        itemCount: quest.reward_item_count
      }
    });
  } catch (err) {
    console.error('Claim quest reward error:', err);
    res.status(500).json({ success: false, message: '领取奖励失败' });
  }
};

// 更新任务进度（供其他模块调用）
exports.updateQuestProgress = async (username, type, targetItem = null, count = 1) => {
  try {
    const [users] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (users.length === 0) return;
    
    const userId = users[0].id;
    
    // 获取用户进行中的任务
    const [activeQuests] = await db.execute(
      `SELECT uq.*, aq.quest_type, aq.target_item, aq.target_count
       FROM user_quests uq
       JOIN alchemy_quests aq ON uq.quest_id = aq.id
       WHERE uq.user_id = ? AND uq.status = 'in_progress'`,
      [userId]
    );
    
    for (const quest of activeQuests) {
      let currentProgress = quest.progress;
      
      // 根据任务类型和物品更新进度
      if (quest.quest_type === 'craft' && type === 'alchemy') {
        // 炼丹任务：每次炼丹 +1
        currentProgress += count;
      } else if (quest.quest_type === 'gather' && type === 'gather' && targetItem === quest.target_item) {
        // 收集任务：收集指定物品
        currentProgress += count;
      }
      
      // 更新进度
      if (currentProgress > quest.progress) {
        await db.execute(
          `UPDATE user_quests SET progress = ? WHERE id = ?`,
          [Math.min(currentProgress, quest.target_count), quest.id]
        );
      }
    }
  } catch (err) {
    console.error('Update quest progress error:', err);
  }
};

module.exports.updateQuestProgress = exports.updateQuestProgress;
