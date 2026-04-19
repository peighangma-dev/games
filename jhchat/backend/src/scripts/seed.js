const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const db = require('../config/db');
const { encryptPassword } = require('../utils/helpers');

async function seed() {
  console.log('开始种子数据...');

  const configs = [
    ['adminkey', 'xajhxp', '管理员密钥'],
    ['chatroomname', '笑傲江湖', '聊天室名称'],
    ['homepageurl', 'http://localhost:5173', '主页URL'],
    ['opendate', '2026', '开站日期'],
    ['chatroombgcolor', 'E2F2DB', '聊天室背景色'],
    ['chatbgcolor', '4B87C3', '聊天背景色'],
    ['chatimage', '', '聊天背景图片'],
    ['chatcolor', 'EEEEEE', '聊天文字颜色'],
    ['allowhtml', '10', '允许HTML等级'],
    ['iplocktime', '30', 'IP锁定时间(分钟)'],
    ['level1to2', '1500', '1升2级经验值'],
    ['level2to3', '6000', '2升3级经验值'],
    ['level3to4', '14000', '3升4级经验值'],
    ['level4to5', '40000', '4升5级经验值'],
    ['maxpeople', '500', '最大在线人数'],
    ['maxtimeout', '100', '超时分钟'],
    ['disproxy', '0', '禁止代理'],
    ['disnewuser', '0', '禁止注册'],
    ['closedoor', '0', '关闭聊天室'],
    ['userinto', '来到了笑傲江湖', '进入提示语'],
    ['userout', '离开了笑傲江湖', '退出提示语'],
    ['userdown', '掉线了', '掉线提示语'],
    ['admin', '站长', '管理员列表'],
    ['banner', '', '横幅广告'],
    ['visitor', '0', '访问量'],
    ['ver', '2.0', '版本号'],
    ['pollvalue', '300', '投票经验值门槛']
  ];

  for (const [name, value, desc] of configs) {
    await db.execute(
      'INSERT INTO system_config (name, value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = value',
      [name, value, desc]
    );
  }
  console.log('系统配置初始化完成');

  const adminPwd = await encryptPassword('admin123');
  await db.execute(
    `INSERT INTO users (username, password, gender, status, grade, faction, sect_title, all_value, silver, charm)
     VALUES ('站长', ?, 'male', 'normal', 10, '逍遥派', '掌门', 99999, 9999999, 999)
     ON DUPLICATE KEY UPDATE username = username`,
    [adminPwd]
  );
  console.log('管理员账号创建完成(站长/admin123)');

  const rooms = [
    ['大厅', 0, 0, 1, 0],
    ['忍者室', 0, 3, 1, 1],
    ['常胜殿', 3, 0, 1, 2]
  ];
  for (const [name, minGrade, maxGrade, fight, sort] of rooms) {
    await db.execute(
      'INSERT INTO chat_rooms (name, min_grade, max_grade, fight_enabled, sort_order) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = name',
      [name, minGrade, maxGrade, fight, sort]
    );
  }
  console.log('聊天房间初始化完成');

  const sects = [
    ['逍遥派', '站长', '笑傲江湖，逍遥自在', '逍遥派门规', 'both'],
    ['少林派', null, '天下武功出少林', '少林门规', 'male'],
    ['峨眉派', null, '峨眉天下秀', '峨眉门规', 'female'],
    ['武当派', null, '太极生两仪', '武当门规', 'both'],
    ['华山派', null, '华山论剑', '华山门规', 'both'],
    ['丐帮', null, '天下第一大帮', '丐帮门规', 'both'],
    ['明教', null, '焚我残躯，熊熊圣火', '明教门规', 'both'],
    ['唐门', null, '暗器无双', '唐门门规', 'both']
  ];
  for (const [name, leader, desc, rules, fit] of sects) {
    await db.execute(
      'INSERT INTO sects (name, leader, description, rules, fit_gender) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE leader = leader',
      [name, leader, desc, rules, fit]
    );
  }
  console.log('门派初始化完成');

  const actions = [
    ['1', '微笑', '##对%%微微一笑'],
    ['1', '大笑', '##对%%仰天大笑'],
    ['1', '哭泣', '##对%%泪流满面'],
    ['1', '拥抱', '##紧紧拥抱了%%'],
    ['1', '握手', '##与%%握手言欢'],
    ['1', '鞠躬', '##向%%深深鞠了一躬'],
    ['1', '挥手', '##向%%挥手致意'],
    ['1', '怒视', '##怒视着%%'],
    ['1', '安慰', '##轻声安慰%%'],
    ['1', '祝福', '##真心祝福%%'],
    ['1', '拍肩', '##拍了拍%%的肩膀'],
    ['1', '敬茶', '##给%%敬上一杯茶'],
    ['1', '磕头', '##给%%磕了三个响头'],
    ['1', '行礼', '##向%%抱拳行礼'],
    ['1', '眨眼', '##对%%眨了眨眼'],
    ['1', '害羞', '##在%%面前害羞地低下了头'],
    ['1', '瞪眼', '##瞪大了眼睛看着%%'],
    ['1', '叹气', '##对着%%长叹一声'],
    ['1', '鼓掌', '##为%%热烈鼓掌'],
    ['1', '跳起', '##高兴得跳了起来拉着%%'],
    ['1', '低头', '##在%%面前低下了头'],
    ['1', '转身', '##转身背对%%'],
    ['1', '偷看', '##偷偷看了%%一眼'],
    ['1', '飞吻', '##给%%送了一个飞吻'],
    ['1', '挠头', '##对着%%不好意思地挠了挠头'],
    ['1', '上香', '##给%%上了一炷香'],
    ['1', '献花', '##给%%献上一束鲜花'],
    ['1', '作揖', '##向%%作揖致敬'],
    ['1', '肃立', '##在%%面前肃立'],
    ['1', '请教', '##虚心向%%请教']
  ];
  for (const [type, name, template] of actions) {
    await db.execute(
      'INSERT INTO chat_actions (action_type, name, template) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = name',
      [type, name, template]
    );
  }
  console.log('聊天动作库初始化完成');

  const badWords = ['fuck', 'shit', '操', '靠', '妈的', '混蛋', '王八蛋', '滚'];
  for (const word of badWords) {
    await db.execute('INSERT INTO bad_words (word) VALUES (?) ON DUPLICATE KEY UPDATE word = word', [word]);
  }
  console.log('脏词列表初始化完成');

  const cards = [
    ['变性卡', '变换性别(需未婚)', 50000, 'normal'],
    ['踢人卡', '踢出聊天室', 80000, 'normal'],
    ['大牢卡', '关入大牢3天', 100000, 'normal'],
    ['财神卡', '抢夺对方20%银两', 150000, 'normal'],
    ['强盗花', '偷走一件未装备物品', 120000, 'normal'],
    ['催眠卡', '使对方睡着约1.3分钟', 60000, 'normal'],
    ['情人卡', '互相结为配偶(需异性且双方未婚)', 200000, 'normal'],
    ['升级卡', '等级+1(最高5级)', 300000, 'normal'],
    ['免罪卡', '被逮捕/坐牢时自动消耗抵消', 180000, 'vip'],
    ['复仇卡', '被杀时自动消耗并随机化凶手属性', 250000, 'vip']
  ];
  for (const [name, desc, price, type] of cards) {
    await db.execute(
      'INSERT INTO card_templates (name, description, price, card_type) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = name',
      [name, desc, price, type]
    );
  }
  console.log('卡片初始化完成');

  // 添加炼丹任务数据
  const npcs = [
    { id: 1, name: '张医师', icon: '👨‍⚕️' },
    { id: 2, name: '药王', icon: '🧙' },
    { id: 3, name: '江湖郎中', icon: '🚶' },
    { id: 4, name: '炼丹师', icon: '🔥' }
  ];
  console.log('NPC 列表初始化完成');

  const quests = [
    // 张医师的任务
    { npc_id: 1, npc_name: '张医师', npc_icon: '👨‍⚕️', quest_type: 'daily', title: '初识草药', description: '收集 5 份甘草', quest_category: 'gather', target_item: '甘草', target_count: 5, requirement_level: 1, reward_silver: 100, reward_exp: 50, reward_item: null, reward_item_count: 0, reward_contribution: 10, is_daily: 1 },
    { npc_id: 1, npc_name: '张医师', npc_icon: '👨‍⚕️', quest_type: 'daily', title: '钓鱼药材', description: '收集 3 份鱼腥草', quest_category: 'gather', target_item: '鱼腥草', target_count: 3, requirement_level: 2, reward_silver: 150, reward_exp: 80, reward_item: null, reward_item_count: 0, reward_contribution: 15, is_daily: 1 },
    { npc_id: 1, npc_name: '张医师', npc_icon: '👨‍⚕️', quest_type: 'normal', title: '疗伤圣药', description: '收集 10 份灵芝', quest_category: 'gather', target_item: '灵芝', target_count: 10, requirement_level: 5, reward_silver: 500, reward_exp: 200, reward_item: '金疮药', reward_item_count: 1, reward_contribution: 50, is_daily: 0 },
    { npc_id: 1, npc_name: '张医师', npc_icon: '👨‍⚕️', quest_type: 'normal', title: '矿中寻药', description: '收集 5 份矿石', quest_category: 'gather', target_item: '银矿', target_count: 5, requirement_level: 3, reward_silver: 300, reward_exp: 150, reward_item: null, reward_item_count: 0, reward_contribution: 30, is_daily: 0 },
    
    // 药王的任务
    { npc_id: 2, npc_name: '药王', npc_icon: '🧙', quest_type: 'daily', title: '炼丹基础', description: '炼制 3 次丹药', quest_category: 'craft', target_item: null, target_count: 3, requirement_level: 3, reward_silver: 200, reward_exp: 100, reward_item: null, reward_item_count: 0, reward_contribution: 20, is_daily: 1 },
    { npc_id: 2, npc_name: '药王', npc_icon: '🧙', quest_type: 'daily', title: '狩猎收集', description: '收集 3 份兽肉', quest_category: 'gather', target_item: '兽肉', target_count: 3, requirement_level: 2, reward_silver: 120, reward_exp: 60, reward_item: null, reward_item_count: 0, reward_contribution: 12, is_daily: 1 },
    { npc_id: 2, npc_name: '药王', npc_icon: '🧙', quest_type: 'normal', title: '珍稀药材', description: '收集 10 份人参', quest_category: 'gather', target_item: '人参', target_count: 10, requirement_level: 6, reward_silver: 800, reward_exp: 400, reward_item: '人参养荣丸', reward_item_count: 1, reward_contribution: 80, is_daily: 0 },
    { npc_id: 2, npc_name: '药王', npc_icon: '🧙', quest_type: 'normal', title: '奇石药引', description: '收集 5 份奇石', quest_category: 'gather', target_item: '奇石', target_count: 5, requirement_level: 4, reward_silver: 400, reward_exp: 200, reward_item: null, reward_item_count: 0, reward_contribution: 40, is_daily: 0 },
    { npc_id: 2, npc_name: '药王', npc_icon: '🧙', quest_type: 'normal', title: '高级炼丹', description: '炼制 10 次丹药', quest_category: 'craft', target_item: null, target_count: 10, requirement_level: 7, reward_silver: 1000, reward_exp: 500, reward_item: '九转金丹', reward_item_count: 1, reward_contribution: 100, is_daily: 0 },
    
    // 江湖郎中的任务
    { npc_id: 3, npc_name: '江湖郎中', npc_icon: '🚶', quest_type: 'daily', title: '街头卖艺', description: '收集 2 份止血草', quest_category: 'gather', target_item: '止血草', target_count: 2, requirement_level: 1, reward_silver: 80, reward_exp: 40, reward_item: null, reward_item_count: 0, reward_contribution: 8, is_daily: 1 },
    { npc_id: 3, npc_name: '江湖郎中', npc_icon: '🚶', quest_type: 'daily', title: '渔夫之友', description: '收集 2 份钓鱼获得的药材', quest_category: 'gather', target_item: '甘草', target_count: 2, requirement_level: 1, reward_silver: 100, reward_exp: 50, reward_item: null, reward_item_count: 0, reward_contribution: 10, is_daily: 1 },
    { npc_id: 3, npc_name: '江湖郎中', npc_icon: '🚶', quest_type: 'normal', title: '挖矿炼药', description: '收集 8 份金矿', quest_category: 'gather', target_item: '金矿', target_count: 8, requirement_level: 5, reward_silver: 600, reward_exp: 300, reward_item: null, reward_item_count: 0, reward_contribution: 60, is_daily: 0 },
    { npc_id: 3, npc_name: '江湖郎中', npc_icon: '🚶', quest_type: 'normal', title: '猎人伙伴', description: '收集 8 份皮', quest_category: 'gather', target_item: '皮', target_count: 8, requirement_level: 4, reward_silver: 350, reward_exp: 180, reward_item: null, reward_item_count: 0, reward_contribution: 35, is_daily: 0 },
    { npc_id: 3, npc_name: '江湖郎中', npc_icon: '🚶', quest_type: 'normal', title: '炼丹实践', description: '炼制 5 次丹药', quest_category: 'craft', target_item: null, target_count: 5, requirement_level: 4, reward_silver: 450, reward_exp: 220, reward_item: '金创药', reward_item_count: 2, reward_contribution: 45, is_daily: 0 },
    
    // 炼丹师的任务
    { npc_id: 4, npc_name: '炼丹师', npc_icon: '🔥', quest_type: 'daily', title: '炼丹修行', description: '炼制 5 次丹药', quest_category: 'craft', target_item: null, target_count: 5, requirement_level: 4, reward_silver: 250, reward_exp: 120, reward_item: null, reward_item_count: 0, reward_contribution: 25, is_daily: 1 },
    { npc_id: 4, npc_name: '炼丹师', npc_icon: '🔥', quest_type: 'daily', title: '矿石采集', description: '收集 3 份矿石', quest_category: 'gather', target_item: '矿石', target_count: 3, requirement_level: 2, reward_silver: 150, reward_exp: 80, reward_item: null, reward_item_count: 0, reward_contribution: 15, is_daily: 1 },
    { npc_id: 4, npc_name: '炼丹师', npc_icon: '🔥', quest_type: 'normal', title: '仙丹妙药', description: '炼制 20 次丹药', quest_category: 'craft', target_item: null, target_count: 20, requirement_level: 8, reward_silver: 1500, reward_exp: 800, reward_item: '仙丹', reward_item_count: 1, reward_contribution: 150, is_daily: 0 },
    { npc_id: 4, npc_name: '炼丹师', npc_icon: '🔥', quest_type: 'normal', title: '寻宝之旅', description: '收集 10 份奇石', quest_category: 'gather', target_item: '奇石', target_count: 10, requirement_level: 6, reward_silver: 700, reward_exp: 350, reward_item: '水晶', reward_item_count: 2, reward_contribution: 70, is_daily: 0 },
    { npc_id: 4, npc_name: '炼丹师', npc_icon: '🔥', quest_type: 'normal', title: '巅峰炼丹', description: '炼制 50 次丹药', quest_category: 'craft', target_item: null, target_count: 50, requirement_level: 10, reward_silver: 3000, reward_exp: 1500, reward_item: '九转还魂丹', reward_item_count: 1, reward_contribution: 300, is_daily: 0 }
  ];
  
  for (const quest of quests) {
    await db.execute(
      `INSERT IGNORE INTO alchemy_quests 
       (npc_id, npc_name, npc_icon, quest_type, title, description, quest_category, target_item, target_count, 
        requirement_level, reward_silver, reward_exp, reward_item, reward_item_count, reward_contribution, is_daily) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [quest.npc_id, quest.npc_name, quest.npc_icon, quest.quest_type, quest.title, quest.description, 
       quest.quest_category, quest.target_item, quest.target_count, quest.requirement_level, 
       quest.reward_silver, quest.reward_exp, quest.reward_item, quest.reward_item_count, 
       quest.reward_contribution, quest.is_daily]
    );
  }
  console.log('炼丹任务初始化完成（19 个任务）');

  // 添加成就数据
  const achievements = [
    // 炼丹成就
    { name: '炼丹 novice', description: '累计炼丹 10 次', icon: '🔥', category: 'alchemy', requirement_type: 'count', requirement_value: 10, points: 10, reward_silver: 200, reward_exp: 100, reward_item: null },
    { name: '炼丹学徒', description: '累计炼丹 50 次', icon: '🔥', category: 'alchemy', requirement_type: 'count', requirement_value: 50, points: 30, reward_silver: 500, reward_exp: 300, reward_item: null },
    { name: '炼丹师', description: '累计炼丹 100 次', icon: '🔥', category: 'alchemy', requirement_type: 'count', requirement_value: 100, points: 50, reward_silver: 1000, reward_exp: 500, reward_item: null },
    { name: '炼丹宗师', description: '累计炼丹 500 次', icon: '🔥', category: 'alchemy', requirement_type: 'count', requirement_value: 500, points: 100, reward_silver: 3000, reward_exp: 1500, reward_item: null },
    { name: '神丹巧匠', description: '炼制出 10 次神品丹药', icon: '✨', category: 'alchemy', requirement_type: 'rare', requirement_value: 10, points: 80, reward_silver: 2000, reward_exp: 1000, reward_item: null },
    
    // 钓鱼成就
    { name: '钓鱼新手', description: '累计钓鱼 10 次', icon: '🎣', category: 'fishing', requirement_type: 'count', requirement_value: 10, points: 10, reward_silver: 200, reward_exp: 100, reward_item: null },
    { name: '钓鱼达人', description: '累计钓鱼 50 次', icon: '🎣', category: 'fishing', requirement_type: 'count', requirement_value: 50, points: 30, reward_silver: 500, reward_exp: 300, reward_item: null },
    { name: '钓鱼大师', description: '累计钓鱼 100 次', icon: '🎣', category: 'fishing', requirement_type: 'count', requirement_value: 100, points: 50, reward_silver: 1000, reward_exp: 500, reward_item: null },
    { name: '渔王', description: '累计钓鱼 500 次', icon: '👑', category: 'fishing', requirement_type: 'count', requirement_value: 500, points: 100, reward_silver: 3000, reward_exp: 1500, reward_item: null },
    { name: '珍稀猎手', description: '钓到 20 次稀有鱼获', icon: '🐟', category: 'fishing', requirement_type: 'rare', requirement_value: 20, points: 80, reward_silver: 2000, reward_exp: 1000, reward_item: null },
    { name: '龙族友人', description: '钓到 5 次传说鱼获', icon: '🐉', category: 'fishing', requirement_type: 'legendary', requirement_value: 5, points: 150, reward_silver: 5000, reward_item: '龙鲤', reward_exp: 2000 },
    
    // 挖矿成就
    { name: '挖矿新手', description: '累计挖矿 10 次', icon: '⛏️', category: 'mining', requirement_type: 'count', requirement_value: 10, points: 10, reward_silver: 200, reward_exp: 100, reward_item: null },
    { name: '挖矿工人', description: '累计挖矿 50 次', icon: '⛏️', category: 'mining', requirement_type: 'count', requirement_value: 50, points: 30, reward_silver: 500, reward_exp: 300, reward_item: null },
    { name: '挖矿专家', description: '累计挖矿 100 次', icon: '⛏️', category: 'mining', requirement_type: 'count', requirement_value: 100, points: 50, reward_silver: 1000, reward_exp: 500, reward_item: null },
    { name: '矿场大亨', description: '累计挖矿 500 次', icon: '💎', category: 'mining', requirement_type: 'count', requirement_value: 500, points: 100, reward_silver: 3000, reward_exp: 1500, reward_item: null },
    { name: '宝石猎人', description: '挖到 20 次宝石', icon: '💎', category: 'mining', requirement_type: 'rare', requirement_value: 20, points: 80, reward_silver: 2000, reward_exp: 1000, reward_item: null },
    
    // 狩猎成就
    { name: '狩猎新手', description: '累计狩猎 10 次', icon: '🏹', category: 'hunting', requirement_type: 'count', requirement_value: 10, points: 10, reward_silver: 200, reward_exp: 100, reward_item: null },
    { name: '猎人', description: '累计狩猎 50 次', icon: '🏹', category: 'hunting', requirement_type: 'count', requirement_value: 50, points: 30, reward_silver: 500, reward_exp: 300, reward_item: null },
    { name: '狩猎专家', description: '累计狩猎 100 次', icon: '🏹', category: 'hunting', requirement_type: 'count', requirement_value: 100, points: 50, reward_silver: 1000, reward_exp: 500, reward_item: null },
    { name: '荒野之王', description: '累计狩猎 500 次', icon: '🦁', category: 'hunting', requirement_type: 'count', requirement_value: 500, points: 100, reward_silver: 3000, reward_exp: 1500, reward_item: null },
    { name: '传说猎手', description: '猎到 10 次神兽', icon: '🐲', category: 'hunting', requirement_type: 'legendary', requirement_value: 10, points: 150, reward_silver: 5000, reward_exp: 2000, reward_item: null },
    
    // 战斗成就
    { name: '初入江湖', description: '拥有 1000 银子的积蓄', icon: '💰', category: 'combat', requirement_type: 'level', requirement_value: 1000, points: 20, reward_silver: 300, reward_exp: 150, reward_item: null },
    { name: '小有名气', description: '拥有 10000 银子的积蓄', icon: '💰', category: 'combat', requirement_type: 'level', requirement_value: 10000, points: 50, reward_silver: 1000, reward_exp: 500, reward_item: null },
    { name: '富甲一方', description: '拥有 100000 银子的积蓄', icon: '💎', category: 'combat', requirement_type: 'level', requirement_value: 100000, points: 100, reward_silver: 5000, reward_exp: 2000, reward_item: null },
    
    // 社交成就
    { name: '江湖新秀', description: '达到等级 5', icon: '⭐', category: 'social', requirement_type: 'level', requirement_value: 5, points: 20, reward_silver: 300, reward_exp: 200, reward_item: null },
    { name: '江湖名宿', description: '达到等级 8', icon: '⭐⭐', category: 'social', requirement_type: 'level', requirement_value: 8, points: 50, reward_silver: 1000, reward_exp: 500, reward_item: null },
    { name: '一代宗师', description: '达到等级 10', icon: '🌟', category: 'social', requirement_type: 'level', requirement_value: 10, points: 100, reward_silver: 3000, reward_exp: 1500, reward_item: null },
    { name: '内力深厚', description: '内力达到 1000 点', icon: '💫', category: 'social', requirement_type: 'level', requirement_value: 1000, points: 50, reward_silver: 1000, reward_exp: 500, reward_item: null },
    { name: '内力无边', description: '内力达到 5000 点', icon: '💫💫', category: 'social', requirement_type: 'level', requirement_value: 5000, points: 100, reward_silver: 3000, reward_exp: 1500, reward_item: null }
  ];
  
  for (const achievement of achievements) {
    await db.execute(
      `INSERT IGNORE INTO achievements 
       (name, description, icon, category, requirement_type, requirement_value, points, reward_silver, reward_exp, reward_item) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [achievement.name, achievement.description, achievement.icon, achievement.category, 
       achievement.requirement_type, achievement.requirement_value, achievement.points,
       achievement.reward_silver, achievement.reward_exp, achievement.reward_item]
    );
  }
  console.log('成就系统初始化完成（28 个成就）');

  // 添加药园植物数据
  const plants = [
    { name: '甘草', seed_name: '甘草种子', harvest_item: '甘草', min_sect_level: 1, growth_time_minutes: 30, growth_stages: 4, harvest_quantity_min: 2, harvest_quantity_max: 4, seed_cost: 50, harvest_value: 100 },
    { name: '鱼腥草', seed_name: '鱼腥草种子', harvest_item: '鱼腥草', min_sect_level: 1, growth_time_minutes: 45, growth_stages: 4, harvest_quantity_min: 2, harvest_quantity_max: 4, seed_cost: 80, harvest_value: 150 },
    { name: '止血草', seed_name: '止血草种子', harvest_item: '止血草', min_sect_level: 1, growth_time_minutes: 60, growth_stages: 4, harvest_quantity_min: 1, harvest_quantity_max: 3, seed_cost: 100, harvest_value: 200 },
    { name: '灵芝', seed_name: '灵芝孢子', harvest_item: '灵芝', min_sect_level: 2, growth_time_minutes: 120, growth_stages: 4, harvest_quantity_min: 1, harvest_quantity_max: 2, seed_cost: 200, harvest_value: 400 },
    { name: '人参', seed_name: '人参种子', harvest_item: '人参', min_sect_level: 3, growth_time_minutes: 180, growth_stages: 4, harvest_quantity_min: 1, harvest_quantity_max: 2, seed_cost: 300, harvest_value: 600 },
    { name: '何首乌', seed_name: '何首乌块茎', harvest_item: '何首乌', min_sect_level: 3, growth_time_minutes: 240, growth_stages: 4, harvest_quantity_min: 1, harvest_quantity_max: 2, seed_cost: 400, harvest_value: 800 },
    { name: '冬虫夏草', seed_name: '冬虫夏草菌包', harvest_item: '冬虫夏草', min_sect_level: 4, growth_time_minutes: 300, growth_stages: 4, harvest_quantity_min: 1, harvest_quantity_max: 2, seed_cost: 500, harvest_value: 1000 },
    { name: '天山雪莲', seed_name: '雪莲种子', harvest_item: '天山雪莲', min_sect_level: 5, growth_time_minutes: 360, growth_stages: 4, harvest_quantity_min: 1, harvest_quantity_max: 2, seed_cost: 800, harvest_value: 1500 }
  ];
  
  for (const plant of plants) {
    await db.execute(
      `INSERT IGNORE INTO garden_plants 
       (name, seed_name, harvest_item, min_sect_level, growth_time_minutes, growth_stages, 
        harvest_quantity_min, harvest_quantity_max, seed_cost, harvest_value) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [plant.name, plant.seed_name, plant.harvest_item, plant.min_sect_level, 
       plant.growth_time_minutes, plant.growth_stages, plant.harvest_quantity_min, 
       plant.harvest_quantity_max, plant.seed_cost, plant.harvest_value]
    );
  }
  console.log('药园植物初始化完成（8 种植物）');

  // 添加炼丹配方数据
  const recipes = [
    { name: '金疮药', description: '治疗外伤的常用药', effect_type: 'neili', effect_value: 10, materials: [{ name: '甘草', qty: 3 }, { name: '鱼腥草', qty: 2 }], success_rate: 100, level: 1 },
    { name: '止血散', description: '快速止血的药物', effect_type: 'tili', effect_value: 15, materials: [{ name: '止血草', qty: 5 }, { name: '甘草', qty: 2 }], success_rate: 95, level: 2 },
    { name: '清心丸', description: '清心明目的丹药', effect_type: 'neili', effect_value: 25, materials: [{ name: '灵芝', qty: 3 }, { name: '甘草', qty: 3 }], success_rate: 90, level: 3 },
    { name: '顺脉丹', description: '疏通经脉的丹药', effect_type: 'wugong', effect_value: 5, materials: [{ name: '灵芝', qty: 5 }, { name: '止血草', qty: 3 }], success_rate: 85, level: 4 },
    { name: '养荣丸', description: '滋养荣卫的补药', effect_type: 'charm', effect_value: 10, materials: [{ name: '人参', qty: 2 }, { name: '灵芝', qty: 3 }], success_rate: 80, level: 5 },
    { name: '小还丹', description: '恢复内力的小还丹', effect_type: 'neili', effect_value: 50, materials: [{ name: '人参', qty: 5 }, { name: '何首乌', qty: 3 }], success_rate: 75, level: 6 },
    { name: '大还丹', description: '恢复内力的极品丹药', effect_type: 'neili', effect_value: 100, materials: [{ name: '冬虫夏草', qty: 3 }, { name: '人参', qty: 5 }], success_rate: 70, level: 7 },
    { name: '九转金丹', description: '九转九转的极品金丹', effect_type: 'all', effect_value: 50, materials: [{ name: '天山雪莲', qty: 2 }, { name: '冬虫夏草', qty: 5 }, { name: '人参', qty: 10 }], success_rate: 60, level: 8 },
    { name: '虎骨酒', description: '强筋健骨的药酒', effect_type: 'attack', effect_value: 15, materials: [{ name: '灵芝', qty: 4 }, { name: '甘草', qty: 5 }], success_rate: 85, level: 5 },
    { name: '龟苓膏', description: '滋阴润燥的补品', effect_type: 'defense', effect_value: 15, materials: [{ name: '何首乌', qty: 4 }, { name: '灵芝', qty: 2 }], success_rate: 80, level: 5 }
  ];
  
  for (const recipe of recipes) {
    await db.execute(
      `INSERT IGNORE INTO alchemy_recipes 
       (name, description, effect_type, effect_value, materials, success_rate, level) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [recipe.name, recipe.description, recipe.effect_type, recipe.effect_value, 
       JSON.stringify(recipe.materials), recipe.success_rate, recipe.level]
    );
  }
  console.log('炼丹配方初始化完成（10 种药方）');

  // 添加钓鱼物品数据
  const fishingItems = [
    // 普通 (50% 概率)
    { item_name: '鲫鱼', item_type: '食材', effect_neili: 0, effect_tili: 0, silver_value: 50, rarities: 'common', description: '常见的淡水鱼，味道鲜美' },
    { item_name: '鲤鱼', item_type: '食材', effect_neili: 0, effect_tili: 0, silver_value: 80, rarities: 'common', description: '普通的鲤鱼，寓意吉祥' },
    { item_name: '草鱼', item_type: '食材', effect_neili: 0, effect_tili: 0, silver_value: 60, rarities: 'common', description: '肉质鲜嫩的草鱼' },
    { item_name: '小鱼干', item_type: '杂物', effect_neili: 0, effect_tili: 5, silver_value: 30, rarities: 'common', description: '晒干的小鱼，可以恢复少量体力' },
    
    // 稀有 (20% 概率)
    { item_name: '鲈鱼', item_type: '食材', effect_neili: 5, effect_tili: 5, silver_value: 150, rarities: 'uncommon', description: '肉质细嫩的鲈鱼，略有滋补' },
    { item_name: '鳊鱼', item_type: '食材', effect_neili: 8, effect_tili: 0, silver_value: 180, rarities: 'uncommon', description: '罕见的鳊鱼，可增强内力' },
    { item_name: '河蚌', item_type: '杂物', effect_neili: 0, effect_tili: 10, silver_value: 100, rarities: 'uncommon', description: '普通河蚌，可能含有珍珠' },
    
    // 珍贵 (15% 概率)
    { item_name: '鳜鱼', item_type: '食材', effect_neili: 15, effect_tili: 10, silver_value: 300, rarities: 'rare', description: '珍贵的鳜鱼，滋补效果显著' },
    { item_name: '甲鱼', item_type: '药材', effect_neili: 20, effect_tili: 20, silver_value: 500, rarities: 'rare', description: '珍贵的甲鱼，大补之物' },
    { item_name: '珍珠', item_type: '杂物', effect_neili: 10, effect_tili: 0, silver_value: 400, rarities: 'rare', description: '从河蚌中发现的珍珠' },
    
    // 史诗 (10% 概率)
    { item_name: '娃娃鱼', item_type: '药材', effect_neili: 50, effect_tili: 30, silver_value: 1000, rarities: 'epic', description: '珍稀的娃娃鱼，珍贵药材' },
    { item_name: '千年鱼', item_type: '药材', effect_neili: 80, effect_tili: 0, silver_value: 1500, rarities: 'epic', description: '生存千年的灵鱼，内力大增' },
    { item_name: '夜明珠', item_type: '杂物', effect_neili: 30, effect_tili: 30, silver_value: 2000, rarities: 'epic', description: '从大鱼腹中得到的夜明珠' },
    
    // 传说 (5% 概率)
    { item_name: '蛟龙筋', item_type: '药材', effect_neili: 200, effect_tili: 100, silver_value: 5000, rarities: 'legendary', description: '传说中蛟龙的筋，大补神物' },
    { item_name: '龙鲤', item_type: '药材', effect_neili: 150, effect_tili: 150, silver_value: 8000, rarities: 'legendary', description: '龙之血脉的鲤鱼，可遇不可求' },
    { item_name: '鲛人泪', item_type: '杂物', effect_neili: 100, effect_tili: 100, silver_value: 10000, rarities: 'legendary', description: '鲛人落泪化成的珍宝' }
  ];
  
  for (const item of fishingItems) {
    await db.execute(
      `INSERT IGNORE INTO fishing_items 
       (item_name, item_type, effect_neili, effect_tili, silver_value, rarities, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [item.item_name, item.item_type, item.effect_neili, item.effect_tili, 
       item.silver_value, item.rarities, item.description]
    );
  }
  console.log('钓鱼物品初始化完成（16 种鱼获）');

  // 添加商店物品数据
  const shopItems = [
    // 兵器类
    { name: '木剑', type: 'weapon', attack: 10, defense: 0, neili_bonus: 0, tili_bonus: 0, price: 100, image_file: '1.gif', description: '新手木剑，攻击力 +10' },
    { name: '铁剑', type: 'weapon', attack: 20, defense: 0, neili_bonus: 0, tili_bonus: 0, price: 200, image_file: '2.gif', description: '精铁打造的剑，攻击力 +20' },
    { name: '钢刀', type: 'weapon', attack: 30, defense: 0, neili_bonus: 0, tili_bonus: 0, price: 300, image_file: '3.gif', description: '精钢打造的刀，攻击力 +30' },
    { name: '宝剑', type: 'weapon', attack: 50, defense: 0, neili_bonus: 5, tili_bonus: 0, price: 550, image_file: '4.gif', description: '削铁如泥的宝剑，攻击力 +50，内力 +5' },
    { name: '倚天剑', type: 'weapon', attack: 80, defense: 0, neili_bonus: 10, tili_bonus: 0, price: 900, image_file: '5.gif', description: '武林至宝倚天剑，攻击力 +80，内力 +10' },
    { name: '屠龙刀', type: 'weapon', attack: 100, defense: 0, neili_bonus: 15, tili_bonus: 0, price: 1150, image_file: '6.gif', description: '武林至宝屠龙刀，攻击力 +100，内力 +15' },
    { name: '打狗棒', type: 'weapon', attack: 60, defense: 10, neili_bonus: 5, tili_bonus: 0, price: 750, image_file: '7.gif', description: '丐帮镇帮之宝，攻击力 +60，防御 +10，内力 +5' },
    { name: '判官笔', type: 'weapon', attack: 45, defense: 5, neili_bonus: 10, tili_bonus: 0, price: 600, image_file: '8.gif', description: '判官笔，攻击力 +45，防御 +5，内力 +10' },
    
    // 防具类
    { name: '布衣', type: 'armor', attack: 0, defense: 10, neili_bonus: 0, tili_bonus: 0, price: 100, image_file: '10.gif', description: '普通布衣，防御力 +10' },
    { name: '皮甲', type: 'armor', attack: 0, defense: 20, neili_bonus: 0, tili_bonus: 0, price: 200, image_file: '11.gif', description: '兽皮制成的甲，防御力 +20' },
    { name: '铁甲', type: 'armor', attack: 0, defense: 30, neili_bonus: 0, tili_bonus: 0, price: 300, image_file: '12.gif', description: '精铁打造的甲，防御力 +30' },
    { name: '金丝甲', type: 'armor', attack: 0, defense: 50, neili_bonus: 5, tili_bonus: 0, price: 550, image_file: '13.gif', description: '金丝编织的软甲，防御力 +50，内力 +5' },
    { name: '软猬甲', type: 'armor', attack: 10, defense: 60, neili_bonus: 10, tili_bonus: 0, price: 800, image_file: '14.gif', description: '黄蓉所穿软猬甲，防御力 +60，攻击力 +10，内力 +10' },
    { name: '乌蚕衣', type: 'armor', attack: 0, defense: 80, neili_bonus: 15, tili_bonus: 0, price: 950, image_file: '15.gif', description: '千年乌蚕丝制成，防御力 +80，内力 +15' },
    
    // 药品类
    { name: '金创药', type: 'medicine', attack: 0, defense: 0, neili_bonus: 20, tili_bonus: 20, price: 50, image_file: '20.gif', description: '治疗外伤，内力 +20，体力 +20' },
    { name: '小还丹', type: 'medicine', attack: 0, defense: 0, neili_bonus: 50, tili_bonus: 30, price: 100, image_file: '21.gif', description: '少林灵药，内力 +50，体力 +30' },
    { name: '大还丹', type: 'medicine', attack: 0, defense: 0, neili_bonus: 100, tili_bonus: 50, price: 200, image_file: '22.gif', description: '极品灵药，内力 +100，体力 +50' },
    { name: '九转金丹', type: 'medicine', attack: 0, defense: 0, neili_bonus: 200, tili_bonus: 100, price: 500, image_file: '23.gif', description: '道家至宝，内力 +200，体力 +100' },
    { name: '人参', type: 'medicine', attack: 0, defense: 0, neili_bonus: 30, tili_bonus: 30, price: 80, image_file: '24.gif', description: '百年人参，内力 +30，体力 +30' },
    { name: '灵芝', type: 'medicine', attack: 0, defense: 0, neili_bonus: 40, tili_bonus: 40, price: 120, image_file: '25.gif', description: '千年灵芝，内力 +40，体力 +40' },
    
    // 毒药类
    { name: '断肠散', type: 'poison', attack: 0, defense: 0, neili_bonus: -30, tili_bonus: -30, price: 150, image_file: '30.gif', description: '剧毒之物，对敌使用可使其内力 -30，体力 -30' },
    { name: '化功散', type: 'poison', attack: 0, defense: 0, neili_bonus: -50, tili_bonus: -50, price: 250, image_file: '31.gif', description: '化功大法所需，对敌使用可使其内力 -50，体力 -50' },
    { name: '三笑散', type: 'poison', attack: 0, defense: 0, neili_bonus: -80, tili_bonus: -80, price: 400, image_file: '32.gif', description: '含笑半步颠，对敌使用可使其内力 -80，体力 -80' },
    { name: '十香软筋散', type: 'poison', attack: 0, defense: 0, neili_bonus: -100, tili_bonus: -100, price: 500, image_file: '33.gif', description: '西域奇毒，对敌使用可使其内力 -100，体力 -100' }
  ];
  
  for (const item of shopItems) {
    await db.execute(
      `INSERT IGNORE INTO shop_items 
       (name, type, attack, defense, neili_bonus, tili_bonus, price, image_file, description, stock_quantity, sort_no) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.name, item.type, item.attack, item.defense, item.neili_bonus, item.tili_bonus, 
       item.price, item.image_file, item.description, 999, shopItems.indexOf(item)]
    );
  }
  console.log('商店物品初始化完成（30 种商品）');

  console.log('种子数据初始化完成!');
}

// 支持直接运行或被 require
if (require.main === module) {
  seed().catch(err => {
    console.error('种子数据初始化失败:', err);
    process.exit(1);
  });
}

module.exports = { seed };
