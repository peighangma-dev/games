#!/usr/bin/env node
/**
 * 自动创建 admin_action_logs 表
 * 使用方法：node scripts/create-admin-action-logs-table.js
 */

const mysql = require('mysql2/promise');

async function main() {
  console.log('正在创建 admin_action_logs 表...');
  
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jhchat',
    waitForConnections: true,
    connectionLimit: 5,
    charset: 'utf8mb4'
  });

  try {
    // 检查表是否存在
    const [tables] = await pool.execute('SHOW TABLES LIKE "admin_action_logs"');
    
    if (tables.length > 0) {
      console.log('✓ admin_action_logs 表已存在');
      const [count] = await pool.execute('SELECT COUNT(*) as c FROM admin_action_logs');
      console.log(`  当前记录数：${count[0].c}`);
      return;
    }

    // 创建表
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS \`admin_action_logs\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`user_id\` int(10) unsigned DEFAULT NULL,
      \`username\` varchar(50) NOT NULL,
      \`action_type\` varchar(50) NOT NULL COMMENT '操作类型，如 create_user, delete_item',
      \`action\` varchar(200) NOT NULL COMMENT '操作描述，如 POST /admin/users',
      \`ip\` varchar(45) DEFAULT NULL,
      \`user_agent\` varchar(200) DEFAULT NULL,
      \`request_data\` text COMMENT '请求参数 JSON',
      \`response_status\` enum('success','failed') NOT NULL DEFAULT 'success',
      \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_user\` (\`username\`),
      KEY \`idx_action_type\` (\`action_type\`),
      KEY \`idx_created_at\` (\`created_at\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员操作日志'
    `;

    await pool.execute(createTableSQL);
    console.log('✓ admin_action_logs 表创建成功');

  } catch (error) {
    console.error('✗ 创建表失败:', error.message);
    console.error('请检查数据库连接配置是否正确');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
