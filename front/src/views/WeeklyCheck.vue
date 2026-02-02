<script setup>
import { ref, reactive, computed } from 'vue'
import { useReportStore } from '../stores/report'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Document, User, SuccessFilled, WarningFilled } from '@element-plus/icons-vue'

const reportStore = useReportStore()

// 活动标签页
const activeTab = ref('hospital')

// 日志是否存在
const logExists = ref(false)
const currentLogId = ref(null)

// 获取本地日期字符串（避免时区问题）
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 统一的周检察表单（符合数据库结构）
const weeklyForm = reactive({
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

// 谈话记录对话框
const showTalkDialog = ref(false)
const talkForm = reactive({
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

// 检察重点是否全选
const allFocusAreasChecked = computed(() => {
  const areas = weeklyForm.hospital_check.focusAreas
  return areas.policeEquipment && areas.strictControl && areas.confinement
})

// 添加谈话记录
function addTalkRecord() {
  if (!talkForm.prisonerName || !talkForm.content) {
    ElMessage.warning('请填写罪犯姓名和谈话内容')
    return
  }
  
  weeklyForm.talk_records.push({
    id: Date.now(),
    type: talkForm.type,
    prisonerName: talkForm.prisonerName,
    prisonerId: talkForm.prisonerId,
    date: talkForm.date,
    content: talkForm.content,
    transcriptUploaded: talkForm.transcriptUploaded,
    typeLabel: talkTypes.find(t => t.value === talkForm.type)?.label
  })
  
  resetTalkForm()
  showTalkDialog.value = false
  ElMessage.success('谈话记录已添加')
}

// 删除谈话记录
function removeTalkRecord(index) {
  weeklyForm.talk_records.splice(index, 1)
}

// 重置谈话表单
function resetTalkForm() {
  talkForm.type = 'newPrisoner'
  talkForm.prisonerName = ''
  talkForm.prisonerId = ''
  talkForm.date = getLocalDateString()
  talkForm.content = ''
  talkForm.transcriptUploaded = false
}

// 提交周检察数据
async function submitWeeklyData() {
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    // 如果日志不存在，询问是否创建
    if (!logExists.value) {
      await ElMessageBox.confirm(
        `${weeklyForm.record_date} 还没有日志记录，是否自动创建？`,
        '提示',
        {
          confirmButtonText: '创建并提交',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      // 创建日志
      const logResponse = await fetch(`${API_BASE}/api/daily-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: weeklyForm.record_date,
          otherWork: {
            supervisionSituation: '',
            feedbackSituation: ''
          }
        })
      })
      
      if (!logResponse.ok) {
        throw new Error('创建日志失败')
      }
      
      const logResult = await logResponse.json()
      currentLogId.value = logResult.id
      logExists.value = true
    }
    
    // 保存周检察数据（关联到日志）
    const weeklyData = {
      ...weeklyForm,
      log_id: currentLogId.value,
      log_date: weeklyForm.record_date
    }
    
    const response = await fetch(`${API_BASE}/api/weekly-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(weeklyData)
    })
    
    if (!response.ok) {
      throw new Error('提交失败')
    }
    
    const result = await response.json()
    ElMessage.success('周检察数据提交成功')
    
    // 同步数据到报告 Store
    reportStore.addWeeklyRecord({
      ...weeklyForm,
      id: result.id,
      log_id: currentLogId.value
    })
    
    // 重置表单
    resetForm()
  } catch (error) {
    console.error('提交失败:', error)
    if (error.message !== '用户取消') {
      ElMessage.error('提交失败: ' + error.message)
    }
  }
}

// 重置表单
function resetForm() {
  weeklyForm.record_date = getLocalDateString()
  weeklyForm.week_number = Math.ceil((new Date().getDate()) / 7)
  weeklyForm.hospital_check = {
    checked: false,
    checkDate: getLocalDateString(),
    focusAreas: { policeEquipment: false, strictControl: false, confinement: false },
    hasAnomalies: false,
    anomalyDescription: '',
    attachments: []
  }
  weeklyForm.injury_check = {
    found: false,
    count: 0,
    verified: false,
    anomalyDescription: '',
    transcriptUploaded: false
  }
  weeklyForm.talk_records = []
  weeklyForm.mailbox = {
    opened: false,
    openCount: 0,
    receivedCount: 0,
    valuableClues: false,
    clueDescription: '',
    materialsUploaded: false
  }
  weeklyForm.contraband = {
    checked: false,
    found: false,
    foundCount: 0,
    involvedCount: 0,
    description: '',
    photos: []
  }
  weeklyForm.notes = ''
  
  // 重置日志状态
  logExists.value = false
  currentLogId.value = null
}

// 检查日志是否存在
async function checkLogExists() {
  if (!weeklyForm.record_date) return
  
  try {
    const token = localStorage.getItem('token')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    const response = await fetch(`${API_BASE}/api/daily-logs/check-date/${weeklyForm.record_date}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
</script>

<template>
  <div class="weekly-check-page">
    <!-- 关联日志选择 -->
    <el-card shadow="never" style="margin-bottom: 16px;" class="log-selector-card">
      <el-form label-width="120px">
        <el-form-item label="关联日志日期" required>
          <el-date-picker 
            v-model="weeklyForm.record_date" 
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

    <el-tabs v-model="activeTab" type="border-card" class="weekly-tabs">
      <!-- 医院/禁闭室检察 -->
      <el-tab-pane label="医院/禁闭室" name="hospital">
        <el-card shadow="never">
          <template #header>
            <span>监狱医院与禁闭室检察</span>
          </template>
          
          <el-form :model="weeklyForm.hospital_check" label-width="120px" label-position="top">
            <el-form-item label="检察日期">
              <el-date-picker 
                v-model="weeklyForm.record_date" 
                type="date" 
                style="width: 100%" 
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            
            <el-form-item>
              <el-checkbox v-model="weeklyForm.hospital_check.checked" border size="large">
                已检察监狱医院/禁闭室
              </el-checkbox>
            </el-form-item>
            
            <template v-if="weeklyForm.hospital_check.checked">
              <el-divider content-position="left">检察重点</el-divider>
              
              <el-form-item label="重点检察内容">
                <el-checkbox-group v-model="weeklyForm.hospital_check.focusAreas">
                  <el-checkbox :value="weeklyForm.hospital_check.focusAreas.policeEquipment" 
                               @change="weeklyForm.hospital_check.focusAreas.policeEquipment = $event">
                    警械使用情况
                  </el-checkbox>
                  <el-checkbox :value="weeklyForm.hospital_check.focusAreas.strictControl"
                               @change="weeklyForm.hospital_check.focusAreas.strictControl = $event">
                    严管适用情况
                  </el-checkbox>
                  <el-checkbox :value="weeklyForm.hospital_check.focusAreas.confinement"
                               @change="weeklyForm.hospital_check.focusAreas.confinement = $event">
                    禁闭适用情况
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              
              <el-divider content-position="left">检察结果</el-divider>
              
              <el-form-item label="是否发现异常">
                <el-switch v-model="weeklyForm.hospital_check.hasAnomalies" />
              </el-form-item>
              
              <el-form-item v-if="weeklyForm.hospital_check.hasAnomalies" label="异常说明">
                <el-input 
                  v-model="weeklyForm.hospital_check.anomalyDescription" 
                  type="textarea" 
                  :rows="3"
                  placeholder="请详细描述发现的异常情况..."
                />
              </el-form-item>
              
              <el-form-item label="相关附件（照片/视频）">
                <el-upload
                  action="#"
                  :auto-upload="false"
                  list-type="picture-card"
                  :limit="10"
                  accept=".jpg,.jpeg,.png,.mp4,.mov"
                >
                  <el-icon><Plus /></el-icon>
                  <template #tip>
                    <div class="el-upload__tip">支持照片、视频格式</div>
                  </template>
                </el-upload>
              </el-form-item>
            </template>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 外伤检察 -->
      <el-tab-pane label="外伤检察" name="injury">
        <el-card shadow="never">
          <template #header>
            <span>罪犯外伤检察（工伤除外）</span>
          </template>
          
          <el-form :model="weeklyForm.injury_check" label-width="120px" label-position="top">
            <el-form-item label="本周是否发现外伤">
              <el-switch v-model="weeklyForm.injury_check.found" />
            </el-form-item>
            
            <template v-if="weeklyForm.injury_check.found">
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="外伤罪犯人次">
                    <el-input-number 
                      v-model="weeklyForm.injury_check.count" 
                      :min="0" 
                      style="width: 100%" 
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="是否逐一核实">
                    <el-switch v-model="weeklyForm.injury_check.verified" />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item label="外伤情况描述">
                <el-input 
                  v-model="weeklyForm.injury_check.anomalyDescription" 
                  type="textarea" 
                  :rows="4"
                  placeholder="描述发现的外伤情况，受伤原因、处理方式等..."
                />
              </el-form-item>
              
              <el-form-item label="是否上传谈话笔录">
                <el-switch v-model="weeklyForm.injury_check.transcriptUploaded" />
              </el-form-item>
              
              <el-form-item label="相关附件（照片/医疗报告）">
                <el-upload
                  action="#"
                  :auto-upload="false"
                  list-type="picture-card"
                  :limit="10"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                >
                  <el-icon><Plus /></el-icon>
                  <template #tip>
                    <div class="el-upload__tip">支持照片、PDF、Word 格式</div>
                  </template>
                </el-upload>
              </el-form-item>
            </template>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 罪犯谈话 -->
      <el-tab-pane label="罪犯谈话" name="talk">
        <el-card shadow="never">
          <template #header>
            <div class="card-header-flex">
              <span>罪犯谈话记录</span>
              <el-button type="primary" :icon="Plus" @click="showTalkDialog = true">
                添加谈话
              </el-button>
            </div>
          </template>
          
          <div v-if="weeklyForm.talk_records.length === 0" class="empty-state">
            <el-empty description="暂无谈话记录" />
          </div>
          
          <div v-else class="talk-list">
            <el-card 
              v-for="(record, index) in weeklyForm.talk_records" 
              :key="record.id"
              class="talk-card"
              shadow="hover"
            >
              <div class="talk-header">
                <el-tag :type="record.type === 'newPrisoner' ? 'primary' : 
                              record.type === 'release' ? 'success' : 
                              record.type === 'injury' ? 'warning' : 'danger'">
                  {{ record.typeLabel }}
                </el-tag>
                <span class="talk-name">
                  <el-icon><User /></el-icon>
                  {{ record.prisonerName }}
                </span>
                <span class="talk-id" v-if="record.prisonerId">编号: {{ record.prisonerId }}</span>
                <el-button type="danger" text @click="removeTalkRecord(index)">删除</el-button>
              </div>
              <p class="talk-content">{{ record.content }}</p>
              <div class="talk-footer">
                <span>{{ record.date }}</span>
                <el-tag v-if="record.transcriptUploaded" type="info" size="small">
                  <el-icon><Document /></el-icon> 已上传笔录
                </el-tag>
              </div>
            </el-card>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 检察官信箱 -->
      <el-tab-pane label="检察官信箱" name="mailbox">
        <el-card shadow="never">
          <template #header>
            <span>检察官信箱</span>
          </template>
          
          <el-form :model="weeklyForm.mailbox" label-width="140px">
            <el-form-item label="是否开启检察官信箱">
              <el-switch v-model="weeklyForm.mailbox.opened" />
            </el-form-item>
            
            <template v-if="weeklyForm.mailbox.opened">
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="开启次数">
                    <el-input-number 
                      v-model="weeklyForm.mailbox.openCount" 
                      :min="0" 
                      style="width: 100%" 
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="收到信件数">
                    <el-input-number 
                      v-model="weeklyForm.mailbox.receivedCount" 
                      :min="0" 
                      style="width: 100%" 
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item label="是否发现有价值线索">
                <el-switch v-model="weeklyForm.mailbox.valuableClues" />
              </el-form-item>
              
              <el-form-item v-if="weeklyForm.mailbox.valuableClues" label="线索简要描述">
                <el-input 
                  v-model="weeklyForm.mailbox.clueDescription"
                  type="textarea" 
                  :rows="4"
                  placeholder="记录检察官信箱中收到的案件线索..."
                />
              </el-form-item>
              
              <el-form-item v-if="weeklyForm.mailbox.valuableClues" label="是否上传材料">
                <el-switch v-model="weeklyForm.mailbox.materialsUploaded" />
              </el-form-item>
            </template>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 违禁品排查 -->
      <el-tab-pane label="违禁品排查" name="contraband">
        <el-card shadow="never">
          <template #header>
            <span>罪犯违禁品排查</span>
          </template>
          
          <el-form :model="weeklyForm.contraband" label-width="120px">
            <el-form-item>
              <el-checkbox v-model="weeklyForm.contraband.checked" border size="large">
                已进行违禁品排查
              </el-checkbox>
            </el-form-item>
            
            <template v-if="weeklyForm.contraband.checked">
              <el-form-item label="是否发现违禁品">
                <el-switch v-model="weeklyForm.contraband.found" />
              </el-form-item>
              
              <template v-if="weeklyForm.contraband.found">
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item label="发现次数">
                      <el-input-number 
                        v-model="weeklyForm.contraband.foundCount" 
                        :min="0" 
                        style="width: 100%" 
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="涉及人数">
                      <el-input-number 
                        v-model="weeklyForm.contraband.involvedCount" 
                        :min="0" 
                        style="width: 100%" 
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-form-item label="简要情况说明">
                  <el-input 
                    v-model="weeklyForm.contraband.description"
                    type="textarea" 
                    :rows="3"
                    placeholder="如有发现违禁品，请详细描述..."
                  />
                </el-form-item>
                
                <el-form-item label="违禁品照片">
                  <el-upload
                    action="#"
                    :auto-upload="false"
                    list-type="picture-card"
                    :limit="10"
                    class="contraband-upload"
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
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 提交按钮 -->
    <div class="submit-section">
      <el-button type="primary" size="large" @click="submitWeeklyData">
        提交本周检察数据
      </el-button>
    </div>

    <!-- 谈话记录对话框 -->
    <el-dialog 
      v-model="showTalkDialog" 
      title="添加罪犯谈话记录"
      width="600px"
    >
      <el-form :model="talkForm" label-width="100px">
        <el-form-item label="谈话类型" required>
          <el-radio-group v-model="talkForm.type">
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
              <el-input v-model="talkForm.prisonerName" placeholder="输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="罪犯编号">
              <el-input v-model="talkForm.prisonerId" placeholder="输入编号" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="谈话日期">
          <el-date-picker 
            v-model="talkForm.date" 
            type="date" 
            style="width: 100%" 
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="谈话内容" required>
          <el-input 
            v-model="talkForm.content" 
            type="textarea" 
            :rows="4"
            placeholder="记录谈话要点..."
          />
        </el-form-item>
        
        <el-form-item label="是否上传笔录">
          <el-switch v-model="talkForm.transcriptUploaded" />
        </el-form-item>
        
        <el-form-item v-if="talkForm.transcriptUploaded" label="谈话笔录">
          <el-upload
            action="#"
            :auto-upload="false"
            :limit="1"
            accept=".pdf,.doc,.docx"
          >
            <el-button type="primary">上传笔录扫描件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 PDF、Word 格式</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showTalkDialog = false">取消</el-button>
        <el-button type="primary" @click="addTalkRecord">确定添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.weekly-check-page {
  max-width: 1000px;
  margin: 0 auto;
}

.log-selector-card {
  border-left: 4px solid #409EFF;
}

.weekly-tabs {
  border-radius: 12px;
  overflow: hidden;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  padding: 40px 0;
}

.talk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.talk-card {
  border-left: 4px solid #409EFF;
}

.talk-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.talk-name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.talk-id {
  color: #909399;
  font-size: 13px;
  flex: 1;
}

.talk-content {
  color: #606266;
  margin: 8px 0;
  line-height: 1.6;
}

.talk-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.contraband-upload {
  margin-top: 12px;
}

.submit-section {
  margin-top: 24px;
  text-align: center;
}

.submit-section .el-button {
  min-width: 200px;
}

/* 平板适配 */
@media (max-width: 1024px) {
  .talk-header {
    flex-wrap: wrap;
  }
}
</style>
