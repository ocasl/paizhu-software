/**
 * 验证 upload_month 字段是否正确保存
 */
require('dotenv').config()
const { sequelize } = require('./models')

async function verify() {
    try {
        console.log('================================================================================')
        console.log('验证 upload_month 字段')
        console.log('================================================================================\n')

        const tables = [
            'strict_educations',
            'confinements',
            'blacklists',
            'restraint_usages',
            'mail_records'
        ]

        for (const table of tables) {
            console.log(`【${table}】`)
            
            // 查询示例数据（信件表没有 prisoner_id）
            const idField = table === 'mail_records' ? 'id' : 'prisoner_id'
            const [results] = await sequelize.query(`
                SELECT ${idField}, prison_name, upload_month, created_at
                FROM ${table}
                WHERE prison_name = '女子监狱'
                LIMIT 3
            `)

            if (results.length > 0) {
                console.log(`  ✅ 找到 ${results.length} 条数据`)
                results.forEach((row, index) => {
                    const uploadMonthStatus = row.upload_month ? '✓' : '❌ NULL'
                    const idValue = row.prisoner_id || row.id
                    console.log(`  [${index + 1}] ${idField}: ${idValue}, upload_month: ${row.upload_month} ${uploadMonthStatus}`)
                })
            } else {
                console.log('  ⚠️  没有数据')
            }
            console.log()
        }

        console.log('================================================================================')
        console.log('验证完成')
        console.log('================================================================================')

        process.exit(0)
    } catch (error) {
        console.error('❌ 验证失败:', error.message)
        process.exit(1)
    }
}

verify()
