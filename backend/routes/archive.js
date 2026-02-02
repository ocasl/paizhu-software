/**
 * 月度归档路由
 * 审批、签名、打包下载
 */
const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const archiver = require('archiver')
const { MonthlyArchive, User, DailyLog, Attachment, WeeklyRecord, MonthlyRecord, ImmediateEvent } = require('../models')
const { authenticateToken, requireRole } = require('../middleware/auth')
const multer = require('multer')
const { Op } = require('sequelize')

// 配置签名图片上传
const signatureStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/signatures')
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        cb(null, dir)
    },
    filename: (req, file, cb) => {
        cb(null, `signature_${Date.now()}.png`)
    }
})
const uploadSignature = multer({ storage: signatureStorage })

// 认证中间件
router.use(authenticateToken)

/**
 * 获取月度归档列表
 */
router.get('/list', async (req, res) => {
    try {
        const { year, month, prison_name, status } = req.query
        const user = req.user

        const where = {}
        if (year) where.year = year
        if (month) where.month = month
        if (status) where.status = status

        // 非管理员只能看到自己派驻单位的归档
        if (user.role !== 'admin' && user.role !== 'leader') {
            where.prison_name = user.prison_name
        } else if (prison_name) {
            where.prison_name = prison_name
        }

        const archives = await MonthlyArchive.findAll({
            where,
            include: [
                { model: User, as: 'submitter', attributes: ['id', 'name', 'prison_name'] },
                { model: User, as: 'reviewer', attributes: ['id', 'name'] }
            ],
            order: [['year', 'DESC'], ['month', 'DESC']]
        })

        res.json({ success: true, data: archives })
    } catch (error) {
        console.error('获取归档列表失败:', error)
        res.status(500).json({ success: false, message: '获取归档列表失败' })
    }
})

/**
 * 获取或创建当月归档（只有检察官可以创建）
 */
router.get('/current', async (req, res) => {
    try {
        const user = req.user
        const now = new Date()
        const year = req.query.year || now.getFullYear()
        const month = req.query.month || (now.getMonth() + 1)
        
        // 确定要查询的监狱
        let targetPrison = req.query.prison_name || user.prison_name
        
        // 权限检查：确保有权查看该监狱
        const { getUserPrisonScope } = require('../middleware/permission')
        const prisonScope = await getUserPrisonScope(user.id, user.role)
        
        if (prisonScope !== 'ALL') {
            if (!Array.isArray(prisonScope) || !prisonScope.includes(targetPrison)) {
                return res.status(403).json({ 
                    success: false, 
                    message: '无权查看该监狱的归档' 
                })
            }
        }

        let archive = await MonthlyArchive.findOne({
            where: {
                year,
                month,
                prison_name: targetPrison
            }
        })

        if (!archive) {
            // 只有检察官可以创建新的归档记录
            if (user.role !== 'inspector') {
                return res.status(403).json({ 
                    success: false, 
                    message: '只有派驻检察官可以创建归档' 
                })
            }
            
            // 创建新的归档记录
            archive = await MonthlyArchive.create({
                year,
                month,
                prison_name: targetPrison,
                user_id: user.id,
                status: 'draft'
            })
        }

        res.json({ success: true, data: archive })
    } catch (error) {
        console.error('获取当月归档失败:', error)
        res.status(500).json({ success: false, message: '获取当月归档失败' })
    }
})

/**
 * 刷新归档统计（重新收集日志和附件数量）
 */
router.put('/refresh/:id', async (req, res) => {
    try {
        const archive = await MonthlyArchive.findByPk(req.params.id)

        if (!archive) {
            return res.status(404).json({ success: false, message: '归档记录不存在' })
        }

        // 获取同一派驻单位的所有用户ID
        const usersInSamePrison = await User.findAll({
            where: { prison_name: archive.prison_name },
            attributes: ['id']
        })
        const userIds = usersInSamePrison.map(u => u.id)

        // 统计该派驻单位下所有用户的日志数量
        const dailyLogCount = await DailyLog.count({
            where: {
                user_id: { [Op.in]: userIds },
                log_date: {
                    [Op.gte]: new Date(archive.year, archive.month - 1, 1),
                    [Op.lt]: new Date(archive.year, archive.month, 1)
                }
            }
        })

        // 统计附件数量(同时支持 upload_month 和 createdAt 两种方式)
        const targetMonth = `${archive.year}-${String(archive.month).padStart(2, '0')}`;
        
        // 方式1: 按 upload_month 统计(材料上传页面使用这个字段)
        const attachmentCountByMonth = await Attachment.count({
            where: {
                user_id: { [Op.in]: userIds },
                upload_month: targetMonth
            }
        })
        
        // 方式2: 按 createdAt 统计(平板同步等其他来源)
        const attachmentCountByDate = await Attachment.count({
            where: {
                user_id: { [Op.in]: userIds },
                [Op.or]: [
                    { upload_month: null },
                    { upload_month: '' }
                ],
                createdAt: {
                    [Op.gte]: new Date(archive.year, archive.month - 1, 1),
                    [Op.lt]: new Date(archive.year, archive.month, 1)
                }
            }
        })
        
        // 统计及时检察事件数量
        const immediateEventCount = await ImmediateEvent.count({
            where: {
                user_id: { [Op.in]: userIds },
                event_date: {
                    [Op.gte]: new Date(archive.year, archive.month - 1, 1),
                    [Op.lt]: new Date(archive.year, archive.month, 1)
                }
            }
        })
        
        // 总附件数 = 两种方式的总和
        const attachmentCount = attachmentCountByMonth + attachmentCountByDate

        await archive.update({
            daily_log_count: dailyLogCount,
            attachment_count: attachmentCount,
            immediate_event_count: immediateEventCount
        })

        res.json({
            success: true,
            data: archive,
            message: `已刷新：日志${dailyLogCount}条，附件${attachmentCount}个(按月${attachmentCountByMonth}+按日期${attachmentCountByDate})，及时检察${immediateEventCount}件`
        })
    } catch (error) {
        console.error('刷新归档失败:', error)
        res.status(500).json({ success: false, message: '刷新归档失败' })
    }
})

/**
 * 提交月度审批（只有检察官可以提交）
 */
router.post('/submit/:id', requireRole(['inspector']), async (req, res) => {
    try {
        const archive = await MonthlyArchive.findByPk(req.params.id)

        if (!archive) {
            return res.status(404).json({ success: false, message: '归档记录不存在' })
        }

        // 只能提交本单位的归档
        if (archive.prison_name !== req.user.prison_name) {
            return res.status(403).json({ success: false, message: '只能提交本单位的归档' })
        }

        if (archive.status !== 'draft' && archive.status !== 'rejected') {
            return res.status(400).json({
                success: false,
                message: '当前状态不允许提交'
            })
        }

        // 获取同一派驻单位的所有用户ID
        const usersInSamePrison = await User.findAll({
            where: { prison_name: req.user.prison_name },
            attributes: ['id']
        })
        const userIds = usersInSamePrison.map(u => u.id)

        // 统计该派驻单位下所有用户的日志数量
        const startDate = `${archive.year}-${String(archive.month).padStart(2, '0')}-01`;
        const endDate = archive.month === 12
            ? `${archive.year + 1}-01-01`
            : `${archive.year}-${String(archive.month + 1).padStart(2, '0')}-01`;

        const dailyLogCount = await DailyLog.count({
            where: {
                user_id: { [Op.in]: userIds },
                log_date: {
                    [Op.gte]: startDate,
                    [Op.lt]: endDate
                }
            }
        })

        // 统计附件数量
        const attachmentCount = await Attachment.count({
            where: {
                user_id: { [Op.in]: userIds },
                createdAt: {
                    [Op.gte]: new Date(archive.year, archive.month - 1, 1),
                    [Op.lt]: new Date(archive.year, archive.month, 1)
                }
            }
        })

        await archive.update({
            status: 'pending',
            daily_log_count: dailyLogCount,
            attachment_count: attachmentCount,
            submitted_at: new Date(),
            summary: req.body.summary || null
        })

        res.json({ success: true, data: archive, message: '已提交审批' })
    } catch (error) {
        console.error('提交审批失败:', error)
        res.status(500).json({ success: false, message: '提交审批失败' })
    }
})

/**
 * 审批通过（需要签名，只有分管领导可以审批）
 */
router.put('/approve/:id', requireRole(['leader']), uploadSignature.single('signature'), async (req, res) => {
    try {
        const archive = await MonthlyArchive.findByPk(req.params.id)

        if (!archive) {
            return res.status(404).json({ success: false, message: '归档记录不存在' })
        }

        if (archive.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: '只有待审批状态才能审批'
            })
        }

        // 领导只能审批本单位的归档
        if (archive.prison_name !== req.user.prison_name) {
            return res.status(403).json({
                success: false,
                message: '只能审批本单位的归档'
            })
        }

        // 处理签名（文件上传或base64）
        let signatureUrl = null
        if (req.file) {
            signatureUrl = `/uploads/signatures/${req.file.filename}`
        } else if (req.body.signature_base64) {
            // 保存base64签名
            const base64Data = req.body.signature_base64.replace(/^data:image\/\w+;base64,/, '')
            const filename = `signature_${Date.now()}.png`
            const signatureDir = path.join(__dirname, '../uploads/signatures')
            
            // 确保目录存在
            if (!fs.existsSync(signatureDir)) {
                fs.mkdirSync(signatureDir, { recursive: true })
            }
            
            const filepath = path.join(signatureDir, filename)
            fs.writeFileSync(filepath, base64Data, 'base64')
            signatureUrl = `/uploads/signatures/${filename}`
        }

        await archive.update({
            status: 'approved',
            reviewer_id: req.user.id,
            signature_url: signatureUrl,
            reviewed_at: new Date()
        })

        res.json({ success: true, data: archive, message: '审批通过' })
    } catch (error) {
        console.error('审批失败:', error)
        res.status(500).json({ success: false, message: '审批失败' })
    }
})

/**
 * 审批驳回（只有分管领导可以驳回）
 */
router.put('/reject/:id', requireRole(['leader']), async (req, res) => {
    try {
        const archive = await MonthlyArchive.findByPk(req.params.id)

        if (!archive) {
            return res.status(404).json({ success: false, message: '归档记录不存在' })
        }

        if (archive.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: '只有待审批状态才能驳回'
            })
        }

        // 领导只能驳回本单位的归档
        if (archive.prison_name !== req.user.prison_name) {
            return res.status(403).json({
                success: false,
                message: '只能驳回本单位的归档'
            })
        }

        await archive.update({
            status: 'rejected',
            reviewer_id: req.user.id,
            reject_reason: req.body.reason || '未说明原因',
            reviewed_at: new Date()
        })

        res.json({ success: true, data: archive, message: '已驳回' })
    } catch (error) {
        console.error('驳回失败:', error)
        res.status(500).json({ success: false, message: '驳回失败' })
    }
})

/**
 * 删除归档
 */
router.delete('/:id', async (req, res) => {
    try {
        const archive = await MonthlyArchive.findByPk(req.params.id)

        if (!archive) {
            return res.status(404).json({ success: false, message: '归档记录不存在' })
        }

        // 权限检查
        if (req.user.role !== 'admin') {
            // 非管理员只能删除本单位的归档
            if (archive.prison_name !== req.user.prison_name) {
                return res.status(403).json({ success: false, message: '无权删除其他单位的归档' })
            }
        }

        // 删除关联的文件
        if (archive.archive_url) {
            const archivePath = path.join(__dirname, '..', archive.archive_url)
            if (fs.existsSync(archivePath)) {
                fs.unlinkSync(archivePath)
            }
        }

        if (archive.signature_url) {
            const signaturePath = path.join(__dirname, '..', archive.signature_url)
            if (fs.existsSync(signaturePath)) {
                fs.unlinkSync(signaturePath)
            }
        }

        await archive.destroy()

        res.json({ success: true, message: '归档已删除' })
    } catch (error) {
        console.error('删除归档失败:', error)
        res.status(500).json({ success: false, message: '删除归档失败' })
    }
})

/**
 * 生成并下载压缩包
 */
router.get('/download/:id', async (req, res) => {
    try {
        const archive = await MonthlyArchive.findByPk(req.params.id)

        if (!archive) {
            return res.status(404).json({ success: false, message: '归档记录不存在' })
        }

        // 检查权限：
        // 1. 检察员可以随时下载本单位的归档
        // 2. 领导只能下载本单位已审批通过的归档
        // 3. 管理员可以下载所有已审批的归档
        if (req.user.role === 'inspector') {
            // 检察员只能下载本单位的
            if (req.user.prison_name !== archive.prison_name) {
                return res.status(403).json({
                    success: false,
                    message: '无权下载其他单位的归档'
                })
            }
        } else if (req.user.role === 'leader') {
            // 领导可以下载本单位的归档（审核前也可以查看）
            if (req.user.prison_name !== archive.prison_name) {
                return res.status(403).json({
                    success: false,
                    message: '无权下载其他单位的归档'
                })
            }
        } else if (req.user.role === 'admin') {
            // 管理员可以下载所有归档
        }

        // 创建压缩包
        const archiveName = `${archive.prison_name}_${archive.year}年${archive.month}月归档.zip`
        const archivePath = path.join(__dirname, '../uploads/archives', archiveName)

        // 确保目录存在
        const archiveDir = path.dirname(archivePath)
        if (!fs.existsSync(archiveDir)) {
            fs.mkdirSync(archiveDir, { recursive: true })
        }

        // 如果文件已存在,先删除(避免权限问题)
        if (fs.existsSync(archivePath)) {
            try {
                fs.unlinkSync(archivePath)
                console.log('已删除旧的归档文件:', archivePath)
            } catch (unlinkError) {
                console.error('删除旧归档文件失败:', unlinkError.message)
                return res.status(500).json({ 
                    success: false, 
                    message: '归档文件被占用,请关闭后重试' 
                })
            }
        }

        const output = fs.createWriteStream(archivePath)
        const zipArchive = archiver('zip', { zlib: { level: 9 } })

        // 错误处理
        output.on('error', (err) => {
            console.error('文件写入错误:', err)
            res.status(500).json({ 
                success: false, 
                message: '归档文件创建失败: ' + err.message 
            })
        })

        zipArchive.on('error', (err) => {
            console.error('压缩错误:', err)
            res.status(500).json({ 
                success: false, 
                message: '压缩失败: ' + err.message 
            })
        })

        output.on('close', async () => {
            // 更新归档记录
            await archive.update({ archive_url: `/uploads/archives/${archiveName}` })

            console.log('✓ 归档包生成成功:', archiveName)
            
            // 尝试获取文件大小(可能会失败,不影响主流程)
            try {
                const fileSize = (fs.statSync(archivePath).size / 1024 / 1024).toFixed(2)
                console.log('  文件大小:', fileSize, 'MB')
            } catch (statError) {
                console.log('  (无法获取文件大小)')
            }

            // 发送文件
            res.download(archivePath, archiveName, (err) => {
                if (err) {
                    console.error('文件下载失败:', err)
                }
            })
        })

        zipArchive.pipe(output)

        console.log('开始生成归档包:', archiveName)

        // 获取同一派驻单位的所有用户ID
        const usersInSamePrison = await User.findAll({
            where: { prison_name: archive.prison_name },
            attributes: ['id']
        })
        const userIds = usersInSamePrison.map(u => u.id)

        // 获取当月所有日志
        const startDate = `${archive.year}-${String(archive.month).padStart(2, '0')}-01`;
        const endDate = archive.month === 12
            ? `${archive.year + 1}-01-01`
            : `${archive.year}-${String(archive.month + 1).padStart(2, '0')}-01`;

        const dailyLogs = await DailyLog.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                log_date: {
                    [Op.gte]: startDate,
                    [Op.lt]: endDate
                }
            },
            order: [['log_date', 'ASC']]
        })

        // 生成日志Word文档（优先使用模板）
        const { generateLogFromTemplate } = require('../utils/templateGenerator')
        const { generateLogDocx } = require('../utils/docxGenerator')

        // 先获取当月的周/月检察记录（用于关联到日志）
        const weeklyRecordsForLogs = await WeeklyRecord.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                record_date: {
                    [Op.gte]: new Date(archive.year, archive.month - 1, 1),
                    [Op.lt]: new Date(archive.year, archive.month, 1)
                }
            }
        })
        const monthlyRecordsForLogs = await MonthlyRecord.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                record_month: `${archive.year}-${String(archive.month).padStart(2, '0')}`
            }
        })

        // 生成日检察日志文档 + 附件(按日期组织)
        for (const log of dailyLogs) {
            try {
                // 生成日志Word文档
                let docBuffer
                try {
                    docBuffer = await generateLogFromTemplate(log, weeklyRecordsForLogs, monthlyRecordsForLogs)
                } catch (templateError) {
                    console.log('模板生成失败，使用默认生成器:', templateError.message)
                    docBuffer = await generateLogDocx(log)
                }

                const dateStr = log.log_date ? new Date(log.log_date).toISOString().split('T')[0] : 'unknown'
                zipArchive.append(docBuffer, { name: `01-日检察/${dateStr}_日检察日志.docx` })
                
                // 查找该日志的附件(通过related_log_id关联)
                const logAttachments = await Attachment.findAll({
                    where: {
                        related_log_type: 'daily',
                        related_log_id: log.id
                    }
                })
                
                // 添加该日志的附件到对应日期文件夹
                if (logAttachments.length > 0) {
                    for (const att of logAttachments) {
                        let filePath
                        if (path.isAbsolute(att.file_path)) {
                            filePath = att.file_path
                        } else {
                            filePath = path.join(__dirname, '..', att.file_path)
                        }
                        
                        if (fs.existsSync(filePath)) {
                            zipArchive.file(filePath, { name: `01-日检察/${dateStr}_附件/${att.original_name}` })
                        }
                    }
                }
            } catch (e) {
                console.error('生成日志文档失败:', e)
            }
        }

        // 获取及时检察事件
        const immediateEvents = await ImmediateEvent.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                event_date: {
                    [Op.gte]: new Date(archive.year, archive.month - 1, 1),
                    [Op.lt]: new Date(archive.year, archive.month, 1)
                }
            },
            order: [['event_date', 'ASC']]
        })

        // 生成及时检察事件文档 + 附件(按日期和类型组织)
        const { generateImmediateEventDocument } = require('../utils/immediateEventGenerator')
        const eventTypeMap = {
            'escape': '脱逃',
            'selfHarm': '自伤自残',
            'death': '死亡',
            'epidemic': '重大疫情',
            'accident': '安全事故',
            'paroleRequest': '减刑假释',
            'disciplinaryAction': '民警处分'
        }
        
        for (const event of immediateEvents) {
            try {
                const docBuffer = await generateImmediateEventDocument(event)
                const dateStr = event.event_date ? new Date(event.event_date).toISOString().split('T')[0] : 'unknown'
                const eventTypeName = eventTypeMap[event.event_type] || '未分类'
                const eventTitle = event.title || '无标题'
                
                // 文件名: 日期_类型_标题.docx
                zipArchive.append(docBuffer, { name: `04-及时检察/${dateStr}_${eventTypeName}_${eventTitle}.docx` })
                
                // 添加该事件的附件到对应文件夹
                if (event.attachment_ids && event.attachment_ids.length > 0) {
                    const eventAttachments = await Attachment.findAll({
                        where: {
                            id: { [Op.in]: event.attachment_ids }
                        }
                    })
                    
                    for (const att of eventAttachments) {
                        let filePath
                        if (path.isAbsolute(att.file_path)) {
                            filePath = att.file_path
                        } else {
                            filePath = path.join(__dirname, '..', att.file_path)
                        }
                        
                        if (fs.existsSync(filePath)) {
                            // 附件放在: 04-及时检察/日期_类型_附件/文件名
                            zipArchive.file(filePath, { name: `04-及时检察/${dateStr}_${eventTypeName}_附件/${att.original_name}` })
                        }
                    }
                }
            } catch (e) {
                console.error('生成及时检察文档失败:', e)
            }
        }

        // 添加归档说明
        const readmeContent = `${archive.prison_name} ${archive.year}年${archive.month}月工作归档

================================================================================
                              归档内容说明
================================================================================

一、目录结构
  01-日检察/          日检察日志及附件(按日期组织)
  02-周检察/          周检察记录及附件(按日期组织)
  03-月检察/          月检察记录及附件
  04-及时检察/        及时检察事件及附件(按日期和类型组织)
  05-其他材料/        其他相关材料
  报告/              月度工作报告和事项清单
  审批签名.png        领导审批签名

二、数据统计
  日检察记录: ${dailyLogs.length} 条
  周检察记录: ${weeklyRecordsForLogs.length} 条
  月检察记录: ${monthlyRecordsForLogs.length} 条
  及时检察事件: ${immediateEvents.length} 件
  
三、审批状态
  状态: ${archive.status === 'approved' ? '已审批通过' : archive.status === 'pending' ? '待审批' : '草稿'}
  ${archive.reviewed_at ? `审批时间: ${new Date(archive.reviewed_at).toLocaleString('zh-CN')}` : ''}

四、生成信息
  生成时间: ${new Date().toLocaleString('zh-CN')}
  系统版本: v2.0

================================================================================
说明: 
1. 每个日期文件夹包含该日期的检察记录和相关附件
2. 及时检察按"日期_类型"组织,便于快速查找
3. 所有附件保持原文件名,便于识别
================================================================================
`
        zipArchive.append(readmeContent, { name: 'README.txt' })

        // 添加签名
        if (archive.signature_url) {
            const signaturePath = path.join(__dirname, '..', archive.signature_url)
            if (fs.existsSync(signaturePath)) {
                zipArchive.file(signaturePath, { name: '审批签名.png' })
            }
        }

        // 获取周检察记录并生成文档 + 附件
        const weeklyRecords = await WeeklyRecord.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                record_date: {
                    [Op.gte]: new Date(archive.year, archive.month - 1, 1),
                    [Op.lt]: new Date(archive.year, archive.month, 1)
                }
            },
            order: [['record_date', 'ASC']]
        })
        
        // 生成周检察文档和附件(按日期组织)
        for (const record of weeklyRecords) {
            try {
                const dateStr = record.record_date ? new Date(record.record_date).toISOString().split('T')[0] : 'unknown'
                
                // 生成周检察记录文档(如果有生成器的话)
                // TODO: 添加周检察文档生成器
                // zipArchive.append(docBuffer, { name: `02-周检察/${dateStr}_周检察记录.docx` })
                
                // 查找该周检察的附件
                const weeklyAttachments = await Attachment.findAll({
                    where: {
                        related_log_type: 'weekly',
                        related_log_id: record.id
                    }
                })
                
                // 添加附件
                if (weeklyAttachments.length > 0) {
                    for (const att of weeklyAttachments) {
                        let filePath
                        if (path.isAbsolute(att.file_path)) {
                            filePath = att.file_path
                        } else {
                            filePath = path.join(__dirname, '..', att.file_path)
                        }
                        
                        if (fs.existsSync(filePath)) {
                            zipArchive.file(filePath, { name: `02-周检察/${dateStr}_附件/${att.original_name}` })
                        }
                    }
                }
            } catch (e) {
                console.error('处理周检察记录失败:', e)
            }
        }

        // 获取月检察记录并生成文档 + 附件
        const targetMonth = `${archive.year}-${String(archive.month).padStart(2, '0')}`
        const monthlyRecords = await MonthlyRecord.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                record_month: targetMonth
            }
        })
        
        // 生成月检察文档和附件
        for (const record of monthlyRecords) {
            try {
                // 生成月检察记录文档(如果有生成器的话)
                // TODO: 添加月检察文档生成器
                // zipArchive.append(docBuffer, { name: `03-月检察/${targetMonth}_月检察记录.docx` })
                
                // 查找该月检察的附件
                const monthlyAttachments = await Attachment.findAll({
                    where: {
                        related_log_type: 'monthly',
                        related_log_id: record.id
                    }
                })
                
                // 添加附件
                if (monthlyAttachments.length > 0) {
                    for (const att of monthlyAttachments) {
                        let filePath
                        if (path.isAbsolute(att.file_path)) {
                            filePath = att.file_path
                        } else {
                            filePath = path.join(__dirname, '..', att.file_path)
                        }
                        
                        if (fs.existsSync(filePath)) {
                            zipArchive.file(filePath, { name: `03-月检察/${targetMonth}_附件/${att.original_name}` })
                        }
                    }
                }
            } catch (e) {
                console.error('处理月检察记录失败:', e)
            }
        }
        
        // 处理其他材料(没有关联到具体日志的附件)
        // targetMonth 已在上面定义
        
        // 获取所有已关联的附件ID
        const relatedAttachmentIds = new Set()
        
        // 日检察附件
        const dailyAttachments = await Attachment.findAll({
            where: {
                related_log_type: 'daily',
                related_log_id: { [Op.in]: dailyLogs.map(l => l.id) }
            },
            attributes: ['id']
        })
        dailyAttachments.forEach(att => relatedAttachmentIds.add(att.id))
        
        // 周检察附件
        const weeklyAttachments = await Attachment.findAll({
            where: {
                related_log_type: 'weekly',
                related_log_id: { [Op.in]: weeklyRecords.map(r => r.id) }
            },
            attributes: ['id']
        })
        weeklyAttachments.forEach(att => relatedAttachmentIds.add(att.id))
        
        // 月检察附件
        const monthlyAttachments = await Attachment.findAll({
            where: {
                related_log_type: 'monthly',
                related_log_id: { [Op.in]: monthlyRecords.map(r => r.id) }
            },
            attributes: ['id']
        })
        monthlyAttachments.forEach(att => relatedAttachmentIds.add(att.id))
        
        // 及时检察附件
        for (const event of immediateEvents) {
            if (event.attachment_ids && Array.isArray(event.attachment_ids)) {
                event.attachment_ids.forEach(id => relatedAttachmentIds.add(id))
            }
        }
        
        // 查找未关联的附件(其他材料)
        const otherAttachments = await Attachment.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                [Op.or]: [
                    { upload_month: targetMonth },
                    {
                        [Op.and]: [
                            { upload_month: { [Op.or]: [null, ''] } },
                            {
                                createdAt: {
                                    [Op.gte]: new Date(archive.year, archive.month - 1, 1),
                                    [Op.lt]: new Date(archive.year, archive.month, 1)
                                }
                            }
                        ]
                    }
                ],
                id: { [Op.notIn]: Array.from(relatedAttachmentIds) }
            }
        })
        
        // 添加其他材料
        for (const att of otherAttachments) {
            let filePath
            if (path.isAbsolute(att.file_path)) {
                filePath = att.file_path
            } else {
                filePath = path.join(__dirname, '..', att.file_path)
            }
            
            if (fs.existsSync(filePath)) {
                zipArchive.file(filePath, { name: `05-其他材料/${att.original_name}` })
            } else {
                console.warn(`附件文件不存在: ${filePath}`)
            }
        }
        
        console.log(`归档统计: 日检察${dailyLogs.length}条, 周检察${weeklyRecords.length}条, 月检察${monthlyRecords.length}条, 及时检察${immediateEvents.length}件, 其他材料${otherAttachments.length}个`)

        // 收集所有附件(用于生成报告)
        const allAttachmentsForReport = [
            ...dailyAttachments,
            ...weeklyAttachments,
            ...monthlyAttachments,
            ...otherAttachments
        ]
        // 去重
        const attachmentMapForReport = new Map()
        for (const att of allAttachmentsForReport) {
            attachmentMapForReport.set(att.id, att)
        }
        const attachments = Array.from(attachmentMapForReport.values())

        // 使用模板生成文档（generateLogFromTemplate 已在上方引入）
        const { generateReportFromTemplate, generateChecklistFromTemplate } = require('../utils/templateGenerator')

        // 生成月度报告（Word文档）
        try {
            const reportBuffer = await generateReportFromTemplate({
                archive,
                dailyLogs,
                weeklyRecords,
                monthlyRecords,
                immediateEvents,
                attachments
            })
            zipArchive.append(reportBuffer, { name: '报告/派驻检察室月度工作情况报告.docx' })
        } catch (e) {
            console.error('生成月度报告失败:', e)
            // 如果模板生成失败，使用文本备用方案
            const reportSummary = generateReportSummary({
                archive,
                dailyLogs,
                weeklyRecords,
                monthlyRecords,
                immediateEvents,
                attachments
            })
            zipArchive.append(reportSummary, { name: '报告/月度报告概览.txt' })
        }

        // 生成检察工作事项清单（Word文档）
        try {
            console.log('开始生成事项清单...')
            const checklistBuffer = await generateChecklistFromTemplate({
                archive,
                dailyLogs,
                weeklyRecords,
                monthlyRecords,
                immediateEvents
            })
            zipArchive.append(checklistBuffer, { name: '报告/派驻检察工作报告事项清单.docx' })
            console.log('✓ 事项清单生成成功')
        } catch (e) {
            console.error('生成事项清单失败:', e.message)
            console.error('详细错误:', e.stack)
            // 如果模板生成失败，使用文本备用方案
            const checklist = generateChecklist({
                archive,
                dailyLogs,
                weeklyRecords,
                monthlyRecords,
                immediateEvents
            })
            zipArchive.append(checklist, { name: '报告/检察工作事项清单.txt' })
        }

        zipArchive.finalize()
    } catch (error) {
        console.error('下载归档失败:', error)
        res.status(500).json({ success: false, message: '下载归档失败' })
    }
})

/**
 * 单独下载月度报告
 */
router.get('/download-report/:id', async (req, res) => {
    try {
        const archive = await MonthlyArchive.findByPk(req.params.id)

        if (!archive) {
            return res.status(404).json({ success: false, message: '归档记录不存在' })
        }

        // 权限检查
        if (req.user.role === 'inspector' && req.user.prison_name !== archive.prison_name) {
            return res.status(403).json({ success: false, message: '无权访问其他单位的归档' })
        }
        if (req.user.role === 'leader' && req.user.prison_name !== archive.prison_name) {
            return res.status(403).json({ success: false, message: '无权访问其他单位的归档' })
        }

        // 获取数据
        const usersInSamePrison = await User.findAll({
            where: { prison_name: archive.prison_name },
            attributes: ['id']
        })
        const userIds = usersInSamePrison.map(u => u.id)

        const startDate = `${archive.year}-${String(archive.month).padStart(2, '0')}-01`;
        const endDate = archive.month === 12
            ? `${archive.year + 1}-01-01`
            : `${archive.year}-${String(archive.month + 1).padStart(2, '0')}-01`;

        const dailyLogs = await DailyLog.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                log_date: { [Op.gte]: startDate, [Op.lt]: endDate }
            }
        })

        const weeklyRecords = await WeeklyRecord.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                record_date: {
                    [Op.gte]: new Date(archive.year, archive.month - 1, 1),
                    [Op.lt]: new Date(archive.year, archive.month, 1)
                }
            }
        })

        const targetMonth = `${archive.year}-${String(archive.month).padStart(2, '0')}`
        const monthlyRecords = await MonthlyRecord.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                record_month: targetMonth
            }
        })

        const immediateEvents = await ImmediateEvent.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                event_date: {
                    [Op.gte]: new Date(archive.year, archive.month - 1, 1),
                    [Op.lt]: new Date(archive.year, archive.month, 1)
                }
            }
        })

        const attachments = await Attachment.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                createdAt: {
                    [Op.gte]: new Date(archive.year, archive.month - 1, 1),
                    [Op.lt]: new Date(archive.year, archive.month, 1)
                }
            }
        })

        // 生成报告
        const { generateReportFromTemplate } = require('../utils/templateGenerator')

        console.log('准备生成报告,数据统计:', {
            dailyLogs: dailyLogs.length,
            weeklyRecords: weeklyRecords.length,
            monthlyRecords: monthlyRecords.length,
            immediateEvents: immediateEvents.length,
            attachments: attachments.length
        })

        const reportBuffer = await generateReportFromTemplate({
            archive,
            dailyLogs,
            weeklyRecords,
            monthlyRecords,
            immediateEvents,
            attachments
        })

        // 设置响应头
        const filename = `${archive.prison_name}_${archive.year}年${archive.month}月工作报告.docx`
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
        res.send(reportBuffer)
    } catch (error) {
        console.error('下载报告失败,详细错误:', {
            message: error.message,
            stack: error.stack,
            archiveId: req.params.id
        })
        res.status(500).json({ success: false, message: '下载报告失败: ' + error.message })
    }
})
/**
 * 单独下载事项清单
 */
router.post('/download-checklist/:id', async (req, res) => {
    try {
        const archive = await MonthlyArchive.findByPk(req.params.id)

        if (!archive) {
            return res.status(404).json({ success: false, message: '归档记录不存在' })
        }

        // 权限检查
        const { getUserPrisonScope } = require('../middleware/permission')
        const prisonScope = await getUserPrisonScope(req.user.id, req.user.role)
        
        if (prisonScope !== 'ALL') {
            if (!Array.isArray(prisonScope) || !prisonScope.includes(archive.prison_name)) {
                return res.status(403).json({ success: false, message: '无权访问该监狱的归档' })
            }
        }

        // 从请求体获取前端传来的清单数据
        const { checklistData } = req.body
        
        console.log('收到前端清单数据:', checklistData)

        // 生成清单
        const { generateChecklistFromFrontendData } = require('../utils/templateGenerator')
        const checklistBuffer = await generateChecklistFromFrontendData({
            archive,
            checklistData: checklistData || []
        })

        // 设置响应头
        const filename = `${archive.prison_name}_${archive.year}年${archive.month}月事项清单.doc`
        res.setHeader('Content-Type', 'application/msword')
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
        res.send(checklistBuffer)
    } catch (error) {
        console.error('下载清单失败:', error)
        res.status(500).json({ success: false, message: '下载清单失败: ' + error.message })
    }
})

/**
 * 生成月度报告概览
 */
function generateReportSummary({ archive, dailyLogs, weeklyRecords, monthlyRecords, immediateEvents, attachments }) {
    const stats = {
        threeSceneChecks: 0,
        monitorChecks: 0,
        keyLocationChecks: 0,
        totalTalks: 0,
        mailboxOpens: 0,
        lettersReceived: 0
    }

    // 从日检察统计
    for (const log of dailyLogs) {
        if (log.three_scenes) {
            const scenes = log.three_scenes
            if (scenes.labor?.checked) stats.threeSceneChecks++
            if (scenes.living?.checked) stats.threeSceneChecks++
            if (scenes.study?.checked) stats.threeSceneChecks++
        }
        if (log.monitor_check?.checked) {
            stats.monitorChecks += log.monitor_check.count || 1
        }
    }

    // 从周检察统计
    for (const record of weeklyRecords) {
        if (record.hospital_check) {
            if (record.hospital_check.hospitalChecked) stats.keyLocationChecks++
            if (record.hospital_check.confinementChecked) stats.keyLocationChecks++
        }
        if (record.talk_records && Array.isArray(record.talk_records)) {
            stats.totalTalks += record.talk_records.length
        }
        if (record.mailbox) {
            stats.mailboxOpens += record.mailbox.openCount || 0
            stats.lettersReceived += record.mailbox.receivedCount || 0
        }
    }

    return `
================================================================================
                        ${archive.prison_name} 月度检察工作报告
                              ${archive.year}年${archive.month}月
================================================================================

【报告状态】${archive.status === 'approved' ? '已审批通过' : archive.status === 'pending' ? '待审批' : '草稿'}
【生成时间】${new Date().toLocaleString('zh-CN')}

--------------------------------------------------------------------------------
                                  工作统计
--------------------------------------------------------------------------------

一、日检察工作
   - 日检察记录数：${dailyLogs.length} 条
   - 三大现场检察次数：${stats.threeSceneChecks} 次
   - 监控抽查次数：${stats.monitorChecks} 次

二、周检察工作
   - 周检察记录数：${weeklyRecords.length} 条
   - 重点场所检察次数：${stats.keyLocationChecks} 次
   - 谈话教育次数：${stats.totalTalks} 次
   - 检察官信箱开启次数：${stats.mailboxOpens} 次
   - 收到信件数量：${stats.lettersReceived} 封

三、月检察工作
   - 月检察记录数：${monthlyRecords.length} 条

四、及时检察事件
   - 及时检察事件数：${immediateEvents.length} 件

五、附件材料
   - 上传附件数：${attachments.length} 个

--------------------------------------------------------------------------------
                                  附录
--------------------------------------------------------------------------------

本报告由系统自动生成，内容包括：
1. 日志文件夹：包含每日检察日志Word文档
2. 附件文件夹：包含上传的所有附件材料
3. 报告文件夹：包含本报告概览和检察事项清单
${archive.signature_url ? '4. 审批签名：领导审批签名图片' : ''}

================================================================================
`
}

/**
 * 生成检察工作事项清单
 */
function generateChecklist({ archive, dailyLogs, weeklyRecords, monthlyRecords, immediateEvents }) {
    // 16项标准事项
    const items = [
        { id: 1, name: '监狱发生罪犯脱逃、自伤自残、自杀死亡、重大疫情、重大生产安全事故的情况报告', frequency: '及时' },
        { id: 2, name: '罪犯死亡事件调查及处理报告', frequency: '及时' },
        { id: 3, name: '监狱开展重大监管改造业务活动的情况报告', frequency: '及时' },
        { id: 4, name: '监狱民警受到党纪行政处罚情况', frequency: '及时' },
        { id: 5, name: '监狱新任职领导情况列表', frequency: '及时' },
        { id: 6, name: '监狱提请罪犯减刑、假释、暂予监外执行花名册', frequency: '每批次' },
        { id: 7, name: '抽查重点时段、重点环节监控录像发现的情况', frequency: '每日' },
        { id: 8, name: '对监狱医院禁闭室检察情况', frequency: '每周' },
        { id: 9, name: '罪犯外伤检察', frequency: '每周' },
        { id: 10, name: '对刑释前罪犯和新入监罪犯谈话情况', frequency: '每周' },
        { id: 11, name: '开启检察官信箱或检察中发现具有价值的案件线索', frequency: '每周' },
        { id: 12, name: '检查发现罪犯私藏使用违禁品的情况', frequency: '每周' },
        { id: 13, name: '对监狱会见场所检察情况', frequency: '每月' },
        { id: 14, name: '参加监狱犯情分析会情况', frequency: '每月' },
        { id: 15, name: '记过以上处分的监督情况', frequency: '每月' },
        { id: 16, name: '狱内勤杂岗位和辅助生产岗位罪犯每月增减情况', frequency: '每月' }
    ]

    // 统计完成情况
    const dailyCount = dailyLogs.length
    const weeklyCount = weeklyRecords.length
    const monthlyCount = monthlyRecords.length
    const immediateCount = immediateEvents.length

    let content = `
================================================================================
                        ${archive.prison_name} 检察工作事项清单
                              ${archive.year}年${archive.month}月
================================================================================

【填报状态】${archive.status === 'approved' ? '已审批通过' : archive.status === 'pending' ? '待审批' : '草稿'}
【生成时间】${new Date().toLocaleString('zh-CN')}

--------------------------------------------------------------------------------
                              完成情况统计
--------------------------------------------------------------------------------

日检察记录：${dailyCount} 条
周检察记录：${weeklyCount} 条
月检察记录：${monthlyCount} 条
及时检察事件：${immediateCount} 件

--------------------------------------------------------------------------------
                              事项清单（16项）
--------------------------------------------------------------------------------

`

    for (const item of items) {
        let status = '[ ]'
        if (item.frequency === '及时' && immediateCount > 0) status = '[✓]'
        else if (item.frequency === '每日' && dailyCount > 0) status = '[✓]'
        else if (item.frequency === '每周' && weeklyCount > 0) status = '[✓]'
        else if (item.frequency === '每月' && monthlyCount > 0) status = '[✓]'

        content += `${status} ${item.id}. ${item.name}\n`
        content += `    频率要求：${item.frequency}\n\n`
    }

    content += `
================================================================================
说明：[✓] 表示该类型有相关记录，[ ] 表示暂无记录
================================================================================
`

    return content
}

module.exports = router

