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
      'INSERT INTO chat_rooms (name, min_grade, max_grade, fight_enabled, sort_order) VALUES (?, ?, ?, ?, ?)',
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
      'INSERT INTO sects (name, leader, description, rules, fit_gender) VALUES (?, ?, ?, ?, ?)',
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
      'INSERT INTO chat_actions (action_type, name, template) VALUES (?, ?, ?)',
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
      'INSERT INTO card_templates (name, description, price, card_type) VALUES (?, ?, ?, ?)',
      [name, desc, price, type]
    );
  }
  console.log('卡片初始化完成');

  console.log('种子数据初始化完成!');
}

seed().catch(err => {
  console.error('种子数据初始化失败:', err);
  process.exit(1);
});
