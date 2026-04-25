-- 系统更新管理表
-- 用于记录和管理系统版本更新

CREATE TABLE IF NOT EXISTS `system_updates` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `version` VARCHAR(20) NOT NULL COMMENT '版本号 (v1.0.0)',
  `version_code` INT UNSIGNED NOT NULL COMMENT '版本代码 (用于排序)',
  `title` VARCHAR(200) NOT NULL COMMENT '更新标题',
  `description` TEXT COMMENT '更新描述',
  `changes` JSON COMMENT '更新内容列表',
  `type` ENUM('major', 'minor', 'patch', 'hotfix') DEFAULT 'patch' COMMENT '更新类型',
  `priority` ENUM('critical', 'high', 'normal', 'low') DEFAULT 'normal' COMMENT '优先级',
  `force_update` TINYINT(1) DEFAULT 0 COMMENT '是否强制更新',
  `status` ENUM('draft', 'released', 'archived') DEFAULT 'draft' COMMENT '状态',
  `release_date` DATETIME COMMENT '发布日期',
  `release_note` TEXT COMMENT '发布说明',
  `breaking_changes` TINYINT(1) DEFAULT 0 COMMENT '是否有破坏性变更',
  `affected_modules` JSON COMMENT '受影响的模块',
  `rollback_version` VARCHAR(20) COMMENT '可回滚版本',
  `metadata` JSON COMMENT '元数据 (包信息等)',
  `created_by` VARCHAR(50) DEFAULT 'admin' COMMENT '创建人',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_version` (`version`),
  KEY `idx_status` (`status`),
  KEY `idx_version_code` (`version_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统更新记录表';

-- 更新推送记录表
CREATE TABLE IF NOT EXISTS `update_push_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `update_id` INT UNSIGNED NOT NULL COMMENT '更新 ID',
  `version` VARCHAR(20) NOT NULL COMMENT '版本号',
  `environment` VARCHAR(50) DEFAULT 'production' COMMENT '推送环境',
  `server_url` VARCHAR(200) COMMENT '目标服务器',
  `push_status` ENUM('pending', 'success', 'failed', 'partial') DEFAULT 'pending' COMMENT '推送状态',
  `push_time` DATETIME COMMENT '推送时间',
  `acknowledge_time` DATETIME COMMENT '确认时间',
  `acknowledge_by` VARCHAR(50) COMMENT '确认人',
  `rollback_status` TINYINT(1) DEFAULT 0 COMMENT '是否回滚',
  `rollback_time` DATETIME COMMENT '回滚时间',
  `error_message` TEXT COMMENT '错误信息',
  `metadata` JSON COMMENT '元数据',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_update_id` (`update_id`),
  KEY `idx_environment` (`environment`),
  KEY `idx_push_status` (`push_status`),
  CONSTRAINT `fk_update_push_update_id` FOREIGN KEY (`update_id`) REFERENCES `system_updates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='更新推送记录表';

-- 插入示例更新记录
INSERT INTO `system_updates` (`version`, `version_code`, `title`, `description`, `changes`, `type`, `priority`, `status`, `release_date`, `release_note`) 
VALUES 
('v1.0.1', 10001, '系统更新功能上线', '新增在线更新管理功能', '["新增管理后台更新管理菜单", "新增仪表盘更新提示功能", "支持在线检查和安装更新"]', 'minor', 'normal', 'released', NOW(), '第一个正式更新版本')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);
