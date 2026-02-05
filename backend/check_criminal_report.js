/**
 * 检查犯情动态数据
 */
const { CriminalReport } = require('./models')

async function checkCriminalReport() {
    try {
        const reports = await CriminalReport.findAll({
            order: [['createdAt', 'DESC']],
            limit: 5
        })
        
        console.log('='.repeat(80))
        console.log('犯情动态数据检查')
        console.log('='.repeat(80))
        
        if (reports.length === 0) {
            console.log('❌ 没有找到任何犯情动态数据')
            return
        }
        
        reports.forEach((report, index) => {
            console.log(`\n【记录 ${index + 1}】`)
            console.log('监狱:', report.prison_name)
            console.log('月份:', report.report_month)
            console.log('在押罪犯总数:', report.total_prisoners)
            console.log('重大刑事犯:', report.major_criminal)
            console.log('死缓犯:', report.death_suspended)
            console.log('无期犯:', report.life_sentence)
            console.log('涉黑罪犯:', report.gang_related)
            console.log('涉恶罪犯:', report.evil_related)
            console.log('新收押罪犯:', report.newly_admitted)
            console.log('违规人数:', report.violation_count)
            console.log('禁闭人数:', report.confinement_count)
            console.log('警告人数:', report.warning_count)
            console.log('脱逃:', report.has_escape ? '有' : '无')
            console.log('重大案件:', report.has_major_case ? '有' : '无')
            console.log('狱内发案:', report.has_internal_case ? '有' : '无')
            console.log('上传时间:', report.createdAt)
        })
        
        console.log('\n' + '='.repeat(80))
        
    } catch (error) {
        console.error('检查失败:', error)
    } finally {
        process.exit(0)
    }
}

checkCriminalReport()
