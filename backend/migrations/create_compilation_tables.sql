-- ====================================
-- 汇编功能数据库表
-- ====================================

-- 1. 汇编分类表
CREATE TABLE IF NOT EXISTS compilation_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE COMMENT '分类名称',
  description VARCHAR(500) COMMENT '分类描述',
  sort_order INT DEFAULT 0 COMMENT '排序（数字越小越靠前）',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='汇编分类表';

-- 2. 汇编文档表
CREATE TABLE IF NOT EXISTS compilation_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL COMMENT '文档标题',
  description TEXT COMMENT '文档描述',
  category_id INT NOT NULL COMMENT '分类ID',
  file_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
  file_path VARCHAR(500) NOT NULL COMMENT '文件存储路径',
  file_type ENUM('docx', 'pdf') NOT NULL COMMENT '文件类型',
  file_size BIGINT COMMENT '文件大小（字节）',
  view_count INT DEFAULT 0 COMMENT '查看次数',
  download_count INT DEFAULT 0 COMMENT '下载次数',
  is_pinned BOOLEAN DEFAULT FALSE COMMENT '是否置顶',
  status ENUM('active', 'archived') DEFAULT 'active' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category_id),
  INDEX idx_status (status),
  INDEX idx_pinned (is_pinned),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (category_id) REFERENCES compilation_categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='汇编文档表';

-- 插入默认分类
INSERT INTO compilation_categories (name, description, sort_order) VALUES
('法律法规', '相关法律法规文件', 1),
('工作指引', '检察工作指引文件', 2),
('案例汇编', '典型案例汇编', 3)
ON DUPLICATE KEY UPDATE name=name;
