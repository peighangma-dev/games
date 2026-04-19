const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/admin');
const { adminAuth, superAdminAuth, gradeAuth } = require('../middleware/auth');

router.get('/users', adminAuth, adminCtrl.getUsers);
router.get('/users/:id', adminAuth, adminCtrl.getUserDetail);
router.put('/users/:id', adminAuth, adminCtrl.updateUser);
router.delete('/users/:id', adminAuth, adminCtrl.deleteUser);
router.post('/users/batch-delete', adminAuth, adminCtrl.batchDeleteUsers);

router.get('/managers', adminAuth, adminCtrl.getManagers);
router.post('/managers', adminAuth, adminCtrl.addManager);
router.put('/managers/:id', adminAuth, adminCtrl.updateManager);
router.delete('/managers/:id', adminAuth, adminCtrl.removeManager);

router.get('/news', adminAuth, adminCtrl.getNews);
router.post('/news', adminAuth, adminCtrl.createNews);
router.put('/news/:id', adminAuth, adminCtrl.updateNews);
router.delete('/news/:id', adminAuth, adminCtrl.deleteNews);

router.get('/config', adminAuth, adminCtrl.getConfig);
router.put('/config/:name', adminAuth, adminCtrl.updateConfig);

router.get('/rooms', adminAuth, adminCtrl.getRooms);
router.post('/rooms', adminAuth, adminCtrl.createRoom);
router.put('/rooms/:id', adminAuth, adminCtrl.updateRoom);
router.delete('/rooms/:id', adminAuth, adminCtrl.deleteRoom);

router.get('/ip-locks', gradeAuth(8), adminCtrl.getIpLocks);
router.post('/ip-locks', gradeAuth(8), adminCtrl.createIpLock);
router.delete('/ip-locks/:id', gradeAuth(8), adminCtrl.deleteIpLock);

router.get('/ip-bans', superAdminAuth, adminCtrl.getIpBans);
router.post('/ip-bans', superAdminAuth, adminCtrl.createIpBan);
router.delete('/ip-bans/:id', superAdminAuth, adminCtrl.deleteIpBan);

router.get('/logs', adminAuth, adminCtrl.getLogs);
router.delete('/logs', adminAuth, adminCtrl.clearLogs);

router.get('/items', adminAuth, adminCtrl.getItems);
router.post('/items', adminAuth, adminCtrl.createItem);
router.put('/items/:id', adminAuth, adminCtrl.updateItem);
router.delete('/items/:id', adminAuth, adminCtrl.deleteItem);

router.get('/drugs', adminAuth, adminCtrl.getDrugs);
router.post('/drugs', adminAuth, adminCtrl.createDrug);
router.put('/drugs/:id', adminAuth, adminCtrl.updateDrug);
router.delete('/drugs/:id', adminAuth, adminCtrl.deleteDrug);

router.get('/cards', adminAuth, adminCtrl.getCards);
router.post('/cards', adminAuth, adminCtrl.createCard);
router.put('/cards/:id', adminAuth, adminCtrl.updateCard);
router.delete('/cards/:id', adminAuth, adminCtrl.deleteCard);

router.get('/vips', adminAuth, adminCtrl.getVips);
router.put('/vips/:id', adminAuth, adminCtrl.updateVip);

router.get('/statistics/online', adminAuth, adminCtrl.statsOnline);
router.get('/statistics/registration', adminAuth, adminCtrl.statsRegistration);
router.get('/statistics/chat', adminAuth, adminCtrl.statsChat);
router.get('/statistics/economy', adminAuth, adminCtrl.statsEconomy);

router.put('/password', adminAuth, adminCtrl.changePassword);

module.exports = router;

// 商店物品管理
router.get('/shop-items', adminAuth, adminCtrl.getShopItems);
router.post('/shop-items', adminAuth, adminCtrl.createShopItem);
router.put('/shop-items/:id', adminAuth, adminCtrl.updateShopItem);
router.delete('/shop-items/:id', adminAuth, adminCtrl.deleteShopItem);
router.post('/shop-items/:id/restock', adminAuth, adminCtrl.restockShopItem);

