-- 为Excel数据表添加 upload_month 字段
-- 执行时间: 2026-02-03

USE paizhu_db;

-- 1. 严管教育表
ALTER TABLE strict_educations 
ADD COLUMN upload_month VARCHAR(7) COMMENT '数据归属月份 (YYYY-MM)' AFTER prison_name;

-- 2. 禁闭审批表
ALTER TABLE confinements 
ADD COLUMN upload_month VARCHAR(7) COMMENT '数据归属月份 (YYYY-MM)' AFTER prison_name;

-- 3. 涉黑恶名单表
ALTER TABLE blacklists 
ADD COLUMN upload_month VARCHAR(7) COMMENT '数据归属月份 (YYYY-MM)' AFTER prison_name;

-- 4. 戒具使用表
ALTER TABLE restraint_usages 
ADD COLUMN upload_month VARCHAR(7) COMMENT '数据归属月份 (YYYY-MM)' AFTER prison_name;

-- 5. 信件汇总表
ALTER TABLE mail_records 
ADD COLUMN upload_month VARCHAR(7) COMMENT '数据归属月份 (YYYY-MM)' AFTER prison_name;

-- 添加索引以提高查询性能
ALTER TABLE strict_educations ADD INDEX idx_upload_month (upload_month);
ALTER TABLE confinements ADD INDEX idx_upload_month (upload_month);
ALTER TABLE blacklists ADD INDEX idx_upload_month (upload_month);
ALTER TABLE restraint_usages ADD INDEX idx_upload_month (upload_month);
ALTER TABLE mail_records ADD INDEX idx_upload_month (upload_month);

-- 添加组合索引（派驻单位 + 归属月份）
ALTER TABLE strict_educations ADD INDEX idx_prison_month (prison_name, upload_month);
ALTER TABLE confinements ADD INDEX idx_prison_month (prison_name, upload_month);
ALTER TABLE blacklists ADD INDEX idx_prison_month (prison_name, upload_month);
ALTER TABLE restraint_usages ADD INDEX idx_prison_month (prison_name, upload_month);
ALTER TABLE mail_records ADD INDEX idx_prison_month (prison_name, upload_month);

SELECT '✅ upload_month 字段已添加到所有Excel数据表' AS status;
