const express = require('express');
const router = express.Router();
const chatCtrl = require('../controllers/chat');
const { auth } = require('../middleware/auth');

router.get('/rooms', auth, chatCtrl.getRooms);
router.post('/rooms/:id/join', auth, chatCtrl.joinRoom);
router.get('/rooms/:id/messages', auth, chatCtrl.getMessages);
router.get('/rooms/:id/online', auth, chatCtrl.getRoomOnline);
router.get('/actions', auth, chatCtrl.getActions);
router.get('/commands', auth, chatCtrl.getCommands);

module.exports = router;
