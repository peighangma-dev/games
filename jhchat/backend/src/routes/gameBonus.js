const express = require('express');
const router = express.Router();
const GameBonusCtrl = require('../controllers/GameBonusController');
const { auth } = require('../middleware/auth');

// Buff 相关路由
router.get('/bonus', auth, GameBonusCtrl.getUserBonuses);
router.post('/bonus', auth, GameBonusCtrl.addBonus);
router.delete('/bonus', auth, GameBonusCtrl.removeBonus);
router.post('/bonus/cleanup', auth, GameBonusCtrl.cleanupExpired);

// 属性计算
router.get('/stats/calculate/:id?', auth, GameBonusCtrl.calculateFinalStats);

// 游戏统计
router.get('/stats', auth, GameBonusCtrl.getStatistics);
router.post('/stats/update', auth, GameBonusCtrl.updateStatistics);

module.exports = router;
