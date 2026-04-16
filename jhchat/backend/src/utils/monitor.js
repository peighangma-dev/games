const { logger } = require('./logger');

// 监控指标
const metrics = {
  startTime: Date.now(),
  requests: {
    total: 0,
    success: 0,
    error: 0
  },
  chat: {
    messages: 0,
    privateMessages: 0,
    commands: 0
  },
  errors: {
    database: 0,
    authentication: 0,
    other: 0
  },
  performance: {
    responseTimes: [],
    slowRequests: 0
  }
};

// 记录请求指标
function recordRequest(statusCode, duration) {
  metrics.requests.total++;
  if (statusCode >= 200 && statusCode < 400) {
    metrics.requests.success++;
  } else {
    metrics.requests.error++;
  }
  
  // 记录响应时间
  metrics.performance.responseTimes.push(duration);
  // 只保留最近 100 次请求的响应时间
  if (metrics.performance.responseTimes.length > 100) {
    metrics.performance.responseTimes.shift();
  }
  
  // 慢请求检测 (>1000ms)
  if (duration > 1000) {
    metrics.performance.slowRequests++;
    logger.warn('慢请求检测', { duration: `${duration}ms` });
  }
}

// 记录聊天消息
function recordChatMessage(isPrivate) {
  metrics.chat.messages++;
  if (isPrivate) {
    metrics.chat.privateMessages++;
  }
}

// 记录命令执行
function recordCommand() {
  metrics.chat.commands++;
}

// 记录错误
function recordError(type) {
  metrics.requests.error++;
  if (type === 'database') {
    metrics.errors.database++;
  } else if (type === 'authentication') {
    metrics.errors.authentication++;
  } else {
    metrics.errors.other++;
  }
}

// 获取系统状态
function getSystemStatus() {
  const uptime = Math.floor((Date.now() - metrics.startTime) / 1000);
  const avgResponseTime = metrics.performance.responseTimes.length > 0
    ? metrics.performance.responseTimes.reduce((a, b) => a + b, 0) / metrics.performance.responseTimes.length
    : 0;
  
  return {
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
    requests: {
      total: metrics.requests.total,
      success: metrics.requests.success,
      error: metrics.requests.error,
      errorRate: metrics.requests.total > 0 
        ? ((metrics.requests.error / metrics.requests.total) * 100).toFixed(2) + '%'
        : '0%'
    },
    chat: metrics.chat,
    errors: metrics.errors,
    performance: {
      avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      slowRequests: metrics.performance.slowRequests
    }
  };
}

// 告警规则
const alertRules = {
  errorRate: {
    threshold: 0.1, // 错误率超过 10%
    message: '错误率超过 10%'
  },
  slowRequests: {
    threshold: 10, // 慢请求超过 10 个
    message: '慢请求过多'
  },
  databaseErrors: {
    threshold: 5, // 数据库错误超过 5 个
    message: '数据库错误频发'
  }
};

// 检查告警
function checkAlerts() {
  const status = getSystemStatus();
  const alerts = [];
  
  // 错误率告警
  const errorRate = parseFloat(status.requests.errorRate) / 100;
  if (errorRate > alertRules.errorRate.threshold) {
    alerts.push({
      level: 'critical',
      type: 'errorRate',
      message: alertRules.errorRate.message,
      value: status.requests.errorRate
    });
  }
  
  // 慢请求告警
  if (metrics.performance.slowRequests > alertRules.slowRequests.threshold) {
    alerts.push({
      level: 'warning',
      type: 'slowRequests',
      message: alertRules.slowRequests.message,
      value: metrics.performance.slowRequests
    });
  }
  
  // 数据库错误告警
  if (metrics.errors.database > alertRules.databaseErrors.threshold) {
    alerts.push({
      level: 'critical',
      type: 'databaseErrors',
      message: alertRules.databaseErrors.message,
      value: metrics.errors.database
    });
  }
  
  // 发送告警
  if (alerts.length > 0) {
    logger.error('系统告警', { alerts });
    // 这里可以集成钉钉、企业微信、邮件等告警通知
    // sendAlertNotification(alerts);
  }
  
  return alerts;
}

// 定时检查（每 5 分钟）
setInterval(() => {
  checkAlerts();
}, 5 * 60 * 1000);

// 导出 API 端点
function setupMetricsRoutes(router) {
  router.get('/metrics', (req, res) => {
    res.json(getSystemStatus());
  });
  
  router.get('/metrics/alerts', (req, res) => {
    const alerts = checkAlerts();
    res.json({ alerts });
  });
}

module.exports = {
  metrics,
  recordRequest,
  recordChatMessage,
  recordCommand,
  recordError,
  getSystemStatus,
  checkAlerts,
  setupMetricsRoutes
};
