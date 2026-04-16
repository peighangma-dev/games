const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const requiredEnvVars = [
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'JWT_EXPIRES_IN'
];

function validateEnv() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('❌ 缺少必要的环境变量:');
    missing.forEach(envVar => console.error(`   - ${envVar}`));
    console.error('\n请复制 .env.example 到 .env 并填写所有必要变量');
    process.exit(1);
  }
  
  // 验证 JWT 密钥强度
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    console.warn('⚠️  警告：JWT_SECRET 长度不足 32 字符，建议使用更强的密钥');
    console.warn('   生成随机密钥：openssl rand -hex 32');
  }
  
  // 验证数据库密码
  const dbPassword = process.env.DB_PASSWORD;
  if (dbPassword && dbPassword.length < 8) {
    console.warn('⚠️  警告：DB_PASSWORD 长度不足 8 字符，建议使用更强的密码');
  }
  
  // 生产环境检查
  if (process.env.NODE_ENV === 'production') {
    if (jwtSecret === 'change_this_to_a_random_secret_in_production' || 
        jwtSecret === 'your_secret_key') {
      console.error('❌ 错误：生产环境不能使用默认 JWT_SECRET');
      process.exit(1);
    }
    
    if (dbPassword === 'your_password_here' || dbPassword === 'password') {
      console.error('❌ 错误：生产环境不能使用默认数据库密码');
      process.exit(1);
    }
  }
  
  console.log('✅ 环境变量验证通过');
  console.log(`   运行环境：${process.env.NODE_ENV || 'development'}`);
  console.log(`   服务端口：${process.env.PORT || 3001}`);
  console.log(`   数据库：${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
}

module.exports = validateEnv;
