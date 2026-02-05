/**
 * 模板数据同步路由
 * 处理模板文件上传和数据同步
 * 
 * API接口:
 * POST /api/template-sync/strict-education  - 上传严管教育审批
 * POST /api/template-sync/confinement       - 上传禁闭审批
 * POST /api/template-sync/blacklist         - 上传涉黑恶名单
 * POST /api/template-sync/restraint         - 上传戒具使用审批
 * POST /api/template-sync/mail              - 上传信件汇总
 * POST /api/template-sync/criminal-report   - 上传犯情动态（Word）
 */
const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const { Op } = require('sequelize')
const {
    Prisoner, StrictEducation, Confinement, RestraintUsage,
    MailRecord, Blacklist, Attachment, User, CriminalReport, MonthlyBasicInfo
} = require('../models')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const {
    parseStrictEducation, parseConfinement, parseRestraintUsage,
    parseMailRecord, parseBlacklist
} = require('../utils/templateParser')
const { parseCriminalReport } = require('../utils/criminalReportParser')
const XLSX = require('xlsx')
const mammoth = require('mammoth')

// 文件上传配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || './uploads'
        const templateDir = path.join(uploadDir, 'templates')
        if (!fs.existsSync(templateDir)) {
            fs.mkdirSync(templateDir, { recursive: true })
        }
        cb(null, templateDir)
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname)
        cb(null, uniqueSuffix + ext)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedExts = ['.xlsx', '.xls']
        const ext = path.extname(file.originalname).toLowerCase()
        if (allowedExts.includes(ext)) {
            cb(null, true)
        } else {
            cb(new Error('仅支持 Excel 文件格式 (.xlsx, .xls)'))
        }
    }
})

// Word文件上传配置（用于犯情动态）
const uploadWord = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedExts = ['.doc', '.docx']
        const ext = path.extname(file.originalname).toLowerCase()
        if (allowedExts.includes(ext)) {
            cb(null, true)
        } else {
            cb(new Error('仅支持 Word 文件格式 (.doc, .docx)'))
        }
    }
})

router.use(authenticateToken)

// 材料上传权限检查中间件：只允许检察官上传
const checkUploadPermission = (req, res, next) => {
    if (req.user.role !== 'inspector') {
        return res.status(403).json({ error: '只有派驻检察官可以上传材料' })
    }
    
    if (!req.user.prison_name) {
        return res.status(400).json({ error: '用户未设置派驻单位，无法上传数据' })
    }
    
    next()
}

/**
 * 读取Excel文件并返回原始数据
 */
function readExcelFile(filePath) {
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    return XLSX.utils.sheet_to_json(worksheet, { header: 1 })
}

/**
 * 通用同步处理函数
 */
async function syncRecords(Model, records, syncBatch, syncedAt, prisonName, options = {}) {
    const stats = { inserted: 0, updated: 0, errors: [] }
    const { uniqueKey = 'prisoner_id', useCreateDate = true, uploadMonth } = options

    for (const record of records) {
        try {
            if (options.insertOnly) {
                // 直接插入（如信件表）
                await Model.create({
                    ...record,
                    prison_name: prisonName,
                    upload_month: uploadMonth,  // 使用归属月份
                    sync_batch: syncBatch,
                    synced_at: syncedAt
                })
                stats.inserted++
            } else {
                // 根据唯一键查找并更新或插入（按派驻单位 + 归属月份过滤）
                const whereClause = { 
                    [uniqueKey]: record[uniqueKey],
                    prison_name: prisonName
                }
                
                // 使用归属月份而不是 Excel 中的日期
                if (uploadMonth) {
                    whereClause.upload_month = uploadMonth
                }
                
                // 如果需要按创建日期区分（同一个月内可能有多条记录）
                if (useCreateDate && record.create_date) {
                    whereClause.create_date = record.create_date
                }

                const existing = await Model.findOne({ where: whereClause })
                if (existing) {
                    await existing.update({
                        ...record,
                        prison_name: prisonName,
                        upload_month: uploadMonth,
                        sync_batch: syncBatch,
                        synced_at: syncedAt
                    })
                    stats.updated++
                } else {
                    await Model.create({
                        ...record,
                        prison_name: prisonName,
                        upload_month: uploadMonth,  // 🔥 修复：添加 upload_month
                        sync_batch: syncBatch,
                        synced_at: syncedAt
                    })
                    stats.inserted++
                }
            }
        } catch (e) {
            stats.errors.push(`记录同步失败: ${e.message}`)
        }
    }

    return stats
}

/**
 * 同步罪犯基本信息
 */
async function syncPrisoners(prisoners, syncedAt) {
    for (const p of prisoners) {
        try {
            await Prisoner.upsert({
                ...p,
                updated_at: syncedAt
            })
        } catch (e) {
            console.error(`罪犯信息同步失败 ${p.prisoner_id}:`, e.message)
        }
    }
}

// ============================================================
// 1. 严管教育审批上传
// POST /api/template-sync/strict-education
// ============================================================
router.post('/strict-education', checkUploadPermission, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请选择要上传的文件' })
        }

        // 获取当前用户的派驻单位
        const prisonName = req.user.prison_name
        if (!prisonName) {
            return res.status(400).json({ error: '用户未设置派驻单位，无法上传数据' })
        }

        // 获取数据归属月份（从前端传递）
        const uploadMonth = req.body.upload_month
        if (!uploadMonth) {
            return res.status(400).json({ error: '请选择数据归属月份' })
        }

        console.log('📤 上传严管教育数据:', { prisonName, uploadMonth })

        const syncBatch = uuidv4()
        const syncedAt = new Date()

        // 读取并解析
        const data = readExcelFile(req.file.path)
        if (data.length <= 1) {
            return res.status(400).json({ error: '文件内容为空或只有标题行' })
        }

        const parseResult = parseStrictEducation(data)

        // 同步罪犯信息
        if (parseResult.prisoners?.length > 0) {
            await syncPrisoners(parseResult.prisoners, syncedAt)
        }

        // 同步记录（传递派驻单位和归属月份）
        const stats = await syncRecords(
            StrictEducation,
            parseResult.records,
            syncBatch,
            syncedAt,
            prisonName,
            { uniqueKey: 'prisoner_id', useCreateDate: true, uploadMonth }
        )
        
        // 🔥 同步更新 monthly_basic_info 表
        const [basicInfo] = await MonthlyBasicInfo.findOrCreate({
            where: {
                prison_name: prisonName,
                report_month: uploadMonth
            },
            defaults: {
                user_id: req.user.id,
                prison_name: prisonName,
                report_month: uploadMonth
            }
        })
        
        // 统计严管教育人数（记过）
        const strictCount = new Set(parseResult.records.map(r => r.prisoner_id)).size
        
        // 直接覆盖更新
        await basicInfo.update({
            recorded_punishments: strictCount
        })
        
        console.log('✅ 已同步更新 monthly_basic_info: 记过', strictCount, '人')

        res.json({
            success: true,
            type: 'strict_education',
            typeName: '严管教育审批',
            syncBatch,
            prisonName,
            stats: {
                total: parseResult.records.length,
                inserted: stats.inserted,
                updated: stats.updated,
                errors: stats.errors.length
            },
            errorDetails: stats.errors.slice(0, 10)
        })
    } catch (error) {
        console.error('严管教育同步失败:', error)
        res.status(500).json({ error: '同步失败: ' + error.message })
    }
})

// ============================================================
// 2. 禁闭审批上传
// POST /api/template-sync/confinement
// ============================================================
router.post('/confinement', checkUploadPermission, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请选择要上传的文件' })
        }

        // 获取当前用户的派驻单位
        const prisonName = req.user.prison_name
        if (!prisonName) {
            return res.status(400).json({ error: '用户未设置派驻单位，无法上传数据' })
        }

        // 获取数据归属月份（从前端传递）
        const uploadMonth = req.body.upload_month
        if (!uploadMonth) {
            return res.status(400).json({ error: '请选择数据归属月份' })
        }

        console.log('📤 上传禁闭数据:', { prisonName, uploadMonth })

        const syncBatch = uuidv4()
        const syncedAt = new Date()

        const data = readExcelFile(req.file.path)
        if (data.length <= 1) {
            return res.status(400).json({ error: '文件内容为空或只有标题行' })
        }

        const parseResult = parseConfinement(data)

        if (parseResult.prisoners?.length > 0) {
            await syncPrisoners(parseResult.prisoners, syncedAt)
        }

        const stats = await syncRecords(
            Confinement,
            parseResult.records,
            syncBatch,
            syncedAt,
            prisonName,
            { uniqueKey: 'prisoner_id', useCreateDate: true, uploadMonth }
        )
        
        // 🔥 同步更新 monthly_basic_info 表
        const [basicInfo] = await MonthlyBasicInfo.findOrCreate({
            where: {
                prison_name: prisonName,
                report_month: uploadMonth
            },
            defaults: {
                user_id: req.user.id,
                prison_name: prisonName,
                report_month: uploadMonth
            }
        })
        
        // 统计禁闭人数
        const confinementCount = new Set(parseResult.records.map(r => r.prisoner_id)).size
        
        // 直接覆盖更新
        await basicInfo.update({
            confinement_punishments: confinementCount
        })
        
        console.log('✅ 已同步更新 monthly_basic_info: 禁闭', confinementCount, '人')

        res.json({
            success: true,
            type: 'confinement',
            typeName: '禁闭审批',
            syncBatch,
            prisonName,
            stats: {
                total: parseResult.records.length,
                inserted: stats.inserted,
                updated: stats.updated,
                errors: stats.errors.length
            },
            errorDetails: stats.errors.slice(0, 10)
        })
    } catch (error) {
        console.error('禁闭审批同步失败:', error)
        res.status(500).json({ error: '同步失败: ' + error.message })
    }
})

// ============================================================
// 3. 涉黑恶名单上传
// POST /api/template-sync/blacklist
// ============================================================
router.post('/blacklist', checkUploadPermission, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请选择要上传的文件' })
        }

        // 获取当前用户的派驻单位
        const prisonName = req.user.prison_name
        if (!prisonName) {
            return res.status(400).json({ error: '用户未设置派驻单位，无法上传数据' })
        }

        // 获取数据归属月份（从前端传递）
        const uploadMonth = req.body.upload_month
        if (!uploadMonth) {
            return res.status(400).json({ error: '请选择数据归属月份' })
        }

        console.log('📤 上传涉黑恶名单:', { prisonName, uploadMonth })

        const syncBatch = uuidv4()
        const syncedAt = new Date()

        const data = readExcelFile(req.file.path)
        if (data.length <= 1) {
            return res.status(400).json({ error: '文件内容为空或只有标题行' })
        }

        const parseResult = parseBlacklist(data)

        // 涉黑恶名单以 prisoner_id 为唯一键，不需要 create_date
        const stats = await syncRecords(
            Blacklist,
            parseResult.records,
            syncBatch,
            syncedAt,
            prisonName,
            { uniqueKey: 'prisoner_id', useCreateDate: false, uploadMonth }
        )
        
        // 🔥 同步更新 monthly_basic_info 表
        const [basicInfo] = await MonthlyBasicInfo.findOrCreate({
            where: {
                prison_name: prisonName,
                report_month: uploadMonth
            },
            defaults: {
                user_id: req.user.id,
                prison_name: prisonName,
                report_month: uploadMonth
            }
        })
        
        // 统计涉黑涉恶人数
        const gangCount = parseResult.records.filter(r => r.involvement_type && r.involvement_type.includes('涉黑')).length
        const evilCount = parseResult.records.filter(r => r.involvement_type && r.involvement_type.includes('涉恶')).length
        
        // 直接覆盖更新
        await basicInfo.update({
            gang_related: gangCount,
            evil_forces: evilCount
        })
        
        console.log('✅ 已同步更新 monthly_basic_info: 涉黑', gangCount, '人，涉恶', evilCount, '人')

        res.json({
            success: true,
            type: 'blacklist',
            typeName: '涉黑恶名单',
            syncBatch,
            prisonName,
            stats: {
                total: parseResult.records.length,
                inserted: stats.inserted,
                updated: stats.updated,
                errors: stats.errors.length
            },
            errorDetails: stats.errors.slice(0, 10)
        })
    } catch (error) {
        console.error('涉黑恶名单同步失败:', error)
        res.status(500).json({ error: '同步失败: ' + error.message })
    }
})

// ============================================================
// 4. 戒具使用审批上传
// POST /api/template-sync/restraint
// ============================================================
router.post('/restraint', checkUploadPermission, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请选择要上传的文件' })
        }

        // 获取当前用户的派驻单位
        const prisonName = req.user.prison_name
        if (!prisonName) {
            return res.status(400).json({ error: '用户未设置派驻单位，无法上传数据' })
        }

        // 获取数据归属月份（从前端传递）
        const uploadMonth = req.body.upload_month
        if (!uploadMonth) {
            return res.status(400).json({ error: '请选择数据归属月份' })
        }

        console.log('📤 上传戒具使用数据:', { prisonName, uploadMonth })

        const syncBatch = uuidv4()
        const syncedAt = new Date()

        const data = readExcelFile(req.file.path)
        if (data.length <= 1) {
            return res.status(400).json({ error: '文件内容为空或只有标题行' })
        }

        const parseResult = parseRestraintUsage(data)

        if (parseResult.prisoners?.length > 0) {
            await syncPrisoners(parseResult.prisoners, syncedAt)
        }

        const stats = await syncRecords(
            RestraintUsage,
            parseResult.records,
            syncBatch,
            syncedAt,
            prisonName,
            { uniqueKey: 'prisoner_id', useCreateDate: true, uploadMonth }
        )

        res.json({
            success: true,
            type: 'restraint',
            typeName: '戒具使用审批',
            syncBatch,
            prisonName,
            stats: {
                total: parseResult.records.length,
                inserted: stats.inserted,
                updated: stats.updated,
                errors: stats.errors.length
            },
            errorDetails: stats.errors.slice(0, 10)
        })
    } catch (error) {
        console.error('戒具使用同步失败:', error)
        res.status(500).json({ error: '同步失败: ' + error.message })
    }
})

// ============================================================
// 5. 信件汇总上传
// POST /api/template-sync/mail
// ============================================================
router.post('/mail', checkUploadPermission, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请选择要上传的文件' })
        }

        // 获取当前用户的派驻单位
        const prisonName = req.user.prison_name
        if (!prisonName) {
            return res.status(400).json({ error: '用户未设置派驻单位，无法上传数据' })
        }

        // 获取数据归属月份（从前端传递）
        const uploadMonth = req.body.upload_month
        if (!uploadMonth) {
            return res.status(400).json({ error: '请选择数据归属月份' })
        }

        console.log('📤 上传信件数据:', { prisonName, uploadMonth })

        const syncBatch = uuidv4()
        const syncedAt = new Date()

        const data = readExcelFile(req.file.path)
        if (data.length <= 1) {
            return res.status(400).json({ error: '文件内容为空或只有标题行' })
        }

        const parseResult = parseMailRecord(data)

        // 先删除该监狱该月份的旧数据（覆盖而不是累加）
        const deletedCount = await MailRecord.destroy({
            where: {
                prison_name: prisonName,
                upload_month: uploadMonth
            }
        })
        console.log(`已删除 ${deletedCount} 条旧信件记录`)

        // 插入新数据
        const stats = await syncRecords(
            MailRecord,
            parseResult.records,
            syncBatch,
            syncedAt,
            prisonName,
            { insertOnly: true, uploadMonth }
        )
        
        // 🔥 同步更新 monthly_basic_info 表的信件数量
        const [basicInfo] = await MonthlyBasicInfo.findOrCreate({
            where: {
                prison_name: prisonName,
                report_month: uploadMonth
            },
            defaults: {
                user_id: req.user.id,
                prison_name: prisonName,
                report_month: uploadMonth
            }
        })
        
        // 直接覆盖更新信件数量
        await basicInfo.update({
            letters_received: parseResult.records.length
        })
        
        console.log('✅ 已同步更新 monthly_basic_info: 信件', parseResult.records.length, '封')

        res.json({
            success: true,
            type: 'mail',
            typeName: '信件汇总',
            syncBatch,
            prisonName,
            stats: {
                total: parseResult.records.length,
                inserted: stats.inserted,
                updated: stats.updated,
                errors: stats.errors.length
            },
            errorDetails: stats.errors.slice(0, 10)
        })
    } catch (error) {
        console.error('信件汇总同步失败:', error)
        res.status(500).json({ error: '同步失败: ' + error.message })
    }
})

// ============================================================
// 6. 犯情动态上传（Word文档）- 使用Python解析
// POST /api/template-sync/criminal-report
// ============================================================
router.post('/criminal-report', checkUploadPermission, uploadWord.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请选择要上传的犯情动态Word文件' })
        }

        // 获取当前用户的派驻单位
        const prisonName = req.user.prison_name
        if (!prisonName) {
            return res.status(400).json({ error: '用户未设置派驻单位，无法上传数据' })
        }

        // 获取数据归属月份（从前端传递）
        const uploadMonth = req.body.upload_month || req.body.month  // 兼容旧字段名
        if (!uploadMonth) {
            return res.status(400).json({ error: '请选择数据归属月份' })
        }

        console.log('📤 上传犯情动态:', { prisonName, uploadMonth })

        const syncBatch = uuidv4()
        const syncedAt = new Date()

        // 调用Python脚本解析Word文档
        const { spawn } = require('child_process')
        const pythonScript = path.join(__dirname, '../utils/parse_criminal_report.py')
        
        console.log('🐍 调用Python解析器:', pythonScript)
        console.log('📄 文件路径:', req.file.path)
        
        const pythonProcess = spawn('python', [pythonScript, req.file.path])
        
        let pythonOutput = ''
        let pythonError = ''
        
        pythonProcess.stdout.on('data', (data) => {
            pythonOutput += data.toString()
        })
        
        pythonProcess.stderr.on('data', (data) => {
            pythonError += data.toString()
        })
        
        await new Promise((resolve, reject) => {
            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error('❌ Python解析失败:', pythonError)
                    reject(new Error(`Python解析失败: ${pythonError}`))
                } else {
                    resolve()
                }
            })
        })
        
        // 解析Python输出的JSON
        const parseResult = JSON.parse(pythonOutput)
        
        if (!parseResult.success) {
            throw new Error(parseResult.error || 'Python解析失败')
        }
        
        const parsed = parseResult.data
        
        console.log('✅ Python解析成功:')
        console.log('  【罪犯构成】')
        console.log('    在押罪犯总数:', parsed.prisoners.total)
        console.log('    重大刑事犯:', parsed.prisoners.majorCriminal)
        console.log('    死缓犯:', parsed.prisoners.deathSuspended)
        console.log('    无期犯:', parsed.prisoners.lifeSentence)
        console.log('    涉黑罪犯:', parsed.prisoners.gangRelated)
        console.log('    涉恶罪犯:', parsed.prisoners.evilRelated)
        console.log('    新收押罪犯:', parsed.prisoners.newlyAdmitted)
        console.log('  【违纪统计】')
        console.log('    违规人数:', parsed.discipline.violationCount)
        console.log('    禁闭人数:', parsed.discipline.confinementCount)
        console.log('    警告人数:', parsed.discipline.warningCount)
        console.log('  【监管安全】')
        console.log('    脱逃:', parsed.security.hasEscape ? '有' : '无')
        console.log('    重大案件:', parsed.security.hasMajorCase ? '有' : '无')
        console.log('    狱内发案:', parsed.security.hasInternalCase ? '有' : '无')

        // 准备入库数据
        const reportData = {
            prison_name: prisonName,  // 使用当前用户的派驻单位
            report_month: uploadMonth,  // 使用前端选择的月份

            // 监管安全
            has_escape: parsed.security.hasEscape,
            has_major_case: parsed.security.hasMajorCase,
            has_safety_accident: parsed.security.hasSafetyAccident,
            has_health_event: parsed.security.hasHealthEvent,
            has_internal_case: parsed.security.hasInternalCase,

            // 违纪统计
            violation_count: parsed.discipline.violationCount,
            confinement_count: parsed.discipline.confinementCount,
            warning_count: parsed.discipline.warningCount,

            // 罪犯构成
            total_prisoners: parsed.prisoners.total,
            major_criminal: parsed.prisoners.majorCriminal,
            death_suspended: parsed.prisoners.deathSuspended,
            life_sentence: parsed.prisoners.lifeSentence,
            multiple_convictions: parsed.prisoners.multipleConvictions,
            foreign_prisoners: parsed.prisoners.foreign,
            hk_macao_taiwan: parsed.prisoners.hongKongMacaoTaiwan,
            mental_illness: parsed.prisoners.mentalIllness,
            former_provincial: parsed.prisoners.formerProvincial,
            former_county: parsed.prisoners.formerCounty,
            falun_gong: parsed.prisoners.falunGong,
            drug_history: parsed.prisoners.drugHistory,
            drug_related: parsed.prisoners.drugRelated,
            newly_admitted: parsed.prisoners.newlyAdmitted,
            juvenile_female: parsed.prisoners.juvenileFemale,
            gang_related: parsed.prisoners.gangRelated,
            evil_related: parsed.prisoners.evilRelated,
            dangerous_security: parsed.prisoners.dangerousSecurity,

            // 文件信息
            original_filename: req.file.originalname,
            file_path: req.file.path,
            sync_batch: syncBatch,
            synced_at: syncedAt
        }

        // 使用upsert更新或插入到 criminal_reports 表
        const [record, created] = await CriminalReport.upsert(reportData, {
            conflictFields: ['prison_name', 'report_month']
        })
        
        console.log('💾 犯情动态数据已保存到 criminal_reports 表:')
        console.log('  操作类型:', created ? '新增' : '更新')
        console.log('  监狱:', reportData.prison_name)
        console.log('  月份:', reportData.report_month)
        console.log('  在押罪犯总数:', reportData.total_prisoners)
        console.log('  涉黑罪犯:', reportData.gang_related)
        console.log('  涉恶罪犯:', reportData.evil_related)
        
        // 🔥 关键：同步更新 monthly_basic_info 表（报告预览和清单使用的表）
        // 查找或创建 monthly_basic_info 记录
        const [basicInfo, basicCreated] = await MonthlyBasicInfo.findOrCreate({
            where: {
                prison_name: prisonName,
                report_month: uploadMonth
            },
            defaults: {
                user_id: req.user.id,
                prison_name: prisonName,
                report_month: uploadMonth
            }
        })
        
        // 更新基本信息（犯情动态数据优先级高于Excel统计）
        await basicInfo.update({
            // 罪犯构成
            total_prisoners: reportData.total_prisoners || basicInfo.total_prisoners,
            major_criminals: reportData.major_criminal || basicInfo.major_criminals,
            death_sentence: reportData.death_suspended || basicInfo.death_sentence,
            life_sentence: reportData.life_sentence || basicInfo.life_sentence,
            repeat_offenders: reportData.multiple_convictions || basicInfo.repeat_offenders,
            foreign_prisoners: reportData.foreign_prisoners || basicInfo.foreign_prisoners,
            hk_macao_taiwan: reportData.hk_macao_taiwan || basicInfo.hk_macao_taiwan,
            mental_illness: reportData.mental_illness || basicInfo.mental_illness,
            former_officials: reportData.former_provincial || basicInfo.former_officials,
            former_county_level: reportData.former_county || basicInfo.former_county_level,
            falun_gong: reportData.falun_gong || basicInfo.falun_gong,
            drug_history: reportData.drug_history || basicInfo.drug_history,
            drug_crimes: reportData.drug_related || basicInfo.drug_crimes,
            new_admissions: reportData.newly_admitted || basicInfo.new_admissions,
            minor_females: reportData.juvenile_female || basicInfo.minor_females,
            gang_related: reportData.gang_related || basicInfo.gang_related,
            evil_forces: reportData.evil_related || basicInfo.evil_forces,
            endangering_safety: reportData.dangerous_security || basicInfo.endangering_safety,
            
            // 违纪统计
            recorded_punishments: reportData.violation_count || basicInfo.recorded_punishments,
            confinement_punishments: reportData.confinement_count || basicInfo.confinement_punishments
        })
        
        console.log('✅ 已同步更新 monthly_basic_info 表')
        console.log('  现在报告预览和清单可以看到这些数据了！')

        res.json({
            success: true,
            type: 'criminal_report',
            typeName: '犯情动态',
            syncBatch,
            prisonName,  // 使用用户的派驻单位
            uploadMonth,  // 使用前端选择的月份
            created,
            stats: {
                total: 1,
                inserted: created ? 1 : 0,
                updated: created ? 0 : 1,
                errors: 0
            },
            data: {
                reportMonth: uploadMonth,
                prisonName: reportData.prison_name,
                totalPrisoners: reportData.total_prisoners,
                gangRelated: reportData.gang_related,
                evilRelated: reportData.evil_related,
                newlyAdmitted: reportData.newly_admitted,
                confinementCount: reportData.confinement_count,
                warningCount: reportData.warning_count
            }
        })
    } catch (error) {
        console.error('犯情动态同步失败:', error)
        res.status(500).json({ error: '同步失败: ' + error.message })
    }
})

// ============================================================
// 统计和查询接口
// ============================================================

/**
 * 获取统计数据
 * GET /api/template-sync/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const [
            prisonerCount,
            strictEducationCount,
            confinementCount,
            restraintCount,
            mailCount,
            blacklistCount
        ] = await Promise.all([
            Prisoner.count(),
            StrictEducation.count(),
            Confinement.count(),
            RestraintUsage.count(),
            MailRecord.count(),
            Blacklist.count()
        ])

        res.json({
            prisoners: prisonerCount,
            strictEducation: strictEducationCount,
            confinement: confinementCount,
            restraint: restraintCount,
            mail: mailCount,
            blacklist: blacklistCount,
            total: strictEducationCount + confinementCount + restraintCount + mailCount + blacklistCount
        })
    } catch (error) {
        console.error('获取统计失败:', error)
        res.status(500).json({ error: '获取统计失败' })
    }
})

/**
 * 获取同步历史
 * GET /api/template-sync/history
 */
router.get('/history', async (req, res) => {
    try {
        const { page = 1, pageSize = 20, type } = req.query

        const models = [
            { model: StrictEducation, name: '严管教育', type: 'strict_education' },
            { model: Confinement, name: '禁闭审批', type: 'confinement' },
            { model: RestraintUsage, name: '戒具使用', type: 'restraint' },
            { model: MailRecord, name: '信件汇总', type: 'mail' },
            { model: Blacklist, name: '涉黑恶名单', type: 'blacklist' }
        ]

        const history = []

        for (const { model, name, type: modelType } of models) {
            if (type && type !== modelType) continue

            const batches = await model.findAll({
                attributes: ['sync_batch', 'synced_at'],
                where: { sync_batch: { [Op.not]: null } },
                group: ['sync_batch', 'synced_at'],
                order: [['synced_at', 'DESC']],
                limit: 10,
                raw: true
            })

            for (const batch of batches) {
                const count = await model.count({ where: { sync_batch: batch.sync_batch } })
                history.push({
                    syncBatch: batch.sync_batch,
                    syncedAt: batch.synced_at,
                    type: modelType,
                    typeName: name,
                    count
                })
            }
        }

        history.sort((a, b) => new Date(b.syncedAt) - new Date(a.syncedAt))

        res.json({
            total: history.length,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            data: history.slice((page - 1) * pageSize, page * pageSize)
        })
    } catch (error) {
        console.error('获取同步历史失败:', error)
        res.status(500).json({ error: '获取同步历史失败' })
    }
})

/**
 * 获取指定类型的详细数据
 * GET /api/template-sync/data/:type
 */
router.get('/data/:type', async (req, res) => {
    try {
        const { type } = req.params
        const { page = 1, pageSize = 20, prisonerId, startDate, endDate } = req.query

        const Model = {
            'strict_education': StrictEducation,
            'confinement': Confinement,
            'restraint': RestraintUsage,
            'mail': MailRecord,
            'blacklist': Blacklist,
            'prisoner': Prisoner
        }[type]

        if (!Model) {
            return res.status(400).json({ error: '无效的数据类型' })
        }

        const where = {}
        if (prisonerId) where.prisoner_id = prisonerId
        if (startDate && endDate) {
            where.create_date = { [Op.between]: [startDate, endDate] }
        }

        const { count, rows } = await Model.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: parseInt(pageSize),
            offset: (parseInt(page) - 1) * parseInt(pageSize)
        })

        res.json({
            total: count,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            data: rows
        })
    } catch (error) {
        console.error('获取数据失败:', error)
        res.status(500).json({ error: '获取数据失败' })
    }
})

/**
 * 撤销某次同步
 * DELETE /api/template-sync/:syncBatch
 */
router.delete('/:syncBatch', requireAdmin, async (req, res) => {
    try {
        const { syncBatch } = req.params

        const models = [StrictEducation, Confinement, RestraintUsage, MailRecord, Blacklist]
        let totalDeleted = 0

        for (const Model of models) {
            const deleted = await Model.destroy({ where: { sync_batch: syncBatch } })
            totalDeleted += deleted
        }

        res.json({
            success: true,
            message: `已撤销同步批次 ${syncBatch}`,
            deletedCount: totalDeleted
        })
    } catch (error) {
        console.error('撤销同步失败:', error)
        res.status(500).json({ error: '撤销同步失败' })
    }
})

/**
 * 获取指定月份的信件统计
 * GET /api/template-sync/mail-stats/:month
 */
router.get('/mail-stats/:month', async (req, res) => {
    try {
        const { month } = req.params  // YYYY-MM格式
        const prisonName = req.query.prison_name || req.user.prison_name

        if (!prisonName) {
            return res.status(400).json({ error: '缺少监狱名称参数' })
        }

        // 统计该月份的信件数量
        const mailCount = await MailRecord.count({
            where: {
                prison_name: prisonName,
                upload_month: month
            }
        })

        res.json({
            success: true,
            data: {
                month,
                prisonName,
                mailCount
            }
        })
    } catch (error) {
        console.error('获取信件统计失败:', error)
        res.status(500).json({ error: '获取信件统计失败' })
    }
})

module.exports = router
