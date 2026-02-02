/**
 * 插入测试数据到数据库
 * 模拟上传5个Excel文件的效果
 */

require('dotenv').config()
const { 
    Blacklist, Confinement, StrictEducation, 
    RestraintUsage, MailRecord, sequelize 
} = require('../models')

const PRISON_NAME = '女子监狱'

async function insertTestData() {
    console.log('========================================')
    console.log('插入测试数据')
    console.log('========================================\n')

    try {
        // 清空旧数据
        console.log('1. 清空旧的测试数据...')
        await Blacklist.destroy({ where: { prison_name: PRISON_NAME } })
        await Confinement.destroy({ where: { prison_name: PRISON_NAME } })
        await StrictEducation.destroy({ where: { prison_name: PRISON_NAME } })
        await RestraintUsage.destroy({ where: { prison_name: PRISON_NAME } })
        await MailRecord.destroy({ where: { prison_name: PRISON_NAME } })
        console.log('   ✓ 旧数据已清空\n')

        // 1. 涉黑恶名单（5人：3涉黑，2涉恶）
        console.log('2. 插入涉黑恶名单数据...')
        await Blacklist.bulkCreate([
            {
                prisoner_id: 'BL001',
                name: '张三',
                gender: '男',
                involvement_type: '涉黑',
                crime: '组织、领导黑社会性质组织罪',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-001',
                synced_at: new Date()
            },
            {
                prisoner_id: 'BL002',
                name: '李四',
                gender: '男',
                involvement_type: '涉黑',
                crime: '参加黑社会性质组织罪',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-001',
                synced_at: new Date()
            },
            {
                prisoner_id: 'BL003',
                name: '王五',
                gender: '男',
                involvement_type: '涉黑',
                crime: '包庇、纵容黑社会性质组织罪',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-001',
                synced_at: new Date()
            },
            {
                prisoner_id: 'BL004',
                name: '赵六',
                gender: '女',
                involvement_type: '涉恶',
                crime: '寻衅滋事罪',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-001',
                synced_at: new Date()
            },
            {
                prisoner_id: 'BL005',
                name: '孙七',
                gender: '女',
                involvement_type: '涉恶',
                crime: '强迫交易罪',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-001',
                synced_at: new Date()
            }
        ])
        console.log('   ✓ 涉黑恶名单：3个涉黑，2个涉恶\n')

        // 2. 禁闭审批（3人）
        console.log('3. 插入禁闭审批数据...')
        await Confinement.bulkCreate([
            {
                prisoner_id: 'CF001',
                create_date: '2026-01-05',
                start_date: '2026-01-05',
                end_date: '2026-01-12',
                applicable_clause: '《监狱法》第58条',
                violation_fact: '殴打他人',
                status: '已审批',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-002',
                synced_at: new Date()
            },
            {
                prisoner_id: 'CF002',
                create_date: '2026-01-10',
                start_date: '2026-01-10',
                end_date: '2026-01-17',
                applicable_clause: '《监狱法》第58条',
                violation_fact: '拒不服从管理',
                status: '已审批',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-002',
                synced_at: new Date()
            },
            {
                prisoner_id: 'CF003',
                create_date: '2026-01-15',
                start_date: '2026-01-15',
                end_date: '2026-01-22',
                applicable_clause: '《监狱法》第58条',
                violation_fact: '聚众闹事',
                status: '已审批',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-002',
                synced_at: new Date()
            }
        ])
        console.log('   ✓ 禁闭审批：3人\n')

        // 3. 严管教育审批（4人）
        console.log('4. 插入严管教育审批数据...')
        await StrictEducation.bulkCreate([
            {
                prisoner_id: 'SE001',
                create_date: '2026-01-03',
                applicable_clause: '《监狱法》第59条',
                reason: '违反监规',
                days: 15,
                start_date: '2026-01-03',
                end_date: '2026-01-18',
                status: '已审批',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-003',
                synced_at: new Date()
            },
            {
                prisoner_id: 'SE002',
                create_date: '2026-01-08',
                applicable_clause: '《监狱法》第59条',
                reason: '不服从管理',
                days: 10,
                start_date: '2026-01-08',
                end_date: '2026-01-18',
                status: '已审批',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-003',
                synced_at: new Date()
            },
            {
                prisoner_id: 'SE003',
                create_date: '2026-01-12',
                applicable_clause: '《监狱法》第59条',
                reason: '扰乱秩序',
                days: 7,
                start_date: '2026-01-12',
                end_date: '2026-01-19',
                status: '已审批',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-003',
                synced_at: new Date()
            },
            {
                prisoner_id: 'SE004',
                create_date: '2026-01-20',
                applicable_clause: '《监狱法》第59条',
                reason: '打架斗殴',
                days: 20,
                start_date: '2026-01-20',
                end_date: '2026-02-09',
                status: '已审批',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-003',
                synced_at: new Date()
            }
        ])
        console.log('   ✓ 严管教育审批：4人\n')

        // 4. 戒具使用审批（2人）
        console.log('5. 插入戒具使用审批数据...')
        await RestraintUsage.bulkCreate([
            {
                prisoner_id: 'RU001',
                create_date: '2026-01-06',
                restraint_name: '手铐',
                applicable_clause: '《监狱法》第45条',
                days: 3,
                start_date: '2026-01-06',
                end_date: '2026-01-09',
                status: '已审批',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-004',
                synced_at: new Date()
            },
            {
                prisoner_id: 'RU002',
                create_date: '2026-01-18',
                restraint_name: '脚镣',
                applicable_clause: '《监狱法》第45条',
                days: 5,
                start_date: '2026-01-18',
                end_date: '2026-01-23',
                status: '已审批',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-004',
                synced_at: new Date()
            }
        ])
        console.log('   ✓ 戒具使用审批：2人\n')

        // 5. 信件汇总（8封）
        console.log('6. 插入信件汇总数据...')
        await MailRecord.bulkCreate([
            {
                sequence_no: 1,
                open_date: '2026-01-05',
                prison_area: '一监区',
                prisoner_name: '张某某',
                reason: '家庭问题咨询',
                category: '一般信件',
                remarks: '',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-005',
                synced_at: new Date()
            },
            {
                sequence_no: 2,
                open_date: '2026-01-08',
                prison_area: '二监区',
                prisoner_name: '李某某',
                reason: '申诉',
                category: '申诉信件',
                remarks: '已转相关部门',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-005',
                synced_at: new Date()
            },
            {
                sequence_no: 3,
                open_date: '2026-01-10',
                prison_area: '三监区',
                prisoner_name: '王某某',
                reason: '投诉',
                category: '投诉信件',
                remarks: '已调查处理',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-005',
                synced_at: new Date()
            },
            {
                sequence_no: 4,
                open_date: '2026-01-12',
                prison_area: '一监区',
                prisoner_name: '赵某某',
                reason: '生活问题',
                category: '一般信件',
                remarks: '',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-005',
                synced_at: new Date()
            },
            {
                sequence_no: 5,
                open_date: '2026-01-15',
                prison_area: '二监区',
                prisoner_name: '孙某某',
                reason: '医疗问题',
                category: '一般信件',
                remarks: '',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-005',
                synced_at: new Date()
            },
            {
                sequence_no: 6,
                open_date: '2026-01-18',
                prison_area: '三监区',
                prisoner_name: '周某某',
                reason: '减刑咨询',
                category: '一般信件',
                remarks: '',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-005',
                synced_at: new Date()
            },
            {
                sequence_no: 7,
                open_date: '2026-01-22',
                prison_area: '一监区',
                prisoner_name: '吴某某',
                reason: '申诉',
                category: '申诉信件',
                remarks: '已转相关部门',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-005',
                synced_at: new Date()
            },
            {
                sequence_no: 8,
                open_date: '2026-01-25',
                prison_area: '二监区',
                prisoner_name: '郑某某',
                reason: '家属会见问题',
                category: '一般信件',
                remarks: '',
                prison_name: PRISON_NAME,
                sync_batch: 'test-batch-005',
                synced_at: new Date()
            }
        ])
        console.log('   ✓ 信件汇总：8封\n')

        console.log('========================================')
        console.log('测试数据插入完成！')
        console.log('========================================\n')
        console.log('数据汇总：')
        console.log('  - 涉黑罪犯：3人')
        console.log('  - 涉恶罪犯：2人')
        console.log('  - 禁闭处分：3人')
        console.log('  - 严管教育：4人')
        console.log('  - 戒具使用：2人')
        console.log('  - 信件数量：8封\n')
        console.log('现在可以：')
        console.log('1. 启动后端服务：npm start')
        console.log('2. 启动前端服务：cd ../front && npm run dev')
        console.log('3. 登录后进入"报告预览"页面')
        console.log('4. 选择"2026年01月"查看统计数据\n')

    } catch (error) {
        console.error('插入测试数据失败:', error)
    } finally {
        await sequelize.close()
    }
}

// 运行
insertTestData()
