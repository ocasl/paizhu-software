/**
 * 归档压缩工具
 * 实现一键压缩归档功能，打包月度工作材料
 */
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { generateMonthlyReport } from './wordExport'
import { Packer, Document, Paragraph, TextRun, AlignmentType } from 'docx'

/**
 * 创建月度工作包压缩文件
 * @param {Object} reportData - 报告数据快照
 * @param {Array} attachments - 附件列表 [{ name, category, blob }]
 */
export async function createMonthlyArchive(reportData, attachments = []) {
    const { year, month, prisonInfo } = reportData
    const zip = new JSZip()

    // 1. 添加月度工作情况报告
    const reportDoc = await generateReportDocBlob(reportData)
    zip.file('月度工作情况报告.docx', reportDoc)

    // 2. 添加派驻检察工作报告事项清单
    const checklistDoc = await generateChecklistDocBlob(reportData)
    zip.file('派驻检察工作报告事项清单.docx', checklistDoc)

    // 3. 创建检察日志文件夹
    const logsFolder = zip.folder('检察日志')
    if (reportData.dailyLogs && reportData.dailyLogs.length > 0) {
        const logsContent = generateLogsContent(reportData.dailyLogs)
        logsFolder.file('日检察记录汇总.txt', logsContent)
    }

    // 4. 创建附件材料文件夹
    const attachFolder = zip.folder('附件材料')

    // 按类别创建子文件夹
    const categories = {
        roster: '人员花名册',
        transcript: '谈话笔录',
        questionnaire: '调查问卷',
        report: '情况报告',
        parole: '减刑假释',
        other: '其他材料'
    }

    for (const [key, name] of Object.entries(categories)) {
        const categoryAttachments = attachments.filter(a => a.category === key)
        if (categoryAttachments.length > 0) {
            const subFolder = attachFolder.folder(name)
            for (const attachment of categoryAttachments) {
                subFolder.file(attachment.name, attachment.blob)
            }
        }
    }

    // 5. 添加归档说明
    const readmeContent = generateArchiveReadme(reportData)
    zip.file('归档说明.txt', readmeContent)

    // 生成压缩包
    const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
    })

    const archiveName = `${prisonInfo.prisonName || ''}检察室${year}年${month}月工作包.zip`
    saveAs(content, archiveName)

    return archiveName
}

/**
 * 生成报告文档 Blob（内部使用）
 */
async function generateReportDocBlob(reportData) {
    const { year, month, prisonInfo, basicInfo, lawEnforcement, security, interviews, meetings, otherWork } = reportData

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: '派驻女子监狱检察室月度工作情况报告',
                            bold: true,
                            size: 44,
                            font: '方正小标宋简体'
                        })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: `${year}年${month}月`, size: 32, font: '仿宋' })
                    ]
                }),
                new Paragraph({ children: [] }),

                // 一、本月基本情况
                new Paragraph({
                    children: [
                        new TextRun({ text: '一、本月基本情况', bold: true, size: 32, font: '黑体' })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `1.监狱在押罪犯${basicInfo.totalPrisoners}人，其中重大刑事犯${basicInfo.majorCriminals}名，死缓犯${basicInfo.deathSentence}名，无期犯${basicInfo.lifeSentence}名，二次以上判刑罪犯${basicInfo.repeatOffenders}名，外籍犯${basicInfo.foreignPrisoners}名（含港澳台${basicInfo.hkMacaoTaiwan}名），判决书认定的精神病犯${basicInfo.mentalIllness}名，原地厅以上罪犯${basicInfo.formerOfficials}名，原县团级以上罪犯${basicInfo.formerCountyLevel}名，"法轮功"${basicInfo.falunGong}名，有吸毒史罪犯${basicInfo.drugHistory}名，涉毒犯${basicInfo.drugCrimes}名，新收押罪犯${basicInfo.newAdmissions}名，未成年女犯${basicInfo.minorFemales}名，涉黑罪犯${basicInfo.gangRelated}名，涉恶罪犯${basicInfo.evilForces}名，危安罪犯${basicInfo.endangeringSafety}名。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `2.新收押罪犯${basicInfo.newAdmissions}人，刑满释放出监罪犯${basicInfo.releasedCount}人。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `3.记过${basicInfo.recordedPunishments}人，系${basicInfo.recordedPunishmentsReason || '***'}；禁闭${basicInfo.confinementPunishments}人，系${basicInfo.confinementReason || '***'}。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),

                // 二、执法检察情况
                new Paragraph({
                    children: [
                        new TextRun({ text: '二、执法检察情况', bold: true, size: 32, font: '黑体' })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: '（一）减、假、暂检察', bold: true, font: '楷体', size: 32 })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `办理${prisonInfo.prisonName || '***'}监狱第${lawEnforcement.paroleBatch || '***'}批次减刑审查案件${lawEnforcement.paroleCount || '***'}件，已完成第${lawEnforcement.paroleStage || '***'}阶段。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: '（二）收押释放检察', bold: true, font: '楷体', size: 32 })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `新收押罪犯${basicInfo.newAdmissions}人，刑满释放出监罪犯${basicInfo.releasedCount}人，经检察，未发现违法问题。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: '（三）监管执法检察', bold: true, font: '楷体', size: 32 })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `1.在办理${prisonInfo.prisonName || '***'}监狱第${lawEnforcement.paroleBatch || '***'}批次减刑假释案件中发现：${lawEnforcement.correctionIssues || '***'}，制发纠正违法通知书${lawEnforcement.correctionNotices}份。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `2.对罪犯生活、劳动、学习三大现场进行检察${lawEnforcement.threeSceneChecks}次，对医务室、严管、禁闭室、伙房等重点场所检察${lawEnforcement.keyLocationChecks}次，会见检察${lawEnforcement.visitChecks}次，${lawEnforcement.visitIllegalCount > 0 ? `发现违法问题${lawEnforcement.visitIllegalCount}个` : '未发现违法问题'}。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),

                // 三、安全防范检察
                new Paragraph({
                    children: [
                        new TextRun({ text: '三、安全防范检察', bold: true, size: 32, font: '黑体' })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `开展监控检察${security.monitorChecks}次，通过视频检察${security.issuesFound > 0 ? `发现问题${security.issuesFound}个` : '未发现问题'}。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),

                // 四、开展个别罪犯谈话情况
                new Paragraph({
                    children: [
                        new TextRun({ text: '四、开展个别罪犯谈话情况', bold: true, size: 32, font: '黑体' })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `开展罪犯个别教育谈话${interviews.totalTalks}人，其中新收押罪犯谈话${interviews.newAdmissionTalks}人，涉恶罪犯谈话${interviews.evilForcesTalks}人，外伤罪犯谈话${interviews.injuryTalks}人，禁闭罪犯谈话${interviews.confinementTalks}人。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `发放出监问卷调查表${interviews.questionnaireCount}份。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),

                // 五、参加监狱各类会议、活动
                new Paragraph({
                    children: [
                        new TextRun({ text: '五、参加监狱各类会议、活动', bold: true, size: 32, font: '黑体' })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `1.参加无期死缓、提级减刑案件罪犯评审会${meetings.lifeSentenceReviews}次。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `2.参加第${lawEnforcement.paroleBatch || '***'}批次减刑假释案件评审会。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `3.参加监狱犯情分析会${meetings.analysisMeetings}次。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `4.参加监狱开展的${meetings.otherActivities || '***'}活动。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),

                // 六、其他工作情况
                new Paragraph({
                    children: [
                        new TextRun({ text: '六、其他工作情况', bold: true, size: 32, font: '黑体' })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `开启检察官信箱${otherWork.mailboxOpens}次，收到信件${otherWork.lettersReceived}封。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),

                // 落款
                new Paragraph({ children: [] }),
                new Paragraph({ children: [] }),
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new TextRun({
                            text: `驻${prisonInfo.prisonName || '***'}监狱检察室`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new TextRun({
                            text: `${year}年${month}月${new Date().getDate()}日`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                })
            ]
        }]
    })

    return await Packer.toBlob(doc)
}

/**
 * 生成事项清单文档 Blob
 */
async function generateChecklistDocBlob(reportData) {
    const { year, month, dailyLogs, weeklyRecords, monthlyRecords, immediateEvents } = reportData

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: '派驻检察工作报告事项清单',
                            bold: true,
                            size: 44,
                            font: '方正小标宋简体'
                        })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: `${year}年${month}月`, size: 32, font: '仿宋' })
                    ]
                }),
                new Paragraph({ children: [] }),

                // 日检察记录
                new Paragraph({
                    children: [
                        new TextRun({ text: '一、日检察记录', bold: true, size: 32, font: '黑体' })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `本月共记录日检察 ${dailyLogs?.length || 0} 条。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),

                // 周检察记录
                new Paragraph({
                    children: [
                        new TextRun({ text: '二、周检察记录', bold: true, size: 32, font: '黑体' })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `本月共记录周检察 ${weeklyRecords?.length || 0} 条。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),

                // 月检察记录
                new Paragraph({
                    children: [
                        new TextRun({ text: '三、月检察记录', bold: true, size: 32, font: '黑体' })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `本月共记录月检察 ${monthlyRecords?.length || 0} 条。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                }),

                // 及时检察记录
                new Paragraph({
                    children: [
                        new TextRun({ text: '四、及时检察记录', bold: true, size: 32, font: '黑体' })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `本月共记录及时检察事件 ${immediateEvents?.length || 0} 条。`,
                            font: '仿宋',
                            size: 32
                        })
                    ]
                })
            ]
        }]
    })

    return await Packer.toBlob(doc)
}

/**
 * 生成日志内容（纯文本）
 */
function generateLogsContent(dailyLogs) {
    let content = '派驻检察工作日志记录\n'
    content += '='.repeat(50) + '\n\n'

    for (const log of dailyLogs) {
        const date = new Date(log.date).toLocaleDateString('zh-CN')
        content += `【${date}】\n`

        if (log.threeScenes) {
            const scenes = []
            if (log.threeScenes.production) scenes.push('生产现场')
            if (log.threeScenes.workshop) scenes.push('劳动车间')
            if (log.threeScenes.living) scenes.push('生活区域')
            if (scenes.length > 0) {
                content += `  三大现场检察：${scenes.join('、')}\n`
            }
        }

        if (log.monitorCheck?.checked) {
            content += `  监控抽查：${log.monitorCheck.count || 1}次\n`
        }

        if (log.policeEquipment?.checked) {
            content += `  警戒具检察：使用人数${log.policeEquipment.count}人\n`
        }

        if (log.notes) {
            content += `  备注：${log.notes}\n`
        }

        content += '\n'
    }

    return content
}

/**
 * 生成归档说明
 */
function generateArchiveReadme(reportData) {
    const { year, month, prisonInfo } = reportData
    const now = new Date()

    return `
派驻检察室月度工作包归档说明
============================

监狱名称：${prisonInfo.prisonName || '***'}监狱
归档月份：${year}年${month}月
生成时间：${now.toLocaleString('zh-CN')}

包含内容：
1. 月度工作情况报告.docx - 本月工作情况总结报告
2. 派驻检察工作报告事项清单.docx - 工作事项汇总清单
3. 检察日志/ - 日检察记录
4. 附件材料/ - 各类上传的附件材料
   - 人员花名册/
   - 谈话笔录/
   - 调查问卷/
   - 情况报告/
   - 减刑假释/
   - 其他材料/

备注：
本工作包由派驻检察室工作管理系统自动生成。
如有疑问，请联系系统管理员。
`.trim()
}

/**
 * 导出单个日志为 Word
 */
export async function exportDailyLogToWord(log) {
    const date = new Date(log.date).toLocaleDateString('zh-CN')

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: '派驻检察工作日志',
                            bold: true,
                            size: 44,
                            font: '方正小标宋简体'
                        })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: date, size: 32, font: '仿宋' })
                    ]
                }),
                // ... more content based on log
            ]
        }]
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `检察日志_${date.replace(/\//g, '-')}.docx`)
}
