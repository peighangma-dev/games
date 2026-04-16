const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 健康检查端点
router.get('/health', async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'OK',
    uptime: process.uptime(),
    checks: {}
  };

  try {
    await db.execute('SELECT 1');
    checks.checks.database = 'OK';
  } catch (err) {
    checks.checks.database = `ERROR: ${err.message}`;
    checks.status = 'UNHEALTHY';
  }

  const statusCode = checks.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(checks);
});

// 版本信息
router.get('/version', (req, res) => {
  res.json({
    version: '1.0.0',
    build_date: '2026-04-14',
    node_version: process.version
  });
});

module.exports = router;
