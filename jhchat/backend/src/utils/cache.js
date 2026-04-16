const Redis = require('ioredis');
const { logger } = require('./logger');

// Redis 配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
  db: parseInt(process.env.REDIS_DB) || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// 创建 Redis 客户端
let redisClient = null;

function initRedis() {
  if (redisClient) return redisClient;
  
  redisClient = new Redis(redisConfig);
  
  redisClient.on('connect', () => {
    logger.info('Redis 连接成功', {
      host: redisConfig.host,
      port: redisConfig.port
    });
  });
  
  redisClient.on('error', (err) => {
    logger.error('Redis 错误', { error: err.message });
  });
  
  redisClient.on('close', () => {
    logger.warn('Redis 连接关闭');
  });
  
  return redisClient;
}

// 缓存工具类
class CacheHelper {
  constructor(client) {
    this.client = client;
    this.defaultTTL = 3600; // 默认 1 小时
  }
  
  // 设置缓存
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttl, serialized);
      return true;
    } catch (err) {
      logger.error('Cache set error', { key, error: err.message });
      return false;
    }
  }
  
  // 获取缓存
  async get(key) {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error('Cache get error', { key, error: err.message });
      return null;
    }
  }
  
  // 删除缓存
  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (err) {
      logger.error('Cache del error', { key, error: err.message });
      return false;
    }
  }
  
  // 检查键是否存在
  async exists(key) {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (err) {
      logger.error('Cache exists error', { key, error: err.message });
      return false;
    }
  }
  
  // 延长过期时间
  async expire(key, ttl) {
    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (err) {
      logger.error('Cache expire error', { key, error: err.message });
      return false;
    }
  }
  
  // 获取并刷新过期时间
  async getAndRefresh(key, ttl = this.defaultTTL) {
    try {
      const data = await this.get(key);
      if (data !== null) {
        await this.expire(key, ttl);
      }
      return data;
    } catch (err) {
      logger.error('Cache getAndRefresh error', { key, error: err.message });
      return null;
    }
  }
  
  // 缓存穿透保护：设置空值
  async setNull(key, ttl = 300) {
    return this.set(key, { __null: true }, ttl);
  }
  
  // 检查是否是空值标记
  isNull(value) {
    return value && value.__null === true;
  }
}

// 创建缓存实例
const cache = new CacheHelper(initRedis());

// 常用缓存键
const CacheKeys = {
  userInfo: (userId) => `user:info:${userId}`,
  onlineUsers: () => 'online:users',
  roomOnline: (roomId) => `online:room:${roomId}`,
  chatMessages: (roomId) => `chat:messages:${roomId}`,
  sectInfo: (sectName) => `sect:info:${sectName}`,
  itemInfo: (itemId) => `item:info:${itemId}`,
  userItems: (username) => `user:items:${username}`,
  systemConfig: () => 'system:config',
  chatActions: () => 'chat:actions',
  chatCommands: () => 'chat:commands',
  loginAttempts: (ip) => `login:attempts:${ip}`,
  userInventory: (userId) => `user:inventory:${userId}`
};

module.exports = {
  redisClient: initRedis(),
  cache,
  CacheKeys
};
