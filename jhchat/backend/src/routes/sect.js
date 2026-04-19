const express = require('express');
const router = express.Router();
const sectCtrl = require('../controllers/sect');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', auth, sectCtrl.list);
router.get('/:name', auth, sectCtrl.detail);
router.get('/:name/members', auth, sectCtrl.members);
router.get('/:name/members-page', auth, sectCtrl.sectMembersWithPage);
router.put('/:name', auth, sectCtrl.update);
router.get('/info', auth, sectCtrl.sectInfo);
router.post('/checkin', auth, sectCtrl.checkIn);
router.post('/salary', auth, sectCtrl.salary);
router.post('/create', auth, sectCtrl.create);
router.post('/dissolve', auth, sectCtrl.dissolve);
router.post('/abdicate', auth, sectCtrl.abdicate);  // 掌门禅让
router.post('/recruit', auth, sectCtrl.recruit);    // 招收弟子
router.post('/expel', auth, sectCtrl.expel);        // 开除弟子

module.exports = router;
