<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Document, 
  Download, 
  Printer, 
  Edit, 
  Check, 
  Warning,
  Folder 
} from '@element-plus/icons-vue'

// 当前月份
const currentMonth = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })

// 报告数据 (模拟从服务端获取)
const reportData = reactive({
  month: currentMonth,
  status: 'draft', // draft, pending, complete
  
  // 一、基本情况
  basicInfo: {
    totalPrisoners: 1250,
    majorCriminals: 85,
    deathSentence: 12,
    lifeSentence: 45,
    repeatOffenders: 156,
    foreignPrisoners: 3,
    hkMacaoTaiwan: 2,
    mentalIllness: 18,
    formerOfficials: 5,
    formerCountyLevel: 8,
    falunGong: 2,
    drugHistory: 234,
    drugCrimes: 189,
    newAdmissions: 32,
    minorFemales: 0,
    gangRelated: 28,
    evilForces: 15,
    endangeringSafety: 6,
    recordedPunishments: 8,
    recordedPunishmentsReason: '违反监规纪律',
    confinementPunishments: 3,
    confinementReason: '严重违规'
  },
  
  // 二、执法检察
  lawEnforcement: {
    paroleBatches: '2批',
    paroleCount: 45,
    paroleStage: '公示阶段',
    correctionNotices: 2,
    correctionIssues: '减刑材料不完整',
    threeSceneChecks: 62,
    keyLocationChecks: 15,
    visitChecks: 8,
    visitIllegalCount: 1
  },
  
  // 三、安全防范
  security: {
    monitorChecks: 124,
    issuesFound: 3
  },
  
  // 四、个别谈话
  interviews: {
    totalTalks: 48,
    newAdmissionTalks: 32,
    evilForcesTalks: 8,
    injuryTalks: 5,
    confinementTalks: 3,
    questionnaireCount: 28
  },
  
  // 五、会议活动
  meetings: {
    lifeSentenceReviews: 1,
    paroleReviews: 2,
    analysissMeetings: 4,
    otherActivities: '监狱安全大检查'
  },
  
  // 六、其他工作
  otherWork: {
    mailboxOpens: 4,
    lettersReceived: 12
  }
})

// 待补充字段
const pendingFields = computed(() => {
  const fields = []
  if (!reportData.lawEnforcement.correctionIssues) {
    fields.push({ key: 'correctionIssues', label: '纠正违法问题描述' })
  }
  if (!reportData.meetings.otherActivities) {
    fields.push({ key: 'otherActivities', label: '参加活动名称' })
  }
  return fields
})

// 编辑模式
const isEditing = ref(false)

// 生成报告
function generateReport() {
  if (pendingFields.value.length > 0) {
    ElMessage.warning('请先补充待填写字段')
    return
  }
  
  reportData.status = 'complete'
  ElMessage.success('报告生成成功！')
}

// 下载报告
function downloadReport() {
  // TODO: 调用后端生成 Word 文档
  ElMessage.success('报告下载中...')
}

// 打印报告
function printReport() {
  window.print()
}

// 一键归档
function archiveReport() {
  ElMessage.success('报告已归档')
}
</script>

<template>
  <div class="report-preview-page">
    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="report-status">
        <el-tag :type="reportData.status === 'complete' ? 'success' : 'warning'" size="large">
          {{ reportData.status === 'complete' ? '已完成' : '草稿' }}
        </el-tag>
        <h2>{{ reportData.month }} 月度工作情况报告</h2>
      </div>
      
      <div class="action-buttons">
        <el-button :icon="Edit" @click="isEditing = !isEditing">
          {{ isEditing ? '完成编辑' : '编辑数据' }}
        </el-button>
        <el-button type="primary" :icon="Check" @click="generateReport">生成报告</el-button>
        <el-button type="success" :icon="Download" @click="downloadReport">下载 Word</el-button>
        <el-button :icon="Printer" @click="printReport">打印</el-button>
        <el-button :icon="Folder" @click="archiveReport">一键归档</el-button>
      </div>
    </div>

    <!-- 待补充提示 -->
    <el-alert
      v-if="pendingFields.length > 0"
      type="warning"
      show-icon
      :closable="false"
      class="pending-alert"
    >
      <template #title>
        <span>有 {{ pendingFields.length }} 个字段待补充：</span>
        <el-tag v-for="field in pendingFields" :key="field.key" type="warning" size="small" class="pending-tag">
          {{ field.label }}
        </el-tag>
      </template>
    </el-alert>

    <!-- 报告预览 -->
    <el-card class="report-card">
      <div class="report-content">
        <h1 class="report-title">派驻检察室月度工作情况报告</h1>
        <p class="report-period">（{{ reportData.month }}）</p>

        <!-- 一、基本情况 -->
        <section class="report-section">
          <h2>一、本月基本情况</h2>
          <div class="data-grid">
            <div class="data-item">
              <span class="label">在押罪犯总数</span>
              <el-input-number v-if="isEditing" v-model="reportData.basicInfo.totalPrisoners" :min="0" size="small" />
              <span v-else class="value">{{ reportData.basicInfo.totalPrisoners }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">重大刑事犯</span>
              <span class="value">{{ reportData.basicInfo.majorCriminals }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">死缓犯</span>
              <span class="value">{{ reportData.basicInfo.deathSentence }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">无期犯</span>
              <span class="value">{{ reportData.basicInfo.lifeSentence }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">涉黑罪犯</span>
              <span class="value">{{ reportData.basicInfo.gangRelated }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">涉恶罪犯</span>
              <span class="value">{{ reportData.basicInfo.evilForces }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">新收押罪犯</span>
              <span class="value">{{ reportData.basicInfo.newAdmissions }} 人</span>
            </div>
            <div class="data-item">
              <span class="label">涉毒犯</span>
              <span class="value">{{ reportData.basicInfo.drugCrimes }} 人</span>
            </div>
          </div>
          
          <div class="punishment-section">
            <p>
              <strong>记过处分：</strong>{{ reportData.basicInfo.recordedPunishments }} 人，
              原因：{{ reportData.basicInfo.recordedPunishmentsReason }}
            </p>
            <p>
              <strong>禁闭处分：</strong>{{ reportData.basicInfo.confinementPunishments }} 人，
              原因：{{ reportData.basicInfo.confinementReason }}
            </p>
          </div>
        </section>

        <!-- 二、执法检察 -->
        <section class="report-section">
          <h2>二、执法检察情况</h2>
          <p>
            <strong>减刑审查：</strong>{{ reportData.lawEnforcement.paroleBatches }}，
            共 {{ reportData.lawEnforcement.paroleCount }} 人，
            当前处于{{ reportData.lawEnforcement.paroleStage }}。
          </p>
          <p>
            <strong>纠正违法通知书：</strong>{{ reportData.lawEnforcement.correctionNotices }} 份。
            <template v-if="isEditing || reportData.lawEnforcement.correctionIssues">
              问题描述：
              <el-input 
                v-if="isEditing" 
                v-model="reportData.lawEnforcement.correctionIssues" 
                placeholder="填写发现的问题"
                style="width: 300px"
              />
              <span v-else>{{ reportData.lawEnforcement.correctionIssues }}</span>
            </template>
            <el-tag v-else type="warning" size="small">待填写</el-tag>
          </p>
          <p>
            <strong>三大现场检察：</strong>{{ reportData.lawEnforcement.threeSceneChecks }} 次
          </p>
          <p>
            <strong>重点场所检察：</strong>{{ reportData.lawEnforcement.keyLocationChecks }} 次
          </p>
          <p>
            <strong>会见检察：</strong>{{ reportData.lawEnforcement.visitChecks }} 次，
            发现违法问题 {{ reportData.lawEnforcement.visitIllegalCount }} 个
          </p>
        </section>

        <!-- 三、安全防范 -->
        <section class="report-section">
          <h2>三、安全防范检察</h2>
          <p>
            <strong>监控检察：</strong>{{ reportData.security.monitorChecks }} 次，
            发现问题 {{ reportData.security.issuesFound }} 个
          </p>
        </section>

        <!-- 四、个别谈话 -->
        <section class="report-section">
          <h2>四、个别罪犯谈话情况</h2>
          <p>
            <strong>个别教育谈话总数：</strong>{{ reportData.interviews.totalTalks }} 人次
          </p>
          <ul class="talk-breakdown">
            <li>新收押罪犯谈话：{{ reportData.interviews.newAdmissionTalks }} 人</li>
            <li>涉恶罪犯谈话：{{ reportData.interviews.evilForcesTalks }} 人</li>
            <li>外伤罪犯谈话：{{ reportData.interviews.injuryTalks }} 人</li>
            <li>禁闭罪犯谈话：{{ reportData.interviews.confinementTalks }} 人</li>
          </ul>
          <p>
            <strong>出监问卷调查表：</strong>{{ reportData.interviews.questionnaireCount }} 份
          </p>
        </section>

        <!-- 五、会议活动 -->
        <section class="report-section">
          <h2>五、参加会议/活动情况</h2>
          <p>无期死缓评审会：{{ reportData.meetings.lifeSentenceReviews }} 次</p>
          <p>减刑假释评审会：{{ reportData.meetings.paroleReviews }} 次</p>
          <p>犯情分析会：{{ reportData.meetings.analysissMeetings }} 次</p>
          <p>
            <strong>其他活动：</strong>
            <el-input 
              v-if="isEditing" 
              v-model="reportData.meetings.otherActivities" 
              placeholder="填写参加的活动名称"
              style="width: 300px"
            />
            <span v-else-if="reportData.meetings.otherActivities">{{ reportData.meetings.otherActivities }}</span>
            <el-tag v-else type="warning" size="small">待填写</el-tag>
          </p>
        </section>

        <!-- 六、其他工作 -->
        <section class="report-section">
          <h2>六、其他工作情况</h2>
          <p>开启检察官信箱：{{ reportData.otherWork.mailboxOpens }} 次</p>
          <p>收到信件：{{ reportData.otherWork.lettersReceived }} 封</p>
        </section>
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

/* 打印样式 */
@media print {
  .action-bar,
  .pending-alert {
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
