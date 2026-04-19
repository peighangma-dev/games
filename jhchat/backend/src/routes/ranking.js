const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/ranking');
const { auth } = require('../middleware/auth');

// GET /api/rankings/wealth - 财富排行榜
router.get('/wealth', auth, rankingController.getWealthRanking);

// GET /api/rankings/power - 武力排行榜
router.get('/power', auth, rankingController.getPowerRanking);

// GET /api/rankings/neili - 内力排行榜
router.get('/neili', auth, rankingController.getNeiliRanking);

// GET /api/rankings/level - 等级排行榜
router.get('/level', auth, rankingController.getLevelRanking);

// GET /api/rankings/fishing - 钓鱼排行榜
router.get('/fishing', auth, rankingController.getFishingRanking);

module.exports = router;
