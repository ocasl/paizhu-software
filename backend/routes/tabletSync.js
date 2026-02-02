/**
 * 平板同步数据导入路由
 * 处理从平板导出的ZIP同步包
 */
const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const unzipper = require('unzipper')
const { DailyLog, WeeklyRecord, MonthlyRecord, ImmediateEvent, Attachment } = require('../models')

// 配置文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/tablet-sync')
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now()
        cb(null, `sync_${timestamp}.zip`)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB限制
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/zip' ||
            file.mimetype === 'application/x-zip-compressed' ||
            file.originalname.endsWith('.zip')) {
            cb(null, true)
        } else {
            cb(new Error('只支持ZIP文件'), false)
        }
    }
})

/**
 * POST /api/tablet-sync/import
 * 导入平板同步ZIP包
 */
router.post('/import', upload.single('file'), async (req, res) => {
    const zipPath = req.file?.path
    let extractDir = null

    try {
        if (!req.file) {
            return res.status(400).json({ error: '请上传ZIP文件' })
        }

        console.log('开始处理平板同步包:', req.file.originalname)

        // 创建解压目录
        extractDir = path.join(__dirname, '../uploads/tablet-sync', `extract_${Date.now()}`)
        fs.mkdirSync(extractDir, { recursive: true })

        // 解压ZIP文件
        await new Promise((resolve, reject) => {
            fs.createReadStream(zipPath)
                .pipe(unzipper.Extract({ path: extractDir }))
                .on('close', resolve)
                .on('error', reject)
        })

        console.log('ZIP解压完成')

        // 读取data.json
        const dataJsonPath = path.join(extractDir, 'data.json')
        if (!fs.existsSync(dataJsonPath)) {
            throw new Error('ZIP包中缺少data.json文件')
        }

        const dataJson = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'))
        console.log('读取data.json成功:', {
            exportTime: dataJson.exportTime,
            stats: dataJson.stats
        })

        // 统计结果
        const result = {
            daily_logs: { inserted: 0, updated: 0, failed: 0 },
            weekly_records: { inserted: 0, updated: 0, failed: 0 },
            monthly_records: { inserted: 0, updated: 0, failed: 0 },
            immediate_events: { inserted: 0, updated: 0, failed: 0 },
            attachments: { copied: 0, failed: 0 }
        }

        // 导入日检察记录
        if (dataJson.tables?.daily_logs?.length > 0) {
            for (const record of dataJson.tables.daily_logs) {
                try {
                    // 检查是否已存在（通过日期+用户ID）
                    const existing = await DailyLog.findOne({
                        where: {
                            log_date: record.log_date,
                            user_id: record.user_id || req.user?.id || 1
                        }
                    })

                    const data = {
                        user_id: record.user_id || req.user?.id || 1,
                        log_date: record.log_date,
                        prison_name: record.prison_name || req.user?.prison_name || 'XX监狱',
                        inspector_name: record.inspector_name || req.user?.username || '测试检察官',
                        three_scenes: typeof record.three_scenes === 'string'
                            ? JSON.parse(record.three_scenes)
                            : record.three_scenes,
                        strict_control: typeof record.strict_control === 'string'
                            ? JSON.parse(record.strict_control)
                            : record.strict_control,
                        police_equipment: typeof record.police_equipment === 'string'
                            ? JSON.parse(record.police_equipment)
                            : record.police_equipment,
                        gang_prisoners: typeof record.gang_prisoners === 'string'
                            ? JSON.parse(record.gang_prisoners)
                            : record.gang_prisoners,
                        admission: typeof record.admission === 'string'
                            ? JSON.parse(record.admission)
                            : record.admission,
                        monitor_check: typeof record.monitor_check === 'string'
                            ? JSON.parse(record.monitor_check)
                            : record.monitor_check,
                        supervision_situation: record.supervision_situation,
                        feedback_situation: record.feedback_situation,
                        other_work: typeof record.other_work === 'string'
                            ? JSON.parse(record.other_work)
                            : record.other_work,
                        notes: record.notes
                    }

                    if (existing) {
                        await existing.update(data)
                        result.daily_logs.updated++
                    } else {
                        await DailyLog.create(data)
                        result.daily_logs.inserted++
                    }
                } catch (e) {
                    console.error('导入日检察失败:', e.message)
                    result.daily_logs.failed++
                }
            }
        }

        // 导入周检察记录
        if (dataJson.tables?.weekly_records?.length > 0) {
            for (const record of dataJson.tables.weekly_records) {
                try {
                    const existing = await WeeklyRecord.findOne({
                        where: {
                            record_date: record.record_date,
                            user_id: record.user_id || req.user?.id || 1
                        }
                    })

                    const data = {
                        user_id: record.user_id || req.user?.id || 1,
                        record_date: record.record_date,
                        week_number: record.week_number,
                        hospital_check: typeof record.hospital_check === 'string'
                            ? JSON.parse(record.hospital_check)
                            : record.hospital_check,
                        injury_check: typeof record.injury_check === 'string'
                            ? JSON.parse(record.injury_check)
                            : record.injury_check,
                        talk_records: typeof record.talk_records === 'string'
                            ? JSON.parse(record.talk_records)
                            : record.talk_records,
                        mailbox: typeof record.mailbox === 'string'
                            ? JSON.parse(record.mailbox)
                            : record.mailbox,
                        contraband: typeof record.contraband === 'string'
                            ? JSON.parse(record.contraband)
                            : record.contraband,
                        notes: record.notes
                    }

                    if (existing) {
                        await existing.update(data)
                        result.weekly_records.updated++
                    } else {
                        await WeeklyRecord.create(data)
                        result.weekly_records.inserted++
                    }
                } catch (e) {
                    console.error('导入周检察失败:', e.message)
                    result.weekly_records.failed++
                }
            }
        }

        // 导入月检察记录
        if (dataJson.tables?.monthly_records?.length > 0) {
            for (const record of dataJson.tables.monthly_records) {
                try {
                    const existing = await MonthlyRecord.findOne({
                        where: {
                            record_month: record.record_month,
                            user_id: record.user_id || req.user?.id || 1
                        }
                    })

                    const data = {
                        user_id: record.user_id || req.user?.id || 1,
                        record_month: record.record_month,
                        visit_check: typeof record.visit_check === 'string'
                            ? JSON.parse(record.visit_check)
                            : record.visit_check,
                        meeting: typeof record.meeting === 'string'
                            ? JSON.parse(record.meeting)
                            : record.meeting,
                        punishment: typeof record.punishment === 'string'
                            ? JSON.parse(record.punishment)
                            : record.punishment,
                        position_stats: typeof record.position_stats === 'string'
                            ? JSON.parse(record.position_stats)
                            : record.position_stats,
                        notes: record.notes
                    }

                    if (existing) {
                        await existing.update(data)
                        result.monthly_records.updated++
                    } else {
                        await MonthlyRecord.create(data)
                        result.monthly_records.inserted++
                    }
                } catch (e) {
                    console.error('导入月检察失败:', e.message)
                    result.monthly_records.failed++
                }
            }
        }

        // 导入及时检察
        if (dataJson.tables?.immediate_events?.length > 0) {
            for (const record of dataJson.tables.immediate_events) {
                try {
                    const existing = await ImmediateEvent.findOne({
                        where: {
                            event_date: record.event_date,
                            event_type: record.event_type,
                            user_id: record.user_id || req.user?.id || 1
                        }
                    })

                    const data = {
                        user_id: record.user_id || req.user?.id || 1,
                        event_date: record.event_date,
                        title: record.title || '',
                        event_type: record.event_type,
                        description: record.description,
                        parole_data: typeof record.parole_data === 'string'
                            ? JSON.parse(record.parole_data)
                            : record.parole_data,
                        attachment_ids: typeof record.attachment_ids === 'string'
                            ? JSON.parse(record.attachment_ids)
                            : (record.attachment_ids || []),
                        status: record.status || 'pending'
                    }

                    if (existing) {
                        await existing.update(data)
                        result.immediate_events.updated++
                    } else {
                        await ImmediateEvent.create(data)
                        result.immediate_events.inserted++
                    }
                } catch (e) {
                    console.error('导入及时检察失败:', e.message)
                    result.immediate_events.failed++
                }
            }
        }

        // 处理附件文件
        const attachmentsDir = path.join(extractDir, 'attachments')
        if (fs.existsSync(attachmentsDir) && dataJson.tables?.attachments?.length > 0) {
            const targetDir = path.join(__dirname, '../uploads/attachments')
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true })
            }

            for (const attachment of dataJson.tables.attachments) {
                try {
                    const sourceFile = path.join(attachmentsDir, attachment.file_name)
                    if (fs.existsSync(sourceFile)) {
                        // 生成新文件名避免冲突
                        const newFileName = `tablet_${Date.now()}_${attachment.file_name}`
                        const targetPath = path.join(targetDir, newFileName)

                        // 复制文件
                        fs.copyFileSync(sourceFile, targetPath)

                        // 创建附件记录
                        await Attachment.create({
                            user_id: attachment.user_id || req.user?.id || 1,
                            category: attachment.category || 'tablet-sync',
                            original_name: attachment.original_name || attachment.file_name,
                            file_name: newFileName,
                            file_path: `/uploads/attachments/${newFileName}`,
                            file_size: attachment.file_size,
                            mime_type: attachment.mime_type,
                            upload_month: attachment.upload_month || new Date().toISOString().slice(0, 7)
                        })

                        result.attachments.copied++
                    }
                } catch (e) {
                    console.error('处理附件失败:', e.message)
                    result.attachments.failed++
                }
            }
        }

        // 清理临时文件
        try {
            fs.rmSync(extractDir, { recursive: true, force: true })
            fs.unlinkSync(zipPath)
        } catch (e) {
            console.warn('清理临时文件失败:', e.message)
        }

        console.log('平板同步导入完成:', result)

        res.json({
            success: true,
            message: '平板数据同步成功',
            exportTime: dataJson.exportTime,
            prisonName: dataJson.prisonName,
            inspectorName: dataJson.inspectorName,
            result
        })

    } catch (error) {
        console.error('平板同步导入失败:', error)

        // 清理临时文件
        try {
            if (extractDir && fs.existsSync(extractDir)) {
                fs.rmSync(extractDir, { recursive: true, force: true })
            }
            if (zipPath && fs.existsSync(zipPath)) {
                fs.unlinkSync(zipPath)
            }
        } catch (e) { }

        res.status(500).json({
            error: '导入失败: ' + error.message
        })
    }
})

module.exports = router
