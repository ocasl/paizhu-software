<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useReportStore } from '../stores/report'
import { ElMessage, ElMessageBox } from 'element-plus'
import { SuccessFilled, WarningFilled } from '@element-plus/icons-vue'

const reportStore = useReportStore()

// 日志关联状态
const logExists = ref(false)
const currentLogId = ref(null)

// 活动标签页
const activeTab = ref('visit')

// 获取本地日期字符串（避免时区问题）
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 统一的月检察表单（符合数据库结构）
const monthlyForm = reactive({
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

// 初始化时设置当前月份
onMounted(() => {
  const now = new Date()
  monthlyForm.record_month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  checkLogExists()
})

// 检查日志是否存在
async function checkLogExists() {
  if (!monthlyForm.record_date) return
  
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    const response = await fetch(`${API_BASE}/api/daily-logs/check-date/${monthlyForm.record_date}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (response.ok) {
      const result = await response.json()
      logExists.value = result.exists
      currentLogId.value = result.log?.id || null
    }
  } catch (error) {
    console.error('检查日志失败:', error)
  }
}

// 会议类型选项
const meetingTypes = [
  { value: 'lifeSentence', label: '无期死缓评审会' },
  { value: 'parole', label: '减刑假释评审会' },
  { value: 'analysis', label: '犯情分析会' },
  { value: 'other', label: '其他会议' }
]

// 角色选项
const roleOptions = [
  { value: 'listener', label: '列席' },
  { value: 'speaker', label: '发言' },
  { value: 'advisor', label: '提出意见' }
]

// 自动计算增减人数
const autoCalculateChange = computed(() => {
  const start = monthlyForm.position_stats.startCount
  const end = monthlyForm.position_stats.endCount
  if (start > 0 && end > 0) {
    const diff = end - start
    if (diff > 0) {
      monthlyForm.position_stats.increase = diff
      monthlyForm.position_stats.decrease = 0
    } else if (diff < 0) {
      monthlyForm.position_stats.increase = 0
      monthlyForm.position_stats.decrease = Math.abs(diff)
    } else {
      monthlyForm.position_stats.increase = 0
      monthlyForm.position_stats.decrease = 0
    }
  }
  return true
})

// 提交月检察数据
async function submitMonthlyData() {
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    // 如果日志不存在，先创建日志
    if (!logExists.value) {
      await ElMessageBox.confirm(
        `${monthlyForm.record_date} 还没有日志记录，是否自动创建？`,
        '提示',
        { type: 'warning' }
      )
      
      // 创建日志
      const logResponse = await fetch(`${API_BASE}/api/daily-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          log_date: monthlyForm.record_date,
          weather: '晴',
          temperature: 20,
          on_duty_officer: localStorage.getItem('username') || '检察官',
          daily_summary: '月检察记录自动创建'
        })
      })
      
      if (logResponse.ok) {
        const logResult = await logResponse.json()
        currentLogId.value = logResult.data.id
        logExists.value = true
        ElMessage.success('日志创建成功')
      } else {
        throw new Error('创建日志失败')
      }
    }
    
    // 准备提交数据，关联日志
    const submitData = {
      ...monthlyForm,
      log_id: currentLogId.value,
      log_date: monthlyForm.record_date
    }
    
    // 调用后端API
    const response = await fetch(`${API_BASE}/api/monthly-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(submitData)
    })
    
    if (!response.ok) {
      throw new Error('提交失败')
    }
    
    const result = await response.json()
    ElMessage.success('月检察数据提交成功')
    
    // 同步数据到报告 Store
    reportStore.addMonthlyRecord({
      ...submitData,
      id: result.id
    })
    
    // 重置表单
    resetForm()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败: ' + error.message)
  }
}

// 重置表单
function resetForm() {
  const now = new Date()
  monthlyForm.record_month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  monthlyForm.record_date = getLocalDateString()
  monthlyForm.visit_check = {
    checked: false,
    visitCount: 0,
    issuesFound: false,
    description: ''
  }
  monthlyForm.meeting = {
    participated: false,
    meetingType: 'analysis',
    count: 1,
    role: 'listener',
    notes: ''
  }
  monthlyForm.punishment = {
    exists: false,
    recordCount: 0,
    confinementCount: 0,
    supervised: true,
    evidenceUploaded: false,
    reason: ''
  }
  monthlyForm.position_stats = {
    startCount: 0,
    endCount: 0,
    increase: 0,
    decrease: 0,
    reason: ''
  }
  monthlyForm.notes = ''
}
</script>

<template>
  <div class="monthly-check-page">
    <!-- 关联日志选择 -->
    <el-card shadow="never" style="margin-bottom: 16px;" class="log-selector-card">
      <el-form label-width="120px">
        <el-form-item label="关联日志日期" required>
          <el-date-picker 
            v-model="monthlyForm.record_date" 
            type="date" 
            placeholder="选择要关联的日志日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
            @change="checkLogExists"
          />
          <div style="margin-top: 8px;">
            <el-text v-if="logExists" type="success" size="small">
              <el-icon><SuccessFilled /></el-icon> 该日期已有日志记录
            </el-text>
            <el-text v-else type="warning" size="small">
              <el-icon><WarningFilled /></el-icon> 该日期还没有日志记录，提交时将自动创建
            </el-text>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-tabs v-model="activeTab" type="border-card" class="monthly-tabs">
      <!-- 会见检察 -->
      <el-tab-pane label="会见检察" name="visit">
        <el-card shadow="never">
          <template #header>
            <span>监狱会见场所检察</span>
          </template>
          
          <el-form :model="monthlyForm.visit_check" label-width="140px" label-position="top">
            <el-form-item label="记录月份">
              <el-date-picker 
                v-model="monthlyForm.record_month" 
                type="month" 
                style="width: 100%" 
                value-format="YYYY-MM"
                format="YYYY年MM月"
              />
            </el-form-item>
            
            <el-form-item label="是否开展检察">
              <el-switch v-model="monthlyForm.visit_check.checked" />
            </el-form-item>
            
            <template v-if="monthlyForm.visit_check.checked">
              <el-form-item label="检察次数">
                <el-input-number 
                  v-model="monthlyForm.visit_check.visitCount" 
                  :min="0" 
                  style="width: 100%" 
                />
              </el-form-item>
              
              <el-form-item label="是否发现问题">
                <el-switch v-model="monthlyForm.visit_check.issuesFound" />
              </el-form-item>
              
              <el-form-item v-if="monthlyForm.visit_check.issuesFound" label="简要说明">
                <el-input 
                  v-model="monthlyForm.visit_check.description" 
                  type="textarea" 
                  :rows="3"
                  placeholder="详细描述发现的问题..."
                />
              </el-form-item>
            </template>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 犯情分析会 -->
      <el-tab-pane label="会议参加" name="meeting">
        <el-card shadow="never">
          <template #header>
            <span>参加监狱会议/活动</span>
          </template>
          
          <el-form :model="monthlyForm.meeting" label-width="120px" label-position="top">
            <el-form-item label="是否参加">
              <el-switch v-model="monthlyForm.meeting.participated" />
            </el-form-item>
            
            <template v-if="monthlyForm.meeting.participated">
              <el-form-item label="会议类型">
                <el-select v-model="monthlyForm.meeting.meetingType" style="width: 100%">
                  <el-option 
                    v-for="type in meetingTypes" 
                    :key="type.value" 
                    :label="type.label" 
                    :value="type.value" 
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="参加次数">
                <el-input-number 
                  v-model="monthlyForm.meeting.count" 
                  :min="0" 
                  style="width: 100%" 
                />
              </el-form-item>
              
              <el-form-item label="角色">
                <el-radio-group v-model="monthlyForm.meeting.role">
                  <el-radio 
                    v-for="role in roleOptions" 
                    :key="role.value" 
                    :value="role.value"
                  >
                    {{ role.label }}
                  </el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item label="会议记录">
                <el-input 
                  v-model="monthlyForm.meeting.notes" 
                  type="textarea" 
                  :rows="4"
                  placeholder="记录会议要点..."
                />
              </el-form-item>
            </template>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 罪犯处分 -->
      <el-tab-pane label="处分监督" name="punishment">
        <el-card shadow="never">
          <template #header>
            <span>罪犯记过以上处分监督</span>
          </template>
          
          <el-form :model="monthlyForm.punishment" label-width="140px">
            <el-form-item label="本月是否存在处分">
              <el-switch v-model="monthlyForm.punishment.exists" />
            </el-form-item>
            
            <template v-if="monthlyForm.punishment.exists">
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="记过处分人数">
                    <el-input-number 
                      v-model="monthlyForm.punishment.recordCount" 
                      :min="0" 
                      style="width: 100%" 
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="禁闭处分人数">
                    <el-input-number 
                      v-model="monthlyForm.punishment.confinementCount" 
                      :min="0" 
                      style="width: 100%" 
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item label="是否监督到位">
                <el-switch v-model="monthlyForm.punishment.supervised" />
              </el-form-item>
              
              <el-form-item label="处分原因">
                <el-input 
                  v-model="monthlyForm.punishment.reason"
                  type="textarea" 
                  :rows="3"
                  placeholder="记录主要处分原因..."
                />
              </el-form-item>
              
              <el-form-item label="是否上传证据">
                <el-switch v-model="monthlyForm.punishment.evidenceUploaded" />
              </el-form-item>
              
              <el-form-item v-if="monthlyForm.punishment.evidenceUploaded" label="证据材料">
                <el-upload
                  action="#"
                  :auto-upload="false"
                  :limit="10"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                >
                  <el-button type="primary">上传证据/笔录</el-button>
                  <template #tip>
                    <div class="el-upload__tip">支持 PDF、Word、图片格式</div>
                  </template>
                </el-upload>
              </el-form-item>
            </template>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 岗位统计 -->
      <el-tab-pane label="岗位统计" name="position">
        <el-card shadow="never">
          <template #header>
            <span>狱内勤杂/辅助生产岗位罪犯增减情况</span>
          </template>
          
          <el-form :model="monthlyForm.position_stats" label-width="140px">
            <el-alert 
              title="提示：填写月初和月末人数后，系统会自动计算增减人数" 
              type="info" 
              :closable="false"
              style="margin-bottom: 20px"
            />
            
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="月初人数">
                  <el-input-number 
                    v-model="monthlyForm.position_stats.startCount" 
                    :min="0" 
                    style="width: 100%" 
                    @change="autoCalculateChange"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="月末人数">
                  <el-input-number 
                    v-model="monthlyForm.position_stats.endCount" 
                    :min="0" 
                    style="width: 100%" 
                    @change="autoCalculateChange"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-divider content-position="left">增减情况（自动计算）</el-divider>
            
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="增加人数">
                  <el-input-number 
                    v-model="monthlyForm.position_stats.increase" 
                    :min="0" 
                    style="width: 100%" 
                    :disabled="true"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="减少人数">
                  <el-input-number 
                    v-model="monthlyForm.position_stats.decrease" 
                    :min="0" 
                    style="width: 100%" 
                    :disabled="true"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="变动原因（选填）">
              <el-input 
                v-model="monthlyForm.position_stats.reason"
                type="textarea" 
                :rows="3"
                placeholder="如：新增2名勤杂工，减少1名辅助生产人员..."
              />
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 提交按钮 -->
    <div class="submit-section">
      <el-button type="primary" size="large" @click="submitMonthlyData">
        提交本月检察数据
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.monthly-check-page {
  max-width: 1000px;
  margin: 0 auto;
}

.monthly-tabs {
  border-radius: 12px;
  overflow: hidden;
}

.submit-section {
  margin-top: 24px;
  text-align: center;
}

.submit-section .el-button {
  min-width: 200px;
}
</style>
