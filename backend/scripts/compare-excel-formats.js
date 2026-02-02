/**
 * 比较 muban 和 test_templates 文件夹中的 Excel 文件格式
 * 找出为什么 muban 文件无法识别
 */
const XLSX = require('xlsx')
const path = require('path')
const fs = require('fs')

// 文件路径
const mubanDir = path.join(__dirname, '../../muban')
const testTemplatesDir = path.join(__dirname, '../../test_templates')

// Excel 文件列表
const excelFiles = [
    '严管教育审批.xlsx',
    '禁闭审批.xlsx',
    '戒具使用审批.xlsx',
    '信件汇总.xlsx',
    '涉黑恶名单.xls'
]

console.log('='.repeat(80))
console.log('Excel 文件格式对比分析')
console.log('='.repeat(80))

for (const filename of excelFiles) {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`文件: ${filename}`)
    console.log('='.repeat(80))

    // muban 文件
    const mubanPath = path.join(mubanDir, filename)
    // test_templates 文件名格式：严管教育_测试.xlsx（不是严管教育审批_测试.xlsx）
    let testFilename = filename
        .replace('审批.xlsx', '_测试.xlsx')
        .replace('汇总.xlsx', '_测试.xlsx')
        .replace('名单.xls', '_测试.xlsx')
    const testPath = path.join(testTemplatesDir, testFilename)

    console.log(`\nmuban 路径: ${mubanPath}`)
    console.log(`test_templates 路径: ${testPath}`)

    // 检查文件是否存在
    const mubanExists = fs.existsSync(mubanPath)
    const testExists = fs.existsSync(testPath)

    console.log(`\nmuban 文件存在: ${mubanExists}`)
    console.log(`test_templates 文件存在: ${testExists}`)

    if (!mubanExists && !testExists) {
        console.log('⚠️ 两个文件都不存在，跳过')
        continue
    }

    // 读取 muban 文件
    if (mubanExists) {
        try {
            console.log('\n--- muban 文件分析 ---')
            const workbook = XLSX.readFile(mubanPath)
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

            console.log(`工作表名称: ${sheetName}`)
            console.log(`总行数: ${data.length}`)
            console.log(`标题行 (第1行):`, data[0])
            if (data.length > 1) {
                console.log(`第2行:`, data[1])
            }
            if (data.length > 2) {
                console.log(`第3行:`, data[2])
            }
        } catch (error) {
            console.error(`❌ 读取 muban 文件失败:`, error.message)
        }
    }

    // 读取 test_templates 文件
    if (testExists) {
        try {
            console.log('\n--- test_templates 文件分析 ---')
            const workbook = XLSX.readFile(testPath)
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

            console.log(`工作表名称: ${sheetName}`)
            console.log(`总行数: ${data.length}`)
            console.log(`标题行 (第1行):`, data[0])
            if (data.length > 1) {
                console.log(`第2行:`, data[1])
            }
            if (data.length > 2) {
                console.log(`第3行:`, data[2])
            }
        } catch (error) {
            console.error(`❌ 读取 test_templates 文件失败:`, error.message)
        }
    }

    // 对比列名
    if (mubanExists && testExists) {
        try {
            const mubanWorkbook = XLSX.readFile(mubanPath)
            const mubanData = XLSX.utils.sheet_to_json(mubanWorkbook.Sheets[mubanWorkbook.SheetNames[0]], { header: 1 })

            const testWorkbook = XLSX.readFile(testPath)
            const testData = XLSX.utils.sheet_to_json(testWorkbook.Sheets[testWorkbook.SheetNames[0]], { header: 1 })

            console.log('\n--- 列名对比 ---')
            const mubanHeaders = mubanData[0] || []
            const testHeaders = testData[0] || []

            console.log(`muban 列数: ${mubanHeaders.length}`)
            console.log(`test_templates 列数: ${testHeaders.length}`)

            // 找出差异
            const mubanOnly = mubanHeaders.filter(h => !testHeaders.includes(h))
            const testOnly = testHeaders.filter(h => !mubanHeaders.includes(h))

            if (mubanOnly.length > 0) {
                console.log(`\n⚠️ 仅在 muban 中存在的列:`, mubanOnly)
            }
            if (testOnly.length > 0) {
                console.log(`\n⚠️ 仅在 test_templates 中存在的列:`, testOnly)
            }

            if (mubanOnly.length === 0 && testOnly.length === 0) {
                console.log('\n✅ 列名完全一致')
            }
        } catch (error) {
            console.error(`❌ 对比失败:`, error.message)
        }
    }
}

console.log('\n' + '='.repeat(80))
console.log('分析完成')
console.log('='.repeat(80))
