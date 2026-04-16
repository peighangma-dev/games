const winston = require('winston');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file');

// 日志目录
const logDir = process.env.LOG_DIR || path.join(__dirname, '..', '..', 'logs');

// 定义日志级别
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// 定义日志颜色
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue'
};

// 添加颜色
winston.addColors(logColors);

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}] ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

// 创建 logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: logFormat,
  defaultMeta: { service: 'jhchat-backend' },
  transports: [
    // 错误日志 - 每日轮转，保留 14 天
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // 所有日志 - 每日轮转，保留 7 天
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true
    })
  ]
});

// 开发环境下输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// 创建日志流中间件（用于 express-morgan）
const stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// 封装日志方法
const log = {
  error: (message, meta) => logger.error(message, meta),
  warn: (message, meta) => logger.warn(message, meta),
  info: (message, meta) => logger.info(message, meta),
  debug: (message, meta) => logger.debug(message, meta),
  chat: (msg) => {
    logger.info('聊天消息', {
      sender: msg.sender,
      receiver: msg.receiver,
      isPrivate: msg.isPrivate,
      roomId: msg.roomId
    });
  },
  command: (cmd, user, target) => {
    logger.info('命令执行', {
      command: cmd,
      user: user,
      target: target
    });
  },
  auth: (action, username, success) => {
    logger.info('认证事件', {
      action,
      username,
      success
    });
  }
};

module.exports = {
  logger,
  stream,
  log
};
