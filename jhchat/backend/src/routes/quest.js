const express = require('express');
const router = express.Router();
const quest = require('../controllers/quest');
const { auth } = require('../middleware/auth');

router.get('/', auth, quest.list);
router.get('/my', auth, quest.getMyQuests);
router.get('/available', auth, quest.getAvailableQuests);
router.post('/accept', auth, quest.acceptQuest);
router.post('/submit', auth, quest.submitQuest);
router.post('/claim', auth, quest.claimQuestReward);

module.exports = router;
