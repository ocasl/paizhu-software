/**
 * JWT 认证中间件
 */
const jwt = require('jsonwebtoken')
const { User } = require('../models')

// 验证 Token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]  // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: '未提供访问令牌' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // 查询用户
        const user = await User.findByPk(decoded.userId, {
            attributes: { exclude: ['password'] }
        })

        if (!user) {
            return res.status(401).json({ error: '用户不存在' })
        }

        if (user.status !== 'active') {
            return res.status(401).json({ error: '账号已被禁用' })
        }

        req.user = user
        req.userId = user.id
        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: '令牌已过期，请重新登录' })
        }
        return res.status(403).json({ error: '无效的访问令牌' })
    }
}

// 验证管理员权限
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: '需要管理员权限' })
    }
    next()
}

// 验证领导权限
const requireLeader = (req, res, next) => {
    if (!['admin', 'leader'].includes(req.user.role)) {
        return res.status(403).json({ error: '需要领导权限' })
    }
    next()
}

// 验证指定角色权限（通用）
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `需要 ${roles.join(' 或 ')} 权限` })
        }
        next()
    }
}

// 验证检察员权限（只允许检察员）
const requireInspector = (req, res, next) => {
    if (req.user.role !== 'inspector') {
        return res.status(403).json({ error: '此操作仅限检察员' })
    }
    next()
}

module.exports = {
    authenticateToken,
    requireAdmin,
    requireLeader,
    requireRole,
    requireInspector
}
