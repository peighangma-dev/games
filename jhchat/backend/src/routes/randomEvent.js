const express = require('express');
const router = express.Router();
const randomEventCtrl = require('../controllers/randomEvent');
const { auth, adminAuth } = require('../middleware/auth');

// 公开路由 - 前端获取启用的事件列表
router.get('/enabled', randomEventCtrl.getEnabledEvents);

// 管理后台路由
router.get('/', adminAuth, randomEventCtrl.getAllEvents);
router.get('/logs', adminAuth, randomEventCtrl.getEventLogs);
router.get('/:id', adminAuth, randomEventCtrl.getEvent);
router.post('/', adminAuth, randomEventCtrl.createEvent);
router.put('/:id', adminAuth, randomEventCtrl.updateEvent);
router.delete('/:id', adminAuth, randomEventCtrl.deleteEvent);
router.post('/:id/toggle', adminAuth, randomEventCtrl.toggleEvent);

module.exports = router;
