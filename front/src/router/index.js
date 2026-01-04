import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../views/Home.vue'),
        meta: { title: '工作概览' }
    },
    {
        path: '/daily',
        name: 'DailyCheck',
        component: () => import('../views/DailyCheck.vue'),
        meta: { title: '日检察' }
    },
    {
        path: '/weekly',
        name: 'WeeklyCheck',
        component: () => import('../views/WeeklyCheck.vue'),
        meta: { title: '周检察' }
    },
    {
        path: '/monthly',
        name: 'MonthlyCheck',
        component: () => import('../views/MonthlyCheck.vue'),
        meta: { title: '月检察' }
    },
    {
        path: '/immediate',
        name: 'ImmediateCheck',
        component: () => import('../views/ImmediateCheck.vue'),
        meta: { title: '及时检察' }
    },
    {
        path: '/upload',
        name: 'MaterialUpload',
        component: () => import('../views/MaterialUpload.vue'),
        meta: { title: '材料上传' }
    },
    {
        path: '/report',
        name: 'ReportPreview',
        component: () => import('../views/ReportPreview.vue'),
        meta: { title: '报告预览' }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 设置页面标题
router.beforeEach((to, from, next) => {
    document.title = `${to.meta.title || '派驻检察'} - 派驻检察室工作管理系统`
    next()
})

export default router
