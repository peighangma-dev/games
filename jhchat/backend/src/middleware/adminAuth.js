const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { logger } = require('../utils/logger');

/**
 * 管理员权限级别定义
 * Grade 1-5: 普通用户
 * Grade 6-7: 初级管理员 (护法) - 基础用户管理、聊天室管理
 * Grade 8-9: 高级管理员 (长老) - 物品管理、活动管理、IP 管理
 * Grade 10: 超级管理员 (掌门) - 全部权限
 */
const ADMIN_LEVELS = {
  USER: 1,
  HELPER: 6,      // 护法 - 基础管理
  ELDER: 8,       // 长老 - 高级管理
  LEADER: 10      // 掌门 - 超级管理员
};

/**
 * 权限映射表
 */
const PERMISSIONS = {
  // 用户管理
  'user:view': 6,
  'user:edit': 6,
  'user:ban': 7,
  'user:kick': 6,
  'user:delete': 8,
  'user:reset_password': 7,
  'user:change_status': 7,
  
  // 管理员管理
  'admin:view': 8,
  'admin:add': 10,
  'admin:edit': 9,
  'admin:remove': 10,
  
  // 内容管理
  'news:manage': 6,
  'config:view': 7,
  'config:edit': 9,
  'room:manage': 6,
  'announcement:manage': 6,
  
  // IP 管理
  'ip:lock': 8,
  'ip:bans_view': 9,
  'ip:ban': 10,
  'ip:logs_view': 8,
  
  // 物品管理
  'item:view': 7,
  'item:edit': 7,
  'item:delete': 8,
  'shop:manage': 7,
  'inventory:view': 8,
  
  // 经济控制
  'economy:grant': 8,
  'economy:revoke': 9,
  'economy:config': 10,
  
  // 游戏管理
  'game:config': 8,
  'event:trigger': 8,
  'event:manage': 9,
  'skill:manage': 9,
  'pet:manage': 8,
  'sect:manage': 9,
  
  // 日志审计
  'log:view': 7,
  'log:clear': 9,
  'audit:view': 8,
  
  // 系统控制
  'server:maintenance': 10,
  'server:restart': 10,
  'server:broadcast': 7,
  'server:kick_all': 10
};

/**
 * 验证基础管理员权限
 */
function adminAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: '未登录',
      code: 'AUTH_REQUIRED'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // 检查是否为管理员 (grade >= 6 且属于逍遥派)
    if (req.user.grade < 6 || req.user.faction !== '逍遥派') {
      logger.warn('未授权的管理访问', {
        userId: req.user.id,
        username: req.user.username,
        grade: req.user.grade,
        faction: req.user.faction,
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({ 
        success: false, 
        message: '权限不足：需要管理员权限',
        code: 'ADMIN_REQUIRED'
      });
    }
    
    next();
  } catch (err) {
    logger.error('Token 验证失败', { error: err.message });
    return res.status(401).json({ 
      success: false, 
      message: '令牌无效或已过期',
      code: 'AUTH_INVALID'
    });
  }
}

/**
 * 验证超级管理员权限 (grade >= 10)
 */
function superAdminAuth(req, res, next) {
  adminAuth(req, res, () => {
    if (req.user.grade < 10) {
      logger.warn('越权访问：需要超级管理员', {
        userId: req.user.id,
        username: req.user.username,
        grade: req.user.grade,
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({ 
        success: false, 
        message: '权限不足：需要掌门权限',
        code: 'LEADER_REQUIRED'
      });
    }
    next();
  });
}

/**
 * 验证最低等级权限
 */
function gradeAuth(minGrade) {
  return (req, res, next) => {
    adminAuth(req, res, () => {
      if (req.user.grade < minGrade) {
        logger.warn('越权访问：等级不足', {
          userId: req.user.id,
          username: req.user.username,
          grade: req.user.grade,
          requiredGrade: minGrade,
          path: req.path,
          method: req.method
        });
        
        return res.status(403).json({ 
          success: false, 
          message: `权限不足：需要等级${minGrade}以上`,
          code: 'GRADE_INSUFFICIENT'
        });
      }
      next();
    });
  };
}

/**
 * 基于权限的验证中间件
 * @param {string} permission - 权限标识，如 'user:edit'
 */
function permissionAuth(permission) {
  return async (req, res, next) => {
    adminAuth(req, res, async () => {
      const requiredGrade = PERMISSIONS[permission];
      
      if (!requiredGrade) {
        logger.error('未定义的权限标识', { permission, path: req.path });
        return res.status(500).json({
          success: false,
          message: '权限配置错误',
          code: 'PERMISSION_UNDEFINED'
        });
      }
      
      if (req.user.grade < requiredGrade) {
        logger.warn('权限不足', {
          userId: req.user.id,
          username: req.user.username,
          grade: req.user.grade,
          requiredGrade,
          permission,
          path: req.path
        });
        
        return res.status(403).json({
          success: false,
          message: `权限不足：需要${getLevelName(requiredGrade)}及以上`,
          code: 'PERMISSION_DENIED',
          data: {
            requiredLevel: getLevelName(requiredGrade),
            yourLevel: getLevelName(req.user.grade)
          }
        });
      }
      
      next();
    });
  };
}

/**
 * 获取权限等级名称
 */
function getLevelName(grade) {
  if (grade >= 10) return '掌门';
  if (grade >= 8) return '长老';
  if (grade >= 6) return '护法';
  return '侠客';
}

/**
 * 操作日志记录中间件
 */
function logAction(actionType) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = (data) => {
      setImmediate(async () => {
        try {
          const success = data?.success !== false;
          await db.execute(
            `INSERT INTO admin_action_logs 
            (user_id, username, action_type, action, ip, user_agent, request_data, response_status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              req.user?.id,
              req.user?.username,
              actionType,
              `${req.method} ${req.path}`,
              req.ip,
              req.headers['user-agent']?.substring(0, 200),
              JSON.stringify(req.body).substring(0, 1000),
              success ? 'success' : 'failed'
            ]
          );
        } catch (err) {
          console.error('Log action error:', err.message);
        }
      });
      
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * 检查系统维护模式
 */
function checkMaintenanceMode(req, res, next) {
  if (req.user && req.user.grade >= 6) {
    return next();
  }
  
  if (req.path.startsWith('/health') || 
      req.path.startsWith('/api/auth/login') ||
      req.path.startsWith('/api/auth/register')) {
    return next();
  }
  
  next();
}

/**
 * 敏感操作二次验证中间件
 */
function requireTwoFactor() {
  return (req, res, next) => {
    const twoFactorCode = req.headers['x-2fa-code'];
    
    if (!twoFactorCode) {
      return res.status(403).json({
        success: false,
        message: '敏感操作需要二次验证',
        code: '2FA_REQUIRED'
      });
    }
    
    next();
  };
}

module.exports = {
  adminAuth,
  superAdminAuth,
  gradeAuth,
  permissionAuth,
  logAction,
  checkMaintenanceMode,
  requireTwoFactor,
  ADMIN_LEVELS,
  PERMISSIONS,
  getLevelName
};
