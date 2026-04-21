const express = require('express');
const router = express.Router();
const skillCtrl = require('../controllers/skill');
const { auth } = require('../middleware/auth');

// 武功列表
router.get('/', auth, skillCtrl.list);

// 修炼相关
router.post('/:id/practice', auth, skillCtrl.practice);
router.get('/practice/status', auth, skillCtrl.getPracticeStatus);
router.get('/cultivation/detail', auth, skillCtrl.getCultivationDetail);

// 藏经阁
router.get('/secret', auth, skillCtrl.secret);
router.post('/secret/:id/learn', auth, skillCtrl.learn);

// 已学武功
router.get('/learned', auth, skillCtrl.learned);

module.exports = router;
