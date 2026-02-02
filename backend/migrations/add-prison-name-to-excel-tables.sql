-- 为Excel数据表添加prison_name字段（数据隔离）
-- 执行时间：2026-01-28

-- 1. 严管教育表
ALTER TABLE strict_educations 
ADD COLUMN prison_name VARCHAR(100) NOT NULL DEFAULT '' COMMENT '派驻监所名称' AFTER status;

CREATE INDEX idx_strict_educations_prison_name ON strict_educations(prison_name);

-- 2. 禁闭审批表
ALTER TABLE confinements 
ADD COLUMN prison_name VARCHAR(100) NOT NULL DEFAULT '' COMMENT '派驻监所名称' AFTER status;

CREATE INDEX idx_confinements_prison_name ON confinements(prison_name);

-- 3. 涉黑恶名单表
ALTER TABLE blacklists 
ADD COLUMN prison_name VARCHAR(100) NOT NULL DEFAULT '' COMMENT '派驻监所名称' AFTER sentence_change;

-- 修改唯一索引，改为 prisoner_id + prison_name 组合唯一
DROP INDEX prisoner_id ON blacklists;
CREATE UNIQUE INDEX idx_blacklists_prisoner_prison ON blacklists(prisoner_id, prison_name);
CREATE INDEX idx_blacklists_prison_name ON blacklists(prison_name);

-- 4. 戒具使用表
ALTER TABLE restraint_usages 
ADD COLUMN prison_name VARCHAR(100) NOT NULL DEFAULT '' COMMENT '派驻监所名称' AFTER status;

CREATE INDEX idx_restraint_usages_prison_name ON restraint_usages(prison_name);

-- 5. 信件汇总表
ALTER TABLE mail_records 
ADD COLUMN prison_name VARCHAR(100) NOT NULL DEFAULT '' COMMENT '派驻监所名称' AFTER remarks;

CREATE INDEX idx_mail_records_prison_name ON mail_records(prison_name);

-- 说明：
-- 1. 所有表都添加了prison_name字段，用于按派驻单位隔离数据
-- 2. 涉黑恶名单表的唯一索引改为prisoner_id + prison_name组合，允许不同派驻单位有相同的罪犯编号
-- 3. 所有表都添加了prison_name索引，提高查询性能
-- 4. 默认值为空字符串，需要在上传Excel时填充实际的派驻单位名称
