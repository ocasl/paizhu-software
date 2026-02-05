/**
 * 检查 monthly_basic_info 表字段与前端可编辑字段的一致性
 */

console.log('=== 字段一致性检查 ===\n')

// 1. monthly_basic_info 表的字段（从模型定义）
const dbFields = {
  '罪犯构成': [
    'total_prisoners',      // 在押罪犯总数
    'major_criminals',      // 重大刑事犯
    'death_sentence',       // 死缓犯
    'life_sentence',        // 无期犯
    'repeat_offenders',     // 二次以上判刑罪犯
    'foreign_prisoners',    // 外籍犯
    'hk_macao_taiwan',      // 港澳台罪犯
    'mental_illness',       // 精神病犯
    'former_officials',     // 原地厅以上罪犯
    'former_county_level',  // 原县团级以上罪犯
    'falun_gong',           // 法轮功
    'drug_history',         // 有吸毒史罪犯
    'drug_crimes',          // 涉毒犯
    'new_admissions',       // 新收押罪犯
    'minor_females',        // 未成年女犯
    'gang_related',         // 涉黑罪犯
    'evil_forces',          // 涉恶罪犯
    'endangering_safety',   // 危安罪犯
    'released_count'        // 刑满释放出监罪犯
  ],
  '违纪统计': [
    'recorded_punishments',         // 记过人数
    'recorded_punishments_reason',  // 记过原因
    'confinement_punishments',      // 禁闭人数
    'confinement_reason'            // 禁闭原因
  ],
  '信件统计': [
    'letters_received'  // 收到信件数量
  ]
}

// 2. 报告预览页面的可编辑字段（从 ReportPreview.vue）
const reportPreviewFields = {
  '一、本月基本情况': [
    'totalPrisoners',       // 在押罪犯总数
    'majorCriminals',       // 重大刑事犯
    'deathSentence',        // 死缓犯
    'lifeSentence',         // 无期犯
    'repeatOffenders',      // 二次以上判刑
    'foreignPrisoners',     // 外籍犯
    'hkMacaoTaiwan',        // 港澳台
    'mentalIllness',        // 精神病犯
    'formerOfficials',      // 原地厅以上
    'formerCountyLevel',    // 原县团级以上
    'gangRelated',          // 涉黑罪犯
    'evilForces',           // 涉恶罪犯
    'newAdmissions',        // 新收押罪犯
    'releasedCount',        // 刑满释放
    'drugCrimes',           // 涉毒犯
    'drugHistory',          // 有吸毒史
    'falunGong',            // 法轮功
    'minorFemales',         // 未成年女犯
    'endangeringSafety',    // 危安罪犯
    'recordedPunishments',  // 记过人数
    'recordedPunishmentsReason',  // 记过原因
    'confinementPunishments',     // 禁闭人数
    'confinementReason'           // 禁闭原因
  ],
  '二、执法检察情况': [
    'paroleBatch',          // 减刑批次（不在 monthly_basic_info）
    'paroleCount',          // 减刑案件数（不在 monthly_basic_info）
    'paroleStage',          // 减刑阶段（不在 monthly_basic_info）
    'correctionNotices',    // 纠正违法通知书（不在 monthly_basic_info）
    'correctionIssues',     // 纠正违法问题（不在 monthly_basic_info）
    'threeSceneChecks',     // 三大现场检察（不在 monthly_basic_info）
    'keyLocationChecks',    // 重点场所检察（不在 monthly_basic_info）
    'visitChecks',          // 会见检察（不在 monthly_basic_info）
    'visitIllegalCount'     // 会见违法问题（不在 monthly_basic_info）
  ],
  '三、安全防范检察': [
    'monitorChecks',        // 监控检察（不在 monthly_basic_info）
    'issuesFound'           // 发现问题（不在 monthly_basic_info）
  ],
  '四、个别谈话': [
    'totalTalks',           // 谈话总数（不在 monthly_basic_info）
    'newAdmissionTalks',    // 新收押谈话（不在 monthly_basic_info）
    'evilForcesTalks',      // 涉恶谈话（不在 monthly_basic_info）
    'injuryTalks',          // 外伤谈话（不在 monthly_basic_info）
    'confinementTalks',     // 禁闭谈话（不在 monthly_basic_info）
    'questionnaireCount'    // 问卷调查（不在 monthly_basic_info）
  ],
  '五、会议活动': [
    'lifeSentenceReviews',  // 无期死缓评审会（不在 monthly_basic_info）
    'analysisMeetings',     // 犯情分析会（不在 monthly_basic_info）
    'otherActivities'       // 其他活动（不在 monthly_basic_info）
  ],
  '六、其他工作': [
    'mailboxOpens',         // 开启信箱（不在 monthly_basic_info）
    'lettersReceived'       // 收到信件（在 monthly_basic_info）
  ]
}

// 3. 统计
const dbFieldCount = Object.values(dbFields).flat().length
const reportPreviewFieldCount = Object.values(reportPreviewFields).flat().length

console.log('📊 数据库字段统计:')
Object.entries(dbFields).forEach(([category, fields]) => {
  console.log(`  ${category}: ${fields.length} 个字段`)
  fields.forEach(field => console.log(`    - ${field}`))
})
console.log(`  总计: ${dbFieldCount} 个字段\n`)

console.log('📊 报告预览可编辑字段统计:')
Object.entries(reportPreviewFields).forEach(([section, fields]) => {
  console.log(`  ${section}: ${fields.length} 个字段`)
})
console.log(`  总计: ${reportPreviewFieldCount} 个字段\n`)

// 4. 分析差异
console.log('⚠️  差异分析:')
console.log(`  数据库字段数: ${dbFieldCount}`)
console.log(`  报告预览字段数: ${reportPreviewFieldCount}`)
console.log(`  差异: ${reportPreviewFieldCount - dbFieldCount} 个字段\n`)

// 5. 详细差异
console.log('🔍 详细差异:')
console.log('\n  ✅ 在 monthly_basic_info 表中的字段（应该从数据库读取）:')
const inDbFields = [
  'totalPrisoners', 'majorCriminals', 'deathSentence', 'lifeSentence',
  'repeatOffenders', 'foreignPrisoners', 'hkMacaoTaiwan', 'mentalIllness',
  'formerOfficials', 'formerCountyLevel', 'falunGong', 'drugHistory',
  'drugCrimes', 'newAdmissions', 'minorFemales', 'gangRelated',
  'evilForces', 'endangeringSafety', 'releasedCount',
  'recordedPunishments', 'recordedPunishmentsReason',
  'confinementPunishments', 'confinementReason',
  'lettersReceived'
]
inDbFields.forEach(field => console.log(`    - ${field}`))
console.log(`    共 ${inDbFields.length} 个字段`)

console.log('\n  ❌ 不在 monthly_basic_info 表中的字段（需要从其他表或计算得出）:')
const notInDbFields = [
  'paroleBatch', 'paroleCount', 'paroleStage',
  'correctionNotices', 'correctionIssues',
  'threeSceneChecks', 'keyLocationChecks', 'visitChecks', 'visitIllegalCount',
  'monitorChecks', 'issuesFound',
  'totalTalks', 'newAdmissionTalks', 'evilForcesTalks', 'injuryTalks', 'confinementTalks', 'questionnaireCount',
  'lifeSentenceReviews', 'analysisMeetings', 'otherActivities',
  'mailboxOpens'
]
notInDbFields.forEach(field => console.log(`    - ${field}`))
console.log(`    共 ${notInDbFields.length} 个字段`)

// 6. 结论
console.log('\n📝 结论:')
console.log('  1. monthly_basic_info 表包含 24 个字段（罪犯构成19个 + 违纪统计4个 + 信件统计1个）')
console.log('  2. 报告预览页面有 44 个可编辑字段')
console.log('  3. 其中 24 个字段应该从 monthly_basic_info 表读取')
console.log('  4. 其余 20 个字段需要从其他表（daily_logs, weekly_records, monthly_records 等）读取或计算')
console.log('\n  ⚠️  用户要求：报告预览中所有可编辑的字段 = monthly_basic_info 表的字段')
console.log('  ⚠️  当前状态：不一致！有 20 个字段不在 monthly_basic_info 表中')
console.log('\n  💡 建议：')
console.log('    方案1: 将这 20 个字段也添加到 monthly_basic_info 表')
console.log('    方案2: 将这 20 个字段从报告预览中移除（不推荐）')
console.log('    方案3: 保持现状，但明确告知用户这些字段来自其他表')

console.log('\n=== 检查完成 ===')
