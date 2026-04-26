mysqldump: [Warning] Using a password on the command line interface can be insecure.
-- MySQL dump 10.13  Distrib 5.7.42, for Linux (x86_64)
--
-- Host: localhost    Database: jhchat
-- ------------------------------------------------------
-- Server version	5.7.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `achievement_progress`
--

DROP TABLE IF EXISTS `achievement_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `achievement_progress` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alchemy_count` int(11) NOT NULL DEFAULT '0' COMMENT '炼丹次数',
  `fishing_count` int(11) NOT NULL DEFAULT '0' COMMENT '钓鱼次数',
  `mining_count` int(11) NOT NULL DEFAULT '0' COMMENT '挖矿次数',
  `hunting_count` int(11) NOT NULL DEFAULT '0' COMMENT '狩猎次数',
  `legendary_count` int(11) NOT NULL DEFAULT '0' COMMENT '稀有物品次数',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成就进度';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `achievements`
--

DROP TABLE IF EXISTS `achievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `achievements` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '成就名称',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '成就描述',
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '?' COMMENT '图标',
  `category` enum('alchemy','fishing','mining','hunting','combat','social') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类',
  `requirement_type` enum('count','level','rare','legendary') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'count' COMMENT '达成类型',
  `requirement_value` int(11) NOT NULL COMMENT '达成条件数值',
  `points` int(11) NOT NULL DEFAULT '0' COMMENT '成就点数',
  `reward_silver` bigint(20) NOT NULL DEFAULT '0' COMMENT '银两奖励',
  `reward_exp` int(11) NOT NULL DEFAULT '0' COMMENT '经验奖励',
  `reward_item` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '物品奖励',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=146 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成就定义';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_action_logs`
--

DROP TABLE IF EXISTS `admin_action_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_action_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_data` text COLLATE utf8mb4_unicode_ci,
  `response_status` enum('success','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'success',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`username`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_applications`
--

DROP TABLE IF EXISTS `admin_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_applications` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL COMMENT '申请人 ID',
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '申请人用户名',
  `current_grade` tinyint(3) unsigned NOT NULL COMMENT '当前等级',
  `applied_grade` tinyint(3) unsigned NOT NULL COMMENT '申请等级',
  `reason` text COLLATE utf8mb4_unicode_ci COMMENT '申请理由',
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '状态',
  `reviewer` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '审核人',
  `review_comment` text COLLATE utf8mb4_unicode_ci COMMENT '审核意见',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员申请记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `alchemy_furnaces`
--

DROP TABLE IF EXISTS `alchemy_furnaces`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `alchemy_furnaces` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `owner` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否正在炼制',
  `cooldown_minutes` int(11) NOT NULL DEFAULT '10' COMMENT '冷却时间 (分钟)',
  `last_craft_time` datetime DEFAULT NULL COMMENT '上次炼制时间',
  `craft_start_time` datetime DEFAULT NULL COMMENT '本次炼制开始时间',
  `craft_recipe_id` int(10) unsigned DEFAULT NULL COMMENT '当前炼制药方 ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_owner` (`owner`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='炼丹炉';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `alchemy_items`
--

DROP TABLE IF EXISTS `alchemy_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `alchemy_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '无',
  `quantity` int(11) NOT NULL DEFAULT '0',
  `potency` int(11) NOT NULL DEFAULT '0' COMMENT '药效',
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配药物品';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `alchemy_quests`
--

DROP TABLE IF EXISTS `alchemy_quests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `alchemy_quests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `npc_id` tinyint(3) unsigned NOT NULL COMMENT 'NPC ID',
  `npc_name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'NPC 名称',
  `npc_icon` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '?‍⚕️' COMMENT 'NPC 图标',
  `quest_type` enum('daily','normal') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal' COMMENT '任务类型',
  `title` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '任务标题',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '任务描述',
  `quest_category` enum('craft','gather') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '任务分类',
  `target_item` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '目标物品',
  `target_count` int(11) NOT NULL DEFAULT '1' COMMENT '目标数量',
  `requirement_level` tinyint(3) unsigned NOT NULL DEFAULT '1' COMMENT '等级要求',
  `reward_silver` int(11) NOT NULL DEFAULT '0' COMMENT '银两奖励',
  `reward_exp` int(11) NOT NULL DEFAULT '0' COMMENT '经验奖励',
  `reward_item` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '物品奖励',
  `reward_item_count` int(11) NOT NULL DEFAULT '0' COMMENT '物品奖励数量',
  `reward_contribution` int(11) NOT NULL DEFAULT '0' COMMENT '贡献奖励',
  `is_daily` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否日常任务',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否可用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_npc` (`npc_name`),
  KEY `idx_type` (`quest_type`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=248 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='炼丹任务';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `alchemy_recipes`
--

DROP TABLE IF EXISTS `alchemy_recipes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `alchemy_recipes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '药品名称',
  `description` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '药品描述',
  `effect_type` enum('neili','tili','wugong','charm','attack','defense','all') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '效果类型',
  `effect_value` int(11) NOT NULL DEFAULT '0' COMMENT '效果值',
  `materials` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '材料配方 (JSON)',
  `success_rate` int(11) NOT NULL DEFAULT '100' COMMENT '成功率 (%)',
  `level` tinyint(3) unsigned NOT NULL DEFAULT '1' COMMENT '需要等级',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_level` (`level`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='炼丹配方';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `announcements` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告置顶';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bad_words`
--

DROP TABLE IF EXISTS `bad_words`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bad_words` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `word` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_word` (`word`)
) ENGINE=InnoDB AUTO_INCREMENT=105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='脏词列表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bank_accounts`
--

DROP TABLE IF EXISTS `bank_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bank_accounts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `deposit` bigint(20) NOT NULL DEFAULT '0' COMMENT '存款',
  `last_interest_at` datetime DEFAULT NULL COMMENT '最后计息时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='银行账户';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `banned_usernames`
--

DROP TABLE IF EXISTS `banned_usernames`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `banned_usernames` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name_pattern` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名或模式',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='禁止登录名';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `birth_records`
--

DROP TABLE IF EXISTS `birth_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `birth_records` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `partner` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `born_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生育记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `blackjack_games`
--

DROP TABLE IF EXISTS `blackjack_games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `blackjack_games` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dealer_cards` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'z0~z5',
  `dealer_points` int(11) DEFAULT NULL,
  `player_cards` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'u0~u5',
  `player_points` int(11) DEFAULT NULL,
  `bet` int(11) NOT NULL DEFAULT '0',
  `wins` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='21点游戏';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bounties`
--

DROP TABLE IF EXISTS `bounties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bounties` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `target` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='悬赏';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `card_templates`
--

DROP TABLE IF EXISTS `card_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `card_templates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '卡片名称',
  `description` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '功能说明',
  `price` int(11) NOT NULL DEFAULT '0' COMMENT '需要银两',
  `card_type` enum('normal','vip') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_card_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=131 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卡片商品';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chat_actions`
--

DROP TABLE IF EXISTS `chat_actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat_actions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `action_type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '1=系统自动',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '动作名',
  `template` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '动作模板(##=发言者,%%=对象)',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=391 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天动作库';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chat_exp_logs`
--

DROP TABLE IF EXISTS `chat_exp_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat_exp_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL COMMENT '用户 ID',
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名',
  `exp_gain` int(11) NOT NULL COMMENT '获得经验',
  `chat_minutes` int(11) NOT NULL COMMENT '聊天分钟数',
  `is_daily_limit` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否达到日limit',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天经验日志';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat_messages` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `room_id` tinyint(3) unsigned NOT NULL,
  `line_no` bigint(20) unsigned NOT NULL COMMENT '行号',
  `is_action` tinyint(1) NOT NULL DEFAULT '0' COMMENT '动作标志',
  `is_private` tinyint(1) NOT NULL DEFAULT '0' COMMENT '私聊标志',
  `sender` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receiver` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '所有人',
  `sender_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '660099' COMMENT '名字颜色',
  `msg_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '660099' COMMENT '消息颜色',
  `action_word` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '动作词',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_room_line` (`room_id`,`line_no`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=457 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chat_rooms`
--

DROP TABLE IF EXISTS `chat_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat_rooms` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `min_grade` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '最低等级',
  `max_grade` tinyint(3) unsigned NOT NULL DEFAULT '10' COMMENT '最高等级(0=不限)',
  `fight_enabled` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'PK开关',
  `sort_order` tinyint(3) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_room_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天房间';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `courtesans`
--

DROP TABLE IF EXISTS `courtesans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `courtesans` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `beauty` int(11) NOT NULL DEFAULT '0' COMMENT '美貌度',
  `registered_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='烟花院';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cultivation_progress`
--

DROP TABLE IF EXISTS `cultivation_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cultivation_progress` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL COMMENT '用户 ID',
  `practice_type` tinyint(4) NOT NULL COMMENT '修炼类型：1=内功，2=外功，3=轻功',
  `level` int(11) NOT NULL DEFAULT '1' COMMENT '修为等级',
  `progress` int(11) NOT NULL DEFAULT '0' COMMENT '当前进度',
  `required_progress` int(11) NOT NULL DEFAULT '1000' COMMENT '升级所需进度',
  `total_practices` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '总修炼次数',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_type` (`user_id`,`practice_type`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='修为进度';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `diner_menu`
--

DROP TABLE IF EXISTS `diner_menu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `diner_menu` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '酒菜',
  `power` int(11) NOT NULL DEFAULT '0',
  `stamina` int(11) NOT NULL DEFAULT '0',
  `level_req` int(11) NOT NULL DEFAULT '0',
  `quantity` int(11) NOT NULL DEFAULT '0',
  `price` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='酒菜菜单';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `economy_transaction_logs`
--

DROP TABLE IF EXISTS `economy_transaction_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `economy_transaction_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL COMMENT '用户 ID',
  `type` enum('income','spending') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '类型：收入/支出',
  `amount` bigint(20) NOT NULL COMMENT '金额',
  `balance_before` bigint(20) NOT NULL COMMENT '交易前余额',
  `balance_after` bigint(20) NOT NULL COMMENT '交易后余额',
  `operator_id` int(10) unsigned DEFAULT NULL COMMENT '操作用户 ID（管理员操作时）',
  `source` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '收入来源（income 类型）',
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '支出类别（spending 类型）',
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '原因说明',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_source` (`source`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='经济交易日志';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fight_bans`
--

DROP TABLE IF EXISTS `fight_bans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fight_bans` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_id` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `banned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_username_room` (`username`,`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='禁打名单';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fishing_items`
--

DROP TABLE IF EXISTS `fishing_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fishing_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `item_name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '物品名称',
  `item_type` enum('食材','药材','暗器','杂物') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '食材' COMMENT '物品类型',
  `effect_neili` int(11) NOT NULL DEFAULT '0' COMMENT '内力效果',
  `effect_tili` int(11) NOT NULL DEFAULT '0' COMMENT '体力效果',
  `silver_value` int(11) NOT NULL DEFAULT '0' COMMENT '出售价格',
  `rarities` enum('common','uncommon','rare','epic','legendary') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'common' COMMENT '稀有度',
  `image_file` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '图片文件',
  `description` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '物品描述',
  PRIMARY KEY (`id`),
  KEY `idx_rarity` (`rarities`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钓鱼物品配置';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fishing_ranking`
--

DROP TABLE IF EXISTS `fishing_ranking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fishing_ranking` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_count` int(11) NOT NULL DEFAULT '0' COMMENT '总钓鱼次数',
  `total_weight` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '总重量 (斤)',
  `rare_count` int(11) NOT NULL DEFAULT '0' COMMENT '稀有鱼获数量',
  `shenpin_count` int(11) NOT NULL DEFAULT '0' COMMENT '神品鱼获数量',
  `total_value` bigint(20) NOT NULL DEFAULT '0' COMMENT '鱼获总价值',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`),
  KEY `idx_total_value` (`total_value`),
  KEY `idx_rare_count` (`rare_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钓鱼排行榜';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fishing_records`
--

DROP TABLE IF EXISTS `fishing_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fishing_records` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `effect_value` int(11) NOT NULL DEFAULT '0',
  `silver_reward` int(11) NOT NULL DEFAULT '0',
  `rarities` enum('common','uncommon','rare','epic','legendary') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'common',
  `fished_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_username` (`username`),
  KEY `idx_fished_at` (`fished_at`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钓鱼记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fishing_states`
--

DROP TABLE IF EXISTS `fishing_states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fishing_states` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL COMMENT '用户 ID',
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `started_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_fished_at` datetime DEFAULT NULL COMMENT '最后钓鱼时间',
  `cooldown_minutes` int(11) NOT NULL DEFAULT '30' COMMENT '冷却时间 (分钟)',
  PRIMARY KEY (`id`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钓鱼状态';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `garden_plants`
--

DROP TABLE IF EXISTS `garden_plants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `garden_plants` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '植物名称',
  `seed_name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '种子名称',
  `harvest_item` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '收获物品',
  `min_sect_level` tinyint(3) unsigned NOT NULL DEFAULT '1' COMMENT '最低药园等级',
  `growth_time_minutes` int(11) NOT NULL DEFAULT '60' COMMENT '生长时间 (分钟)',
  `growth_stages` tinyint(3) unsigned NOT NULL DEFAULT '4' COMMENT '生长阶段数',
  `harvest_quantity_min` tinyint(3) unsigned NOT NULL DEFAULT '1' COMMENT '最少收获数量',
  `harvest_quantity_max` tinyint(3) unsigned NOT NULL DEFAULT '3' COMMENT '最多收获数量',
  `seed_cost` int(11) NOT NULL DEFAULT '100' COMMENT '种子成本 (银两)',
  `harvest_value` int(11) NOT NULL DEFAULT '200' COMMENT '收获价值 (银两)',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='药园植物配置';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `garden_plots`
--

DROP TABLE IF EXISTS `garden_plots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `garden_plots` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `garden_id` int(10) unsigned NOT NULL COMMENT '药园 ID',
  `plot_number` tinyint(3) unsigned NOT NULL COMMENT '地块编号',
  `plant_id` int(10) unsigned DEFAULT NULL COMMENT '种植的植物 ID',
  `plant_name` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '植物名称',
  `planter_id` int(10) unsigned DEFAULT NULL COMMENT '种植者 ID',
  `planter_username` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '种植者用户名',
  `planted_at` datetime DEFAULT NULL COMMENT '种植时间',
  `growth_stage` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '生长阶段 0-4',
  `growth_progress` int(11) NOT NULL DEFAULT '0' COMMENT '生长进度 0-100',
  `ready_at` datetime DEFAULT NULL COMMENT '成熟时间',
  `is_harvested` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已收获',
  `harvested_at` datetime DEFAULT NULL COMMENT '收获时间',
  `harvester_username` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '收获者',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_garden_plot` (`garden_id`,`plot_number`),
  KEY `idx_plant` (`plant_id`),
  KEY `idx_planter` (`planter_id`)
) ENGINE=InnoDB AUTO_INCREMENT=161 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='药园地块';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `garden_records`
--

DROP TABLE IF EXISTS `garden_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `garden_records` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sect_id` int(10) unsigned NOT NULL,
  `action_type` enum('plant','water','harvest') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作类型',
  `plant_name` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '植物名称',
  `plot_number` tinyint(3) unsigned DEFAULT NULL COMMENT '地块编号',
  `contribution_earned` int(11) NOT NULL DEFAULT '0' COMMENT '获得贡献',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_sect` (`sect_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='药园操作记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hunting_items`
--

DROP TABLE IF EXISTS `hunting_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `hunting_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `item_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effect_neili` int(11) DEFAULT '0',
  `effect_tili` int(11) DEFAULT '0',
  `silver_value` int(11) DEFAULT '0',
  `rarities` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_file` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'hunt_common.gif',
  `description` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='狩猎物品';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hunting_records`
--

DROP TABLE IF EXISTS `hunting_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `hunting_records` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('work','hunt') COLLATE utf8mb4_unicode_ci NOT NULL,
  `job_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reward_silver` int(11) NOT NULL DEFAULT '0',
  `reward_exp` int(11) NOT NULL DEFAULT '0',
  `is_success` tinyint(1) NOT NULL DEFAULT '0',
  `rarities` enum('common','uncommon','rare','epic','legendary') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `completed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_time` (`completed_at`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='狩猎记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hunting_states`
--

DROP TABLE IF EXISTS `hunting_states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `hunting_states` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('work','hunt') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'work 或 hunt',
  `job_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '打工职业名称',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `started_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_completed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cooldown_minutes` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_active` (`is_active`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='狩猎状态';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inn_records`
--

DROP TABLE IF EXISTS `inn_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inn_records` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `registrant` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `partner` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `registered_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客栈记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `insurance_products`
--

DROP TABLE IF EXISTS `insurance_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `insurance_products` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_days` int(11) NOT NULL DEFAULT '0',
  `price` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='保险产品';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ip_bans`
--

DROP TABLE IF EXISTS `ip_bans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ip_bans` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ip_pattern` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'IP或通配符(如10.%)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='IP永久封锁';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ip_locks`
--

DROP TABLE IF EXISTS `ip_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ip_locks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `locked_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '锁定时间',
  `locked_by` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作者',
  `expires_at` datetime NOT NULL COMMENT '自动解封时间',
  PRIMARY KEY (`id`),
  KEY `idx_ip` (`ip`),
  KEY `idx_expires` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='IP临时锁定';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '物品名',
  `owner` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '无' COMMENT '拥有者',
  `type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '类型',
  `attack` int(11) NOT NULL DEFAULT '0',
  `defense` int(11) NOT NULL DEFAULT '0',
  `sort_no` int(11) DEFAULT NULL COMMENT '编号',
  `quantity` int(11) NOT NULL DEFAULT '1' COMMENT '数量/面值',
  `amount` int(11) DEFAULT NULL COMMENT '物品数量',
  `is_equipped` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否装备',
  `neili_bonus` int(11) NOT NULL DEFAULT '0' COMMENT '内力加成',
  `tili_bonus` int(11) NOT NULL DEFAULT '0' COMMENT '体力加成',
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物品';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kill_logs`
--

DROP TABLE IF EXISTS `kill_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kill_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `victim` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `killer` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `skill` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '使用的武功',
  `killed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_expired` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_time` (`killed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='击杀记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `learned_skills`
--

DROP TABLE IF EXISTS `learned_skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `learned_skills` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `skill_name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `neili_bonus` int(11) NOT NULL DEFAULT '0',
  `speed_bonus` int(11) NOT NULL DEFAULT '0',
  `level` int(11) NOT NULL DEFAULT '1',
  `learned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='已学武功';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `market_listings`
--

DROP TABLE IF EXISTS `market_listings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `market_listings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `seller` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `power` int(11) NOT NULL DEFAULT '0',
  `stamina` int(11) NOT NULL DEFAULT '0',
  `level_req` int(11) NOT NULL DEFAULT '0',
  `quantity` int(11) NOT NULL DEFAULT '1',
  `original_price` int(11) NOT NULL DEFAULT '0',
  `selling_price` int(11) NOT NULL DEFAULT '0',
  `listed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='二手市场';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `marriages`
--

DROP TABLE IF EXISTS `marriages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `marriages` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `proposer` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '求婚方',
  `target` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '被求婚方',
  `message` text COLLATE utf8mb4_unicode_ci COMMENT '求婚说明',
  `proposed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_expired` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='婚姻登记';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `martial_arts`
--

DROP TABLE IF EXISTS `martial_arts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `martial_arts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '武功名称',
  `sect` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '所属门派',
  `neili_cost` int(11) NOT NULL DEFAULT '0' COMMENT '需要内力',
  `is_timed` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否时效性',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='武功';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `receiver` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '收件人',
  `sender` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '发件人',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `sent_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_receiver` (`receiver`,`is_read`),
  KEY `idx_sender` (`sender`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站内邮件';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mini_pets`
--

DROP TABLE IF EXISTS `mini_pets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mini_pets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attack` int(11) NOT NULL DEFAULT '0',
  `defense` int(11) NOT NULL DEFAULT '0',
  `level` int(11) NOT NULL DEFAULT '1',
  `exp` int(11) NOT NULL DEFAULT '0',
  `special_skill` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rage` int(11) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小型宠物';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mining_items`
--

DROP TABLE IF EXISTS `mining_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mining_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `item_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effect_neili` int(11) DEFAULT '0',
  `effect_tili` int(11) DEFAULT '0',
  `silver_value` int(11) DEFAULT '0',
  `rarities` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_file` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'ore_common.gif',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='挖矿物品';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mining_records`
--

DROP TABLE IF EXISTS `mining_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mining_records` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effect_value` int(11) DEFAULT '0',
  `silver_reward` int(11) DEFAULT '0',
  `rarities` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mined_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_time` (`mined_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='挖矿记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mining_states`
--

DROP TABLE IF EXISTS `mining_states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mining_states` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `started_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_mined_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cooldown_minutes` int(11) NOT NULL DEFAULT '60',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='挖矿状态';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mute_list`
--

DROP TABLE IF EXISTS `mute_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mute_list` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `muted_by` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `muted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime DEFAULT NULL COMMENT 'NULL=永久',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='禁言名单';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `news`
--

DROP TABLE IF EXISTS `news`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `news` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `topic` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `author` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `view_count` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_time` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='新闻公告';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `noodle_bowls`
--

DROP TABLE IF EXISTS `noodle_bowls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `noodle_bowls` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `owner` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `seasoning` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '调料组合',
  `price` int(11) NOT NULL DEFAULT '0',
  `is_done` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='做面记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `noodle_ingredients`
--

DROP TABLE IF EXISTS `noodle_ingredients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `noodle_ingredients` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nutrition` int(11) NOT NULL DEFAULT '0',
  `flavor` int(11) NOT NULL DEFAULT '0',
  `price` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='面菜食材';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `online_users`
--

DROP TABLE IF EXISTS `online_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `online_users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_id` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `avatar` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('male','female') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'male',
  `sect` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '无',
  `grade` tinyint(3) unsigned NOT NULL DEFAULT '1' COMMENT '等级',
  `joined_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_active_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `socket_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Socket.IO连接ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`),
  KEY `idx_room` (`room_id`)
) ENGINE=InnoDB AUTO_INCREMENT=180 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='在线用户';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `operation_logs`
--

DROP TABLE IF EXISTS `operation_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `operation_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `log_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `operator` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作描述',
  `is_expired` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_time` (`log_time`),
  KEY `idx_operator` (`operator`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pet_init_rules`
--

DROP TABLE IF EXISTS `pet_init_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pet_init_rules` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `init_clean` int(11) NOT NULL DEFAULT '0',
  `init_happy` int(11) NOT NULL DEFAULT '0',
  `init_health` int(11) NOT NULL DEFAULT '0',
  `init_milk` int(11) NOT NULL DEFAULT '0',
  `init_life` int(11) NOT NULL DEFAULT '0',
  `init_hunger` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='宠物初始化参数';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `photos`
--

DROP TABLE IF EXISTS `photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `photos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `jh_name` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '江湖名',
  `real_name` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `address` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `is_approved` tinyint(1) NOT NULL DEFAULT '0',
  `image_data` longblob COMMENT '照片二进制',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='照片';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `poll_candidates`
--

DROP TABLE IF EXISTS `poll_candidates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `poll_candidates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vote_count` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投票候选人';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `poll_config`
--

DROP TABLE IF EXISTS `poll_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `poll_config` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `min_exp` int(11) NOT NULL DEFAULT '300' COMMENT '经验值门槛',
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投票配置';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `poll_votes`
--

DROP TABLE IF EXISTS `poll_votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `poll_votes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `voter` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `candidate_id` int(10) unsigned NOT NULL,
  `voted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_voter` (`voter`),
  KEY `idx_candidate` (`candidate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投票记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `practice_logs`
--

DROP TABLE IF EXISTS `practice_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `practice_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL COMMENT '用户 ID',
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名',
  `practice_type` tinyint(4) NOT NULL COMMENT '修炼类型：1=内功，2=外功，3=轻功',
  `exp_gain` int(11) NOT NULL COMMENT '获得的经验',
  `neili_cost` int(11) NOT NULL COMMENT '消耗的内力',
  `tili_cost` int(11) NOT NULL DEFAULT '5' COMMENT '消耗的体力',
  `time_cost` int(11) NOT NULL DEFAULT '0' COMMENT '修炼耗时 (秒)',
  `cultivation_progress` int(11) NOT NULL DEFAULT '0' COMMENT '修为进度',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_time` (`created_at`),
  KEY `idx_type` (`practice_type`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='修炼日志';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pregnancies`
--

DROP TABLE IF EXISTS `pregnancies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pregnancies` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `conceived_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='怀孕记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quests`
--

DROP TABLE IF EXISTS `quests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '任务名称',
  `description` varchar(500) DEFAULT NULL COMMENT '任务描述',
  `type` enum('main','side','daily','hidden') NOT NULL DEFAULT 'side' COMMENT '任务类型：主线/支线/日常/隐藏',
  `difficulty` enum('easy','medium','hard','extreme') NOT NULL DEFAULT 'easy' COMMENT '难度等级',
  `require_level` int(11) DEFAULT '1' COMMENT '等级要求',
  `require_sect` varchar(20) DEFAULT NULL COMMENT '门派要求',
  `require_sex` enum('male','female','any') DEFAULT 'any' COMMENT '性别要求',
  `objective` varchar(200) DEFAULT NULL COMMENT '任务目标描述',
  `objective_type` enum('kill','collect','talk','explore','craft','train') DEFAULT NULL COMMENT '目标类型',
  `objective_target` varchar(50) DEFAULT NULL COMMENT '目标对象（怪物/物品名）',
  `objective_count` int(11) DEFAULT '1' COMMENT '目标数量',
  `reward_silver` int(11) DEFAULT '0' COMMENT '银两奖励',
  `reward_exp` int(11) DEFAULT '0' COMMENT '经验奖励',
  `reward_neili` int(11) DEFAULT '0' COMMENT '内力奖励',
  `reward_item` varchar(100) DEFAULT NULL COMMENT '物品奖励',
  `prerequisite_quest` int(11) DEFAULT NULL COMMENT '前置任务 ID',
  `is_repeatable` tinyint(1) DEFAULT '0' COMMENT '是否可重复',
  `repeat_interval_hours` int(11) DEFAULT '24' COMMENT '重复间隔（小时）',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否启用',
  `sort_order` int(11) DEFAULT '0' COMMENT '排序顺序',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_difficulty` (`difficulty`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COMMENT='任务表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `random_event_logs`
--

DROP TABLE IF EXISTS `random_event_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `random_event_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `event_id` int(10) unsigned NOT NULL,
  `event_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `affected_users` text COLLATE utf8mb4_unicode_ci COMMENT '受影响的用户列表 (JSON)',
  `triggered_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_event` (`event_id`),
  KEY `idx_type` (`event_type`),
  KEY `idx_triggered` (`triggered_at`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='随机事件触发记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `random_events`
--

DROP TABLE IF EXISTS `random_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `random_events` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `event_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '事件名称',
  `event_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '事件类型：weather/fortune/disaster/blessing/mystery/robbery',
  `message_template` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '消息模板',
  `effect_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'none' COMMENT '效果类型：none/silver/neili/tili/wugong/all',
  `effect_value_min` int(11) DEFAULT '0' COMMENT '效果最小值',
  `effect_value_max` int(11) DEFAULT '0' COMMENT '效果最大值',
  `probability` int(11) DEFAULT '100' COMMENT '触发概率（权重）',
  `cooldown_minutes` int(11) DEFAULT '30' COMMENT '冷却时间（分钟）',
  `min_grade` int(11) DEFAULT '1' COMMENT '最低触发等级',
  `is_enabled` tinyint(1) DEFAULT '1' COMMENT '是否启用',
  `is_global` tinyint(1) DEFAULT '0' COMMENT '是否全服事件',
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '事件图标',
  `sort_order` int(11) DEFAULT '0' COMMENT '排序',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_event_name` (`event_name`),
  KEY `idx_type` (`event_type`),
  KEY `idx_enabled` (`is_enabled`)
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='随机事件表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `riddles`
--

DROP TABLE IF EXISTS `riddles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `riddles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `question` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `answer` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='猜谜题库';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `secret_skills`
--

DROP TABLE IF EXISTS `secret_skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `secret_skills` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grade` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT '丙' COMMENT '秘籍等级：甲、乙、丙',
  `sect` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '通用' COMMENT '所属门派',
  `type` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '内功' COMMENT '武功类型：内功、外功、轻功、剑法、刀法、拳法、指法',
  `effect` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '武功效果描述',
  `require_level` int(11) DEFAULT '1' COMMENT '修炼所需最低等级',
  `speed_bonus` int(11) NOT NULL DEFAULT '0',
  `neili_bonus` int(11) NOT NULL DEFAULT '0',
  `price` int(11) NOT NULL DEFAULT '0',
  `level` int(11) NOT NULL DEFAULT '1',
  `description` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '武功描述',
  `rarity` enum('common','uncommon','rare','epic','legendary') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'common' COMMENT '稀有度',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='藏经阁武功';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sect_applications`
--

DROP TABLE IF EXISTS `sect_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sect_applications` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sect_id` int(10) unsigned NOT NULL,
  `sect_name` varchar(30) NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `username` varchar(30) NOT NULL,
  `message` text,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `handler_id` int(10) unsigned DEFAULT NULL,
  `handler_username` varchar(30) DEFAULT NULL,
  `reply` text,
  `handled_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sect_id` (`sect_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sect_contributions`
--

DROP TABLE IF EXISTS `sect_contributions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sect_contributions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sect_name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '门派名称',
  `user_id` int(10) unsigned NOT NULL COMMENT '用户 ID',
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名',
  `contribution` int(11) NOT NULL DEFAULT '0' COMMENT '贡献值',
  `reason` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '贡献原因',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sect` (`sect_name`),
  KEY `idx_user` (`user_id`),
  KEY `idx_time` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='门派贡献记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sect_fund_logs`
--

DROP TABLE IF EXISTS `sect_fund_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sect_fund_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sect_id` int(10) unsigned NOT NULL,
  `amount` int(11) NOT NULL,
  `balance` int(11) DEFAULT NULL,
  `reason` varchar(200) DEFAULT NULL,
  `operator_id` int(10) unsigned DEFAULT NULL,
  `operator_username` varchar(30) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sect_id` (`sect_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sect_gardens`
--

DROP TABLE IF EXISTS `sect_gardens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sect_gardens` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sect_id` int(10) unsigned NOT NULL COMMENT '门派 ID',
  `sect_name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '门派名称',
  `level` tinyint(3) unsigned NOT NULL DEFAULT '1' COMMENT '药园等级',
  `capacity` int(11) NOT NULL DEFAULT '20' COMMENT '最大种植位数',
  `contribution_total` bigint(20) NOT NULL DEFAULT '0' COMMENT '累计贡献值',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sect` (`sect_id`),
  KEY `idx_sect_name` (`sect_name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帮派药园';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sect_logs`
--

DROP TABLE IF EXISTS `sect_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sect_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sect_id` int(10) unsigned DEFAULT NULL,
  `sect_name` varchar(30) NOT NULL,
  `username` varchar(30) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `target_username` varchar(30) DEFAULT NULL,
  `details` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sect_id` (`sect_id`),
  KEY `idx_action` (`action`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sect_positions`
--

DROP TABLE IF EXISTS `sect_positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sect_positions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sect_id` int(10) unsigned NOT NULL,
  `position_name` varchar(50) NOT NULL,
  `position_rank` int(11) DEFAULT '0',
  `description` varchar(200) DEFAULT NULL,
  `min_grade` int(11) DEFAULT '1',
  `min_contribution` int(11) DEFAULT '0',
  `salary_amount` int(11) DEFAULT '0',
  `permissions` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sect_id` (`sect_id`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sects`
--

DROP TABLE IF EXISTS `sects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sects` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '门派名称',
  `leader` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '掌门',
  `slogan` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '口号',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '简介',
  `rules` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '门规',
  `member_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '人数',
  `fit_gender` enum('male','female','both') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'both' COMMENT '适合性别',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fund` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='门派';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sheep_pets`
--

DROP TABLE IF EXISTS `sheep_pets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sheep_pets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `happiness` int(11) NOT NULL DEFAULT '0',
  `health` int(11) NOT NULL DEFAULT '0',
  `life` int(11) NOT NULL DEFAULT '0',
  `milk` int(11) NOT NULL DEFAULT '0',
  `hunger` int(11) NOT NULL DEFAULT '0',
  `workload` int(11) NOT NULL DEFAULT '0',
  `cleanliness` int(11) NOT NULL DEFAULT '0',
  `purchased_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_fed_at` datetime DEFAULT NULL,
  `fed_days` int(11) NOT NULL DEFAULT '0',
  `last_login_at` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='宠物羊';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shop_items`
--

DROP TABLE IF EXISTS `shop_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shop_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '物品名称',
  `type` enum('weapon','armor','medicine','poison','other') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '物品类型',
  `attack` int(11) NOT NULL DEFAULT '0' COMMENT '攻击力加成',
  `defense` int(11) NOT NULL DEFAULT '0' COMMENT '防御力加成',
  `neili_bonus` int(11) NOT NULL DEFAULT '0' COMMENT '内力加成',
  `tili_bonus` int(11) NOT NULL DEFAULT '0' COMMENT '体力加成',
  `price` int(11) NOT NULL DEFAULT '0' COMMENT '基础价格',
  `image_file` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '图片文件名',
  `description` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '物品描述',
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用',
  `sort_no` int(11) NOT NULL DEFAULT '0' COMMENT '排序号',
  `stock_quantity` int(11) NOT NULL DEFAULT '999' COMMENT '库存数量',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_shop_item` (`name`,`price`,`type`),
  KEY `idx_type` (`type`),
  KEY `idx_enabled` (`is_enabled`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商店物品';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `special_items`
--

DROP TABLE IF EXISTS `special_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `special_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effect_type` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '特效类型',
  `effect_value` int(11) NOT NULL DEFAULT '0',
  `exp_required` int(11) NOT NULL DEFAULT '0',
  `owner` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '无',
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='特效物品';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `star_pets`
--

DROP TABLE IF EXISTS `star_pets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `star_pets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gender` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hp` int(11) NOT NULL DEFAULT '500',
  `mp` int(11) NOT NULL DEFAULT '100',
  `attack` int(11) NOT NULL DEFAULT '0',
  `defense` int(11) NOT NULL DEFAULT '0',
  `max_hp` int(11) NOT NULL DEFAULT '500',
  `max_mp` int(11) NOT NULL DEFAULT '100',
  `max_attack` int(11) NOT NULL DEFAULT '0',
  `max_defense` int(11) NOT NULL DEFAULT '0',
  `level` int(11) NOT NULL DEFAULT '1',
  `exp` int(11) NOT NULL DEFAULT '0',
  `special_skill` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '无',
  `rage` int(11) NOT NULL DEFAULT '0',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '正常',
  `mother` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stamina` int(11) NOT NULL DEFAULT '0',
  `productivity` int(11) NOT NULL DEFAULT '0',
  `affection` int(11) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='星河宠物';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `system_config`
--

DROP TABLE IF EXISTS `system_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_config` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置键名',
  `value` text COLLATE utf8mb4_unicode_ci COMMENT '配置值',
  `description` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '说明',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=352 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `system_updates`
--

DROP TABLE IF EXISTS `system_updates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_updates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `version` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '版本号 (格式：v1.0.0)',
  `version_code` int(10) unsigned NOT NULL COMMENT '版本号数字 (用于比较，如 10000 代表 v1.0.0)',
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '更新标题',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '更新描述',
  `changes` json DEFAULT NULL COMMENT '更新内容列表 (JSON 数组)',
  `type` enum('major','minor','patch','hotfix') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'patch' COMMENT '更新类型',
  `priority` enum('low','normal','high','critical') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal' COMMENT '优先级',
  `force_update` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否强制更新 (0=否，1=是)',
  `status` enum('draft','released','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft' COMMENT '状态',
  `release_date` datetime DEFAULT NULL COMMENT '发布日期',
  `release_note` text COLLATE utf8mb4_unicode_ci COMMENT '发布说明',
  `breaking_changes` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否有破坏性变更',
  `affected_modules` json DEFAULT NULL COMMENT '受影响的模块列表',
  `rollback_version` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '可回滚的版本',
  `created_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_version` (`version`),
  KEY `idx_version_code` (`version_code`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`),
  KEY `idx_priority` (`priority`),
  KEY `idx_release_date` (`release_date`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统更新日志';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tang_poems`
--

DROP TABLE IF EXISTS `tang_poems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tang_poems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `verse` text COLLATE utf8mb4_unicode_ci COMMENT '诗句',
  `question` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '题目',
  `answer` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '答案',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='唐诗题库';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `update_push_logs`
--

DROP TABLE IF EXISTS `update_push_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `update_push_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `update_id` int(10) unsigned NOT NULL COMMENT '更新 ID',
  `version` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '版本号',
  `environment` enum('development','staging','production') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '环境',
  `server_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '服务器地址',
  `push_status` enum('pending','success','failed','partial') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '推送状态',
  `push_time` datetime DEFAULT NULL COMMENT '推送时间',
  `acknowledge_time` datetime DEFAULT NULL COMMENT '生产端确认时间',
  `acknowledge_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '确认人',
  `rollback_status` enum('none','pending','success','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'none' COMMENT '回滚状态',
  `rollback_time` datetime DEFAULT NULL COMMENT '回滚时间',
  `error_message` text COLLATE utf8mb4_unicode_ci COMMENT '错误信息',
  `metadata` json DEFAULT NULL COMMENT '元数据',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_update_id` (`update_id`),
  KEY `idx_environment` (`environment`),
  KEY `idx_push_status` (`push_status`),
  KEY `idx_push_time` (`push_time`),
  CONSTRAINT `fk_push_update` FOREIGN KEY (`update_id`) REFERENCES `system_updates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='更新推送记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_achievements`
--

DROP TABLE IF EXISTS `user_achievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_achievements` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `achievement_id` int(10) unsigned NOT NULL,
  `progress` int(11) NOT NULL DEFAULT '0' COMMENT '当前进度',
  `is_completed` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否完成',
  `achieved_at` datetime DEFAULT NULL COMMENT '达成时间',
  `claimed` tinyint(1) NOT NULL DEFAULT '0' COMMENT '奖励是否已领取',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_achievement` (`user_id`,`achievement_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_achievement` (`achievement_id`)
) ENGINE=InnoDB AUTO_INCREMENT=291 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户成就';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_cards`
--

DROP TABLE IF EXISTS `user_cards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_cards` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `card_name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` tinyint(3) unsigned NOT NULL DEFAULT '1' COMMENT '面值(上限99)',
  `description` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卡片持有';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_diner_items`
--

DROP TABLE IF EXISTS `user_diner_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_diner_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `power` int(11) NOT NULL DEFAULT '0',
  `stamina` int(11) NOT NULL DEFAULT '0',
  `level_req` int(11) NOT NULL DEFAULT '0',
  `quantity` int(11) NOT NULL DEFAULT '0',
  `price` int(11) NOT NULL DEFAULT '0',
  `purchased_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户酒菜';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_event_logs`
--

DROP TABLE IF EXISTS `user_event_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_event_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `event_id` int(10) unsigned NOT NULL,
  `event_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effect_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `effect_value` int(11) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_event` (`event_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户事件记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_fortunes`
--

DROP TABLE IF EXISTS `user_fortunes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_fortunes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fortune_type` enum('great_luck','medium_luck','small_luck','small_misfortune','misfortune') COLLATE utf8mb4_unicode_ci NOT NULL,
  `fortune_title` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fortune_desc` text COLLATE utf8mb4_unicode_ci,
  `fortune_date` date NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_date` (`username`,`fortune_date`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户运势';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_insurances`
--

DROP TABLE IF EXISTS `user_insurances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_insurances` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `insurance_name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_days` int(11) NOT NULL DEFAULT '0',
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户保险';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_ip_logs`
--

DROP TABLE IF EXISTS `user_ip_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_ip_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'IP 地址',
  `ip_type` enum('register','login','logout') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'login' COMMENT 'IP 类型',
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '浏览器信息',
  `login_status` enum('success','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'success' COMMENT '登录状态',
  `reason` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '失败原因',
  `country` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '国家',
  `region` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '省份',
  `city` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '城市',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_ip_address` (`ip_address`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_username` (`username`),
  KEY `idx_login_status` (`login_status`),
  CONSTRAINT `user_ip_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户 IP 记录历史表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_level_config`
--

DROP TABLE IF EXISTS `user_level_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_level_config` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `level` tinyint(3) unsigned NOT NULL COMMENT '等级 (1-10)',
  `required_exp` bigint(20) NOT NULL COMMENT '升级所需经验',
  `max_daily_chat_exp` int(11) NOT NULL DEFAULT '500' COMMENT '每日聊天经验上限',
  `chat_exp_per_minute` int(11) NOT NULL DEFAULT '1' COMMENT '每分钟聊天获得经验',
  `can_be_admin` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否可担任管理员',
  `min_register_days` int(11) NOT NULL DEFAULT '0' COMMENT '最少注册天数要求',
  `min_total_exp` bigint(20) NOT NULL DEFAULT '0' COMMENT '最少总经验要求',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_level` (`level`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户等级配置';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_quests`
--

DROP TABLE IF EXISTS `user_quests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_quests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quest_id` int(10) unsigned NOT NULL,
  `status` enum('available','in_progress','completed','claimed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `progress` int(11) NOT NULL DEFAULT '0' COMMENT '当前进度',
  `completed_count` int(11) NOT NULL DEFAULT '0' COMMENT '完成次数 (日常任务)',
  `last_completed_date` date DEFAULT NULL COMMENT '最后完成日期',
  `completed_at` datetime DEFAULT NULL,
  `claimed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_quest` (`user_id`,`quest_id`),
  KEY `idx_status` (`status`),
  KEY `idx_quest` (`quest_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户任务进度';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_random_events`
--

DROP TABLE IF EXISTS `user_random_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_random_events` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_id` int(10) unsigned NOT NULL,
  `effect_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `effect_value` int(11) DEFAULT '0',
  `triggered_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_event` (`event_id`),
  KEY `idx_triggered` (`triggered_at`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户随机事件记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_work_logs`
--

DROP TABLE IF EXISTS `user_work_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_work_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `job_id` int(10) unsigned NOT NULL,
  `job_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reward` int(11) NOT NULL DEFAULT '0' COMMENT '获得奖励',
  `stamina_cost` int(11) NOT NULL DEFAULT '0' COMMENT '消耗体力',
  `worked_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_time` (`user_id`,`worked_at`),
  KEY `idx_job_time` (`job_id`,`worked_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打工记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名(原姓名)',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码(bcrypt哈希)',
  `force_password_change` tinyint(1) DEFAULT '0' COMMENT '强制修改密码标志',
  `password_answer` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '密保答案',
  `gender` enum('male','female') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'male' COMMENT '性别',
  `referrer` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '介绍人',
  `email` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '信箱',
  `avatar` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '1.gif' COMMENT '头像文件名',
  `status` enum('normal','jailed','banned','dead','inn','sleeping','poisoned') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal' COMMENT '状态',
  `room_id` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '当前房间编号',
  `neili` int(11) NOT NULL DEFAULT '0' COMMENT '内力(MP)',
  `max_neili` int(10) unsigned NOT NULL DEFAULT '100' COMMENT '最大内力',
  `speed` int(10) unsigned NOT NULL DEFAULT '10' COMMENT '轻功速度',
  `wugong` int(11) NOT NULL DEFAULT '0' COMMENT '武功值',
  `tili` int(11) NOT NULL DEFAULT '30' COMMENT '体力',
  `attack` int(11) NOT NULL DEFAULT '10' COMMENT '攻击',
  `defense` int(11) NOT NULL DEFAULT '10' COMMENT '防御',
  `charm` int(11) NOT NULL DEFAULT '100' COMMENT '魅力',
  `attack_power` int(11) NOT NULL DEFAULT '100' COMMENT '战斗攻击力',
  `spouse` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '无' COMMENT '配偶',
  `is_vip` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否会员',
  `silver` bigint(20) NOT NULL DEFAULT '0' COMMENT '银两',
  `exp` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '经验值',
  `sect` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '无' COMMENT '门派',
  `faction` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '无' COMMENT '帮派',
  `sect_title` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '无' COMMENT '门派身份(掌门/弟子等)',
  `sect_position` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '无',
  `sect_contribution` int(11) DEFAULT '0',
  `salary_time` datetime DEFAULT NULL COMMENT '领薪时间(原金钱)',
  `deposit` bigint(20) NOT NULL DEFAULT '0' COMMENT '存款',
  `grade` tinyint(3) unsigned NOT NULL DEFAULT '1' COMMENT '等级1-10',
  `login_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '登录次数',
  `registered_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `register_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '注册 IP',
  `last_login_at` datetime DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '最后登录 IP',
  `last_kick_at` datetime DEFAULT NULL COMMENT '最后被踢时间',
  `total_exp` bigint(20) NOT NULL DEFAULT '0' COMMENT '总经验值',
  `month_value` bigint(20) NOT NULL DEFAULT '0',
  `last_practice_at` datetime DEFAULT NULL COMMENT '最后修炼时间',
  `practice_count_today` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '今日修炼次数',
  `practice_exp_total` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '修炼累计经验',
  `chat_minutes_today` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '今日聊天分钟数',
  `chat_minutes_total` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '累计聊天分钟数',
  `last_chat_time` datetime DEFAULT NULL COMMENT '最后聊天时间',
  `monthly_exp` bigint(20) NOT NULL DEFAULT '0' COMMENT '月度经验值',
  `all_value` bigint(20) NOT NULL DEFAULT '0',
  `join_sect_at` datetime DEFAULT NULL COMMENT '入派时间',
  `jailed_at` datetime DEFAULT NULL COMMENT '入监日期',
  `job` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '职业',
  `bath_date` date DEFAULT NULL COMMENT '最后洗澡日期',
  `master` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '师父',
  `noodle_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '吃面数',
  `pet_name` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '宠物名称',
  `vip_expires_at` datetime DEFAULT NULL COMMENT '会员到期时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_status` (`status`),
  KEY `idx_sect` (`sect`),
  KEY `idx_grade` (`grade`),
  KEY `idx_all_value` (`total_exp`),
  KEY `idx_last_login` (`last_login_at`),
  KEY `idx_month_value` (`monthly_exp`),
  KEY `idx_total_exp` (`total_exp`),
  KEY `idx_monthly_exp` (`monthly_exp`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wishes`
--

DROP TABLE IF EXISTS `wishes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wishes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `homepage` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wish_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '爱情/学业/健康/家庭/事业/前途/财运/生活',
  `address` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `is_public` tinyint(1) DEFAULT '1',
  `reply` text COLLATE utf8mb4_unicode_ci,
  `reply_at` datetime DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `view_count` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_public` (`is_public`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='许愿墙';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `work_jobs`
--

DROP TABLE IF EXISTS `work_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `work_jobs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `job_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '工作名称',
  `job_desc` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '工作描述',
  `reward_min` int(11) NOT NULL DEFAULT '0' COMMENT '最低奖励',
  `reward_max` int(11) NOT NULL DEFAULT '0' COMMENT '最高奖励',
  `stamina_cost` int(11) NOT NULL DEFAULT '0' COMMENT '体力消耗',
  `cooldown_minutes` int(11) NOT NULL DEFAULT '0' COMMENT '冷却时间 (分钟)',
  `max_daily_times` int(11) NOT NULL DEFAULT '0' COMMENT '每日次数限制 (0=不限)',
  `min_grade` tinyint(3) unsigned NOT NULL DEFAULT '1' COMMENT '最低等级要求',
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用',
  `sort_no` int(11) NOT NULL DEFAULT '0' COMMENT '排序号',
  PRIMARY KEY (`id`),
  KEY `idx_enabled` (`is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打工工作';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-26 17:11:49
