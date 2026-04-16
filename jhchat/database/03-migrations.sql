-- ================================================================
-- 江湖聊天室 - 数据库迁移脚本
-- 版本：v1.0
-- 包含：P0/P1 功能、宠物系统、工作系统等新增表结构
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ================================================================
-- 1. 医疗记录表 (P0/P1 - 医院系统)
-- ================================================================
CREATE TABLE IF NOT EXISTS `medical_records` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `patient_name` VARCHAR(20) NOT NULL,
  `doctor_name` VARCHAR(20) DEFAULT NULL,
  `nurse_name` VARCHAR(20) DEFAULT NULL,
  `diagnosis` VARCHAR(255) DEFAULT NULL,
  `treatment` VARCHAR(255) DEFAULT NULL,
  `cost` BIGINT NOT NULL DEFAULT 0,
  `status` ENUM('pending','completed','cancelled') DEFAULT 'completed',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_patient` (`patient_name`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='医疗记录表';

-- ================================================================
-- 2. 贷款记录表 (P0/P1 - 银行系统)
-- ================================================================
CREATE TABLE IF NOT EXISTS `loans` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(20) NOT NULL,
  `amount` BIGINT NOT NULL,
  `remaining` BIGINT NOT NULL,
  `interest_rate` DECIMAL(5,2) DEFAULT 5.00,
  `due_date` DATETIME DEFAULT NULL,
  `status` ENUM('active','paid','overdue') DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_username` (`username`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='贷款记录表';

-- ================================================================
-- 3. 情人关系表 (P0/P1 - 情人系统)
-- ================================================================
CREATE TABLE IF NOT EXISTS `lovers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user1` VARCHAR(20) NOT NULL,
  `user2` VARCHAR(20) NOT NULL,
  `status` ENUM('lovers','married','divorced') DEFAULT 'lovers',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lovers` (`user1`, `user2`),
  KEY `idx_user1` (`user1`),
  KEY `idx_user2` (`user2`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='情人关系表';

-- ================================================================
-- 4. 工作记录表 (P0/P1 - 工作系统)
-- ================================================================
CREATE TABLE IF NOT EXISTS `work_records` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `work_type` VARCHAR(20) NOT NULL COMMENT '工作类型：mining/ice/iron',
  `earnings` BIGINT NOT NULL DEFAULT 0,
  `experience` INT NOT NULL DEFAULT 0,
  `work_count` INT NOT NULL DEFAULT 1,
  `last_work_time` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_work` (`user_id`, `work_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作记录表';

-- ================================================================
-- 5. 用户工作状态表 (P0/P1 - 工作系统)
-- ================================================================
CREATE TABLE IF NOT EXISTS `user_work_status` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL UNIQUE,
  `working` TINYINT(1) DEFAULT FALSE,
  `current_job` VARCHAR(20) DEFAULT NULL,
  `work_start_time` DATETIME DEFAULT NULL,
  `work_finish_time` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_working` (`working`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户工作状态表';

-- ================================================================
-- 6. 宠物规则表 (宠物系统)
-- ================================================================
CREATE TABLE IF NOT EXISTS `pet_rules` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pet_type` VARCHAR(20) NOT NULL,
  `pet_name` VARCHAR(50) NOT NULL,
  `buy_price` BIGINT NOT NULL DEFAULT 0,
  `sell_price` BIGINT NOT NULL DEFAULT 0,
  `food_consumption` INT NOT NULL DEFAULT 2,
  `clean_consumption` INT NOT NULL DEFAULT 4,
  `happy_consumption` INT NOT NULL DEFAULT 2,
  `health_consumption` INT NOT NULL DEFAULT 3,
  `lifespan_consumption` INT NOT NULL DEFAULT 5,
  `production_value` INT NOT NULL DEFAULT 0,
  `dellifeday` INT NOT NULL DEFAULT 5,
  `delhungerday` INT NOT NULL DEFAULT 4,
  `delcleanday` INT NOT NULL DEFAULT 2,
  `delhappyday` INT NOT NULL DEFAULT 4,
  `delhealthday` INT NOT NULL DEFAULT 3,
  `maxfood` INT NOT NULL DEFAULT 100,
  `maxclean` INT NOT NULL DEFAULT 100,
  `maxhappy` INT NOT NULL DEFAULT 100,
  `maxhealth` INT NOT NULL DEFAULT 100,
  `maxlifespan` INT NOT NULL DEFAULT 100,
  `maxproduction` INT NOT NULL DEFAULT 100,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pet_type` (`pet_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='宠物规则配置表';

-- ================================================================
-- 7. 用户宠物表 (宠物系统)
-- ================================================================
CREATE TABLE IF NOT EXISTS `user_pets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `pet_name` VARCHAR(20) NOT NULL,
  `pet_type` VARCHAR(20) NOT NULL,
  `lifespan` INT NOT NULL DEFAULT 100,
  `food` INT NOT NULL DEFAULT 100,
  `clean` INT NOT NULL DEFAULT 100,
  `happy` INT NOT NULL DEFAULT 100,
  `health` INT NOT NULL DEFAULT 100,
  `production` INT NOT NULL DEFAULT 0,
  `gender` ENUM('male','female') DEFAULT 'male',
  `father` VARCHAR(20) DEFAULT NULL,
  `mother` VARCHAR(20) DEFAULT NULL,
  `last_care_time` DATETIME DEFAULT NULL,
  `care_count_today` INT DEFAULT 0,
  `is_dead` TINYINT(1) DEFAULT FALSE,
  `died_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_dead` (`is_dead`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户宠物表';

-- ================================================================
-- 8. 打坐记录表
-- ================================================================
CREATE TABLE IF NOT EXISTS `meditate_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `neili_gain` INT NOT NULL DEFAULT 0,
  `wugong_gain` INT NOT NULL DEFAULT 0,
  `silver_cost` BIGINT NOT NULL DEFAULT 1000,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打坐记录表';

-- ================================================================
-- 9. 击杀记录表
-- ================================================================
CREATE TABLE IF NOT EXISTS `kill_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `victim` VARCHAR(20) NOT NULL,
  `killer` VARCHAR(20) NOT NULL,
  `skill` VARCHAR(50) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_victim` (`victim`),
  KEY `idx_killer` (`killer`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='击杀记录表';

-- ================================================================
-- 10. 禁言名单表
-- ================================================================
CREATE TABLE IF NOT EXISTS `mute_list` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(20) NOT NULL,
  `muted_by` VARCHAR(20) NOT NULL,
  `reason` VARCHAR(255) DEFAULT NULL,
  `expires_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_username` (`username`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='禁言名单表';

-- ================================================================
-- 11. 物品表
-- ================================================================
CREATE TABLE IF NOT EXISTS `items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner` VARCHAR(20) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `type` VARCHAR(20) DEFAULT NULL,
  `description` TEXT,
  `price` BIGINT DEFAULT 0,
  `quantity` INT NOT NULL DEFAULT 1,
  `is_equipped` TINYINT(1) DEFAULT 0,
  `effects` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物品表';

-- ================================================================
-- 12. 用户卡片表
-- ================================================================
CREATE TABLE IF NOT EXISTS `user_cards` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner` VARCHAR(20) NOT NULL,
  `card_name` VARCHAR(50) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_owner_card` (`owner`, `card_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户卡片表';

-- ================================================================
-- 13. 武功秘籍表
-- ================================================================
CREATE TABLE IF NOT EXISTS `secret_skills` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `sect` VARCHAR(20) DEFAULT NULL,
  `type` ENUM('internal','external','light','special') DEFAULT 'internal',
  `description` TEXT,
  `price` BIGINT DEFAULT 0,
  `min_wugong` INT DEFAULT 0,
  `min_neili` INT DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sect` (`sect`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='武功秘籍表';

-- ================================================================
-- 14. 已学武功表
-- ================================================================
CREATE TABLE IF NOT EXISTS `learned_skills` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `skill_id` INT UNSIGNED NOT NULL,
  `level` INT DEFAULT 1,
  `progress` INT DEFAULT 0,
  `type` VARCHAR(20) DEFAULT NULL,
  `sect` VARCHAR(20) DEFAULT NULL,
  `attack_bonus` INT DEFAULT 0,
  `defense_bonus` INT DEFAULT 0,
  `special_effect` VARCHAR(255) DEFAULT NULL,
  `learned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_skill` (`user_id`, `skill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='已学武功表';

-- ================================================================
-- 15. 管理员改钱日志表
-- ================================================================
CREATE TABLE IF NOT EXISTS `admin_silver_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id` INT UNSIGNED NOT NULL,
  `admin_username` VARCHAR(20) NOT NULL,
  `target_id` INT UNSIGNED NOT NULL,
  `target_username` VARCHAR(20) NOT NULL,
  `old_silver` BIGINT NOT NULL,
  `new_silver` BIGINT NOT NULL,
  `change_amount` BIGINT NOT NULL,
  `reason` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin` (`admin_id`),
  KEY `idx_target` (`target_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员改钱日志表';

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
