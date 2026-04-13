const express = require('express');
const router = express.Router();
const gameCtrl = require('../controllers/game');
const { auth } = require('../middleware/auth');

router.get('/blackjack', auth, gameCtrl.getBlackjack);
router.post('/blackjack/bet', auth, gameCtrl.blackjackBet);
router.post('/blackjack/hit', auth, gameCtrl.blackjackHit);
router.post('/blackjack/stand', auth, gameCtrl.blackjackStand);
router.post('/dice', auth, gameCtrl.dice);
router.post('/high-low', auth, gameCtrl.highLow);
router.post('/rps', auth, gameCtrl.rps);
router.post('/fish/start', auth, gameCtrl.fishStart);
router.post('/fish/reel', auth, gameCtrl.fishReel);
router.post('/hunt', auth, gameCtrl.hunt);
router.get('/othello', auth, gameCtrl.getOthello);
router.post('/othello/move', auth, gameCtrl.othelloMove);
router.post('/exam', auth, gameCtrl.exam);

module.exports = router;
