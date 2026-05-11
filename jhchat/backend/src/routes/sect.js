const express = require('express');
const router = express.Router();
const sectCtrl = require('../controllers/sect');
const { auth } = require('../middleware/auth');

// 获取门派列表
router.get('/', auth, sectCtrl.list);

// 获取我的门派信息
router.get('/info', auth, sectCtrl.sectInfo);

// 门派详情
router.get('/:name', auth, sectCtrl.detail);

// 门派成员
router.get('/:name/members', auth, sectCtrl.members);

// 任务相关路由
router.get('/tasks', auth, sectCtrl.getTasks);
router.post('/tasks/complete', auth, sectCtrl.completeTask);
router.post('/tasks/:questId/submit', auth, sectCtrl.submitProgress);
router.get('/tasks/achievements', auth, sectCtrl.getAchievements);

// 原有路由
router.post('/create', auth, sectCtrl.create);
router.post('/dissolve', auth, sectCtrl.dissolve);
router.post('/abdicate', auth, sectCtrl.abdicate);
router.post('/recruit', auth, sectCtrl.recruit);
router.post('/expel', auth, sectCtrl.expel);
router.post('/practice', auth, sectCtrl.practice);
router.get('/skills', auth, sectCtrl.getSkills);
router.post('/skills/learn', auth, sectCtrl.learnSkill);
router.get('/contribution', auth, sectCtrl.getContribution);
router.post('/checkin', auth, sectCtrl.checkIn);
router.post('/salary', auth, sectCtrl.salary);

module.exports = router;
