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

        // 查询该月份的基本信息（直接按监狱名称查询，不需要JOIN）
        const [results] = await sequelize.query(`
            SELECT * 
            FROM monthly_basic_info
            WHERE prison_name = :prisonName AND report_month = :month
            LIMIT 1
        `, {
            replacements: { prisonName, month }
        })

        let basicInfo = null
        let hasManualData = false  // 标记是否有手动编辑的数据
        
        if (results.length > 0) {
            basicInfo = results[0]
            hasManualData = true  // 数据库中有记录，说明用户手动编辑过
        } else {
            // 没有基本信息，自动创建初始化记录（符合"派驻单位+日期"唯一索引规则）
            console.log(`未找到 ${prisonName} ${month} 的数据，自动创建初始化记录`)
            
            await sequelize.query(`
                INSERT INTO monthly_basic_info (
                    user_id, prison_name, report_month,
                    total_prisoners, major_criminals, death_sentence, life_sentence,
                    repeat_offenders, foreign_prisoners, hk_macao_taiwan, mental_illness,
                    former_officials, former_county_level, falun_gong, drug_history,
                    drug_crimes, new_admissions, minor_females, gang_related,
                    evil_forces, endangering_safety, released_count,
                    recorded_punishments, recorded_punishments_reason,
                    confinement_punishments, confinement_reason,
                    created_at, updated_at
                ) VALUES (
                    :userId, :prisonName, :reportMonth,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', 0, '',
                    NOW(), NOW()
                )
            `, {
                replacements: {
                    userId: user.id,
                    prisonName: prisonName,
                    reportMonth: month
                }
            })
            
            // 重新查询刚创建的记录
            const [newResults] = await sequelize.query(`
                SELECT * 
                FROM monthly_basic_info
                WHERE prison_name = :prisonName AND report_month = :month
                LIMIT 1
            `, {
                replacements: { prisonName, month }
            })
            
            basicInfo = newResults[0]
        }

        // 直接返回数据库中的数据
        // 数据更新方式：
        // 1. 犯情动态Word上传 → 直接UPDATE
        // 2. Excel上传 → 直接UPDATE  
        // 3. 用户手动编辑 → 直接UPDATE
        // 谁后操作，谁的数据就生效（直接覆盖）

        res.json({
            success: true,
            data: basicInfo
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
        const { report_month, prison_name, ...basicInfo } = req.body

        if (!report_month) {
            return res.status(400).json({ error: '缺少report_month参数' })
        }
        
        if (!prison_name) {
            return res.status(400).json({ error: '缺少prison_name参数' })
        }

        console.log('保存基本信息:', { user_id: user.id, prison_name, report_month })

        // 检查是否已存在（按监狱名称和月份查询）
        const [existing] = await sequelize.query(`
            SELECT id FROM monthly_basic_info 
            WHERE prison_name = :prisonName AND report_month = :month
            LIMIT 1
        `, {
            replacements: { prisonName: prison_name, month: report_month }
        })

        if (existing.length > 0) {
            // 更新
            console.log('更新现有记录, ID:', existing[0].id)
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
                    letters_received = :lettersReceived,
                    parole_batch = :paroleBatch,
                    parole_count = :paroleCount,
                    parole_stage = :paroleStage,
                    correction_notices = :correctionNotices,
                    correction_issues = :correctionIssues,
                    three_scene_checks = :threeSceneChecks,
                    key_location_checks = :keyLocationChecks,
                    visit_checks = :visitChecks,
                    visit_illegal_count = :visitIllegalCount,
                    monitor_checks = :monitorChecks,
                    issues_found = :issuesFound,
                    total_talks = :totalTalks,
                    new_admission_talks = :newAdmissionTalks,
                    evil_forces_talks = :evilForcesTalks,
                    injury_talks = :injuryTalks,
                    confinement_talks = :confinementTalks,
                    questionnaire_count = :questionnaireCount,
                    life_sentence_reviews = :lifeSentenceReviews,
                    analysis_meetings = :analysisMeetings,
                    other_activities = :otherActivities,
                    mailbox_opens = :mailboxOpens,
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
                    confinementReason: basicInfo.confinement_reason || '',
                    lettersReceived: basicInfo.letters_received || 0,
                    paroleBatch: basicInfo.parole_batch || '',
                    paroleCount: basicInfo.parole_count || 0,
                    paroleStage: basicInfo.parole_stage || '',
                    correctionNotices: basicInfo.correction_notices || 0,
                    correctionIssues: basicInfo.correction_issues || '',
                    threeSceneChecks: basicInfo.three_scene_checks || 0,
                    keyLocationChecks: basicInfo.key_location_checks || 0,
                    visitChecks: basicInfo.visit_checks || 0,
                    visitIllegalCount: basicInfo.visit_illegal_count || 0,
                    monitorChecks: basicInfo.monitor_checks || 0,
                    issuesFound: basicInfo.issues_found || 0,
                    totalTalks: basicInfo.total_talks || 0,
                    newAdmissionTalks: basicInfo.new_admission_talks || 0,
                    evilForcesTalks: basicInfo.evil_forces_talks || 0,
                    injuryTalks: basicInfo.injury_talks || 0,
                    confinementTalks: basicInfo.confinement_talks || 0,
                    questionnaireCount: basicInfo.questionnaire_count || 0,
                    lifeSentenceReviews: basicInfo.life_sentence_reviews || 0,
                    analysisMeetings: basicInfo.analysis_meetings || 0,
                    otherActivities: basicInfo.other_activities || '',
                    mailboxOpens: basicInfo.mailbox_opens || 0
                }
            })

            res.json({
                success: true,
                message: '更新成功'
            })
        } else {
            // 插入新记录
            console.log('插入新记录')
            await sequelize.query(`
                INSERT INTO monthly_basic_info (
                    user_id, prison_name, report_month,
                    total_prisoners, major_criminals, death_sentence, life_sentence,
                    repeat_offenders, foreign_prisoners, hk_macao_taiwan, mental_illness,
                    former_officials, former_county_level, falun_gong, drug_history,
                    drug_crimes, new_admissions, minor_females, gang_related,
                    evil_forces, endangering_safety, released_count,
                    recorded_punishments, recorded_punishments_reason,
                    confinement_punishments, confinement_reason, letters_received,
                    parole_batch, parole_count, parole_stage,
                    correction_notices, correction_issues,
                    three_scene_checks, key_location_checks, visit_checks, visit_illegal_count,
                    monitor_checks, issues_found,
                    total_talks, new_admission_talks, evil_forces_talks,
                    injury_talks, confinement_talks, questionnaire_count,
                    life_sentence_reviews, analysis_meetings, other_activities,
                    mailbox_opens,
                    created_at, updated_at
                ) VALUES (
                    :userId, :prisonName, :reportMonth,
                    :totalPrisoners, :majorCriminals, :deathSentence, :lifeSentence,
                    :repeatOffenders, :foreignPrisoners, :hkMacaoTaiwan, :mentalIllness,
                    :formerOfficials, :formerCountyLevel, :falunGong, :drugHistory,
                    :drugCrimes, :newAdmissions, :minorFemales, :gangRelated,
                    :evilForces, :endangeringSafety, :releasedCount,
                    :recordedPunishments, :recordedPunishmentsReason,
                    :confinementPunishments, :confinementReason, :lettersReceived,
                    :paroleBatch, :paroleCount, :paroleStage,
                    :correctionNotices, :correctionIssues,
                    :threeSceneChecks, :keyLocationChecks, :visitChecks, :visitIllegalCount,
                    :monitorChecks, :issuesFound,
                    :totalTalks, :newAdmissionTalks, :evilForcesTalks,
                    :injuryTalks, :confinementTalks, :questionnaireCount,
                    :lifeSentenceReviews, :analysisMeetings, :otherActivities,
                    :mailboxOpens,
                    NOW(), NOW()
                )
            `, {
                replacements: {
                    userId: user.id,
                    prisonName: prison_name,
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
                    confinementReason: basicInfo.confinement_reason || '',
                    lettersReceived: basicInfo.letters_received || 0,
                    paroleBatch: basicInfo.parole_batch || '',
                    paroleCount: basicInfo.parole_count || 0,
                    paroleStage: basicInfo.parole_stage || '',
                    correctionNotices: basicInfo.correction_notices || 0,
                    correctionIssues: basicInfo.correction_issues || '',
                    threeSceneChecks: basicInfo.three_scene_checks || 0,
                    keyLocationChecks: basicInfo.key_location_checks || 0,
                    visitChecks: basicInfo.visit_checks || 0,
                    visitIllegalCount: basicInfo.visit_illegal_count || 0,
                    monitorChecks: basicInfo.monitor_checks || 0,
                    issuesFound: basicInfo.issues_found || 0,
                    totalTalks: basicInfo.total_talks || 0,
                    newAdmissionTalks: basicInfo.new_admission_talks || 0,
                    evilForcesTalks: basicInfo.evil_forces_talks || 0,
                    injuryTalks: basicInfo.injury_talks || 0,
                    confinementTalks: basicInfo.confinement_talks || 0,
                    questionnaireCount: basicInfo.questionnaire_count || 0,
                    lifeSentenceReviews: basicInfo.life_sentence_reviews || 0,
                    analysisMeetings: basicInfo.analysis_meetings || 0,
                    otherActivities: basicInfo.other_activities || '',
                    mailboxOpens: basicInfo.mailbox_opens || 0
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
