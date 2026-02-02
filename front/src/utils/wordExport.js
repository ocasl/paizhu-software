/**
 * Word 文档导出工具
 * 按照 d.md 模板格式生成《派驻女子监狱检察室月度工作情况报告》
 */
import {
    Document,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    Packer,
    PageBreak,
    convertInchesToTwip
} from 'docx'
import { saveAs } from 'file-saver'

/**
 * 生成月度工作情况报告 Word 文档
 * @param {Object} reportData - 报告数据快照
 */
export async function generateMonthlyReport(reportData) {
    const { year, month, prisonInfo, basicInfo, lawEnforcement, security, interviews, meetings, otherWork } = reportData

    const doc = new Document({
        styles: {
            paragraphStyles: [
                {
                    id: 'Normal',
                    name: 'Normal',
                    basedOn: 'Normal',
                    next: 'Normal',
                    run: {
                        font: '仿宋',
                        size: 32 // 16pt = 32 half-points
                    },
                    paragraph: {
                        spacing: {
                            line: 360, // 1.5倍行距
                            before: 0,
                            after: 0
                        }
                    }
                }
            ]
        },
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(1),
                        right: convertInchesToTwip(1),
                        bottom: convertInchesToTwip(1),
                        left: convertInchesToTwip(1.2)
                    }
                }
            },
            children: [
                // ==================== 标题 ====================
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                    children: [
                        new TextRun({
                            text: '派驻女子监狱检察室月度工作情况报告',
                            bold: true,
                            size: 44, // 22pt
                            font: '方正小标宋简体'
                        })
                    ]
                }),

                // 日期
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                    children: [
                        new TextRun({
                            text: `${year}年${month}月`,
                            size: 32,
                            font: '仿宋'
                        })
                    ]
                }),

                // ==================== 一、本月基本情况 ====================
                new Paragraph({
                    children: [
                        new TextRun({ text: '一、本月基本情况', bold: true, size: 32, font: '黑体' })
                    ],
                    spacing: { before: 200, after: 100 }
                }),

                // 第1点：在押罪犯分类统计
                new Paragraph({
                    children: [
                        new TextRun({ text: `1.监狱在押罪犯`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.totalPrisoners}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `人，其中重大刑事犯`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.majorCriminals}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `名，死缓犯`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.deathSentence}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `名，无期犯`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.lifeSentence}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `名，二次以上判刑罪犯`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.repeatOffenders}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `名，外籍犯`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.foreignPrisoners}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `名（含港澳台`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.hkMacaoTaiwan}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `名），判决书认定的精神病犯`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.mentalIllness}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `名，原地厅以上罪犯`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.formerOfficials}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `名，原县团级以上罪犯`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.formerCountyLevel}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `名，"法轮功"`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.falunGong}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `名，有吸毒史罪犯`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.drugHistory}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `名，涉毒犯`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.drugCrimes}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `名，新收押罪犯`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.newAdmissions}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `名，未成年女犯`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.minorFemales}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `名，涉黑罪犯`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.gangRelated}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `名，涉恶罪犯`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.evilForces}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `名，危安罪犯`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.endangeringSafety}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `名。`, font: '仿宋', size: 32 })
                    ],
                    spacing: { after: 100 }
                }),

                // 第2点：收押释放
                new Paragraph({
                    children: [
                        new TextRun({ text: `2.新收押罪犯`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.newAdmissions}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `人，刑满释放出监罪犯`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.releasedCount}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `人。`, font: '仿宋', size: 32 })
                    ],
                    spacing: { after: 100 }
                }),

                // 第3点：处分情况
                new Paragraph({
                    children: [
                        new TextRun({ text: `3.记过`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.recordedPunishments}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `人，系`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.recordedPunishmentsReason || '***'}`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `；禁闭`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.confinementPunishments}`, bold: true, font: '仿宋', size: 32 }),
                        new TextRun({ text: `人，系`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `${basicInfo.confinementReason || '***'}`, font: '仿宋', size: 32 }),
                        new TextRun({ text: `。`, font: '仿宋', size: 32 })
                    ],
                    spacing: { after: 200 }
                }),

                // ==================== 二、执法检察情况 ====================
                new Paragraph({
                    children: [
                        new TextRun({ text: '二、执法检察情况', bold: true, size: 32, font: '黑体' })
                    ],
                    spacing: { before: 200, after: 100 }
                }),

                // （一）减、假、暂检察
                new Paragraph({
                    children: [
                        new TextRun({ text: '（一）减、假、暂检察', bold: true, font: '楷体', size: 32 })
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `办理${prisonInfo.prisonName || '***'}监狱第${lawEnforcement.paroleBatch || '***'}批次减刑审查案件${lawEnforcement.paroleCount || '***'}件，已完成第${lawEnforcement.paroleStage || '***'}阶段。`,
                            font: '仿宋',
                            size: 32
                        })
                    ],
                    spacing: { after: 100 }
                }),

                // （二）收押释放检察
                new Paragraph({
                    children: [
                        new TextRun({ text: '（二）收押释放检察', bold: true, font: '楷体', size: 32 })
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `新收押罪犯${basicInfo.newAdmissions}人，刑满释放出监罪犯${basicInfo.releasedCount}人，经检察，未发现违法问题。`,
                            font: '仿宋',
                            size: 32
                        })
                    ],
                    spacing: { after: 100 }
                }),

                // （三）监管执法检察
                new Paragraph({
                    children: [
                        new TextRun({ text: '（三）监管执法检察', bold: true, font: '楷体', size: 32 })
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `1.在办理${prisonInfo.prisonName || '***'}监狱第${lawEnforcement.paroleBatch || '***'}批次减刑假释案件中发现：${lawEnforcement.correctionIssues || '***'}，制发纠正违法通知书${lawEnforcement.correctionNotices}份。`,
                            font: '仿宋',
                            size: 32
                        })
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `2.对罪犯生活、劳动、学习三大现场进行检察${lawEnforcement.threeSceneChecks}次，对医务室、严管、禁闭室、伙房等重点场所检察${lawEnforcement.keyLocationChecks}次，会见检察${lawEnforcement.visitChecks}次，${lawEnforcement.visitIllegalCount > 0 ? `发现违法问题${lawEnforcement.visitIllegalCount}个` : '未发现违法问题'}。`,
                            font: '仿宋',
                            size: 32
                        })
                    ],
                    spacing: { after: 200 }
                }),

                // ==================== 三、安全防范检察 ====================
                new Paragraph({
                    children: [
                        new TextRun({ text: '三、安全防范检察', bold: true, size: 32, font: '黑体' })
                    ],
                    spacing: { before: 200, after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `开展监控检察${security.monitorChecks}次，通过视频检察${security.issuesFound > 0 ? `发现问题${security.issuesFound}个` : '未发现问题'}。`,
                            font: '仿宋',
                            size: 32
                        })
                    ],
                    spacing: { after: 200 }
                }),

                // ==================== 四、开展个别罪犯谈话情况 ====================
                new Paragraph({
                    children: [
                        new TextRun({ text: '四、开展个别罪犯谈话情况', bold: true, size: 32, font: '黑体' })
                    ],
                    spacing: { before: 200, after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `开展罪犯个别教育谈话${interviews.totalTalks}人，其中新收押罪犯谈话${interviews.newAdmissionTalks}人，涉恶罪犯谈话${interviews.evilForcesTalks}人，外伤罪犯谈话${interviews.injuryTalks}人，禁闭罪犯谈话${interviews.confinementTalks}人。`,
                            font: '仿宋',
                            size: 32
                        })
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `发放出监问卷调查表${interviews.questionnaireCount}份。`,
                            font: '仿宋',
                            size: 32
                        })
                    ],
                    spacing: { after: 200 }
                }),

                // ==================== 五、参加监狱各类会议、活动 ====================
                new Paragraph({
                    children: [
                        new TextRun({ text: '五、参加监狱各类会议、活动', bold: true, size: 32, font: '黑体' })
                    ],
                    spacing: { before: 200, after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `1.参加无期死缓、提级减刑案件罪犯评审会${meetings.lifeSentenceReviews}次。`,
                            font: '仿宋',
                            size: 32
                        })
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `2.参加第${lawEnforcement.paroleBatch || '***'}批次减刑假释案件评审会。`,
                            font: '仿宋',
                            size: 32
                        })
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `3.参加监狱犯情分析会${meetings.analysisMeetings}次。`,
                            font: '仿宋',
                            size: 32
                        })
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `4.参加监狱开展的${meetings.otherActivities || '***'}活动。`,
                            font: '仿宋',
                            size: 32
                        })
                    ],
                    spacing: { after: 200 }
                }),

                // ==================== 六、其他工作情况 ====================
                new Paragraph({
                    children: [
                        new TextRun({ text: '六、其他工作情况', bold: true, size: 32, font: '黑体' })
                    ],
                    spacing: { before: 200, after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `开启检察官信箱${otherWork.mailboxOpens}次，收到信件${otherWork.lettersReceived}封。`,
                            font: '仿宋',
                            size: 32
                        })
                    ],
                    spacing: { after: 400 }
                }),

                // ==================== 落款 ====================
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    spacing: { before: 600 },
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

    // 生成并下载
    const blob = await Packer.toBlob(doc)
    const fileName = `派驻${prisonInfo.prisonName || ''}监狱检察室${year}年${month}月工作报告.docx`
    saveAs(blob, fileName)

    return fileName
}

/**
 * 将减刑阶段代码转换为中文
 */
export function getParoleStageText(stage) {
    const stageMap = {
        'review': '审查',
        'publicize': '公示',
        'submitted': '提交',
        'approved': '审批'
    }
    return stageMap[stage] || stage
}
