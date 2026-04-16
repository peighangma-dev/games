const express = require('express');
const router = express.Router();
const itemCtrl = require('../controllers/item');
const { auth } = require('../middleware/auth');

router.get('/items', auth, itemCtrl.getShopItems);
router.post('/buy', auth, itemCtrl.buyFromShop);

module.exports = router;
