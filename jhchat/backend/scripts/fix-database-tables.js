#!/usr/bin/env node
/**
 * 数据库表结构修复脚本
 * 自动创建 admin_action_logs 表和修复 user_ip_logs 表
 * 
 * 使用方法：
 * 1. 配置 .env 文件中的数据库密码
 * 2. 运行：node scripts/fix-database-tables.js
 */

// 首先加载环境变量
require('dotenv').config();

const mysql = require('mysql2/promise');

async function main() {
  console.log('🔧 开始修复数据库表结构...\n');
  
  // 创建数据库连接
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
    // 测试连接
    console.log('📡 正在连接数据库...');
    await pool.execute('SELECT 1');
    console.log('✅ 数据库连接成功\n');

    // 1. 创建 admin_action_logs 表
    console.log('📋 检查 admin_action_logs 表...');
    const [tables] = await pool.execute('SHOW TABLES LIKE "admin_action_logs"');
    
    if (tables.length > 0) {
      console.log('✅ admin_action_logs 表已存在\n');
    } else {
      console.log('⚙️  正在创建 admin_action_logs 表...');
      const createAdminActionLogsSQL = `
        CREATE TABLE IF NOT EXISTS \`admin_action_logs\` (
          \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
          \`user_id\` int(10) unsigned DEFAULT NULL,
          \`username\` varchar(50) NOT NULL,
          \`action_type\` varchar(50) NOT NULL,
          \`action\` varchar(200) NOT NULL,
          \`ip\` varchar(45) DEFAULT NULL,
          \`user_agent\` varchar(200) DEFAULT NULL,
          \`request_data\` text,
          \`response_status\` enum('success','failed') NOT NULL DEFAULT 'success',
          \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`idx_user\` (\`username\`),
          KEY \`idx_action_type\` (\`action_type\`),
          KEY \`idx_created_at\` (\`created_at\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;
      await pool.execute(createAdminActionLogsSQL);
      console.log('✅ admin_action_logs 表创建成功\n');
    }

    // 2. 检查和修复 user_ip_logs 表
    console.log('📋 检查 user_ip_logs 表...');
    const [userIpLogsTables] = await pool.execute('SHOW TABLES LIKE "user_ip_logs"');
    
    if (userIpLogsTables.length === 0) {
      console.log('❌ user_ip_logs 表不存在！');
      console.log('   请先执行完整的建表 SQL（查看 /workspace/jhchat/数据库.sql）\n');
    } else {
      console.log('✅ user_ip_logs 表存在，检查字段...');
      
      // 检查字段
      const [columns] = await pool.execute('SHOW COLUMNS FROM user_ip_logs');
      const columnNames = columns.map(c => c.Field);
      
      const requiredColumns = ['username', 'reason', 'country', 'region', 'city'];
      const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
      
      if (missingColumns.length === 0) {
        console.log('✅ user_ip_logs 表字段完整\n');
      } else {
        console.log(`⚙️  添加缺失字段：${missingColumns.join(', ')}...`);
        
        // 添加缺失的字段
        for (const column of missingColumns) {
          let alterSQL = '';
          switch(column) {
            case 'username':
              alterSQL = 'ALTER TABLE user_ip_logs ADD COLUMN username varchar(50) DEFAULT NULL AFTER user_id';
              break;
            case 'reason':
              alterSQL = 'ALTER TABLE user_ip_logs ADD COLUMN reason varchar(200) DEFAULT NULL COMMENT "失败原因" AFTER login_status';
              break;
            case 'country':
              alterSQL = 'ALTER TABLE user_ip_logs ADD COLUMN country varchar(50) DEFAULT NULL COMMENT "国家" AFTER login_status';
              break;
            case 'region':
              alterSQL = 'ALTER TABLE user_ip_logs ADD COLUMN region varchar(50) DEFAULT NULL COMMENT "省份" AFTER country';
              break;
            case 'city':
              alterSQL = 'ALTER TABLE user_ip_logs ADD COLUMN city varchar(50) DEFAULT NULL COMMENT "城市" AFTER region';
              break;
          }
          if (alterSQL) {
            await pool.execute(alterSQL);
            console.log(`   ✅ 添加字段 ${column} 成功`);
          }
        }
        console.log('');
      }
      
      // 检查 user_id 是否可空
      const userIdColumn = columns.find(c => c.Field === 'user_id');
      if (userIdColumn && userIdColumn.Null === 'NO') {
        console.log('⚙️  修改 user_id 字段为可空...');
        await pool.execute('ALTER TABLE user_ip_logs MODIFY COLUMN user_id int(10) unsigned NULL');
        console.log('✅ user_id 字段已修改为可空\n');
      } else {
        console.log('✅ user_id 字段已为可空\n');
      }
    }

    // 3. 添加索引
    console.log('📊 优化索引...');
    try {
      await pool.execute('ALTER TABLE user_ip_logs ADD INDEX IF NOT EXISTS idx_username (username)');
      console.log('✅ 添加 idx_username 索引');
      
      await pool.execute('ALTER TABLE user_ip_logs ADD INDEX IF NOT EXISTS idx_login_status (login_status)');
      console.log('✅ 添加 idx_login_status 索引');
    } catch (e) {
      console.log('ℹ️  索引可能已存在，跳过');
    }
    console.log('');

    console.log('=================================');
    console.log('🎉 数据库修复完成！');
    console.log('=================================\n');
    
    console.log('验证方法：');
    console.log('1. 访问：https://5173-9a706b4ab80369c3.monkeycode-ai.online/admin/logs');
    console.log('2. 访问：https://5173-9a706b4ab80369c3.monkeycode-ai.online/admin/login-logs');
    console.log('3. 应该能看到空列表而不是 500 错误');

  } catch (error) {
    console.error('\n=================================');
    console.error('❌ 数据库修复失败！');
    console.error('=================================');
    console.error('错误信息:', error.message);
    console.error('\n请检查：');
    console.error('1. .env 文件中的数据库配置是否正确');
    console.error('2. MySQL 服务是否正常运行');
    console.error('3. 数据库密码是否正确');
    console.error('');
    console.error('手动执行 SQL 语句：');
    console.error('mysql -u root -p jhchat < migrations/create_admin_action_logs.sql');
    console.error('mysql -u root -p jhchat < migrations/fix_user_ip_logs_table.sql\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
