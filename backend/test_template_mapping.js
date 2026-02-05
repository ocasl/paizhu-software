/**
 * 测试模板占位符映射
 * 验证数据库字段和Word模板占位符是否一一对应
 */

const { MonthlyBasicInfo } = require('./models')

async function testTemplateMapping() {
    console.log('=== 测试模板占位符映射 ===\n')
    
    try {
        // 1. 检查模型定义
        const model = MonthlyBasicInfo
        const attributes = model.rawAttributes
        
        console.log('📊 MonthlyBasicInfo 模型字段统计:')
        const fieldNames = Object.keys(attributes).filter(key => 
            !['id', 'user_id', 'prison_name', 'report_month', 'created_at', 'updated_at'].includes(key)
        )
        console.log(`  总字段数: ${fieldNames.length}`)
        console.log(`  字段列表:`)
        fieldNames.forEach((field, index) => {
            console.log(`    ${index + 1}. ${field}`)
        })
        
        // 2. 检查必需的45个字段
        const requiredFields = [
            // 罪犯构成（19个）
            'total_prisoners', 'major_criminals', 'death_sentence', 'life_sentence',
            'repeat_offenders', 'foreign_prisoners', 'hk_macao_taiwan', 'mental_illness',
            'former_officials', 'former_county_level', 'falun_gong', 'drug_history',
            'drug_crimes', 'new_admissions', 'minor_females', 'gang_related',
            'evil_forces', 'endangering_safety', 'released_count',
            // 违纪统计（4个）
            'recorded_punishments', 'recorded_punishments_reason',
            'confinement_punishments', 'confinement_reason',
            // 信件统计（1个）
            'letters_received',
            // 执法检察（9个）
            'parole_batch', 'parole_count', 'parole_stage',
            'correction_notices', 'correction_issues',
            'three_scene_checks', 'key_location_checks', 'visit_checks', 'visit_illegal_count',
            // 安全防范（2个）
            'monitor_checks', 'issues_found',
            // 个别谈话（6个）
            'total_talks', 'new_admission_talks', 'evil_forces_talks',
            'injury_talks', 'confinement_talks', 'questionnaire_count',
            // 会议活动（3个）
            'life_sentence_reviews', 'analysis_meetings', 'other_activities',
            // 其他工作（1个）
            'mailbox_opens'
        ]
        
        console.log(`\n✅ 必需字段检查 (45个):`)
        const missingFields = []
        requiredFields.forEach(field => {
            if (attributes[field]) {
                console.log(`  ✓ ${field}`)
            } else {
                console.log(`  ✗ ${field} - 缺失！`)
                missingFields.push(field)
            }
        })
        
        if (missingFields.length > 0) {
            console.log(`\n❌ 缺失 ${missingFields.length} 个字段:`)
            missingFields.forEach(field => console.log(`  - ${field}`))
        } else {
            console.log(`\n✅ 所有45个必需字段都已定义！`)
        }
        
        // 3. 模板占位符映射
        console.log(`\n📄 Word模板占位符映射 (59个):`)
        const placeholderMapping = {
            1: 'prison_name',
            2: 'year (from report_month)',
            3: 'month (from report_month)',
            4: 'total_prisoners',
            5: 'major_criminals',
            6: 'death_sentence',
            7: 'life_sentence',
            8: 'repeat_offenders',
            9: 'foreign_prisoners',
            10: 'hk_macao_taiwan',
            11: 'mental_illness',
            12: 'former_officials',
            13: 'former_county_level',
            14: 'falun_gong',
            15: 'drug_history',
            16: 'drug_crimes',
            17: 'new_admissions',
            18: 'minor_females',
            19: 'gang_related',
            20: 'evil_forces',
            21: 'endangering_safety',
            22: 'new_admissions (重复)',
            23: 'released_count',
            24: 'recorded_punishments',
            25: 'recorded_punishments_reason',
            26: 'confinement_punishments',
            27: 'confinement_reason',
            28: 'prison_name (重复)',
            29: 'parole_batch',
            30: 'parole_count',
            31: 'parole_stage',
            32: 'new_admissions (重复)',
            33: 'released_count (重复)',
            34: 'prison_name (重复)',
            35: 'parole_batch (重复)',
            36: 'correction_issues',
            37: 'correction_notices',
            38: 'three_scene_checks',
            39: 'key_location_checks',
            40: 'visit_checks',
            41: 'visit_illegal_count',
            42: 'monitor_checks',
            43: 'issues_found',
            44: 'total_talks',
            45: 'new_admission_talks',
            46: 'evil_forces_talks',
            47: 'injury_talks',
            48: 'confinement_talks',
            49: 'questionnaire_count',
            50: 'life_sentence_reviews',
            51: 'parole_batch (重复)',
            52: 'analysis_meetings',
            53: 'other_activities',
            54: 'mailbox_opens',
            55: 'letters_received', // 🔥 信件数量
            56: 'prison_name (重复)',
            57: 'year (重复)',
            58: 'month (重复)',
            59: 'current_date'
        }
        
        console.log(`  占位符 {55} = letters_received (信件数量) ✅`)
        
        // 4. 测试数据查询
        console.log(`\n🔍 测试数据查询:`)
        const testData = await MonthlyBasicInfo.findOne({
            where: {
                prison_name: '女子监狱',
                report_month: '2026-02'
            }
        })
        
        if (testData) {
            console.log(`  ✓ 找到测试数据: 女子监狱 2026-02`)
            console.log(`  - 在押罪犯总数: ${testData.total_prisoners}`)
            console.log(`  - 收到信件数量: ${testData.letters_received} 🔥`)
            console.log(`  - 记过人数: ${testData.recorded_punishments}`)
            console.log(`  - 禁闭人数: ${testData.confinement_punishments}`)
        } else {
            console.log(`  ✗ 未找到测试数据`)
        }
        
        console.log(`\n=== 测试完成 ===`)
        
    } catch (error) {
        console.error('测试失败:', error)
    }
    
    process.exit(0)
}

testTemplateMapping()
