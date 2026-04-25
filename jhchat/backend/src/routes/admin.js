/**
 * 后台管理路由扩展
 */
const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/admin/index');
const { adminAuth, logAction } = require('../middleware/adminAuth');

// ==================== 仪表盘 ====================
router.get('/dashboard', adminAuth, adminCtrl.getOverview);
router.get('/dashboard/realtime', adminAuth, adminCtrl.getRealtime);
router.get('/dashboard/charts', adminAuth, adminCtrl.getChartData);

// ==================== 服务器状态 ====================
router.get('/server/status', adminAuth, adminCtrl.getServerInfo);
router.get('/server/cache-stats', adminAuth, adminCtrl.getCacheStats);
router.post('/server/clear-cache', adminAuth, logAction('clear_cache'), adminCtrl.clearCache);

// ==================== 用户管理 ====================
router.get('/users', adminAuth, adminCtrl.getUsers);
router.get('/users/:id', adminAuth, adminCtrl.getUserDetail);
router.put('/users/:id', adminAuth, logAction('update_user'), adminCtrl.updateUser);
router.delete('/users/:id', adminAuth, logAction('delete_user'), adminCtrl.deleteUser);
router.post('/users/:id/ban', adminAuth, logAction('ban_user'), adminCtrl.banUser);
router.post('/users/:id/unban', adminAuth, logAction('unban_user'), adminCtrl.unbanUser);
router.post('/users/:id/kick', adminAuth, logAction('kick_user'), adminCtrl.kickUser);
router.post('/users/:id/reset-password', adminAuth, logAction('reset_password'), adminCtrl.resetPassword);

// ==================== 管理员管理 ====================
router.get('/managers', adminAuth, adminCtrl.getManagers);

// ==================== 藏经阁管理 ====================
router.get('/secret-skills/stats', adminAuth, adminCtrl.getSecretSkillsStats);
router.get('/secret-skills', adminAuth, adminCtrl.getSecretSkills);
router.get('/secret-skills/:id', adminAuth, adminCtrl.getSecretSkillDetail);
router.post('/secret-skills', adminAuth, logAction('create_secret_skill'), adminCtrl.createSecretSkill);
router.put('/secret-skills/:id', adminAuth, logAction('update_secret_skill'), adminCtrl.updateSecretSkill);
router.delete('/secret-skills/:id', adminAuth, logAction('delete_secret_skill'), adminCtrl.deleteSecretSkill);

// ==================== 任务管理 ====================
router.get('/quests', adminAuth, adminCtrl.getQuests);
router.get('/quests/:id', adminAuth, adminCtrl.getQuestDetail);
router.post('/quests', adminAuth, logAction('create_quest'), adminCtrl.createQuest);
router.put('/quests/:id', adminAuth, logAction('update_quest'), adminCtrl.updateQuest);
router.delete('/quests/:id', adminAuth, logAction('delete_quest'), adminCtrl.deleteQuest);

// ==================== 宠物管理 ====================
router.get('/pets', adminAuth, adminCtrl.getPets);
router.get('/pets/:id', adminAuth, adminCtrl.getPetDetail);
router.post('/pets', adminAuth, logAction('create_pet'), adminCtrl.createPet);
router.put('/pets/:id', adminAuth, logAction('update_pet'), adminCtrl.updatePet);
router.delete('/pets/:id', adminAuth, logAction('delete_pet'), adminCtrl.deletePet);

// ==================== 门派管理 ====================
// 基本管理
router.get('/sects', adminAuth, adminCtrl.getSects);
router.get('/sects/stats', adminAuth, adminCtrl.getSectStats);
router.get('/sects/:id', adminAuth, adminCtrl.getSectDetail);
router.post('/sects', adminAuth, logAction('create_sect'), adminCtrl.createSect);
router.put('/sects/:id', adminAuth, logAction('update_sect'), adminCtrl.updateSect);
router.delete('/sects/:id', adminAuth, logAction('delete_sect'), adminCtrl.deleteSect);

// 门派成员管理
router.get('/sects/:sectId/members', adminAuth, adminCtrl.getSectMembers);
router.post('/sects/:sectId/sync', adminAuth, logAction('sync_sect_members'), adminCtrl.syncSectMembers);

// 门派职位管理
router.get('/sects/:sectId/positions', adminAuth, adminCtrl.getSectPositions);
router.post('/sects/:sectId/positions', adminAuth, logAction('save_sect_position'), adminCtrl.saveSectPosition);
router.put('/sects/:sectId/positions/:positionId', adminAuth, logAction('update_sect_position'), adminCtrl.saveSectPosition);
router.delete('/sects/:sectId/positions/:positionId', adminAuth, logAction('delete_sect_position'), adminCtrl.deleteSectPosition);

// 入派申请管理
router.get('/sects/:sectId/applications', adminAuth, adminCtrl.getSectApplications);
router.post('/sects/:sectId/applications/:appId/review', adminAuth, logAction('review_sect_application'), adminCtrl.reviewApplication);

// ==================== 经济监控 ====================
router.get('/economy/stats', adminAuth, adminCtrl.getEconomyStats);
router.get('/economy/rich-list', adminAuth, adminCtrl.getRichList);

// ==================== 市场管理 ====================
router.get('/market/listings', adminAuth, adminCtrl.getMarketListings);
router.delete('/market/listings/:id', adminAuth, logAction('cancel_listing'), adminCtrl.cancelListing);

// ==================== 商店物品管理 ====================
router.get('/shop-items', adminAuth, adminCtrl.getShopItems);
router.get('/shop-items/:id', adminAuth, adminCtrl.getShopItemDetail);
router.post('/shop-items', adminAuth, logAction('create_shop_item'), adminCtrl.createShopItem);
router.put('/shop-items/:id', adminAuth, logAction('update_shop_item'), adminCtrl.updateShopItem);
router.delete('/shop-items/:id', adminAuth, logAction('delete_shop_item'), adminCtrl.deleteShopItem);
router.post('/shop-items/:id/restock', adminAuth, logAction('restock_shop_item'), adminCtrl.restockShopItem);

// ==================== 安全监控 ====================
router.get('/security/suspicious', adminAuth, adminCtrl.getSuspiciousUsers);
router.post('/security/warn/:userId', adminAuth, logAction('warn_user'), adminCtrl.warnUser);
router.post('/security/ban/:userId', adminAuth, logAction('ban_user'), adminCtrl.banUser);
router.post('/security/clear-all', adminAuth, logAction('clear_all_cheats'), adminCtrl.clearAllCheats);

// ==================== 登录日志 ====================
router.get('/login-logs', adminAuth, adminCtrl.getLoginLogs);

// ==================== IP 管理 ====================
router.get('/ip-locks', adminAuth, adminCtrl.getIpLocks);
router.post('/ip-locks', adminAuth, logAction('create_ip_lock'), adminCtrl.createIpLock);
router.delete('/ip-locks/:id', adminAuth, logAction('delete_ip_lock'), adminCtrl.deleteIpLock);
router.get('/ip-logs', adminAuth, adminCtrl.getUserIpLogs);

// IP Bans 别名路由（与 ip-locks 相同功能）
router.get('/ip-bans', adminAuth, adminCtrl.getIpLocks);
router.post('/ip-bans', adminAuth, logAction('create_ip_ban'), adminCtrl.createIpLock);
router.delete('/ip-bans/:id', adminAuth, logAction('delete_ip_ban'), adminCtrl.deleteIpLock);

// ==================== 操作日志 ====================
router.get('/logs', adminAuth, adminCtrl.getLogs);
router.delete('/logs', adminAuth, logAction('clear_logs'), adminCtrl.clearLogs);

// ==================== 系统配置 ====================
router.get('/config', adminAuth, adminCtrl.getConfigs);
router.get('/config/grouped', adminAuth, adminCtrl.getGroupedConfigs);
router.put('/config/:name', adminAuth, logAction('update_config'), adminCtrl.updateConfig);
router.post('/config/batch', adminAuth, logAction('batch_update_config'), adminCtrl.batchUpdateConfigs);

// ==================== 聊天记录 ====================
router.get('/chat-logs', adminAuth, adminCtrl.getChatLogs);
router.delete('/chat-logs/:id', adminAuth, logAction('delete_chat_log'), adminCtrl.deleteChatLog);

// ==================== 物品管理 ====================
router.get('/items', adminAuth, adminCtrl.getItems);
router.get('/items/:id', adminAuth, adminCtrl.getItemDetail);
router.post('/items', adminAuth, logAction('create_item'), adminCtrl.createItem);
router.put('/items/:id', adminAuth, logAction('update_item'), adminCtrl.updateItem);
router.delete('/items/:id', adminAuth, logAction('delete_item'), adminCtrl.deleteItem);

// ==================== 房间管理 ====================
router.get('/rooms', adminAuth, adminCtrl.getRooms);
router.post('/rooms', adminAuth, logAction('create_room'), adminCtrl.createRoom);
router.put('/rooms/:id', adminAuth, logAction('update_room'), adminCtrl.updateRoom);
router.delete('/rooms/:id', adminAuth, logAction('delete_room'), adminCtrl.deleteRoom);

// ==================== 统计分析 ====================
router.get('/statistics/online', adminAuth, adminCtrl.getOnlineStats);
router.get('/statistics/registration', adminAuth, adminCtrl.getRegistrationStats);
router.get('/statistics/chat', adminAuth, adminCtrl.getChatStats);
router.get('/statistics/economy', adminAuth, adminCtrl.getEconomyStats);

// ==================== 公告管理 ====================
router.get('/news', adminAuth, adminCtrl.getNews);
router.get('/news/:id', adminAuth, adminCtrl.getNewsDetail);
router.post('/news', adminAuth, logAction('create_news'), adminCtrl.createNews);
router.put('/news/:id', adminAuth, logAction('update_news'), adminCtrl.updateNews);
router.delete('/news/:id', adminAuth, logAction('delete_news'), adminCtrl.deleteNews);

// ==================== 系统更新管理 ====================
router.get('/updates', adminAuth, adminCtrl.getUpdates);
router.get('/updates/latest', adminAuth, adminCtrl.getLatestVersion);
router.get('/updates/check', adminCtrl.checkUpdate);
router.get('/updates/available', adminCtrl.getAvailablePackages);
router.get('/updates/packages', adminAuth, adminCtrl.getPackages);
router.get('/updates/packages/:id/download', adminCtrl.downloadPackage);
router.get('/updates/latest.sh', adminCtrl.getUpdateScript);
router.get('/updates/:id', adminAuth, adminCtrl.getUpdateDetail);
router.post('/updates', adminAuth, logAction('create_update'), adminCtrl.createUpdate);
router.post('/updates/generate-package', adminAuth, logAction('generate_package'), adminCtrl.generatePackage);
router.post('/updates/:id/install', adminCtrl.recordInstallation);
router.put('/updates/:id', adminAuth, logAction('update_update'), adminCtrl.updateUpdate);
router.delete('/updates/:id', adminAuth, logAction('delete_update'), adminCtrl.deleteUpdate);
router.post('/updates/:id/release', adminAuth, logAction('release_update'), adminCtrl.releaseUpdate);
router.post('/updates/:id/push', adminAuth, logAction('push_update'), adminCtrl.pushUpdate);
router.get('/updates/push-logs', adminAuth, adminCtrl.getPushLogs);
router.put('/updates/push-logs/:id', adminAuth, logAction('update_push_log'), adminCtrl.updatePushStatus);

module.exports = router;
