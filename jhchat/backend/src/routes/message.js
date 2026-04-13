const express = require('express');
const router = express.Router();
const msgCtrl = require('../controllers/message');
const { auth } = require('../middleware/auth');

router.get('/inbox', auth, msgCtrl.getInbox);
router.get('/sent', auth, msgCtrl.getSent);
router.get('/unread-count', auth, msgCtrl.getUnreadCount);
router.get('/:id', auth, msgCtrl.getOne);
router.post('/', auth, msgCtrl.send);
router.delete('/:id', auth, msgCtrl.deleteOne);
router.delete('/inbox/all', auth, msgCtrl.clearInbox);
router.delete('/sent/all', auth, msgCtrl.clearSent);

module.exports = router;
