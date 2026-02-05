/**
 * 测试信件统计API
 */
require('dotenv').config()
const express = require('express')
const app = express()
const templateSyncRouter = require('./routes/templateSync')

// 模拟认证中间件
app.use((req, res, next) => {
    req.user = {
        id: 45,
        prison_name: '女子监狱',
        role: 'inspector'
    }
    next()
})

app.use('/api/template-sync', templateSyncRouter)

// 启动测试服务器
const PORT = 3001
app.listen(PORT, async () => {
    console.log(`测试服务器运行在 http://localhost:${PORT}`)
    console.log()
    
    // 测试API
    const fetch = (await import('node-fetch')).default
    
    try {
        console.log('测试信件统计API...')
        console.log('请求: GET /api/template-sync/mail-stats/2026-02?prison_name=女子监狱')
        console.log()
        
        const response = await fetch(`http://localhost:${PORT}/api/template-sync/mail-stats/2026-02?prison_name=女子监狱`)
        const data = await response.json()
        
        console.log('响应:', JSON.stringify(data, null, 2))
        console.log()
        
        if (data.success && data.data.mailCount === 40) {
            console.log('✅ 测试通过！信件数量正确: 40封')
        } else {
            console.log('❌ 测试失败！期望40封，实际:', data.data?.mailCount)
        }
        
        process.exit(0)
    } catch (error) {
        console.error('❌ 测试失败:', error.message)
        process.exit(1)
    }
})
