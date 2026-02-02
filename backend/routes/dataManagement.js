/**
 * 数据管理路由 - 用于清空测试数据
 */
const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const { DailyLog, WeeklyRecord, MonthlyRecord, ImmediateEvent, Attachment } = require('../models')

// 所有路由需要认证
router.use(authenticateToken)

/**
 * POST /api/data-management/clear-all
 * 清空所有数据（仅用于测试）
 */
router.post('/clear-all', async (req, res) => {
    try {
        // 只有管理员可以执行此操作
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: '只有管理员可以清空数据' })
        }

        const result = {
            daily_logs: 0,
            weekly_records: 0,
            monthly_records: 0,
            immediate_events: 0,
            attachments: 0
        }

        // 清空各表
        result.daily_logs = await DailyLog.destroy({ where: {}, truncate: false })
        result.weekly_records = await WeeklyRecord.destroy({ where: {}, truncate: false })
        result.monthly_records = await MonthlyRecord.destroy({ where: {}, truncate: false })
        result.immediate_events = await ImmediateEvent.destroy({ where: {}, truncate: false })
        result.attachments = await Attachment.destroy({ where: {}, truncate: false })

        console.log('数据已清空:', result)

        res.json({
            success: true,
            message: '所有数据已清空',
            deleted: result
        })
    } catch (error) {
        console.error('清空数据失败:', error)
        res.status(500).json({ error: '清空数据失败: ' + error.message })
    }
})

/**
 * DELETE /api/data-management/clear-by-date
 * 清空指定日期的数据
 */
router.delete('/clear-by-date', async (req, res) => {
    try {
        const { date } = req.query

        if (!date) {
            return res.status(400).json({ error: '请指定日期' })
        }

        const result = {
            daily_logs: 0,
            weekly_records: 0,
            monthly_records: 0,
            immediate_events: 0
        }

        // 删除指定日期的数据
        result.daily_logs = await DailyLog.destroy({ where: { log_date: date } })
        result.weekly_records = await WeeklyRecord.destroy({ where: { record_date: date } })

        // 月检察按月份
        const month = date.slice(0, 7)
        result.monthly_records = await MonthlyRecord.destroy({ where: { record_month: month } })
        result.immediate_events = await ImmediateEvent.destroy({ where: { event_date: date } })

        res.json({
            success: true,
            message: `${date} 的数据已清空`,
            deleted: result
        })
    } catch (error) {
        console.error('清空指定日期数据失败:', error)
        res.status(500).json({ error: '清空数据失败: ' + error.message })
    }
})

/**
 * DELETE /api/data-management/clear-by-month
 * 清空指定月份的数据（支持按监狱过滤）
 */
router.delete('/clear-by-month', async (req, res) => {
    try {
        const { year, month, prison_name } = req.query

        if (!year || !month) {
            return res.status(400).json({ error: '请指定年份和月份' })
        }

        // 权限检查
        const { getUserPrisonScope } = require('../middleware/permission')
        const prisonScope = await getUserPrisonScope(req.user.id, req.user.role)
        
        // 确定要清空的监狱
        let targetPrison = prison_name
        
        if (prisonScope !== 'ALL') {
            // 非管理员/院领导，只能清空自己监狱的数据
            if (!targetPrison) {
                // 如果没有指定监狱，使用用户自己的监狱
                targetPrison = req.user.prison_name
            } else if (!Array.isArray(prisonScope) || !prisonScope.includes(targetPrison)) {
                return res.status(403).json({ error: '无权清空该监狱的数据' })
            }
        }

        const result = {
            daily_logs: 0,
            weekly_records: 0,
            monthly_records: 0,
            immediate_events: 0
        }

        // 构建月份范围
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 1)
        const monthStr = `${year}-${String(month).padStart(2, '0')}`

        // 获取目标监狱的所有用户ID
        const { User } = require('../models')
        const whereUser = targetPrison ? { prison_name: targetPrison } : {}
        const users = await User.findAll({
            where: whereUser,
            attributes: ['id']
        })
        const userIds = users.map(u => u.id)

        if (userIds.length === 0) {
            return res.json({
                success: true,
                message: `${targetPrison || '所有监狱'}的${year}年${month}月没有数据`,
                deleted: result
            })
        }

        // 删除指定月份和监狱的数据
        const { Op } = require('sequelize')

        result.daily_logs = await DailyLog.destroy({
            where: {
                user_id: { [Op.in]: userIds },
                log_date: {
                    [Op.gte]: startDate,
                    [Op.lt]: endDate
                }
            }
        })

        result.weekly_records = await WeeklyRecord.destroy({
            where: {
                user_id: { [Op.in]: userIds },
                record_date: {
                    [Op.gte]: startDate,
                    [Op.lt]: endDate
                }
            }
        })

        result.monthly_records = await MonthlyRecord.destroy({
            where: {
                user_id: { [Op.in]: userIds },
                record_month: monthStr
            }
        })

        result.immediate_events = await ImmediateEvent.destroy({
            where: {
                user_id: { [Op.in]: userIds },
                event_date: {
                    [Op.gte]: startDate,
                    [Op.lt]: endDate
                }
            }
        })

        const prisonInfo = targetPrison ? `${targetPrison}的` : ''
        console.log(`已清空${prisonInfo}${year}年${month}月数据:`, result)

        res.json({
            success: true,
            message: `${prisonInfo}${year}年${month}月的数据已清空`,
            deleted: result
        })
    } catch (error) {
        console.error('清空指定月份数据失败:', error)
        res.status(500).json({ error: '清空数据失败: ' + error.message })
    }
})

module.exports = router
