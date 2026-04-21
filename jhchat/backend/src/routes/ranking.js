const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/ranking');
const { auth } = require('../middleware/auth');

// GET /api/rankings/comprehensive - 综合排行榜
router.get('/comprehensive', auth, rankingController.getComprehensiveRanking);

// GET /api/rankings/wealth - 财富排行榜
router.get('/wealth', auth, rankingController.getWealthRanking);

// GET /api/rankings/neili - 内力排行榜
router.get('/neili', auth, rankingController.getNeiliRanking);

// GET /api/rankings/wugong - 武功排行榜
router.get('/wugong', auth, rankingController.getPowerRanking);

// GET /api/rankings/level - 等级排行榜
router.get('/level', auth, rankingController.getLevelRanking);

// GET /api/rankings/alchemy - 炼丹排行榜
router.get('/alchemy', auth, rankingController.getAlchemyRanking);

// GET /api/rankings/fishing - 钓鱼排行榜
router.get('/fishing', auth, rankingController.getFishingRanking);

// GET /api/rankings/mining - 挖矿排行榜
router.get('/mining', auth, rankingController.getMiningRanking);

// GET /api/rankings/hunting - 狩猎排行榜
router.get('/hunting', auth, rankingController.getHuntingRanking);

module.exports = router;
