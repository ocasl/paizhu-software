/**
 * 检查附件数据完整性
 */
const { Attachment, DailyLog } = require('./models')
const { Op } = require('sequelize')

async function checkAttachments() {
    try {
        console.log('='.repeat(80))
        console.log('附件数据完整性检查')
        console.log('='.repeat(80))
        
        // 1. 统计所有附件
        const totalAttachments = await Attachment.count()
        console.log(`\n📊 总附件数: ${totalAttachments}`)
        
        // 2. 按分类统计
        const categories = await Attachment.findAll({
            attributes: [
                'category',
                [Attachment.sequelize.fn('COUNT', '*'), 'count']
            ],
            group: ['category']
        })
        
        console.log('\n📁 按分类统计:')
        categories.forEach(cat => {
            console.log(`  ${cat.category || '未分类'}: ${cat.get('count')} 个`)
        })
        
        // 3. 检查关联状态
        const withRelation = await Attachment.count({
            where: {
                related_log_id: { [Op.ne]: null }
            }
        })
        const withoutRelation = totalAttachments - withRelation
        
        console.log('\n🔗 关联状态:')
        console.log(`  已关联到日志: ${withRelation} 个`)
        console.log(`  未关联: ${withoutRelation} 个`)
        
        // 4. 检查 upload_month 字段
        const withUploadMonth = await Attachment.count({
            where: {
                upload_month: { [Op.ne]: null }
            }
        })
        const withoutUploadMonth = totalAttachments - withUploadMonth
        
        console.log('\n📅 归档月份:')
        console.log(`  已设置 upload_month: ${withUploadMonth} 个`)
        console.log(`  未设置 upload_month: ${withoutUploadMonth} 个`)
        
        // 5. 按月份统计
        const byMonth = await Attachment.findAll({
            attributes: [
                'upload_month',
                [Attachment.sequelize.fn('COUNT', '*'), 'count']
            ],
            where: {
                upload_month: { [Op.ne]: null }
            },
            group: ['upload_month'],
            order: [['upload_month', 'DESC']]
        })
        
        console.log('\n📆 按月份统计:')
        byMonth.forEach(month => {
            console.log(`  ${month.upload_month}: ${month.get('count')} 个`)
        })
        
        // 6. 检查日检察附件
        const dailyAttachments = await Attachment.findAll({
            where: {
                category: 'daily_log'
            },
            order: [['created_at', 'DESC']],
            limit: 10
        })
        
        console.log('\n📎 最近10个日检察附件:')
        dailyAttachments.forEach(att => {
            console.log(`  ID: ${att.id}`)
            console.log(`    文件名: ${att.original_name}`)
            console.log(`    关联日志ID: ${att.related_log_id || '未关联'}`)
            console.log(`    关联类型: ${att.related_log_type || '未设置'}`)
            console.log(`    归档月份: ${att.upload_month || '未设置'}`)
            console.log(`    上传时间: ${att.created_at}`)
            console.log('')
        })
        
        // 7. 检查孤儿附件（有 related_log_id 但日志不存在）
        const attachmentsWithLogId = await Attachment.findAll({
            where: {
                related_log_type: 'daily',
                related_log_id: { [Op.ne]: null }
            },
            attributes: ['id', 'related_log_id', 'original_name']
        })
        
        let orphanCount = 0
        for (const att of attachmentsWithLogId) {
            const log = await DailyLog.findByPk(att.related_log_id)
            if (!log) {
                orphanCount++
                console.log(`⚠️  孤儿附件: ID=${att.id}, 文件=${att.original_name}, 关联日志ID=${att.related_log_id}（日志不存在）`)
            }
        }
        
        if (orphanCount === 0) {
            console.log('\n✅ 没有发现孤儿附件')
        } else {
            console.log(`\n⚠️  发现 ${orphanCount} 个孤儿附件`)
        }
        
        // 8. 检查文件是否存在
        const fs = require('fs')
        const path = require('path')
        const recentAttachments = await Attachment.findAll({
            order: [['created_at', 'DESC']],
            limit: 20
        })
        
        let missingFiles = 0
        console.log('\n📂 检查最近20个附件的文件是否存在:')
        for (const att of recentAttachments) {
            let filePath
            if (path.isAbsolute(att.file_path)) {
                filePath = att.file_path
            } else {
                filePath = path.join(__dirname, att.file_path)
            }
            
            if (!fs.existsSync(filePath)) {
                missingFiles++
                console.log(`  ❌ 文件不存在: ${att.original_name} (${att.file_path})`)
            }
        }
        
        if (missingFiles === 0) {
            console.log('  ✅ 所有文件都存在')
        } else {
            console.log(`  ⚠️  ${missingFiles} 个文件不存在`)
        }
        
        console.log('\n' + '='.repeat(80))
        console.log('检查完成')
        console.log('='.repeat(80))
        
    } catch (error) {
        console.error('检查失败:', error)
    } finally {
        process.exit(0)
    }
}

checkAttachments()
