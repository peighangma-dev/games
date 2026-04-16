const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// 验证环境变量
const validateEnv = require('./middleware/validate-env');
validateEnv();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// 初始化 logger
const { logger } = require('./utils/logger');
logger.info('服务器启动中...');

// 速率限制配置
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 每个 IP 最多 100 请求
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: '请求过于频繁，请稍后重试'
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: '请求过于频繁，请稍后重试'
    });
  }
});

// 登录接口更严格的限制
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 10, // 每个 IP 最多 10 次登录尝试
  message: {
    success: false,
    message: '登录尝试次数过多，请 1 小时后再试'
  },
  skipSuccessfulRequests: true // 只统计失败的请求
});

// 应用速率限制
app.use('/api/', limiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 小时
  max: 5, // 每个 IP 每天最多 5 次注册
  message: {
    success: false,
    message: '注册次数过多，请明天再试'
  }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/assets', express.static(path.join(__dirname, '..', '..', 'frontend', 'public', 'assets')));

app.set('io', io);

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const messageRoutes = require('./routes/message');
const sectRoutes = require('./routes/sect');
const marriageRoutes = require('./routes/marriage');
const skillRoutes = require('./routes/skill');
const itemRoutes = require('./routes/item');
const shopRoutes = require('./routes/shop');
const gameRoutes = require('./routes/game');
const petRoutes = require('./routes/pet');
const alchemyRoutes = require('./routes/alchemy');
const miscRoutes = require('./routes/misc');
const chatRoutes = require('./routes/chat');
const commandRoutes = require('./routes/command');
const adminRoutes = require('./routes/admin');
const fortuneRoutes = require('./routes/fortune');
const fishingRoutes = require('./routes/fishing');
const encounterRoutes = require('./routes/encounter');
const randomEventRoutes = require('./routes/randomEvent');
const healthRoutes = require('./routes/health');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/sects', sectRoutes);
app.use('/api/marriage', marriageRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/alchemy', alchemyRoutes);
app.use('/api/misc', miscRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/commands', commandRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/fortune', fortuneRoutes);
app.use('/api/fishing', fishingRoutes);
app.use('/api/encounter', encounterRoutes);
app.use('/api/random-events', randomEventRoutes);
app.use('/api/health', healthRoutes);

// 请求日志中间件
app.use((req, res, next) => {
  const { logger } = require('./utils/logger');
  const { recordRequest } = require('./utils/monitor');
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url, ip } = req;
    const { statusCode } = res;
    
    logger.info(`${method} ${url}`, {
      status: statusCode,
      duration: `${duration}ms`,
      ip: ip || req.socket.remoteAddress
    });
    
    recordRequest(statusCode, duration);
  });
  
  next();
});

// 监控系统端点
const { setupMetricsRoutes } = require('./utils/monitor');
setupMetricsRoutes(app);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `未找到资源：${req.method} ${req.path}`
  });
});

const { startRandomEventScheduler } = require('./socket');

require('./socket')(io);

// 启动随机事件定时器
startRandomEventScheduler(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`服务器运行在端口 ${PORT}`);
  logger.info('服务启动完成', {
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

module.exports = { app, server, io };
