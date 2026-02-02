/**
 * 认证路由
 */
const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { User } = require('../models')
const { authenticateToken } = require('../middleware/auth')

// 注册
router.post('/register', async (req, res) => {
    try {
        const { username, password, name, prisonName, phone } = req.body

        // 验证必填字段
        if (!username || !password || !name) {
            return res.status(400).json({ error: '用户名、密码、姓名为必填项' })
        }

        // 检查用户名是否已存在
        const existing = await User.findOne({ where: { username } })
        if (existing) {
            return res.status(400).json({ error: '用户名已存在' })
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10)

        // 创建用户
        const user = await User.create({
            username,
            password: hashedPassword,
            name,
            prison_name: prisonName,
            phone,
            role: 'inspector'
        })

        res.status(201).json({
            message: '注册成功',
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                prisonName: user.prison_name,
                role: user.role
            }
        })
    } catch (error) {
        console.error('注册失败:', error)
        res.status(500).json({ error: '注册失败' })
    }
})

// 登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({ error: '请输入用户名和密码' })
        }

        // 查找用户
        const user = await User.findOne({ where: { username } })
        if (!user) {
            return res.status(401).json({ error: '用户名或密码错误' })
        }

        // 验证密码
        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
            return res.status(401).json({ error: '用户名或密码错误' })
        }

        // 检查账号状态
        if (user.status !== 'active') {
            return res.status(401).json({ error: '账号已被禁用' })
        }

        // 更新最后登录时间
        await user.update({ last_login: new Date() })

        // 如果是分管领导，获取监狱范围（去重）
        let prisonScopes = []
        if (user.role === 'leader') {
            const { UserPrisonScope } = require('../models')
            const scopes = await UserPrisonScope.findAll({
                where: { user_id: user.id },
                attributes: ['prison_name']
            })
            // 去重处理
            const prisonNames = scopes.map(s => s.prison_name)
            prisonScopes = [...new Set(prisonNames)]
        }

        // 生成 Token
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        )

        res.json({
            message: '登录成功',
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                prison_name: user.prison_name,
                role: user.role,
                prisonScopes: prisonScopes
            }
        })
    } catch (error) {
        console.error('登录失败:', error)
        res.status(500).json({ error: '登录失败' })
    }
})

// 获取当前用户信息
router.get('/profile', authenticateToken, async (req, res) => {
    res.json({
        user: {
            id: req.user.id,
            username: req.user.username,
            name: req.user.name,
            prisonName: req.user.prison_name,
            role: req.user.role,
            phone: req.user.phone,
            lastLogin: req.user.last_login
        }
    })
})

// 修改密码
router.put('/password', authenticateToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: '请输入旧密码和新密码' })
        }

        // 获取完整用户信息（包含密码）
        const user = await User.findByPk(req.userId)

        // 验证旧密码
        const isValid = await bcrypt.compare(oldPassword, user.password)
        if (!isValid) {
            return res.status(400).json({ error: '旧密码错误' })
        }

        // 加密新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await user.update({ password: hashedPassword })

        res.json({ message: '密码修改成功' })
    } catch (error) {
        console.error('修改密码失败:', error)
        res.status(500).json({ error: '修改密码失败' })
    }
})

// 更新用户信息
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, prisonName, phone } = req.body

        await req.user.update({
            name: name || req.user.name,
            prison_name: prisonName || req.user.prison_name,
            phone: phone || req.user.phone
        })

        res.json({
            message: '更新成功',
            user: {
                id: req.user.id,
                username: req.user.username,
                name: req.user.name,
                prisonName: req.user.prison_name,
                role: req.user.role,
                phone: req.user.phone
            }
        })
    } catch (error) {
        console.error('更新失败:', error)
        res.status(500).json({ error: '更新失败' })
    }
})

module.exports = router
