/**
 * 月度基本信息路由
 * 存储每个月份的基本统计数据（在押罪犯总数等）
 */
const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const { sequelize } = require('../models')

router.use(authenticateToken)

/**
 * GET /api/monthly-basic-info/:month
 * 获取指定月份的基本信息（包含Excel统计数据）
 */
router.get('/:month', async (req, res) => {
    try {
        const { month } = req.params // YYYY-MM格式
        const user = req.user
        
        // 支持通过查询参数指定监狱（院领导/分管领导查看其他监狱的报告）
        const prisonName = req.query.prison_name || user.prison_name

        if (!prisonName) {
            return res.status(400).json({ error: '用户未设置派驻单位，且未指定监狱名称' })
        }

        // 查询该月份的基本信息（通过JOIN用户表按监狱名称查询）
        const [results] = await sequelize.query(`
            SELECT mbi.* 
            FROM monthly_basic_info mbi
            JOIN users u ON mbi.user_id = u.id
            WHERE u.prison_name = :prisonName AND mbi.report_month = :month
            LIMIT 1
        `, {
            replacements: { prisonName, month }
        })

        let basicInfo = null
        if (results.length > 0) {
            basicInfo = results[0]
        } else {
            // 没有基本信息，创建空对象
            basicInfo = {
                report_month: month,
                user_id: user.id,
                total_prisoners: 0,
                major_criminals: 0,
                death_sentence: 0,
                life_sentence: 0,
                repeat_offenders: 0,
                foreign_prisoners: 0,
                hk_macao_taiwan: 0,
                mental_illness: 0,
                former_officials: 0,
                former_county_level: 0,
                falun_gong: 0,
                drug_history: 0,
                drug_crimes: 0,
                new_admissions: 0,
                minor_females: 0,
                gang_related: 0,
                evil_forces: 0,
                endangering_safety: 0,
                released_count: 0,
                recorded_punishments: 0,
                recorded_punishments_reason: '',
                confinement_punishments: 0,
                confinement_reason: ''
            }
        }

        // 数据优先级：犯情动态Word > Excel表 > 手动填写
        // 1. 先尝试从犯情动态获取数据
        const [criminalReportData] = await sequelize.query(`
            SELECT * FROM criminal_reports
            WHERE prison_name = :prisonName AND report_month = :month
            LIMIT 1
        `, {
            replacements: { prisonName, month }
        })

        if (criminalReportData.length > 0) {
            // 如果有犯情动态数据，优先使用
            const report = criminalReportData[0]
            basicInfo.total_prisoners = report.total_prisoners || basicInfo.total_prisoners
            basicInfo.major_criminals = report.major_criminal || basicInfo.major_criminals
            basicInfo.death_sentence = report.death_suspended || basicInfo.death_sentence
            basicInfo.life_sentence = report.life_sentence || basicInfo.life_sentence
            basicInfo.repeat_offenders = report.multiple_convictions || basicInfo.repeat_offenders
            basicInfo.foreign_prisoners = report.foreign_prisoners || basicInfo.foreign_prisoners
            basicInfo.hk_macao_taiwan = report.hk_macao_taiwan || basicInfo.hk_macao_taiwan
            basicInfo.mental_illness = report.mental_illness || basicInfo.mental_illness
            basicInfo.former_officials = report.former_provincial || basicInfo.former_officials
            basicInfo.former_county_level = report.former_county || basicInfo.former_county_level
            basicInfo.falun_gong = report.falun_gong || basicInfo.falun_gong
            basicInfo.drug_history = report.drug_history || basicInfo.drug_history
            basicInfo.drug_crimes = report.drug_related || basicInfo.drug_crimes
            basicInfo.new_admissions = report.newly_admitted || basicInfo.new_admissions
            basicInfo.minor_females = report.juvenile_female || basicInfo.minor_females
            basicInfo.gang_related = report.gang_related || basicInfo.gang_related
            basicInfo.evil_forces = report.evil_related || basicInfo.evil_forces
            basicInfo.endangering_safety = report.dangerous_security || basicInfo.endangering_safety
            basicInfo.confinement_punishments = report.confinement_count || basicInfo.confinement_punishments
            basicInfo.recorded_punishments = report.warning_count || basicInfo.recorded_punishments
        }

        // 2. 如果没有犯情动态，再统计Excel数据（按派驻单位过滤）
        const [year, monthNum] = month.split('-')
        const startDate = `${year}-${monthNum}-01`
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0]

        // 2.1 统计涉黑涉恶人数（如果犯情动态没有数据，才使用Excel数据）
        const [blacklistStats] = await sequelize.query(`
            SELECT 
                COUNT(CASE WHEN involvement_type LIKE '%涉黑%' THEN 1 END) as gang_count,
                COUNT(CASE WHEN involvement_type LIKE '%涉恶%' THEN 1 END) as evil_count,
                COUNT(*) as total_count
            FROM blacklists
            WHERE prison_name = :prisonName
        `, {
            replacements: { prisonName }
        })

        // 如果犯情动态没有涉黑涉恶数据，且Excel表有数据，就用Excel表的
        if (criminalReportData.length === 0 || !criminalReportData[0].gang_related) {
            if (blacklistStats.length > 0 && blacklistStats[0].total_count > 0) {
                basicInfo.gang_related = blacklistStats[0].gang_count || 0
                basicInfo.evil_forces = blacklistStats[0].evil_count || 0
            }
        }

        // 2.2 统计禁闭处分人数（本月，如果犯情动态没有数据，才使用Excel数据）
        const [confinementStats] = await sequelize.query(`
            SELECT COUNT(DISTINCT prisoner_id) as count
            FROM confinements
            WHERE prison_name = :prisonName
              AND create_date >= :startDate
              AND create_date <= :endDate
        `, {
            replacements: { prisonName, startDate, endDate }
        })

        // 如果犯情动态没有禁闭数据，且Excel表有数据，就用Excel表的
        if (criminalReportData.length === 0 || !criminalReportData[0].confinement_count) {
            if (confinementStats.length > 0 && confinementStats[0].count > 0) {
                basicInfo.confinement_punishments = confinementStats[0].count || 0
            }
        }

        // 2.3 统计记过处分人数（严管教育，如果犯情动态没有数据，才使用Excel数据）
        const [strictStats] = await sequelize.query(`
            SELECT COUNT(DISTINCT prisoner_id) as count
            FROM strict_educations
            WHERE prison_name = :prisonName
              AND create_date >= :startDate
              AND create_date <= :endDate
        `, {
            replacements: { prisonName, startDate, endDate }
        })

        // 如果犯情动态没有记过数据，且Excel表有数据，就用Excel表的
        if (criminalReportData.length === 0 || !criminalReportData[0].warning_count) {
            if (strictStats.length > 0 && strictStats[0].count > 0) {
                basicInfo.recorded_punishments = strictStats[0].count || 0
            }
        }

        // 2.4 统计信件数量（如果犯情动态没有数据，才使用Excel数据）
        const [mailStats] = await sequelize.query(`
            SELECT COUNT(*) as count
            FROM mail_records
            WHERE prison_name = :prisonName
              AND open_date >= :startDate
              AND open_date <= :endDate
        `, {
            replacements: { prisonName, startDate, endDate }
        })

        // 如果犯情动态没有信件数据，且Excel表有数据，就用Excel表的
        if (criminalReportData.length === 0) {
            if (mailStats.length > 0 && mailStats[0].count > 0) {
                basicInfo.mail_count = mailStats[0].count || 0
            }
        }

        res.json({
            success: true,
            data: basicInfo,
            dataSource: criminalReportData.length > 0 ? '犯情动态Word' : (results.length > 0 ? '手动填写+Excel' : 'Excel统计'),
            message: results.length > 0 ? '数据已加载' : `${month} 月份暂无数据（已统计Excel和犯情动态数据）`
        })
    } catch (error) {
        console.error('获取月度基本信息失败:', error)
        res.status(500).json({ error: '获取月度基本信息失败' })
    }
})

/**
 * POST /api/monthly-basic-info
 * 保存或更新月度基本信息
 */
router.post('/', async (req, res) => {
    try {
        const user = req.user
        const { report_month, ...basicInfo } = req.body

        if (!report_month) {
            return res.status(400).json({ error: '缺少report_month参数' })
        }

        // 检查是否已存在
        const [existing] = await sequelize.query(`
            SELECT id FROM monthly_basic_info 
            WHERE user_id = :userId AND report_month = :month
            LIMIT 1
        `, {
            replacements: { userId: user.id, month: report_month }
        })

        if (existing.length > 0) {
            // 更新
            await sequelize.query(`
                UPDATE monthly_basic_info SET
                    total_prisoners = :totalPrisoners,
                    major_criminals = :majorCriminals,
                    death_sentence = :deathSentence,
                    life_sentence = :lifeSentence,
                    repeat_offenders = :repeatOffenders,
                    foreign_prisoners = :foreignPrisoners,
                    hk_macao_taiwan = :hkMacaoTaiwan,
                    mental_illness = :mentalIllness,
                    former_officials = :formerOfficials,
                    former_county_level = :formerCountyLevel,
                    falun_gong = :falunGong,
                    drug_history = :drugHistory,
                    drug_crimes = :drugCrimes,
                    new_admissions = :newAdmissions,
                    minor_females = :minorFemales,
                    gang_related = :gangRelated,
                    evil_forces = :evilForces,
                    endangering_safety = :endangeringSafety,
                    released_count = :releasedCount,
                    recorded_punishments = :recordedPunishments,
                    recorded_punishments_reason = :recordedPunishmentsReason,
                    confinement_punishments = :confinementPunishments,
                    confinement_reason = :confinementReason,
                    updated_at = NOW()
                WHERE id = :id
            `, {
                replacements: {
                    id: existing[0].id,
                    totalPrisoners: basicInfo.total_prisoners || 0,
                    majorCriminals: basicInfo.major_criminals || 0,
                    deathSentence: basicInfo.death_sentence || 0,
                    lifeSentence: basicInfo.life_sentence || 0,
                    repeatOffenders: basicInfo.repeat_offenders || 0,
                    foreignPrisoners: basicInfo.foreign_prisoners || 0,
                    hkMacaoTaiwan: basicInfo.hk_macao_taiwan || 0,
                    mentalIllness: basicInfo.mental_illness || 0,
                    formerOfficials: basicInfo.former_officials || 0,
                    formerCountyLevel: basicInfo.former_county_level || 0,
                    falunGong: basicInfo.falun_gong || 0,
                    drugHistory: basicInfo.drug_history || 0,
                    drugCrimes: basicInfo.drug_crimes || 0,
                    newAdmissions: basicInfo.new_admissions || 0,
                    minorFemales: basicInfo.minor_females || 0,
                    gangRelated: basicInfo.gang_related || 0,
                    evilForces: basicInfo.evil_forces || 0,
                    endangeringSafety: basicInfo.endangering_safety || 0,
                    releasedCount: basicInfo.released_count || 0,
                    recordedPunishments: basicInfo.recorded_punishments || 0,
                    recordedPunishmentsReason: basicInfo.recorded_punishments_reason || '',
                    confinementPunishments: basicInfo.confinement_punishments || 0,
                    confinementReason: basicInfo.confinement_reason || ''
                }
            })

            res.json({
                success: true,
                message: '更新成功'
            })
        } else {
            // 插入
            await sequelize.query(`
                INSERT INTO monthly_basic_info (
                    user_id, report_month,
                    total_prisoners, major_criminals, death_sentence, life_sentence,
                    repeat_offenders, foreign_prisoners, hk_macao_taiwan, mental_illness,
                    former_officials, former_county_level, falun_gong, drug_history,
                    drug_crimes, new_admissions, minor_females, gang_related,
                    evil_forces, endangering_safety, released_count,
                    recorded_punishments, recorded_punishments_reason,
                    confinement_punishments, confinement_reason,
                    created_at, updated_at
                ) VALUES (
                    :userId, :reportMonth,
                    :totalPrisoners, :majorCriminals, :deathSentence, :lifeSentence,
                    :repeatOffenders, :foreignPrisoners, :hkMacaoTaiwan, :mentalIllness,
                    :formerOfficials, :formerCountyLevel, :falunGong, :drugHistory,
                    :drugCrimes, :newAdmissions, :minorFemales, :gangRelated,
                    :evilForces, :endangeringSafety, :releasedCount,
                    :recordedPunishments, :recordedPunishmentsReason,
                    :confinementPunishments, :confinementReason,
                    NOW(), NOW()
                )
            `, {
                replacements: {
                    userId: user.id,
                    reportMonth: report_month,
                    totalPrisoners: basicInfo.total_prisoners || 0,
                    majorCriminals: basicInfo.major_criminals || 0,
                    deathSentence: basicInfo.death_sentence || 0,
                    lifeSentence: basicInfo.life_sentence || 0,
                    repeatOffenders: basicInfo.repeat_offenders || 0,
                    foreignPrisoners: basicInfo.foreign_prisoners || 0,
                    hkMacaoTaiwan: basicInfo.hk_macao_taiwan || 0,
                    mentalIllness: basicInfo.mental_illness || 0,
                    formerOfficials: basicInfo.former_officials || 0,
                    formerCountyLevel: basicInfo.former_county_level || 0,
                    falunGong: basicInfo.falun_gong || 0,
                    drugHistory: basicInfo.drug_history || 0,
                    drugCrimes: basicInfo.drug_crimes || 0,
                    newAdmissions: basicInfo.new_admissions || 0,
                    minorFemales: basicInfo.minor_females || 0,
                    gangRelated: basicInfo.gang_related || 0,
                    evilForces: basicInfo.evil_forces || 0,
                    endangeringSafety: basicInfo.endangering_safety || 0,
                    releasedCount: basicInfo.released_count || 0,
                    recordedPunishments: basicInfo.recorded_punishments || 0,
                    recordedPunishmentsReason: basicInfo.recorded_punishments_reason || '',
                    confinementPunishments: basicInfo.confinement_punishments || 0,
                    confinementReason: basicInfo.confinement_reason || ''
                }
            })

            res.json({
                success: true,
                message: '保存成功'
            })
        }
    } catch (error) {
        console.error('保存月度基本信息失败:', error)
        res.status(500).json({ error: '保存月度基本信息失败' })
    }
})

module.exports = router
