-- 创建月度基本信息表
CREATE TABLE IF NOT EXISTS monthly_basic_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    report_month VARCHAR(7) NOT NULL COMMENT '报告月份 YYYY-MM',
    
    -- 基本情况
    total_prisoners INT DEFAULT 0 COMMENT '在押罪犯总数',
    major_criminals INT DEFAULT 0 COMMENT '重大刑事犯',
    death_sentence INT DEFAULT 0 COMMENT '死缓犯',
    life_sentence INT DEFAULT 0 COMMENT '无期犯',
    repeat_offenders INT DEFAULT 0 COMMENT '二次以上判刑罪犯',
    foreign_prisoners INT DEFAULT 0 COMMENT '外籍犯',
    hk_macao_taiwan INT DEFAULT 0 COMMENT '港澳台罪犯',
    mental_illness INT DEFAULT 0 COMMENT '精神病犯',
    former_officials INT DEFAULT 0 COMMENT '原地厅以上罪犯',
    former_county_level INT DEFAULT 0 COMMENT '原县团级以上罪犯',
    falun_gong INT DEFAULT 0 COMMENT '法轮功',
    drug_history INT DEFAULT 0 COMMENT '有吸毒史罪犯',
    drug_crimes INT DEFAULT 0 COMMENT '涉毒犯',
    new_admissions INT DEFAULT 0 COMMENT '新收押罪犯',
    minor_females INT DEFAULT 0 COMMENT '未成年女犯',
    gang_related INT DEFAULT 0 COMMENT '涉黑罪犯',
    evil_forces INT DEFAULT 0 COMMENT '涉恶罪犯',
    endangering_safety INT DEFAULT 0 COMMENT '危安罪犯',
    released_count INT DEFAULT 0 COMMENT '刑满释放出监罪犯',
    
    -- 处分情况
    recorded_punishments INT DEFAULT 0 COMMENT '记过人数',
    recorded_punishments_reason TEXT COMMENT '记过原因',
    confinement_punishments INT DEFAULT 0 COMMENT '禁闭人数',
    confinement_reason TEXT COMMENT '禁闭原因',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_month (user_id, report_month),
    INDEX idx_user_id (user_id),
    INDEX idx_report_month (report_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='月度基本信息表';
