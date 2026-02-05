/**
 * 派驻检察软件后端服务入口
 */
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

// 导入数据库
const db = require('./models')

// 导入路由
const authRoutes = require('./routes/auth')
const dailyLogRoutes = require('./routes/dailyLogs')
const weeklyRecordRoutes = require('./routes/weeklyRecords')
const monthlyRecordRoutes = require('./routes/monthlyRecords')
const immediateEventRoutes = require('./routes/immediateEvents')
const attachmentRoutes = require('./routes/attachments')
const reportRoutes = require('./routes/reports')
const adminRoutes = require('./routes/admin')
const archiveRoutes = require('./routes/archive')
const templateSyncRoutes = require('./routes/templateSync')
const tabletSyncRoutes = require('./routes/tabletSync')
const dataManagementRoutes = require('./routes/dataManagement')
const monthlyBasicInfoRoutes = require('./routes/monthlyBasicInfo')
const prisonsRoutes = require('./routes/prisons')
const checklistItemsRoutes = require('./routes/checklistItems')
const compilationRoutes = require('./routes/compilation')

const app = express()
const PORT = process.env.PORT || 3000

// 确保上传目录存在
const uploadDir = process.env.UPLOAD_DIR || './uploads'
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

// 中间件
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:8080'],
    credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件服务（上传的文件）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/daily-logs', dailyLogRoutes)
app.use('/api/weekly-records', weeklyRecordRoutes)
app.use('/api/monthly-records', monthlyRecordRoutes)
app.use('/api/immediate-events', immediateEventRoutes)
app.use('/api/attachments', attachmentRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/archive', archiveRoutes)
app.use('/api/template-sync', templateSyncRoutes)
app.use('/api/tablet-sync', tabletSyncRoutes)
app.use('/api/data-management', dataManagementRoutes)
app.use('/api/monthly-basic-info', monthlyBasicInfoRoutes)
app.use('/api/prisons', prisonsRoutes)
app.use('/api/checklist-items', checklistItemsRoutes)
app.use('/api/compilation', compilationRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: db.sequelize ? 'connected' : 'disconnected'
    })
})

// 404 处理
app.use((req, res) => {
    res.status(404).json({ error: '接口不存在' })
})

// 错误处理
app.use((err, req, res, next) => {
    console.error('Error:', err)
    res.status(err.status || 500).json({
        error: err.message || '服务器内部错误',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    })
})

// 数据库同步并启动服务器
async function startServer() {
    try {
        // 测试数据库连接
        await db.sequelize.authenticate()
        console.log('✅ 数据库连接成功')

        // 同步模型（开发环境）
        // 注意：已禁用自动同步，请手动导入 SQL 文件来管理数据库结构
        // if (process.env.NODE_ENV === 'development') {
        //     await db.sequelize.sync({ alter: false })
        //     console.log('✅ 数据库模型同步完成')
        // }
        console.log('ℹ️  数据库自动同步已禁用，请使用 SQL 文件管理数据库')

        // 启动服务器
        app.listen(PORT, () => {
            console.log(`✅ 服务器运行在 http://localhost:${PORT}`)
            console.log(`   健康检查: http://localhost:${PORT}/api/health`)
        })
    } catch (error) {
        console.error('❌ 启动失败:', error)
        process.exit(1)
    }
}

startServer()
