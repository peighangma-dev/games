const Joi = require('joi');

/**
 * 输入验证中间件
 * @param {Object} schema - Joi 验证模式
 * @param {string} source - 数据来源 ('body' | 'query' | 'params')
 */
const validateInput = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const messages = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `参数验证失败：${messages}`,
        code: 'VALIDATION_ERROR'
      });
    }

    // 将清理后的数据放回请求对象
    req[source] = value;
    next();
  };
};

// 常用验证模式
const schemas = {
  // 登录验证
  login: Joi.object({
    username: Joi.string().min(2).max(20).required(),
    password: Joi.string().min(6).max(50).required()
  }),

  // 注册验证
  register: Joi.object({
    username: Joi.string().min(2).max(20).required(),
    password: Joi.string().min(6).max(50).required(),
    gender: Joi.string().valid('male', 'female').required(),
    email: Joi.string().email().optional()
  }),

  // 聊天消息验证
  message: Joi.object({
    content: Joi.string().min(1).max(500).required(),
    type: Joi.string().valid('text', 'image', 'system').optional()
  }),

  // 任务完成验证
  questComplete: Joi.object({
    questId: Joi.number().integer().min(1).required()
  }),

  // 物品购买验证
  purchase: Joi.object({
    itemId: Joi.number().integer().min(1).required(),
    quantity: Joi.number().integer().min(1).max(999).default(1)
  })
};

module.exports = validateInput;
module.exports.schemas = schemas;
