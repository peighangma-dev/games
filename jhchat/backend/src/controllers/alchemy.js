const db = require('../config/db');
const achievement = require('./achievement');
const quest = require('./quest');

// 配药配置
const ALCHEMY_CONFIG = {
  cooldownMinutes: 10, // 炼丹炉冷却时间（分钟）
  craftTime: 3000 // 炼制时间（毫秒）
};

// 药材交易配置
const HERB_MARKET_CONFIG = {
  basePrices: {
    '冰水': 5,
    '小鲤鱼': 30,
    '大草鱼': 80,
    '大鲨鱼': 150,
    '矿石': 10,
    '金沙': 120,
    '玉石': 250,
    '翡翠': 400,
    '老虎肉': 500,
    '狐狸': 300,
    '黑熊': 800,
    '千年寒铁': 800,
    '龙鳞石': 1500,
    '百年冰心': 400,
    '千年雪莲': 2000,
    '女娲石': 3000,
    '昆仑玉': 5000
  },
  priceFluctuation: 0.2 // 价格浮动范围 ±20%
};

// 获取当前药材价格
function getCurrentPrices() {
  const prices = {};
  for (const [name, basePrice] of Object.entries(ALCHEMY_CONFIG.basePrices || HERB_MARKET_CONFIG.basePrices)) {
    const fluctuation = 1 + (Math.random() * HERB_MARKET_CONFIG.priceFluctuation * 2 - HERB_MARKET_CONFIG.priceFluctuation);
    prices[name] = Math.floor(basePrice * fluctuation);
  }
  return prices;
}

exports.recipes = async (req, res) => {
  try {
    const [recipes] = await db.execute(
      `SELECT id, name, description, effect_type, effect_value, materials, success_rate, level 
       FROM alchemy_recipes ORDER BY level, effect_value DESC`
    );
    res.json({ success: true, data: recipes });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询药方失败' });
  }
};

exports.inventory = async (req, res) => {
  try {
    const [items] = await db.execute(
      'SELECT id, name, quantity, potency FROM alchemy_items WHERE owner = ? AND quantity > 0 ORDER BY name',
      [req.user.username]
    );
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询药材库存失败' });
  }
};

exports.potions = async (req, res) => {
  try {
    const [potions] = await db.execute(
      'SELECT id, name, quantity, potency FROM alchemy_items WHERE owner = ? AND potency > 0 ORDER BY name',
      [req.user.username]
    );
    res.json({ success: true, data: potions });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询药品失败' });
  }
};

// 获取炼丹炉状态
exports.getFurnaceStatus = async (req, res) => {
  try {
    const username = req.user.username;
    
    // 获取或创建炼丹炉状态
    let [furnaces] = await db.execute(
      'SELECT * FROM alchemy_furnaces WHERE owner = ? ORDER BY id DESC LIMIT 1',
      [username]
    );
    
    if (furnaces.length === 0) {
      // 创建新炼丹炉
      await db.execute(
        'INSERT INTO alchemy_furnaces (owner, cooldown_minutes) VALUES (?, ?)',
        [username, ALCHEMY_CONFIG.cooldownMinutes]
      );
      [furnaces] = await db.execute(
        'SELECT * FROM alchemy_furnaces WHERE owner = ? ORDER BY id DESC LIMIT 1',
        [username]
      );
    }
    
    const furnace = furnaces[0];
    let cooldownRemaining = 0;
    
    if (furnace.last_craft_time) {
      const lastTime = new Date(furnace.last_craft_time);
      const now = new Date();
      const diffMinutes = (now - lastTime) / 1000 / 60;
      
      if (diffMinutes < furnace.cooldown_minutes) {
        cooldownRemaining = Math.ceil(furnace.cooldown_minutes - diffMinutes);
      }
    }
    
    res.json({
      success: true,
      data: {
        isCrafting: furnace.is_active === 1,
        cooldownRemaining: cooldownRemaining,
        cooldownMinutes: furnace.cooldown_minutes,
        lastCraftTime: furnace.last_craft_time
      }
    });
  } catch (err) {
    console.error('Get furnace status error:', err);
    res.status(500).json({ success: false, message: '查询炼丹炉状态失败' });
  }
};

// 获取药材市场价格
exports.getMarketPrices = async (req, res) => {
  try {
    const prices = getCurrentPrices();
    
    res.json({
      success: true,
      data: {
        prices: prices,
        lastUpdated: new Date()
      }
    });
  } catch (err) {
    console.error('Get market prices error:', err);
    res.status(500).json({ success: false, message: '查询市场价格失败' });
  }
};

// 出售药材
exports.sellHerb = async (req, res) => {
  try {
    const { name, quantity } = req.body;
    const username = req.user.username;
    const userId = req.user.id;
    
    if (!name || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }
    
    // 检查药材库存
    const [items] = await db.execute(
      'SELECT id, quantity FROM alchemy_items WHERE name = ? AND owner = ? AND quantity > 0',
      [name, username]
    );
    
    if (items.length === 0 || items[0].quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: '药材不足'
      });
    }
    
    // 获取价格
    const prices = getCurrentPrices();
    const price = prices[name] || 1;
    const totalSilver = price * quantity;
    
    // 扣除药材
    if (items[0].quantity === quantity) {
      await db.execute('DELETE FROM alchemy_items WHERE id = ?', [items[0].id]);
    } else {
      await db.execute(
        'UPDATE alchemy_items SET quantity = quantity - ? WHERE id = ?',
        [quantity, items[0].id]
      );
    }
    
    // 添加银子
    await db.execute('UPDATE users SET silver = silver + ? WHERE id = ?', [totalSilver, userId]);
    
    res.json({
      success: true,
      message: `出售${name} x${quantity}，获得${totalSilver}两银子`,
      data: {
        herbName: name,
        quantity: quantity,
        unitPrice: price,
        totalSilver: totalSilver
      }
    });
  } catch (err) {
    console.error('Sell herb error:', err);
    res.status(500).json({ success: false, message: '出售药材失败' });
  }
};

// 购买药材
exports.buyHerb = async (req, res) => {
  try {
    const { name, quantity } = req.body;
    const username = req.user.username;
    const userId = req.user.id;
    
    if (!name || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }
    
    // 获取价格
    const prices = getCurrentPrices();
    const price = prices[name];
    
    if (!price) {
      return res.status(400).json({
        success: false,
        message: '未知药材'
      });
    }
    
    const totalCost = price * quantity;
    
    // 检查银子
    const [users] = await db.execute('SELECT silver FROM users WHERE id = ?', [userId]);
    if (users[0].silver < totalCost) {
      return res.status(400).json({
        success: false,
        message: '银子不足'
      });
    }
    
    // 扣除银子
    await db.execute('UPDATE users SET silver = silver - ? WHERE id = ?', [totalCost, userId]);
    
    // 添加药材
    await db.execute(
      `INSERT INTO alchemy_items (name, owner, quantity, potency) 
       VALUES (?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
      [name, username, quantity, quantity]
    );
    
    res.json({
      success: true,
      message: `购买${name} x${quantity}，消耗${totalCost}两银子`,
      data: {
        herbName: name,
        quantity: quantity,
        unitPrice: price,
        totalCost: totalCost
      }
    });
  } catch (err) {
    console.error('Buy herb error:', err);
    res.status(500).json({ success: false, message: '购买药材失败' });
  }
};

exports.usePotion = async (req, res) => {
  try {
    const [potions] = await db.execute(
      'SELECT * FROM alchemy_items WHERE id = ? AND owner = ? AND potency > 0',
      [req.params.id, req.user.username]
    );
    
    if (potions.length === 0) {
      return res.status(404).json({ success: false, message: '药品不存在或已使用' });
    }
    
    const potion = potions[0];
    
    // 查找药方获取效果
    const [recipes] = await db.execute(
      'SELECT effect_type, effect_value FROM alchemy_recipes WHERE name = ?',
      [potion.name]
    );
    
    if (recipes.length === 0) {
      return res.status(404).json({ success: false, message: '未知药品' });
    }
    
    const recipe = recipes[0];
    
    // 根据药品类型增加属性
    let updateField;
    const fieldMap = {
      'neili': 'neili',
      'tili': 'tili',
      'wugong': 'wugong',
      'charm': 'charm',
      'attack': 'attack',
      'defense': 'defense'
    };
    
    updateField = fieldMap[recipe.effect_type];
    
    if (!updateField) {
      return res.status(400).json({ success: false, message: '无效药品类型' });
    }
    
    // 更新用户属性
    await db.execute(
      `UPDATE users SET ${updateField} = ${updateField} + ? WHERE id = ?`,
      [recipe.effect_value, req.user.id]
    );
    
    // 消耗药品
    if (potion.quantity <= 1) {
      await db.execute('DELETE FROM alchemy_items WHERE id = ?', [potion.id]);
    } else {
      await db.execute('UPDATE alchemy_items SET quantity = quantity - 1 WHERE id = ?', [potion.id]);
    }
    
    res.json({ 
      success: true, 
      message: `使用${potion.name}，${recipe.effect_type === 'neili' ? '内力' : recipe.effect_type === 'tili' ? '体力' : recipe.effect_type === 'wugong' ? '武功' : recipe.effect_type === 'charm' ? '魅力' : recipe.effect_type === 'attack' ? '攻击' : '防御'}+${recipe.effect_value}`
    });
  } catch (err) {
    console.error('Use potion error:', err);
    res.status(500).json({ success: false, message: '使用药品失败' });
  }
};

exports.craft = async (req, res) => {
  try {
    const username = req.user.username;
    
    // 检查炼丹炉状态
    let [furnaces] = await db.execute(
      'SELECT * FROM alchemy_furnaces WHERE owner = ? ORDER BY id DESC LIMIT 1',
      [username]
    );
    
    if (furnaces.length === 0) {
      await db.execute(
        'INSERT INTO alchemy_furnaces (owner, cooldown_minutes) VALUES (?, ?)',
        [username, ALCHEMY_CONFIG.cooldownMinutes]
      );
      [furnaces] = await db.execute(
        'SELECT * FROM alchemy_furnaces WHERE owner = ? ORDER BY id DESC LIMIT 1',
        [username]
      );
    }
    
    const furnace = furnaces[0];
    
    // 检查是否正在炼制中
    if (furnace.is_active === 1) {
      return res.status(400).json({
        success: false,
        message: '炼丹炉正在炼制中，请稍后再试'
      });
    }
    
    // 检查冷却时间
    if (furnace.last_craft_time) {
      const lastTime = new Date(furnace.last_craft_time);
      const now = new Date();
      const diffMinutes = (now - lastTime) / 1000 / 60;
      
      if (diffMinutes < furnace.cooldown_minutes) {
        const remainMinutes = Math.ceil(furnace.cooldown_minutes - diffMinutes);
        return res.status(400).json({
          success: false,
          message: `炼丹炉需要冷却${furnace.cooldown_minutes}分钟，请${remainMinutes}分钟后再试`
        });
      }
    }
    
    const [recipes] = await db.execute(
      'SELECT * FROM alchemy_recipes WHERE id = ?', 
      [req.params.id]
    );
    if (recipes.length === 0) return res.status(404).json({ success: false, message: '药方不存在' });
    const recipe = recipes[0];
    
    // 检查等级要求
    if (req.user.grade < recipe.level) {
      return res.status(400).json({ 
        success: false, 
        message: `等级不足，需要等级${recipe.level}才能炼制此药` 
      });
    }
    
    // 解析材料需求
    const materials = typeof recipe.materials === 'string' ? JSON.parse(recipe.materials) : recipe.materials;
    
    // 检查材料是否足够
    for (let mat of materials) {
      const [inv] = await db.execute(
        'SELECT id, quantity FROM alchemy_items WHERE name = ? AND owner = ?',
        [mat.name, username]
      );
      if (inv.length === 0 || inv[0].quantity < mat.qty) {
        return res.status(400).json({ 
          success: false, 
          message: `材料不足：缺少${mat.name} x${mat.qty}` 
        });
      }
    }
    
    // 设置炼丹炉为 active
    await db.execute(
      'UPDATE alchemy_furnaces SET is_active = 1, craft_start_time = NOW(), craft_recipe_id = ? WHERE owner = ?',
      [recipe.id, username]
    );
    
    // 启动异步炼制过程
    setTimeout(async () => {
      try {
        // 消耗材料
        for (let mat of materials) {
          await db.execute(
            'UPDATE alchemy_items SET quantity = quantity - ? WHERE name = ? AND owner = ?',
            [mat.qty, mat.name, username]
          );
          await db.execute(
            'DELETE FROM alchemy_items WHERE owner = ? AND quantity <= 0',
            [username]
          );
        }
        
        // 计算成功率
        const successRate = recipe.success_rate || 100;
        const roll = Math.random() * 100;
        const isSuccess = roll <= successRate;
        
        if (!isSuccess) {
          // 炼制失败，更新状态
          await db.execute(
            'UPDATE alchemy_furnaces SET is_active = 0, last_craft_time = NOW() WHERE owner = ?',
            [username]
          );
          return;
        }
        
        // 添加成品
        const [existing] = await db.execute(
          'SELECT id, quantity FROM alchemy_items WHERE name = ? AND owner = ? AND potency > 0',
          [recipe.name, username]
        );
        
        if (existing.length > 0) {
          await db.execute(
            'UPDATE alchemy_items SET quantity = quantity + 1 WHERE id = ?',
            [existing[0].id]
          );
        } else {
          await db.execute(
            'INSERT INTO alchemy_items (name, owner, quantity, potency) VALUES (?, ?, 1, 0)',
            [recipe.name, username]
          );
        }
        
        // 更新成就进度
        await achievement.updateProgress(username, 'alchemy', 1);
        
        // 更新任务进度
        await quest.updateQuestProgress(username, 'alchemy', null, 1);
        
        // 更新状态
        await db.execute(
          'UPDATE alchemy_furnaces SET is_active = 0, last_craft_time = NOW() WHERE owner = ?',
          [username]
        );
      } catch (err) {
        console.error('Craft async error:', err);
        // 出错时也要更新状态
        await db.execute(
          'UPDATE alchemy_furnaces SET is_active = 0 WHERE owner = ?',
          [username]
        );
      }
    }, ALCHEMY_CONFIG.craftTime);
    
    res.json({ 
      success: true, 
      message: '开始炼制，请耐心等待...',
      data: { 
        crafting: true,
        craftTime: ALCHEMY_CONFIG.craftTime
      } 
    });
  } catch (err) {
    console.error('Craft error:', err);
    res.status(500).json({ success: false, message: '炼制失败' });
  }
};
