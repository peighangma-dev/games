#!/usr/bin/env node

/**
 * 游戏系统增强迁移脚本
 * 执行 20260430_enhance_game_system.sql
 */

const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

const config = require('../config/db');

async function migrate() {
  let connection;
  
  try {
    console.log('🎮 开始执行游戏系统增强迁移...');
    
    // 连接数据库
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      multipleStatements: true // 允许执行多条 SQL
    });
    
    console.log('✅ 数据库连接成功');
    
    // 读取迁移文件
    const migrationPath = path.join(__dirname, '../../migrations/20260430_enhance_game_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 读取迁移文件：20260430_enhance_game_system.sql');
    
    // 执行迁移
    await connection.execute(sql);
    
    console.log('✅ 迁移执行成功！');
    console.log('');
    console.log('本次迁移内容：');
    console.log('  1. 为 blackjack_games 添加 streak 字段（连胜记录）');
    console.log('  2. 为 game_statistics 添加 blackjack_streak 和 best_blackjack_streak 字段');
    console.log('  3. 修改 achievements.icon 字符集为 utf8mb4（支持 emoji）');
    console.log('  4. 为 game_bonuses 添加索引优化查询性能');
    console.log('  5. 插入 5 个新成就配置');
    console.log('');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate();
