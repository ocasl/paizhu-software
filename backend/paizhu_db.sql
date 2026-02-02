/*
 Navicat Premium Data Transfer

 Source Server         : localhost_3306
 Source Server Type    : MySQL
 Source Server Version : 80016 (8.0.16)
 Source Host           : localhost:3306
 Source Schema         : paizhu_db

 Target Server Type    : MySQL
 Target Server Version : 80016 (8.0.16)
 File Encoding         : 65001

 Date: 30/01/2026 15:31:34
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for attachments
-- ----------------------------
DROP TABLE IF EXISTS `attachments`;
CREATE TABLE `attachments`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '上传用户ID',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类',
  `original_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '原文件名',
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '存储文件名',
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件存储路径',
  `file_size` int(11) NULL DEFAULT NULL COMMENT '文件大小(字节)',
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'MIME类型',
  `parsed_data` json NULL COMMENT '解析后的数据',
  `upload_month` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '上传月份 YYYY-MM',
  `related_log_id` int(11) NULL DEFAULT NULL COMMENT '关联的检察记录ID',
  `related_log_type` enum('daily','weekly','monthly','immediate') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '检察记录类型',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_category`(`category` ASC) USING BTREE,
  INDEX `idx_upload_month`(`upload_month` ASC) USING BTREE,
  INDEX `attachments_user_id`(`user_id` ASC) USING BTREE,
  INDEX `attachments_category`(`category` ASC) USING BTREE,
  INDEX `attachments_upload_month`(`upload_month` ASC) USING BTREE,
  INDEX `idx_attachments_related_log_id`(`related_log_id` ASC) USING BTREE,
  INDEX `idx_attachments_related_log_type`(`related_log_type` ASC) USING BTREE,
  INDEX `idx_attachments_related_log`(`related_log_id` ASC, `related_log_type` ASC) USING BTREE,
  INDEX `attachments_related_log_id`(`related_log_id` ASC) USING BTREE,
  INDEX `attachments_related_log_type`(`related_log_type` ASC) USING BTREE,
  INDEX `attachments_related_log_id_related_log_type`(`related_log_id` ASC, `related_log_type` ASC) USING BTREE,
  CONSTRAINT `attachments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 22 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '附件表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for blacklists
-- ----------------------------
DROP TABLE IF EXISTS `blacklists`;
CREATE TABLE `blacklists`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prisoner_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '罪犯编号',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '姓名',
  `gender` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '性别',
  `ethnicity` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '民族',
  `birth_date` date NULL DEFAULT NULL COMMENT '出生日期',
  `native_place` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '籍贯/国籍',
  `political_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '捕前面貌',
  `crime` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '原判罪名',
  `original_term` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '原判刑期',
  `term_start` date NULL DEFAULT NULL COMMENT '原判刑期起日',
  `term_end` date NULL DEFAULT NULL COMMENT '原判刑期止日',
  `admission_date` date NULL DEFAULT NULL COMMENT '入监日期',
  `involvement_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '三涉情况：涉黑/涉恶等',
  `custody_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '在押现状',
  `sentence_change` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '刑罚变动情况',
  `prison_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '派驻监所名称',
  `sync_batch` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '同步批次ID',
  `synced_at` datetime NULL DEFAULT NULL COMMENT '同步时间',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_blacklists_prisoner_prison`(`prisoner_id` ASC, `prison_name` ASC) USING BTREE,
  INDEX `blacklists_involvement_type`(`involvement_type` ASC) USING BTREE,
  INDEX `blacklists_sync_batch`(`sync_batch` ASC) USING BTREE,
  INDEX `idx_blacklists_prison_name`(`prison_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 39 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for confinements
-- ----------------------------
DROP TABLE IF EXISTS `confinements`;
CREATE TABLE `confinements`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prisoner_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '罪犯编号',
  `create_date` date NULL DEFAULT NULL COMMENT '制单时间',
  `start_date` date NULL DEFAULT NULL COMMENT '禁闭起日',
  `end_date` date NULL DEFAULT NULL COMMENT '禁闭止日',
  `applicable_clause` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '适用条款',
  `violation_fact` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '违规事实',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '待审核' COMMENT '业务状态',
  `prison_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '派驻监所名称',
  `sync_batch` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '同步批次ID',
  `synced_at` datetime NULL DEFAULT NULL COMMENT '同步时间',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `confinements_prisoner_id`(`prisoner_id` ASC) USING BTREE,
  INDEX `confinements_create_date`(`create_date` ASC) USING BTREE,
  INDEX `confinements_sync_batch`(`sync_batch` ASC) USING BTREE,
  INDEX `idx_confinements_prison_name`(`prison_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for criminal_reports
-- ----------------------------
DROP TABLE IF EXISTS `criminal_reports`;
CREATE TABLE `criminal_reports`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prison_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '监狱名称',
  `report_month` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '报告月份，格式：2025-10',
  `report_date` date NULL DEFAULT NULL COMMENT '报告日期',
  `period` int(11) NULL DEFAULT NULL COMMENT '期数',
  `has_escape` tinyint(1) NULL DEFAULT 0 COMMENT '是否有罪犯脱逃',
  `has_major_case` tinyint(1) NULL DEFAULT 0 COMMENT '是否有重大案件',
  `has_safety_accident` tinyint(1) NULL DEFAULT 0 COMMENT '是否有安全事故',
  `has_health_event` tinyint(1) NULL DEFAULT 0 COMMENT '是否有公共卫生事件',
  `has_internal_case` tinyint(1) NULL DEFAULT 0 COMMENT '是否有狱内发案',
  `violation_count` int(11) NULL DEFAULT NULL COMMENT '违规人数',
  `confinement_count` int(11) NULL DEFAULT NULL COMMENT '禁闭人数',
  `warning_count` int(11) NULL DEFAULT NULL COMMENT '警告人数',
  `total_prisoners` int(11) NULL DEFAULT NULL COMMENT '在押罪犯总数',
  `major_criminal` int(11) NULL DEFAULT NULL COMMENT '重大刑事犯',
  `death_suspended` int(11) NULL DEFAULT NULL COMMENT '死缓犯',
  `life_sentence` int(11) NULL DEFAULT NULL COMMENT '无期犯',
  `multiple_convictions` int(11) NULL DEFAULT NULL COMMENT '二次以上判刑',
  `foreign_prisoners` int(11) NULL DEFAULT NULL COMMENT '外籍犯',
  `hk_macao_taiwan` int(11) NULL DEFAULT NULL COMMENT '港澳台',
  `mental_illness` int(11) NULL DEFAULT NULL COMMENT '精神病犯',
  `former_provincial` int(11) NULL DEFAULT NULL COMMENT '原地厅以上',
  `former_county` int(11) NULL DEFAULT NULL COMMENT '原县团级以上',
  `falun_gong` int(11) NULL DEFAULT NULL COMMENT '法轮功',
  `drug_history` int(11) NULL DEFAULT NULL COMMENT '有吸毒史',
  `drug_related` int(11) NULL DEFAULT NULL COMMENT '涉毒犯',
  `newly_admitted` int(11) NULL DEFAULT NULL COMMENT '新收押罪犯',
  `juvenile_female` int(11) NULL DEFAULT NULL COMMENT '未成年女犯',
  `gang_related` int(11) NULL DEFAULT NULL COMMENT '涉黑罪犯',
  `evil_related` int(11) NULL DEFAULT NULL COMMENT '涉恶罪犯',
  `dangerous_security` int(11) NULL DEFAULT NULL COMMENT '危安罪犯',
  `original_filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '原始文件名',
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '文件存储路径',
  `sync_batch` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '同步批次ID',
  `synced_at` datetime NULL DEFAULT NULL COMMENT '同步时间',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `criminal_reports_prison_name_report_month`(`prison_name` ASC, `report_month` ASC) USING BTREE,
  INDEX `criminal_reports_report_month`(`report_month` ASC) USING BTREE,
  INDEX `criminal_reports_prison_name`(`prison_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for daily_logs
-- ----------------------------
DROP TABLE IF EXISTS `daily_logs`;
CREATE TABLE `daily_logs`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `log_date` date NOT NULL COMMENT '记录日期',
  `prison_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '派驻监所',
  `inspector_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '派驻人员',
  `three_scenes` json NULL COMMENT '三大现场检察数据',
  `strict_control` json NULL COMMENT '严管禁闭数据',
  `police_equipment` json NULL COMMENT '警戒具检察数据',
  `gang_prisoners` json NULL COMMENT '涉黑罪犯数据',
  `admission` json NULL COMMENT '收押调出数据',
  `monitor_check` json NULL COMMENT '监控抽查数据',
  `supervision_situation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '检察监督情况',
  `feedback_situation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '采纳反馈情况',
  `other_work` json NULL COMMENT '其他检察工作',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '备注',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_log_date`(`log_date` ASC) USING BTREE,
  INDEX `idx_user_date`(`user_id` ASC, `log_date` ASC) USING BTREE,
  INDEX `daily_logs_user_id`(`user_id` ASC) USING BTREE,
  INDEX `daily_logs_log_date`(`log_date` ASC) USING BTREE,
  INDEX `daily_logs_user_id_log_date`(`user_id` ASC, `log_date` ASC) USING BTREE,
  CONSTRAINT `daily_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 18 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '日检察记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for immediate_events
-- ----------------------------
DROP TABLE IF EXISTS `immediate_events`;
CREATE TABLE `immediate_events`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `event_date` date NOT NULL COMMENT '事件日期',
  `event_type` enum('escape','selfHarm','death','epidemic','accident','paroleRequest','disciplinaryAction') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '事件类型',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '事件描述',
  `parole_data` json NULL COMMENT '减刑假释数据',
  `attachment_ids` json NULL COMMENT '相关附件ID列表',
  `status` enum('pending','processed','closed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending' COMMENT '处理状态',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '事件标题',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_event_date`(`event_date` ASC) USING BTREE,
  INDEX `idx_event_type`(`event_type` ASC) USING BTREE,
  INDEX `immediate_events_user_id`(`user_id` ASC) USING BTREE,
  INDEX `immediate_events_event_date`(`event_date` ASC) USING BTREE,
  INDEX `immediate_events_event_type`(`event_type` ASC) USING BTREE,
  CONSTRAINT `immediate_events_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '及时检察事件表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mail_records
-- ----------------------------
DROP TABLE IF EXISTS `mail_records`;
CREATE TABLE `mail_records`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sequence_no` int(11) NULL DEFAULT NULL COMMENT '序号',
  `open_date` date NULL DEFAULT NULL COMMENT '开箱日期',
  `prison_area` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '监区',
  `prisoner_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '罪犯名字',
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '事由',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '类别',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '备注',
  `prison_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '派驻监所名称',
  `sync_batch` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '同步批次ID',
  `synced_at` datetime NULL DEFAULT NULL COMMENT '同步时间',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `mail_records_open_date`(`open_date` ASC) USING BTREE,
  INDEX `mail_records_prison_area`(`prison_area` ASC) USING BTREE,
  INDEX `mail_records_sync_batch`(`sync_batch` ASC) USING BTREE,
  INDEX `idx_mail_records_prison_name`(`prison_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 59 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for monthly_archives
-- ----------------------------
DROP TABLE IF EXISTS `monthly_archives`;
CREATE TABLE `monthly_archives`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `year` int(11) NOT NULL COMMENT '年份',
  `month` int(11) NOT NULL COMMENT '月份(1-12)',
  `prison_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '派驻监所名称',
  `user_id` int(11) NOT NULL COMMENT '提交人ID',
  `reviewer_id` int(11) NULL DEFAULT NULL COMMENT '审批人ID',
  `status` enum('draft','pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'draft' COMMENT '状态: draft-草稿, pending-待审批, approved-已通过, rejected-已驳回',
  `signature_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '审批签名图片路径',
  `reject_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '驳回原因',
  `archive_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '压缩包文件路径',
  `summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '月度工作摘要',
  `daily_log_count` int(11) NULL DEFAULT 0 COMMENT '日志数量',
  `attachment_count` int(11) NULL DEFAULT 0 COMMENT '附件数量',
  `submitted_at` datetime NULL DEFAULT NULL COMMENT '提交时间',
  `reviewed_at` datetime NULL DEFAULT NULL COMMENT '审批时间',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `immediate_event_count` int(11) NULL DEFAULT 0 COMMENT '及时检察事件数量',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `monthly_archives_year_month_prison_name`(`year` ASC, `month` ASC, `prison_name` ASC) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `reviewer_id`(`reviewer_id` ASC) USING BTREE,
  CONSTRAINT `monthly_archives_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `monthly_archives_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '月度归档表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for monthly_basic_info
-- ----------------------------
DROP TABLE IF EXISTS `monthly_basic_info`;
CREATE TABLE `monthly_basic_info`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `report_month` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '报告月份 YYYY-MM',
  `total_prisoners` int(11) NULL DEFAULT 0 COMMENT '在押罪犯总数',
  `major_criminals` int(11) NULL DEFAULT 0 COMMENT '重大刑事犯',
  `death_sentence` int(11) NULL DEFAULT 0 COMMENT '死缓犯',
  `life_sentence` int(11) NULL DEFAULT 0 COMMENT '无期犯',
  `repeat_offenders` int(11) NULL DEFAULT 0 COMMENT '二次以上判刑罪犯',
  `foreign_prisoners` int(11) NULL DEFAULT 0 COMMENT '外籍犯',
  `hk_macao_taiwan` int(11) NULL DEFAULT 0 COMMENT '港澳台罪犯',
  `mental_illness` int(11) NULL DEFAULT 0 COMMENT '精神病犯',
  `former_officials` int(11) NULL DEFAULT 0 COMMENT '原地厅以上罪犯',
  `former_county_level` int(11) NULL DEFAULT 0 COMMENT '原县团级以上罪犯',
  `falun_gong` int(11) NULL DEFAULT 0 COMMENT '法轮功',
  `drug_history` int(11) NULL DEFAULT 0 COMMENT '有吸毒史罪犯',
  `drug_crimes` int(11) NULL DEFAULT 0 COMMENT '涉毒犯',
  `new_admissions` int(11) NULL DEFAULT 0 COMMENT '新收押罪犯',
  `minor_females` int(11) NULL DEFAULT 0 COMMENT '未成年女犯',
  `gang_related` int(11) NULL DEFAULT 0 COMMENT '涉黑罪犯',
  `evil_forces` int(11) NULL DEFAULT 0 COMMENT '涉恶罪犯',
  `endangering_safety` int(11) NULL DEFAULT 0 COMMENT '危安罪犯',
  `released_count` int(11) NULL DEFAULT 0 COMMENT '刑满释放出监罪犯',
  `recorded_punishments` int(11) NULL DEFAULT 0 COMMENT '记过人数',
  `recorded_punishments_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '记过原因',
  `confinement_punishments` int(11) NULL DEFAULT 0 COMMENT '禁闭人数',
  `confinement_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '禁闭原因',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_user_month`(`user_id` ASC, `report_month` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_report_month`(`report_month` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '月度基本信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for monthly_records
-- ----------------------------
DROP TABLE IF EXISTS `monthly_records`;
CREATE TABLE `monthly_records`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `record_month` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '记录月份 YYYY-MM',
  `visit_check` json NULL COMMENT '会见检察',
  `meeting` json NULL COMMENT '会议参加情况',
  `punishment` json NULL COMMENT '处分监督',
  `position_stats` json NULL COMMENT '岗位增减统计',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '备注',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `log_id` int(11) NULL DEFAULT NULL COMMENT '关联的日志ID',
  `log_date` date NULL DEFAULT NULL COMMENT '关联的日志日期',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_record_month`(`record_month` ASC) USING BTREE,
  INDEX `monthly_records_user_id`(`user_id` ASC) USING BTREE,
  INDEX `monthly_records_record_month`(`record_month` ASC) USING BTREE,
  INDEX `idx_monthly_records_log_id`(`log_id` ASC) USING BTREE,
  INDEX `idx_monthly_records_log_date`(`log_date` ASC) USING BTREE,
  INDEX `monthly_records_log_id`(`log_id` ASC) USING BTREE,
  INDEX `monthly_records_log_date`(`log_date` ASC) USING BTREE,
  CONSTRAINT `monthly_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '月检察记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for prisoners
-- ----------------------------
DROP TABLE IF EXISTS `prisoners`;
CREATE TABLE `prisoners`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prisoner_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '罪犯编号，如 1000000001',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '罪犯姓名',
  `gender` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '性别',
  `birth_date` date NULL DEFAULT NULL COMMENT '出生日期',
  `ethnicity` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '民族',
  `education` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '文化程度',
  `sentence_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '刑种，如有期徒刑、无期徒刑',
  `crime` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '罪名',
  `original_term` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '原判刑期，格式如 10_06_00',
  `term_start` date NULL DEFAULT NULL COMMENT '刑期起日',
  `term_end` date NULL DEFAULT NULL COMMENT '刑期止日',
  `prison_unit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '所属单位（监狱名称）',
  `prison_area` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '所属监区',
  `native_place` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '籍贯/国籍',
  `political_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '捕前面貌',
  `admission_date` date NULL DEFAULT NULL COMMENT '入监日期',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `prisoner_id`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoners_prisoner_id`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_2`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_3`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_4`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_5`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_6`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_7`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_8`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_9`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_10`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_11`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_12`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_13`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_14`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_15`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_16`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_17`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_18`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_19`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_20`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_21`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_22`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_23`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_24`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_25`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_26`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_27`(`prisoner_id` ASC) USING BTREE,
  UNIQUE INDEX `prisoner_id_28`(`prisoner_id` ASC) USING BTREE,
  INDEX `prisoners_prison_unit`(`prison_unit` ASC) USING BTREE,
  INDEX `prisoners_prison_area`(`prison_area` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for restraint_usages
-- ----------------------------
DROP TABLE IF EXISTS `restraint_usages`;
CREATE TABLE `restraint_usages`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prisoner_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '罪犯编号',
  `create_date` date NULL DEFAULT NULL COMMENT '制单时间',
  `restraint_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '使用警戒具名称',
  `applicable_clause` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '使用条款',
  `days` int(11) NULL DEFAULT NULL COMMENT '加戴戒具天数',
  `start_date` date NULL DEFAULT NULL COMMENT '使用起日',
  `end_date` date NULL DEFAULT NULL COMMENT '使用止日',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '待审核' COMMENT '业务状态',
  `prison_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '派驻监所名称',
  `sync_batch` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '同步批次ID',
  `synced_at` datetime NULL DEFAULT NULL COMMENT '同步时间',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `restraint_usages_prisoner_id`(`prisoner_id` ASC) USING BTREE,
  INDEX `restraint_usages_create_date`(`create_date` ASC) USING BTREE,
  INDEX `restraint_usages_sync_batch`(`sync_batch` ASC) USING BTREE,
  INDEX `idx_restraint_usages_prison_name`(`prison_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for strict_educations
-- ----------------------------
DROP TABLE IF EXISTS `strict_educations`;
CREATE TABLE `strict_educations`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prisoner_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '罪犯编号',
  `create_date` date NULL DEFAULT NULL COMMENT '制单时间',
  `applicable_clause` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '适用条款',
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '严管教育原因',
  `days` int(11) NULL DEFAULT NULL COMMENT '严管天数',
  `start_date` date NULL DEFAULT NULL COMMENT '严管起日',
  `end_date` date NULL DEFAULT NULL COMMENT '严管止日',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '待审核' COMMENT '业务状态',
  `prison_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '派驻监所名称',
  `sync_batch` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '同步批次ID',
  `synced_at` datetime NULL DEFAULT NULL COMMENT '同步时间',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `strict_educations_prisoner_id`(`prisoner_id` ASC) USING BTREE,
  INDEX `strict_educations_create_date`(`create_date` ASC) USING BTREE,
  INDEX `strict_educations_sync_batch`(`sync_batch` ASC) USING BTREE,
  INDEX `idx_strict_educations_prison_name`(`prison_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_prison_scopes
-- ----------------------------
DROP TABLE IF EXISTS `user_prison_scopes`;
CREATE TABLE `user_prison_scopes`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `prison_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '监狱名称',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_user_prison`(`user_id` ASC, `prison_name` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_prison_name`(`prison_name` ASC) USING BTREE,
  CONSTRAINT `fk_user_prison_scope_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 44 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户监狱范围表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户名',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码(加密)',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '姓名',
  `prison_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '派驻监所名称',
  `role` enum('admin','inspector','leader','top_viewer') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'inspector' COMMENT '角色: admin-管理员, inspector-派驻检察官, leader-业务分管领导, top_viewer-院领导',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '联系电话',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'active' COMMENT '账号状态',
  `last_login` datetime NULL DEFAULT NULL COMMENT '最后登录时间',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 32 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for weekly_records
-- ----------------------------
DROP TABLE IF EXISTS `weekly_records`;
CREATE TABLE `weekly_records`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `record_date` date NOT NULL COMMENT '记录日期',
  `week_number` int(11) NULL DEFAULT NULL COMMENT '第几周',
  `hospital_check` json NULL COMMENT '医院禁闭室检察',
  `injury_check` json NULL COMMENT '外伤检察',
  `talk_records` json NULL COMMENT '谈话记录列表',
  `mailbox` json NULL COMMENT '检察官信箱',
  `contraband` json NULL COMMENT '违禁品检查',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '备注',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `log_id` int(11) NULL DEFAULT NULL COMMENT '关联的日志ID',
  `log_date` date NULL DEFAULT NULL COMMENT '关联的日志日期',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_record_date`(`record_date` ASC) USING BTREE,
  INDEX `weekly_records_user_id`(`user_id` ASC) USING BTREE,
  INDEX `weekly_records_record_date`(`record_date` ASC) USING BTREE,
  INDEX `idx_weekly_records_log_id`(`log_id` ASC) USING BTREE,
  INDEX `idx_weekly_records_log_date`(`log_date` ASC) USING BTREE,
  INDEX `weekly_records_log_id`(`log_id` ASC) USING BTREE,
  INDEX `weekly_records_log_date`(`log_date` ASC) USING BTREE,
  CONSTRAINT `weekly_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '周检察记录表' ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
