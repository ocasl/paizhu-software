/**
 * 日检察日志 Word 文档生成工具
 * 基于模板结构生成《派驻检察工作日志》Word文件
 */
import {
    Document,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
    AlignmentType,
    VerticalAlign,
    BorderStyle,
    HeadingLevel
} from 'docx'
import { saveAs } from 'file-saver'

// 表格边框样式
const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
}

// 创建单元格
function createCell(text, options = {}) {
    const {
        width,
        rowSpan,
        columnSpan,
        bold = false,
        alignment = AlignmentType.CENTER,
        fontSize = 20, // 10pt = 20 half-points
        verticalMerge
    } = options

    const cellOptions = {
        children: [
            new Paragraph({
                children: [
                    new TextRun({
                        text: text || '',
                        bold,
                        size: fontSize
                    })
                ],
                alignment
            })
        ],
        verticalAlign: VerticalAlign.CENTER,
        borders: tableBorders
    }

    if (width) cellOptions.width = { size: width, type: WidthType.DXA }
    if (rowSpan) cellOptions.rowSpan = rowSpan
    if (columnSpan) cellOptions.columnSpan = columnSpan
    if (verticalMerge) cellOptions.verticalMerge = verticalMerge

    return new TableCell(cellOptions)
}

// 格式化日期
function formatDate(date) {
    if (!date) return ''
    const d = new Date(date)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

// 格式化三大现场检察地点
function formatSceneLocations(threeScenes) {
    const locations = []
    if (threeScenes.labor?.checked && threeScenes.labor.locations?.length) {
        locations.push(`劳动现场：${threeScenes.labor.locations.join('、')}`)
    }
    if (threeScenes.living?.checked && threeScenes.living.locations?.length) {
        locations.push(`生活现场：${threeScenes.living.locations.join('、')}`)
    }
    if (threeScenes.study?.checked && threeScenes.study.locations?.length) {
        locations.push(`学习现场：${threeScenes.study.locations.join('、')}`)
    }
    return locations.join('\n') || '无'
}

/**
 * 生成日检察日志 Word 文档
 * @param {Object} logData - 日志数据对象
 * @param {Object} settings - 系统设置（包含检察院名称等）
 * @returns {Document} docx Document 对象
 */
export function generateDailyLogDocument(logData, settings = {}) {
    const {
        prisonName = '',
        inspectorName = '',
        date,
        threeScenes = {},
        strictControl = {},
        policeEquipment = {},
        gangPrisoners = {},
        admission = {},
        supervisionSituation = '',
        feedbackSituation = '',
        otherWork = {}
    } = logData

    const institutionName = settings.institutionName || '江西省南昌长堎地区人民检察院'

    // 创建文档
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // 标题：检察院名称
                new Paragraph({
                    children: [
                        new TextRun({
                            text: institutionName,
                            bold: true,
                            size: 36 // 18pt
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                }),
                // 副标题：派驻检察工作日志
                new Paragraph({
                    children: [
                        new TextRun({
                            text: '派驻检察工作日志',
                            bold: true,
                            size: 32, // 16pt
                            color: '0000FF'
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                // 主表格
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorders,
                    rows: [
                        // 第一行：表头信息
                        new TableRow({
                            children: [
                                createCell('派驻监所', { width: 1200, bold: true }),
                                createCell(prisonName, { width: 2400 }),
                                createCell('派驻人员', { width: 1200, bold: true }),
                                createCell(inspectorName, { width: 1200 }),
                                createCell('日期', { width: 800, bold: true }),
                                createCell(formatDate(date), { width: 1600 }),
                                createCell('填写人', { width: 800, bold: true }),
                                createCell(inspectorName, { width: 1000 })
                            ]
                        }),
                        // 第二行：日工作事项标题行
                        new TableRow({
                            children: [
                                createCell('日\n工\n作\n事\n项', { width: 600, rowSpan: 5, bold: true }),
                                createCell('三大现场检察', { width: 1200, bold: true }),
                                createCell('现场检察地点位置', { width: 2600, bold: true }),
                                createCell('严管禁闭检察', { width: 1400, bold: true }),
                                createCell('新增人员数量', { width: 1400, bold: true }),
                                createCell('警戒具检察', { width: 1200, bold: true, rowSpan: 2 }),
                                createCell('新增人员数量', { width: 1200, bold: true, rowSpan: 2 }),
                                createCell('涉黑罪犯', { width: 1000, bold: true, rowSpan: 2 }),
                                createCell('收押/调出数量', { width: 1000, bold: true, rowSpan: 2 })
                            ]
                        }),
                        // 第三行：数据行
                        new TableRow({
                            children: [
                                createCell(formatSceneLocations(threeScenes), { width: 3800, columnSpan: 2, alignment: AlignmentType.LEFT }),
                                createCell(String(strictControl.newCount || 0), { width: 1400 }),
                                createCell(String(policeEquipment.count || 0), { width: 1200 }),
                                createCell(`新增：${gangPrisoners.newCount || 0}\n总数：${gangPrisoners.totalCount || 0}`, { width: 1000 }),
                                createCell(`收押：${admission.inCount || 0}\n调出：${admission.outCount || 0}`, { width: 1000 })
                            ]
                        }),
                        // 第四行：检察监督情况
                        new TableRow({
                            children: [
                                createCell('检察监督情况', { width: 1200, bold: true }),
                                createCell(supervisionSituation || '（填写日检察工作的具体情况）', { width: 8400, columnSpan: 6, alignment: AlignmentType.LEFT })
                            ]
                        }),
                        // 第五行：采纳反馈情况
                        new TableRow({
                            children: [
                                createCell('采纳反馈情况', { width: 1200, bold: true }),
                                createCell(feedbackSituation || '', { width: 8400, columnSpan: 6, alignment: AlignmentType.LEFT })
                            ]
                        }),
                        // 其它检察工作情况
                        new TableRow({
                            children: [
                                createCell('其\n它\n检\n察\n工\n作\n情\n况', { width: 600, rowSpan: 2, bold: true }),
                                createCell('检察监督情况', { width: 1200, bold: true }),
                                createCell(otherWork.supervisionSituation || '（填写周检察、月检察、及时检察工作的具体情况）', { width: 8400, columnSpan: 6, alignment: AlignmentType.LEFT })
                            ]
                        }),
                        new TableRow({
                            children: [
                                createCell('采纳反馈情况', { width: 1200, bold: true }),
                                createCell(otherWork.feedbackSituation || '', { width: 8400, columnSpan: 6, alignment: AlignmentType.LEFT })
                            ]
                        })
                    ]
                })
            ]
        }]
    })

    return doc
}

/**
 * 导出日志为 Word 文件
 * @param {Object} logData - 日志数据
 * @param {Object} settings - 系统设置
 * @param {string} filename - 文件名（可选）
 */
export async function exportDailyLogToWord(logData, settings = {}, filename = null) {
    const doc = generateDailyLogDocument(logData, settings)

    // 生成文件名
    const dateStr = logData.date ? new Date(logData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    const defaultFilename = `派驻检察工作日志_${dateStr}.docx`

    // 打包并保存
    const blob = await Packer.toBlob(doc)
    saveAs(blob, filename || defaultFilename)
}

/**
 * 批量导出多个日志为 Word 文件（打包成 ZIP）
 * @param {Array} logs - 日志数组
 * @param {Object} settings - 系统设置
 * @returns {Promise<Blob>} ZIP 文件 Blob
 */
export async function exportMultipleLogsToZip(logs, settings = {}) {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    for (const log of logs) {
        const doc = generateDailyLogDocument(log, settings)
        const blob = await Packer.toBlob(doc)
        const dateStr = log.date ? new Date(log.date).toISOString().split('T')[0] : 'unknown'
        zip.file(`派驻检察工作日志_${dateStr}.docx`, blob)
    }

    return await zip.generateAsync({ type: 'blob' })
}

/**
 * 获取文档预览数据（用于前端预览展示）
 * @param {Object} logData - 日志数据
 * @returns {Object} 格式化的预览数据
 */
export function getLogPreviewData(logData) {
    const {
        prisonName = '',
        inspectorName = '',
        date,
        threeScenes = {},
        strictControl = {},
        policeEquipment = {},
        gangPrisoners = {},
        admission = {},
        supervisionSituation = '',
        feedbackSituation = '',
        otherWork = {}
    } = logData

    return {
        header: {
            prisonName,
            inspectorName,
            date: formatDate(date),
            writer: inspectorName
        },
        dailyWork: {
            sceneLocations: formatSceneLocations(threeScenes),
            strictControlNew: strictControl.newCount || 0,
            policeEquipmentNew: policeEquipment.count || 0,
            gangPrisoners: {
                new: gangPrisoners.newCount || 0,
                total: gangPrisoners.totalCount || 0
            },
            admission: {
                in: admission.inCount || 0,
                out: admission.outCount || 0
            },
            supervisionSituation,
            feedbackSituation
        },
        otherWork: {
            supervisionSituation: otherWork.supervisionSituation || '',
            feedbackSituation: otherWork.feedbackSituation || ''
        }
    }
}
