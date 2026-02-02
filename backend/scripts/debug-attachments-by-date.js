/**
 * 调试按日期查询附件
 */
const { Attachment, sequelize } = require('../models')
const { Op } = require('sequelize')

async function debugAttachmentsByDate() {
    try {
        await sequelize.authenticate()
        console.log('✅ 数据库连接成功\n')
        
        // 测试日期：2026-01-12
        const testDate = '2026-01-12'
        const dateStr = testDate.replace(/-/g, '')  // 20260112
        
        console.log(`🔍 查询日期: ${testDate}`)
        console.log(`🔍 日期字符串: ${dateStr}\n`)
        
        // 查询所有附件，看看有哪些
        const allAttachments = await Attachment.findAll({
            order: [['createdAt', 'DESC']]
        })
        
        console.log(`📎 数据库中共有 ${allAttachments.length} 条附件记录\n`)
        
        // 显示每个附件的文件名和日期
        console.log('所有附件列表：')
        allAttachments.forEach((att, index) => {
            const createdDate = att.createdAt.toISOString().split('T')[0]
            console.log(`${index + 1}. ID: ${att.id}`)
            console.log(`   文件名: ${att.file_name}`)
            console.log(`   上传日期: ${createdDate}`)
            console.log(`   上传时间: ${att.createdAt}`)
            console.log('')
        })
        
        // 测试查询1：文件名以日期开头
        console.log(`\n🔍 测试查询1：文件名以 "${dateStr}_" 开头`)
        const query1 = await Attachment.findAll({
            where: {
                file_name: {
                    [Op.like]: `${dateStr}_%`
                }
            }
        })
        console.log(`   结果: ${query1.length} 条`)
        query1.forEach(att => {
            console.log(`   - ${att.file_name}`)
        })
        
        // 测试查询2：上传日期匹配
        console.log(`\n🔍 测试查询2：上传日期在 ${testDate} 00:00:00 到 23:59:59`)
        const query2 = await Attachment.findAll({
            where: {
                createdAt: {
                    [Op.between]: [
                        new Date(testDate + ' 00:00:00'),
                        new Date(testDate + ' 23:59:59')
                    ]
                }
            }
        })
        console.log(`   结果: ${query2.length} 条`)
        query2.forEach(att => {
            console.log(`   - ${att.file_name} (${att.createdAt})`)
        })
        
        // 测试查询3：组合查询（OR）
        console.log(`\n🔍 测试查询3：组合查询（文件名 OR 上传日期）`)
        const query3 = await Attachment.findAll({
            where: {
                [Op.or]: [
                    {
                        file_name: {
                            [Op.like]: `${dateStr}_%`
                        }
                    },
                    {
                        createdAt: {
                            [Op.between]: [
                                new Date(testDate + ' 00:00:00'),
                                new Date(testDate + ' 23:59:59')
                            ]
                        }
                    }
                ]
            }
        })
        console.log(`   结果: ${query3.length} 条`)
        query3.forEach(att => {
            console.log(`   - ${att.file_name}`)
        })
        
        process.exit(0)
    } catch (error) {
        console.error('❌ 错误:', error)
        process.exit(1)
    }
}

debugAttachmentsByDate()
