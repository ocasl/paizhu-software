-- 为周检察和月检察表添加日志关联字段
-- 执行时间：2026-01-26

-- 1. 为 weekly_records 表添加字段
ALTER TABLE weekly_records 
ADD COLUMN log_id INT DEFAULT NULL COMMENT '关联的日志ID',
ADD COLUMN log_date DATE DEFAULT NULL COMMENT '关联的日志日期';

-- 2. 为 monthly_records 表添加字段
ALTER TABLE monthly_records 
ADD COLUMN log_id INT DEFAULT NULL COMMENT '关联的日志ID',
ADD COLUMN log_date DATE DEFAULT NULL COMMENT '关联的日志日期';

-- 3. 添加索引以提高查询性能
CREATE INDEX idx_weekly_records_log_id ON weekly_records(log_id);
CREATE INDEX idx_weekly_records_log_date ON weekly_records(log_date);
CREATE INDEX idx_monthly_records_log_id ON monthly_records(log_id);
CREATE INDEX idx_monthly_records_log_date ON monthly_records(log_date);

-- 完成！
SELECT 'Migration completed successfully!' AS status;
