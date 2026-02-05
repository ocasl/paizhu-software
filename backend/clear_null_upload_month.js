/**
 * 清空 upload_month 为 null 的旧数据
 */
require('dotenv').config()
const { StrictEducation, Confinement, Blacklist, RestraintUsage, MailRecord, sequelize } = require('./models')

async function clearNullData() {
    try {
        console.log('================================================================================')
        console.log('清空 upload_month 为 null 的旧数据')
        console.log('================================================================================\n')

        const tables = [
            { model: StrictEducation, name: '严管教育' },
            { model: Confinement, name: '禁闭审批' },
            { model: Blacklist, name: '涉黑恶名单' },
            { model: RestraintUsage, name: '戒具使用' },
            { model: MailRecord, name: '信件汇总' }
        ]

        for (const { model, name } of tables) {
            // 统计 null 数据
            const nullCount = await model.count({
                where: {
                    upload_month: null
                }
            })

            if (nullCount > 0) {
                console.log(`【${name}】`)
                console.log(`  发现 ${nullCount} 条 upload_month 为 null 的数据`)
                
                // 删除
                const deleted = await model.destroy({
                    where: {
                        upload_month: null
                    }
                })
                
                console.log(`  ✅ 已删除 ${deleted} 条数据`)
            } else {
                console.log(`【${name}】`)
                console.log(`  ✅ 没有 upload_month 为 null 的数据`)
            }
            console.log()
        }

        console.log('================================================================================')
        console.log('清理完成！')
        console.log('================================================================================')
        console.log()
        console.log('接下来请：')
        console.log('1. 重启后端服务')
        console.log('2. 重新上传Excel文件')
        console.log('3. 验证数据: node backend/check_data_2026_02.js')
        console.log()

        process.exit(0)
    } catch (error) {
        console.error('❌ 清理失败:', error.message)
        console.error(error)
        process.exit(1)
    }
}

clearNullData()
