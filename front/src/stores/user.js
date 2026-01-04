import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
    // 用户信息
    const userInfo = ref(null)
    const token = ref(localStorage.getItem('token') || '')

    // 是否已登录
    const isLoggedIn = computed(() => !!token.value)

    // 用户角色 (一线人员、领导)
    const userRole = computed(() => userInfo.value?.role || 'staff')

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
        login,
        logout,
        updateUserInfo
    }
})
