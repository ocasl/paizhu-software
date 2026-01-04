<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOfflineStore } from '../stores/offline'
import {
  Calendar,
  Timer,
  Document,
  Cloudy,
  Upload,
  DataAnalysis,
  TrendCharts,
  Checked
} from '@element-plus/icons-vue'

const router = useRouter()
const offlineStore = useOfflineStore()

// 当前日期
const currentDate = new Date()
const currentMonth = currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })

// 快捷入口
const quickActions = [
  { path: '/daily', title: '日检察', icon: Calendar, color: '#409EFF', desc: '工作日志、监控抽查' },
  { path: '/weekly', title: '周检察', icon: Timer, color: '#67C23A', desc: '医院检察、罪犯谈话' },
  { path: '/monthly', title: '月检察', icon: Document, color: '#E6A23C', desc: '会见检察、犯情分析' },
  { path: '/immediate', title: '及时检察', icon: Cloudy, color: '#F56C6C', desc: '重大事件报告' },
  { path: '/upload', title: '材料上传', icon: Upload, color: '#909399', desc: '花名册、笔录上传' },
  { path: '/report', title: '报告预览', icon: DataAnalysis, color: '#7B68EE', desc: '月度报告生成' }
]

// 统计数据 (模拟)
const statistics = ref({
  dailyCompleted: 15,
  weeklyCompleted: 3,
  monthlyCompleted: 2,
  pendingTasks: 5,
  uploadedFiles: 23,
  talkRecords: 18
})

// 最近操作记录 (模拟)
const recentActivities = ref([
  { time: '今天 09:30', action: '提交日志', desc: '完成三大现场检察记录' },
  { time: '今天 08:15', action: '上传材料', desc: '上传新入监人员花名册' },
  { time: '昨天 16:45', action: '罪犯谈话', desc: '与3名新收押罪犯完成谈话' },
  { time: '昨天 14:20', action: '监控抽查', desc: '抽查监控发现1处异常' }
])

function navigateTo(path) {
  router.push(path)
}
</script>

<template>
  <div class="home-page">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <h1 class="welcome-title">欢迎使用派驻检察室工作管理系统</h1>
        <p class="welcome-subtitle">{{ currentMonth }} · 高效完成检察工作，一键生成月度报告</p>
      </div>
      
      <!-- 网络状态卡片 -->
      <div class="status-card" :class="{ offline: !offlineStore.isOnline }">
        <el-icon :size="24"><component :is="offlineStore.isOnline ? Checked : Cloudy" /></el-icon>
        <div class="status-info">
          <span class="status-label">{{ offlineStore.isOnline ? '网络正常' : '离线模式' }}</span>
          <span class="status-desc" v-if="offlineStore.hasPendingData">
            {{ offlineStore.pendingSyncCount }} 条数据待同步
          </span>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="section-title">
      <TrendCharts class="section-icon" />
      <span>快捷入口</span>
    </div>
    
    <div class="quick-actions">
      <div 
        v-for="action in quickActions" 
        :key="action.path"
        class="action-card"
        @click="navigateTo(action.path)"
      >
        <div class="action-icon" :style="{ background: action.color }">
          <el-icon :size="28" color="#fff"><component :is="action.icon" /></el-icon>
        </div>
        <div class="action-info">
          <h3 class="action-title">{{ action.title }}</h3>
          <p class="action-desc">{{ action.desc }}</p>
        </div>
      </div>
    </div>

    <!-- 工作统计 -->
    <div class="stats-section">
      <div class="section-title">
        <DataAnalysis class="section-icon" />
        <span>本月工作统计</span>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ statistics.dailyCompleted }}</div>
          <div class="stat-label">日志记录</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ statistics.weeklyCompleted }}</div>
          <div class="stat-label">周检察完成</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ statistics.monthlyCompleted }}</div>
          <div class="stat-label">月检察完成</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ statistics.uploadedFiles }}</div>
          <div class="stat-label">上传材料</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ statistics.talkRecords }}</div>
          <div class="stat-label">谈话记录</div>
        </div>
        <div class="stat-card pending">
          <div class="stat-value">{{ statistics.pendingTasks }}</div>
          <div class="stat-label">待办事项</div>
        </div>
      </div>
    </div>

    <!-- 最近操作 -->
    <div class="recent-section">
      <div class="section-title">
        <Timer class="section-icon" />
        <span>最近操作</span>
      </div>
      
      <el-timeline>
        <el-timeline-item
          v-for="(activity, index) in recentActivities"
          :key="index"
          :timestamp="activity.time"
          placement="top"
        >
          <el-card shadow="hover" class="activity-card">
            <strong>{{ activity.action }}</strong>
            <p>{{ activity.desc }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  color: #fff;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.welcome-subtitle {
  font-size: 16px;
  opacity: 0.9;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px 24px;
}

.status-card.offline {
  background: rgba(245, 108, 108, 0.3);
}

.status-info {
  display: flex;
  flex-direction: column;
}

.status-label {
  font-weight: 600;
}

.status-desc {
  font-size: 12px;
  opacity: 0.8;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.section-icon {
  width: 24px;
  height: 24px;
  color: #667eea;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 13px;
  color: #909399;
}

.stats-section {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: scale(1.02);
}

.stat-card.pending {
  background: linear-gradient(135deg, #F56C6C 0%, #E6A23C 100%);
  color: #fff;
}

.stat-card.pending .stat-label {
  color: rgba(255, 255, 255, 0.9);
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 8px;
}

.stat-card.pending .stat-value {
  color: #fff;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.recent-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.activity-card {
  margin-bottom: 0;
}

.activity-card p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #909399;
}

/* 平板适配 */
@media (max-width: 1024px) {
  .welcome-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .welcome-title {
    font-size: 22px;
  }
  
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .quick-actions {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
