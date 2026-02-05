/**
 * 检查所有最近的附件
 */
const { Attachment } = require('./models')
const { Op } = require('sequelize')

async function checkAllRecentAttachments() {
    try {
        console.log('='.repeat(80))
        console.log('检查所有最近的附件（最近7天）')
        console.log('='.repeat(80))
        
        // 获取最近7天的所有附件
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const recentAttachments = await Attachment.findAll({
            where: {
                created_at: {
                    [Op.gte]: sevenDaysAgo
                }
            },
            order: [['created_at', 'DESC']]
        })
        
        console.log(`\n📊 最近7天共有 ${recentAttachments.length} 个附件\n`)
        
        // 按日期分组
        const byDate = {}
        recentAttachments.forEach(att => {
            const date = att.created_at ? att.created_at.toISOString().split('T')[0] : 'unknown'
            if (!byDate[date]) {
                byDate[date] = []
            }
            byDate[date].push(att)
        })
        
        // 显示每天的附件
        Object.keys(byDate).sort().reverse().forEach(date => {
            console.log(`\n📅 ${date} (${byDate[date].length} 个附件)`)
            console.log('-'.repeat(80))
            byDate[date].forEach((att, index) => {
                console.log(`${index + 1}. ${att.original_name}`)
                console.log(`   文件名: ${att.file_name}`)
                console.log(`   分类: ${att.category}`)
                console.log(`   大小: ${(att.file_size / 1024).toFixed(2)} KB`)
                console.log(`   upload_month: ${att.upload_month}`)
                console.log(`   user_id: ${att.user_id}`)
                console.log(`   created_at: ${att.created_at}`)
                console.log('')
            })
        })
        
        console.log('='.repeat(80))
        
    } catch (error) {
        console.error('检查失败:', error)
    } finally {
        process.exit(0)
    }
}

checkAllRecentAttachments()
