const rateLimit = require('express-rate-limit');

// 登录限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 10, // 最多 10 次尝试
  message: {
    success: false,
    message: '尝试次数过多，请 15 分钟后再试',
    code: 'TOO_MANY_ATTEMPTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip
});

// 注册限制
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 5, // 最多 5 次注册
  message: {
    success: false,
    message: '注册次数过多，请稍后再试',
    code: 'TOO_MANY_REQUESTS'
  }
});

// 聊天消息限制
const chatLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 秒
  max: 20, // 最多 20 条消息
  message: {
    success: false,
    message: '发言太频繁了，请稍后再试',
    code: 'CHAT_LIMIT_EXCEEDED'
  }
});

// 通用 API 限制
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: '请求过于频繁',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

module.exports = {
  loginLimiter,
  registerLimiter,
  chatLimiter,
  apiLimiter
};
