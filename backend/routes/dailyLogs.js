/**
 * 日检察日志路由
 */
const express = require('express')
const router = express.Router()
const { DailyLog, User, Attachment, WeeklyRecord, MonthlyRecord } = require('../models')
const { authenticateToken, requireRole } = require('../middleware/auth')
const { Op } = require('sequelize')

// 所有路由需要认证
router.use(authenticateToken)

/**
 * GET /api/daily-logs
 * 获取日检察日志列表
 * 查询参数:
 *   - month: YYYY-MM 格式，按月份筛选
 *   - startDate: YYYY-MM-DD 格式，日期范围开始
 *   - endDate: YYYY-MM-DD 格式，日期范围结束
 *   - prison_name: 监狱名称筛选 (仅管理员可用)
 *   - page: 页码 (默认 1)
 *   - pageSize: 每页数量 (默认 20)
 */
router.get('/', async (req, res) => {
    try {
        const { month, startDate, endDate, page = 1, pageSize = 20 } = req.query

        const where = {}

        // 权限过滤：根据用户角色和监狱范围过滤数据
        const { getUserPrisonScope } = require('../middleware/permission')
        const user = await User.findByPk(req.userId)
        
        if (!user) {
            return res.status(401).json({ error: '用户不存在' })
        }

        const prisonScope = await getUserPrisonScope(req.userId, user.role)
        
        // 如果不是院领导（ALL权限），需要按监狱范围过滤
        if (prisonScope !== 'ALL') {
            if (Array.isArray(prisonScope) && prisonScope.length > 0) {
                where.prison_name = { [Op.in]: prisonScope }
            } else {
                // 没有权限，返回空数据
                return res.json({
                    total: 0,
                    page: parseInt(page),
                    pageSize: parseInt(pageSize),
                    data: []
                })
            }
        }

        // 可选的监所名称筛选（在权限范围内）
        if (req.query.prison_name) {
            // 检查是否在权限范围内
            if (prisonScope !== 'ALL' && !prisonScope.includes(req.query.prison_name)) {
                return res.status(403).json({ error: '无权查看该监狱的数据' })
            }
            where.prison_name = req.query.prison_name
        }

        // 月份筛选
        if (month) {
            const [year, m] = month.split('-')
            const start = new Date(parseInt(year), parseInt(m) - 1, 1)
            const end = new Date(parseInt(year), parseInt(m), 0)
            where.log_date = { [Op.between]: [start, end] }
        }

        // 按日期范围筛选
        if (startDate && endDate) {
            where.log_date = { [Op.between]: [startDate, endDate] }
        }

        const { count, rows } = await DailyLog.findAndCountAll({
            where,
            order: [['log_date', 'DESC']],
            limit: parseInt(pageSize),
            offset: (parseInt(page) - 1) * parseInt(pageSize)
        })

        res.json({
            total: count,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            data: rows
        })
    } catch (error) {
        console.error('获取日志失败:', error)
        res.status(500).json({ error: '获取日志失败' })
    }
})

// 检查指定日期是否已有日志
router.get('/check-date/:date', async (req, res) => {
    try {
        const { date } = req.params

        const where = {
            log_date: date
        }

        // 权限过滤：只能查看自己监狱范围内的数据
        const { getUserPrisonScope } = require('../middleware/permission')
        const user = await User.findByPk(req.userId)
        
        if (!user) {
            return res.status(401).json({ error: '用户不存在' })
        }

        const prisonScope = await getUserPrisonScope(req.userId, user.role)
        
        if (prisonScope !== 'ALL') {
            if (Array.isArray(prisonScope) && prisonScope.length > 0) {
                where.prison_name = { [Op.in]: prisonScope }
            } else {
                return res.json({ exists: false, log: null })
            }
        }

        const existingLog = await DailyLog.findOne({ where })

        res.json({
            exists: !!existingLog,
            log: existingLog || null
        })
    } catch (error) {
        console.error('检查日期失败:', error)
        res.status(500).json({ error: '检查日期失败' })
    }
})

// 获取单条日志详情
router.get('/:id', async (req, res) => {
    try {
        const log = await DailyLog.findByPk(req.params.id)

        if (!log) {
            return res.status(404).json({ error: '日志不存在' })
        }

        // 权限检查：只能查看自己监狱范围内的数据
        const { canViewPrison } = require('../middleware/permission')
        const user = await User.findByPk(req.userId)
        
        if (!user) {
            return res.status(401).json({ error: '用户不存在' })
        }

        const canView = await canViewPrison(req.userId, user.role, log.prison_name)
        if (!canView) {
            return res.status(403).json({ error: '无权查看该监狱的数据' })
        }

        res.json(log)
    } catch (error) {
        console.error('获取日志详情失败:', error)
        res.status(500).json({ error: '获取日志详情失败' })
    }
})

// 创建日检察记录（仅检察官）
router.post('/', requireRole(['inspector']), async (req, res) => {
    try {
        // 支持两种命名格式：camelCase 和 snake_case
        const {
            logDate, log_date,
            prisonName, prison_name,
            inspectorName, inspector_name,
            threeScenes, three_scenes,
            strictControl, strict_control,
            policeEquipment, police_equipment,
            gangPrisoners, gang_prisoners,
            admission,
            monitorCheck, monitor_check,
            supervisionSituation, supervision_situation,
            feedbackSituation, feedback_situation,
            otherWork, other_work,
            notes
        } = req.body

        const log = await DailyLog.create({
            user_id: req.userId,
            log_date: logDate || log_date || new Date(),
            prison_name: prisonName || prison_name,
            inspector_name: inspectorName || inspector_name,
            three_scenes: threeScenes || three_scenes,
            strict_control: strictControl || strict_control,
            police_equipment: policeEquipment || police_equipment,
            gang_prisoners: gangPrisoners || gang_prisoners,
            admission: admission,
            monitor_check: monitorCheck || monitor_check,
            supervision_situation: supervisionSituation || supervision_situation,
            feedback_situation: feedbackSituation || feedback_situation,
            other_work: otherWork || other_work,
            notes
        })

        res.status(201).json({
            success: true,
            message: '创建成功',
            data: log
        })
    } catch (error) {
        console.error('创建日志失败:', error)
        res.status(500).json({ success: false, error: '创建日志失败' })
    }
})

// 更新日检察记录
router.put('/:id', async (req, res) => {
    try {
        const log = await DailyLog.findByPk(req.params.id)

        if (!log) {
            return res.status(404).json({ error: '日志不存在' })
        }

        // 权限检查：只能修改自己监狱的数据
        const user = await User.findByPk(req.userId)
        
        if (!user) {
            return res.status(401).json({ error: '用户不存在' })
        }

        // 检察官只能修改自己监狱的数据
        if (user.role === 'inspector' && log.prison_name !== user.prison_name) {
            return res.status(403).json({ error: '只能修改自己监狱的数据' })
        }

        // 领导需要检查监狱范围
        if (user.role === 'leader') {
            const { canViewPrison } = require('../middleware/permission')
            const canView = await canViewPrison(req.userId, user.role, log.prison_name)
            if (!canView) {
                return res.status(403).json({ error: '无权修改该监狱的数据' })
            }
        }

        const {
            logDate,
            prisonName,
            inspectorName,
            threeScenes,
            strictControl,
            policeEquipment,
            gangPrisoners,
            admission,
            monitorCheck,
            supervisionSituation,
            feedbackSituation,
            otherWork,
            notes
        } = req.body

        await log.update({
            log_date: logDate || log.log_date,
            prison_name: prisonName ?? log.prison_name,
            inspector_name: inspectorName ?? log.inspector_name,
            three_scenes: threeScenes ?? log.three_scenes,
            strict_control: strictControl ?? log.strict_control,
            police_equipment: policeEquipment ?? log.police_equipment,
            gang_prisoners: gangPrisoners ?? log.gang_prisoners,
            admission: admission ?? log.admission,
            monitor_check: monitorCheck ?? log.monitor_check,
            supervision_situation: supervisionSituation ?? log.supervision_situation,
            feedback_situation: feedbackSituation ?? log.feedback_situation,
            other_work: otherWork ?? log.other_work,
            notes: notes ?? log.notes
        })

        res.json({
            message: '更新成功',
            data: log
        })
    } catch (error) {
        console.error('更新日志失败:', error)
        res.status(500).json({ error: '更新日志失败' })
    }
})

// 删除日检察记录
router.delete('/:id', async (req, res) => {
    try {
        const log = await DailyLog.findByPk(req.params.id)

        if (!log) {
            return res.status(404).json({ error: '日志不存在' })
        }

        // 权限检查：只能删除自己监狱的数据
        const user = await User.findByPk(req.userId)
        
        if (!user) {
            return res.status(401).json({ error: '用户不存在' })
        }

        // 检察官只能删除自己监狱的数据
        if (user.role === 'inspector' && log.prison_name !== user.prison_name) {
            return res.status(403).json({ error: '只能删除自己监狱的数据' })
        }

        // 领导需要检查监狱范围
        if (user.role === 'leader') {
            const { canViewPrison } = require('../middleware/permission')
            const canView = await canViewPrison(req.userId, user.role, log.prison_name)
            if (!canView) {
                return res.status(403).json({ error: '无权删除该监狱的数据' })
            }
        }

        const fs = require('fs').promises
        const path = require('path')
        
        console.log(`🗑️ 开始删除日志 ID: ${log.id}, 日期: ${log.log_date}`)
        
        // 1. 删除日检察的附件（通过 related_log_id 关联）
        const dailyAttachments = await Attachment.findAll({
            where: {
                related_log_type: 'daily',
                related_log_id: log.id
            }
        })
        
        console.log(`  找到 ${dailyAttachments.length} 个日检察附件（通过log_id关联）`)
        
        for (const attachment of dailyAttachments) {
            try {
                // 删除文件
                await fs.unlink(attachment.file_path)
                console.log(`  ✅ 删除文件: ${attachment.file_name}`)
            } catch (error) {
                console.warn(`  ⚠️ 删除文件失败: ${attachment.file_name}`, error.message)
            }
            // 删除数据库记录
            await attachment.destroy()
        }
        
        // 2. 删除该日期的所有附件（通过日期关联）
        const logDate = new Date(log.log_date)
        const dateStr = logDate.toISOString().split('T')[0] // YYYY-MM-DD
        const yearMonth = dateStr.substring(0, 7) // YYYY-MM
        
        // 查找该日期的附件（两种方式）
        const dateAttachments = await Attachment.findAll({
            where: {
                [Op.or]: [
                    // 方式1：通过 upload_month 字段
                    {
                        upload_month: yearMonth,
                        file_name: {
                            [Op.like]: `${dateStr.replace(/-/g, '')}%` // 文件名以日期开头
                        }
                    },
                    // 方式2：通过 createdAt 字段（当天创建的附件）
                    {
                        createdAt: {
                            [Op.between]: [
                                new Date(dateStr + ' 00:00:00'),
                                new Date(dateStr + ' 23:59:59')
                            ]
                        }
                    }
                ]
            }
        })
        
        console.log(`  找到 ${dateAttachments.length} 个该日期的附件（通过日期关联）`)
        
        for (const attachment of dateAttachments) {
            try {
                await fs.unlink(attachment.file_path)
                console.log(`  ✅ 删除文件: ${attachment.file_name}`)
            } catch (error) {
                console.warn(`  ⚠️ 删除文件失败: ${attachment.file_name}`, error.message)
            }
            await attachment.destroy()
        }
        
        // 3. 查找并删除关联的周检察记录及其附件
        const weeklyRecords = await WeeklyRecord.findAll({
            where: { log_id: log.id }
        })
        
        console.log(`  找到 ${weeklyRecords.length} 个周检察记录`)
        
        for (const record of weeklyRecords) {
            // 删除周检察的附件
            const weeklyAttachments = await Attachment.findAll({
                where: {
                    related_log_type: 'weekly',
                    related_log_id: record.id
                }
            })
            
            console.log(`    周检察记录 ${record.id} 有 ${weeklyAttachments.length} 个附件`)
            
            for (const attachment of weeklyAttachments) {
                try {
                    await fs.unlink(attachment.file_path)
                    console.log(`    ✅ 删除文件: ${attachment.file_name}`)
                } catch (error) {
                    console.warn(`    ⚠️ 删除文件失败: ${attachment.file_name}`, error.message)
                }
                await attachment.destroy()
            }
            
            // 删除周检察记录
            await record.destroy()
            console.log(`  ✅ 删除周检察记录 ${record.id}`)
        }
        
        // 4. 查找并删除关联的月检察记录及其附件
        const monthlyRecords = await MonthlyRecord.findAll({
            where: { log_id: log.id }
        })
        
        console.log(`  找到 ${monthlyRecords.length} 个月检察记录`)
        
        for (const record of monthlyRecords) {
            // 删除月检察的附件
            const monthlyAttachments = await Attachment.findAll({
                where: {
                    related_log_type: 'monthly',
                    related_log_id: record.id
                }
            })
            
            console.log(`    月检察记录 ${record.id} 有 ${monthlyAttachments.length} 个附件`)
            
            for (const attachment of monthlyAttachments) {
                try {
                    await fs.unlink(attachment.file_path)
                    console.log(`    ✅ 删除文件: ${attachment.file_name}`)
                } catch (error) {
                    console.warn(`    ⚠️ 删除文件失败: ${attachment.file_name}`, error.message)
                }
                await attachment.destroy()
            }
            
            // 删除月检察记录
            await record.destroy()
            console.log(`  ✅ 删除月检察记录 ${record.id}`)
        }
        
        // 5. 最后删除日志记录
        await log.destroy()
        console.log(`✅ 删除日志 ${log.id} 完成`)

        res.json({ 
            message: '删除成功',
            deleted: {
                dailyAttachments: dailyAttachments.length,
                dateAttachments: dateAttachments.length,
                weeklyRecords: weeklyRecords.length,
                monthlyRecords: monthlyRecords.length
            }
        })
    } catch (error) {
        console.error('删除日志失败:', error)
        res.status(500).json({ error: '删除日志失败: ' + error.message })
    }
})

// 获取本月统计
router.get('/stats/monthly', async (req, res) => {
    try {
        const { month } = req.query
        const now = new Date()
        const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        const [year, m] = targetMonth.split('-')
        const start = new Date(year, m - 1, 1)
        const end = new Date(year, m, 0)

        const logs = await DailyLog.findAll({
            where: {
                user_id: req.userId,
                log_date: { [Op.between]: [start, end] }
            }
        })

        // 统计数据
        const stats = {
            totalLogs: logs.length,
            threeSceneChecks: 0,
            monitorChecks: 0,
            strictControlTotal: 0,
            gangPrisonersTotal: 0
        }

        for (const log of logs) {
            if (log.three_scenes) {
                const scenes = log.three_scenes
                if (scenes.labor?.checked) stats.threeSceneChecks++
                if (scenes.living?.checked) stats.threeSceneChecks++
                if (scenes.study?.checked) stats.threeSceneChecks++
            }
            if (log.monitor_check?.checked) {
                stats.monitorChecks += log.monitor_check.count || 1
            }
            if (log.strict_control) {
                stats.strictControlTotal = log.strict_control.totalCount || 0
            }
            if (log.gang_prisoners) {
                stats.gangPrisonersTotal = log.gang_prisoners.totalCount || 0
            }
        }

        res.json(stats)
    } catch (error) {
        console.error('获取统计失败:', error)
        res.status(500).json({ error: '获取统计失败' })
    }
})

// 预览日志（包含当天的周/月检察数据）
router.get('/:id/preview', async (req, res) => {
    try {
        const log = await DailyLog.findByPk(req.params.id)

        if (!log) {
            return res.status(404).json({ error: '日志不存在' })
        }

        // 单机版：不做权限检查

        // 查询同一天的周检察记录
        const weeklyRecords = await WeeklyRecord.findAll({
            where: {
                prison_name: log.prison_name,
                record_date: log.log_date
            }
        })

        // 查询同一天的月检察记录
        const monthlyRecords = await MonthlyRecord.findAll({
            where: {
                prison_name: log.prison_name,
                record_date: log.log_date
            }
        })

        res.json({
            log,
            weeklyRecords,
            monthlyRecords,
            hasWeeklyData: weeklyRecords.length > 0,
            hasMonthlyData: monthlyRecords.length > 0
        })
    } catch (error) {
        console.error('获取日志预览失败:', error)
        res.status(500).json({ error: '获取日志预览失败' })
    }
})

// 导出单条日志为 Word 文档
router.get('/:id/export', async (req, res) => {
    try {
        const log = await DailyLog.findByPk(req.params.id)

        if (!log) {
            return res.status(404).json({ error: '日志不存在' })
        }

        // 单机版：不做权限检查

        // 使用模板生成 Word 文档
        const { generateLogFromTemplate } = require('../utils/templateGenerator')

        // 直接生成文档（周/月检察数据暂不关联，避免查询错误）
        const docBuffer = await generateLogFromTemplate(log.toJSON(), [], [])

        // 设置响应头
        const dateStr = log.log_date ? new Date(log.log_date).toISOString().split('T')[0] : 'unknown'
        const filename = encodeURIComponent(`派驻检察工作日志_${dateStr}.docx`)

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.send(docBuffer)

    } catch (error) {
        console.error('导出日志失败:', error)
        res.status(500).json({ error: '导出日志失败: ' + error.message })
    }
})

module.exports = router
