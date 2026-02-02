// 测试模板生成
const fs = require('fs')
const path = require('path')
const { generateLogFromTemplate } = require('./utils/templateGenerator')

const testLog = {
    log_date: '2026-01-16',
    prison_name: '南昌监狱',
    inspector_name: '张三',
    three_scenes: {
        labor: { checked: true, locations: ['一监区车间'] },
        living: { checked: false, locations: [] },
        study: { checked: false, locations: [] }
    },
    strict_control: { newCount: 2, totalCount: 5 },
    police_equipment: { checked: true, count: 3 },
    gang_prisoners: { newCount: 0, totalCount: 10 },
    admission: { inCount: 2, outCount: 1 },
    supervision_situation: '今日检察监督正常',
    feedback_situation: '无问题反馈',
    other_work: { supervisionSituation: '周检察完成', feedbackSituation: '无' }
}

async function test() {
    try {
        console.log('开始测试模板生成...')
        const buffer = await generateLogFromTemplate(testLog, [], [])
        const outputPath = path.join(__dirname, 'test_output.docx')
        fs.writeFileSync(outputPath, buffer)
        console.log(`✅ 成功生成测试文档: ${outputPath}`)
        console.log('请打开此文件检查格式是否正确')
    } catch (error) {
        console.error('❌ 生成失败:', error)
    }
}

test()
