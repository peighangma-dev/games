const mysql = require('mysql2/promise');

// 数据库连接池配置
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'jhchat',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'jhchat',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 100,
  acquireTimeout: 60000,
  timeout: 60000,
  idleTimeout: 600000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// 创建连接池
const pool = mysql.createPool(poolConfig);

// 监听连接池事件
pool.on('connection', (connection) => {
  console.log('[DB] 新连接创建');
});

pool.on('acquire', (connection) => {
  console.debug('[DB] 连接获取');
});

pool.on('release', (connection) => {
  console.debug('[DB] 连接释放');
});

pool.on('error', (err) => {
  console.error('[DB] 连接池错误:', err);
});

// 执行查询的辅助函数
const execute = async (query, params = []) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(query, params);
    return [rows, connection];
  } finally {
    if (connection) connection.release();
  }
};

// 事务处理
const transaction = async (callback) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
};

// 关闭连接池
const close = async () => {
  await pool.end();
  console.log('[DB] 连接池已关闭');
};

// 获取连接池状态
const getStatus = () => ({
  connectionLimit: poolConfig.connectionLimit,
  queueLimit: poolConfig.queueLimit
});

module.exports = {
  execute,
  transaction,
  close,
  getStatus,
  pool
};
