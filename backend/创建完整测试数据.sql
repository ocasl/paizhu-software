-- ========================================
-- 创建完整测试数据
-- 包括：用户、日志、周检察、月检察、及时检察等
-- ========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ========================================
-- 第一部分：创建用户和权限
-- ========================================

-- 1. 清理旧数据（保留admin）
DELETE FROM user_prison_scopes WHERE user_id > 1;
DELETE FROM users WHERE id > 1;

-- 2. 创建用户（密码都是123456）
INSERT INTO users (username, password, name, prison_name, role, phone, status, created_at, updated_at) VALUES
-- 院领导（可查看所有监狱）
('yuanlingdao', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '张院长', NULL, 'top_viewer', '13800000001', 'active', NOW(), NOW()),

-- 分管领导1（分管女子监狱、男子监狱）
('lingdao1', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '李主任', '女子监狱', 'leader', '13800000002', 'active', NOW(), NOW()),

-- 分管领导2（分管未成年犯管教所、豫章监狱、赣西监狱）
('lingdao2', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '王主任', '未成年犯管教所', 'leader', '13800000003', 'active', NOW(), NOW()),

-- 女子监狱检察员
('nvzi_jcy1', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '陈检察官', '女子监狱', 'inspector', '13800000011', 'active', NOW(), NOW()),
('nvzi_jcy2', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '刘检察官', '女子监狱', 'inspector', '13800000012', 'active', NOW(), NOW()),

-- 男子监狱检察员
('nanzi_jcy1', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '赵检察官', '男子监狱', 'inspector', '13800000021', 'active', NOW(), NOW()),
('nanzi_jcy2', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '孙检察官', '男子监狱', 'inspector', '13800000022', 'active', NOW(), NOW()),

-- 未成年犯管教所检察员
('wcn_jcy', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '周检察官', '未成年犯管教所', 'inspector', '13800000031', 'active', NOW(), NOW()),

-- 豫章监狱检察员
('yuzhang_jcy', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '吴检察官', '豫章监狱', 'inspector', '13800000041', 'active', NOW(), NOW()),

-- 赣西监狱检察员
('ganxi_jcy', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '郑检察官', '赣西监狱', 'inspector', '13800000051', 'active', NOW(), NOW());

-- 3. 配置领导的监狱范围
-- 院领导 - 可查看所有监狱
INSERT INTO user_prison_scopes (user_id, prison_name, created_at, updated_at)
SELECT id, '女子监狱', NOW(), NOW() FROM users WHERE username = 'yuanlingdao'
UNION ALL SELECT id, '男子监狱', NOW(), NOW() FROM users WHERE username = 'yuanlingdao'
UNION ALL SELECT id, '未成年犯管教所', NOW(), NOW() FROM users WHERE username = 'yuanlingdao'
UNION ALL SELECT id, '豫章监狱', NOW(), NOW() FROM users WHERE username = 'yuanlingdao'
UNION ALL SELECT id, '赣西监狱', NOW(), NOW() FROM users WHERE username = 'yuanlingdao';

-- 分管领导1 - 分管女子监狱、男子监狱
INSERT INTO user_prison_scopes (user_id, prison_name, created_at, updated_at)
SELECT id, '女子监狱', NOW(), NOW() FROM users WHERE username = 'lingdao1'
UNION ALL SELECT id, '男子监狱', NOW(), NOW() FROM users WHERE username = 'lingdao1';

-- 分管领导2 - 分管未成年犯管教所、豫章监狱、赣西监狱
INSERT INTO user_prison_scopes (user_id, prison_name, created_at, updated_at)
SELECT id, '未成年犯管教所', NOW(), NOW() FROM users WHERE username = 'lingdao2'
UNION ALL SELECT id, '豫章监狱', NOW(), NOW() FROM users WHERE username = 'lingdao2'
UNION ALL SELECT id, '赣西监狱', NOW(), NOW() FROM users WHERE username = 'lingdao2';

-- ========================================
-- 第二部分：创建日检察日志
-- ========================================

-- 女子监狱 - 陈检察官的日志（最近15天）
INSERT INTO daily_logs (user_id, log_date, prison_name, inspector_name, three_scenes, strict_control, police_equipment, gang_prisoners, admission, monitor_check, supervision_situation, feedback_situation, other_work, notes, created_at, updated_at)
SELECT 
    (SELECT id FROM users WHERE username = 'nvzi_jcy1'),
    DATE_SUB(CURDATE(), INTERVAL n DAY),
    '女子监狱',
    '陈检察官',
    JSON_OBJECT(
        'labor', JSON_OBJECT('checked', TRUE, 'locations', JSON_ARRAY('车间一', '车间二')),
        'living', JSON_OBJECT('checked', TRUE, 'locations', JSON_ARRAY('宿舍楼A', '食堂')),
        'study', JSON_OBJECT('checked', n % 2 = 0, 'locations', JSON_ARRAY('教室'))
    ),
    JSON_OBJECT('newCount', FLOOR(RAND() * 3), 'confinementNew', FLOOR(RAND() * 2)),
    JSON_OBJECT('count', FLOOR(RAND() * 5) + 1),
    JSON_OBJECT('count', FLOOR(RAND() * 10)),
    JSON_OBJECT('inCount', FLOOR(RAND() * 3), 'outCount', FLOOR(RAND() * 2)),
    JSON_OBJECT('checked', TRUE, 'count', FLOOR(RAND() * 3) + 1),
    CONCAT('检察情况正常，发现问题', FLOOR(RAND() * 3), '个'),
    CONCAT('已反馈给监狱方，要求整改'),
    JSON_OBJECT('supervisionSituation', '其他监督情况', 'feedbackSituation', '其他反馈情况'),
    CONCAT('备注信息', n),
    NOW(),
    NOW()
FROM (
    SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
    UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
    UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14
) AS numbers;

-- 男子监狱 - 赵检察官的日志（最近10天）
INSERT INTO daily_logs (user_id, log_date, prison_name, inspector_name, three_scenes, strict_control, police_equipment, gang_prisoners, admission, monitor_check, supervision_situation, feedback_situation, created_at, updated_at)
SELECT 
    (SELECT id FROM users WHERE username = 'nanzi_jcy1'),
    DATE_SUB(CURDATE(), INTERVAL n DAY),
    '男子监狱',
    '赵检察官',
    JSON_OBJECT(
        'labor', JSON_OBJECT('checked', TRUE, 'locations', JSON_ARRAY('生产车间', '仓库')),
        'living', JSON_OBJECT('checked', TRUE, 'locations', JSON_ARRAY('监区一', '监区二')),
        'study', JSON_OBJECT('checked', TRUE, 'locations', JSON_ARRAY('图书室', '活动室'))
    ),
    JSON_OBJECT('newCount', FLOOR(RAND() * 2), 'confinementNew', FLOOR(RAND() * 1)),
    JSON_OBJECT('count', FLOOR(RAND() * 8) + 2),
    JSON_OBJECT('count', FLOOR(RAND() * 15)),
    JSON_OBJECT('inCount', FLOOR(RAND() * 5), 'outCount', FLOOR(RAND() * 3)),
    JSON_OBJECT('checked', TRUE, 'count', FLOOR(RAND() * 4) + 2),
    CONCAT('日常检察，情况良好'),
    CONCAT('无重大问题'),
    NOW(),
    NOW()
FROM (
    SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
    UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
) AS numbers;

-- 未成年犯管教所 - 周检察官的日志（最近7天）
INSERT INTO daily_logs (user_id, log_date, prison_name, inspector_name, three_scenes, strict_control, police_equipment, gang_prisoners, admission, monitor_check, supervision_situation, feedback_situation, created_at, updated_at)
SELECT 
    (SELECT id FROM users WHERE username = 'wcn_jcy'),
    DATE_SUB(CURDATE(), INTERVAL n DAY),
    '未成年犯管教所',
    '周检察官',
    JSON_OBJECT(
        'labor', JSON_OBJECT('checked', TRUE, 'locations', JSON_ARRAY('手工车间')),
        'living', JSON_OBJECT('checked', TRUE, 'locations', JSON_ARRAY('宿舍', '餐厅')),
        'study', JSON_OBJECT('checked', TRUE, 'locations', JSON_ARRAY('教室A', '教室B'))
    ),
    JSON_OBJECT('newCount', FLOOR(RAND() * 1), 'confinementNew', 0),
    JSON_OBJECT('count', FLOOR(RAND() * 3) + 1),
    JSON_OBJECT('count', FLOOR(RAND() * 5)),
    JSON_OBJECT('inCount', FLOOR(RAND() * 2), 'outCount', FLOOR(RAND() * 1)),
    JSON_OBJECT('checked', TRUE, 'count', 2),
    CONCAT('重点关注未成年犯心理健康'),
    CONCAT('建议加强心理辅导'),
    NOW(),
    NOW()
FROM (
    SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
    UNION ALL SELECT 5 UNION ALL SELECT 6
) AS numbers;

-- ========================================
-- 第三部分：创建周检察记录
-- ========================================

-- 女子监狱 - 最近4周
INSERT INTO weekly_records (user_id, prison_name, record_date, week_start_date, week_end_date, hospital_check, talk_records, mailbox, notes, created_at, updated_at)
SELECT 
    (SELECT id FROM users WHERE username = 'nvzi_jcy1'),
    '女子监狱',
    DATE_SUB(CURDATE(), INTERVAL n*7 DAY),
    DATE_SUB(CURDATE(), INTERVAL n*7 DAY),
    DATE_SUB(CURDATE(), INTERVAL (n*7-6) DAY),
    JSON_OBJECT(
        'hospitalChecked', TRUE,
        'confinementChecked', n % 2 = 0,
        'hospitalNotes', '医院检察正常',
        'confinementNotes', '禁闭室检察正常'
    ),
    JSON_ARRAY(
        JSON_OBJECT('type', 'newPrisoner', 'count', FLOOR(RAND() * 3) + 1, 'notes', '新入监谈话'),
        JSON_OBJECT('type', 'injury', 'count', FLOOR(RAND() * 2), 'notes', '外伤检察')
    ),
    JSON_OBJECT('openCount', 1, 'receivedCount', FLOOR(RAND() * 5), 'notes', '信箱检察'),
    CONCAT('第', n+1, '周检察记录'),
    NOW(),
    NOW()
FROM (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) AS numbers;

-- 男子监狱 - 最近3周
INSERT INTO weekly_records (user_id, prison_name, record_date, week_start_date, week_end_date, hospital_check, talk_records, mailbox, created_at, updated_at)
SELECT 
    (SELECT id FROM users WHERE username = 'nanzi_jcy1'),
    '男子监狱',
    DATE_SUB(CURDATE(), INTERVAL n*7 DAY),
    DATE_SUB(CURDATE(), INTERVAL n*7 DAY),
    DATE_SUB(CURDATE(), INTERVAL (n*7-6) DAY),
    JSON_OBJECT('hospitalChecked', TRUE, 'confinementChecked', TRUE),
    JSON_ARRAY(
        JSON_OBJECT('type', 'newPrisoner', 'count', FLOOR(RAND() * 5) + 2),
        JSON_OBJECT('type', 'confinement', 'count', FLOOR(RAND() * 2))
    ),
    JSON_OBJECT('openCount', 1, 'receivedCount', FLOOR(RAND() * 8)),
    NOW(),
    NOW()
FROM (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2) AS numbers;

-- ========================================
-- 第四部分：创建月检察记录
-- ========================================

-- 女子监狱 - 本月
INSERT INTO monthly_records (user_id, prison_name, record_month, record_date, visit_check, dangerous_check, meeting_attendance, notes, created_at, updated_at)
VALUES
((SELECT id FROM users WHERE username = 'nvzi_jcy1'), '女子监狱', DATE_FORMAT(CURDATE(), '%Y-%m'), CURDATE(),
 JSON_OBJECT('checked', TRUE, 'visitCount', 3, 'notes', '会见场所检察正常'),
 JSON_OBJECT('checked', TRUE, 'notes', '危险物品检查正常'),
 JSON_OBJECT('attended', TRUE, 'meetingType', '犯情分析会', 'notes', '参加犯情分析会'),
 '本月检察记录', NOW(), NOW());

-- 男子监狱 - 本月
INSERT INTO monthly_records (user_id, prison_name, record_month, record_date, visit_check, dangerous_check, meeting_attendance, created_at, updated_at)
VALUES
((SELECT id FROM users WHERE username = 'nanzi_jcy1'), '男子监狱', DATE_FORMAT(CURDATE(), '%Y-%m'), CURDATE(),
 JSON_OBJECT('checked', TRUE, 'visitCount', 5),
 JSON_OBJECT('checked', TRUE),
 JSON_OBJECT('attended', TRUE, 'meetingType', '犯情分析会'),
 NOW(), NOW());

-- ========================================
-- 第五部分：创建及时检察事件（大量测试数据）
-- ========================================

-- 女子监狱 - 多种类型事件
INSERT INTO immediate_events (user_id, prison_name, event_type, event_date, title, description, measures, result, attachment_ids, created_at, updated_at)
VALUES
-- 自伤自残事件
((SELECT id FROM users WHERE username = 'nvzi_jcy1'), '女子监狱', 'selfHarm', DATE_SUB(CURDATE(), INTERVAL 25 DAY),
 '罪犯张某自伤事件', '罪犯张某在监室内用牙刷自伤手臂，造成轻微伤', '立即送医治疗，加强心理疏导，安排专人看护', '已处理完毕，情况稳定，加强后续观察', '[]', NOW(), NOW()),

((SELECT id FROM users WHERE username = 'nvzi_jcy1'), '女子监狱', 'selfHarm', DATE_SUB(CURDATE(), INTERVAL 18 DAY),
 '罪犯李某自残行为', '罪犯李某情绪激动，用头撞墙', '立即制止，送医检查，心理医生介入', '已稳定，继续观察', '[]', NOW(), NOW()),

-- 死亡事件
((SELECT id FROM users WHERE username = 'nvzi_jcy1'), '女子监狱', 'death', DATE_SUB(CURDATE(), INTERVAL 20 DAY),
 '罪犯王某病故', '罪犯王某因突发心脏病抢救无效死亡', '立即启动应急预案，通知家属，配合调查', '已完成调查，属正常死亡', '[]', NOW(), NOW()),

-- 重大活动
((SELECT id FROM users WHERE username = 'nvzi_jcy1'), '女子监狱', '重大活动', DATE_SUB(CURDATE(), INTERVAL 15 DAY),
 '监狱开展教育改造活动', '组织全体罪犯参加法制教育讲座', '全程监督，确保活动顺利进行', '活动圆满完成', '[]', NOW(), NOW()),

-- 减刑假释
((SELECT id FROM users WHERE username = 'nvzi_jcy1'), '女子监狱', '减刑假释', DATE_SUB(CURDATE(), INTERVAL 12 DAY),
 '本月减刑案件审查', '审查15名罪犯减刑材料', '逐一核实材料真实性，提出检察意见', '已完成审查，提交意见书', '[]', NOW(), NOW()),

((SELECT id FROM users WHERE username = 'nvzi_jcy1'), '女子监狱', '减刑假释', DATE_SUB(CURDATE(), INTERVAL 8 DAY),
 '假释案件审查', '审查3名罪犯假释申请', '实地调查，走访了解情况', '已提交审查意见', '[]', NOW(), NOW()),

-- 男子监狱 - 多种事件
((SELECT id FROM users WHERE username = 'nanzi_jcy1'), '男子监狱', 'epidemic', DATE_SUB(CURDATE(), INTERVAL 22 DAY),
 '流感疫情防控', '监区发现5名罪犯出现发热症状', '隔离观察，全面消毒，加强防护，启动应急预案', '疫情得到有效控制，无扩散', '[]', NOW(), NOW()),

((SELECT id FROM users WHERE username = 'nanzi_jcy1'), '男子监狱', 'selfHarm', DATE_SUB(CURDATE(), INTERVAL 19 DAY),
 '罪犯赵某自伤', '罪犯赵某用刀片划伤手腕', '紧急送医，缝合伤口，心理干预', '已稳定，加强监管', '[]', NOW(), NOW()),

((SELECT id FROM users WHERE username = 'nanzi_jcy1'), '男子监狱', 'accident', DATE_SUB(CURDATE(), INTERVAL 16 DAY),
 '生产车间安全事故', '罪犯孙某操作不当导致手指受伤', '立即停工，送医治疗，安全培训', '已处理，加强安全教育', '[]', NOW(), NOW()),

((SELECT id FROM users WHERE username = 'nanzi_jcy1'), '男子监狱', '减刑假释', DATE_SUB(CURDATE(), INTERVAL 10 DAY),
 '减刑案件集中审查', '审查本月20名罪犯减刑材料', '严格审查，确保公正', '已完成审查', '[]', NOW(), NOW()),

((SELECT id FROM users WHERE username = 'nanzi_jcy1'), '男子监狱', '脱逃', DATE_SUB(CURDATE(), INTERVAL 5 DAY),
 '罪犯脱逃未遂事件', '罪犯周某企图翻越围墙脱逃被发现', '立即制止，加强警戒，调查动机', '已控制，加强管理', '[]', NOW(), NOW()),

-- 未成年犯管教所 - 特殊事件
((SELECT id FROM users WHERE username = 'wcn_jcy'), '未成年犯管教所', 'accident', DATE_SUB(CURDATE(), INTERVAL 14 DAY),
 '劳动场所轻微事故', '罪犯李某在劳动时手指被机器划伤', '立即停工检查，送医处理，安全教育', '已处理，加强安全教育', '[]', NOW(), NOW()),

((SELECT id FROM users WHERE username = 'wcn_jcy'), '未成年犯管教所', 'selfHarm', DATE_SUB(CURDATE(), INTERVAL 11 DAY),
 '未成年犯情绪问题', '罪犯小王情绪低落，有自伤倾向', '心理医生介入，家属沟通，加强关怀', '情绪好转，继续关注', '[]', NOW(), NOW()),

((SELECT id FROM users WHERE username = 'wcn_jcy'), '未成年犯管教所', '重大活动', DATE_SUB(CURDATE(), INTERVAL 7 DAY),
 '青少年法制教育活动', '邀请法官进行法制教育讲座', '全程监督，效果良好', '活动成功举办', '[]', NOW(), NOW()),

-- 豫章监狱 - 事件
((SELECT id FROM users WHERE username = 'yuzhang_jcy'), '豫章监狱', 'epidemic', DATE_SUB(CURDATE(), INTERVAL 13 DAY),
 '传染病防控', '发现2例疑似传染病病例', '立即隔离，消毒，排查密接', '已控制，无扩散', '[]', NOW(), NOW()),

((SELECT id FROM users WHERE username = 'yuzhang_jcy'), '豫章监狱', '减刑假释', DATE_SUB(CURDATE(), INTERVAL 9 DAY),
 '减刑案件审查', '审查12名罪犯减刑材料', '严格把关，公正审查', '已完成', '[]', NOW(), NOW()),

((SELECT id FROM users WHERE username = 'yuzhang_jcy'), '豫章监狱', 'accident', DATE_SUB(CURDATE(), INTERVAL 4 DAY),
 '设施维修事故', '维修过程中罪犯受轻伤', '送医治疗，调查原因', '已处理', '[]', NOW(), NOW()),

-- 赣西监狱 - 事件
((SELECT id FROM users WHERE username = 'ganxi_jcy'), '赣西监狱', 'selfHarm', DATE_SUB(CURDATE(), INTERVAL 17 DAY),
 '罪犯自伤事件', '罪犯郑某用玻璃片自伤', '紧急处理，心理干预', '已稳定', '[]', NOW(), NOW()),

((SELECT id FROM users WHERE username = 'ganxi_jcy'), '赣西监狱', '重大活动', DATE_SUB(CURDATE(), INTERVAL 6 DAY),
 '监狱开放日活动', '组织家属探访活动', '全程监督，秩序良好', '活动圆满', '[]', NOW(), NOW()),

((SELECT id FROM users WHERE username = 'ganxi_jcy'), '赣西监狱', '减刑假释', DATE_SUB(CURDATE(), INTERVAL 3 DAY),
 '假释案件审查', '审查5名罪犯假释申请', '严格审查', '已完成', '[]', NOW(), NOW());

-- ========================================
-- 第六部分：创建月度归档记录
-- ========================================

-- 女子监狱 - 上个月归档
INSERT INTO monthly_archives (user_id, prison_name, year, month, status, daily_log_count, attachment_count, immediate_event_count, submitted_at, created_at, updated_at)
VALUES
((SELECT id FROM users WHERE username = 'nvzi_jcy1'), '女子监狱', YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)), MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)),
 'draft', 15, 8, 1, NULL, NOW(), NOW());

-- 男子监狱 - 上个月归档（已提交）
INSERT INTO monthly_archives (user_id, prison_name, year, month, status, daily_log_count, attachment_count, immediate_event_count, submitted_at, created_at, updated_at)
VALUES
((SELECT id FROM users WHERE username = 'nanzi_jcy1'), '男子监狱', YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)), MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)),
 'pending', 10, 5, 1, NOW(), NOW(), NOW());

-- ========================================
-- 完成
-- ========================================

SET FOREIGN_KEY_CHECKS = 1;

-- 查看创建结果
SELECT '========================================' AS '';
SELECT '✅ 测试数据创建完成！' AS '提示';
SELECT '========================================' AS '';

SELECT '用户统计:' AS '';
SELECT 
    role AS '角色',
    COUNT(*) AS '数量'
FROM users
GROUP BY role
ORDER BY FIELD(role, 'admin', 'top_viewer', 'leader', 'inspector');

SELECT '' AS '';
SELECT '日志统计:' AS '';
SELECT 
    prison_name AS '监狱',
    COUNT(*) AS '日志数量'
FROM daily_logs
GROUP BY prison_name;

SELECT '' AS '';
SELECT '周检察统计:' AS '';
SELECT 
    prison_name AS '监狱',
    COUNT(*) AS '记录数量'
FROM weekly_records
GROUP BY prison_name;

SELECT '' AS '';
SELECT '及时检察统计:' AS '';
SELECT 
    prison_name AS '监狱',
    event_type AS '事件类型',
    COUNT(*) AS '数量'
FROM immediate_events
GROUP BY prison_name, event_type;

SELECT '' AS '';
SELECT '========================================' AS '';
SELECT '所有用户默认密码: 123456' AS '提示';
SELECT '========================================' AS '';
