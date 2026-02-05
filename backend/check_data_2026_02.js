/**
 * 检查女子监狱 2026-02 的数据
 */
require('dotenv').config()
const { sequelize } = require('./models')

async function checkData() {
    try {
        console.log('='.repeat(80))
        console.log('检查女子监狱 2026-02 的数据')
        console.log('='.repeat(80))
        
        const prisonName = '女子监狱'
        const month = '2026-02'
        
        // 1. 检查 monthly_basic_info 表
        console.log('\n【1. monthly_basic_info 表】')
        const [basicInfo] = await sequelize.query(`
            SELECT * FROM monthly_basic_info
            WHERE prison_name = :prisonName AND report_month = :month
        `, {
            replacements: { prisonName, month }
        })
        
        if (basicInfo.length > 0) {
            const info = basicInfo[0]
            console.log('✅ 找到数据:')
            console.log('  在押罪犯总数:', info.total_prisoners)
            console.log('  重大刑事犯:', info.major_criminals)
            console.log('  死缓犯:', info.death_sentence)
            console.log('  无期犯:', info.life_sentence)
            console.log('  涉黑罪犯:', info.gang_related)
            console.log('  涉恶罪犯:', info.evil_forces)
            console.log('  新收押罪犯:', info.new_admissions)
            console.log('  禁闭人数:', info.confinement_punishments)
            console.log('  记过人数:', info.recorded_punishments)
            console.log('  更新时间:', info.updated_at)
        } else {
            console.log('❌ 没有找到数据')
        }
        
        // 2. 检查 criminal_reports 表
        console.log('\n【2. criminal_reports 表（犯情动态）】')
        const [criminalReports] = await sequelize.query(`
            SELECT * FROM criminal_reports
            WHERE prison_name = :prisonName AND report_month = :month
        `, {
            replacements: { prisonName, month }
        })
        
        if (criminalReports.length > 0) {
            const report = criminalReports[0]
            console.log('✅ 找到犯情动态数据:')
            console.log('  在押罪犯总数:', report.total_prisoners)
            console.log('  涉黑罪犯:', report.gang_related)
            console.log('  涉恶罪犯:', report.evil_related)
            console.log('  禁闭人数:', report.confinement_count)
            console.log('  警告人数:', report.warning_count)
            console.log('  文件名:', report.original_filename)
            console.log('  上传时间:', report.synced_at)
        } else {
            console.log('❌ 没有找到犯情动态数据')
        }
        
        // 3. 检查 blacklists 表（涉黑恶名单）
        console.log('\n【3. blacklists 表（涉黑恶名单）】')
        const [blacklists] = await sequelize.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN involvement_type LIKE '%涉黑%' THEN 1 END) as gang_count,
                COUNT(CASE WHEN involvement_type LIKE '%涉恶%' THEN 1 END) as evil_count
            FROM blacklists
            WHERE prison_name = :prisonName AND upload_month = :month
        `, {
            replacements: { prisonName, month }
        })
        
        if (blacklists.length > 0 && blacklists[0].total > 0) {
            console.log('✅ 找到涉黑恶名单数据:')
            console.log('  总数:', blacklists[0].total)
            console.log('  涉黑:', blacklists[0].gang_count)
            console.log('  涉恶:', blacklists[0].evil_count)
        } else {
            console.log('❌ 没有找到涉黑恶名单数据')
        }
        
        // 4. 检查 confinements 表（禁闭）
        console.log('\n【4. confinements 表（禁闭）】')
        const [confinements] = await sequelize.query(`
            SELECT COUNT(DISTINCT prisoner_id) as count
            FROM confinements
            WHERE prison_name = :prisonName AND upload_month = :month
        `, {
            replacements: { prisonName, month }
        })
        
        if (confinements.length > 0 && confinements[0].count > 0) {
            console.log('✅ 找到禁闭数据:')
            console.log('  禁闭人数:', confinements[0].count)
        } else {
            console.log('❌ 没有找到禁闭数据')
        }
        
        // 5. 检查 strict_educations 表（严管教育）
        console.log('\n【5. strict_educations 表（严管教育）】')
        const [strictEducations] = await sequelize.query(`
            SELECT COUNT(DISTINCT prisoner_id) as count
            FROM strict_educations
            WHERE prison_name = :prisonName AND upload_month = :month
        `, {
            replacements: { prisonName, month }
        })
        
        if (strictEducations.length > 0 && strictEducations[0].count > 0) {
            console.log('✅ 找到严管教育数据:')
            console.log('  严管人数:', strictEducations[0].count)
        } else {
            console.log('❌ 没有找到严管教育数据')
        }
        
        // 6. 检查 restraint_usages 表（戒具使用）
        console.log('\n【6. restraint_usages 表（戒具使用）】')
        const [restraintUsages] = await sequelize.query(`
            SELECT COUNT(DISTINCT prisoner_id) as count
            FROM restraint_usages
            WHERE prison_name = :prisonName AND upload_month = :month
        `, {
            replacements: { prisonName, month }
        })
        
        if (restraintUsages.length > 0 && restraintUsages[0].count > 0) {
            console.log('✅ 找到戒具使用数据:')
            console.log('  戒具使用人数:', restraintUsages[0].count)
        } else {
            console.log('❌ 没有找到戒具使用数据')
        }
        
        // 7. 检查 mail_records 表（信件）
        console.log('\n【7. mail_records 表（信件）】')
        const [mailRecords] = await sequelize.query(`
            SELECT COUNT(*) as count
            FROM mail_records
            WHERE prison_name = :prisonName AND upload_month = :month
        `, {
            replacements: { prisonName, month }
        })
        
        if (mailRecords.length > 0 && mailRecords[0].count > 0) {
            console.log('✅ 找到信件数据:')
            console.log('  信件数量:', mailRecords[0].count)
        } else {
            console.log('❌ 没有找到信件数据')
        }
        
        console.log('\n' + '='.repeat(80))
        console.log('检查完成！')
        console.log('='.repeat(80))
        
    } catch (error) {
        console.error('检查失败:', error)
    } finally {
        process.exit(0)
    }
}

checkData()
