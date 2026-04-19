const db = require('../config/db');

// 获取药园配置
const GARDEN_CONFIG = {
  waterIntervalMinutes: 30, // 浇水间隔
  maxWaterPerDay: 5, // 每日最多浇水次数
  baseContribution: 10 // 基础贡献值
};

// 获取门派药园信息
exports.getSectGarden = async (req, res) => {
  try {
    const userSect = req.user.sect;
    
    if (!userSect || userSect === '无') {
      return res.status(400).json({ success: false, message: '需要先加入门派才能使用药园' });
    }
    
    // 获取药园信息
    const [gardens] = await db.execute(
      'SELECT * FROM sect_gardens WHERE sect_name = ?',
      [userSect]
    );
    
    let garden = gardens[0];
    
    if (!garden) {
      // 创建新药园
      const [sects] = await db.execute('SELECT id FROM sects WHERE name = ?', [userSect]);
      if (sects.length === 0) {
        return res.status(404).json({ success: false, message: '门派不存在' });
      }
      
      const sectId = sects[0].id;
      await db.execute(
        'INSERT INTO sect_gardens (sect_id, sect_name) VALUES (?, ?)',
        [sectId, userSect]
      );
      
      garden = {
        id: 1,
        sect_id: sectId,
        sect_name: userSect,
        level: 1,
        capacity: 20,
        contribution_total: 0
      };
      
      // 初始化地块
      for (let i = 1; i <= 20; i++) {
        await db.execute(
          'INSERT INTO garden_plots (garden_id, plot_number) VALUES (?, ?)',
          [garden.id, i]
        );
      }
    }
    
    // 获取地块信息
    const [plots] = await db.execute(
      'SELECT * FROM garden_plots WHERE garden_id = ? ORDER BY plot_number',
      [garden.id]
    );
    
    // 获取用户今日浇水次数
    const today = new Date().toDateString();
    const [waterRecords] = await db.execute(
      `SELECT COUNT(*) as count FROM garden_records 
       WHERE user_id = ? AND action_type = 'water' AND DATE(created_at) = ?`,
      [req.user.id, today]
    );
    
    res.json({
      success: true,
      data: {
        garden,
        plots,
        userWaterCount: waterRecords[0].count,
        maxWaterPerDay: GARDEN_CONFIG.maxWaterPerDay
      }
    });
  } catch (err) {
    console.error('Get sect garden error:', err);
    res.status(500).json({ success: false, message: '获取药园信息失败' });
  }
};

// 种植药材
exports.plantSeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    const userSect = req.user.sect;
    const { plotNumber, plantId } = req.body;
    
    if (!userSect || userSect === '无') {
      return res.status(400).json({ success: false, message: '需要先加入门派' });
    }
    
    // 获取植物信息
    const [plants] = await db.execute('SELECT * FROM garden_plants WHERE id = ? AND is_active = 1', [plantId]);
    if (plants.length === 0) {
      return res.status(404).json({ success: false, message: '植物不存在' });
    }
    const plant = plants[0];
    
    // 检查银两
    const [users] = await db.execute('SELECT silver FROM users WHERE id = ?', [userId]);
    if (users[0].silver < plant.seed_cost) {
      return res.status(400).json({ success: false, message: `银两不足，需要${plant.seed_cost}两购买种子` });
    }
    
    // 获取药园
    const [gardens] = await db.execute('SELECT * FROM sect_gardens WHERE sect_name = ?', [userSect]);
    if (gardens.length === 0) {
      return res.status(404).json({ success: false, message: '药园不存在' });
    }
    const garden = gardens[0];
    
    // 检查地块
    const [plots] = await db.execute(
      'SELECT * FROM garden_plots WHERE garden_id = ? AND plot_number = ?',
      [garden.id, plotNumber]
    );
    if (plots.length === 0) {
      return res.status(404).json({ success: false, message: '地块不存在' });
    }
    const plot = plots[0];
    
    if (plot.plant_id && !plot.is_harvested) {
      return res.status(400).json({ success: false, message: '该地块已有植物，请先收获' });
    }
    
    // 扣减银两
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [plant.seed_cost, userId]);
    
    // 更新地块
    const now = new Date();
    const readyTime = new Date(now.getTime() + plant.growth_time_minutes * 60000);
    
    await db.execute(
      `UPDATE garden_plots SET 
       plant_id = ?, plant_name = ?, planter_id = ?, planter_username = ?,
       planted_at = NOW(), growth_stage = 0, growth_progress = 0, ready_at = ?,
       is_harvested = 0, harvested_at = NULL
       WHERE id = ?`,
      [plant.id, plant.name, userId, username, readyTime, plot.id]
    );
    
    // 记录
    await db.execute(
      `INSERT INTO garden_records (user_id, username, sect_id, action_type, plant_name, plot_number) 
       VALUES (?, ?, ?, 'plant', ?, ?)`,
      [userId, username, garden.sect_id, plant.name, plotNumber]
    );
    
    res.json({
      success: true,
      message: `种植${plant.name}成功！预计${plant.growth_time_minutes}分钟后成熟`,
      data: {
        plantName: plant.name,
        readyAt: readyTime
      }
    });
  } catch (err) {
    console.error('Plant seed error:', err);
    res.status(500).json({ success: false, message: '种植失败' });
  }
};

// 浇水
exports.waterPlant = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    const userSect = req.user.sect;
    const { plotNumber } = req.body;
    
    if (!userSect || userSect === '无') {
      return res.status(400).json({ success: false, message: '需要先加入门派' });
    }
    
    // 检查今日浇水次数
    const today = new Date().toDateString();
    const [waterRecords] = await db.execute(
      `SELECT COUNT(*) as count FROM garden_records 
       WHERE user_id = ? AND action_type = 'water' AND DATE(created_at) = ?`,
      [userId, today]
    );
    
    if (waterRecords[0].count >= GARDEN_CONFIG.maxWaterPerDay) {
      return res.status(400).json({ success: false, message: '今日浇水次数已达上限' });
    }
    
    // 获取药园
    const [gardens] = await db.execute('SELECT * FROM sect_gardens WHERE sect_name = ?', [userSect]);
    const garden = gardens[0];
    
    // 获取地块
    const [plots] = await db.execute(
      'SELECT * FROM garden_plots WHERE garden_id = ? AND plot_number = ? AND is_harvested = 0 AND plant_id IS NOT NULL',
      [garden.id, plotNumber]
    );
    
    if (plots.length === 0) {
      return res.status(400).json({ success: false, message: '该地块没有可浇水的植物' });
    }
    const plot = plots[0];
    
    // 增加生长进度
    const addedProgress = 20;
    const newProgress = Math.min(100, plot.growth_progress + addedProgress);
    const newStage = Math.floor(newProgress / 25);
    
    await db.execute(
      'UPDATE garden_plots SET growth_progress = ?, growth_stage = ? WHERE id = ?',
      [newProgress, newStage, plot.id]
    );
    
    // 记录
    await db.execute(
      `INSERT INTO garden_records (user_id, username, sect_id, action_type, plant_name, plot_number, contribution_earned) 
       VALUES (?, ?, ?, 'water', ?, ?, ?)`,
      [userId, username, garden.sect_id, plot.plant_name, plotNumber, GARDEN_CONFIG.baseContribution]
    );
    
    // 增加贡献
    await db.execute(
      'UPDATE sect_gardens SET contribution_total = contribution_total + ? WHERE id = ?',
      [GARDEN_CONFIG.baseContribution, garden.id]
    );
    
    res.json({
      success: true,
      message: `浇水成功！${plot.plant_name}生长进度 +${addedProgress}%，获得${GARDEN_CONFIG.baseContribution}点贡献`,
      data: {
        newProgress,
        newStage,
        contribution: GARDEN_CONFIG.baseContribution
      }
    });
  } catch (err) {
    console.error('Water plant error:', err);
    res.status(500).json({ success: false, message: '浇水失败' });
  }
};

// 收获
exports.harvestPlant = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    const userSect = req.user.sect;
    const { plotNumber } = req.body;
    
    if (!userSect || userSect === '无') {
      return res.status(400).json({ success: false, message: '需要先加入门派' });
    }
    
    // 获取药园
    const [gardens] = await db.execute('SELECT * FROM sect_gardens WHERE sect_name = ?', [userSect]);
    const garden = gardens[0];
    
    // 获取地块
    const [plots] = await db.execute(
      'SELECT * FROM garden_plots WHERE garden_id = ? AND plot_number = ? AND is_harvested = 0 AND ready_at <= NOW()',
      [garden.id, plotNumber]
    );
    
    if (plots.length === 0) {
      return res.status(400).json({ success: false, message: '该地块没有可收获的植物' });
    }
    const plot = plots[0];
    
    // 获取植物信息
    const [plants] = await db.execute('SELECT * FROM garden_plants WHERE id = ?', [plot.plant_id]);
    const plant = plants[0];
    
    // 随机收获数量
    const harvestQty = Math.floor(Math.random() * (plant.harvest_quantity_max - plant.harvest_quantity_min + 1)) + plant.harvest_quantity_min;
    
    // 添加到药材仓库
    await db.execute(
      `INSERT INTO alchemy_items (name, owner, quantity, potency) 
       VALUES (?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
      [plant.harvest_item, username, harvestQty, harvestQty]
    );
    
    // 更新地块
    await db.execute(
      `UPDATE garden_plots SET is_harvested = 1, harvested_at = NOW(), harvester_username = ? WHERE id = ?`,
      [username, plot.id]
    );
    
    // 计算贡献
    const contribution = Math.floor(plant.harvest_value / 10);
    
    // 记录
    await db.execute(
      `INSERT INTO garden_records (user_id, username, sect_id, action_type, plant_name, plot_number, contribution_earned) 
       VALUES (?, ?, ?, 'harvest', ?, ?, ?)`,
      [userId, username, garden.sect_id, plot.plant_name, plotNumber, contribution]
    );
    
    // 增加贡献
    await db.execute(
      'UPDATE sect_gardens SET contribution_total = contribution_total + ? WHERE id = ?',
      [contribution, garden.id]
    );
    
    res.json({
      success: true,
      message: `收获成功！获得${plant.harvest_item} x${harvestQty}，${contribution}点贡献`,
      data: {
        itemName: plant.harvest_item,
        quantity: harvestQty,
        contribution
      }
    });
  } catch (err) {
    console.error('Harvest plant error:', err);
    res.status(500).json({ success: false, message: '收获失败' });
  }
};

// 获取可种植植物列表
exports.getAvailablePlants = async (req, res) => {
  try {
    const userSect = req.user.sect;
    
    if (!userSect || userSect === '无') {
      return res.status(400).json({ success: false, message: '需要先加入门派' });
    }
    
    // 获取药园等级
    const [gardens] = await db.execute('SELECT level FROM sect_gardens WHERE sect_name = ?', [userSect]);
    const gardenLevel = gardens[0]?.level || 1;
    
    // 获取可种植植物
    const [plants] = await db.execute(
      'SELECT * FROM garden_plants WHERE min_sect_level <= ? AND is_active = 1 ORDER BY seed_cost',
      [gardenLevel]
    );
    
    res.json({
      success: true,
      data: plants
    });
  } catch (err) {
    console.error('Get available plants error:', err);
    res.status(500).json({ success: false, message: '获取植物列表失败' });
  }
};

// 获取药园记录
exports.getGardenRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [records] = await db.execute(
      'SELECT * FROM garden_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
      [userId]
    );
    
    res.json({
      success: true,
      data: records
    });
  } catch (err) {
    console.error('Get garden records error:', err);
    res.status(500).json({ success: false, message: '获取记录失败' });
  }
};
