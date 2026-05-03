const express = require('express');
const router = express.Router();
const shopCtrl = require('../controllers/shop');
const { auth } = require('../middleware/auth');

router.get('/items', auth, shopCtrl.getShopItems);
router.post('/buy', auth, shopCtrl.buyFromShop);

module.exports = router;
