/**
 * 管理员路由
 * 用户管理、权限管理
 */
const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const { User } = require('../models')
const { authenticateToken, requireRole } = require('../middleware/auth')

// 所有管理员路由都需要认证和管理员权限
router.use(authenticateToken)
router.use(requireRole(['admin']))

/**
 * 获取用户列表
 */
router.get('/users', async (req, res) => {
    try {
        const { prison_name, role, status } = req.query

        const where = {}
        if (prison_name) where.prison_name = prison_name
        if (role) where.role = role
        if (status) where.status = status

        const users = await User.findAll({
            where,
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        })

        // 为分管领导加载监狱范围（去重）
        const { UserPrisonScope } = require('../models')
        const usersWithScopes = await Promise.all(users.map(async (user) => {
            const userData = user.toJSON()
            if (user.role === 'leader') {
                const scopes = await UserPrisonScope.findAll({
                    where: { user_id: user.id },
                    attributes: ['prison_name']
                })
                // 去重处理
                const prisonNames = scopes.map(s => s.prison_name)
                userData.prisonScopes = [...new Set(prisonNames)]
            }
            return userData
        }))

        res.json({ success: true, data: usersWithScopes })
    } catch (error) {
        console.error('获取用户列表失败:', error)
        res.status(500).json({ success: false, message: '获取用户列表失败' })
    }
})

/**
 * 获取单个用户
 */
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        })

        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' })
        }

        res.json({ success: true, data: user })
    } catch (error) {
        console.error('获取用户失败:', error)
        res.status(500).json({ success: false, message: '获取用户失败' })
    }
})

/**
 * 创建用户
 */
router.post('/users', async (req, res) => {
    try {
        const { username, password, name, prison_name, role, phone, prisonScopes } = req.body

        // 验证必填字段
        if (!username || !password || !name) {
            return res.status(400).json({
                success: false,
                message: '用户名、密码和姓名为必填项'
            })
        }

        // 检查用户名是否存在
        const existing = await User.findOne({ where: { username } })
        if (existing) {
            return res.status(400).json({
                success: false,
                message: '用户名已存在'
            })
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({
            username,
            password: hashedPassword,
            name,
            prison_name: prison_name || null,
            role: role || 'inspector',
            phone: phone || null,
            status: 'active'
        })

        // 如果是分管领导，保存监狱范围（去重）
        if (role === 'leader' && prisonScopes && prisonScopes.length > 0) {
            const { UserPrisonScope } = require('../models')
            // 去重处理
            const uniquePrisons = [...new Set(prisonScopes)]
            const scopeData = uniquePrisons.map(prisonName => ({
                user_id: user.id,
                prison_name: prisonName
            }))
            await UserPrisonScope.bulkCreate(scopeData)
        }

        // 返回用户信息（不含密码）
        const userData = user.toJSON()
        delete userData.password

        res.status(201).json({ success: true, data: userData, message: '用户创建成功' })
    } catch (error) {
        console.error('创建用户失败:', error)
        res.status(500).json({ success: false, message: '创建用户失败' })
    }
})

/**
 * 更新用户信息
 */
router.put('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id)

        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' })
        }

        const { name, prison_name, role, phone, status, prisonScopes } = req.body

        await user.update({
            name: name !== undefined ? name : user.name,
            prison_name: prison_name !== undefined ? prison_name : user.prison_name,
            role: role !== undefined ? role : user.role,
            phone: phone !== undefined ? phone : user.phone,
            status: status !== undefined ? status : user.status
        })

        // 如果是分管领导，更新监狱范围（去重）
        if (role === 'leader' && prisonScopes !== undefined) {
            const { UserPrisonScope } = require('../models')
            
            // 删除旧的范围
            await UserPrisonScope.destroy({ where: { user_id: user.id } })
            
            // 添加新的范围
            if (Array.isArray(prisonScopes) && prisonScopes.length > 0) {
                // 去重处理
                const uniquePrisons = [...new Set(prisonScopes)]
                const scopeData = uniquePrisons.map(prisonName => ({
                    user_id: user.id,
                    prison_name: prisonName
                }))
                await UserPrisonScope.bulkCreate(scopeData)
            }
        } else if (role !== 'leader') {
            // 如果角色不是 leader，删除所有监狱范围
            const { UserPrisonScope } = require('../models')
            await UserPrisonScope.destroy({ where: { user_id: user.id } })
        }

        const userData = user.toJSON()
        delete userData.password

        res.json({ success: true, data: userData, message: '用户信息已更新' })
    } catch (error) {
        console.error('更新用户失败:', error)
        console.error('错误详情:', error.message)
        console.error('错误堆栈:', error.stack)
        res.status(500).json({ success: false, message: '更新用户失败: ' + error.message })
    }
})

/**
 * 重置用户密码
 */
router.put('/users/:id/password', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id)

        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' })
        }

        const { password } = req.body
        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: '密码至少需要6位'
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        await user.update({ password: hashedPassword })

        res.json({ success: true, message: '密码已重置' })
    } catch (error) {
        console.error('重置密码失败:', error)
        res.status(500).json({ success: false, message: '重置密码失败' })
    }
})

/**
 * 删除用户
 */
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id)

        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' })
        }

        // 防止删除自己
        if (user.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: '不能删除自己的账号'
            })
        }

        await user.destroy()
        res.json({ success: true, message: '用户已删除' })
    } catch (error) {
        console.error('删除用户失败:', error)
        res.status(500).json({ success: false, message: '删除用户失败' })
    }
})

/**
 * 获取派驻单位列表（去重，包含users和prison_scopes）
 */
router.get('/prisons', async (req, res) => {
    try {
        // 从users表获取
        const users = await User.findAll({
            attributes: ['prison_name'],
            where: { prison_name: { [require('sequelize').Op.ne]: null } },
            group: ['prison_name']
        })
        const prisonsFromUsers = users.map(u => u.prison_name).filter(Boolean)
        
        // 从user_prison_scopes表获取
        const { UserPrisonScope } = require('../models')
        const scopes = await UserPrisonScope.findAll({
            attributes: ['prison_name'],
            group: ['prison_name']
        })
        const prisonsFromScopes = scopes.map(s => s.prison_name).filter(Boolean)
        
        // 合并并去重
        const allPrisons = [...new Set([...prisonsFromUsers, ...prisonsFromScopes])]
        
        res.json({ success: true, data: allPrisons })
    } catch (error) {
        console.error('获取派驻单位列表失败:', error)
        res.status(500).json({ success: false, message: '获取派驻单位列表失败' })
    }
})

/**
 * 获取用户的监狱范围
 */
router.get('/users/:id/prison-scopes', async (req, res) => {
    try {
        const { UserPrisonScope } = require('../models')
        
        const scopes = await UserPrisonScope.findAll({
            where: { user_id: req.params.id }
        })

        res.json({ success: true, data: scopes })
    } catch (error) {
        console.error('获取监狱范围失败:', error)
        res.status(500).json({ success: false, message: '获取监狱范围失败' })
    }
})

module.exports = router
