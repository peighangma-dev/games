const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDb() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'jhchat'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${process.env.DB_NAME || 'jhchat'}\``);

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await connection.query(schema);

  console.log('数据库初始化完成');
  await connection.end();
}

initDb().catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
