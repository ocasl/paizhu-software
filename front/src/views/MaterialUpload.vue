<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useReportStore } from '../stores/report'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Document, FolderOpened, Check, Close, Camera, Refresh, Warning, Iphone, Calendar } from '@element-plus/icons-vue'
import CameraCapture from '../components/CameraCapture.vue'

const router = useRouter()
const reportStore = useReportStore()

// API基础路径
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'

// 获取本地日期字符串（避免时区问题）
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取本地年月字符串
function getLocalYearMonth(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

// 当前选择的月份（用于数据抓取材料）
const selectedMonth = ref(getLocalYearMonth())

// 获取token
function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

// ========== 平板同步ZIP导入 ==========
const tabletSyncLoading = ref(false)
const tabletSyncResult = ref(null)

async function handleTabletSyncUpload(file) {
  // 验证文件类型
  if (!file.name.endsWith('.zip')) {
    ElMessage.warning('请上传ZIP格式的同步包')
    return false
  }
  
  // 验证文件大小 (最大500MB)
  if (file.size > 500 * 1024 * 1024) {
    ElMessage.warning('文件大小不能超过500MB')
    return false
  }
  
  tabletSyncLoading.value = true
  tabletSyncResult.value = null
  
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${API_BASE}/tablet-sync/import`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || '导入失败')
    }
    
    tabletSyncResult.value = result
    
    // 计算总数
    const totalInserted = (result.result?.daily_logs?.inserted || 0) +
                          (result.result?.weekly_records?.inserted || 0) +
                          (result.result?.monthly_records?.inserted || 0) +
                          (result.result?.immediate_events?.inserted || 0)
    const totalUpdated = (result.result?.daily_logs?.updated || 0) +
                         (result.result?.weekly_records?.updated || 0) +
                         (result.result?.monthly_records?.updated || 0) +
                         (result.result?.immediate_events?.updated || 0)
    
    ElMessage.success({
      message: `平板数据同步成功！新增 ${totalInserted} 条，更新 ${totalUpdated} 条，附件 ${result.result?.attachments?.copied || 0} 个`,
      duration: 8000
    })
    
  } catch (error) {
    console.error('平板同步失败:', error)
    tabletSyncResult.value = { error: error.message }
    ElMessage.error('平板同步失败: ' + error.message)
  } finally {
    tabletSyncLoading.value = false
  }
  
  return false // 阻止el-upload默认行为
}

// 上传类别 - (五)用于数据抓取 - 模板解析类
const dataExtractionCategories = [
  {
    id: 'criminal-report',
    name: '1. 犯情动态',
    desc: '上传犯情动态Word文档，系统自动解析罪犯构成、违纪等统计数据',
    accept: '.doc,.docx',
    icon: Document,
    color: '#9C27B0',
    files: [],
    endpoint: '/template-sync/criminal-report',
    isSync: true
  },
  {
    id: 'strict-education',
    name: '2. 严管教育审批',
    desc: '上传严管教育审批Excel文件，系统自动解析并同步数据',
    accept: '.xlsx,.xls',
    icon: Document,
    color: '#F56C6C',
    files: [],
    endpoint: '/template-sync/strict-education',
    isSync: true
  },
  {
    id: 'confinement',
    name: '3. 禁闭审批',
    desc: '上传禁闭审批Excel文件，系统自动解析并同步数据',
    accept: '.xlsx,.xls',
    icon: Document,
    color: '#E6A23C',
    files: [],
    endpoint: '/template-sync/confinement',
    isSync: true
  },
  {
    id: 'blacklist',
    name: '4. 涉黑恶名单',
    desc: '上传涉黑恶人员名单Excel文件，系统自动解析并同步数据',
    accept: '.xlsx,.xls',
    icon: Document,
    color: '#909399',
    files: [],
    endpoint: '/template-sync/blacklist',
    isSync: true
  },
  {
    id: 'restraint',
    name: '5. 戒具使用审批',
    desc: '上传戒具使用审批Excel文件，系统自动解析并同步数据',
    accept: '.xlsx,.xls',
    icon: Document,
    color: '#409EFF',
    files: [],
    endpoint: '/template-sync/restraint',
    isSync: true
  },
  {
    id: 'mail',
    name: '6. 信件汇总',
    desc: '上传信件汇总Excel文件，系统自动解析并同步数据',
    accept: '.xlsx,.xls',
    icon: Document,
    color: '#67C23A',
    files: [],
    endpoint: '/template-sync/mail',
    isSync: true
  },
  {
    id: 'scene-photos',
    name: '7. 现场检察照片',
    desc: '三大现场检察、监控检察等现场拍摄的照片',
    accept: 'image/*',
    icon: Camera,
    color: '#00BCD4',
    files: [],
    allowCamera: true // 支持拍照
  }
]

// 模板解析上传状态
const syncLoading = reactive({})
const syncResults = reactive({})

// 初始化同步状态
dataExtractionCategories.filter(c => c.isSync).forEach(cat => {
  syncLoading[cat.id] = false
  syncResults[cat.id] = null
})

// 刷新报告预览数据
async function refreshReportData() {
  try {
    const token = localStorage.getItem('token')
    const month = selectedMonth.value
    const [year, monthNum] = month.split('-')
    const startDate = `${year}-${monthNum}-01`
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0]
    
    // 获取当前用户的监狱名称
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const prisonName = user.prison_name || user.prisonName || ''
    
    // 并行加载基本信息和信件统计
    const promises = [
      fetch(`${API_BASE}/monthly-basic-info/${month}${prisonName ? `?prison_name=${prisonName}` : ''}`, {
        headers: getAuthHeaders()
      })
    ]
    
    // 如果有监狱名称，加载信件统计
    if (prisonName) {
      promises.push(
        fetch(`${API_BASE}/template-sync/mail-stats/${month}?prison_name=${prisonName}`, {
          headers: getAuthHeaders()
        })
      )
    }
    
    const responses = await Promise.all(promises)
    const [basicInfoRes, mailStatsRes] = responses
    
    // 处理基本信息
    if (basicInfoRes.ok || basicInfoRes.status === 404) {
      const data = basicInfoRes.ok ? await basicInfoRes.json() : { success: true, data: null }
      
      // 更新reportStore的基本信息
      if (data.data) {
        const info = data.data
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
        
        console.log('✅ 报告数据已刷新:', {
          gangRelated: info.gang_related,
          evilForces: info.evil_forces,
          confinementPunishments: info.confinement_punishments,
          recordedPunishments: info.recorded_punishments
        })
      }
    }
    
    // 🔥 处理信件统计
    if (mailStatsRes && mailStatsRes.ok) {
      const mailData = await mailStatsRes.json()
      if (mailData.success && mailData.data) {
        // 延迟设置，确保覆盖 watch 的计算值
        setTimeout(() => {
          reportStore.setMailCount(mailData.data.mailCount || 0)
        }, 100)
      }
    }
  } catch (error) {
    console.error('刷新报告数据失败:', error)
    // 不显示错误提示，避免干扰用户
  }
}

// 上传类别 - (六)用于代替原来装卷的材料
const archiveCategories = [
  {
    id: 'release-transcript',
    name: '1. 刑释罪犯谈话笔录',
    desc: '当月内监狱刑释罪犯的个别谈话笔录',
    accept: '.pdf,.doc,.docx,.jpg,.png',
    icon: FolderOpened,
    color: '#409EFF',
    files: [],
    countType: 'release-transcript'
  },
  {
    id: 'injury-transcript',
    name: '2. 外伤就诊谈话笔录',
    desc: '当月内监狱新增外伤就诊罪犯个别谈话笔录',
    accept: '.pdf,.doc,.docx,.jpg,.png',
    icon: FolderOpened,
    color: '#67C23A',
    files: [],
    countType: 'injury-transcript'
  },
  {
    id: 'discipline-transcript',
    name: '3. 严管禁闭谈话笔录',
    desc: '当月内监狱新增严管禁闭罪犯个别谈话笔录',
    accept: '.pdf,.doc,.docx,.jpg,.png',
    icon: FolderOpened,
    color: '#E6A23C',
    files: [],
    countType: 'confinement-transcript'
  },
  {
    id: 'special-visit-transcript',
    name: '4. 非常规会见谈话笔录',
    desc: '当月内监狱非常规会见、亲情电话罪犯个别谈话笔录',
    accept: '.pdf,.doc,.docx,.jpg,.png',
    icon: FolderOpened,
    color: '#F56C6C',
    files: [],
    countType: 'visit-transcript'
  },
  {
    id: 'abnormal-questionnaire',
    name: '5. 异常调查问卷',
    desc: '有异常情况的调查问卷（描述异常的情况简介及调查核实情况）',
    accept: '.pdf,.doc,.docx,.xls,.xlsx',
    icon: Document,
    color: '#7B68EE',
    files: [],
    countType: 'questionnaire'
  },
  {
    id: 'other-materials',
    name: '6. 其他重大工作材料',
    desc: '月内其他重大派驻检察工作事项材料',
    accept: '*',
    icon: Upload,
    color: '#909399',
    files: []
  },
  {
    id: 'new-admission-transcript',
    name: '7. 新进罪犯谈话笔录',
    desc: '当月内监狱新进（含个别调入、临时出监返回）罪犯的个别谈话笔录',
    accept: '.pdf,.doc,.docx,.jpg,.png',
    icon: FolderOpened,
    color: '#9C27B0',
    files: [],
    countType: 'new-prisoner-transcript',
    allowCamera: true // 支持拍照
  }
]

// 合并所有类别
const uploadCategories = [...dataExtractionCategories, ...archiveCategories]

// 上传文件列表
const categoryFiles = reactive(
  Object.fromEntries(uploadCategories.map(c => [c.id, []]))
)

// 总上传数量
const totalFilesCount = computed(() => {
  return Object.values(categoryFiles).reduce((sum, files) => sum + files.length, 0)
})

// 查找类别配置
function getCategoryConfig(categoryId) {
  return uploadCategories.find(c => c.id === categoryId)
}

// 处理模板同步上传（用于数据抓取类）
async function handleSyncUpload(categoryId, file) {
  const category = getCategoryConfig(categoryId)
  if (!category || !category.isSync) return false
  
  // 验证文件类型
  const fileName = file.name.toLowerCase()
  const acceptExts = category.accept.split(',').map(ext => ext.trim())
  const fileExt = '.' + fileName.split('.').pop()
  
  if (!acceptExts.includes(fileExt)) {
    ElMessage.warning(`请上传正确的文件格式：${category.accept}`)
    return false
  }
  
  // 验证文件大小
  if (file.size > 50 * 1024 * 1024) {
    ElMessage.warning('文件大小不能超过50MB')
    return false
  }
  
  syncLoading[categoryId] = true
  syncResults[categoryId] = null
  
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_month', selectedMonth.value)  // 数据归属月份
    
    console.log(`📤 上传数据抓取材料: ${category.name}`)
    console.log(`  归属月份: ${selectedMonth.value}`)
    console.log(`  文件名: ${file.name}`)
    
    const response = await fetch(`${API_BASE}${category.endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || '上传失败')
    }
    
    syncResults[categoryId] = result
    
    ElMessage.success({
      message: `${category.name}同步成功！新增 ${result.stats?.inserted || 0} 条，更新 ${result.stats?.updated || 0} 条（归属月份：${selectedMonth.value}）`,
      duration: 5000
    })
    
    // 刷新报告预览数据（如果在同一个月份）
    if (reportStore.currentMonth === selectedMonth.value) {
      console.log('📊 刷新报告预览数据...')
      await refreshReportData()
    }
    
  } catch (error) {
    console.error('上传失败:', error)
    syncResults[categoryId] = { error: error.message }
    ElMessage.error('上传失败: ' + error.message)
  } finally {
    syncLoading[categoryId] = false
  }
  
  return false // 阻止el-upload默认上传行为
}

// 处理普通文件变化（用于归档类）- 立即上传并清理
function handleFileChange(categoryId, file, fileList) {
  // 不保存到categoryFiles,避免状态阻塞
  // categoryFiles[categoryId] = fileList
  
  const category = getCategoryConfig(categoryId)
  if (!category) return
  
  // 立即上传新添加的文件
  if (file.status === 'ready' && file.raw) {
    uploadSingleFile(categoryId, file).catch(err => {
      console.error('后台上传失败:', err)
    })
  }
}

// 上传单个文件 - 简化版本,不保存状态
async function uploadSingleFile(categoryId, fileObj) {
  try {
    const formData = new FormData()
    formData.append('files', fileObj.raw)
    formData.append('category', categoryId)
    formData.append('upload_month', selectedMonth.value)
    
    const response = await fetch(`${API_BASE}/attachments/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('上传失败')
    }
    
    ElMessage.success(`${fileObj.name} 上传成功`)
    
    return await response.json()
  } catch (error) {
    console.error('上传文件失败:', fileObj.name, error)
    ElMessage.error(`${fileObj.name} 上传失败`)
    throw error
  }
}

// 移除文件
function handleFileRemove(categoryId, file, fileList) {
  categoryFiles[categoryId] = fileList
  
  const category = getCategoryConfig(categoryId)
  if (category?.countType) {
    reportStore.updateAttachmentCount(category.countType, fileList.length)
  }
}

// 上传前验证
function beforeUpload(file) {
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    ElMessage.warning('文件大小不能超过 50MB')
    return false
  }
  return true
}

// 提交所有上传
async function submitAllUploads() {
  if (totalFilesCount.value === 0) {
    ElMessage.warning('请至少选择一个文件上传')
    return
  }
  
  const uploadingMessage = ElMessage.info({
    message: '正在上传文件...',
    duration: 0
  })
  
  try {
    const allFiles = []
    for (const [categoryId, files] of Object.entries(categoryFiles)) {
      for (const file of files) {
        allFiles.push({
          category: categoryId,
          file: file.raw,
          name: file.name
        })
      }
    }
    
    // 直接上传到服务器
    let successCount = 0
    let failCount = 0
    
    for (const { category, file, name } of allFiles) {
      try {
        const formData = new FormData()
        formData.append('files', file)  // 改为 'files' 匹配后端
        formData.append('category', category)
        formData.append('upload_month', selectedMonth.value)
        
        const response = await fetch(`${API_BASE}/attachments/upload`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData
        })
        
        if (!response.ok) {
          throw new Error('上传失败')
        }
        
        successCount++
      } catch (error) {
        console.error(`上传文件失败: ${name}`, error)
        failCount++
      }
    }
    
    uploadingMessage.close()
    
    if (failCount === 0) {
      ElMessage.success(`成功上传 ${successCount} 个文件`)
    } else {
      ElMessage.warning(`上传完成：成功 ${successCount} 个，失败 ${failCount} 个`)
    }
    
    // 同步材料统计到报告 Store
    for (const [categoryId, files] of Object.entries(categoryFiles)) {
      if (files.length > 0) {
        reportStore.addUploadedMaterial({
          category: categoryId,
          count: files.length,
          fileNames: files.map(f => f.name)
        })
      }
    }
    
    // 清空文件列表
    for (const key of Object.keys(categoryFiles)) {
      categoryFiles[key] = []
    }
  } catch (error) {
    uploadingMessage.close()
    ElMessage.error('上传失败: ' + error.message)
  }
}

// 拍照功能
const showCameraDialog = ref(false)
const currentCameraCategory = ref(null)

function openCamera(categoryId) {
  currentCameraCategory.value = categoryId
  showCameraDialog.value = true
}

function handleCameraCapture(file) {
  if (!currentCameraCategory.value) return
  
  const categoryId = currentCameraCategory.value
  // 将拍摄的照片添加到对应类别的文件列表
  const fileObj = {
    name: file.name,
    size: file.size,
    raw: file,
    uid: Date.now()
  }
  categoryFiles[categoryId].push(fileObj)
  
  // 更新附件计数
  const category = getCategoryConfig(categoryId)
  if (category?.countType) {
    reportStore.updateAttachmentCount(category.countType, categoryFiles[categoryId].length)
  }
  
  ElMessage.success('照片已添加到上传列表')
}

// 路由离开前的清理
onBeforeUnmount(() => {
  // 清理状态
  console.log('材料上传页面卸载')
})


</script>

<template>
  <div class="material-upload-page">
    <div class="page-header">
      <h2>材料上传中心</h2>
      <p>上传各类花名册、谈话笔录、调查问卷等材料</p>
      
      <!-- 月份选择器（用于数据抓取材料） -->
      <div class="month-selector">
        <el-icon><Calendar /></el-icon>
        <span class="label">数据归属月份：</span>
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          placeholder="选择月份"
          format="YYYY年MM月"
          value-format="YYYY-MM"
          size="large"
          style="width: 200px"
        />
        <el-text type="info" size="small" style="margin-left: 10px">
          上传的数据抓取材料将归属到此月份
        </el-text>
      </div>
    </div>

    <!-- 平板数据同步 -->
    <el-divider content-position="left">
      <el-tag type="success" size="large" effect="dark">平板离线数据同步</el-tag>
    </el-divider>

    <el-card class="tablet-sync-card" shadow="hover">
      <div class="sync-container">
        <div class="sync-info">
          <h3><el-icon><Iphone /></el-icon> 导入平板离线数据</h3>
          <p>请上传从平板导出的ZIP同步包（包含data.json数据和attachments附件）</p>
        </div>
        <div class="sync-action">
          <el-upload
            class="tablet-upload"
            :show-file-list="false"
            :before-upload="handleTabletSyncUpload"
            accept=".zip"
            action=""
          >
            <el-button type="primary" size="large" :loading="tabletSyncLoading" :icon="Upload">
              {{ tabletSyncLoading ? '正在同步...' : '选择ZIP同步包' }}
            </el-button>
          </el-upload>
        </div>
      </div>
      
      <!-- 同步结果显示 -->
      <div v-if="tabletSyncResult" class="sync-result-box" :class="{ error: tabletSyncResult.error }">
        <template v-if="tabletSyncResult.success">
          <div class="result-header">
            <el-icon color="#67C23A"><Check /></el-icon>
            <span class="success-text">同步成功</span>
            <span class="time">导出时间: {{ new Date(tabletSyncResult.exportTime).toLocaleString() }}</span>
          </div>
          <div class="result-stats">
            <div class="stat-item">
              <span class="label">日检察</span>
              <span class="value">+{{ tabletSyncResult.result.daily_logs.inserted }}</span>
            </div>
            <div class="stat-item">
              <span class="label">周检察</span>
              <span class="value">+{{ tabletSyncResult.result.weekly_records.inserted }}</span>
            </div>
            <div class="stat-item">
              <span class="label">月检察</span>
              <span class="value">+{{ tabletSyncResult.result.monthly_records.inserted }}</span>
            </div>
            <div class="stat-item">
              <span class="label">及时检察</span>
              <span class="value">+{{ tabletSyncResult.result.immediate_events.inserted }}</span>
            </div>
            <div class="stat-item">
              <span class="label">附件</span>
              <span class="value">{{ tabletSyncResult.result.attachments.copied }}个</span>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="result-header error">
            <el-icon><Warning /></el-icon>
            <span>{{ tabletSyncResult.error }}</span>
          </div>
        </template>
      </div>
    </el-card>

    <!-- (五)相关材料上传(用于数据抓取) -->
    <el-divider content-position="left">
      <el-tag type="primary" size="large">（五）相关材料上传（用于数据抓取）</el-tag>
    </el-divider>
    
    <div class="upload-grid">
      <el-card 
        v-for="category in dataExtractionCategories" 
        :key="category.id"
        class="upload-card"
        :body-style="{ padding: '20px' }"
      >
        <div class="card-header" :style="{ '--accent-color': category.color }">
          <div class="category-icon" :style="{ background: category.color }">
            <el-icon :size="24" color="#fff"><component :is="category.icon" /></el-icon>
          </div>
          <div class="category-info">
            <h4>{{ category.name }}</h4>
            <p>{{ category.desc }}</p>
          </div>
          <!-- 同步状态标签 -->
          <el-tag 
            v-if="syncResults[category.id] && !syncResults[category.id].error" 
            type="success"
            size="small"
          >
            +{{ syncResults[category.id].stats?.inserted || 0 }} / ↻{{ syncResults[category.id].stats?.updated || 0 }}
          </el-tag>
          <el-tag 
            v-else-if="syncResults[category.id]?.error" 
            type="danger"
            size="small"
          >
            失败
          </el-tag>
        </div>
        
        <!-- 模板同步类上传组件 -->
        <el-upload
          v-if="category.isSync"
          class="upload-area"
          drag
          action="#"
          :accept="category.accept"
          :before-upload="(file) => handleSyncUpload(category.id, file)"
          :show-file-list="false"
          :disabled="syncLoading[category.id]"
        >
          <div v-if="syncLoading[category.id]" class="uploading-state">
            <el-icon class="is-loading"><Refresh /></el-icon>
            <span>正在同步数据...</span>
          </div>
          <template v-else>
            <el-icon class="el-icon--upload"><Upload /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处，或 <em>点击选择</em>
            </div>
          </template>
          <template #tip>
            <div class="el-upload__tip">
              支持格式：{{ category.accept }}
            </div>
          </template>
        </el-upload>

        <!-- 同步结果显示 -->
        <div v-if="syncResults[category.id] && !syncResults[category.id].error && category.isSync" class="sync-result success">
          <el-icon color="#67C23A"><Check /></el-icon>
          <span>
            共 {{ syncResults[category.id].stats?.total || 0 }} 条，
            新增 {{ syncResults[category.id].stats?.inserted || 0 }} 条，
            更新 {{ syncResults[category.id].stats?.updated || 0 }} 条
          </span>
        </div>
        <div v-else-if="syncResults[category.id]?.error && category.isSync" class="sync-result error">
          <el-icon color="#F56C6C"><Warning /></el-icon>
          <span>{{ syncResults[category.id].error }}</span>
        </div>
        
        <!-- 普通上传组件（照片类） -->
        <el-upload
          v-if="!category.isSync"
          class="upload-area"
          drag
          action="#"
          :auto-upload="false"
          :accept="category.accept"
          multiple
          :show-file-list="false"
          :before-upload="beforeUpload"
          :on-change="(file, fileList) => handleFileChange(category.id, file, fileList)"
        >
          <el-icon class="el-icon--upload"><Upload /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处，或 <em>点击选择</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持格式：{{ category.accept === '*' ? '所有格式' : category.accept }}
            </div>
          </template>
        </el-upload>
        
        <!-- 拍照按钮 -->
        <el-button 
          v-if="category.allowCamera"
          type="primary" 
          :icon="Camera"
          class="camera-btn"
          @click="openCamera(category.id)"
        >
          拍照上传
        </el-button>
      </el-card>
    </div>

    <!-- (六)相关材料上传(用于代替原来装卷的材料) -->
    <el-divider content-position="left">
      <el-tag type="success" size="large">（六）相关材料上传（用于代替原来装卷的材料）</el-tag>
    </el-divider>
    
    <div class="upload-grid">
      <el-card 
        v-for="category in archiveCategories" 
        :key="category.id"
        class="upload-card"
        :body-style="{ padding: '20px' }"
      >
        <div class="card-header" :style="{ '--accent-color': category.color }">
          <div class="category-icon" :style="{ background: category.color }">
            <el-icon :size="24" color="#fff"><component :is="category.icon" /></el-icon>
          </div>
          <div class="category-info">
            <h4>{{ category.name }}</h4>
            <p>{{ category.desc }}</p>
          </div>
          <el-badge 
            v-if="categoryFiles[category.id].length > 0"
            :value="categoryFiles[category.id].length" 
            type="primary"
          />
        </div>
        
        <el-upload
          class="upload-area"
          drag
          action="#"
          :auto-upload="false"
          :accept="category.accept"
          multiple
          :show-file-list="false"
          :before-upload="beforeUpload"
          :on-change="(file, fileList) => handleFileChange(category.id, file, fileList)"
        >
          <el-icon class="el-icon--upload"><Upload /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处，或 <em>点击选择</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持格式：{{ category.accept === '*' ? '所有格式' : category.accept }}
            </div>
          </template>
        </el-upload>
        
        <!-- 拍照按钮 -->
        <el-button 
          v-if="category.allowCamera"
          type="primary" 
          :icon="Camera"
          class="camera-btn"
          @click="openCamera(category.id)"
        >
          拍照上传
        </el-button>
      </el-card>
    </div>

    <!-- 上传汇总 -->
    <div class="upload-summary" v-if="totalFilesCount > 0">
      <el-card>
        <div class="summary-content">
          <div class="summary-info">
            <el-icon :size="32" color="#67C23A"><Check /></el-icon>
            <div>
              <h4>已选择 {{ totalFilesCount }} 个文件</h4>
              <p>
                <span v-for="(files, key) in categoryFiles" :key="key" v-if="files.length > 0">
                  {{ uploadCategories.find(c => c.id === key)?.name }}: {{ files.length }}个 &nbsp;
                </span>
              </p>
              <p style="color: #67C23A; font-size: 13px; margin-top: 8px;">
                <el-icon><Check /></el-icon> 文件已自动上传
              </p>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 拍照弹窗 -->
    <CameraCapture 
      v-model:visible="showCameraDialog"
      @capture="handleCameraCapture"
    />
  </div>
</template>

<style scoped>
.material-upload-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.page-header p {
  color: #909399;
  margin-bottom: 16px;
}

/* 月份选择器样式 */
.month-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  margin-top: 16px;
}

.month-selector .el-icon {
  font-size: 20px;
  color: #fff;
}

.month-selector .label {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.month-selector :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.month-selector :deep(.el-input__inner) {
  font-weight: 600;
  color: #303133;
}

.month-selector .el-text {
  color: rgba(255, 255, 255, 0.9);
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.upload-card {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.upload-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--accent-color, #409EFF);
}

.category-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.category-info {
  flex: 1;
}

.category-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px;
}

.category-info p {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  padding: 20px;
  border-radius: 8px;
}

.upload-summary {
  margin-top: 24px;
  position: sticky;
  bottom: 24px;
}

.summary-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-info h4 {
  margin: 0 0 4px;
  font-size: 16px;
}

.summary-info p {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.offline-alert {
  margin-top: 24px;
}

/* 同步上传状态样式 */
.uploading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #409EFF;
}

.uploading-state .is-loading {
  font-size: 32px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.sync-result {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
}

.sync-result.success {
  background: #f0f9eb;
  color: #67C23A;
}

.sync-result.error {
  background: #fef0f0;
  color: #F56C6C;
}

.camera-btn {
  margin-top: 12px;
  width: 100%;
}

/* 平板适配 */
@media (max-width: 1024px) {
  .upload-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}

.tablet-sync-card {
  margin-bottom: 30px;
  border-left: 5px solid #67C23A;
  background: #f0f9eb;
}

.sync-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
}

.sync-info h3 {
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
}

.sync-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.sync-result-box {
  margin-top: 20px;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e1f3d8;
}

.sync-result-box.error {
  border-color: #fde2e2;
  background: #fef0f0;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: bold;
}

.result-header.error {
  color: #F56C6C;
}

.success-text {
  color: #67C23A;
}

.time {
  font-size: 13px;
  color: #909399;
  font-weight: normal;
  margin-left: auto;
}

.result-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f2f6fc;
  padding: 10px 20px;
  border-radius: 8px;
  min-width: 80px;
}

.stat-item .label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-item .value {
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
}
</style>
