<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useUserStore } from '../stores/user'
import { useReportStore } from '../stores/report'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Camera, VideoCamera, List, Edit, View, Download, Printer, Calendar, Clock, Document, Folder, Picture, Files, Search, Refresh } from '@element-plus/icons-vue'
import { exportDailyLogToWord, getLogPreviewData } from '../utils/docxGenerator'
import { debounce } from '../utils/debounce'

const userStore = useUserStore()
const reportStore = useReportStore()

// 视图模式: 'form' 新建/编辑日志, 'history' 查看历史
const viewMode = ref('form')

// 当前日期
const today = new Date().toLocaleDateString('zh-CN')

// 加载配置的默认值（优先使用当前登录用户信息）
function loadDefaultSettings() {
  // 优先使用当前登录用户的信息
  if (userStore.userInfo) {
    logForm.prisonName = userStore.userInfo.prison_name || ''
    logForm.inspectorName = userStore.userInfo.name || ''
    console.log('✅ 已自动填充当前用户信息:', {
      prison: logForm.prisonName,
      inspector: logForm.inspectorName
    })
    return
  }
  
  // 如果没有用户信息，则从本地设置加载
  const saved = localStorage.getItem('paizhu-settings')
  if (saved) {
    try {
      const data = JSON.parse(saved)
      logForm.prisonName = data.prisonName || ''
      logForm.inspectorName = data.defaultInspector || ''
    } catch (e) {
      console.error('加载设置失败:', e)
    }
  }
}

// 数据校验：对比填写值与花名册解析值
function validateWithRosterData() {
  const rosterData = reportStore.rosterData
  const discrepancies = []
  
  // 检查严管禁闭人数
  if (rosterData.special.strictControl > 0 || rosterData.special.confinement > 0) {
    const rosterTotal = rosterData.special.strictControl + rosterData.special.confinement
    if (logForm.strictControl.totalCount !== rosterTotal) {
      discrepancies.push({
        field: 'strictControl.totalCount',
        label: '严管禁闭总数',
        inputValue: logForm.strictControl.totalCount,
        rosterValue: rosterTotal
      })
    }
  }
  
  // 检查警戒具人数
  if (rosterData.special.policeEquipment > 0 && logForm.policeEquipment.count !== rosterData.special.policeEquipment) {
    discrepancies.push({
      field: 'policeEquipment.count',
      label: '警戒具使用人数',
      inputValue: logForm.policeEquipment.count,
      rosterValue: rosterData.special.policeEquipment
    })
  }
  
  return discrepancies
}

// 显示差异提示并询问是否自动纠正
async function showDiscrepancyDialog(discrepancies) {
  if (discrepancies.length === 0) return true
  
  const messages = discrepancies.map(d => 
    `• ${d.label}：填写值 ${d.inputValue}，花名册值 ${d.rosterValue}`
  ).join('\n')
  
  try {
    await ElMessageBox.confirm(
      `检测到以下数据与上传的花名册不一致：\n\n${messages}\n\n是否使用花名册数据自动纠正？`,
      '数据差异提示',
      {
        confirmButtonText: '自动纠正',
        cancelButtonText: '保持原值',
        type: 'warning'
      }
    )
    
    // 用户选择自动纠正
    for (const d of discrepancies) {
      if (d.field === 'strictControl.totalCount') {
        logForm.strictControl.totalCount = d.rosterValue
      } else if (d.field === 'policeEquipment.count') {
        logForm.policeEquipment.count = d.rosterValue
      }
    }
    ElMessage.success('已使用花名册数据自动纠正')
    return true
  } catch {
    // 用户选择保持原值
    return true
  }
}


// 历史日志列表（从后端 API 获取，包含数据库 ID）
const historyLogs = ref([])
const loadingHistory = ref(false)

// 筛选条件
const historyMonth = ref('')
const filterPrisonName = ref('') // 派驻单位筛选
const filterDateRange = ref([]) // 日期范围筛选

// 监所列表（用于筛选下拉）
const prisonList = ref([])

// 批量选择
const selectedLogs = ref([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const totalLogs = ref(0)

// 获取监所列表（根据用户权限过滤）
async function fetchPrisonList() {
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    const response = await fetch(`${API_BASE}/api/admin/prisons`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      const allPrisons = result.data || []
      
      // 根据用户角色过滤监所列表
      const userRole = userStore.userInfo?.role
      const userPrison = userStore.userInfo?.prison_name
      const prisonScopes = userStore.userInfo?.prisonScopes || []
      
      if (userRole === 'inspector') {
        // 派驻检察官：只能看到自己的派驻单位
        prisonList.value = userPrison ? [userPrison] : []
      } else if (userRole === 'leader') {
        // 分管领导：只能看到分管的监狱
        prisonList.value = prisonScopes
      } else {
        // 管理员和院领导：可以看到所有监狱
        prisonList.value = allPrisons
      }
    }
  } catch (error) {
    console.error('获取监所列表失败:', error)
  }
}

// 初始化历史月份为当前月
const initHistoryMonth = () => {
  const now = new Date()
  historyMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// 从后端获取历史日志列表
async function fetchHistoryLogs(month = null) {
  loadingHistory.value = true
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    // 构建查询参数
    const params = new URLSearchParams()
    
    // 月份筛选
    if (month || historyMonth.value) {
      params.append('month', month || historyMonth.value)
    }
    
    // 日期范围筛选
    if (filterDateRange.value && filterDateRange.value.length === 2) {
      params.append('startDate', filterDateRange.value[0])
      params.append('endDate', filterDateRange.value[1])
    }
    
    // 派驻单位筛选
    if (filterPrisonName.value) {
      params.append('prison_name', filterPrisonName.value)
    }
    
    // 分页参数
    params.append('page', currentPage.value)
    params.append('pageSize', pageSize.value)
    
    const url = `${API_BASE}/api/daily-logs${params.toString() ? '?' + params.toString() : ''}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      // 后端返回 { data: [...], total: 100 } 格式
      const logs = result.data || []
      totalLogs.value = result.total || logs.length
      
      historyLogs.value = logs.map(log => ({
        id: log.id,
        date: log.log_date,
        prisonName: log.prison_name,
        inspectorName: log.inspector_name,
        threeScenes: log.three_scenes,
        strictControl: log.strict_control,
        policeEquipment: log.police_equipment,
        gangPrisoners: log.gang_prisoners,
        admission: log.admission,
        monitorCheck: log.monitor_check,
        supervisionSituation: log.supervision_situation,
        feedbackSituation: log.feedback_situation,
        otherWork: log.other_work
      })).sort((a, b) => new Date(b.date) - new Date(a.date))
    }
  } catch (error) {
    console.error('获取历史日志失败:', error)
  } finally {
    loadingHistory.value = false
  }
}

// 重置筛选条件
function resetFilters() {
  filterDateRange.value = []
  filterPrisonName.value = ''
  historyMonth.value = ''
  currentPage.value = 1
  fetchHistoryLogs()
}

// 分页改变
function handlePageChange(page) {
  currentPage.value = page
  fetchHistoryLogs()
}

// 每页数量改变
function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
  fetchHistoryLogs()
}

// 批量选择改变
function handleSelectionChange(selection) {
  selectedLogs.value = selection
}

// 批量删除
async function batchDelete() {
  if (selectedLogs.value.length === 0) {
    ElMessage.warning('请先选择要删除的日志')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedLogs.value.length} 条日志吗？此操作不可恢复！`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

    // 批量删除
    for (const log of selectedLogs.value) {
      await fetch(`${API_BASE}/api/daily-logs/${log.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    }

    ElMessage.success(`成功删除 ${selectedLogs.value.length} 条日志`)
    selectedLogs.value = []
    fetchHistoryLogs()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// 批量导出
async function batchExport() {
  if (selectedLogs.value.length === 0) {
    ElMessage.warning('请先选择要导出的日志')
    return
  }

  try {
    ElMessage.info(`正在导出 ${selectedLogs.value.length} 条日志...`)
    
    // 这里可以调用导出功能
    for (const log of selectedLogs.value) {
      await exportHistoryLog(log)
    }
    
    ElMessage.success(`成功导出 ${selectedLogs.value.length} 条日志`)
  } catch (error) {
    ElMessage.error('批量导出失败')
  }
}

// 检查是否可以编辑日志（只有创建者可以编辑）
function canEditLog(log) {
  const currentUser = userStore.userInfo
  if (!currentUser) return false
  
  // 单机版：检查是否是同一个派驻单位的检察官
  return log.inspectorName === currentUser.name || 
         log.prisonName === currentUser.prison_name
}

// 检查是否可以删除日志（只有创建者可以删除）
function canDeleteLog(log) {
  return canEditLog(log)
}

// 当前查看的日志详情
const viewingLog = ref(null)
const viewingLogAttachments = ref([])

// 查看日志详情
async function viewLogDetail(log) {
  viewingLog.value = log
  // 获取该日志的附件
  await fetchLogAttachments(log.id)
}

// 获取日志附件
async function fetchLogAttachments(logId) {
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    // 获取日志信息，提取日期
    const log = viewingLog.value
    if (!log || !log.date) {
      console.error('无法获取日志日期')
      viewingLogAttachments.value = []
      return
    }
    
    // 格式化日期：2026-01-26
    const logDate = getLocalDateString(new Date(log.date))
    
    // 根据日期查询附件
    const response = await fetch(`${API_BASE}/api/attachments/by-date/${logDate}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      viewingLogAttachments.value = result.data || []
    } else {
      viewingLogAttachments.value = []
    }
  } catch (error) {
    console.error('获取附件失败:', error)
    viewingLogAttachments.value = []
  }
}

// 判断是否为图片
function isImage(attachment) {
  return attachment.mime_type?.startsWith('image/')
}

// 判断是否为文档
function isDocument(attachment) {
  const docTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument']
  return docTypes.some(type => attachment.mime_type?.includes(type))
}

// 获取分类标签
function getCategoryLabel(category) {
  const labels = {
    'daily_log': '日检察附件',
    'weekly_hospital': '周检察-医院检察',
    'weekly_injury': '周检察-外伤检察',
    'weekly_talk': '周检察-谈话笔录',
    'weekly_contraband': '周检察-违禁品照片',
    'monthly_punishment': '月检察-处分证据'
  }
  return labels[category] || category
}

// 解析存储文件名，提取日期和类型信息
function parseStorageFileName(fileName) {
  if (!fileName) return null
  
  // 格式：20260126_weekly_injury_文件名_时间戳.jpg
  const parts = fileName.split('_')
  if (parts.length < 3) return null
  
  const dateStr = parts[0] // 20260126
  const category = parts[1] // weekly
  
  // 格式化日期：20260126 -> 2026-01-26
  const formattedDate = dateStr.length === 8 
    ? `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
    : dateStr
  
  return {
    date: formattedDate,
    category: category
  }
}

// 获取附件的显示标题
function getAttachmentTitle(attachment) {
  const parsed = parseStorageFileName(attachment.file_name)
  const categoryLabel = getCategoryLabel(attachment.category)
  
  if (parsed && parsed.date) {
    return `${parsed.date} - ${categoryLabel}`
  }
  
  return categoryLabel
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 下载附件
async function downloadAttachment(attachment) {
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    const response = await fetch(`${API_BASE}/api/attachments/${attachment.id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.original_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      ElMessage.success('下载成功')
    } else {
      throw new Error('下载失败')
    }
  } catch (error) {
    console.error('下载附件失败:', error)
    ElMessage.error('下载失败: ' + error.message)
  }
}

// 关闭详情
function closeLogDetail() {
  viewingLog.value = null
  viewingLogAttachments.value = []
}

// ==================== 编辑功能 ====================
const showEditDialog = ref(false)
const editingLog = ref(null)
const editForm = reactive({
  field1: '',  // 派驻监所
  field2: '',  // 派驻人员
  field3: '',  // 日期
  field4: '',  // 填写人
  field5: '',  // 现场检察位置
  field6: '',  // 严管新增
  field7: '',  // 警戒具人数
  field8: '',  // 收押/调出
  field9: '',  // 检察监督情况
  field10: '', // 采纳反馈情况
  field11: '', // 其他监督情况
  field12: ''  // 其他反馈情况
})

// 打开编辑弹窗
function openEditDialog(log) {
  editingLog.value = log
  // 填充表单数据
  editForm.field1 = log.prisonName || ''
  editForm.field2 = log.inspectorName || ''
  editForm.field3 = log.date ? formatDate(log.date) : ''
  editForm.field4 = log.inspectorName || ''  // 填写人默认同派驻人员
  editForm.field5 = formatSceneLocationsForEdit(log.threeScenes)
  editForm.field6 = String((log.strictControl?.newCount || 0) + (log.strictControl?.confinementNew || 0))
  editForm.field7 = String(log.policeEquipment?.count || 0)
  editForm.field8 = `入:${log.admission?.inCount || 0}/出:${log.admission?.outCount || 0}`
  editForm.field9 = log.supervisionSituation || ''
  editForm.field10 = log.feedbackSituation || ''
  editForm.field11 = log.otherWork?.supervisionSituation || ''
  editForm.field12 = log.otherWork?.feedbackSituation || ''
  showEditDialog.value = true
}

// 格式化三大现场位置用于编辑
function formatSceneLocationsForEdit(threeScenes) {
  if (!threeScenes) return ''
  const parts = []
  if (threeScenes.labor?.checked && threeScenes.labor.locations?.length) {
    parts.push(`劳动现场:${threeScenes.labor.locations.join('、')}`)
  }
  if (threeScenes.living?.checked && threeScenes.living.locations?.length) {
    parts.push(`生活现场:${threeScenes.living.locations.join('、')}`)
  }
  if (threeScenes.study?.checked && threeScenes.study.locations?.length) {
    parts.push(`学习现场:${threeScenes.study.locations.join('、')}`)
  }
  return parts.join('\n')
}

// 保存编辑
async function saveEdit() {
  if (!editingLog.value) return
  
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    // 解析收押调出字段
    const admissionMatch = editForm.field8.match(/入:(\d+).*出:(\d+)/)
    const inCount = admissionMatch ? parseInt(admissionMatch[1]) : 0
    const outCount = admissionMatch ? parseInt(admissionMatch[2]) : 0
    
    const updateData = {
      prison_name: editForm.field1,
      inspector_name: editForm.field2,
      // 数值字段
      strict_control: { newCount: parseInt(editForm.field6) || 0 },
      police_equipment: { count: parseInt(editForm.field7) || 0 },
      admission: { inCount, outCount },
      // 文本字段
      supervision_situation: editForm.field9,
      feedback_situation: editForm.field10,
      other_work: {
        supervisionSituation: editForm.field11,
        feedbackSituation: editForm.field12
      }
    }
    
    const response = await fetch(`${API_BASE}/api/daily-logs/${editingLog.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    })
    
    if (response.ok) {
      ElMessage.success('保存成功')
      showEditDialog.value = false
      fetchHistoryLogs()  // 刷新列表
    } else {
      const result = await response.json()
      throw new Error(result.error || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败: ' + error.message)
  }
}

// ==================== 删除功能 ====================
async function deleteLog(log) {
  try {
    await ElMessageBox.confirm(
      `确定要删除 ${formatDate(log.date)} 的日志吗？此操作不可撤销。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    const response = await fetch(`${API_BASE}/api/daily-logs/${log.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      ElMessage.success('删除成功')
      fetchHistoryLogs()  // 刷新列表
    } else {
      const result = await response.json()
      throw new Error(result.error || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

// 获取三大现场完成情况文字
function getScenesStatus(log) {
  if (!log.threeScenes) return '未记录'
  const scenes = log.threeScenes
  const completed = []
  if (scenes.labor?.checked) completed.push('劳动')
  if (scenes.living?.checked) completed.push('生活')
  if (scenes.study?.checked) completed.push('学习')
  return completed.length > 0 ? completed.join('、') : '无'
}

// 工作日志表单
const logForm = reactive({
  date: new Date(),
  // 表头信息
  prisonName: '',         // 派驻监所
  inspectorName: '',      // 派驻人员
  
  // 三大现场检察
  threeScenes: {
    // 劳动现场
    labor: {
      checked: false,
      locations: [],               // 生产车间、习艺场所、劳动工具存放区
      focusPoints: [],             // 劳动安全防护、劳动报酬发放、超时超强度劳动、违规使用危险工具等
      issues: '',                  // 发现问题
      notes: ''                    // 备注
    },
    // 生活现场
    living: {
      checked: false,
      locations: [],               // 监舍、食堂、医院、洗漱卫生区
      focusPoints: [],             // 居住条件达标、饮食安全卫生、医疗保障到位、个人财物保管规范、禁止体罚虐待等
      issues: '',
      notes: ''
    },
    // 学习现场
    study: {
      checked: false,
      locations: [],               // 教室、教育中心、图书阅览室
      focusPoints: [],             // 思想教育落实、文化/职业技能培训开展、教育时间保障、学习内容合规性等
      issues: '',
      notes: ''
    }
  },
  
  // 严管禁闭检察
  strictControl: {
    newCount: 0,          // 严管禁闭新增人员数量
    totalCount: 0
  },
  
  // 警戒具检察
  policeEquipment: {
    checked: false,
    count: 0,             // 警戒具新增人员数量
    issues: ''
  },
  
  // 涉黑罪犯
  // gangPrisoners: {
  //   newCount: 0,
  //   totalCount: 0
  // },  // 已移除，表格中不需要
  
  // 收押/调出数量
  admission: {
    inCount: 0,           // 收押数量
    outCount: 0           // 调出数量
  },
  
  // 监控抽查
  monitorCheck: {
    checked: false,
    count: 0,
    anomalies: []
  },
  
  // 检察监督情况（日检察工作的具体情况）
  supervisionSituation: '',
  
  // 采纳反馈情况
  feedbackSituation: '',
  
  // 其它检察工作情况
  otherWork: {
    supervisionSituation: '',  // 周检察、月检察、及时检察的具体情况
    feedbackSituation: ''      // 采纳反馈情况
  },
  
  notes: ''
})

// 监控抽查异常记录
const monitorAnomalies = ref([])
const showAnomalyDialog = ref(false)
const anomalyForm = reactive({
  location: '',
  time: '',
  description: '',
  attachments: []
})

// 预览弹窗
const showPreviewDialog = ref(false)
const previewData = ref(null)

// 文件上传
const uploadRef = ref(null)
const uploadFileList = ref([])

// 处理文件选择
function handleFileChange(file, fileList) {
  uploadFileList.value = fileList
}

// 处理文件移除
function handleFileRemove(file, fileList) {
  uploadFileList.value = fileList
}

// 上传附件到服务器
async function uploadAttachments(logId, logDate) {
  if (uploadFileList.value.length === 0) return []
  
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    const formData = new FormData()
    uploadFileList.value.forEach(fileItem => {
      formData.append('files', fileItem.raw)
    })
    formData.append('category', 'daily_log')
    formData.append('related_log_id', logId)
    formData.append('related_log_type', 'daily')
    formData.append('log_date', logDate)  // 传递日志记录日期
    
    const response = await fetch(`${API_BASE}/api/attachments/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    
    if (response.ok) {
      const result = await response.json()
      return result.data || []
    } else {
      throw new Error('上传失败')
    }
  } catch (error) {
    console.error('上传附件失败:', error)
    throw error
  }
}

// 系统设置（用于导出）
function getSettings() {
  const saved = localStorage.getItem('paizhu-settings')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      return {}
    }
  }
  return {}
}

// 预览日志
function previewLog() {
  previewData.value = getLogPreviewData(logForm)
  showPreviewDialog.value = true
}

// 导出当前日志为 Word
async function exportCurrentLog() {
  try {
    await exportDailyLogToWord(logForm, getSettings())
    ElMessage.success('日志已导出为 Word 文件')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + error.message)
  }
}

// 从历史记录中导出指定日志（调用后端 API 使用正确的模板）
async function exportHistoryLog(log) {
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    const response = await fetch(`${API_BASE}/api/daily-logs/${log.id}/export`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '导出失败')
    }
    
    // 下载文件
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const dateStr = log.date ? getLocalDateString(new Date(log.date)) : 'unknown'
    a.download = `派驻检察工作日志_${dateStr}.docx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('日志已导出为 Word 文件')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + error.message)
  }
}

// ==================== 周检察/月检察弹窗功能 ====================

// 弹窗状态
const showWeeklyDialog = ref(false)
const showMonthlyDialog = ref(false)
const showWeeklyTalkDialog = ref(false)

// 附件上传ref
const weeklyHospitalUploadRef = ref(null)
const weeklyInjuryUploadRef = ref(null)
const weeklyTalkUploadRef = ref(null)
const weeklyContrabandUploadRef = ref(null)
const monthlyPunishmentUploadRef = ref(null)

// 附件文件列表
const weeklyHospitalFiles = ref([])
const weeklyInjuryFiles = ref([])
const weeklyTalkFiles = ref([])
const weeklyContrabandFiles = ref([])
const monthlyPunishmentFiles = ref([])

// 处理文件变化
function handleWeeklyHospitalChange(file, fileList) {
  weeklyHospitalFiles.value = fileList
}

function handleWeeklyInjuryChange(file, fileList) {
  weeklyInjuryFiles.value = fileList
}

function handleWeeklyTalkChange(file, fileList) {
  weeklyTalkFiles.value = fileList
}

function handleWeeklyContrabandChange(file, fileList) {
  weeklyContrabandFiles.value = fileList
}

function handleMonthlyPunishmentChange(file, fileList) {
  monthlyPunishmentFiles.value = fileList
}

// 上传周检察附件
async function uploadWeeklyAttachments(recordId, logDate) {
  const uploadTasks = []
  const token = localStorage.getItem('token')
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  
  console.log('📎 开始上传周检察附件')
  console.log('  recordId:', recordId)
  console.log('  logDate:', logDate)
  console.log('  医院附件数:', weeklyHospitalFiles.value.length)
  console.log('  外伤附件数:', weeklyInjuryFiles.value.length)
  console.log('  违禁品附件数:', weeklyContrabandFiles.value.length)
  
  // 医院检察附件
  if (weeklyHospitalFiles.value.length > 0) {
    const formData = new FormData()
    weeklyHospitalFiles.value.forEach(fileItem => {
      formData.append('files', fileItem.raw)
    })
    formData.append('category', 'weekly_hospital')
    formData.append('related_log_id', recordId)
    formData.append('related_log_type', 'weekly')
    formData.append('log_date', logDate)  // 传递日志记录日期
    
    uploadTasks.push(
      fetch(`${API_BASE}/api/attachments/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      }).then(response => {
        if (!response.ok) {
          throw new Error('医院检察附件上传失败')
        }
        return response.json()
      }).then(result => {
        console.log('✅ 医院检察附件上传成功:', result)
      })
    )
  }
  
  // 外伤检察附件
  if (weeklyInjuryFiles.value.length > 0) {
    const formData = new FormData()
    weeklyInjuryFiles.value.forEach(fileItem => {
      formData.append('files', fileItem.raw)
    })
    formData.append('category', 'weekly_injury')
    formData.append('related_log_id', recordId)
    formData.append('related_log_type', 'weekly')
    formData.append('log_date', logDate)  // 传递日志记录日期
    
    uploadTasks.push(
      fetch(`${API_BASE}/api/attachments/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      }).then(response => {
        if (!response.ok) {
          throw new Error('外伤检察附件上传失败')
        }
        return response.json()
      }).then(result => {
        console.log('✅ 外伤检察附件上传成功:', result)
      })
    )
  }
  
  // 违禁品照片
  if (weeklyContrabandFiles.value.length > 0) {
    const formData = new FormData()
    weeklyContrabandFiles.value.forEach(fileItem => {
      formData.append('files', fileItem.raw)
    })
    formData.append('category', 'weekly_contraband')
    formData.append('related_log_id', recordId)
    formData.append('related_log_type', 'weekly')
    formData.append('log_date', logDate)  // 传递日志记录日期
    
    uploadTasks.push(
      fetch(`${API_BASE}/api/attachments/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      }).then(response => {
        if (!response.ok) {
          throw new Error('违禁品照片上传失败')
        }
        return response.json()
      }).then(result => {
        console.log('✅ 违禁品照片上传成功:', result)
      })
    )
  }
  
  // 等待所有上传完成
  if (uploadTasks.length > 0) {
    await Promise.all(uploadTasks)
    console.log('✅ 所有周检察附件上传完成')
  } else {
    console.log('ℹ️ 没有周检察附件需要上传')
  }
}

// 上传月检察附件
async function uploadMonthlyAttachments(recordId, logDate) {
  console.log('📎 开始上传月检察附件')
  console.log('  recordId:', recordId)
  console.log('  logDate:', logDate)
  console.log('  处分证据附件数:', monthlyPunishmentFiles.value.length)
  
  if (monthlyPunishmentFiles.value.length === 0) {
    console.log('ℹ️ 没有月检察附件需要上传')
    return
  }
  
  const token = localStorage.getItem('token')
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  
  const formData = new FormData()
  monthlyPunishmentFiles.value.forEach(fileItem => {
    formData.append('files', fileItem.raw)
  })
  formData.append('category', 'monthly_punishment')
  formData.append('related_log_id', recordId)
  formData.append('related_log_type', 'monthly')
  formData.append('log_date', logDate)  // 传递日志记录日期
  
  const response = await fetch(`${API_BASE}/api/attachments/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  })
  
  if (!response.ok) {
    throw new Error('月检察附件上传失败')
  }
  
  const result = await response.json()
  console.log('✅ 月检察附件上传成功:', result)
}

// 谈话记录表单（用于周检察对话框）
const weeklyTalkForm = reactive({
  type: 'newPrisoner',
  prisonerName: '',
  prisonerId: '',
  date: getLocalDateString(),
  content: '',
  transcriptUploaded: false
})

// 谈话类型选项
const talkTypes = [
  { value: 'newPrisoner', label: '新入监罪犯' },
  { value: 'release', label: '刑释前罪犯' },
  { value: 'injury', label: '外伤罪犯' },
  { value: 'confinement', label: '禁闭罪犯' }
]

// 获取本地日期字符串（避免时区问题）
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 周检察表单数据（与 WeeklyCheck.vue 保持一致）
const weeklyFormData = reactive({
  record_date: getLocalDateString(),
  week_number: Math.ceil((new Date().getDate()) / 7),
  
  // 1. 医院禁闭室检察
  hospital_check: {
    checked: false,
    checkDate: getLocalDateString(),
    focusAreas: {
      policeEquipment: false,  // 警械使用
      strictControl: false,    // 严管适用
      confinement: false       // 禁闭适用
    },
    hasAnomalies: false,
    anomalyDescription: '',
    attachments: []
  },
  
  // 2. 外伤检察
  injury_check: {
    found: false,
    count: 0,
    verified: false,
    anomalyDescription: '',
    transcriptUploaded: false
  },
  
  // 3. 谈话记录
  talk_records: [],
  
  // 4. 检察官信箱
  mailbox: {
    opened: false,
    openCount: 0,
    receivedCount: 0,
    valuableClues: false,
    clueDescription: '',
    materialsUploaded: false
  },
  
  // 5. 违禁品检查
  contraband: {
    checked: false,
    found: false,
    foundCount: 0,
    involvedCount: 0,
    description: '',
    photos: []
  },
  
  notes: ''
})

// 月检察表单数据（与 MonthlyCheck.vue 保持一致）
const monthlyFormData = reactive({
  record_month: getLocalDateString().slice(0, 7), // YYYY-MM
  record_date: getLocalDateString(),
  
  // 1. 会见检察
  visit_check: {
    checked: false,
    visitCount: 0,
    issuesFound: false,
    description: ''
  },
  
  // 2. 犯情分析会
  meeting: {
    participated: false,
    meetingType: 'analysis',
    count: 1,
    role: 'listener', // listener/speaker/advisor
    meetingDate: '',
    notes: ''
  },
  
  // 3. 处分监督
  punishment: {
    exists: false,
    recordCount: 0,
    confinementCount: 0,
    supervised: true,
    evidenceUploaded: false,
    reason: ''
  },
  
  // 4. 勤杂岗位变动
  position_stats: {
    startCount: 0,
    endCount: 0,
    increase: 0,
    decrease: 0,
    reason: ''
  },
  
  notes: ''
})

// 自动保存周检察草稿
const autoSaveWeekly = debounce(() => {
  localStorage.setItem('weekly-draft', JSON.stringify(weeklyFormData))
  console.log('周检察草稿已自动保存')
}, 1000)

// 自动保存月检察草稿
const autoSaveMonthly = debounce(() => {
  localStorage.setItem('monthly-draft', JSON.stringify(monthlyFormData))
  console.log('月检察草稿已自动保存')
}, 1000)

// 监听周检察表单变化
watch(weeklyFormData, autoSaveWeekly, { deep: true })

// 监听月检察表单变化
watch(monthlyFormData, autoSaveMonthly, { deep: true })

// 监听月检察岗位人数变化，自动计算增减
watch(
  () => [monthlyFormData.position_stats.startCount, monthlyFormData.position_stats.endCount],
  ([start, end]) => {
    if (start >= 0 && end >= 0) {
      const diff = end - start
      if (diff > 0) {
        monthlyFormData.position_stats.increase = diff
        monthlyFormData.position_stats.decrease = 0
      } else if (diff < 0) {
        monthlyFormData.position_stats.increase = 0
        monthlyFormData.position_stats.decrease = Math.abs(diff)
      } else {
        monthlyFormData.position_stats.increase = 0
        monthlyFormData.position_stats.decrease = 0
      }
    }
  }
)

// 监听日期变化，检查是否已有日志
watch(() => logForm.date, async (newDate) => {
  if (!newDate) return
  
  try {
    const dateStr = getLocalDateString(new Date(newDate))
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    const response = await fetch(`${API_BASE}/api/daily-logs/check-date/${dateStr}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.exists) {
        ElMessageBox.confirm(
          `${dateStr} 的日志已经填写过了，是否要查看或编辑该日志？`,
          '日志已存在',
          {
            confirmButtonText: '查看/编辑',
            cancelButtonText: '继续新建',
            type: 'warning'
          }
        ).then(() => {
          // 用户选择查看/编辑，切换到历史记录视图
          viewMode.value = 'history'
          // 可以进一步定位到该日志
          if (result.log) {
            viewLogDetail(result.log)
          }
        }).catch(() => {
          // 用户选择继续新建，不做任何操作
        })
      }
    }
  } catch (error) {
    console.error('检查日期失败:', error)
  }
})

// 加载周检察草稿
function loadWeeklyDraft() {
  const draft = localStorage.getItem('weekly-draft')
  if (draft) {
    try {
      Object.assign(weeklyFormData, JSON.parse(draft))
    } catch (e) {
      console.error('加载周检察草稿失败:', e)
    }
  }
}

// 加载月检察草稿
function loadMonthlyDraft() {
  const draft = localStorage.getItem('monthly-draft')
  if (draft) {
    try {
      Object.assign(monthlyFormData, JSON.parse(draft))
    } catch (e) {
      console.error('加载月检察草稿失败:', e)
    }
  }
}

// 添加谈话记录到周检察
function addWeeklyTalkRecord() {
  if (!weeklyTalkForm.prisonerName || !weeklyTalkForm.content) {
    ElMessage.warning('请填写罪犯姓名和谈话内容')
    return
  }
  
  weeklyFormData.talk_records.push({
    id: Date.now(),
    type: weeklyTalkForm.type,
    prisonerName: weeklyTalkForm.prisonerName,
    prisonerId: weeklyTalkForm.prisonerId,
    date: weeklyTalkForm.date,
    content: weeklyTalkForm.content,
    transcriptUploaded: weeklyTalkForm.transcriptUploaded,
    typeLabel: talkTypes.find(t => t.value === weeklyTalkForm.type)?.label
  })
  
  // 重置表单
  weeklyTalkForm.type = 'newPrisoner'
  weeklyTalkForm.prisonerName = ''
  weeklyTalkForm.prisonerId = ''
  weeklyTalkForm.date = getLocalDateString()
  weeklyTalkForm.content = ''
  weeklyTalkForm.transcriptUploaded = false
  
  showWeeklyTalkDialog.value = false
  ElMessage.success('谈话记录已添加')
}

// 同步周检察内容到日志
async function syncWeeklyToLog() {
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    // 1. 先保存周检察记录到数据库
    const response = await fetch(`${API_BASE}/api/weekly-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(weeklyFormData)
    })
    
    if (!response.ok) {
      throw new Error('保存周检察记录失败')
    }
    
    const result = await response.json()
    const recordId = result.data.id
    
    // 2. 上传附件（传递周检察的记录日期）
    const logDate = weeklyFormData.record_date
    console.log('📎 上传周检察附件，记录日期:', logDate)
    await uploadWeeklyAttachments(recordId, logDate)
    
    // 3. 生成摘要同步到日志表单
    const summaryParts = []
    
    if (weeklyFormData.hospital_check.checked) {
      const areas = []
      if (weeklyFormData.hospital_check.focusAreas.policeEquipment) areas.push('警械使用')
      if (weeklyFormData.hospital_check.focusAreas.strictControl) areas.push('严管适用')
      if (weeklyFormData.hospital_check.focusAreas.confinement) areas.push('禁闭适用')
      
      const areaText = areas.length > 0 ? `检察重点：${areas.join('、')}` : '常规检察'
      const anomalyText = weeklyFormData.hospital_check.hasAnomalies 
        ? `，发现异常：${weeklyFormData.hospital_check.anomalyDescription}` 
        : '，无异常'
      summaryParts.push(`【医院/禁闭室检察】${areaText}${anomalyText}`)
    }
    
    if (weeklyFormData.injury_check.found) {
      const verifiedText = weeklyFormData.injury_check.verified ? '已核实' : '待核实'
      const transcriptText = weeklyFormData.injury_check.transcriptUploaded ? '，已上传笔录' : ''
      summaryParts.push(`【外伤检察】发现${weeklyFormData.injury_check.count}人次，${verifiedText}${transcriptText}`)
      if (weeklyFormData.injury_check.anomalyDescription) {
        summaryParts.push(`  ${weeklyFormData.injury_check.anomalyDescription}`)
      }
    }
    
    if (weeklyFormData.talk_records.length > 0) {
      const types = {
        newPrisoner: 0,
        release: 0,
        injury: 0,
        confinement: 0
      }
      weeklyFormData.talk_records.forEach(record => {
        types[record.type]++
      })
      const typeText = []
      if (types.newPrisoner > 0) typeText.push(`新入监${types.newPrisoner}人`)
      if (types.release > 0) typeText.push(`刑释前${types.release}人`)
      if (types.injury > 0) typeText.push(`外伤${types.injury}人`)
      if (types.confinement > 0) typeText.push(`禁闭${types.confinement}人`)
      summaryParts.push(`【罪犯谈话】共${weeklyFormData.talk_records.length}人次（${typeText.join('、')}）`)
    }
    
    if (weeklyFormData.mailbox.opened) {
      const clueText = weeklyFormData.mailbox.valuableClues 
        ? `，发现有价值线索：${weeklyFormData.mailbox.clueDescription}` 
        : ''
      summaryParts.push(`【检察官信箱】开启${weeklyFormData.mailbox.openCount}次，收到${weeklyFormData.mailbox.receivedCount}封${clueText}`)
    }
    
    if (weeklyFormData.contraband.checked) {
      if (weeklyFormData.contraband.found) {
        summaryParts.push(`【违禁品排查】发现${weeklyFormData.contraband.foundCount}次，涉及${weeklyFormData.contraband.involvedCount}人`)
        if (weeklyFormData.contraband.description) {
          summaryParts.push(`  ${weeklyFormData.contraband.description}`)
        }
      } else {
        summaryParts.push(`【违禁品排查】未发现`)
      }
    }
    
    if (summaryParts.length > 0) {
      // 追加而非覆盖
      const existing = logForm.otherWork.supervisionSituation
      logForm.otherWork.supervisionSituation = existing 
        ? `${existing}\n${summaryParts.join('\n')}`
        : summaryParts.join('\n')
    }
    
    // 4. 清空附件列表
    weeklyHospitalFiles.value = []
    weeklyInjuryFiles.value = []
    weeklyContrabandFiles.value = []
    
    ElMessage.success('周检察内容已保存并同步到日志')
    showWeeklyDialog.value = false
  } catch (error) {
    console.error('同步周检察失败:', error)
    ElMessage.error('同步失败: ' + error.message)
  }
}

// 同步月检察内容到日志
async function syncMonthlyToLog() {
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    // 1. 先保存月检察记录到数据库
    const response = await fetch(`${API_BASE}/api/monthly-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(monthlyFormData)
    })
    
    if (!response.ok) {
      throw new Error('保存月检察记录失败')
    }
    
    const result = await response.json()
    const recordId = result.data.id
    
    // 2. 上传附件（传递月检察的记录日期）
    const logDate = monthlyFormData.record_date
    console.log('📎 上传月检察附件，记录日期:', logDate)
    await uploadMonthlyAttachments(recordId, logDate)
    
    // 3. 生成摘要同步到日志表单
    const summaryParts = []
    
    if (monthlyFormData.visit_check.checked) {
      const issueText = monthlyFormData.visit_check.issuesFound 
        ? `，发现问题：${monthlyFormData.visit_check.description}` 
        : '，未发现问题'
      summaryParts.push(`【会见检察】检察${monthlyFormData.visit_check.visitCount}次${issueText}`)
    }
    
    if (monthlyFormData.meeting.participated) {
      const meetingTypeLabel = {
        lifeSentence: '无期死缓评审会',
        parole: '减刑假释评审会',
        analysis: '犯情分析会',
        other: '其他会议'
      }[monthlyFormData.meeting.meetingType] || monthlyFormData.meeting.meetingType
      
      const roleLabel = {
        listener: '列席',
        speaker: '发言',
        advisor: '提出意见'
      }[monthlyFormData.meeting.role] || '参加'
      
      summaryParts.push(`【参加会议】${meetingTypeLabel} ${monthlyFormData.meeting.count}次（${roleLabel}）`)
      if (monthlyFormData.meeting.notes) {
        summaryParts.push(`  ${monthlyFormData.meeting.notes}`)
      }
    }
    
    if (monthlyFormData.punishment.exists) {
      const supervisedText = monthlyFormData.punishment.supervised ? '已监督到位' : '待监督'
      summaryParts.push(`【处分监督】记过${monthlyFormData.punishment.recordCount}人，禁闭${monthlyFormData.punishment.confinementCount}人（${supervisedText}）`)
      if (monthlyFormData.punishment.reason) {
        summaryParts.push(`  原因：${monthlyFormData.punishment.reason}`)
      }
    }
    
    const totalIncrease = monthlyFormData.position_stats.increase
    const totalDecrease = monthlyFormData.position_stats.decrease
    if (totalIncrease > 0 || totalDecrease > 0) {
      summaryParts.push(`【岗位变动】增加${totalIncrease}人，减少${totalDecrease}人`)
      if (monthlyFormData.position_stats.reason) {
        summaryParts.push(`  ${monthlyFormData.position_stats.reason}`)
      }
    }
    
    if (summaryParts.length > 0) {
      // 追加而非覆盖
      const existing = logForm.otherWork.supervisionSituation
      logForm.otherWork.supervisionSituation = existing 
        ? `${existing}\n${summaryParts.join('\n')}`
        : summaryParts.join('\n')
    }
    
    // 4. 清空附件列表
    monthlyPunishmentFiles.value = []
    
    ElMessage.success('月检察内容已保存并同步到日志')
    showMonthlyDialog.value = false
  } catch (error) {
    console.error('同步月检察失败:', error)
    ElMessage.error('同步失败: ' + error.message)
  }
}

// 在组件挂载时加载数据
onMounted(() => {
  loadDefaultSettings()
  loadWeeklyDraft()
  loadMonthlyDraft()
  fetchPrisonList()  // 获取监所列表
  fetchHistoryLogs()  // 从后端加载历史日志（带数据库 ID）
})

function addAnomaly() {
  if (!anomalyForm.location || !anomalyForm.description) {
    ElMessage.warning('请填写异常位置和描述')
    return
  }
  
  monitorAnomalies.value.push({
    id: Date.now(),
    ...anomalyForm,
    time: anomalyForm.time || new Date().toLocaleTimeString('zh-CN')
  })
  
  logForm.monitorCheck.anomalies = monitorAnomalies.value
  resetAnomalyForm()
  showAnomalyDialog.value = false
  ElMessage.success('异常记录已添加')
}

// 删除监控异常
function removeAnomaly(index) {
  monitorAnomalies.value.splice(index, 1)
  logForm.monitorCheck.anomalies = monitorAnomalies.value
}

// 重置异常表单
function resetAnomalyForm() {
  anomalyForm.location = ''
  anomalyForm.time = ''
  anomalyForm.description = ''
  anomalyForm.attachments = []
}

// 提交日志
async function submitLog() {
  try {
    // 先进行数据校验
    const discrepancies = validateWithRosterData()
    if (discrepancies.length > 0) {
      await showDiscrepancyDialog(discrepancies)
    }
    
    // 构建提交数据
    const submitData = {
      log_date: logForm.date,
      prison_name: logForm.prisonName,
      inspector_name: logForm.inspectorName,
      three_scenes: logForm.threeScenes,
      strict_control: logForm.strictControl,
      police_equipment: logForm.policeEquipment,
      gang_prisoners: logForm.gangPrisoners,
      admission: logForm.admission,
      monitor_check: logForm.monitorCheck,
      supervision_situation: logForm.supervisionSituation,
      feedback_situation: logForm.feedbackSituation,
      other_work: logForm.otherWork,
      notes: logForm.notes
    }
    
    // 直接调用 API 提交到后端
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    const response = await fetch(`${API_BASE}/api/daily-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(submitData)
    })
    
    const result = await response.json()
    if (response.ok && result.success) {
      // 上传附件（传递日志记录日期）
      if (uploadFileList.value.length > 0) {
        try {
          const logDate = getLocalDateString(new Date(logForm.date))
          console.log('📎 上传日检察附件，日志日期:', logDate)
          await uploadAttachments(result.data.id, logDate)
          ElMessage.success('日志和附件提交成功')
        } catch (error) {
          ElMessage.warning('日志提交成功，但附件上传失败')
        }
      } else {
        ElMessage.success('日志提交成功')
      }
      
      // 同步数据到报告 Store
      reportStore.addDailyLog({
        date: logForm.date,
        inspectorName: logForm.inspectorName,
        prisonName: logForm.prisonName,
        threeScenes: { ...logForm.threeScenes },
        strictControl: { ...logForm.strictControl },
        policeEquipment: { ...logForm.policeEquipment },
        gangPrisoners: { ...logForm.gangPrisoners },
        admission: { ...logForm.admission },
        monitorCheck: { ...logForm.monitorCheck },
        supervisionSituation: logForm.supervisionSituation,
        feedbackSituation: logForm.feedbackSituation,
        otherWork: { ...logForm.otherWork },
        notes: logForm.notes
      })
      
      // 重置表单
      resetForm()
      
      // 切换到历史记录视图并刷新数据
      viewMode.value = 'history'
      await fetchHistoryLogs()
      
    } else {
      throw new Error(result.message || '提交失败')
    }
    
  } catch (error) {
    console.error('提交日志失败:', error)
    ElMessage.error('提交失败: ' + error.message)
  }
}

// 重置表单
function resetForm() {
  // 重新加载默认设置
  loadDefaultSettings()
  
  logForm.threeScenes = {
    labor: { checked: false, locations: [], focusPoints: [], issues: '', notes: '' },
    living: { checked: false, locations: [], focusPoints: [], issues: '', notes: '' },
    study: { checked: false, locations: [], focusPoints: [], issues: '', notes: '' }
  }
  logForm.strictControl = { newCount: 0, totalCount: 0 }
  logForm.policeEquipment = { checked: false, count: 0, issues: '' }
  logForm.gangPrisoners = { newCount: 0, totalCount: 0 }
  logForm.admission = { inCount: 0, outCount: 0 }
  logForm.monitorCheck = { checked: false, count: 0, anomalies: [] }
  logForm.supervisionSituation = ''
  logForm.feedbackSituation = ''
  logForm.otherWork = { supervisionSituation: '', feedbackSituation: '' }
  logForm.notes = ''
  monitorAnomalies.value = []
  uploadFileList.value = []
}

// 三大现场选项配置
const scenesConfig = {
  labor: {
    label: '劳动现场',
    locations: ['生产车间', '习艺场所', '劳动工具存放区'],
    focusPoints: ['劳动安全防护', '劳动报酬发放', '超时超强度劳动', '违规使用危险工具'],
    goal: '保障劳动权益，防范生产安全事故，杜绝强迫劳动',
    tagType: 'warning'
  },
  living: {
    label: '生活现场',
    locations: ['监舍', '食堂', '医院', '洗漱卫生区'],
    focusPoints: ['居住条件达标', '饮食安全卫生', '医疗保障到位', '个人财物保管规范', '禁止体罚虐待'],
    goal: '维护基本生活与健康权益，排查自伤、斗殴等风险',
    tagType: 'success'
  },
  study: {
    label: '学习现场',
    locations: ['教室', '教育中心', '图书阅览室'],
    focusPoints: ['思想教育落实', '文化/职业技能培训开展', '教育时间保障', '学习内容合规性'],
    goal: '保障教育权益',
    tagType: 'primary'
  }
}

// 计算三大现场完成状态
const threeScenesCompleted = computed(() => {
  const scenes = logForm.threeScenes
  return [scenes.labor.checked, scenes.living.checked, scenes.study.checked].filter(v => v).length
})
</script>

<template>
  <div class="daily-check-page">
    <!-- 视图切换按钮 -->
    <div class="view-toggle">
      <el-radio-group v-model="viewMode" size="large">
        <el-radio-button value="form">
          <el-icon><Edit /></el-icon>
          新建日志
        </el-radio-button>
        <el-radio-button value="history">
          <el-icon><List /></el-icon>
          查看历史 ({{ totalLogs }})
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 新建/编辑日志表单 -->
    <el-card v-if="viewMode === 'form'" class="form-card">
      <template #header>
        <div class="card-header">
          <h3>派驻检察工作日志</h3>
          <span class="date-display">{{ today }}</span>
        </div>
      </template>

      <el-form :model="logForm" label-width="120px" label-position="top">
        <!-- 表头信息 -->
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="记录日期">
              <el-date-picker
                v-model="logForm.date"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                :disabled-date="(date) => date > new Date()"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="派驻监所">
              <el-input v-model="logForm.prisonName" placeholder="填写派驻监所名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="派驻人员">
              <el-input v-model="logForm.inspectorName" placeholder="填写派驻人员姓名" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 三大现场检察 -->
        <el-divider content-position="left">
          <el-tag type="primary">三大现场检察 ({{ threeScenesCompleted }}/3)</el-tag>
        </el-divider>
        
        <div class="three-scenes-container">
          <!-- 劳动现场 -->
          <el-card class="scene-card" :class="{ 'scene-checked': logForm.threeScenes.labor.checked }">
            <template #header>
              <div class="scene-header">
                <el-checkbox v-model="logForm.threeScenes.labor.checked" size="large">
                  <el-tag :type="scenesConfig.labor.tagType" size="large">劳动现场</el-tag>
                </el-checkbox>
              </div>
            </template>
            
            <template v-if="logForm.threeScenes.labor.checked">
              <el-form-item label="检察区域">
                <el-checkbox-group v-model="logForm.threeScenes.labor.locations">
                  <el-checkbox v-for="loc in scenesConfig.labor.locations" :key="loc" :value="loc" border>
                    {{ loc }}
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              
              <el-form-item label="监督重点">
                <el-checkbox-group v-model="logForm.threeScenes.labor.focusPoints">
                  <el-checkbox v-for="fp in scenesConfig.labor.focusPoints" :key="fp" :value="fp">
                    {{ fp }}
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              
              <el-alert :title="scenesConfig.labor.goal" type="info" :closable="false" show-icon style="margin-bottom: 12px;" />
              
              <el-form-item label="发现问题">
                <el-input v-model="logForm.threeScenes.labor.issues" type="textarea" :rows="2" placeholder="如无问题可留空" />
              </el-form-item>
            </template>
          </el-card>
          
          <!-- 生活现场 -->
          <el-card class="scene-card" :class="{ 'scene-checked': logForm.threeScenes.living.checked }">
            <template #header>
              <div class="scene-header">
                <el-checkbox v-model="logForm.threeScenes.living.checked" size="large">
                  <el-tag :type="scenesConfig.living.tagType" size="large">生活现场</el-tag>
                </el-checkbox>
              </div>
            </template>
            
            <template v-if="logForm.threeScenes.living.checked">
              <el-form-item label="检察区域">
                <el-checkbox-group v-model="logForm.threeScenes.living.locations">
                  <el-checkbox v-for="loc in scenesConfig.living.locations" :key="loc" :value="loc" border>
                    {{ loc }}
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              
              <el-form-item label="监督重点">
                <el-checkbox-group v-model="logForm.threeScenes.living.focusPoints">
                  <el-checkbox v-for="fp in scenesConfig.living.focusPoints" :key="fp" :value="fp">
                    {{ fp }}
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              
              <el-alert :title="scenesConfig.living.goal" type="info" :closable="false" show-icon style="margin-bottom: 12px;" />
              
              <el-form-item label="发现问题">
                <el-input v-model="logForm.threeScenes.living.issues" type="textarea" :rows="2" placeholder="如无问题可留空" />
              </el-form-item>
            </template>
          </el-card>
          
          <!-- 学习现场 -->
          <el-card class="scene-card" :class="{ 'scene-checked': logForm.threeScenes.study.checked }">
            <template #header>
              <div class="scene-header">
                <el-checkbox v-model="logForm.threeScenes.study.checked" size="large">
                  <el-tag :type="scenesConfig.study.tagType" size="large">学习现场</el-tag>
                </el-checkbox>
              </div>
            </template>
            
            <template v-if="logForm.threeScenes.study.checked">
              <el-form-item label="检察区域">
                <el-checkbox-group v-model="logForm.threeScenes.study.locations">
                  <el-checkbox v-for="loc in scenesConfig.study.locations" :key="loc" :value="loc" border>
                    {{ loc }}
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              
              <el-form-item label="监督重点">
                <el-checkbox-group v-model="logForm.threeScenes.study.focusPoints">
                  <el-checkbox v-for="fp in scenesConfig.study.focusPoints" :key="fp" :value="fp">
                    {{ fp }}
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              
              <el-alert :title="scenesConfig.study.goal" type="info" :closable="false" show-icon style="margin-bottom: 12px;" />
              
              <el-form-item label="发现问题">
                <el-input v-model="logForm.threeScenes.study.issues" type="textarea" :rows="2" placeholder="如无问题可留空" />
              </el-form-item>
            </template>
          </el-card>
        </div>

        <!-- 警戒具检察 -->
        <el-divider content-position="left">
          <el-tag type="warning">警戒具使用检察</el-tag>
        </el-divider>
        
        <el-form-item>
          <el-checkbox v-model="logForm.policeEquipment.checked">
            已检察
          </el-checkbox>
        </el-form-item>
        
        <el-row :gutter="16" v-if="logForm.policeEquipment.checked">
          <el-col :span="12">
            <el-form-item label="使用人数">
              <el-input-number 
                v-model="logForm.policeEquipment.count" 
                :min="0" 
                :max="999"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发现问题">
              <el-input 
                v-model="logForm.policeEquipment.issues" 
                type="textarea"
                placeholder="如无问题可留空"
                :rows="2"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 监控抽查 -->
        <el-divider content-position="left">
          <el-tag type="success">监控抽查</el-tag>
        </el-divider>
        
        <el-form-item>
          <el-checkbox v-model="logForm.monitorCheck.checked">
            已抽查
          </el-checkbox>
        </el-form-item>
        
        <template v-if="logForm.monitorCheck.checked">
          <el-form-item label="抽查次数">
            <el-input-number 
              v-model="logForm.monitorCheck.count" 
              :min="1" 
              :max="99"
              style="width: 200px"
            />
          </el-form-item>
          
          <el-form-item label="异常记录">
            <el-button type="primary" :icon="Plus" @click="showAnomalyDialog = true">
              添加异常记录
            </el-button>
            
            <div class="anomaly-list" v-if="monitorAnomalies.length > 0">
              <el-card 
                v-for="(anomaly, index) in monitorAnomalies" 
                :key="anomaly.id"
                class="anomaly-card"
                shadow="hover"
              >
                <div class="anomaly-header">
                  <span class="anomaly-location">{{ anomaly.location }}</span>
                  <span class="anomaly-time">{{ anomaly.time }}</span>
                  <el-button 
                    type="danger" 
                    :icon="Delete" 
                    circle 
                    size="small"
                    @click="removeAnomaly(index)"
                  />
                </div>
                <p class="anomaly-desc">{{ anomaly.description }}</p>
              </el-card>
            </div>
          </el-form-item>
        </template>

        <!-- 严管禁闭检察 -->
        <el-divider content-position="left">
          <el-tag type="danger">严管禁闭检察</el-tag>
        </el-divider>
        
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="新增人数">
              <el-input-number 
                v-model="logForm.strictControl.newCount" 
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前总数">
              <el-input-number 
                v-model="logForm.strictControl.totalCount" 
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 收押/调出数量 -->
        <el-divider content-position="left">
          <el-tag type="success">收押/调出数量</el-tag>
        </el-divider>
        
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="收押人数">
              <el-input-number 
                v-model="logForm.admission.inCount" 
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="调出人数">
              <el-input-number 
                v-model="logForm.admission.outCount" 
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 日工作事项：检察监督情况 -->
        <el-divider content-position="left">
          <el-tag type="primary">日工作事项</el-tag>
        </el-divider>
        
        <el-form-item label="检察监督情况（填写日检察工作的具体情况）">
          <el-input 
            v-model="logForm.supervisionSituation" 
            type="textarea"
            placeholder="填写日检察工作的具体情况..."
            :rows="4"
          />
        </el-form-item>
        
        <el-form-item label="采纳反馈情况">
          <el-input 
            v-model="logForm.feedbackSituation" 
            type="textarea"
            placeholder="填写采纳反馈情况..."
            :rows="3"
          />
        </el-form-item>

        <!-- 其它检察工作情况 -->
        <el-divider content-position="left">
          <el-tag>其它检察工作情况</el-tag>
        </el-divider>
        
        <el-form-item label="检察监督情况">
          <div class="jump-buttons">
            <el-button 
              type="primary" 
              :icon="Calendar" 
              size="large"
              @click="showWeeklyDialog = true"
            >
              填写周检察
            </el-button>
            <el-button 
              type="success" 
              :icon="Calendar" 
              size="large"
              @click="showMonthlyDialog = true"
            >
              填写月检察
            </el-button>
          </div>
          
          <!-- 已同步的内容展示 -->
          <div v-if="logForm.otherWork.supervisionSituation" class="synced-content">
            <el-alert type="info" :closable="false" show-icon>
              <template #title>已同步内容</template>
              <template #default>
                <pre style="white-space: pre-wrap; margin: 0;">{{ logForm.otherWork.supervisionSituation }}</pre>
              </template>
            </el-alert>
          </div>
        </el-form-item>
        
        <el-form-item label="采纳反馈情况">
          <el-input 
            v-model="logForm.otherWork.feedbackSituation" 
            type="textarea"
            placeholder="填写采纳反馈情况..."
            :rows="3"
          />
        </el-form-item>

        <!-- 其他备注 -->
        <el-divider content-position="left">
          <el-tag>其他备注</el-tag>
        </el-divider>
        
        <el-form-item>
          <el-input 
            v-model="logForm.notes" 
            type="textarea"
            placeholder="填写其他需要记录的事项..."
            :rows="3"
          />
        </el-form-item>

        <!-- 相关材料附件 -->
        <el-divider content-position="left">
          <el-icon><Document /></el-icon>
          相关材料附件
        </el-divider>
        
        <el-form-item label="上传附件">
          <el-upload
            ref="uploadRef"
            action="#"
            :auto-upload="false"
            :file-list="uploadFileList"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            multiple
            :limit="10"
            list-type="text"
          >
            <el-button type="primary" :icon="Plus">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持图片、PDF、Word、Excel文件，单个文件不超过50MB，最多10个
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item>
          <div class="form-actions">
            <el-button type="primary" size="large" @click="submitLog">
              提交日志
            </el-button>
            <el-button size="large" @click="saveDraft">
              保存草稿
            </el-button>
            <el-button size="large" :icon="Printer" @click="previewLog">
              预览
            </el-button>
            <el-button type="success" size="large" :icon="Download" @click="exportCurrentLog">
              导出Word
            </el-button>
            <el-button size="large" @click="resetForm">
              重置
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 异常记录对话框 -->
    <el-dialog 
      v-model="showAnomalyDialog" 
      title="添加监控异常记录"
      width="500px"
    >
      <el-form :model="anomalyForm" label-width="80px">
        <el-form-item label="异常位置" required>
          <el-input v-model="anomalyForm.location" placeholder="如：3号监区东侧走廊" />
        </el-form-item>
        <el-form-item label="发现时间">
          <el-time-picker 
            v-model="anomalyForm.time" 
            placeholder="选择时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="异常描述" required>
          <el-input 
            v-model="anomalyForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="描述异常情况..."
          />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload
            action="#"
            :auto-upload="false"
            list-type="picture-card"
            :limit="5"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">支持照片/视频，最多5个</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAnomalyDialog = false">取消</el-button>
        <el-button type="primary" @click="addAnomaly">确定添加</el-button>
      </template>
    </el-dialog>

    <!-- 历史日志列表 -->
    <el-card v-if="viewMode === 'history'" class="history-card">
      <template #header>
        <div class="card-header">
          <h3>历史日志记录</h3>
          <el-tag>共 {{ totalLogs }} 条</el-tag>
        </div>
      </template>

      <!-- 批量操作按钮 -->
      <div v-if="selectedLogs.length > 0" style="margin-bottom: 16px">
        <el-alert
          :title="`已选择 ${selectedLogs.length} 条日志`"
          type="info"
          :closable="false"
        >
          <template #default>
            <div style="display: flex; align-items: center; gap: 12px">
              <span>已选择 {{ selectedLogs.length }} 条日志</span>
              <el-button type="success" size="small" :icon="Download" @click="batchExport">
                批量导出
              </el-button>
              <el-button type="danger" size="small" :icon="Delete" @click="batchDelete">
                批量删除
              </el-button>
            </div>
          </template>
        </el-alert>
      </div>

      <el-table 
        v-if="historyLogs.length > 0"
        :data="historyLogs" 
        v-loading="loadingHistory"
        style="width: 100%"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="date" label="日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column prop="prisonName" label="派驻监所" width="150" />
        <el-table-column prop="inspectorName" label="派驻人员" width="100" />
        <el-table-column label="三大现场" width="150">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ getScenesStatus(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="监控抽查" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.monitorCheck?.checked" type="success" size="small">
              {{ row.monitorCheck.count || 1 }}次
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="viewLogDetail(row)">
              详情
            </el-button>
            <el-button 
              v-if="canEditLog(row)"
              type="warning" 
              link 
              :icon="Edit" 
              @click="openEditDialog(row)"
            >
              编辑
            </el-button>
            <el-button type="success" link :icon="Download" @click="exportHistoryLog(row)">
              导出
            </el-button>
            <el-button 
              v-if="canDeleteLog(row)"
              type="danger" 
              link 
              :icon="Delete" 
              @click="deleteLog(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页器 -->
      <el-pagination
        v-if="totalLogs > 0"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalLogs"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        style="margin-top: 20px; justify-content: center"
      />

      <el-empty v-else description="暂无日志记录">
        <el-button type="primary" @click="viewMode = 'form'">新建日志</el-button>
      </el-empty>
    </el-card>

    <!-- 日志详情弹窗 -->
    <el-dialog 
      v-model="viewingLog"
      :title="viewingLog ? `日志详情 - ${formatDate(viewingLog.date)}` : ''"
      width="700px"
      @close="closeLogDetail"
    >
      <template v-if="viewingLog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="派驻监所" :span="1">
            {{ viewingLog.prisonName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="派驻人员" :span="1">
            {{ viewingLog.inspectorName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="三大现场" :span="2">
            {{ getScenesStatus(viewingLog) }}
          </el-descriptions-item>
          <el-descriptions-item label="监控抽查" :span="1">
            {{ viewingLog.monitorCheck?.checked ? `${viewingLog.monitorCheck.count || 1}次` : '未抽查' }}
          </el-descriptions-item>
          <el-descriptions-item label="警戒具检察" :span="1">
            {{ viewingLog.policeEquipment?.checked ? `${viewingLog.policeEquipment.count}人` : '未检察' }}
          </el-descriptions-item>
          <el-descriptions-item label="检察监督情况" :span="2">
            {{ viewingLog.supervisionSituation || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="采纳反馈情况" :span="2">
            {{ viewingLog.feedbackSituation || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 附件列表 -->
        <el-divider content-position="left">
          <el-icon><Document /></el-icon>
          相关材料附件 ({{ viewingLogAttachments.length }})
        </el-divider>
        
        <div v-if="viewingLogAttachments.length > 0" class="attachments-list">
          <el-card 
            v-for="attachment in viewingLogAttachments" 
            :key="attachment.id"
            class="attachment-item"
            shadow="hover"
          >
            <div class="attachment-info">
              <!-- 文件图标 -->
              <el-icon class="file-icon" :size="40">
                <Picture v-if="isImage(attachment)" />
                <Document v-else-if="isDocument(attachment)" />
                <Files v-else />
              </el-icon>
              
              <!-- 文件信息 -->
              <div class="file-details">
                <div class="file-title">
                  <el-tag size="small" :type="attachment.category.startsWith('weekly') ? 'warning' : attachment.category.startsWith('monthly') ? 'success' : 'primary'">
                    {{ getAttachmentTitle(attachment) }}
                  </el-tag>
                </div>
                <div class="file-name">
                  <el-icon><Document /></el-icon>
                  {{ attachment.original_name || '未命名文件' }}
                </div>
                <div class="file-meta">
                  <span class="file-size">
                    <el-icon><Files /></el-icon>
                    {{ formatFileSize(attachment.file_size) }}
                  </span>
                  <span class="file-date">
                    <el-icon><Clock /></el-icon>
                    {{ formatDate(attachment.createdAt) }}
                  </span>
                </div>
              </div>
              
              <!-- 操作按钮 -->
              <el-button 
                type="primary" 
                :icon="Download" 
                size="small"
                @click="downloadAttachment(attachment)"
              >
                下载
              </el-button>
            </div>
          </el-card>
        </div>
        <el-empty v-else description="暂无附件" :image-size="80" />
      </template>
      <template #footer>
        <el-button @click="closeLogDetail">关闭</el-button>
        <el-button type="success" :icon="Download" @click="exportHistoryLog(viewingLog); closeLogDetail()">
          导出Word
        </el-button>
      </template>
    </el-dialog>

    <!-- 日志编辑弹窗 (12个字段) -->
    <el-dialog 
      v-model="showEditDialog"
      title="编辑日志"
      width="700px"
    >
      <el-form :model="editForm" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="1.派驻监所">
              <el-input v-model="editForm.field1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="2.派驻人员">
              <el-input v-model="editForm.field2" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="3.日期">
              <el-input v-model="editForm.field3" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="4.填写人">
              <el-input v-model="editForm.field4" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="5.现场检察位置">
          <el-input v-model="editForm.field5" type="textarea" :rows="2" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="6.严管新增">
              <el-input v-model="editForm.field6" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="7.警戒具人数">
              <el-input v-model="editForm.field7" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="8.收押/调出">
              <el-input v-model="editForm.field8" placeholder="入:0/出:0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="9.检察监督情况">
          <el-input v-model="editForm.field9" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="10.采纳反馈">
          <el-input v-model="editForm.field10" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="11.其他监督">
          <el-input v-model="editForm.field11" type="textarea" :rows="3" placeholder="周检察、月检察、及时检察等" />
        </el-form-item>
        <el-form-item label="12.其他反馈">
          <el-input v-model="editForm.field12" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 日志预览弹窗 -->
    <el-dialog 
      v-model="showPreviewDialog" 
      title="日志预览"
      width="700px"
    >
      <template v-if="previewData">
        <div class="preview-container">
          <div class="preview-header">
            <h2>江西省南昌长堎地区人民检察院</h2>
            <h3 class="preview-title">智慧派驻检察系统 - 派驻检察工作日志</h3>
          </div>
          
          <el-descriptions :column="4" border size="small">
            <el-descriptions-item label="派驻监所">
              {{ previewData.header.prisonName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="派驻人员">
              {{ previewData.header.inspectorName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="日期">
              {{ previewData.header.date || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="填写人">
              {{ previewData.header.writer || '-' }}
            </el-descriptions-item>
          </el-descriptions>
          
          <el-divider content-position="left">日工作事项</el-divider>
          
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="三大现场检察地点" :span="2">
              <pre style="white-space: pre-wrap; margin: 0;">{{ previewData.dailyWork.sceneLocations }}</pre>
            </el-descriptions-item>
            <el-descriptions-item label="严管禁闭新增">
              {{ previewData.dailyWork.strictControlNew }}人
            </el-descriptions-item>
            <el-descriptions-item label="警戒具新增">
              {{ previewData.dailyWork.policeEquipmentNew }}人
            </el-descriptions-item>
            <el-descriptions-item label="涉黑罪犯">
              新增: {{ previewData.dailyWork.gangPrisoners.new }}, 总数: {{ previewData.dailyWork.gangPrisoners.total }}
            </el-descriptions-item>
            <el-descriptions-item label="收押/调出">
              收押: {{ previewData.dailyWork.admission.in }}, 调出: {{ previewData.dailyWork.admission.out }}
            </el-descriptions-item>
            <el-descriptions-item label="检察监督情况" :span="2">
              {{ previewData.dailyWork.supervisionSituation || '(待填写)' }}
            </el-descriptions-item>
            <el-descriptions-item label="采纳反馈情况" :span="2">
              {{ previewData.dailyWork.feedbackSituation || '-' }}
            </el-descriptions-item>
          </el-descriptions>
          
          <el-divider content-position="left">其它检察工作情况</el-divider>
          
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="检察监督情况">
              {{ previewData.otherWork.supervisionSituation || '(周/月/及时检察工作具体情况)' }}
            </el-descriptions-item>
            <el-descriptions-item label="采纳反馈情况">
              {{ previewData.otherWork.feedbackSituation || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </template>
      
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button type="success" :icon="Download" @click="exportCurrentLog(); showPreviewDialog = false">
          导出Word
        </el-button>
      </template>
    </el-dialog>

    <!-- 周检察弹窗 -->
    <el-dialog 
      v-model="showWeeklyDialog" 
      title="填写周检察内容"
      width="800px"
    >
      <el-form :model="weeklyFormData" label-width="140px" label-position="top">
        <el-divider content-position="left">医院/禁闭室检察</el-divider>
        
        <el-form-item>
          <el-checkbox v-model="weeklyFormData.hospital_check.checked" border size="large">
            已检察监狱医院/禁闭室
          </el-checkbox>
        </el-form-item>
        
        <template v-if="weeklyFormData.hospital_check.checked">
          <el-form-item label="检察重点">
            <el-checkbox v-model="weeklyFormData.hospital_check.focusAreas.policeEquipment">警械使用</el-checkbox>
            <el-checkbox v-model="weeklyFormData.hospital_check.focusAreas.strictControl">严管适用</el-checkbox>
            <el-checkbox v-model="weeklyFormData.hospital_check.focusAreas.confinement">禁闭适用</el-checkbox>
          </el-form-item>
          
          <el-form-item label="是否发现异常">
            <el-switch v-model="weeklyFormData.hospital_check.hasAnomalies" />
          </el-form-item>
          
          <el-form-item v-if="weeklyFormData.hospital_check.hasAnomalies" label="异常说明">
            <el-input v-model="weeklyFormData.hospital_check.anomalyDescription" type="textarea" :rows="2" placeholder="描述发现的异常情况..." />
          </el-form-item>
          
          <el-form-item label="相关附件（照片/视频）">
            <el-upload
              ref="weeklyHospitalUploadRef"
              action="#"
              :auto-upload="false"
              list-type="picture-card"
              :limit="10"
              accept=".jpg,.jpeg,.png,.mp4,.mov"
              :on-change="handleWeeklyHospitalChange"
              :on-remove="handleWeeklyHospitalChange"
            >
              <el-icon><Plus /></el-icon>
              <template #tip>
                <div class="el-upload__tip">支持照片、视频格式</div>
              </template>
            </el-upload>
          </el-form-item>
        </template>
        
        <el-divider content-position="left">外伤检察</el-divider>
        
        <el-form-item label="是否发现外伤">
          <el-switch v-model="weeklyFormData.injury_check.found" />
        </el-form-item>
        
        <template v-if="weeklyFormData.injury_check.found">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="外伤人次">
                <el-input-number v-model="weeklyFormData.injury_check.count" :min="0" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否逐一核实">
                <el-switch v-model="weeklyFormData.injury_check.verified" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="外伤情况描述">
            <el-input v-model="weeklyFormData.injury_check.anomalyDescription" type="textarea" :rows="2" placeholder="描述外伤情况..." />
          </el-form-item>
          
          <el-form-item label="是否上传笔录">
            <el-switch v-model="weeklyFormData.injury_check.transcriptUploaded" />
          </el-form-item>
          
          <el-form-item label="相关附件（照片/医疗报告）">
            <el-upload
              ref="weeklyInjuryUploadRef"
              action="#"
              :auto-upload="false"
              list-type="picture-card"
              :limit="10"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              :on-change="handleWeeklyInjuryChange"
              :on-remove="handleWeeklyInjuryChange"
            >
              <el-icon><Plus /></el-icon>
              <template #tip>
                <div class="el-upload__tip">支持照片、PDF、Word 格式</div>
              </template>
            </el-upload>
          </el-form-item>
        </template>
        
        <el-divider content-position="left">罪犯谈话记录</el-divider>
        
        <el-form-item>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span>已添加 {{ weeklyFormData.talk_records.length }} 条谈话记录</span>
            <el-button type="primary" size="small" @click="showWeeklyTalkDialog = true">添加谈话</el-button>
          </div>
          
          <div v-if="weeklyFormData.talk_records.length > 0" style="max-height: 200px; overflow-y: auto;">
            <el-tag 
              v-for="(record, index) in weeklyFormData.talk_records" 
              :key="record.id"
              closable
              @close="weeklyFormData.talk_records.splice(index, 1)"
              style="margin: 4px;"
              :type="record.type === 'newPrisoner' ? 'primary' : 
                    record.type === 'release' ? 'success' : 
                    record.type === 'injury' ? 'warning' : 'danger'"
            >
              {{ record.typeLabel }}: {{ record.prisonerName }}
            </el-tag>
          </div>
        </el-form-item>
        
        <el-divider content-position="left">检察官信箱</el-divider>
        
        <el-form-item label="是否开启信箱">
          <el-switch v-model="weeklyFormData.mailbox.opened" />
        </el-form-item>
        
        <template v-if="weeklyFormData.mailbox.opened">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="开启次数">
                <el-input-number v-model="weeklyFormData.mailbox.openCount" :min="0" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="收到信件数">
                <el-input-number v-model="weeklyFormData.mailbox.receivedCount" :min="0" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="是否有价值线索">
            <el-switch v-model="weeklyFormData.mailbox.valuableClues" />
          </el-form-item>
          
          <el-form-item v-if="weeklyFormData.mailbox.valuableClues" label="线索描述">
            <el-input v-model="weeklyFormData.mailbox.clueDescription" type="textarea" :rows="2" placeholder="描述发现的线索..." />
          </el-form-item>
        </template>
        
        <el-divider content-position="left">违禁品排查</el-divider>
        
        <el-form-item>
          <el-checkbox v-model="weeklyFormData.contraband.checked" border size="large">
            已进行违禁品排查
          </el-checkbox>
        </el-form-item>
        
        <template v-if="weeklyFormData.contraband.checked">
          <el-form-item label="是否发现违禁品">
            <el-switch v-model="weeklyFormData.contraband.found" />
          </el-form-item>
          
          <template v-if="weeklyFormData.contraband.found">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="发现次数">
                  <el-input-number v-model="weeklyFormData.contraband.foundCount" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="涉及人数">
                  <el-input-number v-model="weeklyFormData.contraband.involvedCount" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="情况描述">
              <el-input v-model="weeklyFormData.contraband.description" type="textarea" :rows="2" placeholder="描述发现的违禁品..." />
            </el-form-item>
            
            <el-form-item label="违禁品照片">
              <el-upload
                ref="weeklyContrabandUploadRef"
                action="#"
                :auto-upload="false"
                list-type="picture-card"
                :limit="10"
                accept=".jpg,.jpeg,.png"
                :on-change="handleWeeklyContrabandChange"
                :on-remove="handleWeeklyContrabandChange"
              >
                <el-icon><Plus /></el-icon>
                <template #tip>
                  <div class="el-upload__tip">上传违禁品照片</div>
                </template>
              </el-upload>
            </el-form-item>
          </template>
        </template>
      </el-form>
      
      <template #footer>
        <el-text type="info" size="small" style="margin-right: auto;">草稿自动保存中</el-text>
        <el-button @click="showWeeklyDialog = false">取消</el-button>
        <el-button type="primary" @click="syncWeeklyToLog">同步到日志</el-button>
      </template>
    </el-dialog>

    <!-- 周检察 - 谈话记录子对话框 -->
    <el-dialog 
      v-model="showWeeklyTalkDialog" 
      title="添加罪犯谈话记录"
      width="600px"
      append-to-body
    >
      <el-form :model="weeklyTalkForm" label-width="100px">
        <el-form-item label="谈话类型" required>
          <el-radio-group v-model="weeklyTalkForm.type">
            <el-radio-button 
              v-for="type in talkTypes" 
              :key="type.value" 
              :value="type.value"
            >
              {{ type.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="罪犯姓名" required>
              <el-input v-model="weeklyTalkForm.prisonerName" placeholder="输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="罪犯编号">
              <el-input v-model="weeklyTalkForm.prisonerId" placeholder="输入编号" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="谈话日期">
          <el-date-picker 
            v-model="weeklyTalkForm.date" 
            type="date" 
            style="width: 100%" 
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="谈话内容" required>
          <el-input 
            v-model="weeklyTalkForm.content" 
            type="textarea" 
            :rows="4"
            placeholder="记录谈话要点..."
          />
        </el-form-item>
        
        <el-form-item label="是否上传笔录">
          <el-switch v-model="weeklyTalkForm.transcriptUploaded" />
        </el-form-item>
        
        <el-form-item v-if="weeklyTalkForm.transcriptUploaded" label="谈话笔录">
          <el-upload
            ref="weeklyTalkUploadRef"
            action="#"
            :auto-upload="false"
            :limit="1"
            accept=".pdf,.doc,.docx"
            :on-change="handleWeeklyTalkChange"
            :on-remove="handleWeeklyTalkChange"
          >
            <el-button type="primary">上传笔录扫描件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 PDF、Word 格式</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showWeeklyTalkDialog = false">取消</el-button>
        <el-button type="primary" @click="addWeeklyTalkRecord">确定添加</el-button>
      </template>
    </el-dialog>

    <!-- 月检察弹窗 -->
    <el-dialog 
      v-model="showMonthlyDialog" 
      title="填写月检察内容"
      width="800px"
    >
      <el-form :model="monthlyFormData" label-width="140px" label-position="top">
        <el-divider content-position="left">会见检察</el-divider>
        
        <el-form-item label="是否开展检察">
          <el-switch v-model="monthlyFormData.visit_check.checked" />
        </el-form-item>
        
        <template v-if="monthlyFormData.visit_check.checked">
          <el-form-item label="检察次数">
            <el-input-number v-model="monthlyFormData.visit_check.visitCount" :min="0" style="width: 100%" />
          </el-form-item>
          
          <el-form-item label="是否发现问题">
            <el-switch v-model="monthlyFormData.visit_check.issuesFound" />
          </el-form-item>
          
          <el-form-item v-if="monthlyFormData.visit_check.issuesFound" label="问题描述">
            <el-input v-model="monthlyFormData.visit_check.description" type="textarea" :rows="2" placeholder="描述发现的问题..." />
          </el-form-item>
        </template>
        
        <el-divider content-position="left">参加会议</el-divider>
        
        <el-form-item label="是否参加">
          <el-switch v-model="monthlyFormData.meeting.participated" />
        </el-form-item>
        
        <template v-if="monthlyFormData.meeting.participated">
          <el-form-item label="会议类型">
            <el-select v-model="monthlyFormData.meeting.meetingType" style="width: 100%">
              <el-option value="lifeSentence" label="无期死缓评审会" />
              <el-option value="parole" label="减刑假释评审会" />
              <el-option value="analysis" label="犯情分析会" />
              <el-option value="other" label="其他会议" />
            </el-select>
          </el-form-item>
          
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="参加次数">
                <el-input-number v-model="monthlyFormData.meeting.count" :min="0" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="角色">
                <el-select v-model="monthlyFormData.meeting.role" style="width: 100%">
                  <el-option value="listener" label="列席" />
                  <el-option value="speaker" label="发言" />
                  <el-option value="advisor" label="提出意见" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="会议日期">
            <el-date-picker 
              v-model="monthlyFormData.meeting.meetingDate" 
              type="date" 
              style="width: 100%" 
              value-format="YYYY-MM-DD"
              placeholder="选择会议日期"
            />
          </el-form-item>
          
          <el-form-item label="会议记录">
            <el-input v-model="monthlyFormData.meeting.notes" type="textarea" :rows="2" placeholder="记录会议要点..." />
          </el-form-item>
        </template>
        
        <el-divider content-position="left">处分监督</el-divider>
        
        <el-form-item label="是否存在处分">
          <el-switch v-model="monthlyFormData.punishment.exists" />
        </el-form-item>
        
        <template v-if="monthlyFormData.punishment.exists">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="记过人数">
                <el-input-number v-model="monthlyFormData.punishment.recordCount" :min="0" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="禁闭人数">
                <el-input-number v-model="monthlyFormData.punishment.confinementCount" :min="0" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="是否监督到位">
            <el-switch v-model="monthlyFormData.punishment.supervised" />
          </el-form-item>
          
          <el-form-item label="处分原因">
            <el-input v-model="monthlyFormData.punishment.reason" type="textarea" :rows="2" placeholder="记录处分原因..." />
          </el-form-item>
          
          <el-form-item label="是否上传证据">
            <el-switch v-model="monthlyFormData.punishment.evidenceUploaded" />
          </el-form-item>
          
          <el-form-item v-if="monthlyFormData.punishment.evidenceUploaded" label="证据材料">
            <el-upload
              ref="monthlyPunishmentUploadRef"
              action="#"
              :auto-upload="false"
              :limit="10"
              accept=".pdf,.doc,.docx,.jpg,.png"
              :on-change="handleMonthlyPunishmentChange"
              :on-remove="handleMonthlyPunishmentChange"
            >
              <el-button type="primary">上传证据/笔录</el-button>
              <template #tip>
                <div class="el-upload__tip">支持 PDF、Word、图片格式</div>
              </template>
            </el-upload>
          </el-form-item>
        </template>
        
        <el-divider content-position="left">岗位变动</el-divider>
        
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="月初人数">
              <el-input-number v-model="monthlyFormData.position_stats.startCount" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="月末人数">
              <el-input-number v-model="monthlyFormData.position_stats.endCount" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="增加人数">
              <el-input-number v-model="monthlyFormData.position_stats.increase" :min="0" style="width: 100%" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="减少人数">
              <el-input-number v-model="monthlyFormData.position_stats.decrease" :min="0" style="width: 100%" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="变动原因（选填）">
          <el-input v-model="monthlyFormData.position_stats.reason" type="textarea" :rows="2" placeholder="说明岗位变动原因..." />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-text type="info" size="small" style="margin-right: auto;">草稿自动保存中</el-text>
        <el-button @click="showMonthlyDialog = false">取消</el-button>
        <el-button type="primary" @click="syncMonthlyToLog">同步到日志</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.daily-check-page {
  max-width: 900px;
  margin: 0 auto;
}

.view-toggle {
  margin-bottom: 20px;
  text-align: center;
}

.view-toggle .el-radio-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.form-card,
.history-card {
  border-radius: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.filter-form {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.filter-form .el-form-item {
  margin-bottom: 0;
}

.date-display {
  font-size: 14px;
  color: #909399;
  background: #f5f7fa;
  padding: 6px 12px;
  border-radius: 6px;
}

.three-scenes-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.scene-card {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.scene-card.scene-checked {
  border-color: #409EFF;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

.scene-header {
  display: flex;
  align-items: center;
}

.scene-card :deep(.el-card__header) {
  padding: 12px 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
}

.scene-card.scene-checked :deep(.el-card__header) {
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
}

.scene-card :deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.scene-card :deep(.el-checkbox.is-bordered) {
  margin-right: 0;
}

.anomaly-list {
  margin-top: 16px;
  width: 100%;
}

.anomaly-card {
  margin-bottom: 12px;
}

.anomaly-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.anomaly-location {
  font-weight: 600;
  color: #F56C6C;
}

.anomaly-time {
  font-size: 12px;
  color: #909399;
  flex: 1;
}

.anomaly-desc {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  width: 100%;
  padding-top: 16px;
  flex-wrap: wrap;
}

.jump-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.synced-content {
  margin-top: 12px;
}

.synced-content pre {
  font-family: inherit;
}

.preview-container {
  max-height: 60vh;
  overflow-y: auto;
}

.preview-header {
  text-align: center;
  margin-bottom: 20px;
}

.preview-header h2 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

.preview-title {
  color: #0066cc;
  font-size: 16px;
}

/* 平板适配 */
@media (max-width: 1024px) {
  .scene-checkboxes .el-checkbox {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .el-button {
    width: 100%;
  }
}

/* 附件列表样式 */
.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.attachment-item {
  border-radius: 8px;
}

.attachment-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.file-icon {
  font-size: 40px;
  color: #409EFF;
  flex-shrink: 0;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-title {
  margin-bottom: 8px;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.file-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.file-size {
  color: #909399;
}

.file-date {
  color: #909399;
}
</style>
