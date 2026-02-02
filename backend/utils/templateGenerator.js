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
        const { archive, dailyLogs, weeklyRecords, monthlyRecords, immediateEvents, attachments } = data

        // 读取模板
        const templateContent = fs.readFileSync(REPORT_TEMPLATE, 'binary')
        const zip = new PizZip(templateContent)

        // 计算统计数据
        const stats = calculateStats(dailyLogs, weeklyRecords, monthlyRecords)

        // 获取犯情动态数据
        const { CriminalReport } = require('../models')
        const reportMonth = `${archive.year}-${String(archive.month).padStart(2, '0')}`
        const criminalData = await CriminalReport.findOne({
            where: {
                prison_name: archive.prison_name,
                report_month: reportMonth
            }
        })

        // 准备59个占位符的值（按模板顺序）
        const values = {
            // 标题 (1-3)
            1: archive.prison_name || '监狱',
            2: archive.year,
            3: archive.month,

            // 一、(一) 罪犯构成情况 (4-21)
            4: criminalData?.total_prisoners || 0,
            5: criminalData?.major_criminal || 0,
            6: criminalData?.death_suspended || 0,
            7: criminalData?.life_sentence || 0,
            8: criminalData?.multiple_convictions || 0,
            9: criminalData?.foreign_prisoners || 0,
            10: criminalData?.hk_macao_taiwan || 0,
            11: criminalData?.mental_illness || 0,
            12: criminalData?.former_provincial || 0,
            13: criminalData?.former_county || 0,
            14: criminalData?.falun_gong || 0,
            15: criminalData?.drug_history || 0,
            16: criminalData?.drug_related || 0,
            17: criminalData?.newly_admitted || 0,
            18: criminalData?.juvenile_female || 0,
            19: criminalData?.gang_related || 0,
            20: criminalData?.evil_related || 0,
            21: criminalData?.dangerous_security || 0,

            // 一、(二) 新收押/刑满释放 (22-23)
            22: criminalData?.newly_admitted || 0,
            23: 0, // 刑满释放（暂无数据源）

            // 一、(三) 记过/禁闭 (24-27)
            24: criminalData?.violation_count || 0,
            25: '无', // 记过原因（暂无数据源）
            26: criminalData?.confinement_count || 0,
            27: '无', // 禁闭原因（暂无数据源）

            // 二 减刑相关 (28-31)
            28: archive.prison_name || '监狱',
            29: 0, // 减刑批次（暂无数据源）
            30: 0, // 减刑案件数（暂无数据源）
            31: 0, // 减刑阶段（暂无数据源）

            // 二、(二) 收押释放检察 (32-33)
            32: criminalData?.newly_admitted || 0,
            33: 0, // 刑满释放

            // 二、(三) 监管执法检察 (34-41)
            34: archive.prison_name || '监狱',
            35: 0, // 减刑批次
            36: '无', // 违法问题描述
            37: 0, // 纠正违法通知书数量
            38: stats.threeSceneChecks || 0,
            39: stats.keyLocationChecks || 0,
            40: stats.visitChecks || 0,
            41: 0, // 发现违法问题数量

            // 三、安全防范检察 (42-43)
            42: stats.monitorChecks || 0,
            43: 0, // 发现问题数量

            // 四、谈话情况 (44-49)
            44: stats.totalTalks || 0,
            45: stats.newAdmissionTalks || 0,
            46: stats.evilTalks || 0,
            47: stats.injuryTalks || 0,
            48: stats.confinementTalks || 0,
            49: 0, // 问卷数量（暂无数据源）

            // 五、会议活动 (50-53)
            50: 0, // 评审会次数
            51: 0, // 减刑批次
            52: 0, // 犯情分析会次数
            53: '日常', // 其他活动

            // 六、其他工作 (54-55)
            54: stats.mailboxOpens || 0,
            55: stats.lettersReceived || 0,

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
 * @param {Object} data - 清单数据
 * @returns {Promise<Buffer>} - 文档Buffer
 */
async function generateChecklistFromTemplate(data) {
    try {
        const { archive, dailyLogs, weeklyRecords, monthlyRecords, immediateEvents } = data
        
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
        
        // 生成16项检察情况
        const statusTexts = []
        const contentTexts = []
        
        // 1. 及时检察事件 - 脱逃、自伤自残、自杀死亡、重大疫情、重大生产安全事故
        const event1 = immediateEvents.filter(e => {
            const t = e.event_type || ''
            return t.includes('脱逃') || t.includes('自伤') || t.includes('自杀') || t.includes('疫情') || t.includes('安全事故')
        })
        statusTexts[0] = event1.length > 0 ? `已检察 ${event1.length} 次` : '本月无此类事件'
        contentTexts[0] = event1.length > 0 ? event1.map(e => e.title || '').join('；') : '本月无此类事件'
        
        // 2. 罪犯死亡
        const event2 = immediateEvents.filter(e => (e.event_type || '').includes('死亡'))
        statusTexts[1] = event2.length > 0 ? `已检察 ${event2.length} 次` : '本月无此类事件'
        contentTexts[1] = event2.length > 0 ? event2.map(e => e.title || '').join('；') : '本月无此类事件'
        
        // 3. 重大监管改造业务活动
        const event3 = immediateEvents.filter(e => (e.event_type || '').includes('重大活动'))
        statusTexts[2] = event3.length > 0 ? `已检察 ${event3.length} 次` : '本月无此类事件'
        contentTexts[2] = event3.length > 0 ? event3.map(e => e.title || '').join('；') : '本月无此类事件'
        
        // 4. 民警处罚
        const event4 = immediateEvents.filter(e => (e.event_type || '').includes('处罚'))
        statusTexts[3] = event4.length > 0 ? `已检察 ${event4.length} 次` : '本月无此类事件'
        contentTexts[3] = event4.length > 0 ? event4.map(e => e.title || '').join('；') : '本月无此类事件'
        
        // 5. 新任职领导
        const event5 = immediateEvents.filter(e => (e.event_type || '').includes('领导'))
        statusTexts[4] = event5.length > 0 ? `已检察 ${event5.length} 次` : '本月无此类事件'
        contentTexts[4] = event5.length > 0 ? event5.map(e => e.title || '').join('；') : '本月无此类事件'
        
        // 6. 减刑假释
        const event6 = immediateEvents.filter(e => {
            const t = e.event_type || ''
            return t.includes('减刑') || t.includes('假释') || t.includes('监外执行')
        })
        statusTexts[5] = event6.length > 0 ? `已检察 ${event6.length} 次` : '本月无此类事件'
        contentTexts[5] = event6.length > 0 ? event6.map(e => e.title || '').join('；') : '本月无此类事件'
        
        // 7. 监控抽查（每日）
        const monitorChecks = dailyLogs.filter(log => log.monitor_check?.checked)
        statusTexts[6] = monitorChecks.length > 0 ? `已检察 ${monitorChecks.length} 次` : '未检察'
        contentTexts[6] = monitorChecks.length > 0 
            ? `本月共抽查监控 ${monitorChecks.reduce((sum, log) => sum + (log.monitor_check?.count || 1), 0)} 次`
            : '本月未进行监控抽查'
        
        // 8. 医院禁闭室（每周）
        const hospitalChecks = weeklyRecords.filter(r => r.hospital_check?.checked)
        statusTexts[7] = hospitalChecks.length > 0 ? `已检察 ${hospitalChecks.length} 次` : '未检察'
        contentTexts[7] = hospitalChecks.length > 0
            ? `检察医院禁闭室 ${hospitalChecks.length} 次，重点查看警械使用、严管禁闭适用情况`
            : '本月未进行医院禁闭室检察'
        
        // 9. 外伤检察（每周）
        const injuryTalks = weeklyRecords.filter(r => 
            r.talk_records?.some(t => t.type === 'injury')
        )
        const injuryCount = injuryTalks.reduce((sum, r) => 
            sum + (r.talk_records?.filter(t => t.type === 'injury').length || 0), 0
        )
        statusTexts[8] = injuryCount > 0 ? `发现外伤 ${injuryCount} 人次` : '未发现外伤'
        contentTexts[8] = injuryCount > 0 ? `本月发现外伤 ${injuryCount} 人次，已核实并上传谈话笔录` : '本月未发现外伤'
        
        // 10. 谈话情况（每周）
        const allTalks = weeklyRecords.flatMap(r => r.talk_records || [])
        const talkCount = allTalks.length
        const newPrisonerTalks = allTalks.filter(t => t.type === 'newPrisoner').length
        const releaseTalks = allTalks.filter(t => t.type === 'release').length
        statusTexts[9] = talkCount > 0 ? `已谈话 ${talkCount} 人次` : '未谈话'
        contentTexts[9] = talkCount > 0 
            ? `本月谈话 ${talkCount} 人次，其中新入监 ${newPrisonerTalks} 人，刑释前 ${releaseTalks} 人`
            : '本月未进行谈话'
        
        // 11. 信箱（每周）
        const mailboxOpens = weeklyRecords.reduce((sum, r) => 
            sum + (r.mailbox?.openCount || 0), 0
        )
        const lettersReceived = weeklyRecords.reduce((sum, r) => 
            sum + (r.mailbox?.receivedCount || 0), 0
        )
        statusTexts[10] = mailboxOpens > 0 ? `开启 ${mailboxOpens} 次，收到信件 ${lettersReceived} 封` : '未开启'
        contentTexts[10] = mailboxOpens > 0 
            ? `本月开启检察官信箱 ${mailboxOpens} 次，收到信件 ${lettersReceived} 封`
            : '本月未开启检察官信箱'
        
        // 12. 违禁品（每周）
        const contrabandChecks = weeklyRecords.filter(r => r.contraband?.checked)
        const contrabandFound = weeklyRecords.filter(r => r.contraband?.found)
        statusTexts[11] = contrabandFound.length > 0 
            ? `发现违禁品 ${contrabandFound.reduce((sum, r) => sum + (r.contraband?.foundCount || 0), 0)} 次`
            : '未发现违禁品'
        contentTexts[11] = contrabandChecks.length > 0
            ? `本月排查 ${contrabandChecks.length} 次${contrabandFound.length > 0 ? `，发现违禁品 ${contrabandFound.reduce((sum, r) => sum + (r.contraband?.foundCount || 0), 0)} 次` : '，未发现违禁品'}`
            : '本月未进行违禁品排查'
        
        // 13. 会见场所（每月）
        const visitChecks = monthlyRecords.filter(r => r.visit_check?.checked)
        const visitCount = monthlyRecords.reduce((sum, r) => 
            sum + (r.visit_check?.visitCount || 0), 0
        )
        statusTexts[12] = visitChecks.length > 0 ? `已检察 ${visitCount} 次` : '未检察'
        contentTexts[12] = visitChecks.length > 0 
            ? `本月检察会见场所 ${visitCount} 次`
            : '本月未进行会见场所检察'
        
        // 14. 犯情分析会（每月）
        const meetingRecords = monthlyRecords.filter(r => r.meeting?.participated)
        const meetingCount = meetingRecords.reduce((sum, r) => sum + (r.meeting?.count || 1), 0)
        statusTexts[13] = meetingCount > 0 ? `已参加 ${meetingCount} 次` : '未参加'
        contentTexts[13] = meetingCount > 0 
            ? `本月参加犯情分析会 ${meetingCount} 次`
            : '本月未参加犯情分析会'
        
        // 15. 记过处分（每月）
        const punishmentRecords = monthlyRecords.filter(r => r.punishment?.exists)
        const recordCount = punishmentRecords.reduce((sum, r) => sum + (r.punishment?.recordCount || 0), 0)
        const confinementCount = punishmentRecords.reduce((sum, r) => sum + (r.punishment?.confinementCount || 0), 0)
        statusTexts[14] = (recordCount > 0 || confinementCount > 0)
            ? `记过 ${recordCount} 人，禁闭 ${confinementCount} 人`
            : '本月无记过处分'
        contentTexts[14] = (recordCount > 0 || confinementCount > 0)
            ? `本月记过 ${recordCount} 人，禁闭 ${confinementCount} 人`
            : '本月无记过处分'
        
        // 16. 勤杂岗位（每月）
        const positionRecords = monthlyRecords.filter(r => r.position_stats)
        if (positionRecords.length > 0) {
            const latest = positionRecords[positionRecords.length - 1]
            const stats = latest.position_stats
            const totalIncrease = (stats?.miscellaneousIncrease || 0) + (stats?.productionIncrease || 0)
            const totalDecrease = (stats?.miscellaneousDecrease || 0) + (stats?.productionDecrease || 0)
            statusTexts[15] = (totalIncrease > 0 || totalDecrease > 0)
                ? `增加 ${totalIncrease} 人，减少 ${totalDecrease} 人`
                : '无异常变动'
            contentTexts[15] = (totalIncrease > 0 || totalDecrease > 0)
                ? `本月勤杂岗位和辅助生产岗位增加 ${totalIncrease} 人，减少 ${totalDecrease} 人`
                : '本月勤杂岗位和辅助生产岗位无异常变动'
        } else {
            statusTexts[15] = '无异常变动'
            contentTexts[15] = '本月勤杂岗位和辅助生产岗位无异常变动'
        }
        
        // 准备模板数据
        const templateData = {
            prison_name: archive.prison_name || '女子监狱',
            year: String(archive.year),
            month: String(archive.month),
            
            // 16项检察情况
            status1: statusTexts[0],
            status2: statusTexts[1],
            status3: statusTexts[2],
            status4: statusTexts[3],
            status5: statusTexts[4],
            status6: statusTexts[5],
            status7: statusTexts[6],
            status8: statusTexts[7],
            status9: statusTexts[8],
            status10: statusTexts[9],
            status11: statusTexts[10],
            status12: statusTexts[11],
            status13: statusTexts[12],
            status14: statusTexts[13],
            status15: statusTexts[14],
            status16: statusTexts[15],
            
            // 16项报告内容
            content1: contentTexts[0],
            content2: contentTexts[1],
            content3: contentTexts[2],
            content4: contentTexts[3],
            content5: contentTexts[4],
            content6: contentTexts[5],
            content7: contentTexts[6],
            content8: contentTexts[7],
            content9: contentTexts[8],
            content10: contentTexts[9],
            content11: contentTexts[10],
            content12: contentTexts[11],
            content13: contentTexts[12],
            content14: contentTexts[13],
            content15: contentTexts[14],
            content16: contentTexts[15]
        }
        
        console.log('模板数据:', {
            prison_name: templateData.prison_name,
            year: templateData.year,
            month: templateData.month,
            status1: templateData.status1,
            content1: templateData.content1,
            content7: templateData.content7,
            content8: templateData.content8,
            content10: templateData.content10
        })
        
        // 填充模板
        doc.render(templateData)
        
        const buffer = doc.getZip().generate({ type: 'nodebuffer' })
        
        console.log('✅ 事项清单生成成功（使用带占位符的模板）')
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
