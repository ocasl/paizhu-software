/**
 * 检查所有Excel数据表
 */
const { sequelize } = require('./models')

async function checkAllTables() {
    try {
        console.log('='.repeat(80))
        console.log('检查所有Excel数据表（不限制监狱和月份）')
        console.log('='.repeat(80))
        
        // 1. 严管教育
        console.log('\n【1. strict_educations 表】')
        const [strictEducations] = await sequelize.query(`
            SELECT prison_name, upload_month, COUNT(*) as count
            FROM strict_educations
            GROUP BY prison_name, upload_month
            ORDER BY upload_month DESC
            LIMIT 10
        `)
        
        if (strictEducations.length > 0) {
            console.log('✅ 找到数据:')
            strictEducations.forEach(row => {
                console.log(`  ${row.prison_name} - ${row.upload_month}: ${row.count}条`)
            })
        } else {
            console.log('❌ 表中没有任何数据')
        }
        
        // 2. 禁闭
        console.log('\n【2. confinements 表】')
        const [confinements] = await sequelize.query(`
            SELECT prison_name, upload_month, COUNT(*) as count
            FROM confinements
            GROUP BY prison_name, upload_month
            ORDER BY upload_month DESC
            LIMIT 10
        `)
        
        if (confinements.length > 0) {
            console.log('✅ 找到数据:')
            confinements.forEach(row => {
                console.log(`  ${row.prison_name} - ${row.upload_month}: ${row.count}条`)
            })
        } else {
            console.log('❌ 表中没有任何数据')
        }
        
        // 3. 涉黑恶
        console.log('\n【3. blacklists 表】')
        const [blacklists] = await sequelize.query(`
            SELECT prison_name, upload_month, COUNT(*) as count
            FROM blacklists
            GROUP BY prison_name, upload_month
            ORDER BY upload_month DESC
            LIMIT 10
        `)
        
        if (blacklists.length > 0) {
            console.log('✅ 找到数据:')
            blacklists.forEach(row => {
                console.log(`  ${row.prison_name} - ${row.upload_month}: ${row.count}条`)
            })
        } else {
            console.log('❌ 表中没有任何数据')
        }
        
        // 4. 戒具使用
        console.log('\n【4. restraint_usages 表】')
        const [restraintUsages] = await sequelize.query(`
            SELECT prison_name, upload_month, COUNT(*) as count
            FROM restraint_usages
            GROUP BY prison_name, upload_month
            ORDER BY upload_month DESC
            LIMIT 10
        `)
        
        if (restraintUsages.length > 0) {
            console.log('✅ 找到数据:')
            restraintUsages.forEach(row => {
                console.log(`  ${row.prison_name} - ${row.upload_month}: ${row.count}条`)
            })
        } else {
            console.log('❌ 表中没有任何数据')
        }
        
        // 5. 信件
        console.log('\n【5. mail_records 表】')
        const [mailRecords] = await sequelize.query(`
            SELECT prison_name, upload_month, COUNT(*) as count
            FROM mail_records
            GROUP BY prison_name, upload_month
            ORDER BY upload_month DESC
            LIMIT 10
        `)
        
        if (mailRecords.length > 0) {
            console.log('✅ 找到数据:')
            mailRecords.forEach(row => {
                console.log(`  ${row.prison_name} - ${row.upload_month}: ${row.count}条`)
            })
        } else {
            console.log('❌ 表中没有任何数据')
        }
        
        console.log('\n' + '='.repeat(80))
        
    } catch (error) {
        console.error('检查失败:', error)
    } finally {
        process.exit(0)
    }
}

checkAllTables()
