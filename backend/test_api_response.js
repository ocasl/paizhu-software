/**
 * 测试API返回的数据（模拟前端请求）
 */
const { sequelize } = require('./models')

async function testAPI() {
    try {
        const prisonName = '女子监狱'
        const month = '2026-02'
        
        console.log('='.repeat(80))
        console.log('模拟前端请求 GET /api/monthly-basic-info/:month')
        console.log(`监狱: ${prisonName}, 月份: ${month}`)
        console.log('='.repeat(80))
        
        // 模拟 monthlyBasicInfo.js 的 GET 路由逻辑
        const [results] = await sequelize.query(`
            SELECT * FROM monthly_basic_info
            WHERE prison_name = :prisonName AND report_month = :month
            LIMIT 1
        `, {
            replacements: { prisonName, month }
        })
        
        if (results.length === 0) {
            console.log('\n❌ 数据库中没有找到记录')
            console.log('   应该会自动创建初始化记录')
            return
        }
        
        const basicInfo = results[0]
        
        // 检查是否有手动编辑的数据
        const hasManualData = basicInfo.total_prisoners > 0 || 
                             basicInfo.major_criminals > 0 ||
                             basicInfo.gang_related > 0
        
        console.log('\n【数据库原始数据】')
        console.log('  在押罪犯总数:', basicInfo.total_prisoners)
        console.log('  重大刑事犯:', basicInfo.major_criminals)
        console.log('  涉黑罪犯:', basicInfo.gang_related)
        console.log('  涉恶罪犯:', basicInfo.evil_forces)
        console.log('  禁闭人数:', basicInfo.confinement_punishments)
        console.log('  记过人数:', basicInfo.recorded_punishments)
        console.log('  是否有手动数据:', hasManualData ? '是' : '否')
        
        // 如果没有手动数据，会从犯情动态获取
        if (!hasManualData) {
            console.log('\n【会从犯情动态获取数据】')
            const [criminalReportData] = await sequelize.query(`
                SELECT * FROM criminal_reports
                WHERE prison_name = :prisonName AND report_month = :month
                LIMIT 1
            `, {
                replacements: { prisonName, month }
            })
            
            if (criminalReportData.length > 0) {
                const report = criminalReportData[0]
                console.log('  ✅ 找到犯情动态数据')
                console.log('  在押罪犯总数:', report.total_prisoners)
                console.log('  涉黑罪犯:', report.gang_related)
                console.log('  涉恶罪犯:', report.evil_related)
            }
            
            // 统计Excel数据
            console.log('\n【会统计Excel数据】')
            
            const [blacklistStats] = await sequelize.query(`
                SELECT 
                    COUNT(CASE WHEN involvement_type LIKE '%涉黑%' THEN 1 END) as gang_count,
                    COUNT(CASE WHEN involvement_type LIKE '%涉恶%' THEN 1 END) as evil_count,
                    COUNT(*) as total_count
                FROM blacklists
                WHERE prison_name = :prisonName AND upload_month = :month
            `, {
                replacements: { prisonName, month }
            })
            
            console.log('  涉黑恶名单:', blacklistStats[0].total_count, '条')
            
            const [confinementStats] = await sequelize.query(`
                SELECT COUNT(DISTINCT prisoner_id) as count
                FROM confinements
                WHERE prison_name = :prisonName AND upload_month = :month
            `, {
                replacements: { prisonName, month }
            })
            
            console.log('  禁闭人数:', confinementStats[0].count)
        } else {
            console.log('\n⚠️  有手动数据，不会从犯情动态和Excel获取')
        }
        
        console.log('\n' + '='.repeat(80))
        console.log('前端应该看到的数据:')
        console.log('  在押罪犯总数:', basicInfo.total_prisoners)
        console.log('  涉黑罪犯:', basicInfo.gang_related)
        console.log('  涉恶罪犯:', basicInfo.evil_forces)
        console.log('  禁闭人数:', basicInfo.confinement_punishments)
        console.log('='.repeat(80))
        
    } catch (error) {
        console.error('测试失败:', error)
    } finally {
        process.exit(0)
    }
}

testAPI()
