<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReportStore } from '../stores/report'
import { useUserStore } from '../stores/user'
import { DataAnalysis, Calendar, Timer, Document, Cloudy, Upload, List, View, FolderOpened, Setting } from '@element-plus/icons-vue'

const reportStore = useReportStore()
const userStore = useUserStore()

// 获取当前用户信息
const currentUser = computed(() => userStore.userInfo || {})
const userRole = computed(() => {
  const roleMap = {
    'admin': '系统管理员',
    'inspector': '派驻检察官',
    'leader': '业务分管领导',
    'top_viewer': '院领导'
  }
  return roleMap[currentUser.value.role] || '未知角色'
})

// 当前日期信息
const currentDate = new Date()
const currentYear = currentDate.getFullYear()
const currentMonth = currentDate.getMonth() + 1

// 日历日期
const calendarDate = ref(new Date())

// 统计数据
const statistics = ref({
  dailyChecks: 0,
  weeklyChecks: 0,
  monthlyChecks: 0,
  immediateChecks: 0,
  uploadedMaterials: 0,
  generatedReports: 0,
  attachments: 0  // 新增：附件统计
})

// 最近的工作记录
const recentActivities = ref([])

// 从store读取统计数据
async function loadStatistics() {
  const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
  
  // 读取各类检察记录
  const dailyLogs = reportStore.dailyLogs || []
  const weeklyLogs = reportStore.weeklyLogs || []
  const monthlyLogs = reportStore.monthlyLogs || []
  const immediateLogs = reportStore.immediateLogs || []
  const uploadLogs = JSON.parse(localStorage.getItem('uploadLogs') || '[]')
  const reportLogs = JSON.parse(localStorage.getItem('reportLogs') || '[]')
  
  // 过滤本月记录
  const filterThisMonth = (logs) => {
    return logs.filter(log => {
      const logDate = log.date || log.createdAt || ''
      const dateStr = typeof logDate === 'string' ? logDate : new Date(logDate).toISOString()
      return dateStr.startsWith(monthKey)
    })
  }
  
  // 统计附件数量
  let attachmentCount = 0
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const response = await fetch(`${API_BASE}/api/attachments?upload_month=${monthKey}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      const result = await response.json()
      attachmentCount = result.data?.length || 0
    }
  } catch (error) {
    console.error('获取附件统计失败:', error)
  }
  
  statistics.value = {
    dailyChecks: filterThisMonth(dailyLogs).length,
    weeklyChecks: filterThisMonth(weeklyLogs).length,
    monthlyChecks: filterThisMonth(monthlyLogs).length,
    immediateChecks: filterThisMonth(immediateLogs).length,
    uploadedMaterials: filterThisMonth(uploadLogs).length,
    generatedReports: filterThisMonth(reportLogs).length,
    attachments: attachmentCount
  }
  
  // 合并所有记录并按时间排序，取最近10条
  const allLogs = [
    ...dailyLogs.map(l => ({ ...l, type: '日检察', typeColor: 'primary' })),
    ...weeklyLogs.map(l => ({ ...l, type: '周检察', typeColor: 'success' })),
    ...monthlyLogs.map(l => ({ ...l, type: '月检察', typeColor: 'warning' })),
    ...immediateLogs.map(l => ({ ...l, type: '及时检察', typeColor: 'danger' })),
    ...uploadLogs.map(l => ({ ...l, type: '材料上传', typeColor: 'info' })),
    ...reportLogs.map(l => ({ ...l, type: '报告生成', typeColor: '' }))
  ].sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt || 0)
    const dateB = new Date(b.date || b.createdAt || 0)
    return dateB - dateA
  }).slice(0, 10)
  
  recentActivities.value = allLogs
}

// 格式化日期
function formatDate(dateVal) {
  if (!dateVal) return '未知日期'
  const date = new Date(dateVal)
  return date.toLocaleDateString('zh-CN')
}

// 总计完成数
const totalCompleted = computed(() => {
  return Object.values(statistics.value).reduce((sum, val) => sum + val, 0)
})

// 按模块分组的统计卡片
const statsGroups = computed(() => [
  {
    title: '检察工作',
    color: '#409eff',
    items: [
      { key: 'dailyChecks', title: '日检察', value: statistics.value.dailyChecks, icon: Calendar, color: '#409eff' },
      { key: 'weeklyChecks', title: '周检察', value: statistics.value.weeklyChecks, icon: Timer, color: '#67c23a' },
      { key: 'monthlyChecks', title: '月检察', value: statistics.value.monthlyChecks, icon: Document, color: '#e6a23c' },
      { key: 'immediateChecks', title: '及时检察', value: statistics.value.immediateChecks, icon: Cloudy, color: '#f56c6c' }
    ]
  },
  {
    title: '报告管理',
    color: '#67c23a',
    items: [
      { key: 'uploadedMaterials', title: '材料上传', value: statistics.value.uploadedMaterials, icon: Upload, color: '#909399' },
      { key: 'generatedReports', title: '生成报告', value: statistics.value.generatedReports, icon: DataAnalysis, color: '#409eff' },
      { key: 'attachments', title: '附件数量', value: statistics.value.attachments, icon: FolderOpened, color: '#e6a23c' }
    ]
  }
])

onMounted(() => {
  loadStatistics()
})
</script>

<template>
  <div class="overview-page">
    <div class="top-section">
      <!-- 左侧：用户信息和日历 -->
      <div class="left-column">
        <!-- 用户信息栏 -->
        <el-card class="user-info-card" shadow="never">
          <div class="user-info-content">
            <div class="user-details">
              <el-avatar :size="50" style="background-color: #409eff; margin-right: 16px">
                {{ currentUser.name?.charAt(0) || 'U' }}
              </el-avatar>
              <div>
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 4px">
                  {{ currentUser.name || '用户' }}
                </div>
                <div style="font-size: 14px; color: #909399">
                  <el-tag type="success" size="small" style="margin-right: 8px">{{ userRole }}</el-tag>
                  <!-- 派驻单位（派驻检察官显示） -->
                  <el-tag v-if="currentUser.role === 'inspector' && currentUser.prison_name" type="info" size="small">
                    {{ currentUser.prison_name }}
                  </el-tag>
                  <!-- 分管监狱（分管领导显示） - 去重显示 -->
                  <template v-if="currentUser.role === 'leader' && currentUser.prisonScopes && currentUser.prisonScopes.length > 0">
                    <el-tag 
                      v-for="prison in [...new Set(currentUser.prisonScopes)]" 
                      :key="prison" 
                      type="warning" 
                      size="small" 
                      style="margin-left: 4px"
                    >
                      {{ prison }}
                    </el-tag>
                  </template>
                </div>
              </div>
            </div>
            <div class="current-time">
              <el-icon><Timer /></el-icon>
              {{ currentYear }}年{{ currentMonth }}月
            </div>
          </div>
        </el-card>

        <!-- 日历卡片 -->
        <el-card class="calendar-card" shadow="never">
          <el-calendar v-model="calendarDate">
            <template #header="{ date }">
              <div class="calendar-header">
                <el-icon><Calendar /></el-icon>
                <span style="margin-left: 8px">{{ date }}</span>
              </div>
            </template>
          </el-calendar>
        </el-card>
      </div>

      <!-- 右侧：统计数据 -->
      <div class="right-column">
        <el-card class="stats-card" shadow="never">
          <template #header>
            <div class="card-header">
              <h3>{{ currentYear }}年{{ currentMonth }}月工作统计</h3>
              <el-tag type="success" size="large">
                本月完成 {{ totalCompleted }} 项
              </el-tag>
            </div>
          </template>
          
          <!-- 按模块分组显示 -->
          <div v-for="group in statsGroups" :key="group.title" class="stats-group">
            <div class="group-header">
              <el-divider content-position="left">
                <el-tag :color="group.color" effect="dark" size="small">{{ group.title }}</el-tag>
              </el-divider>
            </div>
            
            <div class="stats-grid">
              <div v-for="stat in group.items" :key="stat.key" class="stat-item">
                <el-icon :size="32" :style="{ color: stat.color }">
                  <component :is="stat.icon" />
                </el-icon>
                <div class="stat-info">
                  <span class="stat-value">{{ stat.value }}</span>
                  <span class="stat-label">{{ stat.title }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 最近工作记录 -->
    <el-card class="activity-card">
      <template #header>
        <div class="card-header">
          <h3>最近工作记录</h3>
          <el-tag>最近 {{ recentActivities.length }} 条</el-tag>
        </div>
      </template>
      
      <el-table 
        v-if="recentActivities.length > 0"
        :data="recentActivities" 
        style="width: 100%"
        stripe
      >
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.typeColor" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="日期" width="150">
          <template #default="{ row }">
            {{ formatDate(row.date || row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="inspectorName" label="派驻人员" width="120" />
        <el-table-column prop="prisonName" label="派驻监所" />
      </el-table>
      
      <el-empty v-else description="暂无工作记录">
        <template #description>
          <p>开始使用各功能后，记录将自动显示在这里</p>
        </template>
      </el-empty>
    </el-card>
  </div>
</template>

<style scoped>
.overview-page {
  padding: 0;
}

.top-section {
  display: grid;
  grid-template-columns: 1fr 500px;
  gap: 20px;
  margin-bottom: 20px;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-column {
  display: flex;
  flex-direction: column;
}

.user-info-card {
  border-radius: 12px;
}

.calendar-card {
  border-radius: 12px;
  flex: 1;
}

.calendar-header {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.user-info-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-details {
  display: flex;
  align-items: center;
}

.current-time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

.stats-card {
  border-radius: 12px;
  height: 100%;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.stats-group {
  margin-bottom: 24px;
}

.stats-group:last-child {
  margin-bottom: 0;
}

.group-header {
  margin-bottom: 12px;
}

.group-header .el-divider {
  margin: 8px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* 报告管理组有3个项目，使用3列布局 */
.stats-group:last-child .stats-grid {
  grid-template-columns: repeat(3, 1fr);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: #f5f7fa;
  transition: all 0.3s;
  cursor: pointer;
}

.stat-item:hover {
  background: #ecf5ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.activity-card {
  margin-bottom: 20px;
}
</style>
