const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievement');
const { auth } = require('../middleware/auth');

// GET /api/achievements - 获取所有成就定义
router.get('/', auth, achievementController.getAchievements);

// GET /api/achievements/my - 获取我的成就
router.get('/my', auth, achievementController.getMyAchievements);

// POST /api/achievements/claim - 领取成就奖励
router.post('/claim', auth, achievementController.claimReward);

module.exports = router;
