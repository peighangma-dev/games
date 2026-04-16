const express = require('express');
const router = express.Router();
const encounterCtrl = require('../controllers/encounter');
const { auth } = require('../middleware/auth');

router.get('/status', auth, encounterCtrl.getEncounterStatus);
router.get('/records', auth, encounterCtrl.getEncounterRecords);
router.post('/trigger', auth, encounterCtrl.triggerEncounter);

module.exports = router;
