/**
 * 测试 upload_month 字段是否能正确保存
 */
require('dotenv').config()
const { StrictEducation, Confinement, sequelize } = require('./models')

async function testInsert() {
    try {
        console.log('================================================================================')
        console.log('测试 upload_month 字段插入')
        console.log('================================================================================\n')

        // 测试数据
        const testData = {
            prisoner_id: 'TEST001',
            prison_name: '测试监狱',
            upload_month: '2026-02',
            create_date: '2026-02-01',
            reason: '测试严管教育',
            days: 7,
            start_date: '2026-02-01',
            end_date: '2026-02-07',
            sync_batch: 'test-batch',
            synced_at: new Date()
        }

        console.log('【测试1：插入数据】')
        console.log('测试数据:', JSON.stringify(testData, null, 2))
        console.log()

        // 先删除可能存在的测试数据
        await StrictEducation.destroy({
            where: {
                prisoner_id: 'TEST001',
                prison_name: '测试监狱'
            }
        })

        // 插入测试数据
        const created = await StrictEducation.create(testData)
        console.log('✅ 插入成功，ID:', created.id)
        console.log()

        console.log('【测试2：查询数据】')
        const found = await StrictEducation.findOne({
            where: {
                prisoner_id: 'TEST001',
                prison_name: '测试监狱'
            }
        })

        if (found) {
            console.log('✅ 查询成功')
            console.log('  prisoner_id:', found.prisoner_id)
            console.log('  prison_name:', found.prison_name)
            console.log('  upload_month:', found.upload_month, found.upload_month ? '✓' : '❌ NULL')
            console.log('  create_date:', found.create_date)
            console.log()

            if (found.upload_month === '2026-02') {
                console.log('🎉 upload_month 字段保存成功！')
            } else {
                console.log('❌ upload_month 字段保存失败，值为:', found.upload_month)
            }
        } else {
            console.log('❌ 查询失败，数据未找到')
        }
        console.log()

        console.log('【测试3：直接SQL查询】')
        const [results] = await sequelize.query(`
            SELECT prisoner_id, prison_name, upload_month, create_date
            FROM strict_educations
            WHERE prisoner_id = 'TEST001' AND prison_name = '测试监狱'
        `)

        if (results.length > 0) {
            console.log('SQL查询结果:', results[0])
            console.log('  upload_month:', results[0].upload_month, results[0].upload_month ? '✓' : '❌ NULL')
        }
        console.log()

        console.log('【测试4：清理测试数据】')
        await StrictEducation.destroy({
            where: {
                prisoner_id: 'TEST001',
                prison_name: '测试监狱'
            }
        })
        console.log('✅ 测试数据已清理')
        console.log()

        console.log('================================================================================')
        console.log('测试完成')
        console.log('================================================================================')

        process.exit(0)
    } catch (error) {
        console.error('❌ 测试失败:', error.message)
        console.error(error)
        process.exit(1)
    }
}

testInsert()
