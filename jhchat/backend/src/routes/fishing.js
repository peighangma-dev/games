const express = require('express');
const router = express.Router();
const fishingCtrl = require('../controllers/fishing');
const { auth } = require('../middleware/auth');

router.get('/status', auth, fishingCtrl.getFishingStatus);
router.get('/records', auth, fishingCtrl.getFishingRecords);
router.post('/start', auth, fishingCtrl.startFishing);
router.post('/finish', auth, fishingCtrl.finishFishing);

module.exports = router;
