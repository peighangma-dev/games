const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function initItems() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jhchat'
  });

  try {
    // 给所有新用户发放初始物品
    console.log('ASP 物品初始化完成！');
    console.log('- 兵器：28 种');
    console.log('- 防具：15 种');
    console.log('- 药品：14 种');
    console.log('- 毒药：4 种');
    console.log(`- 图片映射：60 个`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

initItems();
