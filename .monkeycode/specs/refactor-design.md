# 重构技术方案与里程碑计划

> 项目：笑傲江湖聊天室 ASP -> 现代技术栈重构
> 基准文档：《原系统功能与数据结构分析报告》
> 日期：2026-04-13

---

## 一、技术选型

| 层次 | 技术 | 理由 |
|------|------|------|
| 数据库 | MySQL 8.0 | 成熟稳定，中文社区支持好，InnoDB事务支持 |
| 后端框架 | Node.js + Express | 轻量灵活，WebSocket原生支持，生态丰富 |
| 实时通信 | Socket.IO | 兼容性好，房间机制天然匹配聊天室，自动降级 |
| 前端框架 | Vue 3 + Vite | 组合式API，响应式系统，Vite构建快 |
| UI框架 | Element Plus (管理后台) + 自定义(用户端) | 管理端需要高效表单，用户端需复刻原版风格 |
| 状态管理 | Pinia | Vue 3官方推荐，TypeScript友好 |
| 认证 | JWT + bcrypt | 替代原Session+自定义加密 |
| 进程管理 | PM2 | 生产部署 |

---

## 二、数据库迁移方案

### 2.1 迁移原则

1. 保留原字段逻辑，中文表名/字段名改为英文（下划线命名法）
2. 优化索引与性能
3. 将5个辅助数据库合并到主库
4. Application变量中的数据结构落入数据库表
5. 所有时间字段统一为 DATETIME
6. 布尔字段统一为 TINYINT(1)
7. 文本字段根据原长度设定 VARCHAR

### 2.2 表结构映射（完整）

#### 核心表

```sql
-- 用户表（原：用户）
CREATE TABLE `users` (
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

-- 系统配置表（原：system）
CREATE TABLE `system_config` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '配置键名',
  `value` TEXT COMMENT '配置值',
  `description` VARCHAR(200) DEFAULT NULL COMMENT '说明',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置';

-- 门派表（原：门派）
CREATE TABLE `sects` (
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

-- IP临时锁定（原：iplocktemp）
CREATE TABLE `ip_locks` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ip` VARCHAR(45) NOT NULL,
  `locked_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '锁定时间',
  `locked_by` VARCHAR(20) NOT NULL COMMENT '操作者',
  `expires_at` DATETIME NOT NULL COMMENT '自动解封时间',
  PRIMARY KEY (`id`),
  KEY `idx_ip` (`ip`),
  KEY `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='IP临时锁定';

-- IP永久封锁（原：iplockdie）
CREATE TABLE `ip_bans` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ip_pattern` VARCHAR(45) NOT NULL COMMENT 'IP或通配符(如10.%)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='IP永久封锁';

-- 操作日志（原：logdata）
CREATE TABLE `operation_logs` (
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

-- 站内邮件（原：message）
CREATE TABLE `messages` (
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

-- 新闻公告（原：news）
CREATE TABLE `news` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `topic` VARCHAR(200) NOT NULL,
  `content` TEXT,
  `author` VARCHAR(20) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `view_count` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_time` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='新闻公告';

-- 婚姻登记（原：婚姻）
CREATE TABLE `marriages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `proposer` VARCHAR(20) NOT NULL COMMENT '求婚方',
  `target` VARCHAR(20) NOT NULL COMMENT '被求婚方',
  `message` TEXT COMMENT '求婚说明',
  `proposed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_expired` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='婚姻登记';

-- 聊天动作库（原：actlib）
CREATE TABLE `chat_actions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `action_type` VARCHAR(10) NOT NULL DEFAULT '1' COMMENT '1=系统自动',
  `name` VARCHAR(50) DEFAULT NULL COMMENT '动作名',
  `template` TEXT NOT NULL COMMENT '动作模板(##=发言者,%%=对象)',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天动作库';

-- 公告置顶（原：gbooktop）
CREATE TABLE `announcements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `content` TEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告置顶';

-- 物品表（原：物品）
CREATE TABLE `items` (
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

-- 特效物品（原：特效物品）
CREATE TABLE `special_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `effect_type` VARCHAR(30) DEFAULT NULL COMMENT '特效类型',
  `effect_value` INT NOT NULL DEFAULT 0,
  `exp_required` INT NOT NULL DEFAULT 0,
  `owner` VARCHAR(20) DEFAULT '无',
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='特效物品';

-- 卡片商品（原：卡片）
CREATE TABLE `card_templates` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL COMMENT '卡片名称',
  `description` VARCHAR(200) DEFAULT NULL COMMENT '功能说明',
  `price` INT NOT NULL DEFAULT 0 COMMENT '需要银两',
  `card_type` ENUM('normal','vip') NOT NULL DEFAULT 'normal',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卡片商品';

-- 卡片持有（原：卡片拥有）
CREATE TABLE `user_cards` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `card_name` VARCHAR(30) NOT NULL,
  `owner` VARCHAR(20) NOT NULL,
  `quantity` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '面值(上限99)',
  `description` VARCHAR(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卡片持有';

-- 武功表（原：武功）
CREATE TABLE `martial_arts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL COMMENT '武功名称',
  `sect` VARCHAR(20) DEFAULT NULL COMMENT '所属门派',
  `neili_cost` INT NOT NULL DEFAULT 0 COMMENT '需要内力',
  `is_timed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否时效性',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='武功';

-- 击杀记录（原：击杀）
CREATE TABLE `kill_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `victim` VARCHAR(20) NOT NULL,
  `killer` VARCHAR(20) NOT NULL,
  `skill` VARCHAR(30) DEFAULT NULL COMMENT '使用的武功',
  `killed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_expired` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_time` (`killed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='击杀记录';

-- 二手市场（原：市场）
CREATE TABLE `market_listings` (
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

-- 保险产品（原：保险）
CREATE TABLE `insurance_products` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL,
  `description` VARCHAR(200) DEFAULT NULL,
  `duration_days` INT NOT NULL DEFAULT 0,
  `price` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='保险产品';

-- 用户保险（原：保险拥有）
CREATE TABLE `user_insurances` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `insurance_name` VARCHAR(30) NOT NULL,
  `owner` VARCHAR(20) NOT NULL,
  `duration_days` INT NOT NULL DEFAULT 0,
  `expires_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT '用户保险';

-- 配药物品（原：配药物品）
CREATE TABLE `alchemy_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL,
  `owner` VARCHAR(20) DEFAULT '无',
  `quantity` INT NOT NULL DEFAULT 0,
  `potency` INT NOT NULL DEFAULT 0 COMMENT '药效',
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配药物品';

-- 客栈记录（原：客栈）
CREATE TABLE `inn_records` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `registrant` VARCHAR(20) NOT NULL,
  `partner` VARCHAR(20) NOT NULL,
  `message` TEXT,
  `registered_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客栈记录';

-- 生育记录（原：生育）
CREATE TABLE `birth_records` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL,
  `partner` VARCHAR(20) NOT NULL,
  `born_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生育记录';

-- 怀孕记录（原：怀孕）
CREATE TABLE `pregnancies` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL,
  `conceived_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='怀孕记录';

-- 悬赏（原：悬赏）
CREATE TABLE `bounties` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `target` VARCHAR(20) NOT NULL,
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='悬赏';

-- 钓鱼状态（原：钓鱼）
CREATE TABLE `fishing_states` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(20) NOT NULL,
  `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钓鱼状态';

-- 面菜食材（原：面菜）
CREATE TABLE `noodle_ingredients` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL,
  `nutrition` INT NOT NULL DEFAULT 0,
  `flavor` INT NOT NULL DEFAULT 0,
  `price` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='面菜食材';

-- 碗/做面记录（原：碗）
CREATE TABLE `noodle_bowls` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner` VARCHAR(20) NOT NULL,
  `seasoning` VARCHAR(100) DEFAULT NULL COMMENT '调料组合',
  `price` INT NOT NULL DEFAULT 0,
  `is_done` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='做面记录';

-- 酒菜菜单（原：酒菜）
CREATE TABLE `diner_menu` (
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

-- 用户酒菜（原：酒菜列表）
CREATE TABLE `user_diner_items` (
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

-- 已学武功（原：速度）
CREATE TABLE `learned_skills` (
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

-- 星河宠物（原：星河）
CREATE TABLE `star_pets` (
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

-- 小型宠物（原：小宠）
CREATE TABLE `mini_pets` (
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

-- 宠物羊（原：sheep）
CREATE TABLE `sheep_pets` (
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

-- 宠物初始化参数（原：rules）
CREATE TABLE `pet_init_rules` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `init_clean` INT NOT NULL DEFAULT 0,
  `init_happy` INT NOT NULL DEFAULT 0,
  `init_health` INT NOT NULL DEFAULT 0,
  `init_milk` INT NOT NULL DEFAULT 0,
  `init_life` INT NOT NULL DEFAULT 0,
  `init_hunger` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='宠物初始化参数';

-- 许愿墙（原：wish）
CREATE TABLE `wishes` (
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

-- 照片（原：pic1）
CREATE TABLE `photos` (
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

-- 21点游戏（原：pc21）
CREATE TABLE `blackjack_games` (
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

-- 烟花院（原：烟）
CREATE TABLE `courtesans` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL,
  `beauty` INT NOT NULL DEFAULT 0 COMMENT '美貌度',
  `registered_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='烟花院';

-- 唐诗题库（原：唐诗）
CREATE TABLE `tang_poems` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `verse` TEXT COMMENT '诗句',
  `question` VARCHAR(200) COMMENT '题目',
  `answer` VARCHAR(100) COMMENT '答案',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='唐诗题库';

-- 猜谜题库（原：猜谜）
CREATE TABLE `riddles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `question` VARCHAR(200) NOT NULL,
  `answer` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='猜谜题库';

-- 藏经阁武功（原：武功(shuxi.mdb)）
CREATE TABLE `secret_skills` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL,
  `speed_bonus` INT NOT NULL DEFAULT 0,
  `neili_bonus` INT NOT NULL DEFAULT 0,
  `price` INT NOT NULL DEFAULT 0,
  `level` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='藏经阁武功';

-- 投票候选人（原：POLL文件存储）
CREATE TABLE `poll_candidates` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL,
  `vote_count` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投票候选人';

-- 投票记录（原：POLL文件存储）
CREATE TABLE `poll_votes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `voter` VARCHAR(20) NOT NULL,
  `candidate_id` INT UNSIGNED NOT NULL,
  `voted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_voter` (`voter`),
  KEY `idx_candidate` (`candidate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投票记录';

-- 投票配置（原：POLL文件存储）
CREATE TABLE `poll_config` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `start_time` DATETIME DEFAULT NULL,
  `end_time` DATETIME DEFAULT NULL,
  `min_exp` INT NOT NULL DEFAULT 300 COMMENT '经验值门槛',
  `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投票配置';

-- 聊天房间（原：Application变量）
CREATE TABLE `chat_rooms` (
  `id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL,
  `min_grade` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '最低等级',
  `max_grade` TINYINT UNSIGNED NOT NULL DEFAULT 10 COMMENT '最高等级(0=不限)',
  `fight_enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'PK开关',
  `sort_order` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天房间';

-- 聊天消息（原：Application数组sd(180)）
CREATE TABLE `chat_messages` (
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

-- 在线用户（原：Application数组）
CREATE TABLE `online_users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `room_id` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `avatar` VARCHAR(100) DEFAULT NULL,
  `gender` ENUM('male','female') NOT NULL DEFAULT 'male',
  `sect` VARCHAR(20) DEFAULT '无',
  `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_active_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `socket_id` VARCHAR(50) DEFAULT NULL COMMENT 'Socket.IO连接ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`),
  KEY `idx_room` (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='在线用户';

-- 禁言名单（原：Application变量）
CREATE TABLE `mute_list` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(20) NOT NULL,
  `muted_by` VARCHAR(20) DEFAULT NULL,
  `muted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME DEFAULT NULL COMMENT 'NULL=永久',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='禁言名单';

-- 禁打名单（原：Application变量fight_flag）
CREATE TABLE `fight_bans` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(20) NOT NULL,
  `room_id` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `banned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_username_room` (`username`, `room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='禁打名单';

-- 银行用户（原：BankUserList，功能不完整保留结构）
CREATE TABLE `bank_accounts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `deposit` BIGINT NOT NULL DEFAULT 0 COMMENT '存款',
  `last_interest_at` DATETIME DEFAULT NULL COMMENT '最后计息时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='银行账户';

-- 脏词列表（原：硬编码在Jhchat.asp）
CREATE TABLE `bad_words` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `word` VARCHAR(30) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_word` (`word`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='脏词列表';

-- 禁止登录名（原：system disloginname）
CREATE TABLE `banned_usernames` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name_pattern` VARCHAR(30) NOT NULL COMMENT '用户名或模式',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='禁止登录名';
```

### 2.3 与原表字段对应关系

| 原表名 | 新表名 | 中文->英文字段映射 |
|--------|--------|-------------------|
| 用户 | users | 姓名->username, 密码->password, 取密码->password_answer, 性别->gender, 介绍人->referrer, 信箱->email, 头像->avatar, 状态->status, 房间->room_id, 内力->neili, 武功->wugong, 体力->tili, 攻击->attack, 防御->defense, 魅力->charm, 攻击力->attack_power, 配偶->spouse, 会员->is_vip, 银两->silver, 门派->sect, 帮派->faction, 身份->sect_title, 金钱->salary_time, 存款->deposit, 等级->grade, 登录次数->login_count, 注册时间->registered_at, 注册IP->register_ip, 最后登录->last_login_at, 最后IP->last_login_ip, 最后被踢->last_kick_at, 总经验->all_value, 月经验->month_value, 入派时间->join_sect_at, 入监日期->jailed_at, 职业->job, 洗澡->bath_date, 师父->master, 吃面数->noodle_count, 宠物->pet_name, 会员时间->vip_expires_at |
| system | system_config | name->name, value->value |
| 门派 | sects | 门派->name, 掌门->leader, 口号->slogan, 简介->description, 门规->rules, 人数->member_count, 适合->fit_gender |

### 2.4 关键迁移注意事项

1. **密码**：原自定义加密无法保留，迁移时所有用户密码重置，使用bcrypt重新哈希
2. **Application变量 -> 数据库表**：在线列表、消息队列、禁言名单、PK开关等全部落入MySQL
3. **5个辅助库合并**：pic.asp/shuxi.mdb/db.mdb/setup.mdb/yhy.mdb的表全部迁移到主库
4. **房间配置**：原system(roomsn)分号分隔 -> chat_rooms表独立行
5. **投票数据**：原文件存储 -> poll_candidates/poll_votes/poll_config三张表
6. **消息队列**：原Application数组sd(180)循环缓冲 -> chat_messages表，通过line_no增量查询
7. **编码**：原GB2312 -> UTF-8

---

## 三、后端API设计

### 3.1 技术架构

```
backend/
  src/
    config/         # 配置（数据库、JWT密钥等）
    middleware/      # 中间件（认证、权限、错误处理）
    models/         # Sequelize模型定义
    routes/         # 路由定义
    controllers/    # 业务逻辑
    services/       # 服务层（Socket.IO、业务计算）
    utils/          # 工具函数
  server.js         # 入口
```

### 3.2 RESTful API端点（按功能模块）

#### 3.2.1 认证模块

| 方法 | 路径 | 说明 | 对应原ASP |
|------|------|------|-----------|
| POST | /api/auth/register | 用户注册 | joinjhnow.asp |
| POST | /api/auth/login | 用户登录 | CHECK.ASP |
| POST | /api/auth/logout | 退出登录 | EXIT.ASP |
| PUT | /api/auth/password | 修改密码 | MODIFY.ASP |
| POST | /api/auth/revive | 死亡复生 | DISP.ASP |
| POST | /api/auth/suicide | 自杀删号 | ZISHA.ASP |

#### 3.2.2 用户模块

| 方法 | 路径 | 说明 | 对应原ASP |
|------|------|------|-----------|
| GET | /api/users/me | 查看自身状态 | SEEME.ASP |
| PUT | /api/users/me | 更新个人信息 | - |
| POST | /api/users/avatar | 上传头像 | UP.ASP |
| GET | /api/users/:name | 查看他人信息(名探) | mt/showuser.asp |
| GET | /api/users/online | 在线用户列表 | ONLINE1.ASP |
| GET | /api/users/members | 会员列表 | members/members.asp |

#### 3.2.3 聊天模块

| 方法 | 路径 | 说明 | 对应原ASP |
|------|------|------|-----------|
| GET | /api/chat/rooms | 房间列表 | selectroom.asp |
| POST | /api/chat/rooms/:id/join | 进入房间 | changeroom.asp |
| GET | /api/chat/rooms/:id/messages | 获取历史消息 | SAY.ASP(读取部分) |
| GET | /api/chat/rooms/:id/online | 房间在线用户 | Jhchat.asp |
| GET | /api/chat/actions | 动作列表 | actlib表 |
| GET | /api/chat/commands | 可用命令列表 | F2.asp |

**Socket.IO事件（实时通信）：**

| 事件名 | 方向 | 说明 | 对应原ASP |
|--------|------|------|-----------|
| chat:join | C->S | 进入聊天室 | Jhchat.asp入场 |
| chat:leave | C->S | 离开聊天室 | - |
| chat:message | C->S | 发送消息 | SAY.ASP |
| chat:say | S->C | 接收消息 | SAY.ASP分发 |
| chat:action | C->S | 发送动作 | SAY.ASP(//) |
| chat:command | C->S | 斜杠命令 | SAY.ASP(/) |
| chat:system | S->C | 系统消息 | 系统事件 |
| chat:userJoin | S->C | 用户进入 | Jhchat.asp |
| chat:userLeave | S->C | 用户离开 | Global.asa Session_OnEnd |
| chat:kick | S->C | 被踢 | boot() |
| chat:bomb | S->C | 被炸 | MANBOMB |
| room:change | C->S | 切换房间 | changeroom.asp |
| room:onlineUpdate | S->C | 在线列表更新 | - |

#### 3.2.4 命令模块（39个斜杠命令）

| 方法 | 路径 | 说明 | 对应原文件 |
|------|------|------|-----------|
| POST | /api/commands/announce | 千里传音 | 1.ASP titl() |
| POST | /api/commands/acupoint | 点穴 | 2.ASP dian() |
| POST | /api/commands/arrest | 逮捕 | 3.ASP daipu() |
| POST | /api/commands/jail | 坐牢 | 4.ASP zuolao() |
| POST | /api/commands/warn | 警告 | 5.ASP jing() |
| POST | /api/commands/poison | 下毒 | 6.ASP xiadu() |
| POST | /api/commands/expel | 驱逐 | 7.ASP quzu() |
| POST | /api/commands/steal | 偷钱 | 8.ASP touqian() |
| POST | /api/commands/absorb | 吸星大法 | 9.ASP xxdf() |
| POST | /api/commands/throw | 投掷暗器 | 10.ASP touzi() |
| POST | /api/commands/attack | 攻击/比武 | 11.ASP attack() |
| POST | /api/commands/transfer-neili | 传内力 | 12.ASP cuan() |
| POST | /api/commands/gift | 赠送物品 | 13.ASP zen() |
| POST | /api/commands/give-money | 给钱 | 14.ASP give() |
| POST | /api/commands/fine | 罚款 | 25.ASP fakuan() |
| POST | /api/commands/join-sect | 加入门派 | 16.ASP join() |
| POST | /api/commands/leave-sect | 离开门派 | 17.ASP leaf() |
| POST | /api/commands/check-ip | 查IP | 18.ASP getip() |
| POST | /api/commands/usurp | 篡位 | 19.ASP chan() |
| POST | /api/commands/enfeoff | 册封 | 20.ASP cefen() |
| POST | /api/commands/track | 跟踪私毒 | 21.ASP tracksl() |
| POST | /api/commands/untrack | 取消跟踪 | 22.ASP clearsl() |
| POST | /api/commands/use-card | 使用卡片 | 23.ASP card() |
| POST | /api/commands/bulletin | 公告 | 24.ASP gong() |
| POST | /api/commands/mute | 禁言 | 26.ASP nosay() |
| POST | /api/commands/unmute | 解禁 | 27.ASP yessay() |
| POST | /api/commands/ban-fight | 禁打 | 28.ASP jinda() |
| POST | /api/commands/allow-fight | 开打 | 29.ASP kaida() |
| POST | /api/commands/meditate | 打坐练功 | 30.ASP dzlg() |
| POST | /api/commands/kick | 踢人 | 31.ASP tiren() |
| POST | /api/commands/heartbeat | 心跳特效 | 32.ASP xintiao() |
| POST | /api/commands/roar | 怒吼特效 | 33.ASP nuhou() |
| POST | /api/commands/heartbeat-skip | 心动特效 | 34.ASP xindong() |
| POST | /api/commands/apprentice | 拜师 | 35.ASP bais() |
| POST | /api/commands/accept-disciple | 收徒 | 36.ASP stu() |
| POST | /api/commands/admin-order | 站长令 | 37.ASP zzl() |
| POST | /api/commands/enlarge | 放大文字 | 38.ASP fangda() |
| POST | /api/commands/faction-order | 帮派令 | 39.ASP ling() |

#### 3.2.5 邮件模块

| 方法 | 路径 | 说明 | 对应原ASP |
|------|------|------|-----------|
| GET | /api/messages/inbox | 收件箱 | jhyj/incept.asp |
| GET | /api/messages/sent | 发件箱 | jhyj/sender.asp |
| GET | /api/messages/:id | 读取邮件 | jhyj/read.asp |
| POST | /api/messages | 发送邮件 | jhyj/postcor.asp |
| DELETE | /api/messages/:id | 删除邮件 | jhyj/dele.asp |
| DELETE | /api/messages/inbox | 清空收件箱 | jhyj/dele.asp |
| DELETE | /api/messages/sent | 清空发件箱 | jhyj/dele.asp |

#### 3.2.6 门派模块

| 方法 | 路径 | 说明 | 对应原ASP |
|------|------|------|-----------|
| GET | /api/sects | 门派列表 | BBS/HOME.ASP |
| GET | /api/sects/:name | 门派详情 | MYPAI.ASP |
| GET | /api/sects/:name/members | 门派成员 | BBS/DETAIL.ASP |
| PUT | /api/sects/:name | 修改门派信息 | Adminbz/UPDATMP.ASP |
| POST | /api/sects/salary | 领取薪水 | Adminbz/MONEY.ASP |

#### 3.2.7 婚姻模块

| 方法 | 路径 | 说明 | 对应原ASP |
|------|------|------|-----------|
| GET | /api/marriage/proposals | 求婚列表 | YUELAO.ASP |
| POST | /api/marriage/propose | 征婚登记 | ZHENFEN.ASP |
| POST | /api/marriage/accept | 同意结婚 | JIEFEN.ASP |
| POST | /api/marriage/divorce | 离婚 | LIHUN.ASP |
| GET | /api/marriage/inn | 客栈记录 | JHKZ/ |
| POST | /api/marriage/inn | 入住客栈 | JHKZ/join2.asp |

#### 3.2.8 物品/经济模块

| 方法 | 路径 | 说明 | 对应原ASP |
|------|------|------|-----------|
| GET | /api/items | 查看物品 | Wupinxp.asp |
| POST | /api/items/:id/use | 使用物品 | Wupinaxp1~5.asp |
| DELETE | /api/items/:id | 丢弃物品 | DELWUPIN.ASP |
| GET | /api/market | 二手市场 | BUYWUPIN/BUYWU.ASP |
| POST | /api/market | 上架出售 | BUYWUPIN/mywupinbuy.asp |
| POST | /api/market/:id/buy | 购买 | BUYWUPIN/BUYWU1.ASP |
| GET | /api/cards | 卡片商店 | CARD/CARD.ASP |
| POST | /api/cards/buy | 购买卡片 | CARD/BUYCARD.ASP |
| GET | /api/insurances | 保险产品 | bx/bx.asp |
| POST | /api/insurances/buy | 购买保险 | bx/buybx.asp |
| GET | /api/jobs | 打工列表 | DG/Dg.asp |
| POST | /api/jobs/:id/work | 执行打工 | DG/DG1~5.ASP |
| POST | /api/loans | 贷款 | DAIKUAN.ASP |
| GET | /api/auctions | 拍卖列表 | PAIMAI.ASP |

#### 3.2.9 武功模块

| 方法 | 路径 | 说明 | 对应原ASP |
|------|------|------|-----------|
| GET | /api/skills | 武功列表 | WG/dl.asp |
| POST | /api/skills/:id/practice | 练功 | WG/dl1~3.asp |
| GET | /api/secret-skills | 藏经阁 | jhqc/cangjingge.asp |
| POST | /api/secret-skills/:id/learn | 修炼 | jhqc/xiulian.asp |
| GET | /api/learned-skills | 已学武功 | 速度表 |

#### 3.2.10 酒店/医院/面馆模块

| 方法 | 路径 | 说明 | 对应原ASP |
|------|------|------|-----------|
| GET | /api/diner/menu | 酒店菜单 | jiudian/jd.asp |
| POST | /api/diner/order | 点菜 | jiudian/jiudian1.asp |
| GET | /api/hospital | 医院首页 | yiyuan/hosp.asp |
| POST | /api/hospital/heal | 治疗 | yiyuan/yilao2.asp |
| POST | /api/hospital/check-pregnancy | 检查怀孕 | yiyuan/testgirl.asp |
| POST | /api/hospital/give-birth | 生子 | yiyuan/shen2.asp |
| POST | /api/hospital/abortion | 打胎 | yiyuan/del2.asp |
| GET | /api/noodle/ingredients | 食材列表 | qmg/caichang.asp |
| POST | /api/noodle/cook | 做面 | qmg/m1~3.asp |
| POST | /api/noodle/buy | 买面 | qmg/buymian.asp |
| POST | /api/noodle/eat | 吃面 | qmg/chimian.asp |

#### 3.2.11 游戏模块

| 方法 | 路径 | 说明 | 对应原ASP |
|------|------|------|-----------|
| GET | /api/games/blackjack | 21点状态 | 21point/ |
| POST | /api/games/blackjack/bet | 下注 | 21point/pcbet.asp |
| POST | /api/games/blackjack/hit | 要牌 | 21point/pccontinue.asp |
| POST | /api/games/blackjack/stand | 停牌 | 21point/pcend.asp |
| POST | /api/games/dice | 掷骰子 | BET/DICE_RUN.ASP |
| POST | /api/games/high-low | 猜大小 | BET/B&SPOSE.ASP |
| POST | /api/games/rps | 猜拳 | BET/JZSTB/ |
| POST | /api/games/fish/start | 开始钓鱼 | diaoyu/diao.asp |
| POST | /api/games/fish/reel | 收竿 | diaoyu/diaoyuok.asp |
| POST | /api/games/hunt | 打猎 | dalie/dalie.asp |
| GET | /api/games/othello | 比山论剑 | a/go.asp |
| POST | /api/games/othello/move | 落子 | a/go1~10.asp |
| POST | /api/games/exam | 答题 | a/kaoshi1.asp |

#### 3.2.12 宠物模块

| 方法 | 路径 | 说明 | 对应原ASP |
|------|------|------|-----------|
| GET | /api/pets/sheep | 查看宠物羊 | myhome/sheep/checksheep.asp |
| POST | /api/pets/sheep/buy | 购买 | myhome/sheep/buysheep.asp |
| POST | /api/pets/sheep/feed | 喂养 | myhome/sheep/feedsheep.asp |
| POST | /api/pets/sheep/sell | 卖羊 | myhome/sheep/sellsheep.asp |
| POST | /api/pets/sheep/sell-milk | 卖牛奶 | myhome/sheep/sellmilk.asp |
| POST | /api/pets/sheep/clean | 清洁 | myhome/sheep/sheepclean.asp |
| POST | /api/pets/sheep/breed | 配种 | myhome/sheep/sheeppei.asp |
| POST | /api/pets/sheep/sun | 晒太阳 | myhome/sheep/sheepsun.asp |
| GET | /api/pets/star | 查看星河宠物 | XH/xhzta.asp |
| POST | /api/pets/star/adopt | 领养 | XH/joinnowxh.asp |
| POST | /api/pets/star/fight | 战斗 | XH/test1.asp |
| POST | /api/pets/star/adventure | 冒险 | XH/adv1.asp |
| GET | /api/pets/mini | 查看小宠 | XH/ |
| POST | /api/pets/mini/adopt | 领养 | XH/joinnowcw.asp |

#### 3.2.13 配药模块

| 方法 | 路径 | 说明 | 对应原ASP |
|------|------|------|-----------|
| GET | /api/alchemy/recipes | 药方列表 | peiyao/main.asp |
| GET | /api/alchemy/inventory | 药材库存 | peiyao/wupin.asp |
| GET | /api/alchemy/potions | 已配药品 | peiyao/yaopin.asp |
| POST | /api/alchemy/craft/:id | 炼制药品 | peiyao/xl1~12.asp |

#### 3.2.14 其他模块

| 方法 | 路径 | 说明 | 对应原ASP |
|------|------|------|-----------|
| GET | /api/rankings | 排行榜(多种) | TOP/ |
| GET | /api/wishes | 许愿墙列表 | jhqy/wish.asp |
| POST | /api/wishes | 发布许愿 | jhqy/save.asp |
| GET | /api/votes | 投票信息 | POLL/POLL.ASP |
| POST | /api/votes | 投票 | POLL/pollviewpoll.asp |
| GET | /api/news | 新闻列表 | YAMEN/DISP.ASP |
| GET | /api/news/:id | 新闻详情 | YAMEN/VIEW.ASP |
| POST | /api/bath | 温泉洗澡 | WW/CHECKSEX.ASP |
| GET | /api/photos | 照片列表 | c/photo.asp |
| POST | /api/photos | 上传照片 | c/addpic.asp |
| GET | /api/bounties | 悬赏列表 | d/jn.ASP |
| POST | /api/bounties/:id/claim | 认领猎杀 | d/rl.asp |
| GET | /api/prisoners | 犯人列表 | e/index.asp |
| POST | /api/prisoners/:id/bail | 保释 | e/SHIFANG.ASP |
| GET | /api/courtesans | 烟花院列表 | yhy/xiaojie.asp |
| POST | /api/courtesans/register | 登记烟花女 | yhy/dengji.asp |
| POST | /api/courtesans/:id/visit | 消费 | yhy/girl.asp |
| POST | /api/insurance/buy | 购买保险 | bx/buybx.asp |
| GET | /api/lucky | 抽签算命 | jhqy/lucky.asp |

#### 3.2.15 后台管理API

| 方法 | 路径 | 说明 | 对应原ASP | 权限 |
|------|------|------|-----------|------|
| GET | /api/admin/users | 用户列表 | xajhxp_wen/manuser.asp | admin |
| GET | /api/admin/users/:id | 用户详情 | xajhxp_wen/manuser.asp | admin |
| PUT | /api/admin/users/:id | 编辑用户 | xajhxp_wen/manuser.asp | admin |
| DELETE | /api/admin/users/:id | 删除用户 | xajhxp_wen/manaccdel7.asp | admin |
| POST | /api/admin/users/batch-delete | 批量删除 | xajhxp_wen/manaccdel30.asp | admin |
| GET | /api/admin/logs | 操作日志 | xajhxp_wen/manlog.asp | admin |
| DELETE | /api/admin/logs | 清除日志 | xajhxp_wen/manlogdelok.asp | admin |
| GET | /api/admin/ip-locks | IP临时封锁列表 | CHAT/MANLOCK.ASP | grade>=8 |
| POST | /api/admin/ip-locks | 临时封锁IP | CHAT/manlockok.asp | grade>=8 |
| DELETE | /api/admin/ip-locks/:id | 解封IP | CHAT/manunlockok.asp | grade>=8 |
| GET | /api/admin/ip-bans | IP永久封锁列表 | CHAT/MANIP.ASP | grade>=10 |
| POST | /api/admin/ip-bans | 永久封锁IP | CHAT/MANIPOK.ASP | grade>=10 |
| DELETE | /api/admin/ip-bans/:id | 解封IP | CHAT/MANIPOK.ASP | grade>=10 |
| GET | /api/admin/news | 公告管理 | xajhxp_wen/mangg.asp | admin |
| POST | /api/admin/news | 发布公告 | xajhxp_wen/mangggnew.asp | admin |
| PUT | /api/admin/news/:id | 修改公告 | YAMEN/MODIPLAN.ASP | admin |
| DELETE | /api/admin/news/:id | 删除公告 | YAMEN/DELETE.ASP | admin |
| GET | /api/admin/config | 系统配置列表 | xajhxp_wen/mansys.asp | admin |
| PUT | /api/admin/config/:name | 修改配置 | xajhxp_wen/mansysc*.asp | admin |
| GET | /api/admin/rooms | 房间管理 | xajhxp_wen/manroom.asp | admin |
| POST | /api/admin/rooms | 添加房间 | xajhxp_wen/manroomok.asp | admin |
| PUT | /api/admin/rooms/:id | 修改房间 | xajhxp_wen/manroomok.asp | admin |
| DELETE | /api/admin/rooms/:id | 删除房间 | xajhxp_wen/manroomok.asp | admin |
| GET | /api/admin/managers | 管理员列表 | ADMIN.ASP | admin |
| POST | /api/admin/managers | 招聘管理员 | ADMIN1.ASP | admin |
| PUT | /api/admin/managers/:id | 调整等级 | ADMIN1.ASP | admin |
| DELETE | /api/admin/managers/:id | 开除管理员 | ADMIN1.ASP | admin |
| GET | /api/admin/vips | 会员管理 | xajhxp_wen/manmem.asp | admin |
| PUT | /api/admin/vips/:id | 编辑会员 | xajhxp_wen/manmem.asp | admin |
| GET | /api/admin/items | 物品管理 | xajhxp_wen/binqi.asp | admin |
| POST | /api/admin/items | 添加物品 | xajhxp_wen/binqi.asp | admin |
| PUT | /api/admin/items/:id | 修改物品 | xajhxp_wen/binqi.asp | admin |
| DELETE | /api/admin/items/:id | 删除物品 | xajhxp_wen/binqi.asp | admin |
| GET | /api/admin/drugs | 药店管理 | xajhxp_wen/yaopu.asp | admin |
| POST | /api/admin/drugs | 添加药品 | xajhxp_wen/yaopu.asp | admin |
| PUT | /api/admin/drugs/:id | 修改药品 | xajhxp_wen/yaopu.asp | admin |
| DELETE | /api/admin/drugs/:id | 删除药品 | xajhxp_wen/yaopu.asp | admin |
| GET | /api/admin/cards | 卡片管理 | xajhxp_wen/card.asp | admin |
| POST | /api/admin/cards | 添加卡片 | xajhxp_wen/card.asp | admin |
| PUT | /api/admin/cards/:id | 修改卡片 | xajhxp_wen/card.asp | admin |
| DELETE | /api/admin/cards/:id | 删除卡片 | xajhxp_wen/card.asp | admin |
| GET | /api/admin/statistics/online | 在线统计 | - | admin |
| GET | /api/admin/statistics/registration | 注册统计 | - | admin |
| GET | /api/admin/statistics/chat | 聊天统计 | - | admin |
| GET | /api/admin/statistics/economy | 经济统计 | - | admin |
| PUT | /api/admin/password | 修改管理密码 | xajhxp_wen/adminmp.asp | admin |

---

## 四、前端功能映射（Vue 3组件）

### 4.1 项目结构

```
frontend/
  src/
    assets/           # 静态资源(原图片/音频)
    components/       # 通用组件
    views/            # 页面组件
    stores/           # Pinia状态管理
    composables/      # 组合式函数
    router/           # 路由
    socket/           # Socket.IO客户端
    utils/            # 工具函数
    styles/           # 全局样式
```

### 4.2 页面与组件映射

#### 用户端页面

| 页面路由 | 组件 | 对应原ASP | 功能 |
|----------|------|-----------|------|
| / | IndexPage | INDEX.ASP | 首页重定向 |
| /login | LoginPage | login.asp | 登录(含水面特效替代动画) |
| /register | RegisterPage | JOINJH.ASP | 注册 |
| /main | MainPage | main.asp | 大厅主页(公告/导航/在线列表) |
| /chat | ChatPage | CHAT/Jhchat.asp | 聊天室主界面 |
| /chat/room/:id | ChatRoom | CHAT/ | 房间聊天 |
| /profile | ProfilePage | SEEME.ASP | 个人状态 |
| /profile/edit | ProfileEdit | MODIFY.ASP | 修改信息 |
| /messages | MessageList | jhyj/email.asp | 邮件系统 |
| /sect | SectPage | MYPAI.ASP | 门派信息 |
| /sect/list | SectListPage | BBS/HOME.ASP | 门派列表 |
| /marriage | MarriagePage | YUELAO.ASP | 月老祠 |
| /skills | SkillPage | WG/dl.asp | 武功练功 |
| /skills/library | SkillLibrary | jhqc/cangjingge.asp | 藏经阁 |
| /items | ItemPage | CHAT/Wupinxp.asp | 物品管理 |
| /market | MarketPage | BUYWUPIN/BUYWU.ASP | 二手市场 |
| /cards | CardShop | CARD/CARD.ASP | 卡片商店 |
| /diner | DinerPage | jiudian/jd.asp | 酒店 |
| /hospital | HospitalPage | yiyuan/hosp.asp | 医院 |
| /noodle | NoodlePage | qmg/qmg.htm | 面馆 |
| /games | GamesPage | BET/BETINDEX.ASP | 游戏大厅 |
| /games/blackjack | BlackjackPage | 21point/ | 21点 |
| /games/dice | DicePage | BET/DICE.ASP | 掷骰子 |
| /games/fishing | FishingPage | diaoyu/ | 钓鱼 |
| /games/hunting | HuntingPage | dalie/ | 打猎 |
| /games/othello | OthelloPage | a/ | 比山论剑 |
| /pets/sheep | SheepPage | myhome/sheep/ | 宠物羊 |
| /pets/star | StarPetPage | XH/ | 星河宠物 |
| /alchemy | AlchemyPage | peiyao/main.asp | 配药 |
| /rankings | RankingPage | TOP/ | 排行榜 |
| /wishes | WishPage | jhqy/wish.asp | 许愿墙 |
| /votes | VotePage | POLL/POLL.ASP | 投票 |
| /bath | BathPage | WW/ | 温泉 |
| /photos | PhotoPage | c/photo.asp | 照片墙 |
| /prison | PrisonPage | e/ | 监狱 |
| /bounty | BountyPage | d/ | 悬赏 |

#### 聊天室组件

| 组件 | 对应原ASP | 功能 |
|------|-----------|------|
| ChatFrame | Jhchat.asp | 聊天室主框架 |
| MessageList | f0/f1 | 消息显示区(公聊+私聊) |
| ChatInput | F2.asp | 输入框(颜色/动作/表情/命令) |
| OnlineList | f3 | 在线用户列表 |
| RoomSelector | selectroom.asp | 房间选择 |
| ActionBar | f4 | 功能按钮栏 |
| EmotionPicker | F2.asp表情部分 | 表情选择器 |
| ActionPicker | F2.asp动作部分 | 动作选择器 |
| CommandMenu | F2.asp命令部分 | 斜杠命令菜单 |
| PrivateChatToggle | F2.asp私聊复选 | 私聊切换 |

#### 管理后台页面

| 页面路由 | 组件 | 对应原ASP |
|----------|------|-----------|
| /admin | AdminDashboard | xajhxp_wen/M.asp |
| /admin/users | AdminUsers | xajhxp_wen/manuser.asp |
| /admin/managers | AdminManagers | ADMIN.ASP |
| /admin/news | AdminNews | xajhxp_wen/mangg.asp |
| /admin/config | AdminConfig | xajhxp_wen/mansys.asp |
| /admin/rooms | AdminRooms | xajhxp_wen/manroom.asp |
| /admin/ip-locks | AdminIpLocks | CHAT/MANLOCK.ASP |
| /admin/ip-bans | AdminIpBans | CHAT/MANIP.ASP |
| /admin/logs | AdminLogs | xajhxp_wen/manlog.asp |
| /admin/items | AdminItems | xajhxp_wen/binqi.asp |
| /admin/drugs | AdminDrugs | xajhxp_wen/yaopu.asp |
| /admin/cards | AdminCards | xajhxp_wen/card.asp |
| /admin/vips | AdminVips | xajhxp_wen/manmem.asp |
| /admin/statistics | AdminStatistics | - |
| /admin/poll | AdminPoll | POLL/POLLCAND.ASP |

---

## 五、后台管理系统设计

### 5.1 设计原则

后台功能模块必须基于原系统数据模型设计，不可假设不存在的数据字段。

### 5.2 功能模块

#### 5.2.1 用户管理（基于users表）

| 功能 | 数据来源 | 对应原字段 |
|------|----------|-----------|
| 用户列表(搜索/筛选/分页) | users表 | 全部字段 |
| 查看用户详情 | users表 | 全部字段 |
| 编辑用户属性(银两/等级/门派/状态等) | users表 | 对应字段 |
| 封禁用户 | users.status=banned | 状态字段 |
| 解封用户 | users.status=normal | 状态字段 |
| 删除7天未登录用户 | users.last_login_at | last_login_at |
| 删除30天未登录用户 | users.last_login_at | last_login_at |
| 修改用户密码 | users.password | password |
| VIP会员管理 | users.is_vip/vip_expires_at | 会员/会员时间 |

#### 5.2.2 聊天室管理（基于chat_rooms + chat_messages表）

| 功能 | 数据来源 | 对应原字段 |
|------|----------|-----------|
| 房间列表(CRUD) | chat_rooms表 | 全部字段 |
| 房间启停 | chat_rooms.fight_enabled | fight_enabled |
| PK开关 | chat_rooms.fight_enabled | 原fight_flag |
| 消息监控(实时/历史) | chat_messages表 | 全部字段 |
| 在线用户监控 | online_users表 | 全部字段 |
| 禁言管理 | mute_list表 | 全部字段 |
| 禁打管理 | fight_bans表 | 全部字段 |

#### 5.2.3 系统配置（基于system_config表）

| 功能 | 数据来源 | 对应原system.name |
|------|----------|-------------------|
| 聊天室名称 | system_config | chatroomname |
| 背景颜色/图片 | system_config | chatroombgcolor/chatbgcolor/chatimage/chatcolor |
| 进入/退出/掉线提示语 | system_config | userinto/userout/userdown |
| 最大在线人数 | system_config | maxpeople |
| 超时时间 | system_config | maxtimeout |
| 允许HTML等级 | system_config | allowhtml |
| 等级经验值阈值 | system_config | level1to2~level4to5 |
| IP锁定时间 | system_config | iplocktime |
| 开关：关闭聊天室 | system_config | closedoor |
| 开关：禁止代理 | system_config | disproxy |
| 开关：禁止新用户 | system_config | disnewuser |
| 禁止登录用户名 | system_config + banned_usernames | disloginname |
| 管理员名单 | system_config | admin |
| 主页URL/开站日期/访问量 | system_config | homepageurl/opendate/visitor |

#### 5.2.4 数据统计（基于现有数据表）

| 统计维度 | 数据来源 | SQL逻辑 |
|----------|----------|---------|
| 在线人数趋势 | online_users表 | COUNT按时间段分组 |
| 注册用户趋势 | users表 | COUNT(registered_at)按日/周/月 |
| 聊天消息量 | chat_messages表 | COUNT(created_at)按日/时 |
| 经济指标(银两流通) | users表 | SUM(silver)/AVG(silver) |
| 门派人数分布 | users表 GROUP BY sect | COUNT GROUP BY sect |
| 用户等级分布 | users表 GROUP BY grade | COUNT GROUP BY grade |
| 攻击/防御排行 | users表 ORDER BY | TOP N查询 |
| 击杀记录 | kill_logs表 | 按时间排序 |
| 操作日志 | operation_logs表 | 按时间/操作者筛选 |

> 注：以上统计均基于原系统数据模型中已有的字段（users/kill_logs/operation_logs/chat_messages等），不假设不存在的字段。

#### 5.2.5 安全管理

| 功能 | 数据来源 | 对应原功能 |
|------|----------|-----------|
| IP临时封锁 | ip_locks表 | CHAT/MANLOCK.ASP |
| IP永久封锁 | ip_bans表 | CHAT/MANIP.ASP |
| 脏词管理 | bad_words表 | 原硬编码 |
| 禁止登录名 | banned_usernames表 | 原system(disloginname) |

#### 5.2.6 内容管理

| 功能 | 数据来源 | 对应原功能 |
|------|----------|-----------|
| 新闻公告CRUD | news表 + announcements表 | YAMEN/ |
| 投票管理 | poll_config + poll_candidates | POLL/ |
| 照片审核 | photos表(is_approved) | c/ |

---

## 六、UI风格处理方案

### 6.1 原则

1. 优先复用原图片素材
2. 因响应式适配需裁剪时保留原视觉基调
3. 若原素材缺失或无法使用，必须在对应位置留出空白占位（灰色背景+文字标注"原素材[文件名]待替换"），不可自行设计替代样式

### 6.2 素材复用计划

| 原素材目录 | 目标位置 | 处理方式 |
|-----------|----------|----------|
| images/userface/ (80个头像) | /assets/avatars/ | 直接复用，响应式缩放 |
| photo/ (318个表情) | /assets/emoticons/ | 直接复用 |
| CHAT/PIC/ (405个聊天图片) | /assets/chat-images/ | 直接复用 |
| CHAT/LOGO/ (20个) | /assets/logos/ | 直接复用 |
| images/card/ (53个扑克) | /assets/cards/ | 直接复用 |
| CHAT/MID/ (100+ MIDI) | /assets/audio/ | 转换为MP3/OGG格式 |

### 6.3 响应式适配

- 聊天室主框架：原frameset布局 -> Flexbox/Grid自适应布局
- 分屏模式：保留分屏/全屏切换功能
- 在线用户列表：桌面端右侧面板，移动端可收起侧栏
- 输入框区域：桌面端底部固定，移动端全屏弹出

### 6.4 视觉基调

- 保留原武侠风格：深色背景、古典配色
- 聊天室背景色：沿用原chatroombgcolor(可配置)
- 文字颜色：沿用原chatcolor(可配置)
- Java Applet水面特效 -> CSS动画替代（波纹效果）

### 6.5 占位规则

原素材中无法确认用途或缺失时：
```html
<div style="background:#ccc;display:flex;align-items:center;justify-content:center;">
  原素材[文件名]待替换
</div>
```

---

## 七、里程碑计划

### M1：项目初始化与用户认证（1周）

**交付物**：
- 前后端工程初始化
- 数据库迁移脚本
- 用户注册/登录/修改密码
- JWT认证中间件
- 可运行的Web演示

**具体任务**：
1. 初始化 Node.js + Express 后端工程
2. 初始化 Vue 3 + Vite 前端工程
3. 执行 MySQL 数据库建表脚本
4. 实现用户注册（含验证码、输入验证、密码bcrypt加密）
5. 实现用户登录（含IP封锁检查、代理检测、最大人数限制）
6. 实现JWT认证中间件
7. 实现修改密码、上传头像
8. 前端：登录页、注册页、个人状态页

### M2：聊天室核心功能（2周）

**交付物**：
- Socket.IO实时聊天
- 多房间支持
- 39个斜杠命令
- 表情/动作/私聊/分屏
- 在线用户列表
- 站内消息
- 可运行的Web演示

**具体任务**：
1. 实现Socket.IO服务端（房间机制、在线管理、消息推送）
2. 实现聊天室前端（消息区、输入框、在线列表、房间选择）
3. 实现39个斜杠命令（逐一对照原ASP逻辑）
4. 实现表情图片替换([tu]1[/tu]~[tu]16[/tu])
5. 实现动作发言(//)和动作词
6. 实现私聊和分屏模式
7. 实现随机事件系统
8. 实现站内邮件系统(CRUD)
9. 实现聊天输入框(颜色选择/动作选择/命令菜单)
10. 实现踢人/禁言/禁打等管理命令

### M3：虚拟社区功能（2周）

**交付物**：
- 门派系统
- 婚姻系统
- 武功系统
- 经济系统（物品/市场/打工/卡片/保险）
- 酒店医院面馆
- 游戏系统（21点/骰子/钓鱼/打猎/比山论剑）
- 宠物系统
- 配药系统
- 可运行的Web演示

**具体任务**：
1. 门派：加入/离开/篡位/册封/管理
2. 婚姻：征婚/结婚/离婚/客栈/医院生育
3. 武功：练功/藏经阁/打坐
4. 经济：物品管理/二手市场/打工5种/贷款/卡片/保险/面馆
5. 酒店：菜单/点菜
6. 医院：治疗/怀孕/生子/打胎
7. 游戏：21点/骰子/猜大小/钓鱼/打猎/比山论剑(黑白棋+答题)
8. 宠物：宠物羊(购买/喂养/卖奶/清洁/配种)、星河宠物(领养/战斗/冒险)、小宠
9. 配药：12种药方炼制
10. 其他：温泉/排行榜/许愿墙/投票/照片/悬赏/监狱/烟花院

### M4：后台管理系统（1.5周）

**交付物**：
- 后台管理完整功能
- 数据统计面板
- 可运行的Web演示

**具体任务**：
1. 后台框架（Element Plus布局/菜单/权限）
2. 用户管理（列表/搜索/编辑/封禁/解封/批量删除）
3. 管理员管理（招聘/开除/等级调整）
4. 聊天室管理（房间CRUD/PK开关/消息监控）
5. 系统配置（34项配置的可视化编辑）
6. 安全管理（IP封锁/脏词/禁止登录名）
7. 内容管理（公告CRUD/投票管理/照片审核）
8. 数据统计（在线趋势/注册趋势/消息量/经济指标/门派分布/等级分布）
9. 操作日志查看/清除
10. 物品/药品/卡片管理CRUD

### M5：响应式适配与UI对齐（1周）

**交付物**：
- 多端响应式适配
- 原素材复用
- UI细节对齐
- 可运行的Web演示

**具体任务**：
1. 聊天室移动端适配（侧栏收起/输入框全屏）
2. 全站响应式布局（桌面/平板/手机）
3. 复用原图片素材（头像/表情/聊天图片/扑克/Logo）
4. MIDI音频转码为Web兼容格式
5. Java Applet水面特效 -> CSS动画替代
6. 聊天室背景色/文字颜色动态配置
7. 占位标记（缺失素材位置标注）
8. 武侠视觉基调对齐

### M6：最终整理与文档（0.5周）

**交付物**：
- 代码整理与优化
- 部署说明文档
- 二次开发指南
- 声明：不包含原生安装包

**具体任务**：
1. 代码审查与优化
2. 环境配置文件(.env)整理
3. Docker部署配置
4. 部署说明文档(README.md)
5. 二次开发指南(API文档/数据库说明/组件说明)
6. 种子数据脚本(初始化系统配置/门派/武功/药品等)

---

## 八、特别约束确认

| 约束 | 状态 | 说明 |
|------|------|------|
| 分析报告未获确认前不编写重构代码 | 已遵守 | 第一阶段已完成并获确认 |
| 用户端功能与分析报告100%吻合 | 承诺 | 39个斜杠命令/33个子系统/全部功能映射 |
| 后台功能基于原数据模型 | 承诺 | 仅使用users/system_config/chat_rooms等已有表的字段 |
| 图片素材复用或占位 | 承诺 | 6.2节素材复用计划+6.5节占位规则 |
| 不更换视觉风格 | 承诺 | 保留武侠基调，沿用原配色 |

---

## 九、总工期

| 阶段 | 工期 | 累计 |
|-------|------|------|
| M1：项目初始化与用户认证 | 1周 | 1周 |
| M2：聊天室核心功能 | 2周 | 3周 |
| M3：虚拟社区功能 | 2周 | 5周 |
| M4：后台管理系统 | 1.5周 | 6.5周 |
| M5：响应式适配与UI对齐 | 1周 | 7.5周 |
| M6：最终整理与文档 | 0.5周 | 8周 |

**总计：8周**
