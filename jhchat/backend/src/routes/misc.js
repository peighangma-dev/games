const express = require('express');
const router = express.Router();
const miscCtrl = require('../controllers/misc');
const { auth } = require('../middleware/auth');

router.get('/rankings', auth, miscCtrl.rankings);
router.get('/wishes', auth, miscCtrl.getWishes);
router.post('/wishes', auth, miscCtrl.postWish);
router.get('/votes', auth, miscCtrl.getVotes);
router.post('/votes', auth, miscCtrl.postVote);
router.get('/news', auth, miscCtrl.getNews);
router.get('/news/:id', auth, miscCtrl.getNewsDetail);
router.get('/announcements', auth, miscCtrl.getAnnouncements);
router.post('/bath', auth, miscCtrl.bath);
router.get('/photos', auth, miscCtrl.getPhotos);
router.post('/photos', auth, miscCtrl.postPhoto);
router.get('/bounties', auth, miscCtrl.getBounties);
router.post('/bounties/:id/claim', auth, miscCtrl.claimBounty);
router.get('/prisoners', auth, miscCtrl.getPrisoners);
router.post('/prisoners/:id/bail', auth, miscCtrl.bailPrisoner);
router.get('/courtesans', auth, miscCtrl.getCourtesans);
router.post('/courtesans/:id/visit', auth, miscCtrl.visitCourtesan);
router.get('/lucky', auth, miscCtrl.lucky);

module.exports = router;
