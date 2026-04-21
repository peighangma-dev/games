/**
 * 管理模块控制器聚合 - 增强版
 */
const DashboardController = require('./DashboardController');
const UserController = require('./UserController');
const ServerController = require('./ServerController');
const EconomyController = require('./EconomyController');
const SecretSkillController = require('./SecretSkillController');
const QuestController = require('./QuestController');
const PetController = require('./PetController');
const SectController = require('./SectController');
const MarketController = require('./MarketController');
const SecurityController = require('./SecurityController');
const AuditController = require('./AuditController');
const ItemController = require('./ItemController');
const ShopItemController = require('./ShopItemController');
const ConfigController = require('./ConfigController');
const RoomController = require('./RoomController');
const StatisticsController = require('./StatisticsController');
const NewsController = require('./NewsController');

module.exports = {
  // 仪表盘
  getOverview: DashboardController.getOverview,
  getRealtime: DashboardController.getRealtime,
  getChartData: DashboardController.getChartData,
  
  // 服务器状态
  getServerInfo: ServerController.getStatus,
  getCacheStats: ServerController.getCacheStats,
  clearCache: ServerController.clearCache,
  
  // 用户管理
  getUsers: UserController.getUsers,
  getUserDetail: UserController.getUserDetail,
  getManagers: UserController.getManagers,
  
  // 藏经阁管理
  getSecretSkills: SecretSkillController.getSecretSkills,
  getSecretSkillDetail: SecretSkillController.getSecretSkillDetail,
  createSecretSkill: SecretSkillController.createSecretSkill,
  updateSecretSkill: SecretSkillController.updateSecretSkill,
  deleteSecretSkill: SecretSkillController.deleteSecretSkill,
  getSecretSkillsStats: SecretSkillController.getSecretSkillsStats,
  
  // 任务管理
  getQuests: QuestController.getQuests,
  getQuestDetail: QuestController.getQuestDetail,
  createQuest: QuestController.createQuest,
  updateQuest: QuestController.updateQuest,
  deleteQuest: QuestController.deleteQuest,
  
  // 宠物管理
  getPets: PetController.getPets,
  getPetDetail: PetController.getPetDetail,
  createPet: PetController.createPet,
  updatePet: PetController.updatePet,
  deletePet: PetController.deletePet,
  
  // 门派管理
  getSects: SectController.getSects,
  getSectDetail: SectController.getSectDetail,
  updateSect: SectController.updateSect,
  
  // 经济监控
  getEconomyStats: EconomyController.getStats,
  getRichList: EconomyController.getRichList,
  
  // 市场管理
  getMarketListings: MarketController.getListings,
  cancelListing: MarketController.cancelListing,
  
  // 安全监控
  getSuspiciousUsers: SecurityController.getSuspiciousUsers,
  warnUser: SecurityController.warnUser,
  banUser: SecurityController.banUser,
  clearAllCheats: SecurityController.clearAllCheats,
  
  // 日志审计
  getLoginLogs: AuditController.getLoginLogs,
  getChatLogs: AuditController.getChatLogs,
  deleteChatLog: AuditController.deleteChatLog,
  getUserIpLogs: AuditController.getUserIpLogs,
  getIpLocks: AuditController.getIpLocks,
  createIpLock: AuditController.createIpLock,
  deleteIpLock: AuditController.deleteIpLock,
  getLogs: AuditController.getLogs,
  clearLogs: AuditController.clearLogs,
  
  // 物品管理
  getItems: ItemController.getItems,
  getItemDetail: ItemController.getItemDetail,
  createItem: ItemController.createItem,
  updateItem: ItemController.updateItem,
  deleteItem: ItemController.deleteItem,
  
  // 商店物品管理
  getShopItems: ShopItemController.getShopItems,
  getShopItemDetail: ShopItemController.getShopItemDetail,
  createShopItem: ShopItemController.createShopItem,
  updateShopItem: ShopItemController.updateShopItem,
  deleteShopItem: ShopItemController.deleteShopItem,
  restockShopItem: ShopItemController.restockShopItem,
  
  // 系统配置管理
  getConfigs: ConfigController.getConfigs,
  updateConfig: ConfigController.updateConfig,
  batchUpdateConfigs: ConfigController.batchUpdateConfigs,
  getGroupedConfigs: ConfigController.getGroupedConfigs,
  
  // 房间管理
  getRooms: RoomController.getRooms,
  createRoom: RoomController.createRoom,
  updateRoom: RoomController.updateRoom,
  deleteRoom: RoomController.deleteRoom,
  
  // 统计分析
  getOnlineStats: StatisticsController.getOnlineStats,
  getRegistrationStats: StatisticsController.getRegistrationStats,
  getChatStats: StatisticsController.getChatStats,
  getEconomyStats: StatisticsController.getEconomyStats,
  
  // 公告管理
  getNews: NewsController.getNews,
  getNewsDetail: NewsController.getNewsDetail,
  createNews: NewsController.createNews,
  updateNews: NewsController.updateNews,
  deleteNews: NewsController.deleteNews
};
