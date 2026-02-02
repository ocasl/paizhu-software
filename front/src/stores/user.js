import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 角色常量
export const ROLES = {
    ADMIN: 'admin',           // 管理员
    OFFICER: 'inspector',     // 派驻检察官
    AREA_LEADER: 'leader',    // 业务分管领导
    TOP_VIEWER: 'top_viewer'  // 院领导
}

// 角色显示名称
export const ROLE_NAMES = {
    [ROLES.ADMIN]: '管理员',
    [ROLES.OFFICER]: '派驻检察官',
    [ROLES.AREA_LEADER]: '业务分管领导',
    [ROLES.TOP_VIEWER]: '院领导'
}

export const useUserStore = defineStore('user', () => {
    // 用户信息
    const userInfo = ref(null)
    const token = ref(localStorage.getItem('token') || '')

    // 是否已登录
    const isLoggedIn = computed(() => !!token.value)

    // 用户角色
    const userRole = computed(() => userInfo.value?.role || '')

    // 角色显示名称
    const roleName = computed(() => ROLE_NAMES[userRole.value] || '未知角色')

    // 权限判断
    const isAdmin = computed(() => userRole.value === ROLES.ADMIN)
    const isOfficer = computed(() => userRole.value === ROLES.OFFICER)
    const isAreaLeader = computed(() => userRole.value === ROLES.AREA_LEADER)
    const isTopViewer = computed(() => userRole.value === ROLES.TOP_VIEWER)

    // 是否可以编辑（只有派驻检察官）
    const canEdit = computed(() => isOfficer.value)

    // 是否可以审核（只有业务分管领导）
    const canApprove = computed(() => isAreaLeader.value)

    // 是否可以查看统计（院领导和分管领导）
    const canViewStats = computed(() => isTopViewer.value || isAreaLeader.value)

    // 是否可以管理用户（只有管理员）
    const canManageUsers = computed(() => isAdmin.value)

    // 登录
    function login(userData, authToken) {
        userInfo.value = userData
        token.value = authToken
        localStorage.setItem('token', authToken)
    }

    // 登出
    function logout() {
        userInfo.value = null
        token.value = ''
        localStorage.removeItem('token')
    }

    // 更新用户信息
    function updateUserInfo(data) {
        userInfo.value = { ...userInfo.value, ...data }
    }

    return {
        userInfo,
        token,
        isLoggedIn,
        userRole,
        roleName,
        isAdmin,
        isOfficer,
        isAreaLeader,
        isTopViewer,
        canEdit,
        canApprove,
        canViewStats,
        canManageUsers,
        login,
        logout,
        updateUserInfo
    }
})
