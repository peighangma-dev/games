const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth');
const { auth } = require('../middleware/auth');

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.post('/logout', auth, authCtrl.logout);
router.put('/password', auth, authCtrl.changePassword);
router.post('/revive', auth, authCtrl.revive);
router.post('/suicide', auth, authCtrl.suicide);

module.exports = router;
