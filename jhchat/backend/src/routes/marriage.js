const express = require('express');
const router = express.Router();
const marriageCtrl = require('../controllers/marriage');
const { auth } = require('../middleware/auth');

router.get('/proposals', auth, marriageCtrl.proposals);
router.post('/propose', auth, marriageCtrl.propose);
router.post('/accept', auth, marriageCtrl.accept);
router.post('/divorce', auth, marriageCtrl.divorce);
router.get('/inn', auth, marriageCtrl.getInn);
router.post('/inn', auth, marriageCtrl.postInn);

module.exports = router;
