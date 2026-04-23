-- ================================================================
-- 江湖聊天室 - 完整数据库结构
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
SET TIME_ZONE = "+00:00";

-- 1. 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(20) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `password_answer` VARCHAR(255) DEFAULT NULL,
  `gender` ENUM('male','female') NOT NULL DEFAULT 'male',
  `referrer` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(60) DEFAULT NULL,
  `avatar` VARCHAR(100) DEFAULT '1.gif',
  `status` ENUM('normal','jailed','banned','dead','inn','sleeping','poisoned') NOT NULL DEFAULT 'normal',
  `room_id` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `neili` INT NOT NULL DEFAULT 0,
  `wugong` INT NOT NULL DEFAULT 0,
  `tili` INT NOT NULL DEFAULT 30,
  `attack` INT NOT NULL DEFAULT 10,
  `defense` INT NOT NULL DEFAULT 10,
  `charm` INT NOT NULL DEFAULT 100,
  `attack_power` INT NOT NULL DEFAULT 100,
  `spouse` VARCHAR(20) DEFAULT '无',
  `is_vip` TINYINT(1) NOT NULL DEFAULT 0,
  `silver` BIGINT NOT NULL DEFAULT 0,
  `sect` VARCHAR(20) DEFAULT '无',
  `faction` VARCHAR(20) DEFAULT '无',
  `sect_title` VARCHAR(20) DEFAULT '无',
  `salary_time` DATETIME DEFAULT NULL,
  `deposit` BIGINT NOT NULL DEFAULT 0,
  `grade` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `login_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `registered_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `register_ip` VARCHAR(45) DEFAULT NULL,
  `last_login_at` DATETIME DEFAULT NULL,
  `last_login_ip` VARCHAR(45) DEFAULT NULL,
  `last_kick_at` DATETIME DEFAULT NULL,
  `all_value` INT NOT NULL DEFAULT 0,
  `month_value` INT NOT NULL DEFAULT 0,
  `join_sect_at` DATETIME DEFAULT NULL,
  `jailed_at` DATETIME DEFAULT NULL,
  `job` VARCHAR(20) DEFAULT NULL,
  `bath_date` DATE DEFAULT NULL,
  `master` VARCHAR(20) DEFAULT NULL,
  `noodle_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `pet_name` VARCHAR(20) DEFAULT NULL,
  `vip_expires_at` DATETIME DEFAULT NULL,
  `lover_name` VARCHAR(20) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 在线用户表
CREATE TABLE IF NOT EXISTS `online_users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `room_id` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `avatar` VARCHAR(100) DEFAULT '',
  `gender` ENUM('male','female') NOT NULL DEFAULT 'male',
  `sect` VARCHAR(20) DEFAULT '无',
  `socket_id` VARCHAR(50) NOT NULL,
  `last_active_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 聊天消息表
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `room_id` TINYINT UNSIGNED NOT NULL,
  `line_no` BIGINT UNSIGNED NOT NULL,
  `is_action` TINYINT(1) NOT NULL DEFAULT 0,
  `is_private` TINYINT(1) NOT NULL DEFAULT 0,
  `sender` VARCHAR(20) NOT NULL,
  `sender_sect` VARCHAR(20) DEFAULT '无',
  `receiver` VARCHAR(20) DEFAULT '所有人',
  `receiver_sect` VARCHAR(20) DEFAULT '无',
  `sender_color` VARCHAR(7) DEFAULT '660099',
  `msg_color` VARCHAR(7) DEFAULT '660099',
  `action_word` VARCHAR(20) DEFAULT NULL,
  `content` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_room_line` (`room_id`, `line_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 聊天房间表
CREATE TABLE IF NOT EXISTS `chat_rooms` (
  `id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `min_grade` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `max_grade` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 聊天动作表
CREATE TABLE IF NOT EXISTS `chat_actions` (
  `id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL,
  `template` VARCHAR(255) NOT NULL,
  `action_type` VARCHAR(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 门派表
CREATE TABLE IF NOT EXISTS `sects` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL,
  `leader` VARCHAR(20) DEFAULT NULL,
  `slogan` VARCHAR(100) DEFAULT NULL,
  `description` TEXT,
  `rules` VARCHAR(100) DEFAULT NULL,
  `member_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `fit_gender` ENUM('male','female','both') NOT NULL DEFAULT 'both',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 系统配置表
CREATE TABLE IF NOT EXISTS `system_config` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `label` VARCHAR(100) DEFAULT NULL,
  `value` TEXT,
  `type` VARCHAR(10) DEFAULT 'string',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 公告表
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `content` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- 初始数据
INSERT INTO `chat_rooms` (`id`, `name`, `description`, `sort_order`, `min_grade`, `max_grade`) VALUES
(1, '江湖公共论坛', '江湖人士聚集地，畅所欲言', 1, 0, 0),
(2, '武侠阁', '讨论武林秘籍、武功', 2, 2, 0),
(3, '茶馆酒肆', '休闲娱乐，结交好友', 3, 1, 0),
(4, '门派议事厅', '各门派内部议事', 4, 2, 10),
(5, '官府大厅', '六扇门办公场所', 5, 6, 10);

INSERT INTO `chat_actions` (`id`, `name`, `action_type`, `template`) VALUES
(1, '拱手', '1', '##向%%拱手致意'),
(2, '作揖', '1', '##向%%作揖行礼'),
(3, '微笑', '1', '##对%%微微一笑'),
(4, '大笑', '1', '##仰天大笑'),
(5, '哭泣', '1', '##伤心地哭泣'),
(6, '愤怒', '1', '##愤怒地看着%%'),
(7, '惊讶', '1', '##惊讶地看着%%'),
(8, '害羞', '1', '##害羞地低下了头'),
(9, '亲吻', '1', '##深情地亲吻%%'),
(10, '拥抱', '1', '##紧紧拥抱%%'),
(11, '挥手', '1', '##向%%挥手告别'),
(12, '点头', '1', '##向%%点头示意'),
(13, '摇头', '1', '##向%%摇头拒绝'),
(14, '鞠躬', '1', '##向%%深深鞠躬'),
(15, '拍手', '1', '##为%%拍手叫好'),
(16, '跳舞', '1', '##为%%跳了一支舞'),
(17, '唱歌', '1', '##为%%唱了一首歌'),
(18, '喝酒', '1', '##举杯请%%喝酒'),
(19, '睡觉', '1', '##在%%面前睡着了'),
(20, '发呆', '1', '##呆呆地看着%%'),
(21, '比武', '1', '##与%%切磋武艺'),
(22, '切磋', '1', '##与%%切磋武艺，点到为止'),
(23, '疗伤', '1', '##为%%疗伤'),
(24, '送礼', '1', '##送给%%一份礼物'),
(25, '跪拜', '1', '##向%%跪拜行礼'),
(26, '仰望', '1', '##仰望着%%，充满敬意'),
(27, '叹息', '1', '##对着%%叹了口气');

INSERT INTO `sects` (`id`, `name`, `leader`, `fit_gender`, `description`, `member_count`) VALUES
(1, '少林派', '无', 'male', '天下武功出少林，以禅武合一著称', 0),
(2, '武当派', '无', 'male', '道教圣地，太极拳剑闻名天下', 0),
(3, '峨眉派', '无', 'female', '女子门派，剑法精妙', 0),
(4, '华山派', '无', 'both', '剑气纵横，华山论剑', 0),
(5, '逍遥派', '无', 'both', '逍遥自在，无拘无束', 0),
(6, '丐帮', '无', 'both', '天下第一大帮，打狗棒法威震江湖', 0),
(7, '明教', '无', 'both', '西域魔教，乾坤大挪移', 0),
(8, '桃花岛', '无', 'both', '东海岛屿，武功奇诡', 0);

INSERT INTO `system_config` (`name`, `label`, `value`, `type`) VALUES
('server_status', '服务器状态', 'open', 'string'),
('register_enabled', '开放注册', '1', 'boolean'),
('chat_message_max', '聊天消息最大长度', '200', 'number'),
('max_online_users', '最大在线人数', '500', 'number'),
('hospital_heal_cost', '医院治疗费用', '1000', 'number');

INSERT INTO `announcements` (`id`, `content`, `created_at`) VALUES
(1, '欢迎进入江湖聊天室！这是一个江湖武侠主题的聊天系统。请使用文明用语，共同维护良好的聊天环境。', NOW());
