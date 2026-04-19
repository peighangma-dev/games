SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(20) NOT NULL COMMENT '用户名(原姓名)',
  `password` VARCHAR(255) NOT NULL COMMENT '密码(bcrypt哈希)',
  `password_answer` VARCHAR(255) DEFAULT NULL COMMENT '密保答案',
  `gender` ENUM('male','female') NOT NULL DEFAULT 'male' COMMENT '性别',
  `referrer` VARCHAR(20) DEFAULT NULL COMMENT '介绍人',
  `email` VARCHAR(60) DEFAULT NULL COMMENT '信箱',
  `avatar` VARCHAR(100) DEFAULT '1.gif' COMMENT '头像文件名',
  `status` ENUM('normal','jailed','banned','dead','inn','sleeping','poisoned') NOT NULL DEFAULT 'normal' COMMENT '状态',
  `room_id` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '当前房间编号',
  `neili` INT NOT NULL DEFAULT 0 COMMENT '内力(MP)',
  `wugong` INT NOT NULL DEFAULT 0 COMMENT '武功值',
  `tili` INT NOT NULL DEFAULT 30 COMMENT '体力',
  `attack` INT NOT NULL DEFAULT 10 COMMENT '攻击',
  `defense` INT NOT NULL DEFAULT 10 COMMENT '防御',
  `charm` INT NOT NULL DEFAULT 100 COMMENT '魅力',
  `attack_power` INT NOT NULL DEFAULT 100 COMMENT '战斗攻击力',
  `spouse` VARCHAR(20) DEFAULT '无' COMMENT '配偶',
  `is_vip` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否会员',
  `silver` BIGINT NOT NULL DEFAULT 0 COMMENT '银两',
  `sect` VARCHAR(20) DEFAULT '无' COMMENT '门派',
  `faction` VARCHAR(20) DEFAULT '无' COMMENT '帮派',
  `sect_title` VARCHAR(20) DEFAULT '无' COMMENT '门派身份(掌门/弟子等)',
  `salary_time` DATETIME DEFAULT NULL COMMENT '领薪时间(原金钱)',
  `deposit` BIGINT NOT NULL DEFAULT 0 COMMENT '存款',
  `grade` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '等级1-10',
  `login_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '登录次数',
  `registered_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `register_ip` VARCHAR(45) DEFAULT NULL COMMENT '注册IP',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(45) DEFAULT NULL COMMENT '最后登录IP',
  `last_kick_at` DATETIME DEFAULT NULL COMMENT '最后被踢时间',
  `all_value` INT NOT NULL DEFAULT 0 COMMENT '总经验值',
  `month_value` INT NOT NULL DEFAULT 0 COMMENT '月经验值',
  `join_sect_at` DATETIME DEFAULT NULL COMMENT '入派时间',
  `jailed_at` DATETIME DEFAULT NULL COMMENT '入监日期',
  `job` VARCHAR(20) DEFAULT NULL COMMENT '职业',
  `bath_date` DATE DEFAULT NULL COMMENT '最后洗澡日期',
  `master` VARCHAR(20) DEFAULT NULL COMMENT '师父',
  `noodle_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '吃面数',
  `pet_name` VARCHAR(20) DEFAULT NULL COMMENT '宠物名称',
  `vip_expires_at` DATETIME DEFAULT NULL COMMENT '会员到期时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_status` (`status`),
  KEY `idx_sect` (`sect`),
  KEY `idx_grade` (`grade`),
  KEY `idx_all_value` (`all_value`),
  KEY `idx_last_login` (`last_login_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

CREATE TABLE IF NOT EXISTS `system_config` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '配置键名',
  `value` TEXT COMMENT '配置值',
  `description` VARCHAR(200) DEFAULT NULL COMMENT '说明',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置';

CREATE TABLE IF NOT EXISTS `sects` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL COMMENT '门派名称',
  `leader` VARCHAR(20) DEFAULT NULL COMMENT '掌门',
  `slogan` VARCHAR(100) DEFAULT NULL COMMENT '口号',
  `description` TEXT COMMENT '简介',
  `rules` VARCHAR(100) DEFAULT NULL COMMENT '门规',
  `member_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '人数',
  `fit_gender` ENUM('male','female','both') NOT NULL DEFAULT 'both' COMMENT '适合性别',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='门派';

CREATE TABLE IF NOT EXISTS `ip_locks` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ip` VARCHAR(45) NOT NULL,
  `locked_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '锁定时间',
  `locked_by` VARCHAR(20) NOT NULL COMMENT '操作者',
  `expires_at` DATETIME NOT NULL COMMENT '自动解封时间',
  PRIMARY KEY (`id`),
  KEY `idx_ip` (`ip`),
  KEY `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='IP临时锁定';

CREATE TABLE IF NOT EXISTS `ip_bans` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ip_pattern` VARCHAR(45) NOT NULL COMMENT 'IP或通配符(如10.%)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='IP永久封锁';

CREATE TABLE IF NOT EXISTS `operation_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `log_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `operator` VARCHAR(20) NOT NULL,
  `ip` VARCHAR(45) DEFAULT NULL,
  `action` TEXT NOT NULL COMMENT '操作描述',
  `is_expired` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_time` (`log_time`),
  KEY `idx_operator` (`operator`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志';

CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `receiver` VARCHAR(20) NOT NULL COMMENT '收件人',
  `sender` VARCHAR(20) NOT NULL COMMENT '发件人',
  `title` VARCHAR(200) NOT NULL,
  `content` TEXT,
  `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_receiver` (`receiver`, `is_read`),
  KEY `idx_sender` (`sender`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站内邮件';

CREATE TABLE IF NOT EXISTS `news` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `topic` VARCHAR(200) NOT NULL,
  `content` TEXT,
  `author` VARCHAR(20) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `view_count` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_time` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='新闻公告';

CREATE TABLE IF NOT EXISTS `marriages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `proposer` VARCHAR(20) NOT NULL COMMENT '求婚方',
  `target` VARCHAR(20) NOT NULL COMMENT '被求婚方',
  `message` TEXT COMMENT '求婚说明',
  `proposed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_expired` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='婚姻登记';

CREATE TABLE IF NOT EXISTS `chat_actions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `action_type` VARCHAR(10) NOT NULL DEFAULT '1' COMMENT '1=系统自动',
  `name` VARCHAR(50) DEFAULT NULL COMMENT '动作名',
  `template` TEXT NOT NULL COMMENT '动作模板(##=发言者,%%=对象)',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天动作库';

CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `content` TEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告置顶';

CREATE TABLE IF NOT EXISTS `shop_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '物品名称',
  `type` ENUM('weapon', 'armor', 'medicine', 'poison', 'other') NOT NULL COMMENT '物品类型',
  `attack` INT NOT NULL DEFAULT 0 COMMENT '攻击力加成',
  `defense` INT NOT NULL DEFAULT 0 COMMENT '防御力加成',
  `neili_bonus` INT NOT NULL DEFAULT 0 COMMENT '内力加成',
  `tili_bonus` INT NOT NULL DEFAULT 0 COMMENT '体力加成',
  `price` INT NOT NULL DEFAULT 0 COMMENT '基础价格',
  `image_file` VARCHAR(50) DEFAULT NULL COMMENT '图片文件名',
  `description` VARCHAR(200) DEFAULT NULL COMMENT '物品描述',
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `sort_no` INT NOT NULL DEFAULT 0 COMMENT '排序号',
  `stock_quantity` INT NOT NULL DEFAULT 999 COMMENT '库存数量',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_enabled` (`is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商店物品';

CREATE TABLE IF NOT EXISTS `items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '物品名',
  `owner` VARCHAR(20) DEFAULT '无' COMMENT '拥有者',
  `type` VARCHAR(20) DEFAULT NULL COMMENT '类型',
  `attack` INT NOT NULL DEFAULT 0,
  `defense` INT NOT NULL DEFAULT 0,
  `sort_no` INT DEFAULT NULL COMMENT '编号',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT '数量/面值',
  `amount` INT DEFAULT NULL COMMENT '物品数量',
  `is_equipped` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否装备',
  `neili_bonus` INT NOT NULL DEFAULT 0 COMMENT '内力加成',
  `tili_bonus` INT NOT NULL DEFAULT 0 COMMENT '体力加成',
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物品';

CREATE TABLE IF NOT EXISTS `special_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `effect_type` VARCHAR(30) DEFAULT NULL COMMENT '特效类型',
  `effect_value` INT NOT NULL DEFAULT 0,
  `exp_required` INT NOT NULL DEFAULT 0,
  `owner` VARCHAR(20) DEFAULT '无',
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='特效物品';

CREATE TABLE IF NOT EXISTS `card_templates` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL COMMENT '卡片名称',
  `description` VARCHAR(200) DEFAULT NULL COMMENT '功能说明',
  `price` INT NOT NULL DEFAULT 0 COMMENT '需要银两',
  `card_type` ENUM('normal','vip') NOT NULL DEFAULT 'normal',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卡片商品';

CREATE TABLE IF NOT EXISTS `user_cards` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `card_name` VARCHAR(30) NOT NULL,
  `owner` VARCHAR(20) NOT NULL,
  `quantity` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '面值(上限99)',
  `description` VARCHAR(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卡片持有';

CREATE TABLE IF NOT EXISTS `martial_arts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL COMMENT '武功名称',
  `sect` VARCHAR(20) DEFAULT NULL COMMENT '所属门派',
  `neili_cost` INT NOT NULL DEFAULT 0 COMMENT '需要内力',
  `is_timed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否时效性',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='武功';

CREATE TABLE IF NOT EXISTS `kill_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `victim` VARCHAR(20) NOT NULL,
  `killer` VARCHAR(20) NOT NULL,
  `skill` VARCHAR(30) DEFAULT NULL COMMENT '使用的武功',
  `killed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_expired` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_time` (`killed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='击杀记录';

CREATE TABLE IF NOT EXISTS `market_listings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `seller` VARCHAR(20) NOT NULL,
  `item_name` VARCHAR(50) NOT NULL,
  `item_type` VARCHAR(20) DEFAULT NULL,
  `power` INT NOT NULL DEFAULT 0,
  `stamina` INT NOT NULL DEFAULT 0,
  `level_req` INT NOT NULL DEFAULT 0,
  `quantity` INT NOT NULL DEFAULT 1,
  `original_price` INT NOT NULL DEFAULT 0,
  `selling_price` INT NOT NULL DEFAULT 0,
  `listed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='二手市场';

CREATE TABLE IF NOT EXISTS `insurance_products` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL,
  `description` VARCHAR(200) DEFAULT NULL,
  `duration_days` INT NOT NULL DEFAULT 0,
  `price` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='保险产品';

CREATE TABLE IF NOT EXISTS `work_jobs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `job_name` VARCHAR(50) NOT NULL COMMENT '工作名称',
  `job_desc` VARCHAR(200) DEFAULT NULL COMMENT '工作描述',
  `reward_min` INT NOT NULL DEFAULT 0 COMMENT '最低奖励',
  `reward_max` INT NOT NULL DEFAULT 0 COMMENT '最高奖励',
  `stamina_cost` INT NOT NULL DEFAULT 0 COMMENT '体力消耗',
  `cooldown_minutes` INT NOT NULL DEFAULT 0 COMMENT '冷却时间 (分钟)',
  `max_daily_times` INT NOT NULL DEFAULT 0 COMMENT '每日次数限制 (0=不限)',
  `min_grade` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '最低等级要求',
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `sort_no` INT NOT NULL DEFAULT 0 COMMENT '排序号',
  PRIMARY KEY (`id`),
  KEY `idx_enabled` (`is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打工工作';

CREATE TABLE IF NOT EXISTS `user_work_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `job_id` INT UNSIGNED NOT NULL,
  `job_name` VARCHAR(50) NOT NULL,
  `reward` INT NOT NULL DEFAULT 0 COMMENT '获得奖励',
  `stamina_cost` INT NOT NULL DEFAULT 0 COMMENT '消耗体力',
  `worked_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_time` (`user_id`, `worked_at`),
  KEY `idx_job_time` (`job_id`, `worked_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打工记录';

CREATE TABLE IF NOT EXISTS `user_insurances` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `insurance_name` VARCHAR(30) NOT NULL,
  `owner` VARCHAR(20) NOT NULL,
  `duration_days` INT NOT NULL DEFAULT 0,
  `expires_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户保险';

CREATE TABLE IF NOT EXISTS `alchemy_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL,
  `owner` VARCHAR(20) DEFAULT '无',
  `quantity` INT NOT NULL DEFAULT 0,
  `potency` INT NOT NULL DEFAULT 0 COMMENT '药效',
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`),
  UNIQUE KEY `uk_name_owner` (`name`, `owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配药物品';

CREATE TABLE IF NOT EXISTS `alchemy_furnaces` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner` VARCHAR(20) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否正在炼制',
  `cooldown_minutes` INT NOT NULL DEFAULT 10 COMMENT '冷却时间 (分钟)',
  `last_craft_time` DATETIME DEFAULT NULL COMMENT '上次炼制时间',
  `craft_start_time` DATETIME DEFAULT NULL COMMENT '本次炼制开始时间',
  `craft_recipe_id` INT UNSIGNED DEFAULT NULL COMMENT '当前炼制药方 ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='炼丹炉';

CREATE TABLE IF NOT EXISTS `alchemy_recipes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL COMMENT '药品名称',
  `description` VARCHAR(200) DEFAULT NULL COMMENT '药品描述',
  `effect_type` ENUM('neili', 'tili', 'wugong', 'charm', 'attack', 'defense', 'all') NOT NULL COMMENT '效果类型',
  `effect_value` INT NOT NULL DEFAULT 0 COMMENT '效果值',
  `materials` TEXT NOT NULL COMMENT '材料配方 (JSON)',
  `success_rate` INT NOT NULL DEFAULT 100 COMMENT '成功率 (%)',
  `level` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '需要等级',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='炼丹配方';

CREATE TABLE IF NOT EXISTS `alchemy_quests` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `npc_id` TINYINT UNSIGNED NOT NULL COMMENT 'NPC ID',
  `npc_name` VARCHAR(20) NOT NULL COMMENT 'NPC 名称',
  `npc_icon` VARCHAR(10) DEFAULT '👨‍⚕️' COMMENT 'NPC 图标',
  `quest_type` ENUM('daily', 'normal') NOT NULL DEFAULT 'normal' COMMENT '任务类型',
  `title` VARCHAR(50) NOT NULL COMMENT '任务标题',
  `description` TEXT COMMENT '任务描述',
  `quest_category` ENUM('craft', 'gather') NOT NULL COMMENT '任务分类',
  `target_item` VARCHAR(30) DEFAULT NULL COMMENT '目标物品',
  `target_count` INT NOT NULL DEFAULT 1 COMMENT '目标数量',
  `requirement_level` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '等级要求',
  `reward_silver` INT NOT NULL DEFAULT 0 COMMENT '银两奖励',
  `reward_exp` INT NOT NULL DEFAULT 0 COMMENT '经验奖励',
  `reward_item` VARCHAR(30) DEFAULT NULL COMMENT '物品奖励',
  `reward_item_count` INT NOT NULL DEFAULT 0 COMMENT '物品奖励数量',
  `reward_contribution` INT NOT NULL DEFAULT 0 COMMENT '贡献奖励',
  `is_daily` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否日常任务',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否可用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_npc` (`npc_name`),
  KEY `idx_type` (`quest_type`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='炼丹任务';

CREATE TABLE IF NOT EXISTS `user_quests` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `quest_id` INT UNSIGNED NOT NULL,
  `status` ENUM('available', 'in_progress', 'completed', 'claimed') NOT NULL DEFAULT 'available',
  `progress` INT NOT NULL DEFAULT 0 COMMENT '当前进度',
  `completed_count` INT NOT NULL DEFAULT 0 COMMENT '完成次数 (日常任务)',
  `last_completed_date` DATE DEFAULT NULL COMMENT '最后完成日期',
  `completed_at` DATETIME DEFAULT NULL,
  `claimed_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_quest` (`user_id`, `quest_id`),
  KEY `idx_status` (`status`),
  KEY `idx_quest` (`quest_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户任务进度';

CREATE TABLE IF NOT EXISTS `sect_gardens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sect_id` INT UNSIGNED NOT NULL COMMENT '门派 ID',
  `sect_name` VARCHAR(20) NOT NULL COMMENT '门派名称',
  `level` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '药园等级',
  `capacity` INT NOT NULL DEFAULT 20 COMMENT '最大种植位数',
  `contribution_total` BIGINT NOT NULL DEFAULT 0 COMMENT '累计贡献值',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sect` (`sect_id`),
  KEY `idx_sect_name` (`sect_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帮派药园';

CREATE TABLE IF NOT EXISTS `garden_plots` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `garden_id` INT UNSIGNED NOT NULL COMMENT '药园 ID',
  `plot_number` TINYINT UNSIGNED NOT NULL COMMENT '地块编号',
  `plant_id` INT UNSIGNED DEFAULT NULL COMMENT '种植的植物 ID',
  `plant_name` VARCHAR(30) DEFAULT NULL COMMENT '植物名称',
  `planter_id` INT UNSIGNED DEFAULT NULL COMMENT '种植者 ID',
  `planter_username` VARCHAR(20) DEFAULT NULL COMMENT '种植者用户名',
  `planted_at` DATETIME DEFAULT NULL COMMENT '种植时间',
  `growth_stage` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '生长阶段 0-4',
  `growth_progress` INT NOT NULL DEFAULT 0 COMMENT '生长进度 0-100',
  `ready_at` DATETIME DEFAULT NULL COMMENT '成熟时间',
  `is_harvested` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已收获',
  `harvested_at` DATETIME DEFAULT NULL COMMENT '收获时间',
  `harvester_username` VARCHAR(20) DEFAULT NULL COMMENT '收获者',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_garden_plot` (`garden_id`, `plot_number`),
  KEY `idx_plant` (`plant_id`),
  KEY `idx_planter` (`planter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='药园地块';

CREATE TABLE IF NOT EXISTS `garden_plants` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL COMMENT '植物名称',
  `seed_name` VARCHAR(30) NOT NULL COMMENT '种子名称',
  `harvest_item` VARCHAR(30) NOT NULL COMMENT '收获物品',
  `min_sect_level` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '最低药园等级',
  `growth_time_minutes` INT NOT NULL DEFAULT 60 COMMENT '生长时间 (分钟)',
  `growth_stages` TINYINT UNSIGNED NOT NULL DEFAULT 4 COMMENT '生长阶段数',
  `harvest_quantity_min` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '最少收获数量',
  `harvest_quantity_max` TINYINT UNSIGNED NOT NULL DEFAULT 3 COMMENT '最多收获数量',
  `seed_cost` INT NOT NULL DEFAULT 100 COMMENT '种子成本 (银两)',
  `harvest_value` INT NOT NULL DEFAULT 200 COMMENT '收获价值 (银两)',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='药园植物配置';

CREATE TABLE IF NOT EXISTS `garden_records` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `sect_id` INT UNSIGNED NOT NULL,
  `action_type` ENUM('plant', 'water', 'harvest') NOT NULL COMMENT '操作类型',
  `plant_name` VARCHAR(30) DEFAULT NULL COMMENT '植物名称',
  `plot_number` TINYINT UNSIGNED DEFAULT NULL COMMENT '地块编号',
  `contribution_earned` INT NOT NULL DEFAULT 0 COMMENT '获得贡献',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_sect` (`sect_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='药园操作记录';

CREATE TABLE IF NOT EXISTS `inn_records` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `registrant` VARCHAR(20) NOT NULL,
  `partner` VARCHAR(20) NOT NULL,
  `message` TEXT,
  `registered_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客栈记录';

CREATE TABLE IF NOT EXISTS `birth_records` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL,
  `partner` VARCHAR(20) NOT NULL,
  `born_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生育记录';

CREATE TABLE IF NOT EXISTS `pregnancies` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL,
  `conceived_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='怀孕记录';

CREATE TABLE IF NOT EXISTS `bounties` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `target` VARCHAR(20) NOT NULL,
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='悬赏';

CREATE TABLE IF NOT EXISTS `fishing_states` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  `started_at` DATETIME DEFAULT NULL,
  `last_fished_at` DATETIME DEFAULT NULL,
  `cooldown_minutes` INT NOT NULL DEFAULT 30,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钓鱼状态';

CREATE TABLE IF NOT EXISTS `fishing_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_name` VARCHAR(30) NOT NULL COMMENT '物品名称',
  `item_type` ENUM('食材', '药材', '暗器', '杂物') NOT NULL DEFAULT '食材' COMMENT '物品类型',
  `effect_neili` INT NOT NULL DEFAULT 0 COMMENT '内力效果',
  `effect_tili` INT NOT NULL DEFAULT 0 COMMENT '体力效果',
  `silver_value` INT NOT NULL DEFAULT 0 COMMENT '出售价格',
  `rarities` ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') NOT NULL DEFAULT 'common' COMMENT '稀有度',
  `image_file` VARCHAR(50) DEFAULT NULL COMMENT '图片文件',
  `description` VARCHAR(100) DEFAULT NULL COMMENT '物品描述',
  PRIMARY KEY (`id`),
  KEY `idx_rarity` (`rarities`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钓鱼物品配置';

CREATE TABLE IF NOT EXISTS `fishing_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `item_name` VARCHAR(30) NOT NULL,
  `item_type` VARCHAR(20) DEFAULT NULL,
  `effect_value` INT NOT NULL DEFAULT 0,
  `silver_reward` INT NOT NULL DEFAULT 0,
  `rarities` ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') NOT NULL DEFAULT 'common',
  `fished_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_username` (`username`),
  KEY `idx_fished_at` (`fished_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钓鱼记录';

CREATE TABLE IF NOT EXISTS `user_fortunes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `fortune_type` ENUM('great_luck', 'medium_luck', 'small_luck', 'small_misfortune', 'misfortune') NOT NULL,
  `fortune_title` VARCHAR(20) NOT NULL,
  `fortune_desc` TEXT,
  `fortune_date` DATE NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_date` (`username`, `fortune_date`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户运势';

CREATE TABLE IF NOT EXISTS `mining_states` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_mined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cooldown_minutes` INT NOT NULL DEFAULT 60,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='挖矿状态';

CREATE TABLE IF NOT EXISTS `mining_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `item_name` VARCHAR(50) NOT NULL,
  `item_type` VARCHAR(20) NOT NULL,
  `effect_neili` INT DEFAULT 0,
  `effect_tili` INT DEFAULT 0,
  `silver_value` INT DEFAULT 0,
  `rarities` VARCHAR(20) NOT NULL,
  `image_file` VARCHAR(100) DEFAULT 'ore_common.gif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='挖矿物品';

CREATE TABLE IF NOT EXISTS `mining_records` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `item_name` VARCHAR(50) NOT NULL,
  `item_type` VARCHAR(20) NOT NULL,
  `effect_value` INT DEFAULT 0,
  `silver_reward` INT DEFAULT 0,
  `rarities` VARCHAR(20) NOT NULL,
  `mined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_time` (`mined_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='挖矿记录';

CREATE TABLE IF NOT EXISTS `hunting_states` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `type` VARCHAR(10) NOT NULL COMMENT 'work 或 hunt',
  `job_name` VARCHAR(50) DEFAULT NULL COMMENT '打工职业名称',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_completed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cooldown_minutes` INT NOT NULL DEFAULT 0,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_active` (`is_active`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='狩猎状态';

CREATE TABLE IF NOT EXISTS `hunting_records` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `type` VARCHAR(10) NOT NULL COMMENT 'work 或 hunt',
  `job_name` VARCHAR(50) DEFAULT NULL,
  `item_name` VARCHAR(50) DEFAULT NULL,
  `item_type` VARCHAR(20) DEFAULT NULL,
  `reward_silver` INT DEFAULT 0,
  `reward_exp` INT DEFAULT 0,
  `is_success` TINYINT(1) DEFAULT 0,
  `rarities` VARCHAR(20) DEFAULT 'common',
  `completed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_time` (`completed_at`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='狩猎记录';

CREATE TABLE IF NOT EXISTS `hunting_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `item_name` VARCHAR(50) NOT NULL,
  `item_type` VARCHAR(20) NOT NULL,
  `effect_neili` INT DEFAULT 0,
  `effect_tili` INT DEFAULT 0,
  `silver_value` INT DEFAULT 0,
  `rarities` VARCHAR(20) NOT NULL,
  `image_file` VARCHAR(100) DEFAULT 'hunt_common.gif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='狩猎物品';

CREATE TABLE IF NOT EXISTS `noodle_ingredients` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL,
  `nutrition` INT NOT NULL DEFAULT 0,
  `flavor` INT NOT NULL DEFAULT 0,
  `price` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='面菜食材';

CREATE TABLE IF NOT EXISTS `noodle_bowls` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner` VARCHAR(20) NOT NULL,
  `seasoning` VARCHAR(100) DEFAULT NULL COMMENT '调料组合',
  `price` INT NOT NULL DEFAULT 0,
  `is_done` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='做面记录';

CREATE TABLE IF NOT EXISTS `diner_menu` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL,
  `category` VARCHAR(20) DEFAULT '酒菜',
  `power` INT NOT NULL DEFAULT 0,
  `stamina` INT NOT NULL DEFAULT 0,
  `level_req` INT NOT NULL DEFAULT 0,
  `quantity` INT NOT NULL DEFAULT 0,
  `price` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='酒菜菜单';

CREATE TABLE IF NOT EXISTS `user_diner_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL,
  `owner` VARCHAR(20) NOT NULL,
  `category` VARCHAR(20) DEFAULT NULL,
  `power` INT NOT NULL DEFAULT 0,
  `stamina` INT NOT NULL DEFAULT 0,
  `level_req` INT NOT NULL DEFAULT 0,
  `quantity` INT NOT NULL DEFAULT 0,
  `price` INT NOT NULL DEFAULT 0,
  `purchased_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户酒菜';

CREATE TABLE IF NOT EXISTS `learned_skills` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `skill_name` VARCHAR(30) NOT NULL,
  `owner` VARCHAR(20) NOT NULL,
  `neili_bonus` INT NOT NULL DEFAULT 0,
  `speed_bonus` INT NOT NULL DEFAULT 0,
  `level` INT NOT NULL DEFAULT 1,
  `learned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='已学武功';

CREATE TABLE IF NOT EXISTS `star_pets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL,
  `gender` VARCHAR(10) DEFAULT NULL,
  `owner` VARCHAR(20) NOT NULL,
  `hp` INT NOT NULL DEFAULT 500,
  `mp` INT NOT NULL DEFAULT 100,
  `attack` INT NOT NULL DEFAULT 0,
  `defense` INT NOT NULL DEFAULT 0,
  `max_hp` INT NOT NULL DEFAULT 500,
  `max_mp` INT NOT NULL DEFAULT 100,
  `max_attack` INT NOT NULL DEFAULT 0,
  `max_defense` INT NOT NULL DEFAULT 0,
  `level` INT NOT NULL DEFAULT 1,
  `exp` INT NOT NULL DEFAULT 0,
  `special_skill` VARCHAR(30) DEFAULT '无',
  `rage` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(20) DEFAULT '正常',
  `mother` VARCHAR(20) DEFAULT NULL,
  `father` VARCHAR(20) DEFAULT NULL,
  `stamina` INT NOT NULL DEFAULT 0,
  `productivity` INT NOT NULL DEFAULT 0,
  `affection` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='星河宠物';

CREATE TABLE IF NOT EXISTS `mini_pets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL,
  `owner` VARCHAR(20) NOT NULL,
  `attack` INT NOT NULL DEFAULT 0,
  `defense` INT NOT NULL DEFAULT 0,
  `level` INT NOT NULL DEFAULT 1,
  `exp` INT NOT NULL DEFAULT 0,
  `special_skill` VARCHAR(30) DEFAULT NULL,
  `rage` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小型宠物';

CREATE TABLE IF NOT EXISTS `sheep_pets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL,
  `owner` VARCHAR(20) NOT NULL,
  `happiness` INT NOT NULL DEFAULT 0,
  `health` INT NOT NULL DEFAULT 0,
  `life` INT NOT NULL DEFAULT 0,
  `milk` INT NOT NULL DEFAULT 0,
  `hunger` INT NOT NULL DEFAULT 0,
  `workload` INT NOT NULL DEFAULT 0,
  `cleanliness` INT NOT NULL DEFAULT 0,
  `purchased_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_fed_at` DATETIME DEFAULT NULL,
  `fed_days` INT NOT NULL DEFAULT 0,
  `last_login_at` DATE DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='宠物羊';

CREATE TABLE IF NOT EXISTS `pet_init_rules` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `init_clean` INT NOT NULL DEFAULT 0,
  `init_happy` INT NOT NULL DEFAULT 0,
  `init_health` INT NOT NULL DEFAULT 0,
  `init_milk` INT NOT NULL DEFAULT 0,
  `init_life` INT NOT NULL DEFAULT 0,
  `init_hunger` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='宠物初始化参数';

CREATE TABLE IF NOT EXISTS `wishes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL,
  `gender` VARCHAR(10) DEFAULT NULL,
  `email` VARCHAR(60) DEFAULT NULL,
  `homepage` VARCHAR(100) DEFAULT NULL,
  `wish_type` VARCHAR(20) DEFAULT NULL COMMENT '爱情/学业/健康/家庭/事业/前途/财运/生活',
  `address` VARCHAR(100) DEFAULT NULL,
  `content` TEXT,
  `ip` VARCHAR(45) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `view_count` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='许愿墙';

CREATE TABLE IF NOT EXISTS `photos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `jh_name` VARCHAR(20) DEFAULT NULL COMMENT '江湖名',
  `real_name` VARCHAR(30) DEFAULT NULL,
  `gender` VARCHAR(10) DEFAULT NULL,
  `age` INT DEFAULT NULL,
  `address` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(60) DEFAULT NULL,
  `bio` TEXT,
  `is_approved` TINYINT(1) NOT NULL DEFAULT 0,
  `image_data` LONGBLOB DEFAULT NULL COMMENT '照片二进制',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='照片';

CREATE TABLE IF NOT EXISTS `blackjack_games` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(20) NOT NULL,
  `dealer_cards` VARCHAR(30) DEFAULT NULL COMMENT 'z0~z5',
  `dealer_points` INT DEFAULT NULL,
  `player_cards` VARCHAR(30) DEFAULT NULL COMMENT 'u0~u5',
  `player_points` INT DEFAULT NULL,
  `bet` INT NOT NULL DEFAULT 0,
  `wins` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='21点游戏';

CREATE TABLE IF NOT EXISTS `courtesans` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL,
  `beauty` INT NOT NULL DEFAULT 0 COMMENT '美貌度',
  `registered_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='烟花院';

CREATE TABLE IF NOT EXISTS `tang_poems` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `verse` TEXT COMMENT '诗句',
  `question` VARCHAR(200) COMMENT '题目',
  `answer` VARCHAR(100) COMMENT '答案',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='唐诗题库';

CREATE TABLE IF NOT EXISTS `riddles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `question` VARCHAR(200) NOT NULL,
  `answer` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='猜谜题库';

CREATE TABLE IF NOT EXISTS `secret_skills` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL,
  `speed_bonus` INT NOT NULL DEFAULT 0,
  `neili_bonus` INT NOT NULL DEFAULT 0,
  `price` INT NOT NULL DEFAULT 0,
  `level` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='藏经阁武功';

CREATE TABLE IF NOT EXISTS `poll_candidates` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL,
  `vote_count` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投票候选人';

CREATE TABLE IF NOT EXISTS `poll_votes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `voter` VARCHAR(20) NOT NULL,
  `candidate_id` INT UNSIGNED NOT NULL,
  `voted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_voter` (`voter`),
  KEY `idx_candidate` (`candidate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投票记录';

CREATE TABLE IF NOT EXISTS `poll_config` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `start_time` DATETIME DEFAULT NULL,
  `end_time` DATETIME DEFAULT NULL,
  `min_exp` INT NOT NULL DEFAULT 300 COMMENT '经验值门槛',
  `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投票配置';

CREATE TABLE IF NOT EXISTS `chat_rooms` (
  `id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL,
  `min_grade` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '最低等级',
  `max_grade` TINYINT UNSIGNED NOT NULL DEFAULT 10 COMMENT '最高等级(0=不限)',
  `fight_enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'PK开关',
  `sort_order` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天房间';

CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `room_id` TINYINT UNSIGNED NOT NULL,
  `line_no` BIGINT UNSIGNED NOT NULL COMMENT '行号',
  `is_action` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '动作标志',
  `is_private` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '私聊标志',
  `sender` VARCHAR(20) NOT NULL,
  `receiver` VARCHAR(20) DEFAULT '所有人',
  `sender_color` VARCHAR(7) DEFAULT '660099' COMMENT '名字颜色',
  `msg_color` VARCHAR(7) DEFAULT '660099' COMMENT '消息颜色',
  `action_word` VARCHAR(20) DEFAULT NULL COMMENT '动作词',
  `content` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_room_line` (`room_id`, `line_no`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息';

CREATE TABLE IF NOT EXISTS `online_users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `room_id` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `avatar` VARCHAR(100) DEFAULT NULL,
  `gender` ENUM('male','female') NOT NULL DEFAULT 'male',
  `sect` VARCHAR(20) DEFAULT '无',
  `grade` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '等级',
  `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_active_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `socket_id` VARCHAR(50) DEFAULT NULL COMMENT 'Socket.IO 连接 ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`),
  KEY `idx_room` (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='在线用户';

CREATE TABLE IF NOT EXISTS `mute_list` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(20) NOT NULL,
  `muted_by` VARCHAR(20) DEFAULT NULL,
  `muted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME DEFAULT NULL COMMENT 'NULL=永久',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='禁言名单';

CREATE TABLE IF NOT EXISTS `fight_bans` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(20) NOT NULL,
  `room_id` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `banned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_username_room` (`username`, `room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='禁打名单';

CREATE TABLE IF NOT EXISTS `bank_accounts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `deposit` BIGINT NOT NULL DEFAULT 0 COMMENT '存款',
  `last_interest_at` DATETIME DEFAULT NULL COMMENT '最后计息时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='银行账户';

CREATE TABLE IF NOT EXISTS `bad_words` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `word` VARCHAR(30) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_word` (`word`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='脏词列表';

CREATE TABLE IF NOT EXISTS `banned_usernames` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name_pattern` VARCHAR(30) NOT NULL COMMENT '用户名或模式',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='禁止登录名';

-- ==================== 成就系统 ====================
CREATE TABLE IF NOT EXISTS `achievements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '成就名称',
  `description` TEXT COMMENT '成就描述',
  `icon` VARCHAR(50) DEFAULT '🏆' COMMENT '图标',
  `category` ENUM('alchemy','fishing','mining','hunting','combat','social') NOT NULL COMMENT '分类',
  `requirement_type` ENUM('count','level','rare','legendary') NOT NULL DEFAULT 'count' COMMENT '达成类型',
  `requirement_value` INT NOT NULL COMMENT '达成条件数值',
  `points` INT NOT NULL DEFAULT 0 COMMENT '成就点数',
  `reward_silver` BIGINT NOT NULL DEFAULT 0 COMMENT '银两奖励',
  `reward_exp` INT NOT NULL DEFAULT 0 COMMENT '经验奖励',
  `reward_item` VARCHAR(50) DEFAULT NULL COMMENT '物品奖励',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成就定义';

CREATE TABLE IF NOT EXISTS `achievement_progress` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `alchemy_count` INT NOT NULL DEFAULT 0 COMMENT '炼丹次数',
  `fishing_count` INT NOT NULL DEFAULT 0 COMMENT '钓鱼次数',
  `mining_count` INT NOT NULL DEFAULT 0 COMMENT '挖矿次数',
  `hunting_count` INT NOT NULL DEFAULT 0 COMMENT '狩猎次数',
  `legendary_count` INT NOT NULL DEFAULT 0 COMMENT '稀有物品次数',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成就进度';

CREATE TABLE IF NOT EXISTS `user_achievements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `achievement_id` INT UNSIGNED NOT NULL,
  `progress` INT NOT NULL DEFAULT 0 COMMENT '当前进度',
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否完成',
  `achieved_at` DATETIME DEFAULT NULL COMMENT '达成时间',
  `claimed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '奖励是否已领取',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_achievement` (`user_id`, `achievement_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_achievement` (`achievement_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户成就';

-- ==================== 钓鱼排行榜 ====================
CREATE TABLE IF NOT EXISTS `fishing_ranking` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `total_count` INT NOT NULL DEFAULT 0 COMMENT '总钓鱼次数',
  `total_weight` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '总重量 (斤)',
  `rare_count` INT NOT NULL DEFAULT 0 COMMENT '稀有鱼获数量',
  `shenpin_count` INT NOT NULL DEFAULT 0 COMMENT '神品鱼获数量',
  `total_value` BIGINT NOT NULL DEFAULT 0 COMMENT '鱼获总价值',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`),
  KEY `idx_total_value` (`total_value`),
  KEY `idx_rare_count` (`rare_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钓鱼排行榜';

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS `sect_contributions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sect_name` VARCHAR(30) NOT NULL COMMENT '门派名称',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户 ID',
  `username` VARCHAR(20) NOT NULL COMMENT '用户名',
  `contribution` INT NOT NULL DEFAULT 0 COMMENT '贡献值',
  `reason` VARCHAR(100) DEFAULT NULL COMMENT '贡献原因',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sect` (`sect_name`),
  KEY `idx_user` (`user_id`),
  KEY `idx_time` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='门派贡献记录';
