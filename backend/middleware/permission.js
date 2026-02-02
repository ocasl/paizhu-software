/**
 * 权限控制中间件
 * 实现基于角色、监狱范围、业务状态的三维权限控制
 */
const db = require('../models')

// 角色常量
const ROLES = {
    ADMIN: 'admin',           // 管理员 - 只管配置
    OFFICER: 'inspector',     // 派驻检察官 - 填报
    AREA_LEADER: 'leader',    // 业务分管领导 - 审核
    TOP_VIEWER: 'top_viewer'  // 院领导 - 查看
}

// 业务状态常量
const STATUS = {
    DRAFT: 'draft',           // 草稿
    SUBMITTED: 'pending',     // 已提交待审核
    APPROVED: 'approved',     // 已审核通过
    REJECTED: 'rejected'      // 已退回
}

/**
 * 获取用户的监狱范围
 */
async function getUserPrisonScope(userId, userRole) {
    // 院领导和管理员可以看所有监狱
    if (userRole === ROLES.TOP_VIEWER || userRole === ROLES.ADMIN) {
        return 'ALL'
    }

    // 派驻检察官只能看自己的监狱
    if (userRole === ROLES.OFFICER) {
        const user = await db.User.findByPk(userId)
        return user ? [user.prison_name] : []
    }

    // 分管领导查询分配的监狱范围
    if (userRole === ROLES.AREA_LEADER) {
        const scopes = await db.UserPrisonScope.findAll({
            where: { user_id: userId },
            attributes: ['prison_name']
        })
        return scopes.map(s => s.prison_name)
    }

    return []
}

/**
 * 检查用户是否可以查看某个监狱的数据
 */
async function canViewPrison(userId, userRole, prisonName) {
    const scope = await getUserPrisonScope(userId, userRole)
    
    if (scope === 'ALL') return true
    if (Array.isArray(scope)) return scope.includes(prisonName)
    
    return false
}

/**
 * 检查用户是否可以编辑某条记录
 */
function canEdit(userRole, recordStatus, recordPrisonName, userPrisonName) {
    // 只有派驻检察官可以编辑
    if (userRole !== ROLES.OFFICER) return false
    
    // 必须是自己监狱的数据
    if (recordPrisonName !== userPrisonName) return false
    
    // 只能编辑草稿或被退回的记录
    if (![STATUS.DRAFT, STATUS.REJECTED].includes(recordStatus)) return false
    
    return true
}

/**
 * 检查用户是否可以提交某条记录
 */
function canSubmit(userRole, recordStatus, recordPrisonName, userPrisonName) {
    // 只有派驻检察官可以提交
    if (userRole !== ROLES.OFFICER) return false
    
    // 必须是自己监狱的数据
    if (recordPrisonName !== userPrisonName) return false
    
    // 只能提交草稿或被退回的记录
    if (![STATUS.DRAFT, STATUS.REJECTED].includes(recordStatus)) return false
    
    return true
}

/**
 * 检查用户是否可以审核某条记录
 */
async function canApprove(userId, userRole, recordStatus, recordPrisonName) {
    // 只有分管领导可以审核
    if (userRole !== ROLES.AREA_LEADER) return false
    
    // 只能审核已提交的记录
    if (recordStatus !== STATUS.SUBMITTED) return false
    
    // 必须在分管范围内
    const scope = await getUserPrisonScope(userId, userRole)
    if (!Array.isArray(scope) || !scope.includes(recordPrisonName)) return false
    
    return true
}

/**
 * 权限检查中间件 - 查看权限
 */
const checkViewPermission = async (req, res, next) => {
    try {
        const { role, id: userId, prison_name } = req.user
        const { prison_name: targetPrison } = req.query || req.params
        
        // 管理员不参与业务
        if (role === ROLES.ADMIN) {
            return res.status(403).json({ error: '管理员账号不能查看业务数据' })
        }
        
        // 院领导可以看所有
        if (role === ROLES.TOP_VIEWER) {
            return next()
        }
        
        // 检查监狱范围
        if (targetPrison) {
            const canView = await canViewPrison(userId, role, targetPrison)
            if (!canView) {
                return res.status(403).json({ error: '无权查看该监狱的数据' })
            }
        }
        
        next()
    } catch (error) {
        console.error('权限检查失败:', error)
        res.status(500).json({ error: '权限检查失败' })
    }
}

/**
 * 权限检查中间件 - 编辑权限
 */
const checkEditPermission = (req, res, next) => {
    const { role, prison_name } = req.user
    
    // 只有派驻检察官可以编辑
    if (role !== ROLES.OFFICER) {
        return res.status(403).json({ error: '只有派驻检察官可以编辑数据' })
    }
    
    // 记录所属监狱会在具体业务逻辑中检查
    next()
}

/**
 * 权限检查中间件 - 审核权限
 */
const checkApprovePermission = async (req, res, next) => {
    try {
        const { role, id: userId } = req.user
        
        // 只有分管领导可以审核
        if (role !== ROLES.AREA_LEADER) {
            return res.status(403).json({ error: '只有业务分管领导可以审核' })
        }
        
        // 具体的监狱范围检查在业务逻辑中进行
        next()
    } catch (error) {
        console.error('权限检查失败:', error)
        res.status(500).json({ error: '权限检查失败' })
    }
}

/**
 * 权限检查中间件 - 管理员权限
 */
const checkAdminPermission = (req, res, next) => {
    const { role } = req.user
    
    if (role !== ROLES.ADMIN) {
        return res.status(403).json({ error: '需要管理员权限' })
    }
    
    next()
}

module.exports = {
    ROLES,
    STATUS,
    getUserPrisonScope,
    canViewPrison,
    canEdit,
    canSubmit,
    canApprove,
    checkViewPermission,
    checkEditPermission,
    checkApprovePermission,
    checkAdminPermission
}
