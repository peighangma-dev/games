const express = require('express');
const router = express.Router();
const alchemyCtrl = require('../controllers/alchemy');
const { auth } = require('../middleware/auth');

router.get('/recipes', auth, alchemyCtrl.recipes);
router.get('/inventory', auth, alchemyCtrl.inventory);
router.get('/potions', auth, alchemyCtrl.potions);
router.post('/craft/:id', auth, alchemyCtrl.craft);

module.exports = router;
