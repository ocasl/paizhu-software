<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useReportStore } from '../stores/report'
import { useUserStore } from '../stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Warning, Plus, Delete, Download, View, Edit, Document, Upload } from '@element-plus/icons-vue'
import PrisonSelector from '../components/PrisonSelector.vue'

const reportStore = useReportStore()
const userStore = useUserStore()

// 监狱选择
const selectedPrison = ref('')

// 视图模式：'form' 新建事件，'history' 历史记录
const viewMode = ref('form')

// 历史记录列表
const historyEvents = ref([])
const loadingHistory = ref(false)

// 筛选条件
const filterMonth = ref('')
const filterDateRange = ref([])

// 分页相关
const currentEventPage = ref(1)
const eventPageSize = ref(10)

// 多选相关
const selectedEvents = ref([])

// 计算分页后的数据
const paginatedEvents = computed(() => {
  const start = (currentEventPage.value - 1) * eventPageSize.value
  const end = start + eventPageSize.value
  return historyEvents.value.slice(start, end)
})

// 处理多选变化
function handleEventSelectionChange(selection) {
  selectedEvents.value = selection
}

// 处理分页大小变化
function handleEventSizeChange(size) {
  eventPageSize.value = size
  currentEventPage.value = 1
}

// 处理页码变化
function handleEventPageChange(page) {
  currentEventPage.value = page
}

// 批量删除事件
async function batchDeleteEvents() {
  if (selectedEvents.value.length === 0) {
    ElMessage.warning('请先选择要删除的记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedEvents.value.length} 条记录吗？`,
      '批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

    // 逐个删除
    for (const event of selectedEvents.value) {
      await fetch(`${API_BASE}/api/immediate-events/${event.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    }

    ElMessage.success(`成功删除 ${selectedEvents.value.length} 条记录`)
    selectedEvents.value = []
    loadHistoryEvents()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 编辑相关
const editingEvent = ref(null)
const showEditDialog = ref(false)

// 详情相关
const viewingEvent = ref(null)
const showDetailDialog = ref(false)

// 事件类型
const eventTypes = [
  { value: 'escape', label: '脱逃事件', icon: 'danger' },
  { value: 'selfHarm', label: '自伤自杀', icon: 'danger' },
  { value: 'majorAccident', label: '重大事故', icon: 'danger' },
  { value: 'death', label: '罪犯死亡', icon: 'warning' },
  { value: 'majorActivity', label: '重大监管活动', icon: 'info' },
  { value: 'policeDiscipline', label: '民警受处分', icon: 'warning' },
  { value: 'paroleRequest', label: '减刑假释提请', icon: 'primary' }
]

// 事件记录列表
const eventRecords = ref([])

// 新事件表单
const showEventDialog = ref(false)
const eventForm = reactive({
  type: '',
  date: new Date(),
  title: '',
  description: '',
  attachments: [],
  uploadedFiles: [], // 存储上传的文件对象
  // 减刑假释专用字段
  paroleData: {
    batch: '',
    count: 0,
    stage: ''
  }
})

// 减刑假释阶段选项
const paroleStages = [
  { value: 'review', label: '审查阶段' },
  { value: 'publicize', label: '公示阶段' },
  { value: 'submitted', label: '已提交' },
  { value: 'approved', label: '已通过' }
]

// 获取事件类型信息
function getEventTypeInfo(type) {
  return eventTypes.find(t => t.value === type) || {}
}

// 监狱变化时重新加载数据
function onPrisonChange(prison) {
  selectedPrison.value = prison
  loadHistoryEvents()
}

// 加载历史记录
async function loadHistoryEvents() {
  loadingHistory.value = true
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    // 构建查询参数
    const params = {}
    if (selectedPrison.value) {
      params.prison_name = selectedPrison.value
    }
    
    // 月份筛选
    if (filterMonth.value) {
      params.month = filterMonth.value
    }
    
    // 日期范围筛选
    if (filterDateRange.value && filterDateRange.value.length === 2) {
      params.startDate = filterDateRange.value[0]
      params.endDate = filterDateRange.value[1]
    }
    
    const queryString = new URLSearchParams(params).toString()
    const url = `${API_BASE}/api/immediate-events${queryString ? '?' + queryString : ''}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      
      // 检查是否需要选择监狱
      if (result.needSelectPrison) {
        ElMessage.warning('请选择要查看的监狱')
        historyEvents.value = []
        return
      }
      
      const events = result.data || []
      
      // 为每个事件加载附件
      for (const event of events) {
        if (event.attachment_ids && event.attachment_ids.length > 0) {
          try {
            const attachments = []
            for (const attId of event.attachment_ids) {
              const attResponse = await fetch(`${API_BASE}/api/attachments/${attId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              })
              if (attResponse.ok) {
                const attResult = await attResponse.json()
                attachments.push(attResult.data)
              }
            }
            event.attachments = attachments
          } catch (error) {
            console.error('加载附件失败:', error)
            event.attachments = []
          }
        } else {
          event.attachments = []
        }
      }
      
      historyEvents.value = events
    }
  } catch (error) {
    console.error('获取历史记录失败:', error)
    ElMessage.error('获取历史记录失败')
  } finally {
    loadingHistory.value = false
  }
}

// 清空筛选条件
function clearEventFilters() {
  filterMonth.value = ''
  filterDateRange.value = []
  selectedPrison.value = ''
  loadHistoryEvents()
}

// 查看详情
function viewEventDetail(event) {
  viewingEvent.value = event
  showDetailDialog.value = true
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
    
    if (!response.ok) {
      throw new Error('下载失败')
    }
    
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
  } catch (error) {
    console.error('下载附件失败:', error)
    ElMessage.error('下载附件失败: ' + error.message)
  }
}

// 导出事件为Word
async function exportEvent(event) {
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    const response = await fetch(`${API_BASE}/api/immediate-events/${event.id}/export`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '导出失败' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    const eventTypeMap = {
      'escape': '脱逃',
      'selfHarm': '自伤自残',
      'death': '死亡',
      'epidemic': '重大疫情',
      'accident': '安全事故',
      'paroleRequest': '减刑假释',
      'disciplinaryAction': '民警处分'
    }
    
    const eventTypeName = eventTypeMap[event.event_type] || '及时检察'
    const dateStr = event.event_date.replace(/-/g, '')
    a.download = `及时检察_${eventTypeName}_${dateStr}.docx`
    
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + error.message)
  }
}

// 删除历史事件
async function deleteHistoryEvent(event) {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条事件记录吗？`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    const response = await fetch(`${API_BASE}/api/immediate-events/${event.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      ElMessage.success('删除成功')
      loadHistoryEvents()
    } else {
      throw new Error('删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

// 添加事件记录 - 直接保存到数据库
async function addEventRecord() {
  if (!eventForm.type || !eventForm.title) {
    ElMessage.warning('请选择事件类型并填写事件标题')
    return
  }
  
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    // 1. 先上传附件(如果有)
    let attachmentIds = []
    if (eventForm.uploadedFiles.length > 0) {
      const formData = new FormData()
      eventForm.uploadedFiles.forEach(file => {
        formData.append('files', file.raw)
      })
      formData.append('category', 'immediate_event')
      const eventDate = eventForm.event_date || new Date().toISOString().split('T')[0]
      formData.append('log_date', eventDate)
      formData.append('upload_month', eventDate.slice(0, 7))  // 根据事件日期设置归档月份
      
      const uploadResponse = await fetch(`${API_BASE}/api/attachments/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json()
        attachmentIds = uploadResult.data.map(att => att.id)
        console.log('附件上传成功:', attachmentIds)
      } else {
        throw new Error('附件上传失败')
      }
    }
    
    // 2. 创建事件记录
    const response = await fetch(`${API_BASE}/api/immediate-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        eventDate: eventForm.date,
        eventType: eventForm.type,
        title: eventForm.title,
        description: eventForm.description,
        paroleData: eventForm.type === 'paroleRequest' ? eventForm.paroleData : null,
        attachmentIds: attachmentIds
      })
    })
    
    if (!response.ok) {
      throw new Error('保存失败')
    }
    
    resetEventForm()
    showEventDialog.value = false
    ElMessage.success(`事件记录已保存${attachmentIds.length > 0 ? `，包含${attachmentIds.length}个附件` : ''}`)
    
    // 刷新历史记录
    if (viewMode.value === 'history') {
      loadHistoryEvents()
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败: ' + error.message)
  }
}

// 处理文件选择
function handleFileChange(file, fileList) {
  eventForm.uploadedFiles = fileList
}

// 处理文件移除
function handleFileRemove(file, fileList) {
  eventForm.uploadedFiles = fileList
}

// 删除事件记录
function removeEventRecord(index) {
  eventRecords.value.splice(index, 1)
}

// 重置事件表单
function resetEventForm() {
  eventForm.type = ''
  eventForm.date = new Date()
  eventForm.title = ''
  eventForm.description = ''
  eventForm.attachments = []
  eventForm.uploadedFiles = []
  eventForm.paroleData = { batch: '', count: 0, stage: '' }
}

// 提交及时检察数据 - 已废弃，改为直接保存
async function submitImmediateData() {
  ElMessage.info('事件已自动保存到数据库')
}

// 切换视图
function switchView(mode) {
  viewMode.value = mode
  if (mode === 'history') {
    loadHistoryEvents()
  }
}

// 页面加载时获取历史记录
onMounted(() => {
  // 检察官自动使用自己的监狱
  if (userStore.isOfficer) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    selectedPrison.value = user.prison_name || user.prisonName || ''
  }
  
  if (viewMode.value === 'history') {
    loadHistoryEvents()
  }
})

// 编辑历史事件
function editHistoryEvent(event) {
  editingEvent.value = {
    ...event,
    event_date: new Date(event.event_date),
    parole_data: event.parole_data || { batch: '', count: 0, stage: '' }
  }
  showEditDialog.value = true
}

// 保存编辑
async function saveEditEvent() {
  try {
    if (!editingEvent.value.event_type || !editingEvent.value.title) {
      ElMessage.warning('请填写必填项')
      return
    }

    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    const response = await fetch(`${API_BASE}/api/immediate-events/${editingEvent.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        event_type: editingEvent.value.event_type,
        event_date: editingEvent.value.event_date,
        title: editingEvent.value.title,
        description: editingEvent.value.description,
        parole_data: editingEvent.value.event_type === 'paroleRequest' ? editingEvent.value.parole_data : null,
        status: editingEvent.value.status
      })
    })
    
    if (response.ok) {
      ElMessage.success('编辑成功')
      showEditDialog.value = false
      editingEvent.value = null
      loadHistoryEvents()
    } else {
      throw new Error('编辑失败')
    }
  } catch (error) {
    console.error('编辑失败:', error)
    ElMessage.error('编辑失败: ' + error.message)
  }
}


</script>

<template>
  <div class="immediate-check-page">
    <!-- 视图切换 -->
    <div class="view-switcher">
      <!-- 监狱选择器 -->
      <PrisonSelector 
        v-model="selectedPrison" 
        @change="onPrisonChange"
        style="margin-right: 12px;"
      />
      
      <el-button 
        :type="viewMode === 'form' ? 'primary' : ''"
        @click="switchView('form')"
      >
        新建事件
      </el-button>
      <el-button 
        :type="viewMode === 'history' ? 'primary' : ''"
        @click="switchView('history')"
      >
        历史记录
      </el-button>
    </div>

    <!-- 新建事件视图 -->
    <el-card v-if="viewMode === 'form'" class="main-card">
      <template #header>
        <div class="card-header-flex">
          <div class="header-left">
            <el-icon :size="24" color="#F56C6C"><Warning /></el-icon>
            <span>及时检察记录</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="showEventDialog = true">
            添加事件
          </el-button>
        </div>
      </template>

      <!-- 事件类型快捷入口 -->
      <div class="event-type-grid">
        <div 
          v-for="type in eventTypes" 
          :key="type.value"
          class="event-type-card"
          :class="type.icon"
          @click="eventForm.type = type.value; showEventDialog = true"
        >
          <span>{{ type.label }}</span>
        </div>
      </div>

      <el-divider />

      <!-- 事件记录列表 -->
      <div v-if="eventRecords.length === 0" class="empty-state">
        <el-empty description="暂无事件记录，点击上方按钮添加" />
      </div>
      
      <div v-else class="event-list">
        <el-card 
          v-for="(record, index) in eventRecords" 
          :key="record.id"
          class="event-card"
          :class="getEventTypeInfo(record.type).icon"
          shadow="hover"
        >
          <div class="event-header">
            <el-tag :type="getEventTypeInfo(record.type).icon">
              {{ record.typeLabel }}
            </el-tag>
            <h4 class="event-title">{{ record.title }}</h4>
            <span class="event-date">{{ new Date(record.date).toLocaleDateString('zh-CN') }}</span>
            <el-button type="danger" :icon="Delete" circle size="small" @click="removeEventRecord(index)" />
          </div>
          
          <p class="event-desc" v-if="record.description">{{ record.description }}</p>
          
          <!-- 减刑假释专用信息 -->
          <div v-if="record.type === 'paroleRequest'" class="parole-info">
            <el-tag type="info">批次: {{ record.paroleData.batch }}</el-tag>
            <el-tag type="info">数量: {{ record.paroleData.count }}人</el-tag>
            <el-tag type="info">阶段: {{ paroleStages.find(s => s.value === record.paroleData.stage)?.label }}</el-tag>
          </div>
        </el-card>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-section" v-if="eventRecords.length > 0">
        <el-button type="primary" size="large" @click="submitImmediateData">
          提交及时检察数据
        </el-button>
      </div>
    </el-card>

    <!-- 历史记录视图 -->
    <el-card v-if="viewMode === 'history'" class="main-card" v-loading="loadingHistory">
      <template #header>
        <div class="card-header-flex">
          <div class="header-left">
            <el-icon :size="24" color="#F56C6C"><View /></el-icon>
            <span>历史记录</span>
            <el-tag style="margin-left: 12px;">共 {{ historyEvents.length }} 条</el-tag>
          </div>
        </div>
      </template>

      <!-- 筛选控件 -->
      <div style="margin-bottom: 16px; display: flex; gap: 12px; align-items: center;">
        <PrisonSelector 
          v-model="selectedPrison" 
          @change="onPrisonChange"
          placeholder="选择监狱筛选"
          :auto-select="false"
          style="width: 200px;"
        />
        <el-date-picker
          v-model="filterMonth"
          type="month"
          placeholder="选择月份"
          format="YYYY年MM月"
          value-format="YYYY-MM"
          @change="loadHistoryEvents"
          style="width: 180px;"
        />
        <el-date-picker
          v-model="filterDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="loadHistoryEvents"
          style="width: 280px;"
        />
        <el-button @click="clearEventFilters">清空筛选</el-button>
      </div>

      <!-- 批量操作提示 -->
      <div v-if="selectedEvents.length > 0" style="margin-bottom: 16px; display: flex; justify-content: flex-end;">
        <el-alert
          type="info"
          :closable="false"
          style="width: auto;"
        >
          <template #default>
            <div style="display: flex; align-items: center; gap: 12px">
              <span>已选择 {{ selectedEvents.length }} 条记录</span>
              <el-button type="danger" size="small" :icon="Delete" @click="batchDeleteEvents">
                批量删除
              </el-button>
            </div>
          </template>
        </el-alert>
      </div>

      <div v-if="historyEvents.length === 0" class="empty-state">
        <el-empty description="暂无历史记录" />
      </div>

      <!-- 表格视图 -->
      <el-table 
        v-else
        :data="paginatedEvents" 
        style="width: 100%"
        stripe
        @selection-change="handleEventSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="event_date" label="日期" width="120">
          <template #default="{ row }">
            {{ new Date(row.event_date).toLocaleDateString('zh-CN') }}
          </template>
        </el-table-column>
        <el-table-column prop="event_type" label="事件类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getEventTypeInfo(row.event_type).icon" size="small">
              {{ getEventTypeInfo(row.event_type).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="事件标题" min-width="200" />
        <el-table-column prop="description" label="描述" min-width="250" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'pending'" type="warning" size="small">待处理</el-tag>
            <el-tag v-else-if="row.status === 'processed'" type="success" size="small">已处理</el-tag>
            <el-tag v-else-if="row.status === 'closed'" type="info" size="small">已关闭</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="附件" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.attachments && row.attachments.length > 0" type="info" size="small">
              {{ row.attachments.length }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="viewEventDetail(row)">
              详情
            </el-button>
            <el-button type="success" link :icon="Download" @click="exportEvent(row)">
              导出
            </el-button>
            <el-button type="warning" link :icon="Edit" @click="editHistoryEvent(row)">
              编辑
            </el-button>
            <el-button type="danger" link :icon="Delete" @click="deleteHistoryEvent(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页器 -->
      <el-pagination
        v-if="historyEvents.length > 0"
        v-model:current-page="currentEventPage"
        v-model:page-size="eventPageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="historyEvents.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleEventSizeChange"
        @current-change="handleEventPageChange"
        style="margin-top: 20px; justify-content: center"
      />
    </el-card>

    <!-- 添加事件对话框 -->
    <el-dialog 
      v-model="showEventDialog" 
      title="添加事件记录"
      width="600px"
    >
      <el-form :model="eventForm" label-width="100px">
        <el-form-item label="事件类型" required>
          <el-select v-model="eventForm.type" placeholder="选择事件类型" style="width: 100%">
            <el-option 
              v-for="type in eventTypes" 
              :key="type.value" 
              :label="type.label" 
              :value="type.value" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="发生日期">
          <el-date-picker v-model="eventForm.date" type="date" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="事件标题" required>
          <el-input v-model="eventForm.title" placeholder="简要描述事件" />
        </el-form-item>
        
        <el-form-item label="详细描述">
          <el-input 
            v-model="eventForm.description" 
            type="textarea" 
            :rows="4"
            placeholder="详细描述事件情况..."
          />
        </el-form-item>
        
        <!-- 减刑假释专用字段 -->
        <template v-if="eventForm.type === 'paroleRequest'">
          <el-divider content-position="left">减刑假释信息</el-divider>
          
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="批次">
                <el-input v-model="eventForm.paroleData.batch" placeholder="如：2024年第3批" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="数量">
                <el-input-number v-model="eventForm.paroleData.count" :min="1" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="阶段">
                <el-select v-model="eventForm.paroleData.stage" style="width: 100%">
                  <el-option 
                    v-for="stage in paroleStages" 
                    :key="stage.value" 
                    :label="stage.label" 
                    :value="stage.value" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </template>
        
        <el-form-item label="附件材料">
          <el-upload
            v-model:file-list="eventForm.uploadedFiles"
            action="#"
            :auto-upload="false"
            :limit="10"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            multiple
          >
            <el-button type="primary">
              <el-icon style="margin-right: 4px;"><Upload /></el-icon>
              选择文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">支持各种格式文件，最多10个，每个最大50MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showEventDialog = false">取消</el-button>
        <el-button type="primary" @click="addEventRecord">确定添加</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog 
      v-model="showDetailDialog" 
      title="事件详情"
      width="700px"
    >
      <div v-if="viewingEvent" class="detail-content">
        <!-- 基本信息 -->
        <el-descriptions :column="2" border>
          <el-descriptions-item label="事件类型">
            <el-tag :type="getEventTypeInfo(viewingEvent.event_type).icon">
              {{ getEventTypeInfo(viewingEvent.event_type).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发生日期">
            {{ new Date(viewingEvent.event_date).toLocaleDateString('zh-CN') }}
          </el-descriptions-item>
          <el-descriptions-item label="事件标题" :span="2">
            {{ viewingEvent.title || '无标题' }}
          </el-descriptions-item>
          <el-descriptions-item label="处理状态">
            <el-tag v-if="viewingEvent.status === 'pending'" type="warning">待处理</el-tag>
            <el-tag v-else-if="viewingEvent.status === 'processed'" type="success">已处理</el-tag>
            <el-tag v-else-if="viewingEvent.status === 'closed'" type="info">已关闭</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ new Date(viewingEvent.createdAt).toLocaleString('zh-CN') }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 详细描述 -->
        <el-divider content-position="left">详细描述</el-divider>
        <div class="detail-description">
          {{ viewingEvent.description || '无详细描述' }}
        </div>

        <!-- 减刑假释专用信息 -->
        <template v-if="viewingEvent.event_type === 'paroleRequest' && viewingEvent.parole_data">
          <el-divider content-position="left">减刑假释信息</el-divider>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="批次">
              {{ viewingEvent.parole_data.batch || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="数量">
              {{ viewingEvent.parole_data.count || 0 }} 人
            </el-descriptions-item>
            <el-descriptions-item label="阶段">
              {{ paroleStages.find(s => s.value === viewingEvent.parole_data.stage)?.label || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </template>

        <!-- 附件列表 -->
        <template v-if="viewingEvent.attachments && viewingEvent.attachments.length > 0">
          <el-divider content-position="left">附件材料 ({{ viewingEvent.attachments.length }})</el-divider>
          <div class="detail-attachments">
            <div v-for="att in viewingEvent.attachments" :key="att.id" class="detail-attachment-item">
              <el-icon class="attachment-icon"><Document /></el-icon>
              <div class="attachment-info">
                <div class="attachment-name">{{ att.original_name }}</div>
                <div class="attachment-meta">
                  大小: {{ (att.file_size / 1024).toFixed(2) }} KB | 
                  上传时间: {{ new Date(att.createdAt).toLocaleString('zh-CN') }}
                </div>
              </div>
              <el-button type="primary" size="small" @click="downloadAttachment(att)">
                <el-icon style="margin-right: 4px;"><Download /></el-icon>
                下载
              </el-button>
            </div>
          </div>
        </template>
        <div v-else>
          <el-divider content-position="left">附件材料</el-divider>
          <el-empty description="暂无附件" :image-size="80" />
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="exportEvent(viewingEvent)">
          <el-icon style="margin-right: 4px;"><Download /></el-icon>
          导出Word
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑事件对话框 -->
    <el-dialog 
      v-model="showEditDialog" 
      title="编辑事件记录"
      width="600px"
    >
      <el-form v-if="editingEvent" :model="editingEvent" label-width="100px">
        <el-form-item label="事件类型" required>
          <el-select v-model="editingEvent.event_type" placeholder="选择事件类型" style="width: 100%">
            <el-option 
              v-for="type in eventTypes" 
              :key="type.value" 
              :label="type.label" 
              :value="type.value" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="发生日期">
          <el-date-picker v-model="editingEvent.event_date" type="date" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="事件标题" required>
          <el-input v-model="editingEvent.title" placeholder="简要描述事件" />
        </el-form-item>
        
        <el-form-item label="详细描述">
          <el-input 
            v-model="editingEvent.description" 
            type="textarea" 
            :rows="4"
            placeholder="详细描述事件情况..."
          />
        </el-form-item>
        
        <!-- 减刑假释专用字段 -->
        <template v-if="editingEvent.event_type === 'paroleRequest'">
          <el-divider content-position="left">减刑假释信息</el-divider>
          
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="批次">
                <el-input v-model="editingEvent.parole_data.batch" placeholder="如：2024年第3批" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="数量">
                <el-input-number v-model="editingEvent.parole_data.count" :min="1" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="阶段">
                <el-select v-model="editingEvent.parole_data.stage" style="width: 100%">
                  <el-option 
                    v-for="stage in paroleStages" 
                    :key="stage.value" 
                    :label="stage.label" 
                    :value="stage.value" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <el-form-item label="状态">
          <el-select v-model="editingEvent.status" style="width: 100%">
            <el-option label="待处理" value="pending" />
            <el-option label="已处理" value="processed" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEditEvent">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.immediate-check-page {
  max-width: 1000px;
  margin: 0 auto;
}

.view-switcher {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
}

.main-card {
  border-radius: 12px;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}

.event-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.event-type-card {
  padding: 16px;
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.event-type-card.danger {
  background: linear-gradient(135deg, #F56C6C20, #F56C6C10);
  color: #F56C6C;
  border: 1px solid #F56C6C40;
}

.event-type-card.warning {
  background: linear-gradient(135deg, #E6A23C20, #E6A23C10);
  color: #E6A23C;
  border: 1px solid #E6A23C40;
}

.event-type-card.info {
  background: linear-gradient(135deg, #90939920, #90939910);
  color: #909399;
  border: 1px solid #90939940;
}

.event-type-card.primary {
  background: linear-gradient(135deg, #409EFF20, #409EFF10);
  color: #409EFF;
  border: 1px solid #409EFF40;
}

.event-type-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.empty-state {
  padding: 40px 0;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-card {
  border-left: 4px solid #909399;
}

.event-card.danger {
  border-left-color: #F56C6C;
}

.event-card.warning {
  border-left-color: #E6A23C;
}

.event-card.primary {
  border-left-color: #409EFF;
}

.history-card {
  border-left-color: #909399;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.event-title {
  flex: 1;
  margin: 0;
  font-size: 16px;
}

.event-date {
  color: #909399;
  font-size: 13px;
}

.event-actions {
  display: flex;
  gap: 8px;
}

.event-desc {
  margin: 12px 0 0;
  color: #606266;
  line-height: 1.6;
}

.parole-info {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.event-status {
  margin-top: 12px;
}

.event-attachments {
  margin-top: 16px;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
}

.attachment-item .el-icon {
  color: #409EFF;
  font-size: 16px;
}

.attachment-name {
  flex: 1;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-description {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  line-height: 1.8;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-word;
}

.detail-attachments {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-attachment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
}

.detail-attachment-item:hover {
  background: #ecf5ff;
  border-color: #409EFF;
}

.attachment-icon {
  font-size: 32px;
  color: #409EFF;
}

.attachment-info {
  flex: 1;
  min-width: 0;
}

.attachment-info .attachment-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-meta {
  font-size: 12px;
  color: #909399;
}

.submit-section {
  margin-top: 24px;
  text-align: center;
}

.submit-section .el-button {
  min-width: 200px;
}
</style>
