/**
 * 月检察记录路由
 */
const express = require('express')
const router = express.Router()
const { MonthlyRecord } = require('../models')
const { authenticateToken } = require('../middleware/auth')

router.use(authenticateToken)

// 获取月检察记录列表
router.get('/', async (req, res) => {
    try {
        const { year, month, page = 1, pageSize = 12 } = req.query
        const where = {} // 单机版：不过滤user_id

        if (month) {
            // 按月份筛选 (YYYY-MM格式)
            where.record_month = month
        } else if (year) {
            // 按年份筛选
            where.record_month = { [require('sequelize').Op.startsWith]: year }
        }

        const { count, rows } = await MonthlyRecord.findAndCountAll({
            where,
            order: [['record_month', 'DESC']],
            limit: parseInt(pageSize),
            offset: (parseInt(page) - 1) * parseInt(pageSize)
        })

        res.json({ total: count, page: parseInt(page), pageSize: parseInt(pageSize), data: rows })
    } catch (error) {
        console.error('获取月检察记录失败:', error)
        res.status(500).json({ error: '获取月检察记录失败' })
    }
})

// 获取或创建当月记录
router.get('/current', async (req, res) => {
    try {
        const now = new Date()
        const recordMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        let [record, created] = await MonthlyRecord.findOrCreate({
            where: { user_id: req.userId, record_month: recordMonth },
            defaults: { user_id: req.userId, record_month: recordMonth }
        })

        res.json({ data: record, created })
    } catch (error) {
        console.error('获取当月记录失败:', error)
        res.status(500).json({ error: '获取当月记录失败' })
    }
})

// 创建月检察记录
router.post('/', async (req, res) => {
    try {
        const { record_month, record_date, visit_check, meeting, punishment, position_stats, notes, log_id, log_date } = req.body

        const record = await MonthlyRecord.create({
            user_id: req.userId,
            record_month: record_month,
            record_date: record_date,
            visit_check: visit_check,
            meeting: meeting,
            punishment: punishment,
            position_stats: position_stats,
            notes,
            log_id: log_id,
            log_date: log_date
        })

        res.status(201).json({ message: '创建成功', data: record })
    } catch (error) {
        console.error('创建月检察记录失败:', error)
        res.status(500).json({ error: '创建月检察记录失败' })
    }
})

// 更新月检察记录
router.put('/:id', async (req, res) => {
    try {
        const record = await MonthlyRecord.findByPk(req.params.id) // 单机版：不过滤user_id
        if (!record) return res.status(404).json({ error: '记录不存在' })

        await record.update(req.body)
        res.json({ message: '更新成功', data: record })
    } catch (error) {
        console.error('更新月检察记录失败:', error)
        res.status(500).json({ error: '更新月检察记录失败' })
    }
})

module.exports = router
