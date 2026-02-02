/**
 * Excel 解析工具
 * 用于从上传的花名册中自动抽取数据
 */
import * as XLSX from 'xlsx'

/**
 * 解析入监人员花名册
 * @param {File} file - Excel 文件
 * @returns {Promise<Object>} 解析结果
 */
export async function parseAdmissionRoster(file) {
    const data = await readExcelFile(file)

    // 尝试查找入监日期列来统计人数
    const count = data.length > 0 ? data.length - 1 : 0 // 减去标题行

    return {
        type: 'admission',
        count: count,
        records: data.slice(1), // 去掉标题行
        parseDate: new Date().toISOString()
    }
}

/**
 * 解析出监人员花名册
 * @param {File} file - Excel 文件
 * @returns {Promise<Object>} 解析结果
 */
export async function parseReleaseRoster(file) {
    const data = await readExcelFile(file)

    const count = data.length > 0 ? data.length - 1 : 0

    return {
        type: 'release',
        count: count,
        records: data.slice(1),
        parseDate: new Date().toISOString()
    }
}

/**
 * 解析严管/禁闭/警戒具/涉黑人员花名册
 * @param {File} file - Excel 文件
 * @returns {Promise<Object>} 解析结果
 */
export async function parseSpecialRoster(file) {
    const data = await readExcelFile(file)

    // 尝试分类统计
    const result = {
        type: 'special',
        strictControl: 0,    // 严管人员
        confinement: 0,      // 禁闭人员
        policeEquipment: 0,  // 警戒具人员
        gangRelated: 0,      // 涉黑罪犯
        total: 0,
        records: [],
        parseDate: new Date().toISOString()
    }

    if (data.length <= 1) return result

    // 查找类型列的索引
    const headers = data[0]
    let typeColIndex = -1

    for (let i = 0; i < headers.length; i++) {
        const header = String(headers[i] || '').toLowerCase()
        if (header.includes('类型') || header.includes('分类') || header.includes('类别')) {
            typeColIndex = i
            break
        }
    }

    // 遍历数据行统计
    for (let i = 1; i < data.length; i++) {
        const row = data[i]
        if (!row || row.length === 0) continue

        result.total++
        result.records.push(row)

        if (typeColIndex >= 0 && row[typeColIndex]) {
            const type = String(row[typeColIndex])
            if (type.includes('严管')) result.strictControl++
            else if (type.includes('禁闭')) result.confinement++
            else if (type.includes('警戒') || type.includes('戒具')) result.policeEquipment++
            else if (type.includes('涉黑') || type.includes('黑恶')) result.gangRelated++
        }
    }

    // 如果没有找到类型列，默认所有记录为严管人员
    if (typeColIndex < 0) {
        result.strictControl = result.total
    }

    return result
}

/**
 * 解析狱情动态 Word 文件（提取基本信息）
 * 注：Word 解析需要特殊处理，这里提供基础框架
 * @param {File} file - Word 文件
 * @returns {Promise<Object>} 解析结果
 */
export async function parsePrisonDynamics(file) {
    // Word 文件解析比较复杂，这里返回文件信息
    // 实际应用中可使用 mammoth.js 等库解析
    return {
        type: 'dynamics',
        fileName: file.name,
        fileSize: file.size,
        parseDate: new Date().toISOString(),
        // 基本信息需要手动填写或使用更复杂的解析逻辑
        extractedData: null
    }
}

/**
 * 读取 Excel 文件
 * @param {File} file - 文件对象
 * @returns {Promise<Array>} 二维数组数据
 */
async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result)
                const workbook = XLSX.read(data, { type: 'array' })

                // 读取第一个工作表
                const firstSheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[firstSheetName]

                // 转换为二维数组
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

                resolve(jsonData)
            } catch (error) {
                reject(error)
            }
        }

        reader.onerror = () => reject(new Error('文件读取失败'))
        reader.readAsArrayBuffer(file)
    })
}

/**
 * 智能解析花名册（自动识别类型）
 * @param {File} file - Excel 文件
 * @param {string} categoryId - 类别 ID
 * @returns {Promise<Object>} 解析结果
 */
export async function parseRoster(file, categoryId) {
    switch (categoryId) {
        case 'admission-roster':
            return await parseAdmissionRoster(file)
        case 'release-roster':
            return await parseReleaseRoster(file)
        case 'special-roster':
            return await parseSpecialRoster(file)
        case 'prison-dynamics':
            return await parsePrisonDynamics(file)
        default:
            // 对于其他类型，只返回文件信息
            return {
                type: 'other',
                fileName: file.name,
                fileSize: file.size,
                parseDate: new Date().toISOString()
            }
    }
}

/**
 * 统计附件数量
 * @param {Object} categoryFiles - 按类别分组的文件对象
 * @returns {Object} 各类别附件数量
 */
export function countAttachments(categoryFiles) {
    const counts = {
        // 数据抓取类
        prisonDynamics: 0,      // 狱情动态
        admissionRoster: 0,     // 入监花名册
        releaseRoster: 0,       // 出监花名册
        specialRoster: 0,       // 严管/禁闭/警戒具/涉黑花名册
        newPrisonerTranscript: 0, // 新进罪犯谈话笔录

        // 装卷材料类
        releaseTranscript: 0,   // 刑释罪犯谈话笔录
        injuryTranscript: 0,    // 外伤就诊谈话笔录
        confinementTranscript: 0, // 严管禁闭谈话笔录
        visitTranscript: 0,     // 非常规会见谈话笔录
        questionnaire: 0,       // 异常调查问卷
        otherMaterials: 0,      // 其他重大工作材料

        // 总计
        total: 0
    }

    // 映射类别 ID 到计数字段
    const categoryMap = {
        'prison-dynamics': 'prisonDynamics',
        'admission-roster': 'admissionRoster',
        'release-roster': 'releaseRoster',
        'special-roster': 'specialRoster',
        'new-prisoner-transcript': 'newPrisonerTranscript',
        'release-transcript': 'releaseTranscript',
        'injury-transcript': 'injuryTranscript',
        'confinement-transcript': 'confinementTranscript',
        'visit-transcript': 'visitTranscript',
        'questionnaire': 'questionnaire',
        'other-materials': 'otherMaterials'
    }

    for (const [categoryId, files] of Object.entries(categoryFiles)) {
        const fileCount = Array.isArray(files) ? files.length : 0
        const countKey = categoryMap[categoryId]

        if (countKey && counts.hasOwnProperty(countKey)) {
            counts[countKey] = fileCount
        }

        counts.total += fileCount
    }

    return counts
}
