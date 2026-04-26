-- =====================================================
-- 江湖聊天室 - 生产数据库结构同步脚本
-- 版本：v2026.3
-- 说明：仅同步表结构，不包含数据
-- 使用：mysql -u jhchat -p'密码' jhchat < PRODUCTION_DB_SYNC.sql
-- =====================================================

-- 1. 等级配置表（如果不存在则创建）
CREATE TABLE IF NOT EXISTS `user_level_config` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `level` TINYINT UNSIGNED NOT NULL COMMENT '等级 (1-10)',
  `required_exp` BIGINT NOT NULL COMMENT '升级所需经验',
  `max_daily_chat_exp` INT NOT NULL DEFAULT 500 COMMENT '每日聊天经验上限',
  `chat_exp_per_minute` INT NOT NULL DEFAULT 1 COMMENT '每分钟聊天获得经验',
  `can_be_admin` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否可担任管理员',
  `min_register_days` INT NOT NULL DEFAULT 0 COMMENT '最少注册天数要求',
  `min_total_exp` BIGINT NOT NULL DEFAULT 0 COMMENT '最少总经验要求',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户等级配置';

-- 初始化等级配置（如果已有配置则忽略）
INSERT INTO `user_level_config` (`level`, `required_exp`, `max_daily_chat_exp`, `chat_exp_per_minute`, `can_be_admin`, `min_register_days`, `min_total_exp`) VALUES
(1, 0, 100, 1, 0, 0, 0),
(2, 1000, 200, 2, 0, 0, 0),
(3, 3000, 300, 3, 0, 1, 1000),
(4, 6000, 400, 4, 0, 3, 3000),
(5, 10000, 500, 5, 1, 7, 6000),
(6, 15000, 600, 6, 1, 15, 10000),
(7, 25000, 700, 7, 1, 30, 15000),
(8, 40000, 800, 8, 1, 60, 25000),
(9, 60000, 900, 9, 1, 90, 40000),
(10, 100000, 1000, 10, 1, 180, 60000)
ON DUPLICATE KEY UPDATE `level`=`level`;

-- 2. 聊天经验日志表
CREATE TABLE IF NOT EXISTS `chat_exp_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户 ID',
  `username` VARCHAR(20) NOT NULL COMMENT '用户名',
  `exp_gain` INT NOT NULL COMMENT '获得经验',
  `chat_minutes` INT NOT NULL COMMENT '聊天分钟数',
  `is_daily_limit` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否达到日 limit',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天经验日志';

-- 3. 管理员申请记录表
CREATE TABLE IF NOT EXISTS `admin_applications` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL COMMENT '申请人 ID',
  `username` VARCHAR(20) NOT NULL COMMENT '申请人用户名',
  `current_grade` TINYINT UNSIGNED NOT NULL COMMENT '当前等级',
  `applied_grade` TINYINT UNSIGNED NOT NULL COMMENT '申请等级',
  `reason` TEXT COMMENT '申请理由',
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' COMMENT '状态',
  `reviewer` VARCHAR(20) DEFAULT NULL COMMENT '审核人',
  `review_comment` TEXT COMMENT '审核意见',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员申请记录';

-- 4. 用户表新字段（分别添加，避免语法错误）
-- 注意：MySQL 5.7 不支持 IF NOT EXISTS，需要手动检查

-- 添加 chat_minutes_today 字段
SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname = 'chat_minutes_today';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN `', @columnname, '` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT \'今日聊天分钟数\' AFTER `practice_exp_total`')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 添加 chat_minutes_total 字段
SET @columnname = 'chat_minutes_total';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN `', @columnname, '` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT \'累计聊天分钟数\' AFTER `chat_minutes_today`')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 添加 last_chat_time 字段
SET @columnname = 'last_chat_time';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN `', @columnname, '` DATETIME DEFAULT NULL COMMENT \'最后聊天时间\' AFTER `chat_minutes_total`')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 确保经验字段类型正确
ALTER TABLE users 
MODIFY COLUMN `all_value` BIGINT NOT NULL DEFAULT 0 COMMENT '总经验值',
MODIFY COLUMN `month_value` BIGINT NOT NULL DEFAULT 0 COMMENT '月度经验值';

-- 添加经验字段索引（如果不存在）
ALTER TABLE users ADD INDEX `idx_total_exp` (`all_value`);
ALTER TABLE users ADD INDEX `idx_monthly_exp` (`month_value`);

-- =====================================================
-- 同步完成
-- =====================================================
