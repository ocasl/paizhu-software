-- ========================================
-- 创建测试数据 - 简化版
-- ========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. 清理旧数据（保留admin）
DELETE FROM user_prison_scopes WHERE user_id > 1;
DELETE FROM immediate_events WHERE user_id > 1;
DELETE FROM monthly_archives WHERE user_id > 1;
DELETE FROM monthly_records WHERE user_id > 1;
DELETE FROM weekly_records WHERE user_id > 1;
DELETE FROM daily_logs WHERE user_id > 1;
DELETE FROM users WHERE id > 1;

-- 2. 创建用户（密码都是123456）
INSERT INTO users (username, password, name, prison_name, role, phone, status, createdAt, updatedAt) VALUES
('yuanlingdao', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '张院长', NULL, 'top_viewer', '13800000001', 'active', NOW(), NOW()),
('lingdao1', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '李主任', '女子监狱', 'leader', '13800000002', 'active', NOW(), NOW()),
('lingdao2', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '王主任', '未成年犯管教所', 'leader', '13800000003', 'active', NOW(), NOW()),
('nvzi_jcy1', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '陈检察官', '女子监狱', 'inspector', '13800000011', 'active', NOW(), NOW()),
('nvzi_jcy2', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '刘检察官', '女子监狱', 'inspector', '13800000012', 'active', NOW(), NOW()),
('nanzi_jcy1', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '赵检察官', '男子监狱', 'inspector', '13800000021', 'active', NOW(), NOW()),
('nanzi_jcy2', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '孙检察官', '男子监狱', 'inspector', '13800000022', 'active', NOW(), NOW()),
('wcn_jcy', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '周检察官', '未成年犯管教所', 'inspector', '13800000031', 'active', NOW(), NOW()),
('yuzhang_jcy', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '吴检察官', '豫章监狱', 'inspector', '13800000041', 'active', NOW(), NOW()),
('ganxi_jcy', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '郑检察官', '赣西监狱', 'inspector', '13800000051', 'active', NOW(), NOW());

-- 3. 配置领导的监狱范围
INSERT INTO user_prison_scopes (user_id, prison_name, createdAt, updatedAt)
SELECT id, '女子监狱', NOW(), NOW() FROM users WHERE username = 'yuanlingdao'
UNION ALL SELECT id, '男子监狱', NOW(), NOW() FROM users WHERE username = 'yuanlingdao'
UNION ALL SELECT id, '未成年犯管教所', NOW(), NOW() FROM users WHERE username = 'yuanlingdao'
UNION ALL SELECT id, '豫章监狱', NOW(), NOW() FROM users WHERE username = 'yuanlingdao'
UNION ALL SELECT id, '赣西监狱', NOW(), NOW() FROM users WHERE username = 'yuanlingdao'
UNION ALL SELECT id, '女子监狱', NOW(), NOW() FROM users WHERE username = 'lingdao1'
UNION ALL SELECT id, '男子监狱', NOW(), NOW() FROM users WHERE username = 'lingdao1'
UNION ALL SELECT id, '未成年犯管教所', NOW(), NOW() FROM users WHERE username = 'lingdao2'
UNION ALL SELECT id, '豫章监狱', NOW(), NOW() FROM users WHERE username = 'lingdao2'
UNION ALL SELECT id, '赣西监狱', NOW(), NOW() FROM users WHERE username = 'lingdao2';

-- 4. 创建日检察日志（女子监狱 - 最近10天）
INSERT INTO daily_logs (user_id, log_date, prison_name, inspector_name, three_scenes, strict_control, police_equipment, gang_prisoners, admission, monitor_check, supervision_situation, feedback_situation, created_at, updated_at)
VALUES
((SELECT id FROM users WHERE username = 'nvzi_jcy1'), DATE_SUB(CURDATE(), INTERVAL 0 DAY), '女子监狱', '陈检察官', '{"labor":{"checked":true,"locations":["车间一","车间二"]},"living":{"checked":true,"locations":["宿舍楼A"]},"study":{"checked":true,"locations":["教室"]}}', '{"newCount":1,"confinementNew":0}', '{"count":3}', '{"count":5}', '{"inCount":2,"outCount":1}', '{"checked":true,"count":2}', '检察情况正常', '已反馈', NOW(), NOW()),
((SELECT id FROM users WHERE username = 'nvzi_jcy1'), DATE_SUB(CURDATE(), INTERVAL 1 DAY), '女子监狱', '陈检察官', '{"labor":{"checked":true,"locations":["车间一"]},"living":{"checked":true,"locations":["宿舍楼A"]},"study":{"checked":false,"locations":[]}}', '{"newCount":0,"confinementNew":1}', '{"count":2}', '{"count":3}', '{"inCount":1,"outCount":0}', '{"checked":true,"count":1}', '日常检察', '无问题', NOW(), NOW()),
((SELECT id FROM users WHERE username = 'nvzi_jcy1'), DATE_SUB(CURDATE(), INTERVAL 2 DAY), '女子监狱', '陈检察官', '{"labor":{"checked":true,"locations":["车间二"]},"living":{"checked":true,"locations":["食堂"]},"study":{"checked":true,"locations":["教室"]}}', '{"newCount":2,"confinementNew":0}', '{"count":4}', '{"count":8}', '{"inCount":3,"outCount":2}', '{"checked":true,"count":3}', '发现问题2个', '已整改', NOW(), NOW()),
((SELECT id FROM users WHERE username = 'nvzi_jcy1'), DATE_SUB(CURDATE(), INTERVAL 3 DAY), '女子监狱', '陈检察官', '{"labor":{"checked":true,"locations":["车间一","车间二"]},"living":{"checked":true,"locations":["宿舍楼B"]},"study":{"checked":false,"locations":[]}}', '{"newCount":0,"confinementNew":0}', '{"count":3}', '{"count":6}', '{"inCount":1,"outCount":1}', '{"checked":true,"count":2}', '情况良好', '无', NOW(), NOW()),
((SELECT id FROM users WHERE username = 'nvzi_jcy1'), DATE_SUB(CURDATE(), INTERVAL 4 DAY), '女子监狱', '陈检察官', '{"labor":{"checked":true,"locations":["车间一"]},"living":{"checked":true,"locations":["宿舍楼A","食堂"]},"study":{"checked":true,"locations":["教室"]}}', '{"newCount":1,"confinementNew":1}', '{"count":5}', '{"count":7}', '{"inCount":2,"outCount":0}', '{"checked":true,"count":2}', '正常检察', '已反馈', NOW(), NOW());

-- 男子监狱 - 最近5天
INSERT INTO daily_logs (user_id, log_date, prison_name, inspector_name, three_scenes, strict_control, police_equipment, gang_prisoners, admission, monitor_check, supervision_situation, feedback_situation, created_at, updated_at)
VALUES
((SELECT id FROM users WHERE username = 'nanzi_jcy1'), DATE_SUB(CURDATE(), INTERVAL 0 DAY), '男子监狱', '赵检察官', '{"labor":{"checked":true,"locations":["生产车间"]},"living":{"checked":true,"locations":["监区一"]},"study":{"checked":true,"locations":["图书室"]}}', '{"newCount":2,"confinementNew":1}', '{"count":6}', '{"count":12}', '{"inCount":4,"outCount":2}', '{"checked":true,"count":3}', '日常检察', '无重大问题', NOW(), NOW()),
((SELECT id FROM users WHERE username = 'nanzi_jcy1'), DATE_SUB(CURDATE(), INTERVAL 1 DAY), '男子监狱', '赵检察官', '{"labor":{"checked":true,"locations":["仓库"]},"living":{"checked":true,"locations":["监区二"]},"study":{"checked":true,"locations":["活动室"]}}', '{"newCount":1,"confinementNew":0}', '{"count":5}', '{"count":10}', '{"inCount":3,"outCount":1}', '{"checked":true,"count":2}', '情况良好', '已处理', NOW(), NOW()),
((SELECT id FROM users WHERE username = 'nanzi_jcy1'), DATE_SUB(CURDATE(), INTERVAL 2 DAY), '男子监狱', '赵检察官', '{"labor":{"checked":true,"locations":["生产车间","仓库"]},"living":{"checked":true,"locations":["监区一","监区二"]},"study":{"checked":false,"locations":[]}}', '{"newCount":0,"confinementNew":0}', '{"count":7}', '{"count":15}', '{"inCount":5,"outCount":3}', '{"checked":true,"count":4}', '正常', '无', NOW(), NOW());

-- 5. 创建及时检察事件
INSERT INTO immediate_events (user_id, event_date, event_type, title, description, attachment_ids, status, created_at, updated_at)
VALUES
-- 女子监狱事件
((SELECT id FROM users WHERE username = 'nvzi_jcy1'), DATE_SUB(CURDATE(), INTERVAL 25 DAY), 'selfHarm', '罪犯张某自伤事件', '罪犯张某在监室内用牙刷自伤手臂，立即送医治疗，加强心理疏导，已处理完毕，情况稳定', '[]', 'processed', NOW(), NOW()),
((SELECT id FROM users WHERE username = 'nvzi_jcy1'), DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'death', '罪犯王某病故', '罪犯王某因突发心脏病抢救无效死亡，立即启动应急预案，通知家属，已完成调查', '[]', 'closed', NOW(), NOW()),
((SELECT id FROM users WHERE username = 'nvzi_jcy1'), DATE_SUB(CURDATE(), INTERVAL 12 DAY), 'paroleRequest', '本月减刑案件审查', '审查15名罪犯减刑材料，逐一核实材料真实性，已完成审查', '[]', 'processed', NOW(), NOW()),
-- 男子监狱事件
((SELECT id FROM users WHERE username = 'nanzi_jcy1'), DATE_SUB(CURDATE(), INTERVAL 22 DAY), 'epidemic', '流感疫情防控', '监区发现5名罪犯出现发热症状，隔离观察，全面消毒，疫情得到控制', '[]', 'processed', NOW(), NOW()),
((SELECT id FROM users WHERE username = 'nanzi_jcy1'), DATE_SUB(CURDATE(), INTERVAL 19 DAY), 'selfHarm', '罪犯赵某自伤', '罪犯赵某用刀片划伤手腕，紧急送医，心理干预，已稳定', '[]', 'processed', NOW(), NOW()),
((SELECT id FROM users WHERE username = 'nanzi_jcy1'), DATE_SUB(CURDATE(), INTERVAL 16 DAY), 'accident', '生产车间安全事故', '罪犯孙某操作不当导致手指受伤，立即停工，送医治疗，已处理', '[]', 'processed', NOW(), NOW()),
((SELECT id FROM users WHERE username = 'nanzi_jcy1'), DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'escape', '罪犯脱逃未遂事件', '罪犯周某企图翻越围墙脱逃被发现，立即制止，加强警戒，已控制', '[]', 'processed', NOW(), NOW()),
-- 未成年犯管教所事件
((SELECT id FROM users WHERE username = 'wcn_jcy'), DATE_SUB(CURDATE(), INTERVAL 14 DAY), 'accident', '劳动场所轻微事故', '罪犯李某在劳动时手指被机器划伤，立即停工检查，送医处理，已处理', '[]', 'processed', NOW(), NOW()),
((SELECT id FROM users WHERE username = 'wcn_jcy'), DATE_SUB(CURDATE(), INTERVAL 11 DAY), 'selfHarm', '未成年犯情绪问题', '罪犯小王情绪低落，有自伤倾向，心理医生介入，家属沟通，情绪好转', '[]', 'processed', NOW(), NOW()),
-- 豫章监狱事件
((SELECT id FROM users WHERE username = 'yuzhang_jcy'), DATE_SUB(CURDATE(), INTERVAL 13 DAY), 'epidemic', '传染病防控', '发现2例疑似传染病病例，立即隔离，消毒，已控制', '[]', 'processed', NOW(), NOW()),
((SELECT id FROM users WHERE username = 'yuzhang_jcy'), DATE_SUB(CURDATE(), INTERVAL 9 DAY), 'paroleRequest', '减刑案件审查', '审查12名罪犯减刑材料，严格把关，已完成', '[]', 'processed', NOW(), NOW()),
-- 赣西监狱事件
((SELECT id FROM users WHERE username = 'ganxi_jcy'), DATE_SUB(CURDATE(), INTERVAL 17 DAY), 'selfHarm', '罪犯自伤事件', '罪犯郑某用玻璃片自伤，紧急处理，心理干预，已稳定', '[]', 'processed', NOW(), NOW()),
((SELECT id FROM users WHERE username = 'ganxi_jcy'), DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'paroleRequest', '假释案件审查', '审查5名罪犯假释申请，严格审查，已完成', '[]', 'processed', NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;

-- 查看结果
SELECT '✅ 测试数据创建完成！' AS '提示';
SELECT '所有用户默认密码: 123456' AS '提示';

SELECT '' AS '';
SELECT '用户统计:' AS '';
SELECT role AS '角色', COUNT(*) AS '数量' FROM users GROUP BY role;

SELECT '' AS '';
SELECT '日志统计:' AS '';
SELECT prison_name AS '监狱', COUNT(*) AS '日志数量' FROM daily_logs GROUP BY prison_name;

SELECT '' AS '';
SELECT '及时检察统计:' AS '';
SELECT u.prison_name AS '监狱', ie.event_type AS '事件类型', COUNT(*) AS '数量' 
FROM immediate_events ie 
JOIN users u ON ie.user_id = u.id 
GROUP BY u.prison_name, ie.event_type;
