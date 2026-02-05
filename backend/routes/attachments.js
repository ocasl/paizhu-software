/**
 * 附件管理路由
 */
const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs').promises
const { Attachment } = require('../models')
const { authenticateToken } = require('../middleware/auth')

// 所有路由需要认证
router.use(authenticateToken)

// 配置文件上传
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/attachments')
        try {
            await fs.mkdir(uploadDir, { recursive: true })
            cb(null, uploadDir)
        } catch (error) {
            cb(error)
        }
    },
    filename: (req, file, cb) => {
        // 格式化文件名：日期_类型_原始文件名
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '')  // 20260126
        
        // 注意：multer 在处理文件时，req.body 可能还未解析
        // 所以我们先使用临时文件名，后续在保存到数据库时再重命名
        const ext = path.extname(file.originalname)
        
        // 修复中文文件名编码问题
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
        const baseName = path.basename(originalName, ext)
        const timestamp = Date.now()
        
        // 清理文件名中的特殊字符，保留中文、英文、数字
        const cleanBaseName = baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
        
        // 临时格式：日期_文件名_时间戳.扩展名（不包含类型，因为 req.body 可能还未解析）
        const formattedName = `${date}_${cleanBaseName}_${timestamp}${ext}`
        
        cb(null, formattedName)
    }
})

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    },
    fileFilter: (req, file, cb) => {
        // 允许的文件类型
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('不支持的文件类型'))
        }
    }
})

/**
 * POST /api/attachments/upload
 * 上传附件
 */
router.post('/upload', upload.array('files', 10), async (req, res) => {
    try {
        const { category, related_log_id, related_log_type, log_date, upload_month } = req.body
        const files = req.files

        // 调试日志
        console.log('📎 上传附件请求:')
        console.log('  category:', category)
        console.log('  log_date:', log_date)
        console.log('  upload_month:', upload_month)
        console.log('  related_log_id:', related_log_id)
        console.log('  related_log_type:', related_log_type)

        if (!files || files.length === 0) {
            return res.status(400).json({ error: '没有上传文件' })
        }

        const attachments = []
        // 使用前端传递的 upload_month，如果没有则使用当前月份
        const uploadMonth = upload_month || new Date().toISOString().slice(0, 7)
        
        // 使用日志记录日期（如果提供），否则使用当前日期
        const dateToUse = log_date || new Date().toISOString().split('T')[0]
        console.log('  使用的日期:', dateToUse)
        const date = dateToUse.replace(/-/g, '')  // 转换为 20260112 格式

        // 需要规范化命名的类别（日志相关的证据材料）
        const needsFormatting = [
            'daily_log',           // 日检察附件
            'weekly_hospital',     // 周检察-医院检察
            'weekly_injury',       // 周检察-外伤检察
            'weekly_talk',         // 周检察-谈话笔录
            'weekly_contraband',   // 周检察-违禁品照片
            'monthly_punishment'   // 月检察-处分证据
        ]

        for (const file of files) {
            // 修复中文文件名编码问题
            const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
            const categoryStr = category || 'general'
            
            let finalFileName = file.filename
            let finalFilePath = file.path
            
            // 只对日志相关的附件进行规范化命名
            if (needsFormatting.includes(categoryStr)) {
                // 生成规范化的文件名（包含类型）
                const ext = path.extname(originalName)
                const baseName = path.basename(originalName, ext)
                const cleanBaseName = baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
                const timestamp = Date.now()
                const newFileName = `${date}_${categoryStr}_${cleanBaseName}_${timestamp}${ext}`
                
                // 重命名文件
                const oldPath = file.path
                const newPath = path.join(path.dirname(oldPath), newFileName)
                
                try {
                    await fs.rename(oldPath, newPath)
                    finalFileName = newFileName
                    finalFilePath = newPath
                } catch (renameError) {
                    console.error('重命名文件失败:', renameError)
                    // 如果重命名失败，使用原文件名
                }
            }
            // 一般材料（如相关材料上传）保持原文件名，不重命名
            
            const attachment = await Attachment.create({
                user_id: req.user.id,
                category: categoryStr,
                original_name: originalName,
                file_name: finalFileName,
                file_path: finalFilePath,
                file_size: file.size,
                mime_type: file.mimetype,
                upload_month: uploadMonth,
                related_log_id: related_log_id || null,
                related_log_type: related_log_type || null
            })
            attachments.push(attachment)
        }

        res.json({
            success: true,
            message: `成功上传 ${attachments.length} 个文件`,
            data: attachments
        })
    } catch (error) {
        console.error('上传附件失败:', error)
        res.status(500).json({ error: '上传附件失败: ' + error.message })
    }
})

/**
 * GET /api/attachments
 * 获取附件列表
 * 查询参数:
 *   - category: 分类筛选
 *   - related_log_id: 关联记录ID
 *   - related_log_type: 关联记录类型
 *   - upload_month: 上传月份
 */
router.get('/', async (req, res) => {
    try {
        const { category, related_log_id, related_log_type, upload_month } = req.query
        const where = { user_id: req.user.id }

        if (category) where.category = category
        if (related_log_id) where.related_log_id = related_log_id
        if (related_log_type) where.related_log_type = related_log_type
        if (upload_month) where.upload_month = upload_month

        const attachments = await Attachment.findAll({
            where,
            order: [['createdAt', 'DESC']]
        })

        res.json({
            success: true,
            data: attachments
        })
    } catch (error) {
        console.error('获取附件列表失败:', error)
        res.status(500).json({ error: '获取附件列表失败' })
    }
})

/**
 * GET /api/attachments/:id
 * 获取单个附件信息
 */
router.get('/:id', async (req, res) => {
    try {
        const attachment = await Attachment.findByPk(req.params.id)

        if (!attachment) {
            return res.status(404).json({ error: '附件不存在' })
        }

        // 权限检查
        if (attachment.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: '无权访问此附件' })
        }

        res.json({
            success: true,
            data: attachment
        })
    } catch (error) {
        console.error('获取附件信息失败:', error)
        res.status(500).json({ error: '获取附件信息失败' })
    }
})

/**
 * GET /api/attachments/:id/download
 * 下载附件
 */
router.get('/:id/download', async (req, res) => {
    try {
        const attachment = await Attachment.findByPk(req.params.id)

        if (!attachment) {
            return res.status(404).json({ error: '附件不存在' })
        }

        // 权限检查
        if (attachment.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: '无权下载此附件' })
        }

        // 检查文件是否存在
        try {
            await fs.access(attachment.file_path)
        } catch {
            return res.status(404).json({ error: '文件不存在' })
        }

        // 设置响应头
        res.setHeader('Content-Type', attachment.mime_type || 'application/octet-stream')
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.original_name)}"`)
        
        // 发送文件
        res.sendFile(path.resolve(attachment.file_path))
    } catch (error) {
        console.error('下载附件失败:', error)
        res.status(500).json({ error: '下载附件失败' })
    }
})

/**
 * DELETE /api/attachments/:id
 * 删除附件
 */
router.delete('/:id', async (req, res) => {
    try {
        const attachment = await Attachment.findByPk(req.params.id)

        if (!attachment) {
            return res.status(404).json({ error: '附件不存在' })
        }

        // 权限检查
        if (attachment.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: '无权删除此附件' })
        }

        // 删除文件
        try {
            await fs.unlink(attachment.file_path)
        } catch (error) {
            console.warn('删除文件失败:', error)
        }

        // 删除数据库记录
        await attachment.destroy()

        res.json({
            success: true,
            message: '附件已删除'
        })
    } catch (error) {
        console.error('删除附件失败:', error)
        res.status(500).json({ error: '删除附件失败' })
    }
})

/**
 * PUT /api/attachments/:id/link
 * 关联附件到检察记录
 */
router.put('/:id/link', async (req, res) => {
    try {
        const { related_log_id, related_log_type } = req.body
        const attachment = await Attachment.findByPk(req.params.id)

        if (!attachment) {
            return res.status(404).json({ error: '附件不存在' })
        }

        // 权限检查
        if (attachment.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: '无权修改此附件' })
        }

        await attachment.update({
            related_log_id,
            related_log_type
        })

        res.json({
            success: true,
            message: '附件关联成功',
            data: attachment
        })
    } catch (error) {
        console.error('关联附件失败:', error)
        res.status(500).json({ error: '关联附件失败' })
    }
})

/**
 * GET /api/attachments/by-log/:logType/:logId
 * 获取指定检察记录的所有附件
 */
router.get('/by-log/:logType/:logId', async (req, res) => {
    try {
        const { logType, logId } = req.params

        const attachments = await Attachment.findAll({
            where: {
                related_log_type: logType,
                related_log_id: logId
            },
            order: [['createdAt', 'DESC']]
        })

        res.json({
            success: true,
            data: attachments
        })
    } catch (error) {
        console.error('获取记录附件失败:', error)
        res.status(500).json({ error: '获取记录附件失败' })
    }
})

/**
 * GET /api/attachments/by-date/:date
 * 获取指定日期的所有附件（包括日检察、周检察、月检察）
 * 
 * 查询逻辑：
 * 1. 查询文件名以该日期开头的附件（格式：20260126_类型_文件名_时间戳.扩展名）
 * 2. 或者查询上传日期为该日期的附件
 */
router.get('/by-date/:date', async (req, res) => {
    try {
        const { date } = req.params  // 格式：2026-01-26
        const dateStr = date.replace(/-/g, '')  // 转换为：20260126
        
        const { Op } = require('sequelize')
        
        const attachments = await Attachment.findAll({
            where: {
                user_id: req.user.id,
                [Op.or]: [
                    // 文件名以日期开头（规范化命名的附件）
                    {
                        file_name: {
                            [Op.like]: `${dateStr}_%`
                        }
                    },
                    // 或者上传日期匹配（兼容旧数据）
                    {
                        createdAt: {
                            [Op.between]: [
                                new Date(date + ' 00:00:00'),
                                new Date(date + ' 23:59:59')
                            ]
                        }
                    }
                ]
            },
            order: [['createdAt', 'DESC']]
        })

        res.json({
            success: true,
            data: attachments
        })
    } catch (error) {
        console.error('获取日期附件失败:', error)
        res.status(500).json({ error: '获取日期附件失败' })
    }
})

module.exports = router
