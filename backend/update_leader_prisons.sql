-- 更新院领导的监狱权限（所有监狱）
UPDATE users 
SET prison_name = '["女子监狱","男子监狱","未成年犯管教所","豫章监狱","赣西监狱"]' 
WHERE username = 'yuanlingdao';

-- 更新系统管理员的监狱权限（所有监狱）
UPDATE users 
SET prison_name = '["女子监狱","男子监狱","未成年犯管教所","豫章监狱","赣西监狱"]' 
WHERE username = 'admin';

-- 查看更新结果
SELECT id, username, role, prison_name FROM users WHERE role IN ('top_viewer', 'admin');
