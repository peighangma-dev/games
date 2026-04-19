const express = require('express');
const router = express.Router();
const mining = require('../controllers/mining');
const { auth } = require('../middleware/auth');

router.get('/status', auth, mining.getMiningStatus);
router.get('/records', auth, mining.getMiningRecords);
router.post('/start', auth, mining.startMining);
router.post('/finish', auth, mining.finishMining);

module.exports = router;
