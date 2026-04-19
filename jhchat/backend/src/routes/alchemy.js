const express = require('express');
const router = express.Router();
const alchemyCtrl = require('../controllers/alchemy');
const { auth } = require('../middleware/auth');

router.get('/recipes', auth, alchemyCtrl.recipes);
router.get('/inventory', auth, alchemyCtrl.inventory);
router.get('/potions', auth, alchemyCtrl.potions);
router.get('/furnace/status', auth, alchemyCtrl.getFurnaceStatus);
router.get('/market/prices', auth, alchemyCtrl.getMarketPrices);
router.post('/craft/:id', auth, alchemyCtrl.craft);
router.post('/use/:id', auth, alchemyCtrl.usePotion);
router.post('/market/sell', auth, alchemyCtrl.sellHerb);
router.post('/market/buy', auth, alchemyCtrl.buyHerb);

module.exports = router;
