const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const db = require('../config/db');

async function fixMissingData() {
  console.log('开始补充缺失的数据...');

  // 1. 添加宠物初始规则
  try {
    await db.execute(`
      INSERT INTO pet_init_rules (init_clean, init_happy, init_health, init_milk, init_life, init_hunger)
      VALUES (50, 50, 80, 0, 100, 0)
    `);
    console.log('✅ 宠物初始规则添加完成');
  } catch (e) {
    console.log('⚠️ 宠物初始规则可能已存在:', e.message);
  }

  // 2. 添加星河宠物基础数据（如果不存在）
  try {
    const [existing] = await db.execute("SELECT id FROM star_pets WHERE name = '测试星河'");
    if (existing.length === 0) {
      await db.execute(`
        INSERT INTO star_pets (name, owner, hp, mp, attack, defense, max_hp, max_mp, max_attack, max_defense, level, exp, special_skill, status)
        VALUES ('测试星河', '站长', 500, 100, 10, 10, 500, 100, 100, 100, 1, 0, '无', '正常')
      `);
      console.log('✅ 测试星河宠物添加完成');
    }
  } catch (e) {
    console.log('⚠️ 星河宠物添加失败:', e.message);
  }

  // 3. 添加更多钓鱼物品（如果总数少于 32）
  try {
    const [count] = await db.execute("SELECT COUNT(*) as cnt FROM fishing_items");
    if (count[0].cnt < 32) {
      console.log(`ℹ️ 当前钓鱼物品数量：${count[0].cnt}`);
    } else {
      console.log(`✅ 钓鱼物品数量正常：${count[0].cnt}种`);
    }
  } catch (e) {
    console.log('⚠️ 检查钓鱼物品失败:', e.message);
  }

  // 4. 添加药园植物（如果少于 8 种）
  try {
    const [count] = await db.execute("SELECT COUNT(*) as cnt FROM garden_plants");
    if (count[0].cnt < 8) {
      console.log(`⚠️ 药园植物不足，当前：${count[0].cnt}种，需要 8 种`);
      console.log('📝 请重新执行：node src/scripts/seed.js');
    } else {
      console.log(`✅ 药园植物数量正常：${count[0].cnt}种`);
    }
  } catch (e) {
    console.log('⚠️ 检查药园植物失败:', e.message);
  }

  // 5. 检查成就数据
  try {
    const [count] = await db.execute("SELECT COUNT(*) as cnt FROM achievements");
    console.log(`✅ 成就数量：${count[0]}个`);
  } catch (e) {
    console.log('⚠️ 检查成就失败:', e.message);
  }

  // 6. 检查帮派药园地块（应该初始化 8 大门派各 20 个地块）
  try {
    const [sects] = await db.execute("SELECT name FROM sects");
    console.log(`ℹ️ 当前门派数量：${sects.length}个`);
    
    const [gardenCount] = await db.execute("SELECT COUNT(*) as cnt FROM sect_gardens");
    if (gardenCount[0].cnt < sects.length) {
      console.log(`⚠️ 药园数量不足，当前：${gardenCount[0].cnt}，应该至少${sects.length}个`);
      
      // 为每个门派创建药园
      for (const sect of sects) {
        const [existing] = await db.execute("SELECT id FROM sect_gardens WHERE sect_name = ?", [sect.name]);
        if (existing.length === 0) {
          await db.execute(
            "INSERT INTO sect_gardens (sect_id, sect_name, level, capacity, contribution_total) SELECT id, ?, 1, 20, 0 FROM sects WHERE name = ?",
            [sect.name, sect.name]
          );
          const gardenResult = await db.execute("SELECT LAST_INSERT_ID() as id");
          const gardenId = gardenResult[0][0].id;
          
          // 初始化 20 个地块
          for (let i = 1; i <= 20; i++) {
            await db.execute(
              "INSERT INTO garden_plots (garden_id, plot_number) VALUES (?, ?)",
              [gardenId, i]
            );
          }
          console.log(`  ✅ 创建${sect.name}药园及 20 个地块`);
        }
      }
    } else {
      console.log(`✅ 药园数量正常：${gardenCount[0].cnt}个`);
    }
  } catch (e) {
    console.log('⚠️ 检查药园失败:', e.message);
  }

  console.log('\n✅ 数据补充完成！');
}

if (require.main === module) {
  fixMissingData().catch(err => {
    console.error('执行失败:', err);
    process.exit(1);
  });
}

module.exports = fixMissingData;
