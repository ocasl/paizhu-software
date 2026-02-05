-- 创建用户-监狱权限关联表
CREATE TABLE IF NOT EXISTS user_prison_scopes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  prison_name VARCHAR(100) NOT NULL COMMENT '监狱名称',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_prison (user_id, prison_name),
  INDEX idx_user_id (user_id),
  INDEX idx_prison_name (prison_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户监狱权限关联表';

-- 为院领导分配所有监狱权限
INSERT IGNORE INTO user_prison_scopes (user_id, prison_name) VALUES
(42, '女子监狱'),
(42, '男子监狱'),
(42, '未成年犯管教所'),
(42, '豫章监狱'),
(42, '赣西监狱');

-- 为系统管理员分配所有监狱权限
INSERT IGNORE INTO user_prison_scopes (user_id, prison_name) VALUES
(1, '女子监狱'),
(1, '男子监狱'),
(1, '未成年犯管教所'),
(1, '豫章监狱'),
(1, '赣西监狱');

-- 为分管领导分配对应监狱权限
INSERT IGNORE INTO user_prison_scopes (user_id, prison_name) VALUES
(43, '女子监狱'),
(44, '未成年犯管教所');

-- 查看结果
SELECT u.id, u.username, u.role, GROUP_CONCAT(ups.prison_name) as prisons
FROM users u
LEFT JOIN user_prison_scopes ups ON u.id = ups.user_id
WHERE u.role IN ('top_viewer', 'admin', 'leader')
GROUP BY u.id, u.username, u.role;
