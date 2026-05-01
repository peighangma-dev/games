const express = require('express');
const router = express.Router();
const sectCtrl = require('../controllers/sect');
const { auth, adminAuth } = require('../middleware/auth');

// 静态路由必须在动态路由之前定义
router.get('/info', auth, sectCtrl.sectInfo);
router.get('/contribution', auth, sectCtrl.getContribution);
router.get('/skills', auth, sectCtrl.getSkills);
router.post('/skills/learn', auth, sectCtrl.learnSkill);
router.get('/tasks', auth, sectCtrl.getTasks);
router.post('/tasks/complete', auth, sectCtrl.completeTask);
router.get('/warehouse', auth, sectCtrl.getWarehouse);
router.post('/donate', auth, sectCtrl.donate);
router.get('/leaderboard', auth, sectCtrl.leaderboard);
router.post('/checkin', auth, sectCtrl.checkIn);
router.post('/salary', auth, sectCtrl.salary);
router.post('/create', auth, sectCtrl.create);
router.post('/dissolve', auth, sectCtrl.dissolve);
router.post('/abdicate', auth, sectCtrl.abdicate);
router.post('/recruit', auth, sectCtrl.recruit);
router.post('/expel', auth, sectCtrl.expel);
router.post('/practice', auth, sectCtrl.practice);

// 动态路由放在最后
router.get('/', auth, sectCtrl.list);
router.get('/:name', auth, sectCtrl.detail);
router.get('/:name/members', auth, sectCtrl.members);
router.get('/:name/members-page', auth, sectCtrl.sectMembersWithPage);
router.put('/:name', auth, sectCtrl.update);

module.exports = router;
