-- ================================================================
-- 江湖聊天室 - 数据库表结构
-- 版本：v1.0
-- 数据库：MySQL 8.0+ / MariaDB 10.11+
-- 字符集：utf8mb4
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
SET TIME_ZONE = "+00:00";

-- ================================================================
-- 1. 用户表
-- ================================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(20) NOT NULL COMMENT '用户名 (原姓名)',
  `password` VARCHAR(255) NOT NULL COMMENT '密码 (bcrypt 哈希)',
  `password_answer` VARCHAR(255) DEFAULT NULL COMMENT '密保答案',
  `gender` ENUM('male','female') NOT NULL DEFAULT 'male' COMMENT '性别',
  `referrer` VARCHAR(20) DEFAULT NULL COMMENT '介绍人',
  `email` VARCHAR(60) DEFAULT NULL COMMENT '信箱',
  `avatar` VARCHAR(100) DEFAULT '1.gif' COMMENT '头像文件名',
  `status` ENUM('normal','jailed','banned','dead','inn','sleeping','poisoned') NOT NULL DEFAULT 'normal' COMMENT '状态',
  `room_id` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '当前房间编号',
  `neili` INT NOT NULL DEFAULT 0 COMMENT '内力 (MP)',
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
  `sect_title` VARCHAR(20) DEFAULT '无' COMMENT '门派身份 (掌门/弟子等)',
  `salary_time` DATETIME DEFAULT NULL COMMENT '领薪时间 (原金钱)',
  `deposit` BIGINT NOT NULL DEFAULT 0 COMMENT '存款',
  `grade` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '等级 1-10',
  `login_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '登录次数',
  `registered_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `register_ip` VARCHAR(45) DEFAULT NULL COMMENT '注册 IP',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(45) DEFAULT NULL COMMENT '最后登录 IP',
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
  `lover_name` VARCHAR(20) DEFAULT NULL COMMENT '情人',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_sect` (`sect`),
  KEY `idx_faction` (`faction`),
  KEY `idx_grade` (`grade`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ================================================================
-- 2. 在线用户表
-- ================================================================
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
  UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_room_id` (`room_id`),
  KEY `idx_socket_id` (`socket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='在线用户表';

-- ================================================================
-- 3. 聊天消息表
-- ================================================================
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
  KEY `idx_room_line` (`room_id`, `line_no`),
  KEY `idx_sender` (`sender`),
  KEY `idx_receiver` (`receiver`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息表';

-- ================================================================
-- 4. 聊天房间表
-- ================================================================
CREATE TABLE IF NOT EXISTS `chat_rooms` (
  `id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `min_grade` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `max_grade` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天房间表';

-- ================================================================
-- 5. 聊天动作表
-- ================================================================
CREATE TABLE IF NOT EXISTS `chat_actions` (
  `id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL,
  `template` VARCHAR(255) NOT NULL,
  `action_type` VARCHAR(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天动作表';
