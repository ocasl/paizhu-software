/**
 * 清空Excel数据表（用于重新测试）
 */
const { sequelize } = require('./models')

async function clearData() {
    try {
        console.log('⚠️  准备清空Excel数据表...')
        
        await sequelize.query('DELETE FROM strict_educations WHERE prison_name = "女子监狱"')
        console.log('✅ 已清空 strict_educations')
        
        await sequelize.query('DELETE FROM confinements WHERE prison_name = "女子监狱"')
        console.log('✅ 已清空 confinements')
        
        await sequelize.query('DELETE FROM blacklists WHERE prison_name = "女子监狱"')
        console.log('✅ 已清空 blacklists')
        
        await sequelize.query('DELETE FROM restraint_usages WHERE prison_name = "女子监狱"')
        console.log('✅ 已清空 restraint_usages')
        
        await sequelize.query('DELETE FROM mail_records WHERE prison_name = "女子监狱"')
        console.log('✅ 已清空 mail_records')
        
        console.log('\n✅ 清空完成！现在可以重新上传测试了')
        
    } catch (error) {
        console.error('清空失败:', error)
    } finally {
        process.exit(0)
    }
}

clearData()
