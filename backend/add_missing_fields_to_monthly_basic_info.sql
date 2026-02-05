-- 为 monthly_basic_info 表添加缺失的21个字段
-- 使报告预览中所有可编辑字段都对应数据库字段
-- 执行时间: 2026-02-03

USE paizhu_db;

-- ==================== 执法检察情况（9个字段） ====================

ALTER TABLE monthly_basic_info 
ADD COLUMN parole_batch VARCHAR(50) COMMENT '减刑批次（如：第3批）' AFTER confinement_reason;

ALTER TABLE monthly_basic_info 
ADD COLUMN parole_count INT DEFAULT 0 COMMENT '减刑案件数量' AFTER parole_batch;

ALTER TABLE monthly_basic_info 
ADD COLUMN parole_stage VARCHAR(50) COMMENT '减刑阶段（review/publicize/submitted/approved）' AFTER parole_count;

ALTER TABLE monthly_basic_info 
ADD COLUMN correction_notices INT DEFAULT 0 COMMENT '纠正违法通知书份数' AFTER parole_stage;

ALTER TABLE monthly_basic_info 
ADD COLUMN correction_issues TEXT COMMENT '纠正违法问题描述' AFTER correction_notices;

ALTER TABLE monthly_basic_info 
ADD COLUMN three_scene_checks INT DEFAULT 0 COMMENT '三大现场检察次数' AFTER correction_issues;

ALTER TABLE monthly_basic_info 
ADD COLUMN key_location_checks INT DEFAULT 0 COMMENT '重点场所检察次数（医务室、严管、禁闭室等）' AFTER three_scene_checks;

ALTER TABLE monthly_basic_info 
ADD COLUMN visit_checks INT DEFAULT 0 COMMENT '会见检察次数' AFTER key_location_checks;

ALTER TABLE monthly_basic_info 
ADD COLUMN visit_illegal_count INT DEFAULT 0 COMMENT '会见发现违法问题数' AFTER visit_checks;

-- ==================== 安全防范检察（2个字段） ====================

ALTER TABLE monthly_basic_info 
ADD COLUMN monitor_checks INT DEFAULT 0 COMMENT '监控检察次数' AFTER visit_illegal_count;

ALTER TABLE monthly_basic_info 
ADD COLUMN issues_found INT DEFAULT 0 COMMENT '安全防范发现问题数' AFTER monitor_checks;

-- ==================== 个别谈话（6个字段） ====================

ALTER TABLE monthly_basic_info 
ADD COLUMN total_talks INT DEFAULT 0 COMMENT '个别教育谈话总数' AFTER issues_found;

ALTER TABLE monthly_basic_info 
ADD COLUMN new_admission_talks INT DEFAULT 0 COMMENT '新收押罪犯谈话人数' AFTER total_talks;

ALTER TABLE monthly_basic_info 
ADD COLUMN evil_forces_talks INT DEFAULT 0 COMMENT '涉恶罪犯谈话人数' AFTER new_admission_talks;

ALTER TABLE monthly_basic_info 
ADD COLUMN injury_talks INT DEFAULT 0 COMMENT '外伤罪犯谈话人数' AFTER evil_forces_talks;

ALTER TABLE monthly_basic_info 
ADD COLUMN confinement_talks INT DEFAULT 0 COMMENT '禁闭罪犯谈话人数' AFTER injury_talks;

ALTER TABLE monthly_basic_info 
ADD COLUMN questionnaire_count INT DEFAULT 0 COMMENT '出监问卷调查表份数' AFTER confinement_talks;

-- ==================== 会议活动（3个字段） ====================

ALTER TABLE monthly_basic_info 
ADD COLUMN life_sentence_reviews INT DEFAULT 0 COMMENT '无期死缓评审会次数' AFTER questionnaire_count;

ALTER TABLE monthly_basic_info 
ADD COLUMN analysis_meetings INT DEFAULT 0 COMMENT '犯情分析会次数' AFTER life_sentence_reviews;

ALTER TABLE monthly_basic_info 
ADD COLUMN other_activities TEXT COMMENT '参加其他活动名称' AFTER analysis_meetings;

-- ==================== 其他工作（1个字段） ====================

ALTER TABLE monthly_basic_info 
ADD COLUMN mailbox_opens INT DEFAULT 0 COMMENT '开启检察官信箱次数' AFTER other_activities;

-- ==================== 添加索引 ====================

-- 为常用查询字段添加索引
ALTER TABLE monthly_basic_info ADD INDEX idx_parole_batch (parole_batch);

-- ==================== 验证 ====================

SELECT '✅ 已成功添加21个字段到 monthly_basic_info 表' AS status;

-- 查看表结构
DESCRIBE monthly_basic_info;

-- 统计字段数量
SELECT 
    COUNT(*) AS total_columns,
    '预期45个字段（24个原有 + 21个新增）' AS note
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'paizhu_db' 
AND TABLE_NAME = 'monthly_basic_info';
