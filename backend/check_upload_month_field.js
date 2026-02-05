/**
 * 检查Excel数据表是否有 upload_month 字段
 */
require('dotenv').config()
const { sequelize } = require('./models')

async function checkFields() {
    try {
        console.log('================================================================================')
        console.log('检查Excel数据表的 upload_month 字段')
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
            
            const [results] = await sequelize.query(`
                SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = 'paizhu_db'
                AND TABLE_NAME = '${table}'
                AND COLUMN_NAME = 'upload_month'
            `)

            if (results.length > 0) {
                console.log('  ✅ upload_month 字段存在')
                console.log('  类型:', results[0].DATA_TYPE)
                console.log('  注释:', results[0].COLUMN_COMMENT)
            } else {
                console.log('  ❌ upload_month 字段不存在')
                console.log('  需要执行: backend/add_upload_month.sql')
            }
            console.log()
        }

        console.log('================================================================================')
        console.log('检查完成')
        console.log('================================================================================')

        process.exit(0)
    } catch (error) {
        console.error('检查失败:', error.message)
        process.exit(1)
    }
}

checkFields()
