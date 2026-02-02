/**
 * 前端权限工具函数
 */

// 角色常量
export const ROLES = {
    ADMIN: 'admin',
    OFFICER: 'inspector',
    AREA_LEADER: 'leader',
    TOP_VIEWER: 'top_viewer'
}

// 业务状态常量
export const STATUS = {
    DRAFT: 'draft',
    SUBMITTED: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
}

// 状态显示文本
export const STATUS_TEXT = {
    [STATUS.DRAFT]: '草稿',
    [STATUS.SUBMITTED]: '待审核',
    [STATUS.APPROVED]: '已通过',
    [STATUS.REJECTED]: '已退回'
}

// 状态标签类型
export const STATUS_TAG_TYPE = {
    [STATUS.DRAFT]: 'info',
    [STATUS.SUBMITTED]: 'warning',
    [STATUS.APPROVED]: 'success',
    [STATUS.REJECTED]: 'danger'
}

/**
 * 检查用户是否可以编辑记录
 * @param {string} userRole - 用户角色
 * @param {string} recordStatus - 记录状态
 * @param {string} recordPrison - 记录所属监狱
 * @param {string} userPrison - 用户所属监狱
 * @returns {boolean}
 */
export function canEditRecord(userRole, recordStatus, recordPrison, userPrison) {
    // 只有派驻检察官可以编辑
    if (userRole !== ROLES.OFFICER) return false
    
    // 必须是自己监狱的数据
    if (recordPrison !== userPrison) return false
    
    // 只能编辑草稿或被退回的记录
    return [STATUS.DRAFT, STATUS.REJECTED].includes(recordStatus)
}

/**
 * 检查用户是否可以提交记录
 * @param {string} userRole - 用户角色
 * @param {string} recordStatus - 记录状态
 * @param {string} recordPrison - 记录所属监狱
 * @param {string} userPrison - 用户所属监狱
 * @returns {boolean}
 */
export function canSubmitRecord(userRole, recordStatus, recordPrison, userPrison) {
    // 只有派驻检察官可以提交
    if (userRole !== ROLES.OFFICER) return false
    
    // 必须是自己监狱的数据
    if (recordPrison !== userPrison) return false
    
    // 只能提交草稿或被退回的记录
    return [STATUS.DRAFT, STATUS.REJECTED].includes(recordStatus)
}

/**
 * 检查用户是否可以审核记录
 * @param {string} userRole - 用户角色
 * @param {string} recordStatus - 记录状态
 * @param {string} recordPrison - 记录所属监狱
 * @param {Array<string>} userScope - 用户监狱范围
 * @returns {boolean}
 */
export function canApproveRecord(userRole, recordStatus, recordPrison, userScope = []) {
    // 只有分管领导可以审核
    if (userRole !== ROLES.AREA_LEADER) return false
    
    // 只能审核已提交的记录
    if (recordStatus !== STATUS.SUBMITTED) return false
    
    // 必须在分管范围内
    return userScope.includes(recordPrison)
}

/**
 * 检查用户是否可以查看记录
 * @param {string} userRole - 用户角色
 * @param {string} recordPrison - 记录所属监狱
 * @param {string} userPrison - 用户所属监狱
 * @param {Array<string>} userScope - 用户监狱范围
 * @returns {boolean}
 */
export function canViewRecord(userRole, recordPrison, userPrison, userScope = []) {
    // 管理员不参与业务
    if (userRole === ROLES.ADMIN) return false
    
    // 院领导可以看所有
    if (userRole === ROLES.TOP_VIEWER) return true
    
    // 派驻检察官只能看自己监狱
    if (userRole === ROLES.OFFICER) {
        return recordPrison === userPrison
    }
    
    // 分管领导看分管范围内的
    if (userRole === ROLES.AREA_LEADER) {
        return userScope.includes(recordPrison)
    }
    
    return false
}

/**
 * 获取记录可用的操作按钮
 * @param {Object} record - 记录对象
 * @param {Object} user - 用户对象
 * @param {Array<string>} userScope - 用户监狱范围
 * @returns {Object} 可用操作
 */
export function getRecordActions(record, user, userScope = []) {
    const actions = {
        canView: false,
        canEdit: false,
        canSubmit: false,
        canApprove: false,
        canReject: false,
        canDelete: false
    }
    
    if (!record || !user) return actions
    
    const { role, prison_name } = user
    const recordPrison = record.prison_name
    const recordStatus = record.status
    
    // 查看权限
    actions.canView = canViewRecord(role, recordPrison, prison_name, userScope)
    
    // 编辑权限
    actions.canEdit = canEditRecord(role, recordStatus, recordPrison, prison_name)
    
    // 提交权限
    actions.canSubmit = canSubmitRecord(role, recordStatus, recordPrison, prison_name)
    
    // 审核权限
    actions.canApprove = canApproveRecord(role, recordStatus, recordPrison, userScope)
    actions.canReject = actions.canApprove
    
    // 删除权限（只能删除草稿）
    actions.canDelete = role === ROLES.OFFICER && 
                       recordStatus === STATUS.DRAFT && 
                       recordPrison === prison_name
    
    return actions
}

/**
 * 根据角色过滤菜单
 * @param {Array} menus - 菜单列表
 * @param {string} userRole - 用户角色
 * @returns {Array} 过滤后的菜单
 */
export function filterMenusByRole(menus, userRole) {
    return menus.filter(menu => {
        // 没有角色限制的菜单，所有人可见
        if (!menu.roles || menu.roles.length === 0) return true
        
        // 检查用户角色是否在允许列表中
        return menu.roles.includes(userRole)
    })
}
