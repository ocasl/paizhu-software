<script setup>
/**
 * 月度归档管理页面
 * 审批、签名、打包下载
 */
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Check, Close, Document, Calendar, Upload, Refresh, Delete } from '@element-plus/icons-vue'
import axios from 'axios'
import SignaturePad from '../components/SignaturePad.vue'
import PrisonSelector from '../components/PrisonSelector.vue'
import { useUserStore } from '../stores/user'

// 用户store
const userStore = useUserStore()

// 监狱选择
const selectedPrison = ref('')

// 获取当前用户
const currentUser = ref(null)
const isAdmin = computed(() => currentUser.value?.role === 'admin' || currentUser.value?.role === 'leader')
const isOfficer = computed(() => currentUser.value?.role === 'inspector')

// 是否显示创建归档按钮（只有检察官可以创建）
const canCreateArchive = computed(() => isOfficer.value)

// 归档列表
const archives = ref([])
const loading = ref(false)

// 筛选
const filters = reactive({
  year: new Date().getFullYear(),
  month: '',
  status: '',
  prison_name: ''
})

// 当前归档
const currentArchive = ref(null)

// 弹窗
const showSignatureDialog = ref(false)
const showRejectDialog = ref(false)
const rejectReason = ref('')
const signaturePadRef = ref(null)
const pendingArchiveId = ref(null)

// 创建归档对话框
const showCreateDialog = ref(false)
const createForm = reactive({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1
})

// 年份选项
const yearOptions = computed(() => {
  const years = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push(y)
  }
  return years
})

// 月份选项
const monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

// API 设置
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getToken() {
  return localStorage.getItem('token')
}

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 获取当前用户信息
async function loadCurrentUser() {
  try {
    // 从 localStorage 获取用户信息
    const userStr = localStorage.getItem('user')
    if (userStr) {
      currentUser.value = JSON.parse(userStr)
    }
    
    // 检察官自动使用自己的监狱
    if (userStore.isOfficer) {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      selectedPrison.value = user.prison_name || user.prisonName || ''
      filters.prison_name = user.prison_name || user.prisonName || ''
    }
  } catch (e) {
    console.error('获取用户信息失败', e)
  }
}

// 监狱变化时重新加载数据
function onPrisonChange(prison) {
  selectedPrison.value = prison
  filters.prison_name = prison
  loadArchives()
}

// 加载归档列表
async function loadArchives() {
  loading.value = true
  try {
    const params = {}
    if (filters.year) params.year = filters.year
    if (filters.month) params.month = filters.month
    if (filters.status) params.status = filters.status
    if (filters.prison_name) params.prison_name = filters.prison_name

    const res = await api.get('/api/archive/list', { params })
    if (res.data.success) {
      archives.value = res.data.data
    }
  } catch (error) {
    console.error('加载归档列表失败:', error)
    ElMessage.error('加载归档列表失败')
  } finally {
    loading.value = false
  }
}

// 获取或创建当月归档
async function getCurrentArchive() {
  try {
    const res = await api.get('/api/archive/current', {
      params: {
        year: filters.year,
        month: filters.month || (new Date().getMonth() + 1)
      }
    })
    if (res.data.success) {
      currentArchive.value = res.data.data
    }
  } catch (error) {
    console.error('获取当月归档失败:', error)
  }
}

// 提交审批
async function submitForApproval(archive) {
  try {
    await ElMessageBox.confirm(
      '确定要提交本月工作进行审批吗？提交后将进入待审批状态。',
      '确认提交',
      { type: 'info' }
    )

    const res = await api.post(`/api/archive/submit/${archive.id}`)
    if (res.data.success) {
      ElMessage.success('已提交审批')
      loadArchives()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '提交失败')
    }
  }
}

// 打开审批签名弹窗
function openApproveDialog(archive) {
  pendingArchiveId.value = archive.id
  showSignatureDialog.value = true
}

// 确认审批通过（带签名）
async function confirmApprove(signatureData) {
  if (!signatureData) {
    ElMessage.warning('请先签名')
    return
  }

  try {
    const res = await api.put(`/api/archive/approve/${pendingArchiveId.value}`, {
      signature_base64: signatureData
    })
    if (res.data.success) {
      ElMessage.success('审批通过')
      showSignatureDialog.value = false
      loadArchives()
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '审批失败')
  }
}

// 打开驳回弹窗
function openRejectDialog(archive) {
  pendingArchiveId.value = archive.id
  rejectReason.value = ''
  showRejectDialog.value = true
}

// 确认驳回
async function confirmReject() {
  try {
    const res = await api.put(`/api/archive/reject/${pendingArchiveId.value}`, {
      reason: rejectReason.value
    })
    if (res.data.success) {
      ElMessage.success('已驳回')
      showRejectDialog.value = false
      loadArchives()
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '驳回失败')
  }
}

// 下载中状态
const downloading = ref(false)

// 下载归档压缩包（直接下载，不跳转页面）
async function downloadArchive(archive) {
  try {
    downloading.value = true
    ElMessage.info('正在打包下载，请稍候...')
    
    const response = await fetch(`${API_BASE}/api/archive/download/${archive.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '下载失败')
    }
    
    // 获取文件blob
    const blob = await response.blob()
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${archive.prison_name}_${archive.year}年${archive.month}月归档.zip`
    document.body.appendChild(a)
    a.click()
    
    // 清理
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    ElMessage.success('下载完成')
  } catch (error) {
    ElMessage.error(error.message || '下载失败')
  } finally {
    downloading.value = false
  }
}

// 下载月度报告
async function downloadReport(archive) {
  try {
    ElMessage.info('正在生成报告...')
    
    const response = await fetch(`${API_BASE}/api/archive/download-report/${archive.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '下载失败')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${archive.prison_name}_${archive.year}年${archive.month}月工作报告.docx`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    ElMessage.success('报告已下载')
  } catch (error) {
    ElMessage.error(error.message || '下载报告失败')
  }
}

// 下载事项清单
async function downloadChecklist(archive) {
  try {
    ElMessage.info('正在生成清单...')
    
    const response = await fetch(`${API_BASE}/api/archive/download-checklist/${archive.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '下载失败')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${archive.prison_name}_${archive.year}年${archive.month}月事项清单.doc`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    ElMessage.success('清单已下载')
  } catch (error) {
    ElMessage.error(error.message || '下载清单失败')
  }
}

// 获取状态标签类型
function getStatusType(status) {
  const types = {
    draft: 'info',
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

// 获取状态名称
function getStatusName(status) {
  const names = {
    draft: '草稿',
    pending: '待审批',
    approved: '已通过',
    rejected: '已驳回'
  }
  return names[status] || status
}

onMounted(() => {
  loadCurrentUser()
  loadArchives()
  // 自动获取/创建当月归档
  getCurrentArchive()
})

// 打开创建归档对话框
function openCreateDialog() {
  createForm.year = new Date().getFullYear()
  createForm.month = new Date().getMonth() + 1
  showCreateDialog.value = true
}

// 创建指定月份归档
async function createArchive() {
  try {
    const res = await api.get('/api/archive/current', {
      params: {
        year: createForm.year,
        month: createForm.month
      }
    })
    if (res.data.success) {
      ElMessage.success(`${createForm.year}年${createForm.month}月归档已创建`)
      showCreateDialog.value = false
      loadArchives()
    }
  } catch (error) {
    ElMessage.error('创建归档失败')
  }
}

// 刷新归档统计（重新收集日志和附件数量）
async function refreshArchive(archive) {
  try {
    const res = await api.put(`/api/archive/refresh/${archive.id}`)
    if (res.data.success) {
      ElMessage.success(res.data.message)
      loadArchives()
    }
  } catch (error) {
    ElMessage.error('刷新失败')
  }
}

// 删除归档
async function deleteArchive(archive) {
  try {
    await ElMessageBox.confirm(
      `确定要删除 ${archive.year}年${archive.month}月 的归档吗？删除后无法恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const res = await api.delete(`/api/archive/${archive.id}`)
    if (res.data.success) {
      ElMessage.success('归档已删除')
      loadArchives()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}
</script>

<template>
  <div class="monthly-archive-page">
    <div class="page-header">
      <h2>
        <el-icon><Calendar /></el-icon>
        月度归档管理
      </h2>
      <!-- 只有检察官才显示创建归档按钮 -->
      <el-button 
        v-if="canCreateArchive"
        type="primary" 
        @click="openCreateDialog"
      >
        + 创建归档
      </el-button>
    </div>

    <!-- 筛选栏 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <!-- 监狱选择器（领导/院领导/管理员显示） -->
        <PrisonSelector 
          v-model="selectedPrison" 
          @change="onPrisonChange"
          style="margin-right: 12px;"
        />
        
        <el-select v-model="filters.year" style="width: 120px" @change="loadArchives">
          <el-option v-for="y in yearOptions" :key="y" :label="`${y}年`" :value="y" />
        </el-select>
        
        <el-select v-model="filters.month" placeholder="月份" clearable style="width: 100px" @change="loadArchives">
          <el-option v-for="m in monthOptions" :key="m" :label="`${m}月`" :value="m" />
        </el-select>
        
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px" @change="loadArchives">
          <el-option label="草稿" value="draft" />
          <el-option label="待审批" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
        
        <el-button @click="loadArchives">查询</el-button>
      </div>
    </el-card>

    <!-- 归档列表 -->
    <el-card shadow="never">
      <el-table :data="archives" v-loading="loading" stripe>
        <el-table-column label="月份" width="120">
          <template #default="{ row }">
            {{ row.year }}年{{ row.month }}月
          </template>
        </el-table-column>
        <el-table-column prop="prison_name" label="派驻单位" min-width="150" />
        <el-table-column prop="daily_log_count" label="日志数" width="80" />
        <el-table-column prop="attachment_count" label="附件数" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交人" width="100">
          <template #default="{ row }">
            {{ row.submitter?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="审批人" width="100">
          <template #default="{ row }">
            {{ row.reviewer?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <!-- 刷新统计 -->
            <el-button 
              type="info" 
              link 
              :icon="Refresh"
              @click="refreshArchive(row)"
            >
              刷新
            </el-button>
            
            <!-- 提交本月（只有检察官可以提交） -->
            <el-button 
              v-if="(row.status === 'draft' || row.status === 'rejected') && isOfficer"
              type="primary" 
              link 
              :icon="Upload"
              @click="submitForApproval(row)"
            >
              提交本月
            </el-button>
            
            <!-- 报告预览 -->
            <el-button 
              type="primary" 
              link 
              :icon="Document"
              @click="downloadReport(row)"
            >
              报告预览
            </el-button>
            
            <!-- 报告清单 -->
            <el-button 
              type="warning" 
              link 
              :icon="Document"
              @click="downloadChecklist(row)"
            >
              报告清单
            </el-button>
            
            <!-- 一键打包:所有人都可以打包下载本单位归档 -->
            <el-button 
              type="success" 
              link 
              :icon="Download"
              :loading="downloading"
              @click="downloadArchive(row)"
            >
              一键打包
            </el-button>
            
            <!-- 待审批状态：只有分管领导可审批 -->
            <template v-if="row.status === 'pending' && isAdmin && !userStore.isAdmin">
              <el-button type="success" link :icon="Check" @click="openApproveDialog(row)">
                通过
              </el-button>
              <el-button type="danger" link :icon="Close" @click="openRejectDialog(row)">
                退回
              </el-button>
            </template>
            
            <!-- 查看签名 -->
            <el-popover v-if="row.signature_url" placement="left" :width="250" trigger="click">
              <template #reference>
                <el-button type="info" link :icon="Document">签名</el-button>
              </template>
              <img :src="`${API_BASE}${row.signature_url}`" style="width: 100%;" />
            </el-popover>
            
            <!-- 驳回原因 -->
            <el-popover v-if="row.status === 'rejected' && row.reject_reason" placement="left" :width="200" trigger="hover">
              <template #reference>
                <el-tag type="danger" size="small">已退回</el-tag>
              </template>
              <p style="margin: 0;">{{ row.reject_reason }}</p>
            </el-popover>
            
            <!-- 删除按钮（只有管理员可以删除） -->
            <el-button 
              v-if="userStore.isAdmin"
              type="danger" 
              link 
              :icon="Delete"
              @click="deleteArchive(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="archives.length === 0 && !loading" description="暂无归档记录" />
    </el-card>

    <!-- 签名审批弹窗 -->
    <el-dialog v-model="showSignatureDialog" title="审批签名" width="500px">
      <p style="margin-bottom: 16px; color: #606266;">
        请在下方签名后确认审批通过
      </p>
      <SignaturePad 
        ref="signaturePadRef"
        :width="450" 
        :height="180"
        @save="confirmApprove"
      />
    </el-dialog>

    <!-- 驳回弹窗 -->
    <el-dialog v-model="showRejectDialog" title="驳回审批" width="400px">
      <el-form>
        <el-form-item label="驳回原因">
          <el-input 
            v-model="rejectReason" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入驳回原因..."
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
    
    <!-- 创建归档对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建归档" width="400px">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="年份">
          <el-select v-model="createForm.year" style="width: 100%">
            <el-option v-for="y in yearOptions" :key="y" :label="`${y}年`" :value="y" />
          </el-select>
        </el-form-item>
        <el-form-item label="月份">
          <el-select v-model="createForm.month" style="width: 100%">
            <el-option v-for="m in monthOptions" :key="m" :label="`${m}月`" :value="m" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createArchive">确定创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.monthly-archive-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 20px;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
