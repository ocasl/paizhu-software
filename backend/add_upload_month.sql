-- 为 Excel 数据表添加 upload_month 字段

ALTER TABLE strict_educations ADD COLUMN upload_month VARCHAR(7) COMMENT '数据归属月份(YYYY-MM)';
ALTER TABLE confinements ADD COLUMN upload_month VARCHAR(7) COMMENT '数据归属月份(YYYY-MM)';
ALTER TABLE restraint_usages ADD COLUMN upload_month VARCHAR(7) COMMENT '数据归属月份(YYYY-MM)';
ALTER TABLE blacklists ADD COLUMN upload_month VARCHAR(7) COMMENT '数据归属月份(YYYY-MM)';
ALTER TABLE mail_records ADD COLUMN upload_month VARCHAR(7) COMMENT '数据归属月份(YYYY-MM)';

-- 添加索引
CREATE INDEX idx_upload_month_strict ON strict_educations(upload_month);
CREATE INDEX idx_upload_month_confinement ON confinements(upload_month);
CREATE INDEX idx_upload_month_restraint ON restraint_usages(upload_month);
CREATE INDEX idx_upload_month_blacklist ON blacklists(upload_month);
CREATE INDEX idx_upload_month_mail ON mail_records(upload_month);

SELECT 'upload_month 字段添加完成' as result;
