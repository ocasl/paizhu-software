/**
 * 汇编功能路由
 * 文档资料库管理
 */
const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const { CompilationCategory, CompilationDocument } = require('../models')
const { authenticateToken, requireRole } = require('../middleware/auth')
const { Op } = require('sequelize')

// 配置文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/compilation')
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        cb(null, dir)
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now()
        const ext = path.extname(file.originalname)
        const basename = path.basename(file.originalname, ext)
        cb(null, `${timestamp}_${basename}${ext}`)
    }
})

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        const allowedExtensions = ['.pdf', '.docx']
        const ext = path.extname(file.originalname).toLowerCase()
        
        if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
            cb(null, true)
        } else {
            cb(new Error('只支持 PDF 和 DOCX 格式的文件'))
        }
    }
})

// 所有路由都需要认证
router.use(authenticateToken)

// ==================== 分类管理 ====================

/**
 * 获取分类列表（所有用户）
 */
router.get('/categories', async (req, res) => {
    try {
        const categories = await CompilationCategory.findAll({
            attributes: [
                'id',
                'name',
                'description',
                'sort_order',
                'is_active',
                'created_at',
                'updated_at'
            ],
            order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
        })

        // 统计每个分类的文档数量
        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const docCount = await CompilationDocument.count({
                    where: {
                        category_id: category.id,
                        status: 'active'
                    }
                })
                return {
                    ...category.toJSON(),
                    doc_count: docCount
                }
            })
        )

        res.json({ success: true, data: categoriesWithCount })
    } catch (error) {
        console.error('获取分类列表失败:', error)
        res.status(500).json({ success: false, message: '获取分类列表失败' })
    }
})

/**
 * 添加分类（管理员）
 */
router.post('/categories', requireRole(['admin']), async (req, res) => {
    try {
        const { name, description, sort_order } = req.body

        if (!name) {
            return res.status(400).json({ success: false, message: '分类名称不能为空' })
        }

        const category = await CompilationCategory.create({
            name,
            description,
            sort_order: sort_order || 0
        })

        res.json({ success: true, data: category, message: '分类添加成功' })
    } catch (error) {
        console.error('添加分类失败:', error)
        if (error.name === 'SequelizeUniqueConstraintError') {
            res.status(400).json({ success: false, message: '分类名称已存在' })
        } else {
            res.status(500).json({ success: false, message: '添加分类失败' })
        }
    }
})

/**
 * 编辑分类（管理员）
 */
router.put('/categories/:id', requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params
        const { name, description, sort_order, is_active } = req.body

        const category = await CompilationCategory.findByPk(id)
        if (!category) {
            return res.status(404).json({ success: false, message: '分类不存在' })
        }

        await category.update({
            name: name || category.name,
            description,
            sort_order: sort_order !== undefined ? sort_order : category.sort_order,
            is_active: is_active !== undefined ? is_active : category.is_active
        })

        res.json({ success: true, data: category, message: '分类更新成功' })
    } catch (error) {
        console.error('编辑分类失败:', error)
        if (error.name === 'SequelizeUniqueConstraintError') {
            res.status(400).json({ success: false, message: '分类名称已存在' })
        } else {
            res.status(500).json({ success: false, message: '编辑分类失败' })
        }
    }
})

/**
 * 删除分类（管理员）
 */
router.delete('/categories/:id', requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params

        const category = await CompilationCategory.findByPk(id)
        if (!category) {
            return res.status(404).json({ success: false, message: '分类不存在' })
        }

        // 检查是否有文档使用该分类
        const docCount = await CompilationDocument.count({
            where: { category_id: id }
        })

        if (docCount > 0) {
            return res.status(400).json({
                success: false,
                message: `该分类下还有 ${docCount} 个文档，无法删除`
            })
        }

        await category.destroy()
        res.json({ success: true, message: '分类删除成功' })
    } catch (error) {
        console.error('删除分类失败:', error)
        res.status(500).json({ success: false, message: '删除分类失败' })
    }
})

// ==================== 文档管理 ====================

/**
 * 获取文档列表（所有用户，支持搜索和筛选）
 */
router.get('/documents', async (req, res) => {
    try {
        const { keyword, category_id, page = 1, limit = 20 } = req.query

        const where = { status: 'active' }

        // 搜索条件
        if (keyword) {
            where[Op.or] = [
                { title: { [Op.like]: `%${keyword}%` } },
                { description: { [Op.like]: `%${keyword}%` } }
            ]
        }

        // 分类筛选
        if (category_id) {
            where.category_id = category_id
        }

        const offset = (page - 1) * limit

        const { count, rows } = await CompilationDocument.findAndCountAll({
            where,
            include: [
                {
                    model: CompilationCategory,
                    as: 'category',
                    attributes: ['id', 'name']
                }
            ],
            order: [
                ['is_pinned', 'DESC'],
                ['created_at', 'DESC']
            ],
            limit: parseInt(limit),
            offset: parseInt(offset)
        })

        res.json({
            success: true,
            data: {
                documents: rows,
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        })
    } catch (error) {
        console.error('获取文档列表失败:', error)
        res.status(500).json({ success: false, message: '获取文档列表失败' })
    }
})

/**
 * 上传文档（管理员）
 */
router.post('/documents', requireRole(['admin']), upload.single('file'), async (req, res) => {
    try {
        const { title, description, category_id } = req.body
        const file = req.file

        if (!title) {
            return res.status(400).json({ success: false, message: '文档标题不能为空' })
        }

        if (!category_id) {
            return res.status(400).json({ success: false, message: '请选择分类' })
        }

        if (!file) {
            return res.status(400).json({ success: false, message: '请上传文件' })
        }

        // 检查分类是否存在
        const category = await CompilationCategory.findByPk(category_id)
        if (!category) {
            // 删除已上传的文件
            fs.unlinkSync(file.path)
            return res.status(400).json({ success: false, message: '分类不存在' })
        }

        // 获取文件类型
        const ext = path.extname(file.originalname).toLowerCase()
        const fileType = ext === '.pdf' ? 'pdf' : 'docx'

        const document = await CompilationDocument.create({
            title,
            description,
            category_id,
            file_name: file.originalname,
            file_path: `/uploads/compilation/${file.filename}`,
            file_type: fileType,
            file_size: file.size
        })

        // 重新查询以包含分类信息
        const documentWithCategory = await CompilationDocument.findByPk(document.id, {
            include: [
                {
                    model: CompilationCategory,
                    as: 'category',
                    attributes: ['id', 'name']
                }
            ]
        })

        res.json({ success: true, data: documentWithCategory, message: '文档上传成功' })
    } catch (error) {
        console.error('上传文档失败:', error)
        // 删除已上传的文件
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path)
            } catch (e) {
                console.error('删除文件失败:', e)
            }
        }
        res.status(500).json({ success: false, message: '上传文档失败' })
    }
})

/**
 * 编辑文档信息（管理员）
 */
router.put('/documents/:id', requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params
        const { title, description, category_id } = req.body

        const document = await CompilationDocument.findByPk(id)
        if (!document) {
            return res.status(404).json({ success: false, message: '文档不存在' })
        }

        // 如果修改了分类，检查分类是否存在
        if (category_id && category_id !== document.category_id) {
            const category = await CompilationCategory.findByPk(category_id)
            if (!category) {
                return res.status(400).json({ success: false, message: '分类不存在' })
            }
        }

        await document.update({
            title: title || document.title,
            description,
            category_id: category_id || document.category_id
        })

        // 重新查询以包含分类信息
        const documentWithCategory = await CompilationDocument.findByPk(id, {
            include: [
                {
                    model: CompilationCategory,
                    as: 'category',
                    attributes: ['id', 'name']
                }
            ]
        })

        res.json({ success: true, data: documentWithCategory, message: '文档更新成功' })
    } catch (error) {
        console.error('编辑文档失败:', error)
        res.status(500).json({ success: false, message: '编辑文档失败' })
    }
})

/**
 * 删除文档（管理员）
 */
router.delete('/documents/:id', requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params

        const document = await CompilationDocument.findByPk(id)
        if (!document) {
            return res.status(404).json({ success: false, message: '文档不存在' })
        }

        // 删除文件
        const filePath = path.join(__dirname, '..', document.file_path)
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }

        await document.destroy()
        res.json({ success: true, message: '文档删除成功' })
    } catch (error) {
        console.error('删除文档失败:', error)
        res.status(500).json({ success: false, message: '删除文档失败' })
    }
})

/**
 * 置顶/取消置顶（管理员）
 */
router.put('/documents/:id/pin', requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params
        const { is_pinned } = req.body

        const document = await CompilationDocument.findByPk(id)
        if (!document) {
            return res.status(404).json({ success: false, message: '文档不存在' })
        }

        await document.update({ is_pinned })

        res.json({
            success: true,
            data: document,
            message: is_pinned ? '已置顶' : '已取消置顶'
        })
    } catch (error) {
        console.error('置顶操作失败:', error)
        res.status(500).json({ success: false, message: '置顶操作失败' })
    }
})

/**
 * 下载文档（所有用户）
 */
router.get('/documents/:id/download', async (req, res) => {
    try {
        const { id } = req.params

        const document = await CompilationDocument.findByPk(id)
        if (!document) {
            return res.status(404).json({ success: false, message: '文档不存在' })
        }

        // 增加下载次数
        await document.increment('download_count')

        const filePath = path.join(__dirname, '..', document.file_path)
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: '文件不存在' })
        }

        res.download(filePath, document.file_name)
    } catch (error) {
        console.error('下载文档失败:', error)
        res.status(500).json({ success: false, message: '下载文档失败' })
    }
})

/**
 * 预览文档（所有用户，仅PDF）
 */
router.get('/documents/:id/preview', async (req, res) => {
    try {
        const { id } = req.params

        const document = await CompilationDocument.findByPk(id)
        if (!document) {
            return res.status(404).json({ success: false, message: '文档不存在' })
        }

        if (document.file_type !== 'pdf') {
            return res.status(400).json({ success: false, message: '只有PDF文件支持预览' })
        }

        // 增加查看次数
        await document.increment('view_count')

        const filePath = path.join(__dirname, '..', document.file_path)
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: '文件不存在' })
        }

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'inline')
        fs.createReadStream(filePath).pipe(res)
    } catch (error) {
        console.error('预览文档失败:', error)
        res.status(500).json({ success: false, message: '预览文档失败' })
    }
})

/**
 * 预览 DOCX 文档（转换为 HTML）
 */
router.get('/documents/:id/preview-docx', async (req, res) => {
    try {
        const { id } = req.params

        const document = await CompilationDocument.findByPk(id)
        if (!document) {
            return res.status(404).json({ success: false, message: '文档不存在' })
        }

        if (document.file_type !== 'docx') {
            return res.status(400).json({ success: false, message: '只有DOCX文件支持此预览' })
        }

        // 增加查看次数
        await document.increment('view_count')

        const filePath = path.join(__dirname, '..', document.file_path)
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: '文件不存在' })
        }

        // 使用 mammoth 转换 DOCX 为 HTML
        const mammoth = require('mammoth')
        const result = await mammoth.convertToHtml({ path: filePath })
        
        res.json({
            success: true,
            data: {
                html: result.value,
                messages: result.messages
            }
        })
    } catch (error) {
        console.error('预览DOCX失败:', error)
        res.status(500).json({ success: false, message: '预览DOCX失败' })
    }
})

module.exports = router
