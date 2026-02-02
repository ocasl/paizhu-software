-- 创建演示用户SQL脚本
-- 默认密码: 123456 (已加密)
-- 执行前请确保数据库已连接

SET NAMES utf8mb4;

-- 1. 删除已存在的演示用户（保留admin）
DELETE FROM user_prison_scopes WHERE user_id IN (
    SELECT id FROM users WHERE username IN ('yuanlingdao', 'lingdao1', 'lingdao2', 'nvzi_jcy1', 'nvzi_jcy2', 'nanzi_jcy1', 'nanzi_jcy2', 'wcn_jcy', 'yuzhang_jcy')
);

DELETE FROM users WHERE username IN ('yuanlingdao', 'lingdao1', 'lingdao2', 'nvzi_jcy1', 'nvzi_jcy2', 'nanzi_jcy1', 'nanzi_jcy2', 'wcn_jcy', 'yuzhang_jcy');

-- 2. 创建用户
-- 密码: 123456 (bcrypt加密后的值)
INSERT INTO users (username, password, name, prison_name, role, phone, status, last_login, createdAt, updatedAt) VALUES
-- 院领导（可查看所有监狱）
('yuanlingdao', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '张院长', NULL, 'top_viewer', '13800000001', 'active', NULL, NOW(), NOW()),

-- 分管领导1（分管女子监狱、男子监狱）
('lingdao1', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '李主任', '女子监狱', 'leader', '13800000002', 'active', NULL, NOW(), NOW()),

-- 分管领导2（分管未成年犯管教所、豫章监狱）
('lingdao2', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '王主任', '未成年犯管教所', 'leader', '13800000003', 'active', NULL, NOW(), NOW()),

-- 女子监狱检察员
('nvzi_jcy1', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '陈检察官', '女子监狱', 'inspector', '13800000011', 'active', NULL, NOW(), NOW()),
('nvzi_jcy2', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '刘检察官', '女子监狱', 'inspector', '13800000012', 'active', NULL, NOW(), NOW()),

-- 男子监狱检察员
('nanzi_jcy1', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '赵检察官', '男子监狱', 'inspector', '13800000021', 'active', NULL, NOW(), NOW()),
('nanzi_jcy2', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '孙检察官', '男子监狱', 'inspector', '13800000022', 'active', NULL, NOW(), NOW()),

-- 未成年犯管教所检察员
('wcn_jcy', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '周检察官', '未成年犯管教所', 'inspector', '13800000031', 'active', NULL, NOW(), NOW()),

-- 豫章监狱检察员
('yuzhang_jcy', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '吴检察官', '豫章监狱', 'inspector', '13800000041', 'active', NULL, NOW(), NOW());

-- 3. 配置领导的监狱范围
-- 院领导 - 可查看所有监狱
INSERT INTO user_prison_scopes (user_id, prison_name, createdAt, updatedAt)
SELECT id, '女子监狱', NOW(), NOW() FROM users WHERE username = 'yuanlingdao'
UNION ALL
SELECT id, '男子监狱', NOW(), NOW() FROM users WHERE username = 'yuanlingdao'
UNION ALL
SELECT id, '未成年犯管教所', NOW(), NOW() FROM users WHERE username = 'yuanlingdao'
UNION ALL
SELECT id, '豫章监狱', NOW(), NOW() FROM users WHERE username = 'yuanlingdao';

-- 分管领导1 - 分管女子监狱、男子监狱
INSERT INTO user_prison_scopes (user_id, prison_name, createdAt, updatedAt)
SELECT id, '女子监狱', NOW(), NOW() FROM users WHERE username = 'lingdao1'
UNION ALL
SELECT id, '男子监狱', NOW(), NOW() FROM users WHERE username = 'lingdao1';

-- 分管领导2 - 分管未成年犯管教所、豫章监狱
INSERT INTO user_prison_scopes (user_id, prison_name, createdAt, updatedAt)
SELECT id, '未成年犯管教所', NOW(), NOW() FROM users WHERE username = 'lingdao2'
UNION ALL
SELECT id, '豫章监狱', NOW(), NOW() FROM users WHERE username = 'lingdao2';

-- 4. 查看创建结果
SELECT 
    u.id,
    u.username,
    u.name,
    u.role,
    u.prison_name AS '所属监狱',
    GROUP_CONCAT(ups.prison_name ORDER BY ups.prison_name SEPARATOR ', ') AS '分管范围'
FROM users u
LEFT JOIN user_prison_scopes ups ON u.id = ups.user_id
GROUP BY u.id, u.username, u.name, u.role, u.prison_name
ORDER BY 
    CASE u.role
        WHEN 'admin' THEN 1
        WHEN 'top_viewer' THEN 2
        WHEN 'leader' THEN 3
        WHEN 'inspector' THEN 4
    END,
    u.id;

-- 完成提示
SELECT '✅ 演示用户创建完成！默认密码: 123456' AS '提示';
