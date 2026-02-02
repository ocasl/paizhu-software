/**
 * 及时检察事件Word文档生成器
 */
const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx')

/**
 * 生成及时检察事件Word文档
 * @param {Object} event - 及时检察事件数据
 * @returns {Promise<Buffer>} Word文档Buffer
 */
async function generateImmediateEventDocument(event) {
    // 事件类型映射
    const eventTypeMap = {
        'escape': '罪犯脱逃事件',
        'selfHarm': '罪犯自伤自残事件',
        'death': '罪犯死亡事件',
        'epidemic': '重大疫情事件',
        'accident': '重大生产安全事故',
        'paroleRequest': '减刑假释申请',
        'disciplinaryAction': '民警纪律处分'
    }

    const eventTypeName = eventTypeMap[event.event_type] || '及时检察事件'
    const eventDate = new Date(event.event_date).toLocaleDateString('zh-CN')
    const reportDate = new Date().toLocaleString('zh-CN')
    
    // 获取监狱名称（从event对象或用户信息）
    const prisonName = event.prison_name || '监狱'

    // 创建文档 - 纯文字格式
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // 标题
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                    children: [
                        new TextRun({
                            text: `派驻${prisonName}检察室`,
                            size: 28,
                            bold: true
                        })
                    ]
                }),
                
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 600 },
                    children: [
                        new TextRun({
                            text: `${eventTypeName}报告`,
                            size: 32,
                            bold: true
                        })
                    ]
                }),

                // 事件日期
                new Paragraph({
                    text: `事件日期：${eventDate}`,
                    spacing: { before: 200, after: 200 }
                }),

                // 处理状态
                new Paragraph({
                    text: `处理状态：${event.status === 'pending' ? '待处理' : event.status === 'processed' ? '已处理' : '已关闭'}`,
                    spacing: { before: 200, after: 200 }
                }),

                // 事件标题
                ...(event.title ? [
                    new Paragraph({
                        text: `事件标题：${event.title}`,
                        spacing: { before: 200, after: 200 }
                    })
                ] : []),

                // 事件详情
                new Paragraph({
                    text: '事件详情：',
                    spacing: { before: 300, after: 200 }
                }),

                new Paragraph({
                    text: event.description || '无',
                    spacing: { before: 100, after: 300 }
                }),

                // 减刑假释数据（如果有）
                ...(event.parole_data ? createParoleSection(event.parole_data) : []),

                // 附件信息
                ...(event.attachment_ids && event.attachment_ids.length > 0 ? [
                    new Paragraph({
                        text: `相关附件：共 ${event.attachment_ids.length} 个附件`,
                        spacing: { before: 300, after: 200 }
                    })
                ] : []),

                // 页脚
                new Paragraph({ text: '' }),
                new Paragraph({
                    text: `派驻${prisonName}检察室`,
                    alignment: AlignmentType.RIGHT,
                    spacing: { before: 400 }
                }),
                new Paragraph({
                    text: `报告日期：${reportDate}`,
                    alignment: AlignmentType.RIGHT,
                    spacing: { before: 100 }
                })
            ]
        }]
    })

    // 生成Buffer
    const buffer = await Packer.toBuffer(doc)
    return buffer
}

/**
 * 创建减刑假释数据部分
 */
function createParoleSection(paroleData) {
    if (!paroleData) return []

    const paragraphs = [
        new Paragraph({
            text: '减刑假释信息：',
            spacing: { before: 300, after: 200 }
        })
    ]

    // 批次信息
    if (paroleData.batch) {
        paragraphs.push(
            new Paragraph({
                text: `批次：${paroleData.batch}`,
                spacing: { before: 100, after: 100 }
            })
        )
    }

    // 数量
    if (paroleData.count) {
        paragraphs.push(
            new Paragraph({
                text: `涉及人数：${paroleData.count} 人`,
                spacing: { before: 100, after: 100 }
            })
        )
    }

    // 阶段
    if (paroleData.stage) {
        const stageMap = {
            'review': '审查阶段',
            'publicize': '公示阶段',
            'submitted': '已提交',
            'approved': '已通过'
        }
        paragraphs.push(
            new Paragraph({
                text: `处理阶段：${stageMap[paroleData.stage] || paroleData.stage}`,
                spacing: { before: 100, after: 300 }
            })
        )
    }

    return paragraphs
}

module.exports = {
    generateImmediateEventDocument
}
