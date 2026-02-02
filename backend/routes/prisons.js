/**
 * 监狱列表路由
 */
const express = require('express')
const router = express.Router()
const { User } = require('../models')
const { authenticateToken } = require('../middleware/auth')
const { Op } = require('sequelize')
const sequelize = require('../models').sequelize

router.use(authenticateToken)

/**
 * 获取所有监狱列表
 * 只有院领导和管理员可以访问
 */
router.get('/list', async (req, res) => {
    try {
        const user = req.user
        
        // 只有院领导和管理员可以获取所有监狱列表
        if (user.role !== 'top_viewer' && user.role !== 'admin') {
            return res.status(403).json({ error: '无权限' })
        }
        
        // 从 users 表中获取所有不同的监狱名称
        const prisons = await User.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('prison_name')), 'prison_name']],
            where: {
                prison_name: { [Op.ne]: null }
            },
            raw: true
        })
        
        const prisonList = prisons.map(p => p.prison_name).filter(Boolean).sort()
        
        res.json({
            success: true,
            prisons: prisonList
        })
    } catch (error) {
        console.error('获取监狱列表失败:', error)
        res.status(500).json({ error: '获取监狱列表失败' })
    }
})

module.exports = router
