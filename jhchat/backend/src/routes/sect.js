const express = require('express');
const router = express.Router();
const sectCtrl = require('../controllers/sect');
const { auth } = require('../middleware/auth');

// 任务相关路由
router.get('/tasks', auth, sectCtrl.getTasks);
router.post('/tasks/complete', auth, sectCtrl.completeTask);
router.post('/tasks/:questId/submit', auth, sectCtrl.submitProgress);
router.get('/tasks/achievements', auth, sectCtrl.getAchievements);

// 原有路由（部分）
router.post('/create', auth, sectCtrl.create);
router.post('/dissolve', auth, sectCtrl.dissolve);
router.post('/abdicate', auth, sectCtrl.abdicate);
router.post('/recruit', auth, sectCtrl.recruit);
router.post('/expel', auth, sectCtrl.expel);
router.post('/practice', auth, sectCtrl.practice);

// 需要补充完整的路由：skill, info, checkin, salary 等
// 暂时注释掉，因为这些函数在控制器中不存在
// router.get('/skills', auth, sectCtrl.getSkills);
// router.post('/skills/learn', auth, sectCtrl.learnSkill);
// router.get('/info', auth, sectCtrl.sectInfo);
// router.get('/contribution', auth, sectCtrl.getContribution);
// router.post('/checkin', auth, sectCtrl.checkIn);
// router.post('/salary', auth, sectCtrl.salary);

module.exports = router;
