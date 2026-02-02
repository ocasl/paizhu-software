/**
 * 周检察记录路由
 */
const express = require('express')
const router = express.Router()
const { Op } = require('sequelize')
const { WeeklyRecord } = require('../models')
const { authenticateToken } = require('../middleware/auth')

router.use(authenticateToken)

// 获取周检察记录列表
router.get('/', async (req, res) => {
    try {
        const { month, page = 1, pageSize = 20 } = req.query
        const where = {} // 单机版：不过滤user_id

        if (month) {
            const [year, m] = month.split('-')
            const start = new Date(year, m - 1, 1)
            const end = new Date(year, m, 0)
            where.record_date = { [Op.between]: [start, end] }
        }

        const { count, rows } = await WeeklyRecord.findAndCountAll({
            where,
            order: [['record_date', 'DESC']],
            limit: parseInt(pageSize),
            offset: (parseInt(page) - 1) * parseInt(pageSize)
        })

        res.json({ total: count, page: parseInt(page), pageSize: parseInt(pageSize), data: rows })
    } catch (error) {
        console.error('获取周检察记录失败:', error)
        res.status(500).json({ error: '获取周检察记录失败' })
    }
})

// 创建周检察记录
router.post('/', async (req, res) => {
    try {
        const { record_date, week_number, hospital_check, injury_check, talk_records, mailbox, contraband, notes, log_id, log_date } = req.body

        const record = await WeeklyRecord.create({
            user_id: req.userId,
            record_date: record_date || new Date(),
            week_number: week_number,
            hospital_check: hospital_check,
            injury_check: injury_check,
            talk_records: talk_records,
            mailbox: mailbox,
            contraband: contraband,
            notes,
            log_id: log_id,
            log_date: log_date
        })

        res.status(201).json({ message: '创建成功', data: record })
    } catch (error) {
        console.error('创建周检察记录失败:', error)
        res.status(500).json({ error: '创建周检察记录失败' })
    }
})

// 更新周检察记录
router.put('/:id', async (req, res) => {
    try {
        const record = await WeeklyRecord.findByPk(req.params.id) // 单机版：不过滤user_id
        if (!record) return res.status(404).json({ error: '记录不存在' })

        await record.update(req.body)
        res.json({ message: '更新成功', data: record })
    } catch (error) {
        console.error('更新周检察记录失败:', error)
        res.status(500).json({ error: '更新周检察记录失败' })
    }
})

// 删除周检察记录
router.delete('/:id', async (req, res) => {
    try {
        const record = await WeeklyRecord.findByPk(req.params.id) // 单机版：不过滤user_id
        if (!record) return res.status(404).json({ error: '记录不存在' })

        await record.destroy()
        res.json({ message: '删除成功' })
    } catch (error) {
        console.error('删除周检察记录失败:', error)
        res.status(500).json({ error: '删除周检察记录失败' })
    }
})

module.exports = router
