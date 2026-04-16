const express = require('express');
const router = express.Router();
const fortuneCtrl = require('../controllers/fortune');
const { auth } = require('../middleware/auth');

router.get('/today', auth, fortuneCtrl.getFortune);
router.post('/draw', auth, fortuneCtrl.drawFortune);

module.exports = router;
