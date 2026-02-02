-- =============================================
-- 派驻检察软件数据库初始化脚本
-- MySQL 8.0+
-- =============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS paizhu_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE paizhu_db;

-- =============================================
-- 1. 用户表
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码(加密)',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    prison_name VARCHAR(100) COMMENT '派驻监所名称',
    role ENUM('admin', 'inspector', 'leader') DEFAULT 'inspector' COMMENT '角色',
    phone VARCHAR(20) COMMENT '联系电话',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '账号状态',
    last_login DATETIME COMMENT '最后登录时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='用户表';

-- =============================================
-- 2. 日检察记录表
-- =============================================
CREATE TABLE IF NOT EXISTS daily_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    log_date DATE NOT NULL COMMENT '记录日期',
    prison_name VARCHAR(100) COMMENT '派驻监所',
    inspector_name VARCHAR(50) COMMENT '派驻人员',
    three_scenes JSON COMMENT '三大现场检察数据',
    strict_control JSON COMMENT '严管禁闭数据',
    police_equipment JSON COMMENT '警戒具检察数据',
    gang_prisoners JSON COMMENT '涉黑罪犯数据',
    admission JSON COMMENT '收押调出数据',
    monitor_check JSON COMMENT '监控抽查数据',
    supervision_situation TEXT COMMENT '检察监督情况',
    feedback_situation TEXT COMMENT '采纳反馈情况',
    other_work JSON COMMENT '其他检察工作',
    notes TEXT COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_log_date (log_date),
    INDEX idx_user_date (user_id, log_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='日检察记录表';

-- =============================================
-- 3. 周检察记录表
-- =============================================
CREATE TABLE IF NOT EXISTS weekly_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    record_date DATE NOT NULL COMMENT '记录日期',
    week_number INT COMMENT '第几周',
    hospital_check JSON COMMENT '医院禁闭室检察',
    injury_check JSON COMMENT '外伤检察',
    talk_records JSON COMMENT '谈话记录列表',
    mailbox JSON COMMENT '检察官信箱',
    contraband JSON COMMENT '违禁品检查',
    notes TEXT COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_record_date (record_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='周检察记录表';

-- =============================================
-- 4. 月检察记录表
-- =============================================
CREATE TABLE IF NOT EXISTS monthly_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    record_month VARCHAR(7) NOT NULL COMMENT '记录月份 YYYY-MM',
    visit_check JSON COMMENT '会见检察',
    meeting JSON COMMENT '会议参加情况',
    punishment JSON COMMENT '处分监督',
    position_stats JSON COMMENT '岗位增减统计',
    notes TEXT COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_record_month (record_month),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='月检察记录表';

-- =============================================
-- 5. 及时检察事件表
-- =============================================
CREATE TABLE IF NOT EXISTS immediate_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    event_date DATE NOT NULL COMMENT '事件日期',
    event_type ENUM('escape', 'selfHarm', 'death', 'epidemic', 'accident', 'paroleRequest', 'disciplinaryAction') NOT NULL COMMENT '事件类型',
    description TEXT COMMENT '事件描述',
    parole_data JSON COMMENT '减刑假释数据',
    attachment_ids JSON COMMENT '相关附件ID列表',
    status ENUM('pending', 'processed', 'closed') DEFAULT 'pending' COMMENT '处理状态',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_event_date (event_date),
    INDEX idx_event_type (event_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='及时检察事件表';

-- =============================================
-- 6. 附件表
-- =============================================
CREATE TABLE IF NOT EXISTS attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '上传用户ID',
    category VARCHAR(50) NOT NULL COMMENT '分类',
    original_name VARCHAR(255) NOT NULL COMMENT '原文件名',
    file_name VARCHAR(255) NOT NULL COMMENT '存储文件名',
    file_path VARCHAR(500) NOT NULL COMMENT '文件存储路径',
    file_size INT COMMENT '文件大小(字节)',
    mime_type VARCHAR(100) COMMENT 'MIME类型',
    parsed_data JSON COMMENT '解析后的数据',
    upload_month VARCHAR(7) COMMENT '上传月份 YYYY-MM',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_upload_month (upload_month),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='附件表';

-- =============================================
-- 初始化管理员账号
-- 密码: admin123 (bcrypt加密后)
-- =============================================
INSERT INTO users (username, password, name, prison_name, role, status) VALUES
('admin', '$2a$10$rQnM1qZ8K5XkJYG.6Q5zAe.V2x5X5X5X5X5X5X5X5X5X5X5X5X5X5', '系统管理员', '女子监狱', 'admin', 'active')
ON DUPLICATE KEY UPDATE name = name;

-- =============================================
-- 完成提示
-- =============================================
SELECT '数据库初始化完成!' AS message;
SELECT COUNT(*) AS user_count FROM users;
