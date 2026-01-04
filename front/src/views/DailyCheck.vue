<script setup>
import { ref, reactive, computed } from 'vue'
import { useOfflineStore } from '../stores/offline'
import { ElMessage } from 'element-plus'
import { Plus, Delete, Camera, VideoCamera } from '@element-plus/icons-vue'

const offlineStore = useOfflineStore()

// 当前日期
const today = new Date().toLocaleDateString('zh-CN')

// 工作日志表单
const logForm = reactive({
  date: new Date(),
  threeScenes: {
    production: false,
    workshop: false,
    living: false
  },
  policeEquipment: {
    checked: false,
    count: 0,
    issues: ''
  },
  monitorCheck: {
    checked: false,
    count: 0,
    anomalies: []
  },
  severePrisoners: {
    newCount: 0,
    totalCount: 0
  },
  gangPrisoners: {
    newCount: 0,
    totalCount: 0
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

// 添加监控异常
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
    if (offlineStore.isOnline) {
      // TODO: 调用 API 提交
      ElMessage.success('日志提交成功')
    } else {
      // 离线保存
      await offlineStore.saveFormOffline('daily-log', logForm)
      ElMessage.success('日志已保存到本地，联网后自动同步')
    }
    resetForm()
  } catch (error) {
    ElMessage.error('提交失败: ' + error.message)
  }
}

// 保存草稿
async function saveDraft() {
  try {
    await offlineStore.saveFormOffline('daily-log-draft', logForm)
    ElMessage.success('草稿已保存')
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  }
}

// 重置表单
function resetForm() {
  logForm.threeScenes = { production: false, workshop: false, living: false }
  logForm.policeEquipment = { checked: false, count: 0, issues: '' }
  logForm.monitorCheck = { checked: false, count: 0, anomalies: [] }
  logForm.severePrisoners = { newCount: 0, totalCount: 0 }
  logForm.gangPrisoners = { newCount: 0, totalCount: 0 }
  logForm.notes = ''
  monitorAnomalies.value = []
}

// 计算三大现场完成状态
const threeScenesCompleted = computed(() => {
  const scenes = logForm.threeScenes
  return Object.values(scenes).filter(v => v).length
})
</script>

<template>
  <div class="daily-check-page">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <h3>派驻检察工作日志</h3>
          <span class="date-display">{{ today }}</span>
        </div>
      </template>

      <el-form :model="logForm" label-width="120px" label-position="top">
        <!-- 日期选择 -->
        <el-form-item label="记录日期">
          <el-date-picker
            v-model="logForm.date"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            :disabled-date="(date) => date > new Date()"
          />
        </el-form-item>

        <!-- 三大现场检察 -->
        <el-divider content-position="left">
          <el-tag type="primary">三大现场检察 ({{ threeScenesCompleted }}/3)</el-tag>
        </el-divider>
        
        <el-form-item>
          <div class="scene-checkboxes">
            <el-checkbox v-model="logForm.threeScenes.production" border size="large">
              生产现场
            </el-checkbox>
            <el-checkbox v-model="logForm.threeScenes.workshop" border size="large">
              劳动车间
            </el-checkbox>
            <el-checkbox v-model="logForm.threeScenes.living" border size="large">
              生活区域
            </el-checkbox>
          </div>
        </el-form-item>

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

        <!-- 严管罪犯 -->
        <el-divider content-position="left">
          <el-tag type="danger">严管罪犯情况</el-tag>
        </el-divider>
        
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="新增人数">
              <el-input-number 
                v-model="logForm.severePrisoners.newCount" 
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前总数">
              <el-input-number 
                v-model="logForm.severePrisoners.totalCount" 
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 涉黑罪犯 -->
        <el-divider content-position="left">
          <el-tag type="info">涉黑罪犯情况</el-tag>
        </el-divider>
        
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="新增人数">
              <el-input-number 
                v-model="logForm.gangPrisoners.newCount" 
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前总数">
              <el-input-number 
                v-model="logForm.gangPrisoners.totalCount" 
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 备注 -->
        <el-divider content-position="left">
          <el-tag>其他备注</el-tag>
        </el-divider>
        
        <el-form-item>
          <el-input 
            v-model="logForm.notes" 
            type="textarea"
            placeholder="填写其他需要记录的事项..."
            :rows="4"
          />
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
  </div>
</template>

<style scoped>
.daily-check-page {
  max-width: 900px;
  margin: 0 auto;
}

.form-card {
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

.date-display {
  font-size: 14px;
  color: #909399;
  background: #f5f7fa;
  padding: 6px 12px;
  border-radius: 6px;
}

.scene-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.scene-checkboxes .el-checkbox {
  margin-right: 0;
  padding: 16px 24px;
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
</style>
