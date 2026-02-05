/**
 * 检查指定日期的附件
 */
const { Attachment } = require('./models')
const { Op } = require('sequelize')

async function checkDateAttachments() {
    try {
        const date = '2026-02-05'
        const dateStr = date.replace(/-/g, '')  // 20260205
        
        console.log('='.repeat(80))
        console.log(`检查 ${date} 的附件`)
        console.log('='.repeat(80))
        
        // 方法1：文件名以日期开头
        const byFileName = await Attachment.findAll({
            where: {
                file_name: {
                    [Op.like]: `${dateStr}_%`
                }
            },
            order: [['created_at', 'DESC']]
        })
        
        console.log(`\n📁 方法1：文件名以 ${dateStr}_ 开头的附件: ${byFileName.length} 个`)
        byFileName.forEach(att => {
            console.log(`  - ${att.file_name}`)
            console.log(`    分类: ${att.category}`)
            console.log(`    upload_month: ${att.upload_month}`)
            console.log(`    created_at: ${att.created_at}`)
            console.log('')
        })
        
        // 方法2：创建时间在该日期
        const byCreatedAt = await Attachment.findAll({
            where: {
                created_at: {
                    [Op.between]: [
                        new Date(date + ' 00:00:00'),
                        new Date(date + ' 23:59:59')
                    ]
                }
            },
            order: [['created_at', 'DESC']]
        })
        
        console.log(`\n📅 方法2：创建时间在 ${date} 的附件: ${byCreatedAt.length} 个`)
        byCreatedAt.forEach(att => {
            console.log(`  - ${att.file_name}`)
            console.log(`    分类: ${att.category}`)
            console.log(`    upload_month: ${att.upload_month}`)
            console.log(`    created_at: ${att.created_at}`)
            console.log('')
        })
        
        // 合并去重
        const allIds = new Set([...byFileName.map(a => a.id), ...byCreatedAt.map(a => a.id)])
        console.log(`\n📊 合并后总数: ${allIds.size} 个`)
        
        // 所有附件
        const allAttachments = await Attachment.findAll({
            where: {
                id: { [Op.in]: Array.from(allIds) }
            },
            order: [['created_at', 'DESC']]
        })
        
        console.log('\n📋 完整列表:')
        allAttachments.forEach((att, index) => {
            console.log(`${index + 1}. ${att.original_name}`)
            console.log(`   文件名: ${att.file_name}`)
            console.log(`   分类: ${att.category}`)
            console.log(`   大小: ${(att.file_size / 1024).toFixed(2)} KB`)
            console.log(`   upload_month: ${att.upload_month}`)
            console.log(`   created_at: ${att.created_at}`)
            console.log('')
        })
        
        console.log('='.repeat(80))
        
    } catch (error) {
        console.error('检查失败:', error)
    } finally {
        process.exit(0)
    }
}

checkDateAttachments()
