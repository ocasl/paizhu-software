import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../views/Home.vue'),
        meta: { title: '首页' }
    },
    {
        path: '/overview',
        name: 'WorkOverview',
        component: () => import('../views/WorkOverview.vue'),
        meta: { 
            title: '工作概览',
            roles: ['admin', 'inspector', 'leader', 'top_viewer']
        }
    },
    {
        path: '/daily',
        name: 'DailyCheck',
        component: () => import('../views/DailyCheck.vue'),
        meta: { 
            title: '日检察',
            roles: ['admin', 'inspector', 'leader', 'top_viewer']
        }
    },
    {
        path: '/weekly',
        name: 'WeeklyCheck',
        component: () => import('../views/WeeklyCheck.vue'),
        meta: { 
            title: '周检察',
            roles: ['admin', 'inspector', 'leader', 'top_viewer']
        }
    },
    {
        path: '/monthly',
        name: 'MonthlyCheck',
        component: () => import('../views/MonthlyCheck.vue'),
        meta: { 
            title: '月检察',
            roles: ['admin', 'inspector', 'leader', 'top_viewer']
        }
    },
    {
        path: '/immediate',
        name: 'ImmediateCheck',
        component: () => import('../views/ImmediateCheck.vue'),
        meta: { 
            title: '及时检察',
            roles: ['admin', 'inspector', 'leader', 'top_viewer']
        }
    },
    {
        path: '/upload',
        name: 'MaterialUpload',
        component: () => import('../views/MaterialUpload.vue'),
        meta: { 
            title: '材料上传',
            roles: ['admin', 'inspector']
        }
    },
    {
        path: '/report',
        name: 'ReportPreview',
        component: () => import('../views/ReportPreview.vue'),
        meta: { 
            title: '报告预览',
            roles: ['admin', 'inspector', 'leader', 'top_viewer']
        }
    },
    {
        path: '/checklist',
        name: 'ReportChecklist',
        component: () => import('../views/ReportChecklist.vue'),
        meta: { 
            title: '报告事项清单',
            roles: ['admin', 'inspector', 'leader', 'top_viewer']
        }
    },
    {
        path: '/archive',
        name: 'MonthlyArchive',
        component: () => import('../views/MonthlyArchive.vue'),
        meta: { 
            title: '月度归档',
            roles: ['admin', 'inspector', 'leader', 'top_viewer']  // 所有角色都可以访问
        }
    },
    {
        path: '/settings',
        name: 'Settings',
        component: () => import('../views/AdminUsers.vue'),
        meta: { 
            title: '系统设置',
            roles: ['admin']
        }
    },
    {
        path: '/admin/users',
        redirect: '/settings' // 兼容旧路径
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue'),
        meta: { title: '登录', public: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 登录验证守卫
router.beforeEach((to, from, next) => {
    document.title = `${to.meta.title || '派驻检察'} - 智慧派驻检察系统`

    // 公开页面不需要登录
    if (to.meta.public) {
        next()
        return
    }

    // 检查是否登录
    const token = localStorage.getItem('token')
    if (!token && to.path !== '/login') {
        // 未登录则跳转到登录页
        next('/login')
        return
    }

    // 检查角色权限
    if (to.meta.roles) {
        const userStore = useUserStore()
        const userRole = userStore.userRole
        
        if (!to.meta.roles.includes(userRole)) {
            // 无权限，提示并跳转到首页
            console.warn(`用户角色 ${userRole} 无权访问 ${to.path}`)
            
            // 使用 Element Plus 的消息提示
            import('element-plus').then(({ ElMessage }) => {
                ElMessage.warning({
                    message: '您没有权限访问该页面',
                    duration: 2000
                })
            })
            
            next('/')
            return
        }
    }

    next()
})

export default router

