/**
 * 报告生成路由（不需要归档）
 */
const express = require('express')
const router = express.Router()
const { DailyLog, WeeklyRecord, MonthlyRecord, ImmediateEvent, Attachment, User } = require('../models')
const { authenticateToken } = require('../middleware/auth')
const { Op } = require('sequelize')

// 认证中间件
router.use(authenticateToken)

/**
 * 直接生成月度报告（不需要归档）
 */
router.get('/generate-report', async (req, res) => {
    try {
        const { year, month, prison_name } = req.query
        const user = req.user

        if (!year || !month || !prison_name) {
            return res.status(400).json({ 
                success: false, 
                message: '缺少必要参数：year, month, prison_name' 
            })
        }

        // 权限检查
        const { getUserPrisonScope } = require('../middleware/permission')
        const prisonScope = await getUserPrisonScope(user.id, user.role)
        
        if (prisonScope !== 'ALL') {
            if (!Array.isArray(prisonScope) || !prisonScope.includes(prison_name)) {
                return res.status(403).json({ 
                    success: false, 
                    message: '无权访问该监狱的数据' 
                })
            }
        }

        // 获取该监狱的所有用户
        const usersInPrison = await User.findAll({
            where: { prison_name },
            attributes: ['id']
        })
        const userIds = usersInPrison.map(u => u.id)

        if (userIds.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: '该监狱没有用户数据' 
            })
        }

        // 获取数据
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`
        const endDate = parseInt(month) === 12
            ? `${parseInt(year) + 1}-01-01`
            : `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`

        const dailyLogs = await DailyLog.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                log_date: { [Op.gte]: startDate, [Op.lt]: endDate }
            },
            order: [['log_date', 'ASC']]
        })

        const weeklyRecords = await WeeklyRecord.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                record_date: {
                    [Op.gte]: new Date(year, month - 1, 1),
                    [Op.lt]: new Date(year, month, 1)
                }
            },
            order: [['record_date', 'ASC']]
        })

        const targetMonth = `${year}-${String(month).padStart(2, '0')}`
        const monthlyRecords = await MonthlyRecord.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                record_month: targetMonth
            }
        })

        const immediateEvents = await ImmediateEvent.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                event_date: {
                    [Op.gte]: new Date(year, month - 1, 1),
                    [Op.lt]: new Date(year, month, 1)
                }
            },
            order: [['event_date', 'ASC']]
        })

        const attachments = await Attachment.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                [Op.or]: [
                    { upload_month: targetMonth },
                    {
                        [Op.and]: [
                            { upload_month: { [Op.or]: [null, ''] } },
                            {
                                createdAt: {
                                    [Op.gte]: new Date(year, month - 1, 1),
                                    [Op.lt]: new Date(year, month, 1)
                                }
                            }
                        ]
                    }
                ]
            }
        })

        // 获取基本信息
        const { sequelize } = require('../models')
        const [basicInfoResults] = await sequelize.query(`
            SELECT * FROM monthly_basic_info
            WHERE prison_name = :prisonName AND report_month = :reportMonth
            LIMIT 1
        `, {
            replacements: { 
                prisonName: prison_name, 
                reportMonth: targetMonth 
            }
        })
        
        const basicInfo = basicInfoResults.length > 0 ? basicInfoResults[0] : null
        console.log('基本信息:', basicInfo ? `找到数据，在押罪犯 ${basicInfo.total_prisoners} 人` : '未找到数据')

        // 生成报告
        const { generateReportFromTemplate } = require('../utils/templateGenerator')

        console.log('生成报告，数据统计:', {
            prison_name,
            year,
            month,
            dailyLogs: dailyLogs.length,
            weeklyRecords: weeklyRecords.length,
            monthlyRecords: monthlyRecords.length,
            immediateEvents: immediateEvents.length,
            attachments: attachments.length
        })

        // 创建临时归档对象
        const archive = {
            prison_name,
            year: parseInt(year),
            month: parseInt(month)
        }

        const reportBuffer = await generateReportFromTemplate({
            archive,
            dailyLogs,
            weeklyRecords,
            monthlyRecords,
            immediateEvents,
            attachments,
            basicInfo  // 添加基本信息
        })

        // 设置响应头
        const filename = `${prison_name}_${year}年${month}月工作报告.docx`
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
        res.send(reportBuffer)
    } catch (error) {
        console.error('生成报告失败:', error)
        res.status(500).json({ 
            success: false, 
            message: '生成报告失败: ' + error.message 
        })
    }
})

/**
 * 直接生成事项清单（不需要归档）
 */
router.post('/generate-checklist', async (req, res) => {
    try {
        const { year, month, prison_name, checklistData } = req.body
        const user = req.user

        if (!year || !month || !prison_name) {
            return res.status(400).json({ 
                success: false, 
                message: '缺少必要参数：year, month, prison_name' 
            })
        }

        // 权限检查
        const { getUserPrisonScope } = require('../middleware/permission')
        const prisonScope = await getUserPrisonScope(user.id, user.role)
        
        if (prisonScope !== 'ALL') {
            if (!Array.isArray(prisonScope) || !prisonScope.includes(prison_name)) {
                return res.status(403).json({ 
                    success: false, 
                    message: '无权访问该监狱的数据' 
                })
            }
        }

        console.log('生成清单，参数:', { prison_name, year, month })

        // 🔥 从数据库读取清单数据
        const { ReportChecklistItem } = require('../models')
        const dbChecklistItems = await ReportChecklistItem.findAll({
            where: {
                prison_name,
                year: parseInt(year),
                month: parseInt(month)
            },
            order: [['item_id', 'ASC']]
        })

        console.log(`从数据库读取到 ${dbChecklistItems.length} 条清单数据`)

        // 转换为模板需要的格式
        const checklistDataFromDb = dbChecklistItems.map(item => ({
            id: item.item_id,
            content: item.content || '',
            situation: item.situation || ''
        }))

        // 如果数据库没有数据，使用前端传来的数据（兼容旧逻辑）
        const finalChecklistData = checklistDataFromDb.length > 0 
            ? checklistDataFromDb 
            : (checklistData || [])

        console.log(`使用清单数据: ${finalChecklistData.length} 项`)

        // 创建临时归档对象
        const archive = {
            prison_name,
            year: parseInt(year),
            month: parseInt(month)
        }

        // 生成清单
        const { generateChecklistFromFrontendData } = require('../utils/templateGenerator')
        const checklistBuffer = await generateChecklistFromFrontendData({
            archive,
            checklistData: finalChecklistData
        })

        // 设置响应头
        const filename = `${prison_name}_${year}年${month}月事项清单.doc`
        res.setHeader('Content-Type', 'application/msword')
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
        res.send(checklistBuffer)
    } catch (error) {
        console.error('生成清单失败:', error)
        res.status(500).json({ 
            success: false, 
            message: '生成清单失败: ' + error.message 
        })
    }
})

module.exports = router
