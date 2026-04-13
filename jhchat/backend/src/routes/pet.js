const express = require('express');
const router = express.Router();
const petCtrl = require('../controllers/pet');
const { auth } = require('../middleware/auth');

router.get('/sheep', auth, petCtrl.getSheep);
router.post('/sheep/buy', auth, petCtrl.buySheep);
router.post('/sheep/feed', auth, petCtrl.feedSheep);
router.post('/sheep/sell', auth, petCtrl.sellSheep);
router.post('/sheep/sell-milk', auth, petCtrl.sellMilk);
router.post('/sheep/clean', auth, petCtrl.cleanSheep);
router.post('/sheep/breed', auth, petCtrl.breedSheep);
router.post('/sheep/sun', auth, petCtrl.sunSheep);
router.get('/star', auth, petCtrl.getStar);
router.post('/star/adopt', auth, petCtrl.adoptStar);
router.post('/star/fight', auth, petCtrl.fightStar);
router.post('/star/adventure', auth, petCtrl.adventureStar);
router.get('/mini', auth, petCtrl.getMini);
router.post('/mini/adopt', auth, petCtrl.adoptMini);

module.exports = router;
