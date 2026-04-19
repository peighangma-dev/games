const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const hunting = require('../controllers/hunting');

router.get('/status', auth, hunting.getHuntingStatus);
router.get('/records', auth, hunting.getHuntingRecords);
router.post('/work/start', auth, hunting.startWork);
router.post('/work/finish', auth, hunting.finishWork);
router.post('/hunt/start', auth, hunting.startHunt);
router.post('/hunt/finish', auth, hunting.finishHunt);

module.exports = router;
