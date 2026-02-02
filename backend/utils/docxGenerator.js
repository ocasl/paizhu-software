/**
 * 后端日志Word文档生成器
 * 为每条日志生成Word文档
 */
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = require('docx')

/**
 * 生成单条日志的Word文档Buffer
 * @param {Object} log - 日志数据
 * @returns {Promise<Buffer>} - Word文档Buffer
 */
async function generateLogDocx(log) {
    const dateStr = log.log_date || new Date().toISOString().split('T')[0]

    // 创建文档
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // 标题
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: log.prison_name || '派驻监所',
                            bold: true,
                            size: 32
                        })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: '派驻检察工作日志',
                            bold: true,
                            size: 28,
                            color: '0066CC'
                        })
                    ]
                }),
                new Paragraph({ text: '' }),

                // 基本信息表格
                createInfoTable(log, dateStr),
                new Paragraph({ text: '' }),

                // 三大现场检察
                new Paragraph({
                    children: [
                        new TextRun({ text: '一、三大现场检察', bold: true, size: 24 })
                    ]
                }),
                createScenesTable(log.three_scenes || {}),
                new Paragraph({ text: '' }),

                // 监管情况
                new Paragraph({
                    children: [
                        new TextRun({ text: '二、监管情况', bold: true, size: 24 })
                    ]
                }),
                createSupervisionTable(log),
                new Paragraph({ text: '' }),

                // 检察监督情况
                new Paragraph({
                    children: [
                        new TextRun({ text: '三、检察监督情况', bold: true, size: 24 })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: log.supervision_situation || log.other_work?.supervisionSituation || '无', size: 22 })
                    ]
                }),
                new Paragraph({ text: '' }),

                // 采纳反馈情况
                new Paragraph({
                    children: [
                        new TextRun({ text: '四、采纳反馈情况', bold: true, size: 24 })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: log.feedback_situation || log.other_work?.feedbackSituation || '无', size: 22 })
                    ]
                })
            ]
        }]
    })

    return await Packer.toBuffer(doc)
}

function createInfoTable(log, dateStr) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    createCell('日期', true),
                    createCell(dateStr),
                    createCell('派驻人员', true),
                    createCell(log.inspector_name || '-')
                ]
            }),
            new TableRow({
                children: [
                    createCell('派驻监所', true),
                    createCell(log.prison_name || '-', false, 3)
                ]
            })
        ]
    })
}

function createScenesTable(scenes) {
    const labor = scenes.labor || {}
    const living = scenes.living || {}
    const study = scenes.study || {}

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    createCell('现场类型', true),
                    createCell('是否检察', true),
                    createCell('位置/内容', true)
                ]
            }),
            new TableRow({
                children: [
                    createCell('劳动现场'),
                    createCell(labor.checked ? '✓' : '✗'),
                    createCell((labor.locations || []).join(', ') || '-')
                ]
            }),
            new TableRow({
                children: [
                    createCell('生活现场'),
                    createCell(living.checked ? '✓' : '✗'),
                    createCell((living.locations || []).join(', ') || '-')
                ]
            }),
            new TableRow({
                children: [
                    createCell('学习现场'),
                    createCell(study.checked ? '✓' : '✗'),
                    createCell((study.locations || []).join(', ') || '-')
                ]
            })
        ]
    })
}

function createSupervisionTable(log) {
    const strictControl = log.strict_control || {}
    const policeEquip = log.police_equipment || {}
    const gang = log.gang_prisoners || {}
    const admission = log.admission || {}
    const monitor = log.monitor_check || {}

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    createCell('严管禁闭', true),
                    createCell(`新增: ${strictControl.newCount || 0}, 累计: ${strictControl.totalCount || 0}`)
                ]
            }),
            new TableRow({
                children: [
                    createCell('警戒具检察', true),
                    createCell(policeEquip.checked ? `${policeEquip.count || 0}人` : '未检察')
                ]
            }),
            new TableRow({
                children: [
                    createCell('涉黑罪犯', true),
                    createCell(`新增: ${gang.newCount || 0}, 累计: ${gang.totalCount || 0}`)
                ]
            }),
            new TableRow({
                children: [
                    createCell('收押/调出', true),
                    createCell(`入监: ${admission.inCount || 0}, 出监: ${admission.outCount || 0}`)
                ]
            }),
            new TableRow({
                children: [
                    createCell('监控抽查', true),
                    createCell(monitor.checked ? `${monitor.count || 1}次` : '未抽查')
                ]
            })
        ]
    })
}

function createCell(text, isHeader = false, colSpan = 1) {
    return new TableCell({
        columnSpan: colSpan,
        children: [
            new Paragraph({
                children: [
                    new TextRun({
                        text: text || '',
                        bold: isHeader,
                        size: 22
                    })
                ]
            })
        ],
        shading: isHeader ? { fill: 'E8F4FC' } : undefined
    })
}

module.exports = {
    generateLogDocx
}
