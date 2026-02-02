/**
 * 及时检察事件路由
 */
const express = require('express')
const router = express.Router()
const { Op } = require('sequelize')
const { ImmediateEvent } = require('../models')
const { authenticateToken } = require('../middleware/auth')

router.use(authenticateToken)

// 获取及时检察事件列表
router.get('/', async (req, res) => {
    try {
        const { month, eventType, status, prison_name, page = 1, pageSize = 20 } = req.query
        
        // 获取用户信息
        const { User } = require('../models')
        const user = await User.findByPk(req.userId, { attributes: ['prison_name', 'role'] })
        
        if (!user) {
            return res.status(401).json({ error: '用户不存在' })
        }

        // 根据权限获取监狱范围
        const { getUserPrisonScope } = require('../middleware/permission')
        const prisonScope = await getUserPrisonScope(req.userId, user.role)
        
        // 确定要查询的监狱
        let targetPrison = prison_name
        
        // 检察官：只能查看自己的监狱
        if (user.role === 'inspector') {
            targetPrison = user.prison_name
        }
        // 领导/院领导：如果没指定监狱，使用第一个有权限的监狱
        else if ((user.role === 'leader' || user.role === 'top_viewer' || user.role === 'admin') && !targetPrison) {
            if (prisonScope === 'ALL') {
                // 如果有全部权限但没指定监狱，返回空数据（需要前端选择）
                return res.json({
                    total: 0,
                    page: parseInt(page),
                    pageSize: parseInt(pageSize),
                    prisonName: null,
                    needSelectPrison: true,
                    message: '请选择要查看的监狱',
                    data: []
                })
            } else if (Array.isArray(prisonScope) && prisonScope.length > 0) {
                // 使用第一个有权限的监狱
                targetPrison = prisonScope[0]
            } else {
                // 没有权限
                return res.json({
                    total: 0,
                    page: parseInt(page),
                    pageSize: parseInt(pageSize),
                    data: []
                })
            }
        }
        
        // 权限检查：确保有权查看该监狱
        if (prisonScope !== 'ALL') {
            if (!Array.isArray(prisonScope) || !prisonScope.includes(targetPrison)) {
                return res.status(403).json({ error: '无权查看该监狱的数据' })
            }
        }

        // 查询该监狱的所有用户
        const prisonUsers = await User.findAll({
            where: { prison_name: targetPrison },
            attributes: ['id']
        })
        const userIds = prisonUsers.map(u => u.id)

        // 构建查询条件
        const where = {
            user_id: { [Op.in]: userIds }
        }

        if (month) {
            const [year, m] = month.split('-')
            const start = new Date(year, m - 1, 1)
            const end = new Date(year, m, 0)
            where.event_date = { [Op.between]: [start, end] }
        }

        if (eventType) where.event_type = eventType
        if (status) where.status = status

        const { count, rows } = await ImmediateEvent.findAndCountAll({
            where,
            order: [['event_date', 'DESC']],
            limit: parseInt(pageSize),
            offset: (parseInt(page) - 1) * parseInt(pageSize)
        })

        res.json({
            total: count,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            prisonName: targetPrison,
            data: rows
        })
    } catch (error) {
        console.error('获取及时检察事件失败:', error)
        res.status(500).json({ error: '获取及时检察事件失败' })
    }
})

// 创建及时检察事件
router.post('/', async (req, res) => {
    try {
        const { eventDate, eventType, title, description, paroleData, attachmentIds } = req.body

        console.log('📝 创建及时检察事件请求:')
        console.log('  用户ID:', req.userId)
        console.log('  事件类型:', eventType)
        console.log('  标题:', title)
        console.log('  附件IDs:', attachmentIds)

        if (!eventType) {
            return res.status(400).json({ error: '事件类型为必填项' })
        }

        if (!req.userId) {
            console.error('❌ 用户ID不存在')
            return res.status(401).json({ error: '用户未认证' })
        }

        const eventData = {
            user_id: req.userId,
            event_date: eventDate || new Date(),
            event_type: eventType,
            title: title || '',
            description: description || '',
            parole_data: paroleData || null,
            attachment_ids: attachmentIds || []
        }

        console.log('  准备创建事件,数据:', JSON.stringify(eventData, null, 2))

        const event = await ImmediateEvent.create(eventData)

        console.log('✓ 事件创建成功:', event.id)

        res.status(201).json({ message: '创建成功', data: event })
    } catch (error) {
        console.error('❌ 创建及时检察事件失败:', error.message)
        console.error('详细错误:', error)
        res.status(500).json({ error: '创建及时检察事件失败: ' + error.message })
    }
})

// 更新及时检察事件
router.put('/:id', async (req, res) => {
    try {
        const event = await ImmediateEvent.findByPk(req.params.id) // 单机版：不过滤user_id
        if (!event) return res.status(404).json({ error: '事件不存在' })

        await event.update(req.body)
        res.json({ message: '更新成功', data: event })
    } catch (error) {
        console.error('更新及时检察事件失败:', error)
        res.status(500).json({ error: '更新及时检察事件失败' })
    }
})

// 删除及时检察事件
router.delete('/:id', async (req, res) => {
    try {
        const event = await ImmediateEvent.findByPk(req.params.id) // 单机版：不过滤user_id
        if (!event) return res.status(404).json({ error: '事件不存在' })

        await event.destroy()
        res.json({ message: '删除成功' })
    } catch (error) {
        console.error('删除及时检察事件失败:', error)
        res.status(500).json({ error: '删除及时检察事件失败' })
    }
})

// 导出及时检察事件为Word文档
router.get('/:id/export', async (req, res) => {
    try {
        const { User } = require('../models')
        
        const event = await ImmediateEvent.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['prison_name']
            }]
        })
        
        if (!event) {
            return res.status(404).json({ error: '事件不存在' })
        }

        // 添加监狱名称到事件对象
        const eventWithPrison = {
            ...event.toJSON(),
            prison_name: event.user?.prison_name || '监狱'
        }

        const { generateImmediateEventDocument } = require('../utils/immediateEventGenerator')
        const buffer = await generateImmediateEventDocument(eventWithPrison)

        const eventTypeMap = {
            'escape': '脱逃',
            'selfHarm': '自伤自残',
            'death': '死亡',
            'epidemic': '重大疫情',
            'accident': '安全事故',
            'paroleRequest': '减刑假释',
            'disciplinaryAction': '民警处分'
        }
        
        const eventTypeName = eventTypeMap[event.event_type] || '及时检察'
        const dateStr = event.event_date.replace(/-/g, '')
        const prisonName = event.user?.prison_name || '监狱'
        const filename = `${prisonName}_及时检察_${eventTypeName}_${dateStr}.docx`

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
        res.send(buffer)
    } catch (error) {
        console.error('导出及时检察事件失败:', error)
        res.status(500).json({ error: '导出失败: ' + error.message })
    }
})

module.exports = router
