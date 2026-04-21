const express = require('express');
const router = express.Router();
const gardenController = require('../controllers/garden');
const { auth } = require('../middleware/auth');

// GET /api/garden/my-sect - 获取我的帮派药园信息
router.get('/my-sect', auth, gardenController.getSectGarden);

// GET /api/garden/my-garden - 获取我的药园信息（别名）
router.get('/my-garden', auth, gardenController.getSectGarden);

// GET /api/garden/plots - 获取我的药园地块
router.get('/plots', auth, gardenController.getMyPlots || gardenController.getSectGarden);

// GET /api/garden/plants - 获取所有植物配置
router.get('/plants', auth, gardenController.getAvailablePlants);

// POST /api/garden/plant - 种植
router.post('/plant', auth, gardenController.plantSeed);

// POST /api/garden/water - 浇水
router.post('/water', auth, gardenController.waterPlant);

// POST /api/garden/harvest - 收获
router.post('/harvest', auth, gardenController.harvestPlant);

// GET /api/garden/records - 获取种植记录
router.get('/records', auth, gardenController.getGardenRecords);

module.exports = router;
