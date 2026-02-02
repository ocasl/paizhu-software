// 测试归档生成流程 - 模拟真实的归档下载过程
const fs = require('fs')
const path = require('path')
const { DailyLog, WeeklyRecord, MonthlyRecord } = require('./models')

async function testArchiveFlow() {
    try {
        console.log('=== 测试归档生成流程 ===\n')

        // 1. 获取最新的日志记录
        const logs = await DailyLog.findAll({
            limit: 3,
            order: [['created_at', 'DESC']]
        })

        console.log(`找到 ${logs.length} 条日志记录`)

        if (logs.length === 0) {
            console.log('没有日志记录，请先提交一些日志')
            return
        }

        // 显示日志数据结构
        const sampleLog = logs[0]
        console.log('\n最新日志数据:')
        console.log(JSON.stringify(sampleLog.toJSON(), null, 2))

        // 2. 使用 templateGenerator 生成
        const { generateLogFromTemplate } = require('./utils/templateGenerator')

        console.log('\n尝试使用模板生成...')
        const buffer = await generateLogFromTemplate(sampleLog.toJSON(), [], [])

        const outputPath = path.join(__dirname, 'test_real_log.docx')
        fs.writeFileSync(outputPath, buffer)
        console.log(`\n✅ 成功！输出文件: ${outputPath}`)

    } catch (error) {
        console.error('\n❌ 错误:', error.message)
        console.error(error.stack)
    }
}

testArchiveFlow()
