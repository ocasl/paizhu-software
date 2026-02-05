import { defineStore } from 'pinia'
import { ref, reactive, computed, watch } from 'vue'

// 本地存储 key
const STORAGE_KEY = 'paizhu-report-data'

export const useReportStore = defineStore('report', () => {
    // 当前报告月份
    const currentMonth = ref(new Date().toISOString().slice(0, 7)) // YYYY-MM 格式

    // 从用户信息中获取监狱名称
    const getUserPrisonName = () => {
        try {
            // 尝试从 localStorage 获取用户信息
            const userStr = localStorage.getItem('user')
            if (userStr) {
                const user = JSON.parse(userStr)
                return user.prison_name || user.prisonName || ''
            }
        } catch (e) {
            console.error('获取用户监狱名称失败:', e)
        }
        return ''
    }

    // 派驻信息
    const prisonInfo = reactive({
        prisonName: getUserPrisonName(),
        roomName: ''
    })

    // ==================== 一、本月基本情况 ====================
    const basicInfo = reactive({
        totalPrisoners: 0,        // 在押罪犯总数
        majorCriminals: 0,        // 重大刑事犯
        deathSentence: 0,         // 死缓犯
        lifeSentence: 0,          // 无期犯
        repeatOffenders: 0,       // 二次以上判刑罪犯
        foreignPrisoners: 0,      // 外籍犯
        hkMacaoTaiwan: 0,         // 港澳台罪犯
        mentalIllness: 0,         // 精神病犯
        formerOfficials: 0,       // 原地厅以上罪犯
        formerCountyLevel: 0,     // 原县团级以上罪犯
        falunGong: 0,             // 法轮功
        drugHistory: 0,           // 有吸毒史罪犯
        drugCrimes: 0,            // 涉毒犯
        newAdmissions: 0,         // 新收押罪犯
        minorFemales: 0,          // 未成年女犯
        gangRelated: 0,           // 涉黑罪犯
        evilForces: 0,            // 涉恶罪犯
        endangeringSafety: 0,     // 危安罪犯
        releasedCount: 0,         // 刑满释放出监罪犯
        // 处分情况
        recordedPunishments: 0,          // 记过人数
        recordedPunishmentsReason: '',   // 记过原因
        confinementPunishments: 0,       // 禁闭人数
        confinementReason: '',           // 禁闭原因
        // 信件统计
        lettersReceived: 0               // 收到信件数量
    })

    // ==================== 二、执法检察情况 ====================
    const lawEnforcement = reactive({
        // 减假暂检察
        paroleBatch: '',          // 批次（如：第3批）
        paroleCount: 0,           // 案件数量
        paroleStage: '',          // 当前阶段
        // 收押释放检察
        admissionChecked: true,   // 是否检察
        releaseChecked: true,     // 是否检察
        admissionIssues: '',      // 发现问题
        // 监管执法检察
        correctionNotices: 0,     // 纠正违法通知书份数
        correctionIssues: '',     // 发现的问题描述
        threeSceneChecks: 0,      // 三大现场检察次数
        keyLocationChecks: 0,     // 重点场所检察次数（医务室、严管、禁闭室、伙房等）
        visitChecks: 0,           // 会见检察次数
        visitIllegalCount: 0      // 会见发现违法问题数
    })

    // ==================== 三、安全防范检察 ====================
    const security = reactive({
        monitorChecks: 0,         // 监控检察次数
        issuesFound: 0            // 发现问题数
    })

    // ==================== 四、个别罪犯谈话情况 ====================
    const interviews = reactive({
        totalTalks: 0,            // 个别教育谈话总数
        newAdmissionTalks: 0,     // 新收押罪犯谈话
        evilForcesTalks: 0,       // 涉恶罪犯谈话
        injuryTalks: 0,           // 外伤罪犯谈话
        confinementTalks: 0,      // 禁闭罪犯谈话
        questionnaireCount: 0     // 出监问卷调查表份数
    })

    // ==================== 五、参加会议/活动情况 ====================
    const meetings = reactive({
        lifeSentenceReviews: 0,   // 无期死缓评审会次数
        paroleReviews: 0,         // 减刑假释评审会次数（批次）
        analysisMeetings: 0,      // 犯情分析会次数
        otherActivities: ''       // 其他活动名称
    })

    // ==================== 六、其他工作情况 ====================
    const otherWork = reactive({
        mailboxOpens: 0,          // 开启检察官信箱次数
        lettersReceived: 0        // 收到信件数
    })

    // ==================== 日志记录（用于统计） ====================
    const dailyLogs = ref([])           // 日检察记录
    const weeklyRecords = ref([])       // 周检察记录
    const monthlyRecords = ref([])      // 月检察记录
    const immediateEvents = ref([])     // 及时检察事件
    const uploadedMaterials = ref([])   // 已上传材料

    // ==================== 花名册解析数据（用于数据校验） ====================
    const rosterData = reactive({
        admission: {            // 入监人员
            count: 0,
            parseDate: null
        },
        release: {              // 出监人员
            count: 0,
            parseDate: null
        },
        special: {              // 严管/禁闭/警戒具/涉黑
            strictControl: 0,   // 严管人员
            confinement: 0,     // 禁闭人员
            policeEquipment: 0, // 警戒具人员
            gangRelated: 0,     // 涉黑罪犯
            total: 0,
            parseDate: null
        }
    })

    // ==================== 附件计数（用于自动统计） ====================
    const attachmentCounts = reactive({
        // 谈话笔录类
        releaseTranscript: 0,       // 刑释罪犯谈话笔录
        injuryTranscript: 0,        // 外伤就诊谈话笔录
        confinementTranscript: 0,   // 严管禁闭谈话笔录
        visitTranscript: 0,         // 非常规会见谈话笔录
        newPrisonerTranscript: 0,   // 新进罪犯谈话笔录
        // 其他类
        questionnaire: 0,           // 调查问卷
        total: 0                    // 总计
    })

    // ==================== 计算属性 ====================

    // 报告完成度（0-100）
    const completionRate = computed(() => {
        let filled = 0
        let total = 0

        // 检查基本情况
        total += 5 // 关键字段
        if (basicInfo.totalPrisoners > 0) filled++
        if (basicInfo.newAdmissions >= 0) filled++
        if (basicInfo.releasedCount >= 0) filled++
        if (basicInfo.gangRelated >= 0) filled++
        if (basicInfo.evilForces >= 0) filled++

        // 检查执法检察
        total += 3
        if (lawEnforcement.threeSceneChecks > 0) filled++
        if (lawEnforcement.keyLocationChecks > 0) filled++
        if (lawEnforcement.visitChecks > 0) filled++

        // 检查安防
        total += 1
        if (security.monitorChecks > 0) filled++

        // 检查谈话
        total += 1
        if (interviews.totalTalks > 0) filled++

        return Math.round((filled / total) * 100)
    })

    // 待补充字段列表
    const pendingFields = computed(() => {
        const fields = []
        if (!lawEnforcement.correctionIssues && lawEnforcement.correctionNotices > 0) {
            fields.push({ key: 'correctionIssues', label: '纠正违法问题描述' })
        }
        if (!meetings.otherActivities) {
            fields.push({ key: 'otherActivities', label: '参加活动名称' })
        }
        if (!basicInfo.recordedPunishmentsReason && basicInfo.recordedPunishments > 0) {
            fields.push({ key: 'recordedPunishmentsReason', label: '记过原因' })
        }
        if (!basicInfo.confinementReason && basicInfo.confinementPunishments > 0) {
            fields.push({ key: 'confinementReason', label: '禁闭原因' })
        }
        return fields
    })

    // ==================== 方法 ====================

    // 添加日检察记录
    function addDailyLog(logData) {
        const log = {
            id: Date.now(),
            date: new Date().toISOString(),
            ...logData
        }
        dailyLogs.value.push(log)

        // 自动更新统计
        if (logData.threeScenes) {
            const scenesChecked = Object.values(logData.threeScenes).filter(v => v).length
            if (scenesChecked > 0) {
                lawEnforcement.threeSceneChecks++
            }
        }
        if (logData.monitorCheck?.checked) {
            security.monitorChecks += logData.monitorCheck.count || 1
        }

        saveToStorage()
    }

    // 添加周检察记录
    function addWeeklyRecord(recordData) {
        const record = {
            id: Date.now(),
            date: new Date().toISOString(),
            ...recordData
        }
        weeklyRecords.value.push(record)

        // 自动更新统计
        if (recordData.talks && recordData.talks.length > 0) {
            for (const talk of recordData.talks) {
                interviews.totalTalks++
                switch (talk.type) {
                    case 'newPrisoner':
                        interviews.newAdmissionTalks++
                        break
                    case 'release':
                        // 刑释前谈话不在报告字段中单独统计
                        break
                    case 'injury':
                        interviews.injuryTalks++
                        break
                    case 'confinement':
                        interviews.confinementTalks++
                        break
                }
            }
        }

        if (recordData.mailbox) {
            otherWork.mailboxOpens += recordData.mailbox.openCount || 0
            otherWork.lettersReceived += recordData.mailbox.receivedCount || 0
        }

        if (recordData.hospital?.keyLocationChecks) {
            lawEnforcement.keyLocationChecks += recordData.hospital.keyLocationChecks
        }

        saveToStorage()
    }

    // 添加月检察记录
    function addMonthlyRecord(recordData) {
        const record = {
            id: Date.now(),
            date: new Date().toISOString(),
            ...recordData
        }
        monthlyRecords.value.push(record)

        // 自动更新统计
        if (recordData.visit?.checked) {
            lawEnforcement.visitChecks += recordData.visit.visitCount || 1
            lawEnforcement.visitIllegalCount += recordData.visit.illegalCount || 0
        }

        if (recordData.meeting?.participated) {
            switch (recordData.meeting.meetingType) {
                case 'lifeSentence':
                    meetings.lifeSentenceReviews++
                    break
                case 'parole':
                    meetings.paroleReviews++
                    break
                case 'analysis':
                    meetings.analysisMeetings++
                    break
            }
        }

        if (recordData.punishment) {
            basicInfo.recordedPunishments = recordData.punishment.recordCount || 0
            basicInfo.confinementPunishments = recordData.punishment.confinementCount || 0
        }

        saveToStorage()
    }

    // 添加及时检察事件
    function addImmediateEvent(eventData) {
        const event = {
            id: Date.now(),
            date: new Date().toISOString(),
            ...eventData
        }
        immediateEvents.value.push(event)

        // 如果是减刑假释事件，更新相关字段
        if (eventData.type === 'paroleRequest' && eventData.paroleData) {
            lawEnforcement.paroleBatch = eventData.paroleData.batch
            lawEnforcement.paroleCount = eventData.paroleData.count
            lawEnforcement.paroleStage = eventData.paroleData.stage
        }

        saveToStorage()
    }

    // 记录上传材料
    function addUploadedMaterial(materialData) {
        uploadedMaterials.value.push({
            id: Date.now(),
            date: new Date().toISOString(),
            ...materialData
        })

        // 根据类型更新统计
        if (materialData.category === 'questionnaire') {
            interviews.questionnaireCount += materialData.count || 1
        }

        saveToStorage()
    }

    // 手动更新字段
    async function updateField(section, field, value) {
        switch (section) {
            case 'basicInfo':
                basicInfo[field] = value
                // 保存到数据库
                await saveBasicInfoToDatabase()
                break
            case 'lawEnforcement':
                lawEnforcement[field] = value
                break
            case 'security':
                security[field] = value
                break
            case 'interviews':
                interviews[field] = value
                break
            case 'meetings':
                meetings[field] = value
                break
            case 'otherWork':
                otherWork[field] = value
                break
            case 'prisonInfo':
                prisonInfo[field] = value
                break
        }
        saveToStorage()
    }

    // 保存基本信息到数据库
    async function saveBasicInfoToDatabase() {
        try {
            const token = localStorage.getItem('token')
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
            
            const response = await fetch(`${API_BASE}/api/monthly-basic-info`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    report_month: currentMonth.value,
                    total_prisoners: basicInfo.totalPrisoners,
                    major_criminals: basicInfo.majorCriminals,
                    death_sentence: basicInfo.deathSentence,
                    life_sentence: basicInfo.lifeSentence,
                    repeat_offenders: basicInfo.repeatOffenders,
                    foreign_prisoners: basicInfo.foreignPrisoners,
                    hk_macao_taiwan: basicInfo.hkMacaoTaiwan,
                    mental_illness: basicInfo.mentalIllness,
                    former_officials: basicInfo.formerOfficials,
                    former_county_level: basicInfo.formerCountyLevel,
                    falun_gong: basicInfo.falunGong,
                    drug_history: basicInfo.drugHistory,
                    drug_crimes: basicInfo.drugCrimes,
                    new_admissions: basicInfo.newAdmissions,
                    minor_females: basicInfo.minorFemales,
                    gang_related: basicInfo.gangRelated,
                    evil_forces: basicInfo.evilForces,
                    endangering_safety: basicInfo.endangeringSafety,
                    released_count: basicInfo.releasedCount,
                    recorded_punishments: basicInfo.recordedPunishments,
                    recorded_punishments_reason: basicInfo.recordedPunishmentsReason,
                    confinement_punishments: basicInfo.confinementPunishments,
                    confinement_reason: basicInfo.confinementReason
                })
            })
            
            if (!response.ok) {
                throw new Error('保存失败')
            }
            
            console.log('基本信息已保存到数据库')
        } catch (error) {
            console.error('保存基本信息到数据库失败:', error)
        }
    }

    // 批量更新基本情况（从花名册导入）
    function updateBasicInfoFromRoster(data) {
        Object.assign(basicInfo, data)
        saveToStorage()
    }

    // 更新花名册解析数据
    function updateRosterData(type, data) {
        if (type === 'admission') {
            rosterData.admission.count = data.count || 0
            rosterData.admission.parseDate = data.parseDate || new Date().toISOString()
            // 同时更新基本信息
            basicInfo.newAdmissions = data.count || 0
        } else if (type === 'release') {
            rosterData.release.count = data.count || 0
            rosterData.release.parseDate = data.parseDate || new Date().toISOString()
            // 同时更新基本信息
            basicInfo.releasedCount = data.count || 0
        } else if (type === 'special') {
            Object.assign(rosterData.special, {
                strictControl: data.strictControl || 0,
                confinement: data.confinement || 0,
                policeEquipment: data.policeEquipment || 0,
                gangRelated: data.gangRelated || 0,
                total: data.total || 0,
                parseDate: data.parseDate || new Date().toISOString()
            })
            // 同时更新基本信息
            basicInfo.gangRelated = data.gangRelated || 0
        }
        saveToStorage()
    }

    // 更新附件计数
    function updateAttachmentCount(categoryId, count) {
        const categoryMap = {
            'release-transcript': 'releaseTranscript',
            'injury-transcript': 'injuryTranscript',
            'confinement-transcript': 'confinementTranscript',
            'visit-transcript': 'visitTranscript',
            'new-prisoner-transcript': 'newPrisonerTranscript',
            'questionnaire': 'questionnaire'
        }

        const field = categoryMap[categoryId]
        if (field && attachmentCounts.hasOwnProperty(field)) {
            attachmentCounts[field] = count
        }

        // 更新总计
        attachmentCounts.total = Object.values(attachmentCounts).reduce((sum, val) => {
            return typeof val === 'number' && val !== attachmentCounts.total ? sum + val : sum
        }, 0)

        // 同步更新面谈统计
        interviews.totalTalks =
            attachmentCounts.releaseTranscript +
            attachmentCounts.injuryTranscript +
            attachmentCounts.confinementTranscript +
            attachmentCounts.newPrisonerTranscript
        interviews.injuryTalks = attachmentCounts.injuryTranscript
        interviews.confinementTalks = attachmentCounts.confinementTranscript
        interviews.newAdmissionTalks = attachmentCounts.newPrisonerTranscript
        interviews.questionnaireCount = attachmentCounts.questionnaire

        saveToStorage()
    }

    // 重置当月数据
    function resetMonthlyData() {
        // 重置所有统计数据
        Object.assign(basicInfo, {
            totalPrisoners: 0, majorCriminals: 0, deathSentence: 0, lifeSentence: 0,
            repeatOffenders: 0, foreignPrisoners: 0, hkMacaoTaiwan: 0, mentalIllness: 0,
            formerOfficials: 0, formerCountyLevel: 0, falunGong: 0, drugHistory: 0,
            drugCrimes: 0, newAdmissions: 0, minorFemales: 0, gangRelated: 0,
            evilForces: 0, endangeringSafety: 0, releasedCount: 0,
            recordedPunishments: 0, recordedPunishmentsReason: '',
            confinementPunishments: 0, confinementReason: ''
        })

        Object.assign(lawEnforcement, {
            paroleBatch: '', paroleCount: 0, paroleStage: '',
            admissionChecked: true, releaseChecked: true, admissionIssues: '',
            correctionNotices: 0, correctionIssues: '',
            threeSceneChecks: 0, keyLocationChecks: 0, visitChecks: 0, visitIllegalCount: 0
        })

        Object.assign(security, { monitorChecks: 0, issuesFound: 0 })

        Object.assign(interviews, {
            totalTalks: 0, newAdmissionTalks: 0, evilForcesTalks: 0,
            injuryTalks: 0, confinementTalks: 0, questionnaireCount: 0
        })

        Object.assign(meetings, {
            lifeSentenceReviews: 0, paroleReviews: 0, analysisMeetings: 0, otherActivities: ''
        })

        Object.assign(otherWork, { mailboxOpens: 0, lettersReceived: 0 })

        dailyLogs.value = []
        weeklyRecords.value = []
        monthlyRecords.value = []
        immediateEvents.value = []
        uploadedMaterials.value = []

        saveToStorage()
    }

    // 设置当前月份并重新计算统计数据
    function setCurrentMonth(month) {
        currentMonth.value = month
        // 重新计算统计数据
        recalculateStats()
        saveToStorage()
    }

    // 重新计算统计数据（从日志记录中）
    function recalculateStats() {
        // 先重置统计数据
        lawEnforcement.threeSceneChecks = 0
        lawEnforcement.keyLocationChecks = 0
        lawEnforcement.visitChecks = 0
        lawEnforcement.visitIllegalCount = 0
        security.monitorChecks = 0
        interviews.totalTalks = 0
        interviews.newAdmissionTalks = 0
        interviews.injuryTalks = 0
        interviews.confinementTalks = 0
        meetings.lifeSentenceReviews = 0
        meetings.paroleReviews = 0
        meetings.analysisMeetings = 0
        otherWork.mailboxOpens = 0
        otherWork.lettersReceived = 0

        // 从日检察记录重新计算
        for (const log of dailyLogs.value) {
            if (log.threeScenes) {
                const scenesChecked = Object.values(log.threeScenes).filter(v => v?.checked).length
                if (scenesChecked > 0) {
                    lawEnforcement.threeSceneChecks++
                }
            }
            if (log.monitorCheck?.checked) {
                security.monitorChecks += log.monitorCheck.count || 1
            }
        }

        // 从周检察记录重新计算
        for (const record of weeklyRecords.value) {
            if (record.talks && record.talks.length > 0) {
                for (const talk of record.talks) {
                    interviews.totalTalks++
                    switch (talk.type) {
                        case 'newPrisoner':
                            interviews.newAdmissionTalks++
                            break
                        case 'injury':
                            interviews.injuryTalks++
                            break
                        case 'confinement':
                            interviews.confinementTalks++
                            break
                    }
                }
            }

            if (record.mailbox) {
                otherWork.mailboxOpens += record.mailbox.openCount || 0
                otherWork.lettersReceived += record.mailbox.receivedCount || 0
            }

            if (record.hospital?.keyLocationChecks) {
                lawEnforcement.keyLocationChecks += record.hospital.keyLocationChecks
            }
        }

        // 从月检察记录重新计算
        for (const record of monthlyRecords.value) {
            if (record.visit?.checked) {
                lawEnforcement.visitChecks += record.visit.visitCount || 1
                lawEnforcement.visitIllegalCount += record.visit.illegalCount || 0
            }

            if (record.meeting?.participated) {
                switch (record.meeting.meetingType) {
                    case 'lifeSentence':
                        meetings.lifeSentenceReviews++
                        break
                    case 'parole':
                        meetings.paroleReviews++
                        break
                    case 'analysis':
                        meetings.analysisMeetings++
                        break
                }
            }

            if (record.punishment) {
                basicInfo.recordedPunishments = record.punishment.recordCount || 0
                basicInfo.confinementPunishments = record.punishment.confinementCount || 0
            }
        }

        // 从及时检察事件重新计算
        for (const event of immediateEvents.value) {
            if (event.type === 'paroleRequest' && event.paroleData) {
                lawEnforcement.paroleBatch = event.paroleData.batch
                lawEnforcement.paroleCount = event.paroleData.count
                lawEnforcement.paroleStage = event.paroleData.stage
            }
        }
    }

    // 设置信件数量（从 mail_records 表统计，不受 watch 影响）
    function setMailCount(count) {
        otherWork.lettersReceived = count
        console.log('📧 信件数量已设置:', count)
    }

    // 获取当前报告数据快照（用于导出）
    function getReportSnapshot() {
        const [year, month] = currentMonth.value.split('-')
        return {
            year,
            month,
            prisonInfo: { ...prisonInfo },
            basicInfo: { ...basicInfo },
            lawEnforcement: { ...lawEnforcement },
            security: { ...security },
            interviews: { ...interviews },
            meetings: { ...meetings },
            otherWork: { ...otherWork },
            dailyLogs: [...dailyLogs.value],
            weeklyRecords: [...weeklyRecords.value],
            monthlyRecords: [...monthlyRecords.value],
            immediateEvents: [...immediateEvents.value],
            uploadedMaterials: [...uploadedMaterials.value]
        }
    }

    // ==================== 持久化 ====================

    function saveToStorage() {
        const data = {
            currentMonth: currentMonth.value,
            prisonInfo,
            basicInfo,
            lawEnforcement,
            security,
            interviews,
            meetings,
            otherWork,
            dailyLogs: dailyLogs.value,
            weeklyRecords: weeklyRecords.value,
            monthlyRecords: monthlyRecords.value,
            immediateEvents: immediateEvents.value,
            uploadedMaterials: uploadedMaterials.value
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }

    function loadFromStorage() {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                const data = JSON.parse(stored)
                currentMonth.value = data.currentMonth || currentMonth.value
                Object.assign(prisonInfo, data.prisonInfo || {})
                Object.assign(basicInfo, data.basicInfo || {})
                Object.assign(lawEnforcement, data.lawEnforcement || {})
                Object.assign(security, data.security || {})
                Object.assign(interviews, data.interviews || {})
                Object.assign(meetings, data.meetings || {})
                Object.assign(otherWork, data.otherWork || {})
                dailyLogs.value = data.dailyLogs || []
                weeklyRecords.value = data.weeklyRecords || []
                monthlyRecords.value = data.monthlyRecords || []
                immediateEvents.value = data.immediateEvents || []
                uploadedMaterials.value = data.uploadedMaterials || []
            } catch (e) {
                console.error('加载报告数据失败:', e)
            }
        }
        
        // 强制更新监狱名称为当前登录用户的监狱
        const currentPrisonName = getUserPrisonName()
        if (currentPrisonName) {
            prisonInfo.prisonName = currentPrisonName
        }
    }

    // 初始化时加载数据
    loadFromStorage()

    // 监听变化自动保存
    watch([basicInfo, lawEnforcement, security, interviews, meetings, otherWork], () => {
        saveToStorage()
    }, { deep: true })

    return {
        // 状态
        currentMonth,
        prisonInfo,
        basicInfo,
        lawEnforcement,
        security,
        interviews,
        meetings,
        otherWork,
        dailyLogs,
        weeklyRecords,
        monthlyRecords,
        immediateEvents,
        uploadedMaterials,
        rosterData,
        attachmentCounts,

        // 计算属性
        completionRate,
        pendingFields,

        // 方法
        addDailyLog,
        addWeeklyRecord,
        addMonthlyRecord,
        addImmediateEvent,
        addUploadedMaterial,
        updateField,
        updateBasicInfoFromRoster,
        updateRosterData,
        updateAttachmentCount,
        resetMonthlyData,
        setCurrentMonth,
        recalculateStats,
        setMailCount,  // 🔥 新增：设置信件数量
        saveBasicInfoToDatabase,
        getReportSnapshot,
        saveToStorage,
        loadFromStorage
    }
})
