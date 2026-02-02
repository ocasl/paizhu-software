/**
 * 模板解析工具
 * 解析各类监狱业务模板Excel文件
 */

const XLSX = require('xlsx')

/**
 * 解析日期值
 * @param {any} value - Excel中的日期值
 * @returns {Date|null}
 */
function parseDate(value) {
    if (!value) return null

    // 如果是数字（Excel日期序列号）
    if (typeof value === 'number') {
        const date = XLSX.SSF.parse_date_code(value)
        if (date) {
            return new Date(date.y, date.m - 1, date.d)
        }
    }

    // 如果是字符串
    if (typeof value === 'string') {
        // 处理 YYYY.MM.DD 格式
        const dotMatch = value.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/)
        if (dotMatch) {
            return new Date(parseInt(dotMatch[1]), parseInt(dotMatch[2]) - 1, parseInt(dotMatch[3]))
        }

        // 处理其他日期格式
        const d = new Date(value)
        if (!isNaN(d.getTime())) {
            return d
        }
    }

    return null
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date) {
    if (!date) return null
    if (!(date instanceof Date)) {
        date = parseDate(date)
    }
    if (!date || isNaN(date.getTime())) return null
    return date.toISOString().split('T')[0]
}

/**
 * 自动识别模板类型
 * @param {string} filename - 文件名
 * @param {Array} headers - 标题行数据
 * @returns {string|null} 模板类型
 */
function detectTemplateType(filename, headers) {
    const name = filename.toLowerCase()

    // 根据文件名判断
    if (name.includes('严管教育')) return 'strict_education'
    if (name.includes('禁闭')) return 'confinement'
    if (name.includes('戒具')) return 'restraint'
    if (name.includes('信件')) return 'mail'
    if (name.includes('涉黑') || name.includes('涉恶')) return 'blacklist'
    if (name.includes('犯情动态')) return 'report'

    // 根据列名判断
    const headerStr = headers.join(',')
    if (headerStr.includes('严管教育原因')) return 'strict_education'
    if (headerStr.includes('禁闭起日')) return 'confinement'
    if (headerStr.includes('戒具') || headerStr.includes('警戒具')) return 'restraint'
    if (headerStr.includes('开箱日期')) return 'mail'
    if (headerStr.includes('三涉情况')) return 'blacklist'

    return null
}

/**
 * 解析严管教育审批数据
 * @param {Array} data - Excel原始数据（二维数组）
 * @returns {Object} 解析结果
 */
function parseStrictEducation(data) {
    const headers = data[0]
    const records = []
    const prisoners = []

    // 列索引映射
    const colMap = {
        createDate: headers.findIndex(h => String(h).includes('制单时间')),
        prisonUnit: headers.findIndex(h => String(h).includes('所属单位')),
        prisonArea: headers.findIndex(h => String(h).includes('所属监区')),
        name: headers.findIndex(h => String(h).includes('罪犯姓名') || h === '姓名'),
        prisonerId: headers.findIndex(h => String(h).includes('罪犯编号')),
        gender: headers.findIndex(h => String(h).includes('性别')),
        birthDate: headers.findIndex(h => String(h).includes('出生日期')),
        ethnicity: headers.findIndex(h => String(h).includes('民族')),
        education: headers.findIndex(h => String(h).includes('文化程度')),
        sentenceType: headers.findIndex(h => String(h).includes('刑种')),
        crime: headers.findIndex(h => String(h).includes('罪名')),
        originalTerm: headers.findIndex(h => String(h).includes('原判刑期')),
        termStart: headers.findIndex(h => String(h).includes('刑期起日')),
        termEnd: headers.findIndex(h => String(h).includes('现刑期止日')),
        clause: headers.findIndex(h => String(h).includes('适用条款')),
        reason: headers.findIndex(h => String(h).includes('严管教育原因')),
        days: headers.findIndex(h => String(h).includes('严管天数')),
        startDate: headers.findIndex(h => String(h).includes('严管起日')),
        endDate: headers.findIndex(h => String(h).includes('严管止日')),
        status: headers.findIndex(h => String(h).includes('业务状态'))
    }

    for (let i = 1; i < data.length; i++) {
        const row = data[i]
        if (!row || !row[colMap.prisonerId]) continue

        const prisonerId = String(row[colMap.prisonerId]).trim()

        // 罪犯基本信息
        prisoners.push({
            prisoner_id: prisonerId,
            name: row[colMap.name],
            gender: row[colMap.gender],
            birth_date: formatDate(row[colMap.birthDate]),
            ethnicity: row[colMap.ethnicity],
            education: row[colMap.education],
            sentence_type: row[colMap.sentenceType],
            crime: row[colMap.crime],
            original_term: row[colMap.originalTerm],
            term_start: formatDate(row[colMap.termStart]),
            term_end: formatDate(row[colMap.termEnd]),
            prison_unit: row[colMap.prisonUnit],
            prison_area: row[colMap.prisonArea]
        })

        // 严管教育记录
        records.push({
            prisoner_id: prisonerId,
            create_date: formatDate(row[colMap.createDate]),
            applicable_clause: row[colMap.clause],
            reason: row[colMap.reason],
            days: parseInt(row[colMap.days]) || null,
            start_date: formatDate(row[colMap.startDate]),
            end_date: formatDate(row[colMap.endDate]),
            status: row[colMap.status] || '待审核'
        })
    }

    return { type: 'strict_education', prisoners, records }
}

/**
 * 解析禁闭审批数据
 */
function parseConfinement(data) {
    const headers = data[0]
    const records = []
    const prisoners = []

    const colMap = {
        createDate: headers.findIndex(h => String(h).includes('制单时间')),
        prisonUnit: headers.findIndex(h => String(h).includes('所属单位')),
        prisonArea: headers.findIndex(h => String(h).includes('所属监区')),
        name: headers.findIndex(h => String(h).includes('罪犯姓名')),
        prisonerId: headers.findIndex(h => String(h).includes('罪犯编号')),
        gender: headers.findIndex(h => String(h).includes('性别')),
        birthDate: headers.findIndex(h => String(h).includes('出生日期')),
        ethnicity: headers.findIndex(h => String(h).includes('民族')),
        education: headers.findIndex(h => String(h).includes('文化程度')),
        sentenceType: headers.findIndex(h => String(h).includes('刑种')),
        crime: headers.findIndex(h => String(h).includes('罪名')),
        originalTerm: headers.findIndex(h => String(h).includes('原判刑期')),
        termStart: headers.findIndex(h => String(h).includes('现刑期起日')),
        termEnd: headers.findIndex(h => String(h).includes('现刑期止日')),
        startDate: headers.findIndex(h => String(h).includes('禁闭起日')),
        endDate: headers.findIndex(h => String(h).includes('禁闭止日')),
        clause: headers.findIndex(h => String(h).includes('适用条款')),
        violation: headers.findIndex(h => String(h).includes('违规事实')),
        status: headers.findIndex(h => String(h).includes('业务状态'))
    }

    for (let i = 1; i < data.length; i++) {
        const row = data[i]
        if (!row || !row[colMap.prisonerId]) continue

        const prisonerId = String(row[colMap.prisonerId]).trim()

        prisoners.push({
            prisoner_id: prisonerId,
            name: row[colMap.name],
            gender: row[colMap.gender],
            birth_date: formatDate(row[colMap.birthDate]),
            ethnicity: row[colMap.ethnicity],
            education: row[colMap.education],
            sentence_type: row[colMap.sentenceType],
            crime: row[colMap.crime],
            original_term: row[colMap.originalTerm],
            term_start: formatDate(row[colMap.termStart]),
            term_end: formatDate(row[colMap.termEnd]),
            prison_unit: row[colMap.prisonUnit],
            prison_area: row[colMap.prisonArea]
        })

        records.push({
            prisoner_id: prisonerId,
            create_date: formatDate(row[colMap.createDate]),
            start_date: formatDate(row[colMap.startDate]),
            end_date: formatDate(row[colMap.endDate]),
            applicable_clause: row[colMap.clause],
            violation_fact: row[colMap.violation],
            status: row[colMap.status] || '待审核'
        })
    }

    return { type: 'confinement', prisoners, records }
}

/**
 * 解析戒具使用审批数据
 */
function parseRestraintUsage(data) {
    const headers = data[0]
    const records = []
    const prisoners = []

    const colMap = {
        createDate: headers.findIndex(h => String(h).includes('制单时间')),
        prisonUnit: headers.findIndex(h => String(h).includes('所属单位')),
        prisonArea: headers.findIndex(h => String(h).includes('所属监区')),
        name: headers.findIndex(h => String(h).includes('姓名')),
        prisonerId: headers.findIndex(h => String(h).includes('罪犯编号')),
        restraintName: headers.findIndex(h => String(h).includes('戒具名称') || String(h).includes('警戒具')),
        clause: headers.findIndex(h => String(h).includes('使用条款')),
        days: headers.findIndex(h => String(h).includes('天数')),
        startDate: headers.findIndex(h => String(h).includes('使用起日')),
        endDate: headers.findIndex(h => String(h).includes('使用止日')),
        status: headers.findIndex(h => String(h).includes('业务状态'))
    }

    for (let i = 1; i < data.length; i++) {
        const row = data[i]
        if (!row || !row[colMap.prisonerId]) continue

        const prisonerId = String(row[colMap.prisonerId]).trim()

        prisoners.push({
            prisoner_id: prisonerId,
            name: row[colMap.name],
            prison_unit: row[colMap.prisonUnit],
            prison_area: row[colMap.prisonArea]
        })

        records.push({
            prisoner_id: prisonerId,
            create_date: formatDate(row[colMap.createDate]),
            restraint_name: row[colMap.restraintName],
            applicable_clause: row[colMap.clause],
            days: parseInt(row[colMap.days]) || null,
            start_date: formatDate(row[colMap.startDate]),
            end_date: formatDate(row[colMap.endDate]),
            status: row[colMap.status] || '待审核'
        })
    }

    return { type: 'restraint', prisoners, records }
}

/**
 * 解析信件汇总数据
 */
function parseMailRecord(data) {
    const headers = data[0]
    const records = []

    const colMap = {
        sequence: headers.findIndex(h => String(h).includes('序号')),
        openDate: headers.findIndex(h => String(h).includes('开箱日期')),
        prisonArea: headers.findIndex(h => String(h).includes('监区')),
        name: headers.findIndex(h => String(h).includes('罪犯') || String(h).includes('姓名') || String(h).includes('名字')),
        reason: headers.findIndex(h => String(h).includes('事由')),
        category: headers.findIndex(h => String(h).includes('类别')),
        remarks: headers.findIndex(h => String(h).includes('备注'))
    }

    for (let i = 1; i < data.length; i++) {
        const row = data[i]
        // 信件可能没有罪犯编号，用名字作为唯一标识
        if (!row || (!row[colMap.name] && !row[colMap.sequence])) continue

        records.push({
            sequence_no: parseInt(row[colMap.sequence]) || i,
            open_date: formatDate(row[colMap.openDate]),
            prison_area: row[colMap.prisonArea],
            prisoner_name: row[colMap.name],
            reason: row[colMap.reason],
            category: row[colMap.category],
            remarks: row[colMap.remarks]
        })
    }

    return { type: 'mail', records }
}

/**
 * 解析涉黑恶名单数据
 * 注意：此模板第一行是合并标题，真正的列名在第二行
 */
function parseBlacklist(data) {
    // 检查第一行是否为合并标题
    let headerRow = 0
    if (data[0].filter(c => c).length <= 1 && String(data[0][0]).includes('涉黑恶')) {
        headerRow = 1
    }

    const headers = data[headerRow]
    const records = []

    const colMap = {
        sequence: headers.findIndex(h => String(h).includes('序号')),
        prisonerId: headers.findIndex(h => String(h).includes('罪犯编号')),
        name: headers.findIndex(h => String(h).includes('姓名')),
        gender: headers.findIndex(h => String(h).includes('性别')),
        ethnicity: headers.findIndex(h => String(h).includes('民族')),
        birthDate: headers.findIndex(h => String(h).includes('出生日期')),
        nativePlace: headers.findIndex(h => String(h).includes('籍贯') || String(h).includes('国籍')),
        politicalStatus: headers.findIndex(h => String(h).includes('捕前面貌')),
        crime: headers.findIndex(h => String(h).includes('原判罪名')),
        originalTerm: headers.findIndex(h => String(h).includes('原判刑期') && !String(h).includes('起日') && !String(h).includes('止日')),
        termStart: headers.findIndex(h => String(h).includes('刑期起日')),
        termEnd: headers.findIndex(h => String(h).includes('刑期止日')),
        admissionDate: headers.findIndex(h => String(h).includes('入监日期')),
        involvementType: headers.findIndex(h => String(h).includes('三涉')),
        custodyStatus: headers.findIndex(h => String(h).includes('在押现状')),
        sentenceChange: headers.findIndex(h => String(h).includes('刑罚变动'))
    }

    for (let i = headerRow + 1; i < data.length; i++) {
        const row = data[i]
        if (!row || !row[colMap.prisonerId]) continue

        const prisonerId = String(row[colMap.prisonerId]).trim()

        records.push({
            prisoner_id: prisonerId,
            name: row[colMap.name],
            gender: row[colMap.gender],
            ethnicity: row[colMap.ethnicity],
            birth_date: formatDate(row[colMap.birthDate]),
            native_place: row[colMap.nativePlace],
            political_status: row[colMap.politicalStatus],
            crime: row[colMap.crime],
            original_term: row[colMap.originalTerm],
            term_start: formatDate(row[colMap.termStart]),
            term_end: formatDate(row[colMap.termEnd]),
            admission_date: formatDate(row[colMap.admissionDate]),
            involvement_type: row[colMap.involvementType],
            custody_status: row[colMap.custodyStatus],
            sentence_change: row[colMap.sentenceChange]
        })
    }

    return { type: 'blacklist', records }
}

/**
 * 解析Excel文件
 * @param {string} filePath - 文件路径
 * @param {string} filename - 原始文件名
 * @returns {Object} 解析结果
 */
function parseExcelTemplate(filePath, filename) {
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (data.length <= 1) {
        return { error: '文件内容为空或只有标题行', count: 0 }
    }

    // 自动识别模板类型
    const templateType = detectTemplateType(filename, data[0])

    if (!templateType) {
        return { error: '无法识别模板类型', count: 0 }
    }

    // 根据类型调用对应解析函数
    switch (templateType) {
        case 'strict_education':
            return parseStrictEducation(data)
        case 'confinement':
            return parseConfinement(data)
        case 'restraint':
            return parseRestraintUsage(data)
        case 'mail':
            return parseMailRecord(data)
        case 'blacklist':
            return parseBlacklist(data)
        case 'report':
            return { type: 'report', message: '犯情动态报告仅存储文件，不解析数据' }
        default:
            return { error: '不支持的模板类型', count: 0 }
    }
}

module.exports = {
    parseExcelTemplate,
    detectTemplateType,
    parseStrictEducation,
    parseConfinement,
    parseRestraintUsage,
    parseMailRecord,
    parseBlacklist,
    parseDate,
    formatDate
}
