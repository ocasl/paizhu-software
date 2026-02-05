<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Document, 
  Download, 
  Edit, 
  Check, 
  Warning,
  Folder,
  Refresh
} from '@element-plus/icons-vue'
import { useReportStore } from '../stores/report'
import { useUserStore } from '../stores/user'
import { generateMonthlyReport, getParoleStageText } from '../utils/wordExport'
import { createMonthlyArchive } from '../utils/archiveUtils'
import { clearDataByMonth } from '../utils/dataManagement'
import PrisonSelector from '../components/PrisonSelector.vue'

// 使用报告 Store
const reportStore = useReportStore()
const userStore = useUserStore()

// 监狱选择
const selectedPrison = ref('')

// 月份选择
const selectedMonth = ref('')

// 监狱变化时重新加载数据
function onPrisonChange(prison) {
  selectedPrison.value = prison
  console.log('监狱切换:', prison)
  
  // 更新报告标题中的监狱名称
  reportStore.prisonInfo.prisonName = prison
  
  if (selectedMonth.value) {
    loadMonthData()
  }
}

// 初始化当前月份
onMounted(() => {
  const now = new Date()
  selectedMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  
  // 检察官自动使用自己的监狱
  if (userStore.isOfficer) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    selectedPrison.value = user.prison_name || user.prisonName || ''
  }
  
  loadMonthData()
})

// 加载月份数据
async function loadMonthData() {
  if (!selectedMonth.value) return
  
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    // 从后端按月份加载所有检察记录
    const [year, month] = selectedMonth.value.split('-')
    const startDate = `${year}-${month}-01`
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]
    
    // ElMessage.info(`正在加载 ${year}年${month}月 的数据...`)  // 已移除提示
    
    // 构建查询参数
    const params = { startDate, endDate }
    const monthParams = { month: selectedMonth.value }
    if (selectedPrison.value) {
      params.prison_name = selectedPrison.value
      monthParams.prison_name = selectedPrison.value
    }
    
    // 并行加载所有数据
    const promises = [
      fetch(`${API_BASE}/api/daily-logs?${new URLSearchParams(params).toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API_BASE}/api/weekly-records?${new URLSearchParams(monthParams).toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API_BASE}/api/monthly-records?${new URLSearchParams(monthParams).toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API_BASE}/api/immediate-events?${new URLSearchParams(monthParams).toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]
    
    // 只有选择了监狱才加载基本信息和信件统计
    if (selectedPrison.value) {
      promises.push(
        fetch(`${API_BASE}/api/monthly-basic-info/${selectedMonth.value}?prison_name=${selectedPrison.value}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/api/template-sync/mail-stats/${selectedMonth.value}?prison_name=${selectedPrison.value}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      )
    }
    
    const responses = await Promise.all(promises)
    const [dailyRes, weeklyRes, monthlyRes, immediateRes, basicInfoRes, mailStatsRes] = responses
    
    // 检查响应状态（允许基本信息为空或404）
    if (dailyRes.ok && weeklyRes.ok && monthlyRes.ok && immediateRes.ok && (!basicInfoRes || basicInfoRes.ok || basicInfoRes.status === 404)) {
      const dailyData = await dailyRes.json()
      const weeklyData = await weeklyRes.json()
      const monthlyData = await monthlyRes.json()
      const immediateData = await immediateRes.json()
      
      // 检查是否需要选择监狱
      if (dailyData.needSelectPrison || weeklyData.needSelectPrison || monthlyData.needSelectPrison || immediateData.needSelectPrison) {
        ElMessage.warning('请选择要查看的监狱')
        reportStore.dailyLogs = []
        reportStore.weeklyRecords = []
        reportStore.monthlyRecords = []
        reportStore.immediateEvents = []
        return
      }
      
      // 处理基本信息（可能是404或undefined）
      let basicInfoData = null
      if (basicInfoRes) {
        if (basicInfoRes.ok) {
          basicInfoData = await basicInfoRes.json()
        } else if (basicInfoRes.status === 404) {
          // 该月份没有数据，创建空记录
          console.log(`${selectedMonth.value} 月份没有基本信息数据，将显示为空`)
          basicInfoData = { success: true, data: null }
        } else {
          throw new Error('获取基本信息失败')
        }
      } else {
        // 没有选择监狱，不加载基本信息
        basicInfoData = { success: true, data: null }
      }
      
      console.log('加载的数据:', {
        daily: dailyData.data?.length || 0,
        weekly: weeklyData.data?.length || 0,
        monthly: monthlyData.data?.length || 0,
        immediate: immediateData.data?.length || 0,
        basicInfo: basicInfoData.data ? '有数据' : '无数据'
      })
      
      console.log('基本信息详情:', basicInfoData.data)
      
      // 处理信件统计（如果有）
      let mailStatsData = null
      if (mailStatsRes) {
        if (mailStatsRes.ok) {
          mailStatsData = await mailStatsRes.json()
          console.log('信件统计:', mailStatsData.data)
        }
      }
      
      // 更新 reportStore
      reportStore.dailyLogs = dailyData.data || []
      reportStore.weeklyRecords = weeklyData.data || []
      reportStore.monthlyRecords = monthlyData.data || []
      reportStore.immediateEvents = immediateData.data || []
      
      // 🔥 使用专门的方法设置信件数量，避免被 watch 覆盖
      if (mailStatsData && mailStatsData.data) {
        // 先等待 watch 执行完
        await new Promise(resolve => setTimeout(resolve, 100))
        // 使用专门的方法设置
        reportStore.setMailCount(mailStatsData.data.mailCount || 0)
      }
      
      // 更新基本信息（如果有数据）
      if (basicInfoData.data) {
        const info = basicInfoData.data
        console.log('准备更新 basicInfo，total_prisoners =', info.total_prisoners)
        Object.assign(reportStore.basicInfo, {
          totalPrisoners: info.total_prisoners || 0,
          majorCriminals: info.major_criminals || 0,
          deathSentence: info.death_sentence || 0,
          lifeSentence: info.life_sentence || 0,
          repeatOffenders: info.repeat_offenders || 0,
          foreignPrisoners: info.foreign_prisoners || 0,
          hkMacaoTaiwan: info.hk_macao_taiwan || 0,
          mentalIllness: info.mental_illness || 0,
          formerOfficials: info.former_officials || 0,
          formerCountyLevel: info.former_county_level || 0,
          falunGong: info.falun_gong || 0,
          drugHistory: info.drug_history || 0,
          drugCrimes: info.drug_crimes || 0,
          newAdmissions: info.new_admissions || 0,
          minorFemales: info.minor_females || 0,
          gangRelated: info.gang_related || 0,
          evilForces: info.evil_forces || 0,
          endangeringSafety: info.endangering_safety || 0,
          releasedCount: info.released_count || 0,
          recordedPunishments: info.recorded_punishments || 0,
          recordedPunishmentsReason: info.recorded_punishments_reason || '',
          confinementPunishments: info.confinement_punishments || 0,
          confinementReason: info.confinement_reason || '',
          lettersReceived: info.letters_received || 0  // 🔥 从数据库读取信件数量
        })
        console.log('basicInfo 已更新，totalPrisoners =', reportStore.basicInfo.totalPrisoners)
      } else {
        // 没有数据，重置为0
        Object.assign(reportStore.basicInfo, {
          totalPrisoners: 0,
          majorCriminals: 0,
          deathSentence: 0,
          lifeSentence: 0,
          repeatOffenders: 0,
          foreignPrisoners: 0,
          hkMacaoTaiwan: 0,
          mentalIllness: 0,
          formerOfficials: 0,
          formerCountyLevel: 0,
          falunGong: 0,
          drugHistory: 0,
          drugCrimes: 0,
          newAdmissions: 0,
          minorFemales: 0,
          gangRelated: 0,
          evilForces: 0,
          endangeringSafety: 0,
          releasedCount: 0,
          recordedPunishments: 0,
          recordedPunishmentsReason: '',
          confinementPunishments: 0,
          confinementReason: ''
        })
      }
      
      // 更新reportStore的当前月份
      if (reportStore.setCurrentMonth) {
        reportStore.setCurrentMonth(selectedMonth.value)
      }
      
      // ElMessage.success(`已加载 ${year}年${month}月 的数据 (日:${dailyData.data?.length || 0}, 周:${weeklyData.data?.length || 0}, 月:${monthlyData.data?.length || 0}, 及时:${immediateData.data?.length || 0})`)  // 已移除提示
    } else {
      throw new Error('加载数据失败')
    }
  } catch (error) {
    console.error('加载月份数据失败:', error)
    ElMessage.error('加载数据失败: ' + error.message)
  }
}

// 当前月份显示
const currentMonthDisplay = computed(() => {
  if (!selectedMonth.value) return '未选择'
  const [year, month] = selectedMonth.value.split('-')
  return `${year}年${month}月`
})

// 报告状态
const reportStatus = computed(() => {
  if (reportStore.completionRate >= 100) return 'complete'
  if (reportStore.completionRate >= 50) return 'pending'
  return 'draft'
})

// 编辑模式
const isEditing = ref(false)
const originalBasicInfo = ref(null) // 保存原始数据，用于取消编辑

// 切换编辑模式
function toggleEdit() {
  if (!isEditing.value) {
    // 进入编辑模式，保存原始数据
    originalBasicInfo.value = JSON.parse(JSON.stringify(reportStore.basicInfo))
    isEditing.value = true
  } else {
    // 取消编辑，恢复原始数据
    if (originalBasicInfo.value) {
      Object.assign(reportStore.basicInfo, originalBasicInfo.value)
    }
    isEditing.value = false
    originalBasicInfo.value = null
  }
}

// 保存基本信息到数据库
async function saveBasicInfo() {
  if (!selectedMonth.value) {
    ElMessage.warning('请先选择月份')
    return
  }
  
  if (!selectedPrison.value) {
    ElMessage.warning('请先选择监狱')
    return
  }
  
  try {
    console.log('=== 开始保存基本信息 ===')
    console.log('监狱:', selectedPrison.value)
    console.log('月份:', selectedMonth.value)
    
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    const requestBody = {
      report_month: selectedMonth.value,
      prison_name: selectedPrison.value,
      // 罪犯构成（19个）
      total_prisoners: reportStore.basicInfo.totalPrisoners,
      major_criminals: reportStore.basicInfo.majorCriminals,
      death_sentence: reportStore.basicInfo.deathSentence,
      life_sentence: reportStore.basicInfo.lifeSentence,
      repeat_offenders: reportStore.basicInfo.repeatOffenders,
      foreign_prisoners: reportStore.basicInfo.foreignPrisoners,
      hk_macao_taiwan: reportStore.basicInfo.hkMacaoTaiwan,
      mental_illness: reportStore.basicInfo.mentalIllness,
      former_officials: reportStore.basicInfo.formerOfficials,
      former_county_level: reportStore.basicInfo.formerCountyLevel,
      falun_gong: reportStore.basicInfo.falunGong,
      drug_history: reportStore.basicInfo.drugHistory,
      drug_crimes: reportStore.basicInfo.drugCrimes,
      new_admissions: reportStore.basicInfo.newAdmissions,
      minor_females: reportStore.basicInfo.minorFemales,
      gang_related: reportStore.basicInfo.gangRelated,
      evil_forces: reportStore.basicInfo.evilForces,
      endangering_safety: reportStore.basicInfo.endangeringSafety,
      released_count: reportStore.basicInfo.releasedCount,
      // 违纪统计（4个）
      recorded_punishments: reportStore.basicInfo.recordedPunishments,
      recorded_punishments_reason: reportStore.basicInfo.recordedPunishmentsReason,
      confinement_punishments: reportStore.basicInfo.confinementPunishments,
      confinement_reason: reportStore.basicInfo.confinementReason,
      // 信件统计（1个）
      letters_received: reportStore.basicInfo.lettersReceived,
      // 执法检察情况（9个）
      parole_batch: reportStore.lawEnforcement.paroleBatch,
      parole_count: reportStore.lawEnforcement.paroleCount,
      parole_stage: reportStore.lawEnforcement.paroleStage,
      correction_notices: reportStore.lawEnforcement.correctionNotices,
      correction_issues: reportStore.lawEnforcement.correctionIssues,
      three_scene_checks: reportStore.lawEnforcement.threeSceneChecks,
      key_location_checks: reportStore.lawEnforcement.keyLocationChecks,
      visit_checks: reportStore.lawEnforcement.visitChecks,
      visit_illegal_count: reportStore.lawEnforcement.visitIllegalCount,
      // 安全防范检察（2个）
      monitor_checks: reportStore.security.monitorChecks,
      issues_found: reportStore.security.issuesFound,
      // 个别谈话（6个）
      total_talks: reportStore.interviews.totalTalks,
      new_admission_talks: reportStore.interviews.newAdmissionTalks,
      evil_forces_talks: reportStore.interviews.evilForcesTalks,
      injury_talks: reportStore.interviews.injuryTalks,
      confinement_talks: reportStore.interviews.confinementTalks,
      questionnaire_count: reportStore.interviews.questionnaireCount,
      // 会议活动（3个）
      life_sentence_reviews: reportStore.meetings.lifeSentenceReviews,
      analysis_meetings: reportStore.meetings.analysisMeetings,
      other_activities: reportStore.meetings.otherActivities,
      // 其他工作（1个）
      mailbox_opens: reportStore.otherWork.mailboxOpens
    }
    
    console.log('请求体:', requestBody)
    
    const response = await fetch(`${API_BASE}/api/monthly-basic-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    })
    
    console.log('响应状态:', response.status)
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('保存失败:', errorData)
      throw new Error(errorData.error || '保存失败')
    }
    
    const result = await response.json()
    console.log('保存成功:', result)
    ElMessage.success('基本信息已保存到数据库')
    isEditing.value = false
    originalBasicInfo.value = null
    console.log('=== 保存完成 ===')
  } catch (error) {
    console.error('保存基本信息失败:', error)
    ElMessage.error('保存失败: ' + error.message)
  }
}

// 下载中状态
const isDownloading = ref(false)
const isArchiving = ref(false)

// 生成报告（检查必填字段）
function generateReport() {
  if (reportStore.pendingFields.length > 0) {
    ElMessage.warning('请先补充待填写字段')
    return
  }
  ElMessage.success('报告数据已完整！可以下载或归档。')
}

// 下载 Word 报告
async function downloadReport() {
  if (!selectedMonth.value) {
    ElMessage.warning('请先选择月份')
    return
  }
  
  if (!selectedPrison.value) {
    ElMessage.warning('请先选择监狱')
    return
  }

  try {
    isDownloading.value = true
    ElMessage.info('正在生成报告...')
    
    const [year, month] = selectedMonth.value.split('-')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const token = localStorage.getItem('token')
    
    // 直接生成报告，不需要归档
    const params = new URLSearchParams({ 
      year, 
      month,
      prison_name: selectedPrison.value
    })
    
    const downloadRes = await fetch(`${API_BASE}/api/reports/generate-report?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!downloadRes.ok) {
      const errorData = await downloadRes.json()
      throw new Error(errorData.message || '生成报告失败')
    }
    
    const blob = await downloadRes.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const prisonName = selectedPrison.value || reportStore.prisonInfo?.prisonName || '监狱'
    a.download = `${prisonName}_${year}年${month}月工作报告.docx`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    ElMessage.success('报告已下载')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error(error.message || '下载失败')
  } finally {
    isDownloading.value = false
  }
}

// 一键归档
async function archiveReport() {
  try {
    await ElMessageBox.confirm(
      '将打包本月所有工作材料（报告、日志、附件）为压缩包，是否继续？',
      '一键归档',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
    )
    
    isArchiving.value = true
    const snapshot = reportStore.getReportSnapshot()
    // TODO: 从 IndexedDB 获取实际附件
    const attachments = []
    const archiveName = await createMonthlyArchive(snapshot, attachments)
    ElMessage.success(`归档完成：${archiveName}`)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('归档失败:', error)
      ElMessage.error('归档失败: ' + error.message)
    }
  } finally {
    isArchiving.value = false
  }
}

// 重置月度数据
async function resetData() {
  if (!selectedMonth.value) {
    ElMessage.warning('请先选择月份')
    return
  }
  
  if (!selectedPrison.value) {
    ElMessage.warning('请先选择监狱')
    return
  }
  
  const prisonInfo = selectedPrison.value ? `${selectedPrison.value}的` : ''
  
  try {
    await ElMessageBox.confirm(
      `此操作将清空${prisonInfo}${selectedMonth.value}的所有检察数据，是否继续？`,
      '警告',
      { confirmButtonText: '确定清空', cancelButtonText: '取消', type: 'warning' }
    )
    
    // 调用后端API清空数据
    const [year, month] = selectedMonth.value.split('-')
    await clearDataByMonth(parseInt(year), parseInt(month), selectedPrison.value)
    
    // 清空前端store
    reportStore.resetMonthlyData()
    
    ElMessage.success(`${prisonInfo}${selectedMonth.value}的数据已重置`)
    
    // 重新加载数据
    await loadMonthData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重置失败: ' + error.message)
    }
  }
}

// 更新字段值
function updateField(section, field, value) {
  reportStore.updateField(section, field, value)
}

// 减刑阶段选项
const paroleStageOptions = [
  { value: 'review', label: '审查阶段' },
  { value: 'publicize', label: '公示阶段' },
  { value: 'submitted', label: '提交阶段' },
  { value: 'approved', label: '审批阶段' }
]
</script>

<template>
  <div class="report-preview-page">
    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="report-status">
        <!-- 监狱选择器 -->
        <PrisonSelector 
          v-model="selectedPrison" 
          @change="onPrisonChange"
          style="margin-right: 12px;"
        />
        
        <!-- 月份选择器 -->
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          placeholder="选择月份"
          format="YYYY年MM月"
          value-format="YYYY-MM"
          @change="loadMonthData"
          style="width: 180px; margin-right: 12px;"
        />
        <el-tag 
          :type="reportStatus === 'complete' ? 'success' : reportStatus === 'pending' ? 'warning' : 'info'" 
          size="large"
        >
          {{ reportStatus === 'complete' ? '已完成' : reportStatus === 'pending' ? '进行中' : '草稿' }}
        </el-tag>
        <h2>{{ currentMonthDisplay }} 月度工作情况报告</h2>
        <el-progress 
          :percentage="reportStore.completionRate" 
          :stroke-width="8"
          :color="reportStore.completionRate >= 80 ? '#67C23A' : '#E6A23C'"
          style="width: 120px; margin-left: 12px;"
        />
      </div>
      
      <div class="action-buttons">
        <el-button :icon="Refresh" @click="loadMonthData" title="重新加载数据">刷新</el-button>
        <el-button :icon="Edit" @click="toggleEdit">
          {{ isEditing ? '取消编辑' : '编辑数据' }}
        </el-button>
        <el-button v-if="isEditing" type="primary" @click="saveBasicInfo">
          💾 保存编辑
        </el-button>
        <el-button type="primary" :icon="Check" @click="generateReport">检查完整性</el-button>
        <el-button 
          type="success" 
          :icon="Download" 
          :loading="isDownloading"
          @click="downloadReport"
        >
          下载 Word
        </el-button>
        <el-button 
          :icon="Folder" 
          :loading="isArchiving"
          @click="archiveReport"
        >
          一键归档
        </el-button>
        <el-button :icon="Refresh" type="danger" plain @click="resetData">重置</el-button>
      </div>
    </div>

    <!-- 待补充提示 -->
    <el-alert
      v-if="reportStore.pendingFields.length > 0"
      type="warning"
      show-icon
      :closable="false"
      class="pending-alert"
    >
      <template #title>
        <span>有 {{ reportStore.pendingFields.length }} 个字段待补充：</span>
        <el-tag v-for="field in reportStore.pendingFields" :key="field.key" type="warning" size="small" class="pending-tag">
          {{ field.label }}
        </el-tag>
      </template>
    </el-alert>

    <!-- 派驻信息编辑 -->
    <el-card v-if="isEditing" class="prison-info-card" shadow="hover">
      <template #header>
        <span>派驻信息设置</span>
      </template>
      <el-form :model="reportStore.prisonInfo" label-width="100px" inline>
        <el-form-item label="监狱名称">
          <el-input 
            v-model="reportStore.prisonInfo.prisonName" 
            placeholder="监狱名称"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="检察室名称">
          <el-input 
            v-model="reportStore.prisonInfo.roomName" 
            placeholder="可选"
            style="width: 200px"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 报告预览 -->
    <el-card class="report-card">
      <div class="report-content">
        <h1 class="report-title">派驻{{ reportStore.prisonInfo.prisonName || '监狱' }}检察室月度工作情况报告</h1>
        <p class="report-period">（{{ currentMonthDisplay }}）</p>

        <!-- 一、基本情况 -->
        <section class="report-section">
          <h2>一、本月基本情况</h2>
          
          <div class="data-grid">
            <div class="data-item">
              <span class="label">在押罪犯总数</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.totalPrisoners" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.totalPrisoners }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">重大刑事犯</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.majorCriminals" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.majorCriminals }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">死缓犯</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.deathSentence" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.deathSentence }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">无期犯</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.lifeSentence" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.lifeSentence }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">二次以上判刑</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.repeatOffenders" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.repeatOffenders }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">外籍犯</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.foreignPrisoners" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.foreignPrisoners }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">港澳台</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.hkMacaoTaiwan" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.hkMacaoTaiwan }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">精神病犯</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.mentalIllness" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.mentalIllness }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">原地厅以上</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.formerOfficials" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.formerOfficials }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">原县团级以上</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.formerCountyLevel" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.formerCountyLevel }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">涉黑罪犯</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.gangRelated" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.gangRelated }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">涉恶罪犯</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.evilForces" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.evilForces }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">新收押罪犯</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.newAdmissions" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.newAdmissions }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">刑满释放</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.releasedCount" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.releasedCount }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">涉毒犯</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.drugCrimes" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.drugCrimes }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">有吸毒史</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.drugHistory" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.drugHistory }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">法轮功</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.falunGong" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.falunGong }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">未成年女犯</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.minorFemales" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.minorFemales }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">危安罪犯</span>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.endangeringSafety" :min="0" size="small" />
              <span v-else class="value">{{ reportStore.basicInfo.endangeringSafety }} 人</span>
            </div>
          </div>
          
          <div class="punishment-section">
            <p>
              <strong>记过处分：</strong>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.recordedPunishments" :min="0" size="small" style="width: 80px" />
              <span v-else>{{ reportStore.basicInfo.recordedPunishments }}</span> 人，
              原因：
              <el-input v-if="isEditing" v-model="reportStore.basicInfo.recordedPunishmentsReason" placeholder="填写原因" style="width: 200px" size="small" />
              <span v-else>{{ reportStore.basicInfo.recordedPunishmentsReason || '***' }}</span>
            </p>
            <p>
              <strong>禁闭处分：</strong>
              <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.confinementPunishments" :min="0" size="small" style="width: 80px" />
              <span v-else>{{ reportStore.basicInfo.confinementPunishments }}</span> 人，
              原因：
              <el-input v-if="isEditing" v-model="reportStore.basicInfo.confinementReason" placeholder="填写原因" style="width: 200px" size="small" />
              <span v-else>{{ reportStore.basicInfo.confinementReason || '***' }}</span>
            </p>
          </div>
        </section>

        <!-- 二、执法检察 -->
        <section class="report-section">
          <h2>二、执法检察情况</h2>
          
          <h3>（一）减、假、暂检察</h3>
          <p>
            办理{{ reportStore.prisonInfo.prisonName || '***' }}监狱第
            <el-input v-if="isEditing" v-model="reportStore.lawEnforcement.paroleBatch" placeholder="批次" style="width: 100px" size="small" />
            <strong v-else>{{ reportStore.lawEnforcement.paroleBatch || '***' }}</strong>
            批次减刑审查案件
            <el-input-number v-if="isEditing" v-model="reportStore.lawEnforcement.paroleCount" :min="0" size="small" style="width: 80px" />
            <strong v-else>{{ reportStore.lawEnforcement.paroleCount }}</strong>
            件，已完成第
            <el-select v-if="isEditing" v-model="reportStore.lawEnforcement.paroleStage" placeholder="阶段" size="small" style="width: 120px">
              <el-option v-for="opt in paroleStageOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <strong v-else>{{ getParoleStageText(reportStore.lawEnforcement.paroleStage) || '***' }}</strong>
            阶段。
          </p>
          
          <h3>（二）收押释放检察</h3>
          <p>
            新收押罪犯 <strong>{{ reportStore.basicInfo.newAdmissions }}</strong> 人，
            刑满释放出监罪犯 <strong>{{ reportStore.basicInfo.releasedCount }}</strong> 人，
            经检察，未发现违法问题。
          </p>
          
          <h3>（三）监管执法检察</h3>
          <p>
            <strong>纠正违法通知书：</strong>
            <el-input-number v-if="isEditing" v-model="reportStore.lawEnforcement.correctionNotices" :min="0" size="small" style="width: 80px" />
            <span v-else>{{ reportStore.lawEnforcement.correctionNotices }}</span> 份。
            <template v-if="isEditing || reportStore.lawEnforcement.correctionIssues">
              问题描述：
              <el-input 
                v-if="isEditing" 
                v-model="reportStore.lawEnforcement.correctionIssues" 
                placeholder="填写发现的问题"
                style="width: 300px"
                size="small"
              />
              <span v-else>{{ reportStore.lawEnforcement.correctionIssues }}</span>
            </template>
            <el-tag v-else-if="reportStore.lawEnforcement.correctionNotices > 0" type="warning" size="small">待填写</el-tag>
          </p>
          <p>
            <strong>三大现场检察：</strong>
            <el-input-number v-if="isEditing" v-model="reportStore.lawEnforcement.threeSceneChecks" :min="0" size="small" style="width: 80px" />
            <span v-else>{{ reportStore.lawEnforcement.threeSceneChecks }}</span> 次
          </p>
          <p>
            <strong>重点场所检察：</strong>
            <el-input-number v-if="isEditing" v-model="reportStore.lawEnforcement.keyLocationChecks" :min="0" size="small" style="width: 80px" />
            <span v-else>{{ reportStore.lawEnforcement.keyLocationChecks }}</span> 次
          </p>
          <p>
            <strong>会见检察：</strong>
            <el-input-number v-if="isEditing" v-model="reportStore.lawEnforcement.visitChecks" :min="0" size="small" style="width: 80px" />
            <span v-else>{{ reportStore.lawEnforcement.visitChecks }}</span> 次，
            发现违法问题
            <el-input-number v-if="isEditing" v-model="reportStore.lawEnforcement.visitIllegalCount" :min="0" size="small" style="width: 80px" />
            <span v-else>{{ reportStore.lawEnforcement.visitIllegalCount }}</span> 个
          </p>
        </section>

        <!-- 三、安全防范 -->
        <section class="report-section">
          <h2>三、安全防范检察</h2>
          <p>
            <strong>监控检察：</strong>
            <el-input-number v-if="isEditing" v-model="reportStore.security.monitorChecks" :min="0" size="small" style="width: 80px" />
            <span v-else>{{ reportStore.security.monitorChecks }}</span> 次，
            发现问题
            <el-input-number v-if="isEditing" v-model="reportStore.security.issuesFound" :min="0" size="small" style="width: 80px" />
            <span v-else>{{ reportStore.security.issuesFound }}</span> 个
          </p>
        </section>

        <!-- 四、个别谈话 -->
        <section class="report-section">
          <h2>四、开展个别罪犯谈话情况</h2>
          <p>
            <strong>个别教育谈话总数：</strong>
            <el-input-number v-if="isEditing" v-model="reportStore.interviews.totalTalks" :min="0" size="small" style="width: 80px" />
            <span v-else>{{ reportStore.interviews.totalTalks }}</span> 人次
          </p>
          <ul class="talk-breakdown">
            <li>新收押罪犯谈话：
              <el-input-number v-if="isEditing" v-model="reportStore.interviews.newAdmissionTalks" :min="0" size="small" style="width: 80px" />
              <span v-else>{{ reportStore.interviews.newAdmissionTalks }}</span> 人
            </li>
            <li>涉恶罪犯谈话：
              <el-input-number v-if="isEditing" v-model="reportStore.interviews.evilForcesTalks" :min="0" size="small" style="width: 80px" />
              <span v-else>{{ reportStore.interviews.evilForcesTalks }}</span> 人
            </li>
            <li>外伤罪犯谈话：
              <el-input-number v-if="isEditing" v-model="reportStore.interviews.injuryTalks" :min="0" size="small" style="width: 80px" />
              <span v-else>{{ reportStore.interviews.injuryTalks }}</span> 人
            </li>
            <li>禁闭罪犯谈话：
              <el-input-number v-if="isEditing" v-model="reportStore.interviews.confinementTalks" :min="0" size="small" style="width: 80px" />
              <span v-else>{{ reportStore.interviews.confinementTalks }}</span> 人
            </li>
          </ul>
          <p>
            <strong>出监问卷调查表：</strong>
            <el-input-number v-if="isEditing" v-model="reportStore.interviews.questionnaireCount" :min="0" size="small" style="width: 80px" />
            <span v-else>{{ reportStore.interviews.questionnaireCount }}</span> 份
          </p>
        </section>

        <!-- 五、会议活动 -->
        <section class="report-section">
          <h2>五、参加监狱各类会议、活动</h2>
          <p>1. 参加无期死缓、提级减刑案件罪犯评审会：
            <el-input-number v-if="isEditing" v-model="reportStore.meetings.lifeSentenceReviews" :min="0" size="small" style="width: 80px" />
            <span v-else>{{ reportStore.meetings.lifeSentenceReviews }}</span> 次
          </p>
          <p>2. 参加第 {{ reportStore.lawEnforcement.paroleBatch || '***' }} 批次减刑假释案件评审会</p>
          <p>3. 参加监狱犯情分析会：
            <el-input-number v-if="isEditing" v-model="reportStore.meetings.analysisMeetings" :min="0" size="small" style="width: 80px" />
            <span v-else>{{ reportStore.meetings.analysisMeetings }}</span> 次
          </p>
          <p>
            4. 参加监狱开展的
            <el-input v-if="isEditing" v-model="reportStore.meetings.otherActivities" placeholder="填写活动名称" style="width: 200px" size="small" />
            <span v-else-if="reportStore.meetings.otherActivities">{{ reportStore.meetings.otherActivities }}</span>
            <el-tag v-else type="warning" size="small">待填写</el-tag>
            活动
          </p>
        </section>

        <!-- 六、其他工作 -->
        <section class="report-section">
          <h2>六、其他工作情况</h2>
          <p>开启检察官信箱：
            <el-input-number v-if="isEditing" v-model="reportStore.otherWork.mailboxOpens" :min="0" size="small" style="width: 80px" />
            <span v-else>{{ reportStore.otherWork.mailboxOpens }}</span> 次
          </p>
          <p>收到信件：
            <el-input-number v-if="isEditing" v-model="reportStore.basicInfo.lettersReceived" :min="0" size="small" style="width: 80px" />
            <span v-else>{{ reportStore.basicInfo.lettersReceived }}</span> 封
          </p>
        </section>

        <!-- 落款 -->
        <div class="report-footer">
          <p>驻{{ reportStore.prisonInfo.prisonName || '***' }}监狱检察室</p>
          <p>{{ currentMonthDisplay }}</p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.report-preview-page {
  max-width: 1000px;
  margin: 0 auto;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.report-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.report-status h2 {
  margin: 0;
  font-size: 20px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pending-alert {
  margin-bottom: 24px;
}

.pending-tag {
  margin-left: 8px;
}

.prison-info-card {
  margin-bottom: 24px;
  border-radius: 12px;
}

.report-card {
  border-radius: 12px;
}

.report-content {
  padding: 24px;
  font-size: 15px;
  line-height: 1.8;
}

.report-title {
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.report-period {
  text-align: center;
  color: #909399;
  margin-bottom: 32px;
}

.report-section {
  margin-bottom: 32px;
}

.report-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  border-bottom: 2px solid #667eea;
  padding-bottom: 8px;
  margin-bottom: 16px;
}

.report-section h3 {
  font-size: 15px;
  font-weight: 600;
  color: #606266;
  margin: 16px 0 8px;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.data-item .label {
  color: #606266;
}

.data-item .value {
  font-weight: 600;
  color: #303133;
}

.punishment-section {
  background: #FDF6EC;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #E6A23C;
}

.talk-breakdown {
  padding-left: 24px;
  margin: 8px 0;
}

.talk-breakdown li {
  margin: 4px 0;
}

.report-footer {
  text-align: right;
  margin-top: 48px;
  color: #606266;
}

.report-footer p {
  margin: 4px 0;
}

/* 打印样式 */
@media print {
  .action-bar,
  .pending-alert,
  .prison-info-card {
    display: none;
  }
  
  .report-card {
    box-shadow: none;
    border: none;
  }
}

/* 平板适配 */
@media (max-width: 1024px) {
  .action-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .data-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
