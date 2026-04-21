const mysql = require('mysql2/promise');

async function addUniqueConstraint() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'jhchat_root_pass',
    database: process.env.DB_NAME || 'jhchat'
  });
  
  try {
    // 先检查是否已存在唯一约束
    const [constraints] = await connection.query(
      `SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE 
        FROM information_schema.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'card_templates' 
        AND CONSTRAINT_NAME = 'unique_card_name'`,
      [process.env.DB_NAME || 'jhchat']
    );
    
    if (constraints.length > 0) {
      console.log('✓ 唯一约束已存在，跳过添加');
      return;
    }
    
    // 先删除重复数据（如果有）
    const [duplicateResult] = await connection.query(`
      DELETE t1 FROM card_templates t1
      INNER JOIN card_templates t2 
      WHERE t1.id > t2.id AND t1.name = t2.name
    `);
    
    console.log(`✓ 清理了 ${duplicateResult.affectedRows} 条重复记录`);
    
    // 添加唯一约束
    await connection.query(`
      ALTER TABLE card_templates 
      ADD UNIQUE KEY unique_card_name (name)
    `);
    console.log('✓ 成功添加 UNIQUE 约束到 card_templates.name 字段');
    
    // 验证约束
    const [result] = await connection.query(`
      SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'card_templates' 
      AND CONSTRAINT_NAME = 'unique_card_name'
    `, [process.env.DB_NAME || 'jhchat']);
    
    console.log('✓ 约束验证结果:', result);
    
    // 显示当前卡片数量
    const [count] = await connection.query(`
      SELECT COUNT(*) as total FROM card_templates
    `);
    console.log(`✓ 当前卡片模板总数：${count[0].total}`);
    
  } catch (error) {
    console.error('❌ 添加约束失败:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

addUniqueConstraint();
