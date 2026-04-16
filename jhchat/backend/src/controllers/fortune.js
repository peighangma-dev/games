const db = require('../config/db');

// 运势配置
const FORTUNE_CONFIG = {
  great_luck: {
    title: '大吉',
    probability: 20,
    desc: '时运亨通，万事顺利！今天做什么都会成功，不妨大胆尝试新的挑战！',
    color: '#FF0000',
    image: '01.GIF'
  },
  medium_luck: {
    title: '中吉',
    probability: 20,
    desc: '运势不错，应该朝理想迈进。虽然不会有意外惊喜，但稳步前进必有所获！',
    color: '#FF6600',
    image: '02.GIF'
  },
  small_luck: {
    title: '小吉',
    probability: 30,
    desc: '运势还算不错！虽然不能贪心，但只要脚踏实地，会有小收获！',
    color: '#FFAA00',
    image: '03.GIF'
  },
  small_misfortune: {
    title: '小凶',
    probability: 20,
    desc: '今天可能会遇到一些挫折，但不要气馁！保持冷静，困难终将过去！',
    color: '#666666',
    image: '04.GIF'
  },
  great_misfortune: {
    title: '大凶',
    probability: 10,
    desc: '运势不佳，不宜冒进！建议您今天低调行事，避免做重大决定！',
    color: '#333333',
    image: '05.GIF'
  }
};

// 获取今日运势
exports.getFortune = async (req, res) => {
  try {
    const username = req.user.username;
    const today = new Date().toISOString().slice(0, 10);
    
    // 查询今日是否已求签
    const [fortunes] = await db.execute(
      'SELECT * FROM user_fortunes WHERE username = ? AND fortune_date = ?',
      [username, today]
    );
    
    if (fortunes.length > 0) {
      // 已有运势，直接返回
      const fortune = fortunes[0];
      const config = FORTUNE_CONFIG[fortune.fortune_type];
      return res.json({
        success: true,
        data: {
          type: fortune.fortune_type,
          title: fortune.fortune_title,
          description: fortune.fortune_desc,
          color: config.color,
          image: config.image,
          isDrawn: true
        }
      });
    }
    
    // 还没有求签，返回 null
    res.json({
      success: true,
      data: { isDrawn: false }
    });
  } catch (err) {
    console.error('Get fortune error:', err);
    res.status(500).json({ success: false, message: '查询运势失败' });
  }
};

// 求签
exports.drawFortune = async (req, res) => {
  try {
    const username = req.user.username;
    const userId = req.user.id;
    const today = new Date().toISOString().slice(0, 10);
    
    // 检查今日是否已求签
    const [existing] = await db.execute(
      'SELECT id FROM user_fortunes WHERE username = ? AND fortune_date = ?',
      [username, today]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '今日已求过签，请明天再来！' 
      });
    }
    
    // 随机抽取运势
    const rand = Math.random() * 100;
    let cumulative = 0;
    let selectedType = 'small_luck';
    
    for (const [type, config] of Object.entries(FORTUNE_CONFIG)) {
      cumulative += config.probability;
      if (rand <= cumulative) {
        selectedType = type;
        break;
      }
    }
    
    const config = FORTUNE_CONFIG[selectedType];
    
    // 插入运势记录
    await db.execute(
      `INSERT INTO user_fortunes (user_id, username, fortune_type, fortune_title, fortune_desc, fortune_date) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, username, selectedType, config.title, config.desc, today]
    );
    
    res.json({
      success: true,
      data: {
        type: selectedType,
        title: config.title,
        description: config.desc,
        color: config.color,
        image: config.image,
        isDrawn: true
      }
    });
  } catch (err) {
    console.error('Draw fortune error:', err);
    res.status(500).json({ success: false, message: '求签失败' });
  }
};
