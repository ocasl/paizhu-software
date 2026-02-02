<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useReportStore } from '../stores/report'
import { useUserStore } from '../stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Calendar, Timer, Warning, Edit, Check } from '@element-plus/icons-vue'
import { clearAllData, clearDataByMonth } from '../utils/dataManagement'
import PrisonSelector from '../components/PrisonSelector.vue'

const reportStore = useReportStore()
const userStore = useUserStore()

// 监狱选择
const selectedPrison = ref('')

// 月份选择
const currentMonth = ref('')
const yearOptions = computed(() => {
  const years = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y >= currentYear - 3; y--) {
    years.push(y)
  }
  return years
})
const monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

// 监狱变化时重新加载数据
function onPrisonChange(prison) {
  console.log('=== 监狱切换开始 ===')
  console.log('旧监狱:', selectedPrison.value)
  console.log('新监狱:', prison)
  selectedPrison.value = prison
  
  if (currentMonth.value) {
    console.log('当前月份:', currentMonth.value, '开始加载数据...')
    loadChecklistData()
  } else {
    console.log('警告：未选择月份，不加载数据')
  }
  console.log('=== 监狱切换结束 ===')
}

// 加载清单数据
async function loadChecklistData() {
  if (!currentMonth.value) return
  
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    // 从后端按月份加载所有检察记录
    const [year, month] = currentMonth.value.split('-')
    const startDate = `${year}-${month}-01`
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]
    
    console.log(`正在加载 ${year}年${month}月 的清单数据...`)
    console.log('选择的监狱:', selectedPrison.value)
    
    // 构建查询参数
    const params = { startDate, endDate }
    const monthParams = { month: currentMonth.value }
    if (selectedPrison.value) {
      params.prison_name = selectedPrison.value
      monthParams.prison_name = selectedPrison.value
      console.log('查询参数包含监狱:', selectedPrison.value)
    } else {
      console.log('警告：未选择监狱，可能加载所有数据')
    }
    
    // 并行加载所有数据（包括基本信息）
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
    
    // 只有选择了监狱才加载基本信息
    if (selectedPrison.value) {
      promises.push(
        fetch(`${API_BASE}/api/monthly-basic-info/${currentMonth.value}?prison_name=${selectedPrison.value}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      )
    }
    
    const responses = await Promise.all(promises)
    const [dailyRes, weeklyRes, monthlyRes, immediateRes, basicInfoRes] = responses
    
    // 检查响应状态（允许基本信息为空）
    if (dailyRes.ok && weeklyRes.ok && monthlyRes.ok && immediateRes.ok && (!basicInfoRes || basicInfoRes.ok)) {
      const dailyData = await dailyRes.json()
      const weeklyData = await weeklyRes.json()
      const monthlyData = await monthlyRes.json()
      const immediateData = await immediateRes.json()
      const basicInfoData = basicInfoRes ? await basicInfoRes.json() : { data: null }
      
      // 检查是否需要选择监狱
      if (dailyData.needSelectPrison || weeklyData.needSelectPrison || monthlyData.needSelectPrison || immediateData.needSelectPrison) {
        ElMessage.warning('请选择要查看的监狱')
        reportStore.dailyLogs = []
        reportStore.weeklyRecords = []
        reportStore.monthlyRecords = []
        reportStore.immediateEvents = []
        return
      }
      
      console.log('加载的数据:', {
        daily: dailyData.data?.length || 0,
        weekly: weeklyData.data?.length || 0,
        monthly: monthlyData.data?.length || 0,
        immediate: immediateData.data?.length || 0,
        basicInfo: basicInfoData.data ? '有数据' : '无数据'
      })
      
      // 更新 reportStore
      console.log('=== 开始更新 reportStore ===')
      reportStore.dailyLogs = dailyData.data || []
      reportStore.weeklyRecords = weeklyData.data || []
      reportStore.monthlyRecords = monthlyData.data || []
      reportStore.immediateEvents = immediateData.data || []
      console.log('reportStore 已更新:', {
        daily: reportStore.dailyLogs.length,
        weekly: reportStore.weeklyRecords.length,
        monthly: reportStore.monthlyRecords.length,
        immediate: reportStore.immediateEvents.length
      })
      
      // 更新基本信息（如果有数据）
      if (basicInfoData.data) {
        const info = basicInfoData.data
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
          confinementReason: info.confinement_reason || ''
        })
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
        reportStore.setCurrentMonth(currentMonth.value)
      }
      
      // 重新同步清单数据
      console.log('=== 准备同步清单数据 ===')
      syncFromStore()
      console.log('=== 清单同步调用完成 ===')
      
      ElMessage.success(`已加载 ${year}年${month}月 的数据 (日:${dailyData.data?.length || 0}, 周:${weeklyData.data?.length || 0}, 月:${monthlyData.data?.length || 0}, 及时:${immediateData.data?.length || 0})`)
    } else {
      throw new Error('加载数据失败')
    }
  } catch (error) {
    console.error('加载清单数据失败:', error)
    ElMessage.error('加载数据失败: ' + error.message)
  }
}

// 16项标准报告事项配置
const checklistItems = [
  {
    id: 1,
    name: '监狱发生罪犯脱逃、自伤自残、自杀死亡、重大疫情、重大生产安全事故的情况报告',
    frequency: '及时',
    source: 'immediate',
    eventType: 'emergency',
    content: '',
    situation: '',
    checkTime: ''
  },
  {
    id: 2,
    name: '罪犯死亡事件调查及处理报告',
    frequency: '及时',
    source: 'immediate',
    eventType: 'death',
    content: '',
    situation: '',
    checkTime: ''
  },
  {
    id: 3,
    name: '监狱开展重大监管改造业务活动的情况报告',
    frequency: '及时',
    source: 'immediate',
    eventType: 'majorActivity',
    content: '',
    situation: '',
    checkTime: ''
  },
  {
    id: 4,
    name: '监狱民警受到党纪行政处罚情况',
    frequency: '及时',
    source: 'immediate',
    eventType: 'policePunishment',
    content: '',
    situation: '',
    checkTime: ''
  },
  {
    id: 5,
    name: '日常检察中要求监管单位大范围整改或调整的工作建议',
    frequency: '及时',
    source: 'immediate',
    eventType: 'rectification',
    content: '',
    situation: '',
    checkTime: ''
  },
  {
    id: 6,
    name: '监狱提请罪犯减刑、假释、暂予监外执行花名册',
    frequency: '每批次',
    source: 'immediate',
    eventType: 'paroleRequest',
    content: '',
    situation: '',
    checkTime: ''
  },
  {
    id: 7,
    name: '抽查重点时段、重点环节监控录像发现的情况',
    frequency: '每日',
    source: 'daily',
    eventType: 'monitorCheck',
    content: '',
    situation: '',
    checkTime: ''
  },
  {
    id: 8,
    name: '对监狱医院禁闭室检察情况，重点查看警械使用、严管禁闭适用情况',
    frequency: '每周',
    source: 'weekly',
    eventType: 'hospital',
    content: '',
    situation: '',
    checkTime: ''
  },
  {
    id: 9,
    name: '对监狱医院检察情况，重点排查有无外伤情况',
    frequency: '每周',
    source: 'weekly',
    eventType: 'injury',
    content: '',
    situation: '',
    checkTime: ''
  },
  {
    id: 10,
    name: '对刑释前罪犯和新入监罪犯谈话情况',
    frequency: '每周',
    source: 'weekly',
    eventType: 'talks',
    content: '',
    situation: '',
    checkTime: ''
  },
  {
    id: 11,
    name: '开启检察官信箱或检察中发现具有价值的案件线索',
    frequency: '每周',
    source: 'weekly',
    eventType: 'mailbox',
    content: '',
    situation: '',
    checkTime: ''
  },
  {
    id: 12,
    name: '检查发现罪犯私藏使用违禁品的情况',
    frequency: '每周',
    source: 'weekly',
    eventType: 'contraband',
    content: '',
    situation: '',
    checkTime: ''
  },
  {
    id: 13,
    name: '对监狱会见场所检察情况',
    frequency: '每月',
    source: 'monthly',
    eventType: 'visit',
    content: '',
    situation: '',
    checkTime: ''
  },
  {
    id: 14,
    name: '参加监狱犯情分析会情况',
    frequency: '每月',
    source: 'monthly',
    eventType: 'meeting',
    content: '',
    situation: '',
    checkTime: ''
  },
  {
    id: 15,
    name: '对罪犯计分考核、立功奖惩等活动监督情况',
    frequency: '每月',
    source: 'monthly',
    eventType: 'scoring',
    content: '',
    situation: '',
    checkTime: ''
  },
  {
    id: 16,
    name: '狱内勤杂岗位和辅助生产岗位罪犯每月增减情况',
    frequency: '每月',
    source: 'monthly',
    eventType: 'staffing',
    content: '',
    situation: '',
    checkTime: ''
  }
]

// 清单数据（响应式）
const checklist = ref([])

// 当前编辑的项目
const editingItem = ref(null)
const editDialog = ref(false)
const editForm = reactive({
  content: '',
  situation: ''
})

// 加载配置的派驻监所
const prisonName = ref('')

// 组件挂载时初始化
onMounted(() => {
  const now = new Date()
  currentMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  
  // 检察官自动使用自己的监狱
  if (userStore.isOfficer) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    selectedPrison.value = user.prison_name || user.prisonName || ''
  }
  
  loadSettings()
  initChecklist()
  syncFromStore()
  loadChecklistData()
})

// 加载设置
function loadSettings() {
  // 从用户信息中获取监狱名称
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      prisonName.value = user.prison_name || user.prisonName || ''
    } catch (e) {
      console.error('加载用户信息失败:', e)
    }
  }
  
  // 如果没有用户信息，尝试从旧的设置中加载
  if (!prisonName.value) {
    const saved = localStorage.getItem('paizhu-settings')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        prisonName.value = data.prisonName || ''
      } catch (e) {
        console.error('加载设置失败:', e)
      }
    }
  }
  
  // 设置当前月份
  const now = new Date()
  currentMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// 初始化清单（不再使用 localStorage）
function initChecklist() {
  // 使用默认配置初始化
  checklist.value = checklistItems.map(item => ({ ...item }))
}

// 从 store 同步数据（简化版本，直接使用 newChecklist）
function syncFromStore() {
  console.log('开始同步清单数据')
  
  // 创建新的清单数组
  const newChecklist = checklistItems.map(item => ({ 
    ...item,
    content: '',
    situation: '',
    checkTime: ''
  }))
  
  const dailyLogs = reportStore.dailyLogs || []
  const weeklyRecords = reportStore.weeklyRecords || []
  const monthlyRecords = reportStore.monthlyRecords || []
  const immediateEvents = reportStore.immediateEvents || []
  
  // 同步日检察 - 监控抽查
  const monitorChecks = dailyLogs.filter(log => log.monitorCheck?.checked)
  if (monitorChecks.length > 0) {
    const item = newChecklist.find(i => i.id === 7)
    if (item) {
      const totalCount = monitorChecks.reduce((sum, log) => sum + (log.monitorCheck?.count || 1), 0)
      item.content = `本月共抽查监控 ${totalCount} 次`
      item.situation = '未发现异常'
      item.checkTime = '每日'
    }
  }
  
  // 同步周检察
  if (weeklyRecords.length > 0) {
    // 8. 医院禁闭室检察
    const hospitalRecords = weeklyRecords.filter(r => r.hospital_check?.checked)
    if (hospitalRecords.length > 0) {
      const item = newChecklist.find(i => i.id === 8)
      if (item) {
        item.content = `本月检察 ${hospitalRecords.length} 次`
        item.situation = '未发现异常'
      }
    }
    
    // 10. 谈话记录
    const talkRecords = weeklyRecords.filter(r => r.talk_records && r.talk_records.length > 0)
    if (talkRecords.length > 0) {
      const item = newChecklist.find(i => i.id === 10)
      if (item) {
        const totalTalks = talkRecords.reduce((sum, r) => sum + (r.talk_records?.length || 0), 0)
        item.content = `本月谈话 ${totalTalks} 人次`
        item.situation = '已完成'
      }
    }
  }
  
  // 同步月检察
  if (monthlyRecords.length > 0) {
    // 13. 会见场所检察
    const visitRecords = monthlyRecords.filter(r => r.visit_check?.checked)
    if (visitRecords.length > 0) {
      const item = newChecklist.find(i => i.id === 13)
      if (item) {
        const totalVisits = visitRecords.reduce((sum, r) => sum + (r.visit_check?.visitCount || 0), 0)
        item.content = `本月检察 ${totalVisits} 次`
        item.situation = '未发现问题'
      }
    }
  }
  
  // 最后统一赋值，触发响应式更新
  checklist.value = newChecklist
  
  console.log('清单同步完成，有内容的项数:', checklist.value.filter(i => i.content).length)
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 打开编辑对话框
function openEdit(item) {
  editingItem.value = item
  editForm.content = item.content
  editForm.situation = item.situation
  editDialog.value = true
}

// 保存编辑
function saveEdit() {
  if (editingItem.value) {
    editingItem.value.content = editForm.content
    editingItem.value.situation = editForm.situation
    if (!editingItem.value.checkTime) {
      editingItem.value.checkTime = formatDate(new Date().toISOString())
    }
    ElMessage.success('保存成功')
  }
  editDialog.value = false
}

// 保存清单（不再使用 localStorage）
function saveChecklist() {
  console.log('清单数据已更新')
}

// 获取频率对应的标签类型
function getFrequencyType(frequency) {
  switch (frequency) {
    case '及时':
      return 'danger'
    case '每批次':
      return 'warning'
    case '每日':
      return 'success'
    case '每周':
      return 'primary'
    case '每月':
      return 'info'
    default:
      return 'info'
  }
}

// 获取填报状态
function getStatus(item) {
  if (item.content && item.checkTime) {
    return 'completed'
  } else if (item.content || item.checkTime) {
    return 'partial'
  }
  return 'empty'
}

// 下载清单Word文档
async function downloadChecklistDoc() {
  if (!currentMonth.value) {
    ElMessage.warning('请先选择月份')
    return
  }
  
  if (!selectedPrison.value) {
    ElMessage.warning('请先选择监狱')
    return
  }

  try {
    ElMessage.info('正在生成清单...')
    
    const [year, month] = currentMonth.value.split('-')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const token = localStorage.getItem('token')
    
    // 准备清单数据
    const checklistData = checklist.value.map(item => ({
      id: item.id,
      content: item.content || '',
      situation: item.situation || ''
    }))
    
    // 直接生成清单
    const downloadRes = await fetch(`${API_BASE}/api/reports/generate-checklist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        year: parseInt(year),
        month: parseInt(month),
        prison_name: selectedPrison.value,
        checklistData 
      })
    })
    
    if (!downloadRes.ok) {
      const errorData = await downloadRes.json()
      throw new Error(errorData.message || '生成清单失败')
    }
    
    const blob = await downloadRes.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedPrison.value}_${year}年${month}月事项清单.doc`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    ElMessage.success('清单已下载')
  } catch (error) {
    console.error('下载清单失败:', error)
    ElMessage.error(error.message || '下载清单失败')
  }
}

// 重置清单
function resetChecklist() {
  const prisonInfo = selectedPrison.value ? `${selectedPrison.value}的` : ''
  ElMessageBox.confirm(
    `确定要重置${prisonInfo}${currentMonth.value}月份的清单数据吗？这将清空该监狱该月的检察记录，操作不可恢复！`,
    '重置确认',
    {
      confirmButtonText: '确定重置',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      if (!selectedPrison.value) {
        ElMessage.warning('请先选择监狱')
        return
      }
      
      if (currentMonth.value) {
        const [year, month] = currentMonth.value.split('-')
        await clearDataByMonth(parseInt(year), parseInt(month), selectedPrison.value)
      } else {
        ElMessage.warning('请先选择月份')
        return
      }
      
      checklist.value = checklistItems.map(item => ({ ...item }))
      reportStore.dailyLogs = []
      reportStore.weeklyRecords = []
      reportStore.monthlyRecords = []
      reportStore.immediateEvents = []
      
      ElMessage.success(`${prisonInfo}${currentMonth.value}的清单数据已重置`)
      await loadChecklistData()
    } catch (error) {
      ElMessage.error('重置失败: ' + error.message)
    }
  }).catch(() => {})
}

</script>

<template>
  <div class="checklist-page">
    <div class="page-header">
      <div class="header-info">
        <h2>派驻检察工作报告事项清单</h2>
        <p>江西省南昌长堎地区人民检察院</p>
      </div>
      <div class="header-meta">
        <PrisonSelector 
          v-model="selectedPrison" 
          @change="onPrisonChange"
          style="margin-right: 12px;"
        />
        
        <el-date-picker
          v-model="currentMonth"
          type="month"
          placeholder="选择月份"
          format="YYYY年MM月"
          value-format="YYYY-MM"
          @change="loadChecklistData"
          style="width: 180px; margin-right: 12px;"
        />
        <el-button type="success" @click="downloadChecklistDoc">
          📥 下载Word
        </el-button>
        <el-button type="warning" @click="resetChecklist">
          🔄 重置清单
        </el-button>
        <el-tag type="info" size="large">派驻监所：{{ prisonName || '未设置' }}</el-tag>
      </div>
    </div>

    <el-card class="checklist-card">
      <el-table :data="checklist" border stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        
        <el-table-column prop="name" label="报告事项" min-width="280">
          <template #default="{ row }">
            <div class="item-name">{{ row.name }}</div>
          </template>
        </el-table-column>
        
        <el-table-column prop="frequency" label="检察时间" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getFrequencyType(row.frequency)" size="small">
              {{ row.frequency }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="content" label="报告内容" min-width="180">
          <template #default="{ row }">
            <span v-if="row.content" class="content-text">{{ row.content }}</span>
            <span v-else class="empty-hint">点击编辑填写</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="situation" label="检察情况" min-width="150">
          <template #default="{ row }">
            <span v-if="row.situation" class="content-text">{{ row.situation }}</span>
            <span v-else class="empty-hint">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="checkTime" label="记录时间" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.checkTime">{{ row.checkTime }}</span>
            <span v-else class="empty-hint">-</span>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="getStatus(row) === 'completed'" color="#67C23A" :size="20">
              <Check />
            </el-icon>
            <el-icon v-else-if="getStatus(row) === 'partial'" color="#E6A23C" :size="20">
              <Warning />
            </el-icon>
            <span v-else class="empty-status">○</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="openEdit(row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog 
      v-model="editDialog" 
      :title="editingItem ? `编辑 - ${editingItem.name.slice(0, 20)}...` : '编辑'"
      width="500px"
    >
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="报告内容">
          <el-input 
            v-model="editForm.content" 
            type="textarea" 
            :rows="3"
            placeholder="填写报告内容..."
          />
        </el-form-item>
        <el-form-item label="检察情况">
          <el-input 
            v-model="editForm.situation" 
            type="textarea" 
            :rows="2"
            placeholder="填写检察情况..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.checklist-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-info h2 {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px;
}

.header-info p {
  color: #909399;
  margin: 0;
  font-size: 14px;
}

.header-meta {
  display: flex;
  gap: 12px;
}

.checklist-card {
  border-radius: 12px;
}

.item-name {
  font-size: 13px;
  line-height: 1.5;
}

.content-text {
  font-size: 13px;
  color: #303133;
}

.empty-hint {
  font-size: 12px;
  color: #c0c4cc;
}

.empty-status {
  color: #dcdfe6;
  font-size: 16px;
}

@media (max-width: 1024px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .header-meta {
    width: 100%;
  }
}
</style>
