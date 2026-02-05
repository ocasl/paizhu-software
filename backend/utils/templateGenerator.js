/**
 * 基于模板的文档生成器
 * 使用 docxtemplater 填充 Word 模板
 */
const fs = require('fs')
const path = require('path')
const PizZip = require('pizzip')
const Docxtemplater = require('docxtemplater')

// 模板文件路径
const TEMPLATE_DIR = path.join(__dirname, '../muban')
const LOG_TEMPLATE = path.join(TEMPLATE_DIR, 'template_fresh.docx')
const REPORT_TEMPLATE = path.join(TEMPLATE_DIR, '派驻检察室月度工作情况报告.docx')
const CHECKLIST_TEMPLATE = path.join(TEMPLATE_DIR, '派驻检察工作报告事项清单_with_placeholders.docx')

/**
 * 使用模板生成日志文档
 * @param {Object} log - 日志数据
 * @returns {Promise<Buffer>} - 文档Buffer
 */
async function generateLogFromTemplate(log, weeklyRecords = [], monthlyRecords = []) {
    try {
        console.log('📝 开始生成Word文档...')
        console.log('日志数据:', JSON.stringify(log, null, 2))
        
        const templateContent = fs.readFileSync(LOG_TEMPLATE, 'binary')
        const zip = new PizZip(templateContent)
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            nullGetter: () => '' // 空值返回空字符串
        })

        const dateStr = log.log_date ? new Date(log.log_date).toLocaleDateString('zh-CN') : ''
        const scenes = log.three_scenes || {}
        const labor = scenes.labor || {}
        const living = scenes.living || {}
        const study = scenes.study || {}
        const strictControl = log.strict_control || {}
        const policeEquip = log.police_equipment || {}
        const gang = log.gang_prisoners || {}
        const admission = log.admission || {}
        const monitor = log.monitor_check || {}

        // 1. 现场检察位置汇总
        const locationParts = []
        if (labor.checked && labor.locations?.length) locationParts.push(`劳动现场:${labor.locations.join('、')}`)
        if (living.checked && living.locations?.length) locationParts.push(`生活现场:${living.locations.join('、')}`)
        if (study.checked && study.locations?.length) locationParts.push(`学习现场:${study.locations.join('、')}`)
        const sceneLocations = locationParts.join('\n') || '无'

        // 2. 严管/禁闭新增
        const strictNew = (strictControl.newCount || 0) + (strictControl.confinementNew || 0)

        // 3. 收押/出监汇总
        const admissionStr = `入:${admission.inCount || 0}/出:${admission.outCount || 0}`

        // 4. 当天的周检察记录
        const logDate = log.log_date
        const todayWeekly = weeklyRecords.filter(r => {
            const recordDate = r.record_date || r.week_start_date
            return recordDate === logDate
        })
        const weeklyText = todayWeekly.length > 0
            ? todayWeekly.map(r => {
                const parts = []
                if (r.hospital_check?.hospitalChecked) parts.push('医院检察')
                if (r.hospital_check?.confinementChecked) parts.push('禁闭室检察')
                if (r.talk_records?.length) parts.push(`谈话教育${r.talk_records.length}次`)
                if (r.mailbox?.openCount) parts.push(`信箱开启${r.mailbox.openCount}次`)
                return parts.join('、') || '周检察记录'
            }).join('\n')
            : ''

        // 5. 当天的月检察记录
        const todayMonthly = monthlyRecords.filter(r => {
            const recordDate = r.record_date
            return recordDate === logDate
        })
        const monthlyText = todayMonthly.length > 0
            ? todayMonthly.map(r => {
                const parts = []
                if (r.visit_check?.checked) parts.push(`会见检察${r.visit_check.visitCount || 1}次`)
                if (r.dangerous_check?.checked) parts.push('危险物品检察')
                return parts.join('、') || '月检察记录'
            }).join('\n')
            : ''

        // 准备模板数据 - 同时支持数字和文字占位符
        const templateData = {
            // 数字占位符 (1-12)
            '1': log.prison_name || '',
            '2': log.inspector_name || '',
            '3': dateStr,
            '4': log.inspector_name || '',
            '5': sceneLocations,
            '6': String(strictNew || 0),
            '7': String(policeEquip.count || 0),
            '8': admissionStr,
            '9': log.supervision_situation || '',
            '10': log.feedback_situation || '',
            '11': [
                weeklyText ? `【周检察】${weeklyText}` : '',
                monthlyText ? `【月检察】${monthlyText}` : '',
                log.other_work?.supervisionSituation || ''
            ].filter(Boolean).join('\n') || '',
            '12': log.other_work?.feedbackSituation || '',
            
            // 文字占位符（备用）
            'prison_name': log.prison_name || '',
            'inspector_name': log.inspector_name || '',
            'log_date': dateStr,
            'writer_name': log.inspector_name || '',
            'scene_locations': sceneLocations,
            'strict_new': String(strictNew || 0),
            'police_count': String(policeEquip.count || 0),
            'admission': admissionStr,
            'supervision': log.supervision_situation || '',
            'feedback': log.feedback_situation || '',
            'other_supervision': [
                weeklyText ? `【周检察】${weeklyText}` : '',
                monthlyText ? `【月检察】${monthlyText}` : '',
                log.other_work?.supervisionSituation || ''
            ].filter(Boolean).join('\n') || '',
            'other_feedback': log.other_work?.feedbackSituation || ''
        }

        console.log('模板数据:', JSON.stringify(templateData, null, 2))

        // 填充模板
        doc.render(templateData)

        const buffer = doc.getZip().generate({ type: 'nodebuffer' })
        console.log('✅ Word文档生成成功，大小:', buffer.length, 'bytes')
        
        return buffer
    } catch (error) {
        console.error('❌ 生成日志文档失败:', error)
        console.error('错误详情:', error.message)
        if (error.properties) {
            console.error('错误属性:', error.properties)
        }
        throw error
    }
}

/**
 * 使用模板生成月度报告（使用数字占位符 {1}-{59}）
 * @param {Object} data - 报告数据
 * @returns {Promise<Buffer>} - 文档Buffer
 */
async function generateReportFromTemplate(data) {
    try {
        const { archive, dailyLogs, weeklyRecords, monthlyRecords, immediateEvents, attachments, basicInfo } = data

        // 读取模板
        const templateContent = fs.readFileSync(REPORT_TEMPLATE, 'binary')
        const zip = new PizZip(templateContent)

        // 计算统计数据
        const stats = calculateStats(dailyLogs, weeklyRecords, monthlyRecords)

        // 获取犯情动态数据（作为备用数据源）
        const { CriminalReport } = require('../models')
        const reportMonth = `${archive.year}-${String(archive.month).padStart(2, '0')}`
        const criminalData = await CriminalReport.findOne({
            where: {
                prison_name: archive.prison_name,
                report_month: reportMonth
            }
        })

        // 数据优先级：basicInfo（手动编辑） > criminalData（犯情动态） > 0（默认值）
        const getFieldValue = (basicInfoField, criminalDataField, defaultValue = 0) => {
            if (basicInfo && basicInfo[basicInfoField] !== null && basicInfo[basicInfoField] !== undefined) {
                return basicInfo[basicInfoField]
            }
            if (criminalData && criminalData[criminalDataField] !== null && criminalData[criminalDataField] !== undefined) {
                return criminalData[criminalDataField]
            }
            return defaultValue
        }

        // 准备59个占位符的值（按模板顺序）
        const values = {
            // 标题 (1-3)
            1: archive.prison_name || '监狱',
            2: archive.year,
            3: archive.month,

            // 一、(一) 罪犯构成情况 (4-21) - 使用 basicInfo 优先
            4: getFieldValue('total_prisoners', 'total_prisoners'),
            5: getFieldValue('major_criminals', 'major_criminal'),
            6: getFieldValue('death_sentence', 'death_suspended'),
            7: getFieldValue('life_sentence', 'life_sentence'),
            8: getFieldValue('repeat_offenders', 'multiple_convictions'),
            9: getFieldValue('foreign_prisoners', 'foreign_prisoners'),
            10: getFieldValue('hk_macao_taiwan', 'hk_macao_taiwan'),
            11: getFieldValue('mental_illness', 'mental_illness'),
            12: getFieldValue('former_officials', 'former_provincial'),
            13: getFieldValue('former_county_level', 'former_county'),
            14: getFieldValue('falun_gong', 'falun_gong'),
            15: getFieldValue('drug_history', 'drug_history'),
            16: getFieldValue('drug_crimes', 'drug_related'),
            17: getFieldValue('new_admissions', 'newly_admitted'),
            18: getFieldValue('minor_females', 'juvenile_female'),
            19: getFieldValue('gang_related', 'gang_related'),
            20: getFieldValue('evil_forces', 'evil_related'),
            21: getFieldValue('endangering_safety', 'dangerous_security'),

            // 一、(二) 新收押/刑满释放 (22-23)
            22: getFieldValue('new_admissions', 'newly_admitted'),
            23: getFieldValue('released_count', null),

            // 一、(三) 记过/禁闭 (24-27)
            24: getFieldValue('recorded_punishments', 'violation_count'),
            25: basicInfo?.recorded_punishments_reason || '无',
            26: getFieldValue('confinement_punishments', 'confinement_count'),
            27: basicInfo?.confinement_reason || '无',

            // 二 减刑相关 (28-31) - 🔥 从 basicInfo 读取
            28: archive.prison_name || '监狱',
            29: basicInfo?.parole_batch || '',
            30: basicInfo?.parole_count || 0,
            31: basicInfo?.parole_stage || '',

            // 二、(二) 收押释放检察 (32-33)
            32: getFieldValue('new_admissions', 'newly_admitted'),
            33: getFieldValue('released_count', null),

            // 二、(三) 监管执法检察 (34-41) - 🔥 从 basicInfo 读取
            34: archive.prison_name || '监狱',
            35: basicInfo?.parole_batch || '',
            36: basicInfo?.correction_issues || '无',
            37: basicInfo?.correction_notices || 0,
            38: basicInfo?.three_scene_checks || 0,
            39: basicInfo?.key_location_checks || 0,
            40: basicInfo?.visit_checks || 0,
            41: basicInfo?.visit_illegal_count || 0,

            // 三、安全防范检察 (42-43) - 🔥 从 basicInfo 读取
            42: basicInfo?.monitor_checks || 0,
            43: basicInfo?.issues_found || 0,

            // 四、谈话情况 (44-49) - 🔥 从 basicInfo 读取
            44: basicInfo?.total_talks || 0,
            45: basicInfo?.new_admission_talks || 0,
            46: basicInfo?.evil_forces_talks || 0,
            47: basicInfo?.injury_talks || 0,
            48: basicInfo?.confinement_talks || 0,
            49: basicInfo?.questionnaire_count || 0,

            // 五、会议活动 (50-53) - 🔥 从 basicInfo 读取
            50: basicInfo?.life_sentence_reviews || 0,
            51: basicInfo?.parole_batch || '',
            52: basicInfo?.analysis_meetings || 0,
            53: basicInfo?.other_activities || '日常',

            // 六、其他工作 (54-55) - 🔥 从 basicInfo 读取信件数量
            54: basicInfo?.mailbox_opens || 0,
            55: basicInfo?.letters_received || 0,

            // 落款 (56-59)
            56: archive.prison_name || '监狱',
            57: archive.year,
            58: archive.month,
            59: new Date().getDate()
        }

        // 读取 document.xml
        let documentXml = zip.files['word/document.xml'].asText()

        // 替换所有{数字}占位符
        for (let i = 1; i <= 59; i++) {
            const placeholder = `{${i}}`
            const value = String(values[i] || '')
            documentXml = documentXml.split(placeholder).join(value)
        }

        // 更新zip
        zip.file('word/document.xml', documentXml)

        return zip.generate({ type: 'nodebuffer' })
    } catch (error) {
        console.error('生成月度报告失败:', error)
        throw error
    }
}

/**
 * 生成事项清单（使用带占位符的模板）
 * 🔥 优先从数据库读取清单数据，如果没有则使用自动生成的数据
 * @param {Object} data - 清单数据
 * @returns {Promise<Buffer>} - 文档Buffer
 */
async function generateChecklistFromTemplate(data) {
    try {
        const { archive } = data
        
        console.log('使用带占位符的模板生成事项清单...')
        
        // 读取模板
        if (!fs.existsSync(CHECKLIST_TEMPLATE)) {
            throw new Error(`模板文件不存在: ${CHECKLIST_TEMPLATE}`)
        }
        
        const templateContent = fs.readFileSync(CHECKLIST_TEMPLATE, 'binary')
        const zip = new PizZip(templateContent)
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            nullGetter: () => '' // 空值返回空字符串
        })
        
        // 🔥 从数据库读取清单数据
        const { ReportChecklistItem } = require('../models')
        const dbChecklistItems = await ReportChecklistItem.findAll({
            where: {
                prison_name: archive.prison_name,
                year: archive.year,
                month: archive.month
            },
            order: [['item_id', 'ASC']]
        })
        
        console.log(`从数据库查询到 ${dbChecklistItems.length} 条清单数据`)
        
        // 准备模板数据
        const templateData = {
            prison_name: archive.prison_name || '女子监狱',
            year: String(archive.year),
            month: String(archive.month)
        }
        
        // 填充16个项目的数据
        for (let i = 1; i <= 16; i++) {
            const dbItem = dbChecklistItems.find(item => item.item_id === i)
            
            if (dbItem) {
                // 🔥 使用数据库中的数据
                templateData[`content${i}`] = dbItem.content || ''
                templateData[`status${i}`] = dbItem.situation || ''
                console.log(`项目${i}: 使用数据库数据`)
            } else {
                // 如果数据库没有数据，使用空字符串
                templateData[`content${i}`] = ''
                templateData[`status${i}`] = ''
                console.log(`项目${i}: 数据库无数据，使用空字符串`)
            }
        }
        
        console.log('模板数据示例:', {
            prison_name: templateData.prison_name,
            year: templateData.year,
            month: templateData.month,
            content1: templateData.content1,
            status1: templateData.status1
        })
        
        // 填充模板
        doc.render(templateData)
        
        const buffer = doc.getZip().generate({ type: 'nodebuffer' })
        
        console.log('✅ 事项清单生成成功（使用数据库数据）')
        console.log(`文件大小: ${buffer.length} bytes`)
        
        return buffer

    } catch (error) {
        console.error('生成事项清单失败:', error)
        if (error.properties) {
            console.error('错误详情:', error.properties)
        }
        throw error
    }
}

/**
 * 计算统计数据
 */
function calculateStats(dailyLogs, weeklyRecords, monthlyRecords) {
    const stats = {
        threeSceneChecks: 0,
        monitorChecks: 0,
        keyLocationChecks: 0,
        totalTalks: 0,
        newAdmissionTalks: 0,
        evilTalks: 0,
        injuryTalks: 0,
        confinementTalks: 0,
        mailboxOpens: 0,
        lettersReceived: 0,
        visitChecks: 0
    }

    // 从日检察统计
    for (const log of dailyLogs) {
        if (log.three_scenes) {
            const scenes = log.three_scenes
            if (scenes.labor?.checked) stats.threeSceneChecks++
            if (scenes.living?.checked) stats.threeSceneChecks++
            if (scenes.study?.checked) stats.threeSceneChecks++
        }
        if (log.monitor_check?.checked) {
            stats.monitorChecks += log.monitor_check.count || 1
        }
    }

    // 从周检察统计
    for (const record of weeklyRecords) {
        if (record.hospital_check) {
            if (record.hospital_check.hospitalChecked) stats.keyLocationChecks++
            if (record.hospital_check.confinementChecked) stats.keyLocationChecks++
        }
        if (record.talk_records && Array.isArray(record.talk_records)) {
            stats.totalTalks += record.talk_records.length
            // 按类型统计谈话
            for (const talk of record.talk_records) {
                if (talk.type === 'newPrisoner') stats.newAdmissionTalks++
                else if (talk.type === 'evil') stats.evilTalks++
                else if (talk.type === 'injury') stats.injuryTalks++
                else if (talk.type === 'confinement') stats.confinementTalks++
            }
        }
        if (record.mailbox) {
            stats.mailboxOpens += record.mailbox.openCount || 0
            stats.lettersReceived += record.mailbox.receivedCount || 0
        }
    }

    // 从月检察统计
    for (const record of monthlyRecords) {
        if (record.visit_check?.checked) {
            stats.visitChecks += record.visit_check.visitCount || 1
        }
    }

    return stats
}

/**
 * 使用前端传来的清单数据生成事项清单
 * @param {Object} data - 包含 archive 和 checklistData
 * @returns {Promise<Buffer>} - 文档Buffer
 */
async function generateChecklistFromFrontendData(data) {
    try {
        const { archive, checklistData } = data
        
        console.log('使用前端数据生成事项清单...')
        console.log('清单数据项数:', checklistData?.length || 0)
        
        // 读取模板
        if (!fs.existsSync(CHECKLIST_TEMPLATE)) {
            throw new Error(`模板文件不存在: ${CHECKLIST_TEMPLATE}`)
        }
        
        const templateContent = fs.readFileSync(CHECKLIST_TEMPLATE, 'binary')
        const zip = new PizZip(templateContent)
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            nullGetter: () => '' // 空值返回空字符串
        })
        
        // 准备模板数据
        const templateData = {
            prison_name: archive.prison_name || '女子监狱',
            year: String(archive.year),
            month: String(archive.month)
        }
        
        // 将前端传来的清单数据映射到模板占位符
        // checklistData 是一个数组，每项包含 { id, content, situation }
        for (let i = 1; i <= 16; i++) {
            const item = checklistData.find(d => d.id === i)
            if (item) {
                templateData[`content${i}`] = item.content || ''
                templateData[`status${i}`] = item.situation || ''
            } else {
                templateData[`content${i}`] = ''
                templateData[`status${i}`] = ''
            }
        }
        
        console.log('模板数据示例:', {
            prison_name: templateData.prison_name,
            year: templateData.year,
            month: templateData.month,
            content1: templateData.content1,
            status1: templateData.status1,
            content7: templateData.content7,
            status7: templateData.status7
        })
        
        // 填充模板
        doc.render(templateData)
        
        const buffer = doc.getZip().generate({ type: 'nodebuffer' })
        
        console.log('✅ 事项清单生成成功（使用前端数据）')
        console.log(`文件大小: ${buffer.length} bytes`)
        
        return buffer

    } catch (error) {
        console.error('生成事项清单失败:', error)
        if (error.properties) {
            console.error('错误详情:', error.properties)
        }
        throw error
    }
}

module.exports = {
    generateLogFromTemplate,
    generateReportFromTemplate,
    generateChecklistFromTemplate,
    generateChecklistFromFrontendData
}
