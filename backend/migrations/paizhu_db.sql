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

 Date: 03/02/2026 12:43:08
*/

-- ----------------------------
-- 创建数据库
-- ----------------------------
CREATE DATABASE IF NOT EXISTS `paizhu_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `paizhu_db`;

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
) ENGINE = InnoDB AUTO_INCREMENT = 25 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '附件表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of attachments
-- ----------------------------
INSERT INTO `attachments` VALUES (16, 1, 'release-transcript', '微信图片_2025-10-10_162624_623.jpg', '20260129_微信图片_2025_10_10_162624_623_1769677116454.jpg', 'E:\\CODE\\paizhu-software\\backend\\uploads\\attachments\\20260129_微信图片_2025_10_10_162624_623_1769677116454.jpg', 115511, 'image/jpeg', NULL, '2026-01', NULL, NULL, '2026-01-29 16:58:36', '2026-01-29 16:58:36');
INSERT INTO `attachments` VALUES (17, 1, 'immediate_event', '矩阵协议2024.docx', '20260130_矩阵协议2024_1769738460103.docx', 'E:\\CODE\\paizhu-software\\backend\\uploads\\attachments\\20260130_矩阵协议2024_1769738460103.docx', 19074, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', NULL, '2026-01', NULL, NULL, '2026-01-30 10:01:00', '2026-01-30 10:01:00');
INSERT INTO `attachments` VALUES (18, 1, 'immediate_event', '会议室智能控制系统用户手册.docx', '20260130_会议室智能控制系统用户手册_1769738460103.docx', 'E:\\CODE\\paizhu-software\\backend\\uploads\\attachments\\20260130_会议室智能控制系统用户手册_1769738460103.docx', 724881, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', NULL, '2026-01', NULL, NULL, '2026-01-30 10:01:00', '2026-01-30 10:01:00');
INSERT INTO `attachments` VALUES (19, 1, 'immediate_event', '矩阵协议2024.docx', '20260130_矩阵协议2024_1769740240302.docx', 'E:\\CODE\\paizhu-software\\backend\\uploads\\attachments\\20260130_矩阵协议2024_1769740240302.docx', 19074, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', NULL, '2026-01', NULL, NULL, '2026-01-30 10:30:40', '2026-01-30 10:30:40');
INSERT INTO `attachments` VALUES (20, 1, 'immediate_event', '会议室智能控制系统用户手册.docx', '20260130_会议室智能控制系统用户手册_1769740240301.docx', 'E:\\CODE\\paizhu-software\\backend\\uploads\\attachments\\20260130_会议室智能控制系统用户手册_1769740240301.docx', 724881, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', NULL, '2026-01', NULL, NULL, '2026-01-30 10:30:40', '2026-01-30 10:30:40');
INSERT INTO `attachments` VALUES (21, 1, 'daily_log', '卡通机器人形象设计.png', '20260130_daily_log_卡通机器人形象设计_1769743600645.png', 'E:\\CODE\\paizhu-software\\backend\\uploads\\attachments\\20260130_daily_log_卡通机器人形象设计_1769743600645.png', 1122852, 'image/png', NULL, '2026-01', 17, 'daily', '2026-01-30 11:26:40', '2026-01-30 11:26:40');
INSERT INTO `attachments` VALUES (22, 48, 'weekly_hospital', 'O1CN01PMrmga1gwrKkcek8b_!!4611686018427380383-0-fleamarket.jpg_790x10000Q90.jpg', '20260202_weekly_hospital_O1CN01PMrmga1gwrKkcek8b___4611686018427380383_0_fleamarket_jpg_790x10000Q90_1770015948145.jpg', 'E:\\CODE\\paizhu-software\\backend\\uploads\\attachments\\20260202_weekly_hospital_O1CN01PMrmga1gwrKkcek8b___4611686018427380383_0_fleamarket_jpg_790x10000Q90_1770015948145.jpg', 22103, 'image/jpeg', NULL, '2026-02', 8, 'weekly', '2026-02-02 15:05:48', '2026-02-02 15:05:48');
INSERT INTO `attachments` VALUES (23, 48, 'weekly_injury', 'OT20230221150501915-2879169349.jpg', '20260202_weekly_injury_OT20230221150501915_2879169349_1770015948148.jpg', 'E:\\CODE\\paizhu-software\\backend\\uploads\\attachments\\20260202_weekly_injury_OT20230221150501915_2879169349_1770015948148.jpg', 74387, 'image/jpeg', NULL, '2026-02', 8, 'weekly', '2026-02-02 15:05:48', '2026-02-02 15:05:48');
INSERT INTO `attachments` VALUES (24, 48, 'weekly_contraband', 'v2-0a519e9b9adf2d8073e861be6a43286b_r-2393918550.jpg', '20260202_weekly_contraband_v2_0a519e9b9adf2d8073e861be6a43286b_r_2393918550_1770015948155.jpg', 'E:\\CODE\\paizhu-software\\backend\\uploads\\attachments\\20260202_weekly_contraband_v2_0a519e9b9adf2d8073e861be6a43286b_r_2393918550_1770015948155.jpg', 1617555, 'image/jpeg', NULL, '2026-02', 8, 'weekly', '2026-02-02 15:05:48', '2026-02-02 15:05:48');

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
  `upload_month` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '数据归属月份(YYYY-MM)',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_blacklists_prisoner_prison`(`prisoner_id` ASC, `prison_name` ASC) USING BTREE,
  INDEX `blacklists_involvement_type`(`involvement_type` ASC) USING BTREE,
  INDEX `blacklists_sync_batch`(`sync_batch` ASC) USING BTREE,
  INDEX `idx_blacklists_prison_name`(`prison_name` ASC) USING BTREE,
  INDEX `idx_upload_month_blacklist`(`upload_month` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 60 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of blacklists
-- ----------------------------
INSERT INTO `blacklists` VALUES (57, '1000000001', '张三', '女', '汉族', '1989-12-31', '*省*市', '群众', '参加黑社会性质组织', '02_10_00', '2018-06-25', '2026-08-29', '2024-12-24', '涉黑', '在押', '刑期未变动', '女子监狱', '31352c62-d19d-47d9-ba82-dc704349be2f', '2026-02-03 11:12:00', '2026-02-03 11:12:00', '2026-02-03 11:12:00', '2026-02');
INSERT INTO `blacklists` VALUES (58, '1000000002', '李四', '女', '汉族', '1990-01-01', '*省*县', '群众', '抢劫、非法拘禁', '09_06_00', '2018-07-13', '2026-01-12', '2019-05-08', '涉恶', '在押', '刑期未变动', '女子监狱', '31352c62-d19d-47d9-ba82-dc704349be2f', '2026-02-03 11:12:00', '2026-02-03 11:12:00', '2026-02-03 11:12:00', '2026-02');
INSERT INTO `blacklists` VALUES (59, '1000000003', '王五', '女', '汉族', '1990-01-02', '*省*市', '群众', '组织传销活动、抢劫', '12_00_00', '2017-01-15', '2029-01-14', '2018-07-09', '涉恶', '在押', '刑期未变动', '女子监狱', '31352c62-d19d-47d9-ba82-dc704349be2f', '2026-02-03 11:12:00', '2026-02-03 11:12:00', '2026-02-03 11:12:00', '2026-02');

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
  `upload_month` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '数据归属月份(YYYY-MM)',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `confinements_prisoner_id`(`prisoner_id` ASC) USING BTREE,
  INDEX `confinements_create_date`(`create_date` ASC) USING BTREE,
  INDEX `confinements_sync_batch`(`sync_batch` ASC) USING BTREE,
  INDEX `idx_confinements_prison_name`(`prison_name` ASC) USING BTREE,
  INDEX `idx_upload_month_confinement`(`upload_month` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 29 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of confinements
-- ----------------------------
INSERT INTO `confinements` VALUES (27, '1000000001', '2025-10-21', '2025-10-21', '2025-10-27', '[第四条第三十款]监狱认定应当给予禁闭的其它严重违监违纪行为。', '罪犯张三在担任*期间，利用协助教育科民警从事*的机会，私自使用*，便于获取资讯帮助自己完成岗位工作。鉴于罪犯张三存在私自使用*的违纪行为，建议依据《江西省监狱计分考核罪犯工作实施细则（修订）》（赣司发〔2024〕2号）附件1第四条三十款之规定“监狱认定应当给予禁闭的其他严重违规违纪行为”，给予罪犯张三禁闭处罚一次，禁闭7天。', '已审核', '女子监狱', 'b493765e-1637-4c71-bd65-a6b76062c14b', '2026-02-03 11:11:56', '2026-02-03 11:11:56', '2026-02-03 11:11:56', '2026-02');
INSERT INTO `confinements` VALUES (28, '1000000002', '2025-10-21', '2025-10-21', '2025-10-27', '[第四条第三十款]监狱认定应当给予禁闭的其它严重违监违纪行为。', '罪犯李四在担任*期间，利用协助教育科民警从事*的机会，私自使用*，便于获取资讯帮助自己完成岗位工作。鉴于罪犯李四存在私自使用*的违纪行为，建议依据《江西省监狱计分考核罪犯工作实施细则（修订）》（赣司发〔2024〕2号）附件1第四条三十款之规定“监狱认定应当给予禁闭的其他严重违规违纪行为”，给予罪犯李四禁闭处罚一次，禁闭7天。', '已审核', '女子监狱', 'b493765e-1637-4c71-bd65-a6b76062c14b', '2026-02-03 11:11:56', '2026-02-03 11:11:56', '2026-02-03 11:11:56', '2026-02');

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
) ENGINE = InnoDB AUTO_INCREMENT = 23 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of criminal_reports
-- ----------------------------
INSERT INTO `criminal_reports` VALUES (1, '江西省女子监狱', '2025-01', '2025-01-31', 1, 0, 0, 0, 0, 0, 5, 3, 2, 1258, 326, 15, 89, 156, 8, 3, 12, 5, 23, 2, 234, 189, 45, 0, 28, 56, 12, 'æ±è¥¿çå¥³å­çç±2025å¹´1æç¯æå¨æ_æµè¯.docx', 'uploads\\templates\\1769587094209-920644989.docx', 'bcdb1ca3-3471-452e-ab62-5fd5b92532c2', '2026-01-28 15:58:14', '2026-01-28 15:03:40', '2026-01-28 15:58:14');
INSERT INTO `criminal_reports` VALUES (4, '女子监狱', '2026-01', '2025-10-08', 10, 0, 0, 0, 0, 1, NULL, 3, 5, 1286, 312, 28, 156, 247, 3, 2, 11, 3, 17, NULL, 326, 289, 47, 0, 42, 63, 8, 'åæç¯æå¨æ.docx', 'uploads\\templates\\1769591222732-196657945.docx', '4cc8077b-b777-47c3-8e57-116dbc89cd47', '2026-01-28 17:07:02', '2026-01-28 16:50:04', '2026-01-28 17:07:02');
INSERT INTO `criminal_reports` VALUES (9, '女子监狱', '2026-02', '2025-10-08', 10, 0, 1, 0, 0, 1, 2, 1, 1, 1236, 312, 58, 146, 389, 6, 4, 11, 2, 9, NULL, 327, 198, 43, 0, 17, 23, 14, 'XXçXXçç±2025å¹´ææç¯æå¨æ.docx', 'uploads\\templates\\1770087160733-859118674.docx', 'e94b60da-eb99-470e-bdde-4fda21cb0055', '2026-02-03 10:52:40', '2026-02-03 10:11:05', '2026-02-03 10:52:41');

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
) ENGINE = InnoDB AUTO_INCREMENT = 28 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '日检察记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of daily_logs
-- ----------------------------
INSERT INTO `daily_logs` VALUES (15, 1, '2026-01-29', '女子监狱', '系统管理员', '{\"labor\": {\"notes\": \"\", \"issues\": \"\", \"checked\": true, \"locations\": [], \"focusPoints\": []}, \"study\": {\"notes\": \"\", \"issues\": \"\", \"checked\": true, \"locations\": [], \"focusPoints\": []}, \"living\": {\"notes\": \"\", \"issues\": \"\", \"checked\": true, \"locations\": [], \"focusPoints\": []}}', '{\"newCount\": 3, \"totalCount\": 0}', '{\"count\": 6, \"issues\": \"\", \"checked\": true}', '{\"newCount\": 0, \"totalCount\": 0}', '{\"inCount\": 3, \"outCount\": 0}', '{\"count\": 4, \"checked\": true, \"anomalies\": []}', '21321', '321312', '{\"feedbackSituation\": \"12312\", \"supervisionSituation\": \"\"}', '312312', '2026-01-29 15:58:01', '2026-01-29 15:58:01');
INSERT INTO `daily_logs` VALUES (17, 1, '2026-01-30', '女子监狱', '系统管理员', '{\"labor\": {\"notes\": \"\", \"issues\": \"\", \"checked\": false, \"locations\": [], \"focusPoints\": []}, \"study\": {\"notes\": \"\", \"issues\": \"\", \"checked\": false, \"locations\": [], \"focusPoints\": []}, \"living\": {\"notes\": \"\", \"issues\": \"\", \"checked\": false, \"locations\": [], \"focusPoints\": []}}', '{\"newCount\": 0, \"totalCount\": 0}', '{\"count\": 0, \"issues\": \"\", \"checked\": false}', '{\"newCount\": 0, \"totalCount\": 0}', '{\"inCount\": 0, \"outCount\": 0}', '{\"count\": 0, \"checked\": false, \"anomalies\": []}', '', '', '{\"feedbackSituation\": \"\", \"supervisionSituation\": \"\"}', '', '2026-01-30 11:26:40', '2026-01-30 11:26:40');
INSERT INTO `daily_logs` VALUES (18, 45, '2026-01-30', '女子监狱', '陈检察官', '{\"labor\": {\"checked\": true, \"locations\": [\"车间一\", \"车间二\"]}, \"study\": {\"checked\": true, \"locations\": [\"教室\"]}, \"living\": {\"checked\": true, \"locations\": [\"宿舍楼A\"]}}', '{\"newCount\": 1, \"confinementNew\": 0}', '{\"count\": 3}', '{\"count\": 5}', '{\"inCount\": 2, \"outCount\": 1}', '{\"count\": 2, \"checked\": true}', '检察情况正常', '已反馈', NULL, NULL, '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `daily_logs` VALUES (19, 45, '2026-01-29', '女子监狱', '陈检察官', '{\"labor\": {\"checked\": true, \"locations\": [\"车间一\"]}, \"study\": {\"checked\": false, \"locations\": []}, \"living\": {\"checked\": true, \"locations\": [\"宿舍楼A\"]}}', '{\"newCount\": 0, \"confinementNew\": 1}', '{\"count\": 2}', '{\"count\": 3}', '{\"inCount\": 1, \"outCount\": 0}', '{\"count\": 1, \"checked\": true}', '日常检察', '无问题', NULL, NULL, '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `daily_logs` VALUES (20, 45, '2026-01-28', '女子监狱', '陈检察官', '{\"labor\": {\"checked\": true, \"locations\": [\"车间二\"]}, \"study\": {\"checked\": true, \"locations\": [\"教室\"]}, \"living\": {\"checked\": true, \"locations\": [\"食堂\"]}}', '{\"newCount\": 2, \"confinementNew\": 0}', '{\"count\": 4}', '{\"count\": 8}', '{\"inCount\": 3, \"outCount\": 2}', '{\"count\": 3, \"checked\": true}', '发现问题2个', '已整改', NULL, NULL, '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `daily_logs` VALUES (21, 45, '2026-01-27', '女子监狱', '陈检察官', '{\"labor\": {\"checked\": true, \"locations\": [\"车间一\", \"车间二\"]}, \"study\": {\"checked\": false, \"locations\": []}, \"living\": {\"checked\": true, \"locations\": [\"宿舍楼B\"]}}', '{\"newCount\": 0, \"confinementNew\": 0}', '{\"count\": 3}', '{\"count\": 6}', '{\"inCount\": 1, \"outCount\": 1}', '{\"count\": 2, \"checked\": true}', '情况良好', '无', NULL, NULL, '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `daily_logs` VALUES (22, 45, '2026-01-26', '女子监狱', '陈检察官', '{\"labor\": {\"checked\": true, \"locations\": [\"车间一\"]}, \"study\": {\"checked\": true, \"locations\": [\"教室\"]}, \"living\": {\"checked\": true, \"locations\": [\"宿舍楼A\", \"食堂\"]}}', '{\"newCount\": 1, \"confinementNew\": 1}', '{\"count\": 5}', '{\"count\": 7}', '{\"inCount\": 2, \"outCount\": 0}', '{\"count\": 2, \"checked\": true}', '正常检察', '已反馈', NULL, NULL, '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `daily_logs` VALUES (23, 47, '2026-01-30', '男子监狱', '赵检察官', '{\"labor\": {\"checked\": true, \"locations\": [\"生产车间\"]}, \"study\": {\"checked\": true, \"locations\": [\"图书室\"]}, \"living\": {\"checked\": true, \"locations\": [\"监区一\"]}}', '{\"newCount\": 2, \"confinementNew\": 1}', '{\"count\": 6}', '{\"count\": 12}', '{\"inCount\": 4, \"outCount\": 2}', '{\"count\": 3, \"checked\": true}', '日常检察', '无重大问题', NULL, NULL, '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `daily_logs` VALUES (24, 47, '2026-01-29', '男子监狱', '赵检察官', '{\"labor\": {\"checked\": true, \"locations\": [\"仓库\"]}, \"study\": {\"checked\": true, \"locations\": [\"活动室\"]}, \"living\": {\"checked\": true, \"locations\": [\"监区二\"]}}', '{\"newCount\": 1, \"confinementNew\": 0}', '{\"count\": 5}', '{\"count\": 10}', '{\"inCount\": 3, \"outCount\": 1}', '{\"count\": 2, \"checked\": true}', '情况良好', '已处理', NULL, NULL, '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `daily_logs` VALUES (25, 47, '2026-01-28', '男子监狱', '赵检察官', '{\"labor\": {\"checked\": true, \"locations\": [\"生产车间\", \"仓库\"]}, \"study\": {\"checked\": false, \"locations\": []}, \"living\": {\"checked\": true, \"locations\": [\"监区一\", \"监区二\"]}}', '{\"newCount\": 0, \"confinementNew\": 0}', '{\"count\": 7}', '{\"count\": 15}', '{\"inCount\": 5, \"outCount\": 3}', '{\"count\": 4, \"checked\": true}', '正常', '无', NULL, NULL, '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `daily_logs` VALUES (26, 48, '2026-02-02', '男子监狱', '孙检察官', '{\"labor\": {\"notes\": \"\", \"issues\": \"\", \"checked\": true, \"locations\": [], \"focusPoints\": []}, \"study\": {\"notes\": \"\", \"issues\": \"\", \"checked\": false, \"locations\": [], \"focusPoints\": []}, \"living\": {\"notes\": \"\", \"issues\": \"\", \"checked\": false, \"locations\": [], \"focusPoints\": []}}', '{\"newCount\": 1, \"totalCount\": 0}', '{\"count\": 0, \"issues\": \"\", \"checked\": false}', '{\"newCount\": 0, \"totalCount\": 0}', '{\"inCount\": 0, \"outCount\": 0}', '{\"count\": 0, \"checked\": false, \"anomalies\": []}', '12321', '213', '{\"feedbackSituation\": \"123213\", \"supervisionSituation\": \"【医院/禁闭室检察】常规检察，无异常\\n【外伤检察】发现0人次，待核实\\n【检察官信箱】开启2次，收到0封，发现有价值线索：12312\\n【违禁品排查】发现1次，涉及0人\"}', '213123', '2026-02-02 15:05:58', '2026-02-02 15:05:58');
INSERT INTO `daily_logs` VALUES (27, 45, '2026-02-03', '女子监狱', '陈检察官', '{\"labor\": {\"notes\": \"\", \"issues\": \"\", \"checked\": false, \"locations\": [], \"focusPoints\": []}, \"study\": {\"notes\": \"\", \"issues\": \"\", \"checked\": false, \"locations\": [], \"focusPoints\": []}, \"living\": {\"notes\": \"\", \"issues\": \"\", \"checked\": false, \"locations\": [], \"focusPoints\": []}}', '{\"newCount\": 0, \"totalCount\": 0}', '{\"count\": 0, \"issues\": \"\", \"checked\": false}', '{\"newCount\": 0, \"totalCount\": 0}', '{\"inCount\": 0, \"outCount\": 0}', '{\"count\": 0, \"checked\": false, \"anomalies\": []}', '', '', '{\"feedbackSituation\": \"\", \"supervisionSituation\": \"\"}', '', '2026-02-03 11:59:59', '2026-02-03 11:59:59');

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
) ENGINE = InnoDB AUTO_INCREMENT = 20 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '及时检察事件表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of immediate_events
-- ----------------------------
INSERT INTO `immediate_events` VALUES (10, 47, '2026-01-08', 'epidemic', '监区发现5名罪犯出现发热症状，隔离观察，全面消毒，疫情得到控制', NULL, '[]', 'processed', '2026-01-30 15:35:41', '2026-01-30 15:35:41', '流感疫情防控');
INSERT INTO `immediate_events` VALUES (11, 47, '2026-01-11', 'selfHarm', '罪犯赵某用刀片划伤手腕，紧急送医，心理干预，已稳定', NULL, '[]', 'processed', '2026-01-30 15:35:41', '2026-01-30 15:35:41', '罪犯赵某自伤');
INSERT INTO `immediate_events` VALUES (12, 47, '2026-01-14', 'accident', '罪犯孙某操作不当导致手指受伤，立即停工，送医治疗，已处理', NULL, '[]', 'processed', '2026-01-30 15:35:41', '2026-01-30 15:35:41', '生产车间安全事故');
INSERT INTO `immediate_events` VALUES (13, 47, '2026-01-25', 'escape', '罪犯周某企图翻越围墙脱逃被发现，立即制止，加强警戒，已控制', NULL, '[]', 'processed', '2026-01-30 15:35:41', '2026-01-30 15:35:41', '罪犯脱逃未遂事件');
INSERT INTO `immediate_events` VALUES (14, 49, '2026-01-16', 'accident', '罪犯李某在劳动时手指被机器划伤，立即停工检查，送医处理，已处理', NULL, '[]', 'processed', '2026-01-30 15:35:41', '2026-01-30 15:35:41', '劳动场所轻微事故');
INSERT INTO `immediate_events` VALUES (15, 49, '2026-01-19', 'selfHarm', '罪犯小王情绪低落，有自伤倾向，心理医生介入，家属沟通，情绪好转', NULL, '[]', 'processed', '2026-01-30 15:35:41', '2026-01-30 15:35:41', '未成年犯情绪问题');
INSERT INTO `immediate_events` VALUES (16, 50, '2026-01-17', 'epidemic', '发现2例疑似传染病病例，立即隔离，消毒，已控制', NULL, '[]', 'processed', '2026-01-30 15:35:41', '2026-01-30 15:35:41', '传染病防控');
INSERT INTO `immediate_events` VALUES (17, 50, '2026-01-21', 'paroleRequest', '审查12名罪犯减刑材料，严格把关，已完成', NULL, '[]', 'processed', '2026-01-30 15:35:41', '2026-01-30 15:35:41', '减刑案件审查');
INSERT INTO `immediate_events` VALUES (18, 51, '2026-01-13', 'selfHarm', '罪犯郑某用玻璃片自伤，紧急处理，心理干预，已稳定', NULL, '[]', 'processed', '2026-01-30 15:35:41', '2026-01-30 15:35:41', '罪犯自伤事件');
INSERT INTO `immediate_events` VALUES (19, 51, '2026-01-27', 'paroleRequest', '审查5名罪犯假释申请，严格审查，已完成', NULL, '[]', 'processed', '2026-01-30 15:35:41', '2026-01-30 15:35:41', '假释案件审查');

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
  `upload_month` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '数据归属月份(YYYY-MM)',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `mail_records_open_date`(`open_date` ASC) USING BTREE,
  INDEX `mail_records_prison_area`(`prison_area` ASC) USING BTREE,
  INDEX `mail_records_sync_batch`(`sync_batch` ASC) USING BTREE,
  INDEX `idx_mail_records_prison_name`(`prison_name` ASC) USING BTREE,
  INDEX `idx_upload_month_mail`(`upload_month` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 584 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of mail_records
-- ----------------------------
INSERT INTO `mail_records` VALUES (544, 1, '2025-10-27', '四监区', '吴易霖', '反映劳动时间长', NULL, NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (545, 2, '2025-10-27', '四监区', '吴易霖', '反映劳动时间长', NULL, '重复', '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (546, 3, '2025-10-27', '四监区', '吴易霖', '对原判申诉', '申诉', NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (547, 4, '2025-10-27', '四监区', '吴易霖', '对原判申诉', '申诉', '重复', '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (548, 5, '2025-10-27', '四监区', '方法宁', '反映劳动时间长', NULL, NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (549, 6, '2025-10-27', '二监区', '陈军明', '对原判申诉', '申诉', NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (550, 7, '2025-10-27', '十一监区', '邓传庆', '举报郭雄贩卖毒品；举报网络诈骗团伙王小童，周月琴等人', '举报', NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (551, 8, '2025-10-28', '五监区', '赵值清', '控告监狱奖罚不公', '控告', NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (552, 9, '2025-10-30', '五监区', '张义德', '反映其2019年和2020年受到处分影响了2022年和2024年的减刑呈报，觉得不合理', NULL, NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (553, 10, '2025-10-31', '一监区', '李祖旺', '反映生产劳动考核，未如实填写，做假账（民警反映其精神病）', '举报', NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (554, 11, '2025-10-31', '一监区', '龙学才', '咨询减刑问题', NULL, NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (555, 12, '2025-10-31', '二监区', '陈军明', '对原判申诉', '申诉', '重复', '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (556, 13, '2025-10-31', '二监区', '刘杉园', '对原判申诉', '申诉', NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (557, 14, '2025-10-31', '二监区', '卢林华', '对原判申诉', '申诉', NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (558, 15, '2025-10-31', '三监区', '王明峰', '反映减刑问题', NULL, NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (559, 16, '2025-10-31', '四监区', '叶房廷', '反映劳动强度大', NULL, NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (560, 17, '2025-10-31', '四监区', '明理宾', '反映劳动强度大，咨询财产性判项减刑问题', NULL, NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (561, 18, '2025-10-31', '四监区', '黄鹏', '反映劳动时间长', NULL, NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (562, 19, '2025-10-31', '四监区', '游俊强', '咨询民事赔偿减刑问题', NULL, NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (563, 20, '2025-10-31', '四监区', '吴易霖', '反映劳动时间长', NULL, '重复', '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (564, 21, '2025-10-31', '四监区', '潘宾超', '咨询财产性判项减刑问题', NULL, NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (565, 22, '2025-10-31', '五监区', '赵值清', '请求帮忙把信件寄给鹰潭市余江区司法局，信件内容大致为景德镇服刑人员赵仲青在服刑期间死亡，其子赵坚文申请国家赔偿并控告景德镇监狱虐待服刑人员。', '控告', NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (566, 23, '2025-10-31', '五监区', '林海双', '申请约见检察官，对原判不服', '申诉', NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (567, 24, '2025-10-31', '五监区', '林海双', '举报原判案件中的办案人员', '举报', NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (568, 25, '2025-10-31', '五监区', '张义德', '反映因减刑假释相关规定的变动，导致其七年无法获得减刑，希望检察官施法说理。', NULL, NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (569, 26, '2025-10-31', '七监区', '匿名', '举报七监区副大队长肖勇利用职务便利收受服刑人员贿赂，信中有列举部分实例', '举报', NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (570, 27, '2025-11-04', '一监区', '廖卿宇', '对原判申诉', '申诉', NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (571, 28, '2025-11-04', '二监区', '穆世国', '该犯原判为无期徒刑并没收个人全部财产，在2023年4月已公布执行完毕，但在2024年10月呈报减刑时被告知必须缴纳10000元罚金。', NULL, NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (572, 29, '2025-11-04', '二监区', '陈军明', '对原判申诉', '申诉', '重复', '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (573, 30, '2025-11-04', '二监区', '陈军明', '对原判申诉', '申诉', '重复', '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (574, 31, '2025-11-04', '二监区', '刘杉园', '对原判申诉', '申诉', '重复', '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (575, 32, '2025-11-04', '五监区', '李明星', '对原判申诉', '申诉', NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (576, 33, '2025-11-04', '五监区', '马艳军', '对原判申诉', '申诉', NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (577, 34, '2025-11-04', '九监区', '方文九', '对原判申诉', '申诉', NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (578, 35, '2025-11-09', '一监区', '王琛琳', '对原判申诉', '申诉', NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (579, 36, '2025-11-09', '二监区', '陈军明', '对原判申诉', '申诉', '重复', '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (580, 37, '2025-11-09', '二监区', '陈军明', '对原判申诉', '申诉', '重复', '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (581, 38, '2025-11-09', '四监区', '方青宁', '举报四监区民警与线组长勾结，通过殴打体罚的方式对服刑人员强买强卖高价槟榔，服刑人员为了谋求安全，会让家人把钱打到民警或线组长指定的账户上，或者让家人上门送现金；其中还反映有服刑人员被打断8根肋骨、有的被打掉了5颗牙齿，而殴打服刑人员的线组长一直未受到相应的处罚。', '举报', NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (582, 39, '2025-11-09', '九监区', '骆开提', '举报2025年2月6日上午丰城看守所105监室关押人员甘海军妻子冒充法检工作人员进入105监室，与甘海军会见；举报丰城市人民法院工作人员黄兵长期给105监室关押人员陈正彬传递信息并带违禁品入监室。', '举报', NULL, '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');
INSERT INTO `mail_records` VALUES (583, 40, '2025-11-09', '九监区', '方文九', '对原判申诉（两封信，一封寄给江西省人民法院纪检组，一封寄给最高人民法院纪检组）', '申诉', '重复', '女子监狱', '89ce7303-e614-467f-99ec-b55a57917b27', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02-03 11:35:25', '2026-02');

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
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '月度归档表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of monthly_archives
-- ----------------------------
INSERT INTO `monthly_archives` VALUES (6, 2026, 1, '女子监狱', 1, NULL, 'draft', NULL, NULL, '/uploads/archives/女子监狱_2026年1月归档.zip', NULL, 5, 0, NULL, NULL, '2026-01-30 11:09:36', '2026-02-03 10:09:00', 0);
INSERT INTO `monthly_archives` VALUES (7, 2026, 2, '女子监狱', 1, NULL, 'draft', NULL, NULL, '/uploads/archives/女子监狱_2026年2月归档.zip', NULL, 0, 0, NULL, NULL, '2026-02-02 10:08:22', '2026-02-03 11:19:07', 0);
INSERT INTO `monthly_archives` VALUES (8, 2026, 2, '男子监狱', 48, NULL, 'draft', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, '2026-02-02 11:26:21', '2026-02-02 11:26:21', 0);
INSERT INTO `monthly_archives` VALUES (9, 2026, 2, '赣西监狱', 51, NULL, 'draft', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, '2026-02-02 11:27:11', '2026-02-02 11:27:11', 0);

-- ----------------------------
-- Table structure for monthly_basic_info
-- ----------------------------
DROP TABLE IF EXISTS `monthly_basic_info`;
CREATE TABLE `monthly_basic_info`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `prison_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `report_month` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `total_prisoners` int(11) NULL DEFAULT 0,
  `major_criminals` int(11) NULL DEFAULT 0,
  `death_sentence` int(11) NULL DEFAULT 0,
  `life_sentence` int(11) NULL DEFAULT 0,
  `repeat_offenders` int(11) NULL DEFAULT 0,
  `foreign_prisoners` int(11) NULL DEFAULT 0,
  `hk_macao_taiwan` int(11) NULL DEFAULT 0,
  `mental_illness` int(11) NULL DEFAULT 0,
  `former_officials` int(11) NULL DEFAULT 0,
  `former_county_level` int(11) NULL DEFAULT 0,
  `falun_gong` int(11) NULL DEFAULT 0,
  `drug_history` int(11) NULL DEFAULT 0,
  `drug_crimes` int(11) NULL DEFAULT 0,
  `new_admissions` int(11) NULL DEFAULT 0,
  `minor_females` int(11) NULL DEFAULT 0,
  `gang_related` int(11) NULL DEFAULT 0,
  `evil_forces` int(11) NULL DEFAULT 0,
  `endangering_safety` int(11) NULL DEFAULT 0,
  `released_count` int(11) NULL DEFAULT 0,
  `recorded_punishments` int(11) NULL DEFAULT 0,
  `recorded_punishments_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `confinement_punishments` int(11) NULL DEFAULT 0,
  `confinement_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `parole_batch` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '减刑批次（如：第3批）',
  `parole_count` int(11) NULL DEFAULT 0 COMMENT '减刑案件数量',
  `parole_stage` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '减刑阶段（review/publicize/submitted/approved）',
  `correction_notices` int(11) NULL DEFAULT 0 COMMENT '纠正违法通知书份数',
  `correction_issues` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '纠正违法问题描述',
  `three_scene_checks` int(11) NULL DEFAULT 0 COMMENT '三大现场检察次数',
  `key_location_checks` int(11) NULL DEFAULT 0 COMMENT '重点场所检察次数（医务室、严管、禁闭室等）',
  `visit_checks` int(11) NULL DEFAULT 0 COMMENT '会见检察次数',
  `visit_illegal_count` int(11) NULL DEFAULT 0 COMMENT '会见发现违法问题数',
  `monitor_checks` int(11) NULL DEFAULT 0 COMMENT '监控检察次数',
  `issues_found` int(11) NULL DEFAULT 0 COMMENT '安全防范发现问题数',
  `total_talks` int(11) NULL DEFAULT 0 COMMENT '个别教育谈话总数',
  `new_admission_talks` int(11) NULL DEFAULT 0 COMMENT '新收押罪犯谈话人数',
  `evil_forces_talks` int(11) NULL DEFAULT 0 COMMENT '涉恶罪犯谈话人数',
  `injury_talks` int(11) NULL DEFAULT 0 COMMENT '外伤罪犯谈话人数',
  `confinement_talks` int(11) NULL DEFAULT 0 COMMENT '禁闭罪犯谈话人数',
  `questionnaire_count` int(11) NULL DEFAULT 0 COMMENT '出监问卷调查表份数',
  `life_sentence_reviews` int(11) NULL DEFAULT 0 COMMENT '无期死缓评审会次数',
  `analysis_meetings` int(11) NULL DEFAULT 0 COMMENT '犯情分析会次数',
  `other_activities` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '参加其他活动名称',
  `mailbox_opens` int(11) NULL DEFAULT 0 COMMENT '开启检察官信箱次数',
  `letters_received` int(11) NULL DEFAULT 0 COMMENT '收到信件数量',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_prison_month`(`prison_name` ASC, `report_month` ASC) USING BTREE,
  INDEX `idx_parole_batch`(`parole_batch` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 17 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of monthly_basic_info
-- ----------------------------
INSERT INTO `monthly_basic_info` VALUES (1, 42, '女子监狱', '2026-02', 1236, 312, 58, 146, 389, 6, 4, 11, 2, 9, 0, 327, 198, 43, 0, 1, 2, 14, 0, 2, '', 2, '', NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 40, '2026-02-02 23:19:11', '2026-02-03 11:35:25');
INSERT INTO `monthly_basic_info` VALUES (2, 42, '未成年犯管教所', '2026-02', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', 0, '', NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, '2026-02-02 23:31:57', '2026-02-02 23:36:15');
INSERT INTO `monthly_basic_info` VALUES (3, 43, '男子监狱', '2026-02', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', 0, '', NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, '2026-02-03 10:00:03', '2026-02-03 10:00:03');
INSERT INTO `monthly_basic_info` VALUES (4, 43, '女子监狱', '2026-01', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', 0, '', NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, '2026-02-03 10:00:05', '2026-02-03 10:00:05');
INSERT INTO `monthly_basic_info` VALUES (5, 43, '女子监狱', '2026-03', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', 0, '', NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, '2026-02-03 10:00:07', '2026-02-03 10:00:07');
INSERT INTO `monthly_basic_info` VALUES (6, 43, '女子监狱', '2026-04', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', 0, '', NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, '2026-02-03 10:00:15', '2026-02-03 10:00:15');
INSERT INTO `monthly_basic_info` VALUES (7, 43, '女子监狱', '2026-05', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', 0, '', NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, '2026-02-03 10:00:16', '2026-02-03 10:00:16');
INSERT INTO `monthly_basic_info` VALUES (8, 43, '女子监狱', '2026-06', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', 0, '', NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, '2026-02-03 10:00:17', '2026-02-03 10:00:17');
INSERT INTO `monthly_basic_info` VALUES (9, 43, '男子监狱', '2026-01', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', 0, '', NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, '2026-02-03 10:00:31', '2026-02-03 10:00:31');
INSERT INTO `monthly_basic_info` VALUES (10, 43, '男子监狱', '2026-03', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', 0, '', NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, '2026-02-03 10:05:43', '2026-02-03 10:05:43');
INSERT INTO `monthly_basic_info` VALUES (11, 43, '男子监狱', '2026-04', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', 0, '', NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, '2026-02-03 10:05:44', '2026-02-03 10:05:44');
INSERT INTO `monthly_basic_info` VALUES (12, 43, '男子监狱', '2026-06', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', 0, '', NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, '2026-02-03 10:05:46', '2026-02-03 10:05:46');
INSERT INTO `monthly_basic_info` VALUES (13, 43, '男子监狱', '2026-10', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', 0, '', NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, '2026-02-03 10:05:48', '2026-02-03 10:05:48');
INSERT INTO `monthly_basic_info` VALUES (14, 43, '男子监狱', '2026-09', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', 0, '', NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, '2026-02-03 10:05:52', '2026-02-03 10:05:52');
INSERT INTO `monthly_basic_info` VALUES (15, 43, '男子监狱', '2026-11', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', 0, '', NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, '2026-02-03 10:05:54', '2026-02-03 10:05:54');
INSERT INTO `monthly_basic_info` VALUES (16, 43, '男子监狱', '2026-12', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', 0, '', NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, '2026-02-03 10:05:55', '2026-02-03 10:05:55');

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
-- Records of monthly_records
-- ----------------------------
INSERT INTO `monthly_records` VALUES (2, 1, '2026-01', '{\"checked\": true, \"visitCount\": 25}', '{\"notes\": \"参加了XX监区减刑假释评审会，对3名罪犯的减刑建议进行了审查，提出了监督意见。\", \"meetingType\": \"parole\", \"participated\": true}', '{\"recordCount\": 1, \"confinementCount\": 0}', '{\"productionDecrease\": 0, \"productionIncrease\": 3, \"miscellaneousDecrease\": 1, \"miscellaneousIncrease\": 2}', '本月各项检察工作按计划完成。', '2026-01-27 11:38:09', '2026-01-27 11:38:09', NULL, NULL);

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
) ENGINE = InnoDB AUTO_INCREMENT = 61 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of prisoners
-- ----------------------------
INSERT INTO `prisoners` VALUES (1, 'TEST0001', '张测试', '男', '1990-01-01', '汉族', '大学', '有期徒刑', '盗窃罪', '05_00_00', '2023-01-01', '2028-01-01', '测试监狱', '一监区', NULL, NULL, NULL, '2026-01-20 10:26:38', '2026-02-03 10:11:16');
INSERT INTO `prisoners` VALUES (2, 'TEST0002', '李测试', '男', '1985-06-15', '回族', '高中', '有期徒刑', '故意伤害罪', '03_06_00', '2024-01-01', '2027-07-01', '测试监狱', '二监区', NULL, NULL, NULL, '2026-01-20 10:26:39', '2026-02-03 10:11:16');
INSERT INTO `prisoners` VALUES (3, 'TEST0003', '王测试', '女', '1992-03-20', '汉族', '初中', '无期徒刑', '诈骗罪', '无期', '2022-06-01', NULL, '测试监狱', '三监区', NULL, NULL, NULL, '2026-01-20 10:26:39', '2026-02-03 10:11:16');
INSERT INTO `prisoners` VALUES (4, 'TEST0004', '赵测试', '男', '1988-08-08', '汉族', '本科', '有期徒刑', '抢劫罪', '10_00_00', '2020-01-01', '2030-01-01', '测试监狱', '四监区', NULL, NULL, NULL, '2026-01-20 10:26:39', '2026-02-03 10:11:22');
INSERT INTO `prisoners` VALUES (5, 'TEST0005', '钱测试', '男', '1995-12-25', '满族', '大专', '有期徒刑', '贩毒罪', '08_00_00', '2021-06-01', '2029-06-01', '测试监狱', '五监区', NULL, NULL, NULL, '2026-01-20 10:26:39', '2026-02-03 10:11:22');
INSERT INTO `prisoners` VALUES (6, 'TEST0010', '冯测试', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '测试监狱', '六监区', NULL, NULL, NULL, '2026-01-20 10:26:39', '2026-02-03 10:11:32');
INSERT INTO `prisoners` VALUES (7, 'TEST0011', '陈测试', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '测试监狱', '七监区', NULL, NULL, NULL, '2026-01-20 10:26:39', '2026-02-03 10:11:32');
INSERT INTO `prisoners` VALUES (8, '1000000001', '张三', '女', '1966-12-31', '汉族', '大学', '有期徒刑', 'A罪、B罪', '无期徒刑', '2015-12-09', '2034-01-20', '江西省xx监狱', '一监区', NULL, NULL, NULL, '2026-01-28 15:05:13', '2026-02-03 11:12:01');
INSERT INTO `prisoners` VALUES (9, '1000000002', '李四', '女', '1967-01-01', '汉族', '大学', '有期徒刑', 'C罪', '10_06_00', '2017-08-12', '2028-02-11', '江西省xx监狱', '一监区', NULL, NULL, NULL, '2026-01-28 15:05:13', '2026-02-03 11:12:01');

-- ----------------------------
-- Table structure for report_checklist_items
-- ----------------------------
DROP TABLE IF EXISTS `report_checklist_items`;
CREATE TABLE `report_checklist_items`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prison_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '监狱名称',
  `year` int(11) NOT NULL COMMENT '年份',
  `month` int(11) NOT NULL COMMENT '月份',
  `item_id` int(11) NOT NULL COMMENT '清单项目ID (1-16)',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '报告内容',
  `situation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '检察情况',
  `check_time` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '记录时间',
  `createdAt` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_checklist_item`(`prison_name` ASC, `year` ASC, `month` ASC, `item_id` ASC) USING BTREE,
  INDEX `idx_prison_date`(`prison_name` ASC, `year` ASC, `month` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '报告清单项目表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of report_checklist_items
-- ----------------------------
INSERT INTO `report_checklist_items` VALUES (1, '未成年犯管教所', 2026, 2, 1, '12312', '', '2/2', '2026-02-02 17:15:35', '2026-02-02 23:32:22');
INSERT INTO `report_checklist_items` VALUES (3, '女子监狱', 2026, 2, 1, '213123', '', '2/2', '2026-02-02 17:17:34', '2026-02-02 23:32:26');
INSERT INTO `report_checklist_items` VALUES (7, '女子监狱', 2026, 2, 2, '213213', '3123', '2/2', '2026-02-02 23:11:35', '2026-02-02 23:11:35');

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
  `upload_month` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '数据归属月份(YYYY-MM)',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `restraint_usages_prisoner_id`(`prisoner_id` ASC) USING BTREE,
  INDEX `restraint_usages_create_date`(`create_date` ASC) USING BTREE,
  INDEX `restraint_usages_sync_batch`(`sync_batch` ASC) USING BTREE,
  INDEX `idx_restraint_usages_prison_name`(`prison_name` ASC) USING BTREE,
  INDEX `idx_upload_month_restraint`(`upload_month` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 21 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of restraint_usages
-- ----------------------------
INSERT INTO `restraint_usages` VALUES (19, '1000000001', '2025-10-16', '手铐', '[第四条第一款]罪犯有其他危险行为需要采取防范措施的；', 10, '2025-10-16', '2025-10-20', '已审核', '女子监狱', '14e58aa1-a178-4289-8152-feaa096c0327', '2026-02-03 11:12:01', '2026-02-03 11:12:01', '2026-02-03 11:12:01', '2026-02');
INSERT INTO `restraint_usages` VALUES (20, '1000000002', '2025-10-14', '手铐', '[第四条第一款]罪犯有其他危险行为需要采取防范措施的；', 1, '2025-10-14', '2025-10-14', '已审核', '女子监狱', '14e58aa1-a178-4289-8152-feaa096c0327', '2026-02-03 11:12:01', '2026-02-03 11:12:01', '2026-02-03 11:12:01', '2026-02');

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
  `upload_month` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '数据归属月份(YYYY-MM)',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `strict_educations_prisoner_id`(`prisoner_id` ASC) USING BTREE,
  INDEX `strict_educations_create_date`(`create_date` ASC) USING BTREE,
  INDEX `strict_educations_sync_batch`(`sync_batch` ASC) USING BTREE,
  INDEX `idx_strict_educations_prison_name`(`prison_name` ASC) USING BTREE,
  INDEX `idx_upload_month_strict`(`upload_month` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 28 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of strict_educations
-- ----------------------------
INSERT INTO `strict_educations` VALUES (25, '1000000001', '2025-10-26', '[第七条第二款]不服从民警管理，拒不参加劳动或消极怠工，抗拒改造，屡教不改的；', '罪犯张三（犯a罪，原判*年*个月，余刑*年*个月，*人，*岁）于2025年*月*日*时*分许，因为上厕所问题在车间大喊大叫，民警将其带往值班台进行谈话教育，谈话教育过程中，该犯多次拒绝蹲下，不服从民警管理，顶撞民警，民警多次劝阻未果，该犯仍然态度恶劣，鉴于该犯行为严重影响车间生产秩序，造成极其恶劣的影响，为打击其嚣张气焰，同时震慑其他罪犯的，规范监区改造秩序。根据《江西省监狱罪犯严格管理教育办法》第三章第七条第二款的相关规定，建议对罪犯张三予以严管教育一个月处罚。', 30, '2025-10-26', '2025-11-24', '已审核', '女子监狱', '8fde7e05-1fc2-4d58-8966-6be796b29582', '2026-02-03 11:11:52', '2026-02-03 11:05:12', '2026-02-03 11:11:52', '2026-02');
INSERT INTO `strict_educations` VALUES (26, '1000000002', '2025-10-20', '[第七条第三款]罪犯寻衅滋事、欺压他犯性质恶劣的，或打架斗殴被制止后，经民警教育认错态度较差的；', '2025年10月20日早上罪犯李四因生产琐事在生产车间与罪犯王五发生打架，民警将其带离现场并询问情况，李四态度较为恶劣，经民警教育后，李犯认错态度仍较差。鉴于李犯行为，依据《江西省罪犯集中严格管理教育办法》第三章第七条第三款之规定，建议予以该犯严管教育一个月。', 31, '2025-10-20', '2025-11-19', '已审核', '女子监狱', '8fde7e05-1fc2-4d58-8966-6be796b29582', '2026-02-03 11:11:52', '2026-02-03 11:05:12', '2026-02-03 11:11:52', '2026-02');

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
) ENGINE = InnoDB AUTO_INCREMENT = 90 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户监狱范围表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_prison_scopes
-- ----------------------------
INSERT INTO `user_prison_scopes` VALUES (59, 42, '女子监狱', '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `user_prison_scopes` VALUES (60, 42, '男子监狱', '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `user_prison_scopes` VALUES (61, 42, '未成年犯管教所', '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `user_prison_scopes` VALUES (62, 42, '豫章监狱', '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `user_prison_scopes` VALUES (63, 42, '赣西监狱', '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `user_prison_scopes` VALUES (64, 43, '女子监狱', '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `user_prison_scopes` VALUES (65, 43, '男子监狱', '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `user_prison_scopes` VALUES (66, 44, '未成年犯管教所', '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `user_prison_scopes` VALUES (67, 44, '豫章监狱', '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `user_prison_scopes` VALUES (68, 44, '赣西监狱', '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `user_prison_scopes` VALUES (84, 1, '女子监狱', '2026-02-03 00:00:15', '2026-02-03 00:00:15');
INSERT INTO `user_prison_scopes` VALUES (85, 1, '男子监狱', '2026-02-03 00:00:15', '2026-02-03 00:00:15');
INSERT INTO `user_prison_scopes` VALUES (86, 1, '未成年犯管教所', '2026-02-03 00:00:15', '2026-02-03 00:00:15');
INSERT INTO `user_prison_scopes` VALUES (87, 1, '豫章监狱', '2026-02-03 00:00:15', '2026-02-03 00:00:15');
INSERT INTO `user_prison_scopes` VALUES (88, 1, '赣西监狱', '2026-02-03 00:00:15', '2026-02-03 00:00:15');

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
) ENGINE = InnoDB AUTO_INCREMENT = 52 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'admin', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '系统管理员', NULL, 'admin', '', 'active', '2026-02-03 12:42:20', '2026-01-26 16:14:03', '2026-02-03 12:42:20');
INSERT INTO `users` VALUES (42, 'yuanlingdao', '$2a$10$9KkgA4e.C0NHLn/2.vqqI.rNkFtdQ/peVdmYqIGzcIUIcpPdbojeS', '张院长', NULL, 'top_viewer', '13800000001', 'active', '2026-02-03 00:01:45', '2026-01-30 15:35:41', '2026-02-03 00:01:45');
INSERT INTO `users` VALUES (43, 'lingdao1', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '李主任', '女子监狱', 'leader', '13800000002', 'active', '2026-02-03 09:58:10', '2026-01-30 15:35:41', '2026-02-03 09:58:10');
INSERT INTO `users` VALUES (44, 'lingdao2', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '王主任', '未成年犯管教所', 'leader', '13800000003', 'active', '2026-02-02 23:48:17', '2026-01-30 15:35:41', '2026-02-02 23:48:17');
INSERT INTO `users` VALUES (45, 'nvzi_jcy1', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '陈检察官', '女子监狱', 'inspector', '13800000011', 'active', '2026-02-03 12:42:30', '2026-01-30 15:35:41', '2026-02-03 12:42:30');
INSERT INTO `users` VALUES (46, 'nvzi_jcy2', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '刘检察官', '女子监狱', 'inspector', '13800000012', 'active', '2026-02-02 23:47:44', '2026-01-30 15:35:41', '2026-02-02 23:47:44');
INSERT INTO `users` VALUES (47, 'nanzi_jcy1', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '赵检察官', '男子监狱', 'inspector', '13800000021', 'active', NULL, '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `users` VALUES (48, 'nanzi_jcy2', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '孙检察官', '男子监狱', 'inspector', '13800000022', 'active', '2026-02-02 14:38:05', '2026-01-30 15:35:41', '2026-02-02 14:38:05');
INSERT INTO `users` VALUES (49, 'wcn_jcy', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '周检察官', '未成年犯管教所', 'inspector', '13800000031', 'active', NULL, '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `users` VALUES (50, 'yuzhang_jcy', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '吴检察官', '豫章监狱', 'inspector', '13800000041', 'active', NULL, '2026-01-30 15:35:41', '2026-01-30 15:35:41');
INSERT INTO `users` VALUES (51, 'ganxi_jcy', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '郑检察官', '赣西监狱', 'inspector', '13800000051', 'active', '2026-02-02 11:27:09', '2026-01-30 15:35:41', '2026-02-02 11:27:09');

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
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '周检察记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of weekly_records
-- ----------------------------
INSERT INTO `weekly_records` VALUES (4, 1, '2026-01-27', 4, '{\"hospitalChecked\": true, \"confinementCount\": 2, \"confinementChecked\": true, \"policeWeaponIssues\": \"\", \"strictControlCount\": 15}', '{\"count\": 3, \"description\": \"张某右腿有轻微擦伤，李某左手有旧伤疤痕，王某背部有淤青（已核实为运动所致）\"}', '[{\"id\": 1769485038495, \"date\": \"2026-01-27\", \"type\": \"newPrisoner\", \"content\": \"进行入监教育谈话，了解其思想状况和家庭情况。该犯表示愿意接受改造，积极配合管教。\", \"prisonerId\": \"2024001\", \"prisonerName\": \"张三\"}, {\"id\": 1769485038496, \"date\": \"2026-01-27\", \"type\": \"injury\", \"content\": \"就其手部伤情进行谈话，核实为劳动时不慎划伤，已得到及时治疗。\", \"prisonerId\": \"2023156\", \"prisonerName\": \"李四\"}]', '{\"caseClues\": [], \"openCount\": 1, \"receivedCount\": 3}', '{\"checked\": true, \"foundItems\": []}', '本周外伤排查和谈话工作正常完成。', '2026-01-27 11:38:09', '2026-01-27 11:38:09', NULL, NULL);
INSERT INTO `weekly_records` VALUES (5, 1, '2026-01-26', 4, '{\"checked\": true, \"checkDate\": \"2026-01-26\", \"focusAreas\": {\"confinement\": true, \"strictControl\": false, \"policeEquipment\": false}, \"attachments\": [], \"hasAnomalies\": true, \"anomalyDescription\": \"\"}', '{\"count\": 0, \"found\": true, \"verified\": true, \"anomalyDescription\": \"\", \"transcriptUploaded\": true}', '[]', '{\"opened\": true, \"openCount\": 0, \"receivedCount\": 0, \"valuableClues\": true, \"clueDescription\": \"\", \"materialsUploaded\": false}', '{\"found\": true, \"photos\": [], \"checked\": true, \"foundCount\": 0, \"description\": \"\", \"involvedCount\": 0}', '', '2026-01-28 14:27:14', '2026-01-28 14:27:14', NULL, NULL);
INSERT INTO `weekly_records` VALUES (6, 1, '2026-01-26', 4, '{\"checked\": true, \"checkDate\": \"2026-01-26\", \"focusAreas\": {\"confinement\": true, \"strictControl\": false, \"policeEquipment\": false}, \"attachments\": [], \"hasAnomalies\": true, \"anomalyDescription\": \"\"}', '{\"count\": 0, \"found\": true, \"verified\": true, \"anomalyDescription\": \"\", \"transcriptUploaded\": true}', '[]', '{\"opened\": true, \"openCount\": 0, \"receivedCount\": 0, \"valuableClues\": true, \"clueDescription\": \"\", \"materialsUploaded\": false}', '{\"found\": true, \"photos\": [], \"checked\": true, \"foundCount\": 0, \"description\": \"\", \"involvedCount\": 0}', '', '2026-01-28 14:28:34', '2026-01-28 14:28:34', NULL, NULL);
INSERT INTO `weekly_records` VALUES (8, 48, '2026-02-02', 1, '{\"checked\": true, \"checkDate\": \"2026-02-02\", \"focusAreas\": {\"confinement\": false, \"strictControl\": false, \"policeEquipment\": false}, \"attachments\": [], \"hasAnomalies\": false, \"anomalyDescription\": \"\"}', '{\"count\": 0, \"found\": true, \"verified\": false, \"anomalyDescription\": \"\", \"transcriptUploaded\": false}', '[]', '{\"opened\": true, \"openCount\": 2, \"receivedCount\": 0, \"valuableClues\": true, \"clueDescription\": \"12312\", \"materialsUploaded\": false}', '{\"found\": true, \"photos\": [], \"checked\": true, \"foundCount\": 1, \"description\": \"\", \"involvedCount\": 0}', '', '2026-02-02 15:05:48', '2026-02-02 15:05:48', NULL, NULL);

SET FOREIGN_KEY_CHECKS = 1;
