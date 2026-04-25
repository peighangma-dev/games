-- ========================================
-- 系统更新日志表 - System Update Logs
-- ========================================
-- 用于记录和管理系统的版本更新信息
-- 支持生产端通过 API 获取更新通知

CREATE TABLE IF NOT EXISTS `system_updates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `version` varchar(20) NOT NULL COMMENT '版本号 (格式：v1.0.0)',
  `version_code` int(10) unsigned NOT NULL COMMENT '版本号数字 (用于比较，如 10000 代表 v1.0.0)',
  `title` varchar(100) NOT NULL COMMENT '更新标题',
  `description` text DEFAULT NULL COMMENT '更新描述',
  `changes` json DEFAULT NULL COMMENT '更新内容列表 (JSON 数组)',
  `type` enum('major','minor','patch','hotfix') NOT NULL DEFAULT 'patch' COMMENT '更新类型',
  `priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal' COMMENT '优先级',
  `force_update` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否强制更新 (0=否，1=是)',
  `status` enum('draft','released','archived') NOT NULL DEFAULT 'draft' COMMENT '状态',
  `release_date` datetime DEFAULT NULL COMMENT '发布日期',
  `release_note` text DEFAULT NULL COMMENT '发布说明',
  `breaking_changes` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否有破坏性变更',
  `affected_modules` json DEFAULT NULL COMMENT '受影响的模块列表',
  `rollback_version` varchar(20) DEFAULT NULL COMMENT '可回滚的版本',
  `created_by` varchar(50) DEFAULT NULL COMMENT '创建人',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_version` (`version`),
  KEY `idx_version_code` (`version_code`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`),
  KEY `idx_priority` (`priority`),
  KEY `idx_release_date` (`release_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统更新日志';

-- ========================================
-- 更新推送记录表 - Update Push Records
-- ========================================
-- 记录更新推送到生产环境的历史

CREATE TABLE IF NOT EXISTS `update_push_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `update_id` int(10) unsigned NOT NULL COMMENT '更新 ID',
  `version` varchar(20) NOT NULL COMMENT '版本号',
  `environment` enum('development','staging','production') NOT NULL COMMENT '环境',
  `server_url` varchar(255) DEFAULT NULL COMMENT '服务器地址',
  `push_status` enum('pending','success','failed','partial') NOT NULL DEFAULT 'pending' COMMENT '推送状态',
  `push_time` datetime DEFAULT NULL COMMENT '推送时间',
  `acknowledge_time` datetime DEFAULT NULL COMMENT '生产端确认时间',
  `acknowledge_by` varchar(50) DEFAULT NULL COMMENT '确认人',
  `rollback_status` enum('none','pending','success','failed') NOT NULL DEFAULT 'none' COMMENT '回滚状态',
  `rollback_time` datetime DEFAULT NULL COMMENT '回滚时间',
  `error_message` text DEFAULT NULL COMMENT '错误信息',
  `metadata` json DEFAULT NULL COMMENT '元数据',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_update_id` (`update_id`),
  KEY `idx_environment` (`environment`),
  KEY `idx_push_status` (`push_status`),
  KEY `idx_push_time` (`push_time`),
  CONSTRAINT `fk_push_update` FOREIGN KEY (`update_id`) REFERENCES `system_updates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='更新推送记录';

-- ========================================
-- 初始化示例数据
-- ========================================

INSERT INTO `system_updates` (`version`, `version_code`, `title`, `description`, `changes`, `type`, `priority`, `force_update`, `status`, `release_date`, `breaking_changes`, `affected_modules`, `created_by`) VALUES
('v1.0.0', 10000, '初始版本', '系统首次发布', 
 '["初始化项目架构", "搭建基础数据库", "用户系统集成", "聊天功能实现", "游戏系统框架"]', 
 'major', 'normal', 0, 'released', NOW(), 0, '["all"]', 'system'),

('v1.1.0', 10100, '管理后台增强', '完善管理后台功能', 
 '["添加用户管理模块", "添加数据仪表盘", "优化权限控制", "修复已知 bug"]',
 'minor', 'normal', 0, 'released', NOW(), 0, '["admin","backend"]', 'admin'),

('v1.1.1', 10101, '管理后台 API 修复', '修复用户管理相关 API 问题',
 '["添加用户更新 API 路由", "修复服务器状态接口映射", "修复 Vue Router 警告", "修复数据库连接问题"]',
 'patch', 'high', 0, 'released', NOW(), 0, '["admin","backend","frontend"]', 'admin');
