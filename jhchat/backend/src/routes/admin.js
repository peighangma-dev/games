/**
 * 后台管理路由扩展
 */
const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/admin/index');
const { adminAuth } = require('../middleware/adminAuth');

// ==================== 仪表盘 ====================
router.get('/dashboard', adminAuth, adminCtrl.getOverview);
router.get('/dashboard/realtime', adminAuth, adminCtrl.getRealtime);
router.get('/dashboard/charts', adminAuth, adminCtrl.getChartData);

// ==================== 服务器状态 ====================
router.get('/server/status', adminAuth, adminCtrl.getServerInfo);
router.get('/server/cache-stats', adminAuth, adminCtrl.getCacheStats);
router.post('/server/clear-cache', adminAuth, adminCtrl.clearCache);

// ==================== 用户管理 ====================
router.get('/users', adminAuth, adminCtrl.getUsers);
router.get('/users/:id', adminAuth, adminCtrl.getUserDetail);

// ==================== 管理员管理 ====================
router.get('/managers', adminAuth, adminCtrl.getManagers);

// ==================== 藏经阁管理 ====================
router.get('/secret-skills/stats', adminAuth, adminCtrl.getSecretSkillsStats);
router.get('/secret-skills', adminAuth, adminCtrl.getSecretSkills);
router.get('/secret-skills/:id', adminAuth, adminCtrl.getSecretSkillDetail);
router.post('/secret-skills', adminAuth, adminCtrl.createSecretSkill);
router.put('/secret-skills/:id', adminAuth, adminCtrl.updateSecretSkill);
router.delete('/secret-skills/:id', adminAuth, adminCtrl.deleteSecretSkill);

// ==================== 任务管理 ====================
router.get('/quests', adminAuth, adminCtrl.getQuests);
router.get('/quests/:id', adminAuth, adminCtrl.getQuestDetail);
router.post('/quests', adminAuth, adminCtrl.createQuest);
router.put('/quests/:id', adminAuth, adminCtrl.updateQuest);
router.delete('/quests/:id', adminAuth, adminCtrl.deleteQuest);

// ==================== 宠物管理 ====================
router.get('/pets', adminAuth, adminCtrl.getPets);
router.get('/pets/:id', adminAuth, adminCtrl.getPetDetail);
router.post('/pets', adminAuth, adminCtrl.createPet);
router.put('/pets/:id', adminAuth, adminCtrl.updatePet);
router.delete('/pets/:id', adminAuth, adminCtrl.deletePet);

// ==================== 门派管理 ====================
router.get('/sects', adminAuth, adminCtrl.getSects);
router.get('/sects/:id', adminAuth, adminCtrl.getSectDetail);
router.put('/sects/:id', adminAuth, adminCtrl.updateSect);

// ==================== 经济监控 ====================
router.get('/economy/stats', adminAuth, adminCtrl.getEconomyStats);
router.get('/economy/rich-list', adminAuth, adminCtrl.getRichList);

// ==================== 市场管理 ====================
router.get('/market/listings', adminAuth, adminCtrl.getMarketListings);
router.delete('/market/listings/:id', adminAuth, adminCtrl.cancelListing);

// ==================== 商店物品管理 ====================
router.get('/shop-items', adminAuth, adminCtrl.getShopItems);
router.get('/shop-items/:id', adminAuth, adminCtrl.getShopItemDetail);
router.post('/shop-items', adminAuth, adminCtrl.createShopItem);
router.put('/shop-items/:id', adminAuth, adminCtrl.updateShopItem);
router.delete('/shop-items/:id', adminAuth, adminCtrl.deleteShopItem);
router.post('/shop-items/:id/restock', adminAuth, adminCtrl.restockShopItem);

// ==================== 安全监控 ====================
router.get('/security/suspicious', adminAuth, adminCtrl.getSuspiciousUsers);
router.post('/security/warn/:userId', adminAuth, adminCtrl.warnUser);
router.post('/security/ban/:userId', adminAuth, adminCtrl.banUser);
router.post('/security/clear-all', adminAuth, adminCtrl.clearAllCheats);

// ==================== 登录日志 ====================
router.get('/login-logs', adminAuth, adminCtrl.getLoginLogs);

// ==================== IP 管理 ====================
router.get('/ip-locks', adminAuth, adminCtrl.getIpLocks);
router.post('/ip-locks', adminAuth, adminCtrl.createIpLock);
router.delete('/ip-locks/:id', adminAuth, adminCtrl.deleteIpLock);
router.get('/ip-logs', adminAuth, adminCtrl.getUserIpLogs);

// ==================== 操作日志 ====================
router.get('/logs', adminAuth, adminCtrl.getLogs);
router.delete('/logs', adminAuth, adminCtrl.clearLogs);

// ==================== 系统配置 ====================
router.get('/config', adminAuth, adminCtrl.getConfigs);
router.get('/config/grouped', adminAuth, adminCtrl.getGroupedConfigs);
router.put('/config/:name', adminAuth, adminCtrl.updateConfig);
router.post('/config/batch', adminAuth, adminCtrl.batchUpdateConfigs);

// ==================== 聊天记录 ====================
router.get('/chat-logs', adminAuth, adminCtrl.getChatLogs);
router.delete('/chat-logs/:id', adminAuth, adminCtrl.deleteChatLog);

// ==================== 物品管理 ====================
router.get('/items', adminAuth, adminCtrl.getItems);
router.get('/items/:id', adminAuth, adminCtrl.getItemDetail);
router.post('/items', adminAuth, adminCtrl.createItem);
router.put('/items/:id', adminAuth, adminCtrl.updateItem);
router.delete('/items/:id', adminAuth, adminCtrl.deleteItem);

// ==================== 房间管理 ====================
router.get('/rooms', adminAuth, adminCtrl.getRooms);
router.post('/rooms', adminAuth, adminCtrl.createRoom);
router.put('/rooms/:id', adminAuth, adminCtrl.updateRoom);
router.delete('/rooms/:id', adminAuth, adminCtrl.deleteRoom);

// ==================== 统计分析 ====================
router.get('/statistics/online', adminAuth, adminCtrl.getOnlineStats);
router.get('/statistics/registration', adminAuth, adminCtrl.getRegistrationStats);
router.get('/statistics/chat', adminAuth, adminCtrl.getChatStats);
router.get('/statistics/economy', adminAuth, adminCtrl.getEconomyStats);

// ==================== 公告管理 ====================
router.get('/news', adminAuth, adminCtrl.getNews);
router.get('/news/:id', adminAuth, adminCtrl.getNewsDetail);
router.post('/news', adminAuth, adminCtrl.createNews);
router.put('/news/:id', adminAuth, adminCtrl.updateNews);
router.delete('/news/:id', adminAuth, adminCtrl.deleteNews);

module.exports = router;
