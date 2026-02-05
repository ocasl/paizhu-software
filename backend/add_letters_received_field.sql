-- 为 monthly_basic_info 表添加 letters_received 字段
USE paizhu_db;

ALTER TABLE monthly_basic_info 
ADD COLUMN letters_received INT DEFAULT 0 COMMENT '收到信件数量' AFTER confinement_reason;

SELECT '✅ letters_received 字段已添加' AS status;
