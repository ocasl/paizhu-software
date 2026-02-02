/**
 * 附件表添加关联字段迁移
 * 运行方式：在MySQL中执行此SQL
 */

-- 选择数据库
USE paizhu_db;

-- 添加 related_log_id 字段
ALTER TABLE attachments 
ADD COLUMN related_log_id INT NULL COMMENT '关联的检察记录ID' 
AFTER upload_month;

-- 添加 related_log_type 字段
ALTER TABLE attachments 
ADD COLUMN related_log_type ENUM('daily', 'weekly', 'monthly', 'immediate') NULL COMMENT '检察记录类型' 
AFTER related_log_id;

-- 添加索引
CREATE INDEX idx_attachments_related_log_id ON attachments(related_log_id);
CREATE INDEX idx_attachments_related_log_type ON attachments(related_log_type);
CREATE INDEX idx_attachments_related_log ON attachments(related_log_id, related_log_type);

-- 验证
DESC attachments;
SHOW INDEX FROM attachments;
