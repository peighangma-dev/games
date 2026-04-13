const express = require('express');
const router = express.Router();
const itemCtrl = require('../controllers/item');
const { auth } = require('../middleware/auth');

router.get('/', auth, itemCtrl.list);
router.post('/:id/use', auth, itemCtrl.use);
router.delete('/:id', auth, itemCtrl.drop);
router.get('/market', auth, itemCtrl.getMarket);
router.post('/market', auth, itemCtrl.sellOnMarket);
router.post('/market/:id/buy', auth, itemCtrl.buyFromMarket);
router.get('/cards', auth, itemCtrl.getCards);
router.post('/cards/buy', auth, itemCtrl.buyCard);
router.get('/insurances', auth, itemCtrl.getInsurances);
router.post('/insurances/buy', auth, itemCtrl.buyInsurance);
router.get('/jobs', auth, itemCtrl.getJobs);
router.post('/jobs/:id/work', auth, itemCtrl.work);

module.exports = router;
